import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useSupabaseSession } from "@/hooks/use-supabase-session";
import { Link } from "@tanstack/react-router";
import { toast } from "sonner";
import {
  Loader2,
  Wallet,
  Clock,
  ArrowUpRight,
  CheckCircle2,
  XCircle,
  Ban,
  AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  cancelWithdrawal,
  createWithdrawal,
  getFinanceOverview,
  type FinanceOverview,
  type PayoutMethod,
  type WithdrawalRow,
} from "@/lib/finance.functions";

const MIN_WITHDRAWAL = 5000;

function fcfa(value: number) {
  return `${Math.round(value).toLocaleString("fr-FR")} FCFA`;
}

function dateFr(value: string) {
  return new Date(value).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const STATUS_META: Record<
  string,
  { label: string; className: string; icon: typeof Clock }
> = {
  pending: { label: "En cours", className: "text-warning", icon: Clock },
  processing: { label: "En traitement", className: "text-warning", icon: Loader2 },
  completed: { label: "Validé", className: "text-primary", icon: CheckCircle2 },
  failed: { label: "Échec", className: "text-destructive", icon: XCircle },
  rejected: { label: "Refusé", className: "text-destructive", icon: Ban },
  cancelled: { label: "Annulé", className: "text-muted-foreground", icon: Ban },
};

function StatusBadge({ status }: { status: string }) {
  const meta = STATUS_META[status] ?? {
    label: status,
    className: "text-muted-foreground",
    icon: Clock,
  };
  const Icon = meta.icon;
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${meta.className}`}>
      <Icon className="h-3.5 w-3.5" /> {meta.label}
    </span>
  );
}

export function FinancePanel() {
  const fetchOverview = useServerFn(getFinanceOverview);
  const queryClient = useQueryClient();

  const isAuthenticated = useSupabaseSession();

  const query = useQuery<FinanceOverview>({
    queryKey: ["finance-overview"],
    queryFn: () => fetchOverview(),
    enabled: isAuthenticated === true,
    retry: false,
    refetchInterval: 30_000,
  });

  if (isAuthenticated === null || (isAuthenticated && query.isLoading)) {
    return (
      <div className="surface-card flex items-center gap-3 rounded-2xl p-6 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" /> Chargement du tableau de bord financier…
      </div>
    );
  }

  if (!isAuthenticated || query.isError) {
    return (
      <div className="surface-card rounded-2xl p-6">
        <h2 className="flex items-center gap-2 font-display text-lg font-semibold">
          <AlertTriangle className="h-4 w-4 text-warning" /> Connexion requise
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Connectez-vous à votre compte développeur pour consulter vos soldes, votre historique et
          vos retraits.
        </p>
        <Button asChild variant="hero" className="mt-4">
          <Link to="/auth">Se connecter</Link>
        </Button>
      </div>
    );
  }

  const data = query.data!;

  if (!data.hasDeveloperProfile) {
    return (
      <div className="surface-card rounded-2xl p-6">
        <h2 className="font-display text-lg font-semibold">Aucun profil développeur</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Votre compte n'a pas encore d'espace développeur. Créez-en un pour publier des
          applications et encaisser vos revenus.
        </p>
      </div>
    );
  }

  const refresh = () => queryClient.invalidateQueries({ queryKey: ["finance-overview"] });

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <BalanceCard label="En attente" value={data.balances.pending} icon={Clock} />
        <BalanceCard label="Disponible" value={data.balances.available} icon={Wallet} highlight />
        <BalanceCard label="En retrait" value={data.balances.withdrawing} icon={ArrowUpRight} />
        <BalanceCard label="Retiré" value={data.balances.withdrawn} icon={CheckCircle2} />
      </div>

      <div className="grid gap-4 lg:grid-cols-[360px_1fr]">
        <WithdrawForm
          available={data.balances.available}
          methods={data.payoutMethods}
          pending={data.withdrawals.some((w) => w.status === "pending" || w.status === "processing")}
          onDone={refresh}
        />

        <div className="space-y-4">
          <WithdrawalsList withdrawals={data.withdrawals} onDone={refresh} />
          <LedgerTable data={data} />
        </div>
      </div>
    </div>
  );
}

function BalanceCard({
  label,
  value,
  icon: Icon,
  highlight,
}: {
  label: string;
  value: number;
  icon: typeof Wallet;
  highlight?: boolean;
}) {
  return (
    <div className={`surface-card rounded-2xl p-4 ${highlight ? "border-primary/50" : ""}`}>
      <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Icon className="h-3.5 w-3.5" /> {label}
      </p>
      <p className="mt-2 font-display text-xl font-semibold">{fcfa(value)}</p>
    </div>
  );
}

function WithdrawForm({
  available,
  methods,
  pending,
  onDone,
}: {
  available: number;
  methods: PayoutMethod[];
  pending: boolean;
  onDone: () => void;
}) {
  const [amount, setAmount] = useState(String(Math.max(MIN_WITHDRAWAL, 0)));
  const [methodCode, setMethodCode] = useState(methods[0]?.code ?? "");
  const [destination, setDestination] = useState("");
  const submit = useServerFn(createWithdrawal);

  const method = methods.find((m) => m.code === methodCode) ?? methods[0];
  const value = Number(amount.replace(/\D/g, "")) || 0;
  const minimum = Math.max(MIN_WITHDRAWAL, method?.min_amount_fcfa ?? MIN_WITHDRAWAL);
  const fee = method ? Math.round(value * Number(method.fee_percent)) + method.fee_fixed_fcfa : 0;
  const net = Math.max(0, value - fee);

  const error = useMemo(() => {
    if (!method) return "Aucun moyen de paiement disponible.";
    if (value < minimum) return `Minimum ${fcfa(minimum)}.`;
    if (value > available) return `Solde disponible insuffisant (${fcfa(available)}).`;
    if (net <= 0) return "Les frais dépassent le montant demandé.";
    if (destination.trim().length < 4)
      return method.kind === "bank" ? "IBAN / numéro de compte requis." : "Numéro mobile money requis.";
    return null;
  }, [method, value, minimum, available, net, destination]);

  const mutation = useMutation({
    mutationFn: () =>
      submit({
        data: { amount: value, payoutMethodCode: methodCode, destination: destination.trim() },
      }),
    onSuccess: (result) => {
      if (result.ok) {
        toast.success(`Demande de retrait ${String(result["reference"] ?? "")} envoyée`);
        setDestination("");
        onDone();
        return;
      }
      const messages: Record<string, string> = {
        AMOUNT_BELOW_MINIMUM: `Montant inférieur au minimum (${fcfa(Number(result["minimum"] ?? minimum))}).`,
        INSUFFICIENT_BALANCE: `Solde disponible insuffisant (${fcfa(Number(result["available"] ?? available))}).`,
        WITHDRAWAL_ALREADY_PENDING: "Une demande de retrait est déjà en cours.",
        FEES_EXCEED_AMOUNT: "Les frais dépassent le montant demandé.",
        REQUEST_FAILED: "La demande a échoué, réessayez plus tard.",
      };
      toast.error(messages[String(result.code)] ?? "Demande de retrait refusée.");
    },
    onError: () => toast.error("Session expirée — reconnectez-vous."),
  });

  return (
    <form
      className="surface-card space-y-4 rounded-2xl p-5"
      onSubmit={(e) => {
        e.preventDefault();
        if (error || pending) return;
        mutation.mutate();
      }}
    >
      <div>
        <h2 className="font-display text-lg font-semibold">Demander un retrait</h2>
        <p className="mt-1 text-xs text-muted-foreground">
          Disponible : {fcfa(available)} · minimum {fcfa(minimum)}
        </p>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="wd-amount">Montant (FCFA)</Label>
        <Input
          id="wd-amount"
          inputMode="numeric"
          value={amount}
          onChange={(e) => setAmount(e.target.value.replace(/\D/g, ""))}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="wd-method">Moyen de paiement</Label>
        <Select value={methodCode} onValueChange={setMethodCode}>
          <SelectTrigger id="wd-method">
            <SelectValue placeholder="Choisir" />
          </SelectTrigger>
          <SelectContent>
            {methods.map((m) => (
              <SelectItem key={m.code} value={m.code}>
                {m.name} — {m.kind === "bank" ? "Virement bancaire" : "Mobile Money"}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="wd-dest">
          {method?.kind === "bank" ? "IBAN / numéro de compte" : "Numéro mobile money"}
        </Label>
        <Input
          id="wd-dest"
          value={destination}
          onChange={(e) => setDestination(e.target.value)}
          placeholder={method?.kind === "bank" ? "CI93 CI00 0000 0000" : "07 00 00 00 00"}
        />
      </div>

      <Separator />

      <div className="space-y-1 text-sm">
        <p className="flex justify-between text-muted-foreground">
          <span>Montant demandé</span>
          <span>{fcfa(value)}</span>
        </p>
        <p className="flex justify-between text-muted-foreground">
          <span>
            Frais ({((Number(method?.fee_percent ?? 0)) * 100).toFixed(2).replace(".", ",")} % +{" "}
            {fcfa(method?.fee_fixed_fcfa ?? 0)})
          </span>
          <span>{fcfa(fee)}</span>
        </p>
        <p className="flex justify-between font-medium">
          <span>Vous recevez</span>
          <span>{fcfa(net)}</span>
        </p>
        {method && !method.is_live && (
          <p className="text-xs text-warning">
            {method.name} est en mode test : le versement sera traité manuellement.
          </p>
        )}
      </div>

      {pending && (
        <p className="text-xs text-warning">
          Une demande est déjà en cours — annulez-la ou attendez son traitement.
        </p>
      )}
      {error && !pending && <p className="text-xs text-destructive">{error}</p>}

      <Button
        type="submit"
        variant="hero"
        className="w-full"
        disabled={!!error || pending || mutation.isPending}
      >
        {mutation.isPending ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Envoi…
          </>
        ) : (
          "Demander le retrait"
        )}
      </Button>
    </form>
  );
}

function WithdrawalsList({
  withdrawals,
  onDone,
}: {
  withdrawals: WithdrawalRow[];
  onDone: () => void;
}) {
  const cancel = useServerFn(cancelWithdrawal);
  const mutation = useMutation({
    mutationFn: (withdrawalId: string) => cancel({ data: { withdrawalId } }),
    onSuccess: (result) => {
      if (result.ok) {
        toast.success("Retrait annulé — montant remis dans votre solde disponible");
        onDone();
      } else if (result.code === "WITHDRAWAL_NOT_CANCELLABLE") {
        toast.error("Ce retrait n'est plus annulable.");
      } else {
        toast.error("Annulation impossible.");
      }
    },
    onError: () => toast.error("Annulation impossible."),
  });

  return (
    <div className="surface-card rounded-2xl p-5">
      <h2 className="font-display text-lg font-semibold">Suivi des retraits</h2>
      {withdrawals.length === 0 ? (
        <p className="mt-3 text-sm text-muted-foreground">Aucune demande de retrait pour l'instant.</p>
      ) : (
        <ul className="mt-4 space-y-3">
          {withdrawals.map((w) => (
            <li
              key={w.id}
              className="flex flex-wrap items-center justify-between gap-3 border-t border-border/60 pt-3 text-sm first:border-0 first:pt-0"
            >
              <div className="min-w-0">
                <p className="font-medium">
                  {fcfa(w.amount_fcfa)}{" "}
                  <span className="text-xs text-muted-foreground">
                    · net {fcfa(w.net_amount_fcfa)} · frais {fcfa(w.fee_fcfa)}
                  </span>
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  {w.reference} · {w.payout_method_code} · {w.destination} · {dateFr(w.created_at)}
                </p>
                {w.failure_reason && (
                  <p className="text-xs text-destructive">{w.failure_reason}</p>
                )}
              </div>
              <div className="flex items-center gap-3">
                <StatusBadge status={w.status} />
                {w.status === "pending" && (
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={mutation.isPending}
                    onClick={() => mutation.mutate(w.id)}
                  >
                    Annuler
                  </Button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function LedgerTable({ data }: { data: FinanceOverview }) {
  return (
    <div className="surface-card overflow-x-auto rounded-2xl p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="font-display text-lg font-semibold">Historique du portefeuille</h2>
        {data.commissionRate !== null && (
          <p className="text-xs text-muted-foreground">
            Offre {data.planCode} · commission {(Number(data.commissionRate) * 100).toFixed(0)} %
          </p>
        )}
      </div>

      {data.ledger.length === 0 ? (
        <p className="mt-3 text-sm text-muted-foreground">
          Aucun mouvement. Vos ventes apparaîtront ici (vente, commission, frais, net).
        </p>
      ) : (
        <table className="mt-4 w-full text-left text-sm">
          <thead className="text-xs text-muted-foreground">
            <tr>
              <th className="pb-2 font-normal">Date</th>
              <th className="pb-2 font-normal">Type</th>
              <th className="pb-2 font-normal">Poche</th>
              <th className="pb-2 font-normal">Libellé</th>
              <th className="pb-2 text-right font-normal">Montant</th>
            </tr>
          </thead>
          <tbody>
            {data.ledger.map((entry) => (
              <tr key={entry.id} className="border-t border-border/60">
                <td className="py-2.5 text-muted-foreground">{dateFr(entry.created_at)}</td>
                <td className="py-2.5">{entry.entry_type}</td>
                <td className="py-2.5 text-muted-foreground">{entry.bucket}</td>
                <td className="py-2.5 text-muted-foreground">{entry.description ?? "—"}</td>
                <td
                  className={
                    "py-2.5 text-right font-medium " +
                    (entry.amount_fcfa < 0 ? "text-destructive" : "text-primary")
                  }
                >
                  {entry.amount_fcfa < 0 ? "−" : "+"}
                  {fcfa(Math.abs(entry.amount_fcfa))}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {data.transactions.length > 0 && (
        <>
          <Separator className="my-5" />
          <h3 className="font-display text-sm font-semibold">Ventes récentes</h3>
          <table className="mt-3 w-full text-left text-sm">
            <thead className="text-xs text-muted-foreground">
              <tr>
                <th className="pb-2 font-normal">Référence</th>
                <th className="pb-2 font-normal">Brut</th>
                <th className="pb-2 font-normal">Commission</th>
                <th className="pb-2 font-normal">Frais</th>
                <th className="pb-2 font-normal">Net</th>
                <th className="pb-2 font-normal">Statut</th>
              </tr>
            </thead>
            <tbody>
              {data.transactions.map((t) => (
                <tr key={t.id} className="border-t border-border/60">
                  <td className="py-2.5">{t.reference}</td>
                  <td className="py-2.5">{fcfa(t.gross_amount_fcfa)}</td>
                  <td className="py-2.5 text-muted-foreground">
                    −{fcfa(t.commission_amount_fcfa)}
                  </td>
                  <td className="py-2.5 text-muted-foreground">−{fcfa(t.provider_fee_fcfa)}</td>
                  <td className="py-2.5 font-medium">{fcfa(t.net_amount_fcfa)}</td>
                  <td className="py-2.5">
                    <StatusBadge status={t.status === "available" ? "completed" : t.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
    </div>
  );
}

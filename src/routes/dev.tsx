import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useState } from "react";
import {
  UploadCloud,
  FileCheck2,
  ShieldCheck,
  Wallet,
  TrendingUp,
  AlertTriangle,
  RotateCcw,
  Copy,
} from "lucide-react";
import { DevShell } from "@/components/DevShell";
import { PwaConverter } from "@/components/PwaConverter";
import { useI18n } from "@/lib/i18n";
import { AppIcon } from "@/components/AppTile";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import {
  DEV_APPS,
  DEV_PROFILE,
  DEV_TRANSACTIONS,
  DOWNLOADS_7D,
  formatCount,
} from "@/lib/mock-data";

export const Route = createFileRoute("/dev")({
  head: () => ({
    meta: [
      { title: "E'nvlé Developers — Publier n'a jamais été aussi simple" },
      {
        name: "description",
        content:
          "Convertissez votre PWA en APK, publiez vos applications, gérez vos versions, votre distribution et vos revenus.",
      },
      { property: "og:title", content: "E'nvlé Developers" },
      {
        property: "og:description",
        content: "Publier et distribuer une application Android depuis un seul espace.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: DevDashboard,
});

function DevDashboard() {
  const { t } = useI18n();

  return (
    <DevShell>
      <Tabs defaultValue="pwa">
          <TabsList className="flex w-full flex-wrap justify-start">
            <TabsTrigger value="pwa">{t("dev.tab.pwa")}</TabsTrigger>
            <TabsTrigger value="upload">{t("dev.tab.upload")}</TabsTrigger>
            <TabsTrigger value="apps">{t("dev.tab.apps")}</TabsTrigger>
            <TabsTrigger value="analytics">{t("dev.tab.analytics")}</TabsTrigger>
            <TabsTrigger value="payouts">{t("dev.tab.payouts")}</TabsTrigger>
          </TabsList>

          <TabsContent value="pwa" className="mt-6">
            <PwaConverter />
          </TabsContent>

          <TabsContent value="upload" className="mt-6">
            <UploadPanel />
          </TabsContent>

          <TabsContent value="apps" className="mt-6 space-y-4">
            {DEV_APPS.map((app) => (
              <div key={app.id} className="surface-card rounded-2xl p-5">
                <div className="flex flex-wrap items-center gap-4">
                  <AppIcon app={app} />
                  <div className="min-w-0 flex-1">
                    <p className="font-display font-semibold">{app.name}</p>
                    <p className="text-xs text-muted-foreground">
                      v{app.version} · {formatCount(app.downloads)} installs ·{" "}
                      {app.scan === "verified" ? "Vérifiée" : "En revue"}
                    </p>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => toast.success("Rollback vers la version précédente lancé")}>
                    <RotateCcw className="mr-1.5 h-3.5 w-3.5" /> Rollback
                  </Button>
                </div>
                <Separator className="my-4" />
                <div className="space-y-2">
                  {app.versions.map((v) => (
                    <div
                      key={v.version}
                      className="flex flex-wrap items-center justify-between gap-2 text-sm"
                    >
                      <span className="font-medium">v{v.version}</span>
                      <span className="text-muted-foreground">{v.notes}</span>
                      <span
                        className={
                          "text-xs " + (v.crashRate > 3 ? "text-destructive" : "text-muted-foreground")
                        }
                      >
                        crash {v.crashRate}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </TabsContent>

          <TabsContent value="analytics" className="mt-6">
            <div className="surface-card rounded-2xl p-6">
              <h2 className="font-display text-lg font-semibold">Téléchargements — 7 derniers jours</h2>
              <div className="mt-6 flex h-48 items-end gap-3">
                {DOWNLOADS_7D.map((d) => (
                  <div key={d.day} className="flex flex-1 flex-col items-center gap-2">
                    <div
                      className="w-full rounded-t-lg bg-gradient-brand"
                      style={{ height: `${(d.value / 1800) * 100}%` }}
                      title={`${d.value} téléchargements`}
                    />
                    <span className="text-xs text-muted-foreground">{d.day}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="surface-card mt-4 rounded-2xl p-6">
              <h2 className="font-display text-lg font-semibold">Derniers crashs</h2>
              <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                <li>NullPointerException — Facture Kit v2.0.1 — Tecno Spark 10 — il y a 2 h</li>
                <li>OutOfMemoryError — Djassa Market v3.2.0 — Itel A60 — il y a 6 h</li>
                <li>ANR démarrage — Facture Kit v2.0.1 — Samsung A05 — hier</li>
              </ul>
            </div>
          </TabsContent>

          <TabsContent value="payouts" className="mt-6">
            <div className="grid gap-4 lg:grid-cols-[340px_1fr]">
              <WithdrawCard />
              <div className="surface-card overflow-x-auto rounded-2xl p-5">
                <h2 className="font-display text-lg font-semibold">Transactions récentes</h2>
                <table className="mt-4 w-full text-left text-sm">
                  <thead className="text-xs text-muted-foreground">
                    <tr>
                      <th className="pb-2 font-normal">Référence</th>
                      <th className="pb-2 font-normal">App</th>
                      <th className="pb-2 font-normal">Net dev</th>
                      <th className="pb-2 font-normal">Moyen</th>
                      <th className="pb-2 font-normal">Statut</th>
                    </tr>
                  </thead>
                  <tbody>
                    {DEV_TRANSACTIONS.map((t) => (
                      <tr key={t.id} className="border-t border-border/60">
                        <td className="py-2.5">{t.id}</td>
                        <td className="py-2.5 text-muted-foreground">{t.app}</td>
                        <td className="py-2.5">{t.net.toLocaleString("fr-FR")} F</td>
                        <td className="py-2.5 text-muted-foreground">{t.method}</td>
                        <td
                          className={
                            "py-2.5 " + (t.status === "Payé" ? "text-primary" : "text-warning")
                          }
                        >
                          {t.status}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </TabsContent>
      </Tabs>
    </DevShell>
  );
}

function TokenBadge() {
  return (
    <button
      type="button"
      onClick={() => toast.success("Token API copié")}
      className="surface-card flex items-center gap-2 rounded-xl px-3 py-2 text-xs text-muted-foreground transition-colors hover:text-foreground"
    >
      <span className="font-mono">{DEV_PROFILE.apiToken}</span>
      <Copy className="h-3.5 w-3.5" />
    </button>
  );
}

function Stat({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div className="surface-card rounded-2xl p-5">
      <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Icon className="h-3.5 w-3.5 text-primary" /> {label}
      </p>
      <p className="mt-2 font-display text-2xl font-semibold">{value}</p>
    </div>
  );
}

type UploadState = "idle" | "uploading" | "scanning" | "done";

function UploadPanel() {
  const [state, setState] = useState<UploadState>("idle");
  const [progress, setProgress] = useState(0);
  const [fileName, setFileName] = useState("");

  const start = useCallback((name: string) => {
    setFileName(name);
    setState("uploading");
    setProgress(0);
    let p = 0;
    const interval = setInterval(() => {
      p = Math.min(100, p + Math.random() * 14 + 6);
      setProgress(p);
      if (p >= 100) {
        clearInterval(interval);
        setState("scanning");
        setTimeout(() => {
          setState("done");
          toast.success("APK vérifié — aucune menace détectée");
        }, 2200);
      }
    }, 250);
  }, []);

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_340px]">
      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          start(e.dataTransfer.files[0]?.name ?? "mon-app.apk");
        }}
        className="surface-card flex flex-col items-center justify-center rounded-2xl border-dashed p-12 text-center"
      >
        {state === "idle" && (
          <>
            <UploadCloud className="h-10 w-10 text-primary" />
            <p className="mt-4 font-display text-lg font-semibold">Déposez votre APK ici</p>
            <p className="mt-1 text-sm text-muted-foreground">
              500 Mo maximum · signature et metadata extraites automatiquement
            </p>
            <Button variant="hero" className="mt-6" onClick={() => start("mon-app-v1.apk")}>
              Choisir un fichier
            </Button>
          </>
        )}

        {state === "uploading" && (
          <div className="w-full max-w-sm">
            <p className="text-sm font-medium">{fileName}</p>
            <Progress value={progress} className="mt-3" />
            <p className="mt-2 text-xs text-muted-foreground">
              Upload {Math.round(progress)} %
            </p>
          </div>
        )}

        {state === "scanning" && (
          <div className="w-full max-w-sm space-y-2 text-sm text-muted-foreground">
            <p className="font-medium text-foreground">Analyse de sécurité…</p>
            <p>Extraction des metadata (nom, version, icône, permissions)</p>
            <p>Vérification de la signature APK</p>
            <p>Scan antivirus VirusTotal</p>
            <p>Détection de clones</p>
          </div>
        )}

        {state === "done" && (
          <div className="flex flex-col items-center">
            <FileCheck2 className="h-10 w-10 text-primary" />
            <p className="mt-4 font-display text-lg font-semibold">APK vérifié</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {fileName} · risque faible (12/100) · statut « Vérifiée »
            </p>
            <Button
              variant="hero"
              className="mt-6"
              onClick={() => toast.success("App publiée sur le catalogue")}
            >
              Publier maintenant
            </Button>
            <Button variant="ghost" size="sm" className="mt-2" onClick={() => setState("idle")}>
              Uploader un autre APK
            </Button>
          </div>
        )}
      </div>

      <form
        className="surface-card space-y-4 rounded-2xl p-5"
        onSubmit={(e) => {
          e.preventDefault();
          toast.success("Fiche enregistrée");
        }}
      >
        <h2 className="font-display text-lg font-semibold">Fiche de l'app</h2>
        <div className="space-y-1.5">
          <Label htmlFor="app-name">Nom de l'app</Label>
          <Input id="app-name" placeholder="Djassa Market" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="app-cat">Catégorie</Label>
          <Select>
            <SelectTrigger id="app-cat">
              <SelectValue placeholder="Choisir" />
            </SelectTrigger>
            <SelectContent>
              {["Jeux", "Productivité", "Éducation", "Finance", "Social", "Transport"].map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="app-price">Prix (FCFA, 0 = gratuit)</Label>
          <Input id="app-price" type="number" min={0} placeholder="0" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="app-notes">Notes de version (FR)</Label>
          <Input id="app-notes" placeholder="Recherche par quartier + mode hors-ligne" />
        </div>
        <Button type="submit" variant="outline" className="w-full">
          Enregistrer
        </Button>
      </form>
    </div>
  );
}

function WithdrawCard() {
  const [amount, setAmount] = useState("50000");
  const value = Number(amount) || 0;
  const fees = Math.round(value * 0.015) + 500;
  const tooLow = value < DEV_PROFILE.payoutThreshold;

  return (
    <form
      className="surface-card space-y-4 rounded-2xl p-5"
      onSubmit={(e) => {
        e.preventDefault();
        if (tooLow) return;
        toast.success("Demande de retrait envoyée");
      }}
    >
      <h2 className="font-display text-lg font-semibold">Retrait mobile money</h2>
      <p className="text-xs text-muted-foreground">
        Solde : {DEV_PROFILE.balanceFcfa.toLocaleString("fr-FR")} FCFA · minimum{" "}
        {DEV_PROFILE.payoutThreshold.toLocaleString("fr-FR")} FCFA
      </p>
      <div className="space-y-1.5">
        <Label htmlFor="wd-amount">Montant</Label>
        <Input
          id="wd-amount"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          inputMode="numeric"
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="wd-op">Opérateur</Label>
        <Select defaultValue="mtn">
          <SelectTrigger id="wd-op">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="mtn">MTN Mobile Money</SelectItem>
            <SelectItem value="orange">Orange Money</SelectItem>
            <SelectItem value="moov">Moov Money</SelectItem>
            <SelectItem value="wave">Wave</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="wd-num">Numéro</Label>
        <Input id="wd-num" placeholder="07 00 00 00 00" />
      </div>
      <Separator />
      <div className="space-y-1 text-sm">
        <p className="flex justify-between text-muted-foreground">
          <span>Frais (1,5 % + 500 F)</span>
          <span>{fees.toLocaleString("fr-FR")} F</span>
        </p>
        <p className="flex justify-between font-medium">
          <span>Vous recevez</span>
          <span>{Math.max(0, value - fees).toLocaleString("fr-FR")} F</span>
        </p>
      </div>
      {tooLow && (
        <p className="text-xs text-destructive">Montant inférieur au seuil de retrait.</p>
      )}
      <Button type="submit" variant="hero" className="w-full" disabled={tooLow}>
        Demander le retrait
      </Button>
    </form>
  );
}

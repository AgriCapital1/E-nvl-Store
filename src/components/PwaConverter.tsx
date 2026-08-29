import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Link } from "@tanstack/react-router";
import {
  Globe,
  Loader2,
  Check,
  Package,
  Download,
  RotateCcw,
  Sparkles,
  AlertTriangle,
  TriangleAlert,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { useI18n } from "@/lib/i18n";
import { useSupabaseSession } from "@/hooks/use-supabase-session";
import {
  getBuildArtifactUrl,
  listPwaBuilds,
  requestPwaBuild,
  validatePwa,
  type PwaBuildRow,
  type PwaValidation,
} from "@/lib/pwa-build.functions";

const ACTIVE_STATUSES = ["queued", "preparing", "building", "signing", "uploading"];

const STATUS_LABELS: Record<string, string> = {
  queued: "En file d'attente",
  preparing: "Préparation",
  building: "Compilation Gradle",
  signing: "Signature",
  uploading: "Envoi de l'APK",
  succeeded: "Terminé",
  failed: "Échec",
  cancelled: "Annulé",
};

function CheckRow({ status, label, detail }: { status: string; label: string; detail: string }) {
  const Icon = status === "pass" ? Check : status === "warn" ? TriangleAlert : X;
  const color =
    status === "pass" ? "text-primary" : status === "warn" ? "text-warning" : "text-destructive";
  return (
    <li className="flex items-start gap-3">
      <Icon className={`mt-0.5 h-4 w-4 shrink-0 ${color}`} />
      <div className="min-w-0">
        <p className="text-sm font-medium">{label}</p>
        <p className="break-words text-xs text-muted-foreground">{detail}</p>
      </div>
    </li>
  );
}

export function PwaConverter() {
  const { t } = useI18n();
  const queryClient = useQueryClient();

  const [url, setUrl] = useState("");
  const [validation, setValidation] = useState<PwaValidation | null>(null);
  const [appName, setAppName] = useState("");
  const [packageName, setPackageName] = useState("");

  const runValidate = useServerFn(validatePwa);
  const runRequest = useServerFn(requestPwaBuild);
  const runArtifact = useServerFn(getBuildArtifactUrl);
  const fetchBuilds = useServerFn(listPwaBuilds);

  const isAuthenticated = useSupabaseSession();

  const builds = useQuery<PwaBuildRow[]>({
    queryKey: ["pwa-builds"],
    queryFn: () => fetchBuilds(),
    enabled: isAuthenticated === true,
    retry: false,
    refetchInterval: (query) =>
      (query.state.data ?? []).some((b) => ACTIVE_STATUSES.includes(b.status)) ? 5_000 : false,
  });

  const validateMutation = useMutation({
    mutationFn: () => {
      if (isAuthenticated !== true) {
        throw new Error("NOT_AUTHENTICATED");
      }
      return runValidate({ data: { url } });
    },
    onSuccess: (result) => {
      setValidation(result);
      setAppName(result.appName ?? "");
      setPackageName(result.suggestedPackage ?? "");
      if (result.eligible) toast.success("PWA valide — prête pour la conversion APK");
      else toast.error("La PWA ne remplit pas encore tous les critères");
    },
    onError: () => toast.error("Connectez-vous à votre compte développeur pour lancer l'analyse."),
  });

  const buildMutation = useMutation({
    mutationFn: () =>
      runRequest({
        data: {
          sourceUrl: validation!.url,
          appName: appName.trim(),
          packageName: packageName.trim(),
          themeColor: validation?.themeColor ?? null,
          options: { icon_url: validation?.iconUrl ?? null },
        },
      }),
    onSuccess: (result) => {
      if (result.ok) {
        toast.success(
          `Build ${String(result["reference"] ?? "")} enregistré — position ${String(result["queue_position"] ?? 1)} dans la file`,
        );
        void queryClient.invalidateQueries({ queryKey: ["pwa-builds"] });
        return;
      }
      const messages: Record<string, string> = {
        BUILD_LIMIT_REACHED: "Quota de builds mensuels atteint pour votre offre.",
        BUILD_ALREADY_RUNNING: "Un build est déjà en cours.",
        SOURCE_URL_NOT_HTTPS: "L'adresse doit être en HTTPS.",
        INVALID_PACKAGE_NAME: "Nom de paquet Android invalide (ex. ci.envle.monapp).",
        APP_NAME_REQUIRED: "Le nom de l'application est requis.",
      };
      toast.error(messages[String(result.code)] ?? "Demande de build refusée.");
    },
    onError: () => toast.error("Demande impossible — reconnectez-vous."),
  });

  const download = async (buildId: string) => {
    const result = await runArtifact({ data: { buildId } });
    if (result.ok) window.open(result.url, "_blank", "noopener");
    else toast.error("APK indisponible pour ce build.");
  };

  const reset = () => {
    setValidation(null);
    setUrl("");
    setAppName("");
    setPackageName("");
  };

  const packageValid = /^[a-z][a-z0-9_]*(\.[a-z0-9_]+)+$/.test(packageName.trim());

  return (
    <div className="space-y-4">
      <div className="surface-card rounded-2xl p-6">
        <h2 className="flex items-center gap-2 font-display text-lg font-semibold">
          <Sparkles className="h-4 w-4 text-primary" /> {t("pwa.title")}
        </h2>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">{t("pwa.subtitle")}</p>

        <div className="mt-5 flex flex-wrap items-end gap-3">
          <div className="min-w-[260px] flex-1 space-y-1.5">
            <Label htmlFor="pwa-url">{t("pwa.url")}</Label>
            <div className="relative">
              <Globe className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="pwa-url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                onKeyDown={(e) =>
                  e.key === "Enter" && !validateMutation.isPending && validateMutation.mutate()
                }
                placeholder="app.agricapital.ci"
                className="pl-9"
                disabled={validateMutation.isPending}
              />
            </div>
          </div>
          <Button
            variant="hero"
            size="lg"
            onClick={() => validateMutation.mutate()}
            disabled={
              validateMutation.isPending || url.trim().length < 4 || isAuthenticated !== true
            }
          >
            {validateMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Analyse en cours…
              </>
            ) : (
              <>
                <Package className="mr-2 h-4 w-4" /> Analyser la PWA
              </>
            )}
          </Button>
        </div>
        <p className="mt-3 text-xs text-muted-foreground">
          L'analyse vérifie réellement le HTTPS, le manifest, les icônes 192/512 px et le service
          worker avant toute compilation Android.
        </p>
      </div>

      {validation && (
        <div className="surface-card rounded-2xl p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h3 className="font-display text-lg font-semibold">Rapport de conformité</h3>
            <span
              className={
                "text-xs font-medium " + (validation.eligible ? "text-primary" : "text-destructive")
              }
            >
              {validation.eligible ? "Éligible à la conversion" : "Corrections requises"}
            </span>
          </div>
          <p className="mt-1 break-words text-xs text-muted-foreground">{validation.url}</p>

          <ul className="mt-4 space-y-3">
            {validation.checks.map((c) => (
              <CheckRow key={c.id} status={c.status} label={c.label} detail={c.detail} />
            ))}
          </ul>

          <Separator className="my-6" />

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="pwa-name">Nom de l'application</Label>
              <Input id="pwa-name" value={appName} onChange={(e) => setAppName(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="pwa-pkg">Nom de paquet Android</Label>
              <Input
                id="pwa-pkg"
                value={packageName}
                onChange={(e) => setPackageName(e.target.value.toLowerCase())}
                placeholder="ci.envle.monapp"
              />
              {!packageValid && packageName.length > 0 && (
                <p className="text-xs text-destructive">Format attendu : ci.envle.monapp</p>
              )}
            </div>
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <Button
              variant="hero"
              disabled={
                !validation.eligible ||
                !packageValid ||
                appName.trim().length < 2 ||
                buildMutation.isPending ||
                isAuthenticated !== true
              }
              onClick={() => buildMutation.mutate()}
            >
              {buildMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Envoi de la demande…
                </>
              ) : (
                "Lancer le build APK"
              )}
            </Button>
            <Button variant="ghost" onClick={reset}>
              <RotateCcw className="mr-1.5 h-3.5 w-3.5" /> Recommencer
            </Button>
          </div>
        </div>
      )}

      <div className="surface-card rounded-2xl p-6">
        <h3 className="font-display text-lg font-semibold">Historique des builds</h3>

        {builds.isError && (
          <div className="mt-3 text-sm text-muted-foreground">
            <p className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-warning" /> Connexion requise pour voir vos
              builds.
            </p>
            <Button asChild variant="outline" size="sm" className="mt-3">
              <Link to="/auth">Se connecter</Link>
            </Button>
          </div>
        )}

        {builds.isLoading && (
          <p className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Chargement…
          </p>
        )}

        {builds.data && builds.data.length === 0 && (
          <p className="mt-3 text-sm text-muted-foreground">
            Aucun build pour l'instant. Analysez une PWA puis lancez la conversion.
          </p>
        )}

        <ul className="mt-4 space-y-4">
          {(builds.data ?? []).map((b) => (
            <li key={b.id} className="border-t border-border/60 pt-4 first:border-0 first:pt-0">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-sm font-medium">
                    {b.app_name}{" "}
                    <span className="text-xs text-muted-foreground">· {b.package_name}</span>
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {b.reference} · {new Date(b.created_at).toLocaleString("fr-FR")}
                  </p>
                </div>
                <span
                  className={
                    "text-xs font-medium " +
                    (b.status === "succeeded"
                      ? "text-primary"
                      : b.status === "failed"
                        ? "text-destructive"
                        : "text-warning")
                  }
                >
                  {STATUS_LABELS[b.status] ?? b.status}
                  {b.status === "queued" && b.queue_position ? ` (#${b.queue_position})` : ""}
                </span>
              </div>

              {ACTIVE_STATUSES.includes(b.status) && (
                <Progress value={b.progress} className="mt-3" />
              )}

              {b.error_message && (
                <p className="mt-2 text-xs text-destructive">
                  {b.error_code}: {b.error_message}
                </p>
              )}

              {b.status === "succeeded" && b.artifact_path && (
                <Button variant="outline" size="sm" className="mt-3" onClick={() => download(b.id)}>
                  <Download className="mr-1.5 h-3.5 w-3.5" /> Télécharger l'APK
                  {b.artifact_size_bytes
                    ? ` (${(b.artifact_size_bytes / 1_048_576).toFixed(1)} Mo)`
                    : ""}
                </Button>
              )}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

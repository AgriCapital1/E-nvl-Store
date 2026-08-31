import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  FileCheck2,
  Loader2,
  Package,
  Pencil,
  Plus,
  Trash2,
  UploadCloud,
} from "lucide-react";
import { toast } from "sonner";
import { DevShell } from "@/components/DevShell";
import { PwaConverter } from "@/components/PwaConverter";
import { FinancePanel } from "@/components/FinancePanel";
import { SignInIconLink } from "@/components/AccountButton";
import { NoProfile } from "@/components/DeveloperProfileForm";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useI18n } from "@/lib/i18n";
import { useSupabaseSession } from "@/hooks/use-supabase-session";
import {
  archiveDeveloperApp,
  createUploadTarget,
  getDevStats,
  getDevWorkspace,
  saveDeveloperApp,
  submitVersion,
  verifyPackageUpload,
} from "@/lib/dev-apps.functions";
import {
  fileExtension,
  MAX_PACKAGE_BYTES,
  PACKAGE_EXTENSIONS,
  slugify,
  type DeveloperAppRow,
  type DevWorkspace,
} from "@/lib/dev-apps-types";

export const Route = createFileRoute("/dev")({
  head: () => ({
    meta: [
      { title: "E'nvlé Developers — Publiez et distribuez vos applications" },
      {
        name: "description",
        content:
          "Importez votre application Android ou transformez votre site ou PWA en application, gérez vos versions, votre distribution et vos revenus.",
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

        <TabsContent value="apps" className="mt-6">
          <AppsPanel />
        </TabsContent>

        <TabsContent value="analytics" className="mt-6">
          <StatsPanel />
        </TabsContent>

        <TabsContent value="payouts" className="mt-6">
          <FinancePanel />
        </TabsContent>
      </Tabs>
    </DevShell>
  );
}

/* -------------------------------------------------------------------------- */
/* Données partagées                                                          */
/* -------------------------------------------------------------------------- */

function useWorkspace() {
  const isAuthenticated = useSupabaseSession();
  return {
    isAuthenticated,
    query: useQuery<DevWorkspace>({
      queryKey: ["dev-workspace"],
      queryFn: () => getDevWorkspace(),
      enabled: isAuthenticated === true,
    }),
  };
}

function StateCard({
  icon,
  title,
  text,
  action,
}: {
  icon: React.ReactNode;
  title: string;
  text: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="surface-card rounded-2xl p-6">
      <h2 className="flex items-center gap-2 font-display text-lg font-semibold">
        {icon} {title}
      </h2>
      <p className="mt-2 text-sm text-muted-foreground">{text}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

function SignedOut() {
  return (
    <StateCard
      icon={<AlertTriangle className="h-4 w-4 text-warning" />}
      title="Connexion requise"
      text="Connectez-vous à votre compte développeur pour gérer vos applications."
      action={<SignInIconLink />}
    />
  );
}

function LoadingCard() {
  return (
    <p className="flex items-center gap-2 text-sm text-muted-foreground">
      <Loader2 className="h-4 w-4 animate-spin" /> Chargement…
    </p>
  );
}

/* -------------------------------------------------------------------------- */
/* Onglet : envoi d'un APK / AAB                                              */
/* -------------------------------------------------------------------------- */

type UploadState = "idle" | "uploading" | "verifying" | "submitting" | "done";

function UploadPanel() {
  const { isAuthenticated, query } = useWorkspace();
  const queryClient = useQueryClient();
  const inputRef = useRef<HTMLInputElement>(null);

  const [state, setState] = useState<UploadState>("idle");
  const [progress, setProgress] = useState(0);
  const [file, setFile] = useState<File | null>(null);
  const [appId, setAppId] = useState("");
  const [version, setVersion] = useState("1.0.0");
  const [versionCode, setVersionCode] = useState("1");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);

  const apps = query.data?.apps ?? [];

  const pick = useCallback((f: File | null) => {
    setError(null);
    if (!f) return;
    const ext = fileExtension(f.name);
    if (!(PACKAGE_EXTENSIONS as readonly string[]).includes(ext)) {
      setError("Format non supporté : choisissez un fichier .apk ou .aab.");
      return;
    }
    if (f.size > MAX_PACKAGE_BYTES) {
      setError("Fichier trop volumineux (500 Mo maximum).");
      return;
    }
    setFile(f);
    setState("idle");
    setProgress(0);
  }, []);

  const submit = useMutation({
    mutationFn: async () => {
      if (!file) throw new Error("Aucun fichier sélectionné.");
      if (!appId) throw new Error("Choisissez l'application concernée.");

      const target = await createUploadTarget({
        data: { kind: "package", fileName: file.name, fileSize: file.size },
      });
      if (!target.ok || !target.url || !target.path) {
        throw new Error(uploadError(target.code));
      }

      setState("uploading");
      setProgress(0);
      await putWithProgress(target.url, file, setProgress);

      setState("verifying");
      const verification = await verifyPackageUpload({
        data: { path: target.path, expectedSize: file.size },
      });
      if (!verification.ok) throw new Error(verifyError(verification.code));

      setState("submitting");
      const result = await submitVersion({
        data: {
          appId,
          version,
          versionCode: Number(versionCode),
          apkPath: target.path,
          apkSizeBytes: file.size,
          checksum: verification.checksum ?? null,
          releaseNotesFr: notes.trim() ? notes.trim() : null,
          minAndroid: null,
        },
      });
      if (!result.ok) throw new Error(submitError(result.code));
      return result;
    },
    onSuccess: () => {
      setState("done");
      toast.success("Version envoyée — elle est maintenant en revue.");
      void queryClient.invalidateQueries({ queryKey: ["dev-workspace"] });
    },
    onError: (e: Error) => {
      setState("idle");
      setProgress(0);
      setError(e.message);
    },
  });

  if (isAuthenticated === false) return <SignedOut />;
  if (isAuthenticated === null || query.isLoading) return <LoadingCard />;
  if (query.isError) {
    return (
      <StateCard
        icon={<AlertTriangle className="h-4 w-4 text-destructive" />}
        title="Chargement impossible"
        text="Vos applications n'ont pas pu être chargées. Réessayez dans un instant."
        action={
          <Button variant="outline" onClick={() => void query.refetch()}>
            Réessayer
          </Button>
        }
      />
    );
  }
  if (!query.data?.hasProfile) {
    return <NoProfile />;
  }

  const busy = state === "uploading" || state === "verifying" || state === "submitting";

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_340px]">
      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          pick(e.dataTransfer.files[0] ?? null);
        }}
        className="surface-card flex flex-col items-center justify-center rounded-2xl border-dashed p-12 text-center"
      >
        <input
          ref={inputRef}
          type="file"
          accept=".apk,.aab"
          className="hidden"
          onChange={(e) => pick(e.target.files?.[0] ?? null)}
        />

        {state === "done" ? (
          <div className="flex flex-col items-center">
            <FileCheck2 className="h-10 w-10 text-primary" />
            <p className="mt-4 font-display text-lg font-semibold">Version envoyée</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {file?.name} · en attente de revue E'nvlé
            </p>
            <Button
              variant="ghost"
              size="sm"
              className="mt-3"
              onClick={() => {
                setFile(null);
                setState("idle");
                setProgress(0);
              }}
            >
              Envoyer une autre version
            </Button>
          </div>
        ) : (
          <>
            <UploadCloud className="h-10 w-10 text-primary" />
            <p className="mt-4 font-display text-lg font-semibold">
              {file ? file.name : "Déposez votre APK ou AAB ici"}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              {file
                ? `${(file.size / (1024 * 1024)).toFixed(1)} Mo`
                : "500 Mo maximum · formats .apk et .aab"}
            </p>
            <Button
              variant="hero"
              className="mt-6"
              disabled={busy}
              onClick={() => inputRef.current?.click()}
            >
              Choisir un fichier
            </Button>
          </>
        )}

        {busy && (
          <div className="mt-6 w-full max-w-sm">
            <Progress value={state === "uploading" ? progress : 100} />
            <p className="mt-2 text-xs text-muted-foreground">
              {state === "submitting"
                ? "Envoi en revue…"
                : state === "verifying"
                  ? "Vérification du fichier…"
                  : `Téléversement ${Math.round(progress)} %`}
            </p>
          </div>
        )}

        {error && <p className="mt-4 text-sm text-destructive">{error}</p>}
      </div>

      <form
        className="surface-card space-y-4 rounded-2xl p-5"
        onSubmit={(e) => {
          e.preventDefault();
          submit.mutate();
        }}
      >
        <h2 className="font-display text-lg font-semibold">Détails de la version</h2>

        <div className="space-y-1.5">
          <Label htmlFor="v-app">Application</Label>
          <Select value={appId} onValueChange={setAppId}>
            <SelectTrigger id="v-app">
              <SelectValue placeholder={apps.length ? "Choisir" : "Créez d'abord une application"} />
            </SelectTrigger>
            <SelectContent>
              {apps.map((a) => (
                <SelectItem key={a.id} value={a.id}>
                  {a.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="v-version">Version</Label>
            <Input
              id="v-version"
              value={version}
              onChange={(e) => setVersion(e.target.value)}
              placeholder="1.0.0"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="v-code">Code version</Label>
            <Input
              id="v-code"
              type="number"
              min={1}
              value={versionCode}
              onChange={(e) => setVersionCode(e.target.value)}
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="v-notes">Notes de version (FR)</Label>
          <Textarea
            id="v-notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Recherche par quartier + mode hors-ligne"
            rows={3}
          />
        </div>

        <Button
          type="submit"
          variant="hero"
          className="w-full"
          disabled={busy || !file || !appId || apps.length === 0}
        >
          {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Envoyer en revue
        </Button>
      </form>
    </div>
  );
}

function uploadError(code?: string): string {
  switch (code) {
    case "NO_DEVELOPER_PROFILE":
      return "Activez d'abord votre profil développeur.";
    case "INVALID_EXTENSION":
      return "Format non supporté : .apk ou .aab uniquement.";
    case "FILE_TOO_LARGE":
      return "Fichier trop volumineux (500 Mo maximum).";
    default:
      return "Le téléversement n'a pas pu démarrer. Réessayez.";
  }
}

function verifyError(code?: string): string {
  switch (code) {
    case "FILE_MISSING":
      return "Le fichier n'a pas été retrouvé après le téléversement. Réessayez.";
    case "SIZE_MISMATCH":
      return "Le fichier téléversé est incomplet : la taille ne correspond pas. Réessayez.";
    default:
      return "La vérification du fichier a échoué. Réessayez.";
  }
}

function submitError(code?: string): string {
  switch (code) {
    case "VERSION_CODE_TOO_LOW":
      return "Le code version doit être supérieur à celui de la dernière version.";
    case "PLAN_STORAGE_LIMIT_REACHED":
      return "Espace de stockage de votre offre atteint.";
    case "NOT_OWNER":
      return "Cette application ne vous appartient pas.";
    default:
      return "La soumission a échoué. Réessayez.";
  }
}

/** Téléversement réel vers l'URL signée Supabase avec progression. */
function putWithProgress(url: string, file: File, onProgress: (p: number) => void) {
  return new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", url, true);
    xhr.setRequestHeader("content-type", file.type || "application/octet-stream");
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) onProgress((e.loaded / e.total) * 100);
    };
    xhr.onload = () =>
      xhr.status >= 200 && xhr.status < 300
        ? resolve()
        : reject(new Error("Le téléversement a échoué."));
    xhr.onerror = () => reject(new Error("Le téléversement a échoué."));
    xhr.send(file);
  });
}

/* -------------------------------------------------------------------------- */
/* Onglet : mes applications (CRUD réel)                                      */
/* -------------------------------------------------------------------------- */

interface AppFormState {
  id: string | null;
  name: string;
  slug: string;
  category: string;
  shortDescription: string;
  description: string;
  pricingType: "free" | "paid";
  priceFcfa: string;
}

const emptyForm: AppFormState = {
  id: null,
  name: "",
  slug: "",
  category: "",
  shortDescription: "",
  description: "",
  pricingType: "free",
  priceFcfa: "0",
};

function AppsPanel() {
  const { isAuthenticated, query } = useWorkspace();
  const queryClient = useQueryClient();
  const [form, setForm] = useState<AppFormState | null>(null);

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["dev-workspace"] });

  const save = useMutation({
    mutationFn: async (value: AppFormState) => {
      const result = await saveDeveloperApp({
        data: {
          id: value.id,
          name: value.name.trim(),
          slug: value.slug.trim() || slugify(value.name),
          category: value.category || null,
          shortDescription: value.shortDescription.trim() || null,
          description: value.description.trim() || null,
          pricingType: value.pricingType,
          priceFcfa: value.pricingType === "paid" ? Number(value.priceFcfa || 0) : 0,
          iconPath: null,
          pwaUrl: null,
        },
      });
      if (!result.ok) throw new Error(saveError(result.code));
      return result;
    },
    onSuccess: () => {
      toast.success("Application enregistrée");
      setForm(null);
      void invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const archive = useMutation({
    mutationFn: async (id: string) => {
      const result = await archiveDeveloperApp({ data: { appId: id } });
      if (!result.ok) throw new Error("Archivage impossible.");
      return result;
    },
    onSuccess: () => {
      toast.success("Application archivée");
      void invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (isAuthenticated === false) return <SignedOut />;
  if (isAuthenticated === null || query.isLoading) return <LoadingCard />;
  if (query.isError) {
    return (
      <StateCard
        icon={<AlertTriangle className="h-4 w-4 text-destructive" />}
        title="Chargement impossible"
        text="Vos applications n'ont pas pu être chargées."
        action={
          <Button variant="outline" onClick={() => void query.refetch()}>
            Réessayer
          </Button>
        }
      />
    );
  }

  const workspace = query.data!;
  if (!workspace.hasProfile) {
    return <NoProfile />;
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="text-sm text-muted-foreground">
          {workspace.usage
            ? `Offre ${workspace.usage.planCode.toUpperCase()} · ${workspace.usage.appCount}/${workspace.usage.appLimit} applications`
            : null}
        </div>
        <Button variant="hero" size="sm" onClick={() => setForm({ ...emptyForm })}>
          <Plus className="mr-1.5 h-4 w-4" /> Nouvelle application
        </Button>
      </div>

      {form && (
        <AppForm
          value={form}
          categories={workspace.categories}
          busy={save.isPending}
          onChange={setForm}
          onCancel={() => setForm(null)}
          onSubmit={() => save.mutate(form)}
        />
      )}

      {workspace.apps.length === 0 && !form && (
        <StateCard
          icon={<Package className="h-4 w-4 text-primary" />}
          title="Aucune application"
          text="Créez votre première fiche d'application, puis envoyez un APK ou convertissez votre PWA."
        />
      )}

      {workspace.apps.map((app) => (
        <AppCard
          key={app.id}
          app={app}
          onEdit={() =>
            setForm({
              id: app.id,
              name: app.name,
              slug: app.slug,
              category: app.category ?? "",
              shortDescription: app.shortDescription ?? "",
              description: app.description ?? "",
              pricingType: app.pricingType === "paid" ? "paid" : "free",
              priceFcfa: String(app.priceFcfa),
            })
          }
          onArchive={() => archive.mutate(app.id)}
          archiving={archive.isPending}
        />
      ))}
    </div>
  );
}

function saveError(code?: string): string {
  switch (code) {
    case "PLAN_APP_LIMIT_REACHED":
      return "Limite d'applications de votre offre atteinte.";
    case "SLUG_TAKEN":
      return "Cet identifiant est déjà utilisé.";
    case "NO_DEVELOPER_PROFILE":
      return "Activez d'abord votre profil développeur.";
    default:
      return "Enregistrement impossible.";
  }
}

const STATUS_LABELS: Record<string, string> = {
  draft: "Brouillon",
  in_review: "En revue",
  published: "Publiée",
  rejected: "Refusée",
  archived: "Archivée",
  suspended: "Suspendue",
};

function AppCard({
  app,
  onEdit,
  onArchive,
  archiving,
}: {
  app: DeveloperAppRow;
  onEdit: () => void;
  onArchive: () => void;
  archiving: boolean;
}) {
  return (
    <div className="surface-card rounded-2xl p-5">
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-secondary font-display text-sm font-semibold">
          {app.name.slice(0, 2).toUpperCase()}
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-display font-semibold">{app.name}</p>
          <p className="text-xs text-muted-foreground">
            v{app.version} · {app.downloads} installations ·{" "}
            {STATUS_LABELS[app.status] ?? app.status}
          </p>
          {app.rejectionReason && (
            <p className="mt-1 text-xs text-destructive">Motif : {app.rejectionReason}</p>
          )}
        </div>
        <Button variant="outline" size="sm" onClick={onEdit}>
          <Pencil className="mr-1.5 h-3.5 w-3.5" /> Modifier
        </Button>
        <Button variant="ghost" size="sm" onClick={onArchive} disabled={archiving}>
          <Trash2 className="mr-1.5 h-3.5 w-3.5" /> Archiver
        </Button>
      </div>

      {app.versions.length > 0 && (
        <>
          <Separator className="my-4" />
          <div className="space-y-2">
            {app.versions.map((v) => (
              <div
                key={v.id}
                className="flex flex-wrap items-center justify-between gap-2 text-sm"
              >
                <span className="font-medium">v{v.version}</span>
                <span className="text-muted-foreground">
                  {v.releaseNotesFr ?? STATUS_LABELS[v.status] ?? v.status}
                </span>
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
        </>
      )}
    </div>
  );
}

function AppForm({
  value,
  categories,
  busy,
  onChange,
  onCancel,
  onSubmit,
}: {
  value: AppFormState;
  categories: { slug: string; name: string }[];
  busy: boolean;
  onChange: (v: AppFormState) => void;
  onCancel: () => void;
  onSubmit: () => void;
}) {
  const set = (patch: Partial<AppFormState>) => onChange({ ...value, ...patch });

  return (
    <form
      className="surface-card space-y-4 rounded-2xl p-5"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit();
      }}
    >
      <h2 className="font-display text-lg font-semibold">
        {value.id ? "Modifier l'application" : "Nouvelle application"}
      </h2>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="a-name">Nom</Label>
          <Input
            id="a-name"
            value={value.name}
            onChange={(e) =>
              set({
                name: e.target.value,
                slug: value.id ? value.slug : slugify(e.target.value),
              })
            }
            required
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="a-slug">Identifiant public</Label>
          <Input
            id="a-slug"
            value={value.slug}
            onChange={(e) => set({ slug: e.target.value })}
            required
          />
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="a-cat">Catégorie</Label>
          <Select value={value.category} onValueChange={(v) => set({ category: v })}>
            <SelectTrigger id="a-cat">
              <SelectValue placeholder="Choisir" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((c) => (
                <SelectItem key={c.slug} value={c.slug}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="a-price">Prix (FCFA, 0 = gratuit)</Label>
          <Input
            id="a-price"
            type="number"
            min={0}
            value={value.priceFcfa}
            onChange={(e) =>
              set({
                priceFcfa: e.target.value,
                pricingType: Number(e.target.value) > 0 ? "paid" : "free",
              })
            }
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="a-short">Description courte</Label>
        <Input
          id="a-short"
          maxLength={160}
          value={value.shortDescription}
          onChange={(e) => set({ shortDescription: e.target.value })}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="a-desc">Description</Label>
        <Textarea
          id="a-desc"
          rows={4}
          value={value.description}
          onChange={(e) => set({ description: e.target.value })}
        />
      </div>

      <div className="flex gap-2">
        <Button type="submit" variant="hero" disabled={busy}>
          {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Enregistrer
        </Button>
        <Button type="button" variant="ghost" onClick={onCancel}>
          Annuler
        </Button>
      </div>
    </form>
  );
}

/* -------------------------------------------------------------------------- */
/* Onglet : statistiques réelles                                              */
/* -------------------------------------------------------------------------- */

function StatsPanel() {
  const isAuthenticated = useSupabaseSession();
  const stats = useQuery({
    queryKey: ["dev-stats"],
    queryFn: () => getDevStats(),
    enabled: isAuthenticated === true,
  });

  const max = useMemo(
    () => Math.max(1, ...(stats.data?.installs7d ?? []).map((d) => d.value)),
    [stats.data],
  );

  if (isAuthenticated === false) return <SignedOut />;
  if (isAuthenticated === null || stats.isLoading) return <LoadingCard />;
  if (stats.isError) {
    return (
      <StateCard
        icon={<AlertTriangle className="h-4 w-4 text-destructive" />}
        title="Statistiques indisponibles"
        text="Les statistiques n'ont pas pu être chargées."
        action={
          <Button variant="outline" onClick={() => void stats.refetch()}>
            Réessayer
          </Button>
        }
      />
    );
  }

  const data = stats.data!;
  if (!data.hasProfile) {
    return (
      <StateCard
        icon={<Package className="h-4 w-4 text-primary" />}
        title="Aucune donnée"
        text="Activez votre espace développeur et publiez une application pour suivre vos installations."
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="surface-card rounded-2xl p-6">
        <h2 className="font-display text-lg font-semibold">
          Installations — 7 derniers jours
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {data.totalInstalls} installation{data.totalInstalls > 1 ? "s" : ""} au total
        </p>
        <div className="mt-6 flex h-48 items-end gap-3">
          {data.installs7d.map((d) => (
            <div key={d.day} className="flex flex-1 flex-col items-center gap-2">
              <div
                className="w-full rounded-t-lg bg-gradient-brand"
                style={{ height: `${Math.max(2, (d.value / max) * 100)}%` }}
                title={`${d.value} installations`}
              />
              <span className="text-xs text-muted-foreground">{d.label}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="surface-card rounded-2xl p-6">
        <h2 className="font-display text-lg font-semibold">Versions à surveiller</h2>
        {data.riskyVersions.length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">
            Aucun taux de crash remonté sur vos versions.
          </p>
        ) : (
          <ul className="mt-3 space-y-2 text-sm">
            {data.riskyVersions.map((v) => (
              <li key={`${v.appName}-${v.version}`} className="flex justify-between gap-3">
                <span>
                  {v.appName} — v{v.version}
                </span>
                <span className={v.crashRate > 3 ? "text-destructive" : "text-muted-foreground"}>
                  crash {v.crashRate}%
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

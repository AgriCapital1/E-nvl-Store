import { useCallback, useEffect, useRef, useState } from "react";
import {
  Globe,
  Loader2,
  Check,
  Package,
  Download,
  RotateCcw,
  ImagePlus,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useI18n } from "@/lib/i18n";
import { CATEGORIES } from "@/lib/mock-data";

const STEP_KEYS = [
  "pwa.step.detect",
  "pwa.step.manifest",
  "pwa.step.icons",
  "pwa.step.shots",
  "pwa.step.wrap",
  "pwa.step.build",
  "pwa.step.sign",
] as const;

const STEP_DETAILS: Record<string, string> = {
  "pwa.step.detect": "HTTPS OK · service-worker.js trouvé · display: standalone",
  "pwa.step.manifest": "manifest.json · theme_color #16a34a · start_url /",
  "pwa.step.icons": "maskable 512×512 · adaptive-icon générée · 6 densités",
  "pwa.step.shots": "4 captures 1080×1920 capturées en émulateur Pixel",
  "pwa.step.wrap": "Trusted Web Activity + fallback WebView, offline cache",
  "pwa.step.build": "assembleRelease · minSdk 21 · targetSdk 34",
  "pwa.step.sign": "v2/v3 signature · 0 menace détectée",
};

type Phase = "idle" | "running" | "done";

function cleanHost(raw: string) {
  const v = raw.trim().replace(/^https?:\/\//i, "").replace(/\/.*$/, "");
  return v.toLowerCase();
}

function guessName(host: string) {
  const parts = host.split(".").filter((p) => p !== "www");
  const base = parts[0] === "app" && parts[1] ? parts[1] : (parts[0] ?? "app");
  return base
    .split(/[-_]/)
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
    .join(" ");
}

export function PwaConverter() {
  const { t } = useI18n();
  const [url, setUrl] = useState("");
  const [phase, setPhase] = useState<Phase>("idle");
  const [stepIndex, setStepIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  const [name, setName] = useState("");
  const [tagline, setTagline] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<string>("Productivité");
  const [price, setPrice] = useState("0");

  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  const start = useCallback(() => {
    const host = cleanHost(url);
    if (!/^[a-z0-9-]+(\.[a-z0-9-]+)+$/.test(host)) {
      toast.error(t("pwa.invalid"));
      return;
    }
    timers.current.forEach(clearTimeout);
    timers.current = [];
    setPhase("running");
    setStepIndex(0);
    setProgress(0);

    STEP_KEYS.forEach((_, i) => {
      timers.current.push(
        setTimeout(
          () => {
            setStepIndex(i + 1);
            setProgress(Math.round(((i + 1) / STEP_KEYS.length) * 100));
          },
          (i + 1) * 900,
        ),
      );
    });

    timers.current.push(
      setTimeout(
        () => {
          const guessed = guessName(host);
          setName(guessed);
          setTagline(`${guessed}, maintenant en application Android`);
          setDescription(
            `Version Android officielle de ${host}. Conversion automatique de la PWA en APK signé : mode hors-ligne, notifications push, raccourci sur l'écran d'accueil et mises à jour instantanées sans réinstallation.`,
          );
          setPhase("done");
          toast.success(t("pwa.done"));
        },
        STEP_KEYS.length * 900 + 400,
      ),
    );
  }, [url, t]);

  function reset() {
    timers.current.forEach(clearTimeout);
    setPhase("idle");
    setStepIndex(0);
    setProgress(0);
    setUrl("");
  }

  const host = cleanHost(url);
  const initials = (name || host || "AP").slice(0, 2).toUpperCase();

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
                onKeyDown={(e) => e.key === "Enter" && phase !== "running" && start()}
                placeholder="app.agricapital.ci"
                className="pl-9"
                disabled={phase === "running"}
              />
            </div>
          </div>
          <Button variant="hero" size="lg" onClick={start} disabled={phase === "running"}>
            {phase === "running" ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> {t("pwa.running")}
              </>
            ) : (
              <>
                <Package className="mr-2 h-4 w-4" /> {t("pwa.start")}
              </>
            )}
          </Button>
        </div>
      </div>

      {phase !== "idle" && (
        <div className="surface-card rounded-2xl p-6">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium">
              {phase === "done" ? t("pwa.done") : t("pwa.running")} · {host}
            </span>
            <span className="text-muted-foreground">{progress}%</span>
          </div>
          <Progress value={progress} className="mt-3" />

          <ol className="mt-5 space-y-3">
            {STEP_KEYS.map((key, i) => {
              const state = i < stepIndex ? "done" : i === stepIndex ? "active" : "todo";
              return (
                <li key={key} className="flex items-start gap-3">
                  <span
                    className={
                      "mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-xs " +
                      (state === "done"
                        ? "border-primary bg-primary text-primary-foreground"
                        : state === "active"
                          ? "border-primary text-primary"
                          : "border-border text-muted-foreground")
                    }
                  >
                    {state === "done" ? (
                      <Check className="h-3.5 w-3.5" />
                    ) : state === "active" ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      i + 1
                    )}
                  </span>
                  <div className="min-w-0">
                    <p
                      className={
                        "text-sm " + (state === "todo" ? "text-muted-foreground" : "font-medium")
                      }
                    >
                      {t(key)}
                    </p>
                    {state !== "todo" && (
                      <p className="text-xs text-muted-foreground">{STEP_DETAILS[key]}</p>
                    )}
                  </div>
                </li>
              );
            })}
          </ol>
        </div>
      )}

      {phase === "done" && (
        <div className="surface-card rounded-2xl p-6">
          <h3 className="font-display text-lg font-semibold">{t("pwa.editTitle")}</h3>
          <p className="mt-1 text-xs text-muted-foreground">{t("pwa.detected")} · {host}</p>

          <div className="mt-5 grid gap-5 lg:grid-cols-[220px_1fr]">
            <div>
              <Label className="text-xs">{t("pwa.icons")}</Label>
              <div className="mt-2 flex items-center gap-3">
                <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-brand font-display text-2xl font-bold text-primary-foreground shadow-glow">
                  {initials}
                </div>
                <Button variant="outline" size="sm" onClick={() => toast.success(t("pwa.replaceIcon"))}>
                  <ImagePlus className="mr-1.5 h-3.5 w-3.5" /> {t("pwa.replaceIcon")}
                </Button>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="pwa-name">{t("pwa.appName")}</Label>
                <Input id="pwa-name" value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="pwa-tagline">{t("pwa.tagline")}</Label>
                <Input
                  id="pwa-tagline"
                  value={tagline}
                  onChange={(e) => setTagline(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label>{t("pwa.category")}</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="pwa-price">{t("pwa.price")}</Label>
                <Input
                  id="pwa-price"
                  inputMode="numeric"
                  value={price}
                  onChange={(e) => setPrice(e.target.value.replace(/\D/g, ""))}
                />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="pwa-desc">{t("pwa.desc")}</Label>
                <Textarea
                  id="pwa-desc"
                  rows={4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>
            </div>
          </div>

          <Separator className="my-6" />

          <div className="flex flex-wrap items-center justify-between gap-3">
            <Label className="text-xs">{t("pwa.shots")}</Label>
            <Button variant="outline" size="sm" onClick={() => toast.success(t("pwa.replaceShots"))}>
              <ImagePlus className="mr-1.5 h-3.5 w-3.5" /> {t("pwa.replaceShots")}
            </Button>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="aspect-9/16 rounded-xl border border-border bg-gradient-to-b from-primary/10 to-transparent"
                aria-label={`Capture ${i}`}
              />
            ))}
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <Button variant="hero" onClick={() => toast.success(t("pwa.published"))}>
              {t("pwa.publish")}
            </Button>
            <Button
              variant="outline"
              onClick={() => toast.success(`${name.replace(/\s+/g, "-").toLowerCase()}-1.0.0.apk`)}
            >
              <Download className="mr-1.5 h-3.5 w-3.5" /> {t("pwa.download")}
            </Button>
            <Button variant="ghost" onClick={reset}>
              <RotateCcw className="mr-1.5 h-3.5 w-3.5" /> {t("pwa.restart")}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

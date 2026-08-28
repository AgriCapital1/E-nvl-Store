import { Link } from "@tanstack/react-router";
import { Copy, ExternalLink } from "lucide-react";
import { toast } from "sonner";
const logo = { url: "/logo.png" };
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { useI18n } from "@/lib/i18n";
import { DEV_PROFILE } from "@/lib/mock-data";
import { DEV_HOST } from "@/lib/site";

/**
 * Coquille de l'espace développeur (dev.envle.app).
 * Layout, navigation et ton distincts du store grand public.
 */
export function DevHeader() {
  const { t } = useI18n();

  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-foreground text-background">
      <div className="mx-auto flex h-14 w-full max-w-6xl items-center gap-3 px-4 sm:h-16">
        <Link to="/dev" className="flex items-center gap-2">
          <img src={logo.url} alt="E'nvlé Developers" className="h-8 w-8 object-contain" />
          <span className="font-display text-sm font-semibold tracking-tight sm:text-base">
            E'nvlé <span className="text-gradient-brand">Developers</span>
          </span>
        </Link>

        <span className="ml-3 hidden rounded-full border border-background/25 px-2.5 py-1 font-mono text-[11px] text-background/70 md:inline">
          {DEV_HOST}
        </span>

        <div className="ml-auto flex items-center gap-2">
          <button
            type="button"
            onClick={() => toast.success("Token API copié")}
            className="hidden items-center gap-2 rounded-lg border border-background/25 px-3 py-1.5 font-mono text-[11px] text-background/80 transition-colors hover:text-background sm:flex"
          >
            {DEV_PROFILE.apiToken}
            <Copy className="h-3.5 w-3.5" />
          </button>
          <a
            href="https://docs.envle.app"
            target="_blank"
            rel="noreferrer"
            className="hidden items-center gap-1.5 text-xs text-background/70 transition-colors hover:text-background md:flex"
          >
            {t("dev.nav.docs")} <ExternalLink className="h-3.5 w-3.5" />
          </a>
          <LanguageSwitcher />
        </div>
      </div>
    </header>
  );
}

export function DevFooter() {
  const { t } = useI18n();
  return (
    <footer className="mt-16 border-t border-border/60 py-8">
      <div className="mx-auto w-full max-w-6xl px-4 text-sm text-muted-foreground">
        <p className="text-foreground">E'nvlé Developers</p>
        <p>{t("dev.footer")}</p>
      </div>
    </footer>
  );
}

export function DevShell({ children }: { children: React.ReactNode }) {
  const { t } = useI18n();

  return (
    <div className="min-h-screen">
      <DevHeader />
      <section className="border-b border-border/60 bg-secondary/50">
        <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:py-14">
          <h1 className="max-w-2xl font-display text-3xl font-bold leading-tight tracking-tight sm:text-4xl">
            {t("dev.headline")}
          </h1>
          <p className="mt-3 max-w-xl text-sm text-muted-foreground sm:text-base">{t("dev.sub")}</p>
          <p className="mt-4 text-xs text-muted-foreground">
            {DEV_PROFILE.name} · {DEV_PROFILE.whatsapp}
          </p>
        </div>
      </section>
      <main className="mx-auto w-full max-w-6xl px-4 py-8">{children}</main>
      <DevFooter />
    </div>
  );
}

import { Link } from "@tanstack/react-router";
import { Home, LayoutGrid } from "lucide-react";
const logo = { url: "/logo.png" };
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { useI18n } from "@/lib/i18n";

/**
 * Coquille du store grand public (envle.app).
 * Aucune référence à l'espace développeur, à la publication ou à l'hébergement.
 */
export function StoreHeader() {
  const { t } = useI18n();

  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/85 backdrop-blur-xl">
      <div className="mx-auto flex h-14 w-full max-w-5xl items-center gap-3 px-4 sm:h-16">
        <Link to="/" className="flex items-center gap-2">
          <img src={logo.url} alt="E'nvlé Store" className="h-8 w-8 object-contain sm:h-9 sm:w-9" />
          <span className="font-display text-base font-semibold tracking-tight">
            E'nvlé <span className="text-gradient-brand">Store</span>
          </span>
        </Link>

        <nav className="ml-auto hidden items-center gap-1 text-sm sm:flex">
          <Link
            to="/"
            activeOptions={{ exact: true }}
            activeProps={{ className: "bg-secondary text-foreground" }}
            className="rounded-lg px-3 py-2 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          >
            {t("nav.home")}
          </Link>
          <Link
            to="/categories"
            activeProps={{ className: "bg-secondary text-foreground" }}
            className="rounded-lg px-3 py-2 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          >
            {t("nav.categories")}
          </Link>
        </nav>

        <div className="ml-auto sm:ml-2">
          <LanguageSwitcher />
        </div>
      </div>
    </header>
  );
}

/** Barre de navigation mobile (mobile-first, façon store). */
export function StoreTabBar() {
  const { t } = useI18n();
  const item =
    "flex flex-1 flex-col items-center gap-1 py-2 text-[11px] text-muted-foreground transition-colors";

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border/60 bg-background/95 backdrop-blur-xl sm:hidden">
      <div className="mx-auto flex max-w-lg">
        <Link
          to="/"
          activeOptions={{ exact: true }}
          activeProps={{ className: "text-primary" }}
          className={item}
        >
          <Home className="h-5 w-5" />
          {t("nav.home")}
        </Link>
        <Link to="/categories" activeProps={{ className: "text-primary" }} className={item}>
          <LayoutGrid className="h-5 w-5" />
          {t("nav.categories")}
        </Link>
      </div>
    </nav>
  );
}

export function StoreFooter() {
  const { t } = useI18n();

  return (
    <footer className="mt-16 border-t border-border/60 py-8 pb-24 sm:pb-8">
      <div className="mx-auto flex w-full max-w-5xl flex-col items-center gap-1 px-4 text-center text-sm text-muted-foreground">
        <img src={logo.url} alt="E'nvlé Store" className="mb-2 h-10 w-10 object-contain" />
        <p className="text-foreground">E'nvlé Store — Daloa, Côte d'Ivoire</p>

        <p>{t("footer.tagline")}</p>
        <p className="mt-2 text-xs">© {new Date().getFullYear()} E'nvlé. {t("footer.rights")}</p>
      </div>
    </footer>
  );
}

/** Layout complet du store public. */
export function StoreShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen">
      <StoreHeader />
      <main className="mx-auto w-full max-w-5xl px-4">{children}</main>
      <StoreFooter />
      <StoreTabBar />
    </div>
  );
}

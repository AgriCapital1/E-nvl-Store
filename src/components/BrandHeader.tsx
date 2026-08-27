import { Link } from "@tanstack/react-router";
import logo from "@/assets/envle-store-symbol.png.asset.json";

export function BrandHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center gap-4 px-4">
        <Link to="/" className="flex items-center gap-2">
          <img
            src={logo.url}
            alt="Logo E'nvlé Store"
            className="h-9 w-9 object-contain"
          />
          <span className="font-display text-base font-semibold tracking-tight">
            E'nvlé <span className="text-gradient-brand">Store</span>
          </span>
        </Link>


        <nav className="ml-auto flex items-center gap-1 text-sm">
          <Link
            to="/"
            className="rounded-lg px-3 py-2 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
            activeOptions={{ exact: true }}
            activeProps={{ className: "bg-secondary text-foreground" }}
          >
            Catalogue
          </Link>
          <Link
            to="/dev"
            className="rounded-lg px-3 py-2 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
            activeProps={{ className: "bg-secondary text-foreground" }}
          >
            Espace dev
          </Link>
        </nav>
      </div>
    </header>
  );
}

export function BrandFooter() {
  return (
    <footer className="mt-20 border-t border-border/60 py-8">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-1 px-4 text-sm text-muted-foreground">
        <p className="text-foreground">E'nvlé AppHub — Abidjan, Côte d'Ivoire</p>
        <p>30 minutes pour héberger. L'installer, c'est l'avoir.</p>
      </div>
    </footer>
  );
}

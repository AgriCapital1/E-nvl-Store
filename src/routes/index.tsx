import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Search, Zap, ShieldCheck, Smartphone, Flame } from "lucide-react";
import { BrandFooter, BrandHeader } from "@/components/BrandHeader";
import { AppTile } from "@/components/AppTile";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { APPS, CATEGORIES, formatCount } from "@/lib/mock-data";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "E'nvlé AppHub — Le store d'apps africain, installation en 1 clic" },
      {
        name: "description",
        content:
          "Découvrez et installez les apps créées en Côte d'Ivoire : téléchargement automatique, paiement mobile money, aucune carte bancaire requise.",
      },
      { property: "og:title", content: "E'nvlé AppHub — Installer, c'est l'avoir" },
      {
        property: "og:description",
        content:
          "Catalogue d'apps africaines vérifiées. Installation automatique en un clic, paiement mobile money.",
      },
    ],
  }),
  component: Catalog,
});

type PriceFilter = "all" | "free" | "paid";

function Catalog() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<string | null>(null);
  const [price, setPrice] = useState<PriceFilter>("all");

  const trending = useMemo(
    () => [...APPS].sort((a, b) => b.downloads24h - a.downloads24h).slice(0, 3),
    [],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return APPS.filter((a) => {
      if (category && a.category !== category) return false;
      if (price === "free" && a.priceFcfa > 0) return false;
      if (price === "paid" && a.priceFcfa === 0) return false;
      if (!q) return true;
      return (
        a.name.toLowerCase().includes(q) ||
        a.developer.toLowerCase().includes(q) ||
        a.tagline.toLowerCase().includes(q) ||
        a.category.toLowerCase().includes(q)
      );
    });
  }, [query, category, price]);

  return (
    <div className="min-h-screen">
      <BrandHeader />

      <main className="mx-auto w-full max-w-6xl px-4">
        <section className="py-14 sm:py-20">
          <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs text-primary">
            <Zap className="h-3.5 w-3.5" /> 30 minutes pour héberger
          </p>
          <h1 className="max-w-3xl font-display text-4xl font-bold leading-tight tracking-tight sm:text-6xl">
            L'installer, <span className="text-gradient-brand">c'est l'avoir.</span>
          </h1>
          <p className="mt-4 max-w-xl text-base text-muted-foreground">
            Le store des apps africaines. Un clic : téléchargement, installation et raccourci
            sur l'écran d'accueil. Pas de carte bancaire, pas d'attente.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Button variant="hero" size="xl" asChild>
              <a href="#catalogue">Explorer le catalogue</a>
            </Button>
            <Button variant="outline" size="xl" asChild>
              <Link to="/dev">Publier mon APK</Link>
            </Button>
          </div>

          <dl className="mt-12 grid max-w-2xl grid-cols-2 gap-6 sm:grid-cols-3">
            {[
              { icon: Smartphone, k: "Installations", v: "387k" },
              { icon: ShieldCheck, k: "Apps vérifiées", v: "5 / 6" },
              { icon: Flame, k: "Téléchargements 24 h", v: "13k" },
            ].map(({ icon: Icon, k, v }) => (
              <div key={k}>
                <dt className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Icon className="h-3.5 w-3.5 text-primary" /> {k}
                </dt>
                <dd className="mt-1 font-display text-2xl font-semibold">{v}</dd>
              </div>
            ))}
          </dl>
        </section>

        <section aria-labelledby="trending" className="pb-4">
          <h2 id="trending" className="font-display text-lg font-semibold">
            Tendances aujourd'hui
          </h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            {trending.map((app, i) => (
              <Link
                key={app.id}
                to="/app/$appId"
                params={{ appId: app.id }}
                className="surface-card flex items-center gap-3 rounded-2xl p-4 transition-colors hover:border-primary/50"
              >
                <span className="font-display text-2xl font-bold text-gradient-brand">
                  {i + 1}
                </span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{app.name}</p>
                  <p className="text-xs text-muted-foreground">
                    +{formatCount(app.downloads24h)} installs / 24 h
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </section>

        <section id="catalogue" aria-labelledby="catalogue-title" className="scroll-mt-20 py-10">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <h2 id="catalogue-title" className="font-display text-lg font-semibold">
              Catalogue
            </h2>
            <div className="relative w-full max-w-xs">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Rechercher une app, un dev…"
                className="pl-9"
                aria-label="Rechercher une application"
              />
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <FilterChip active={!category} onClick={() => setCategory(null)}>
              Toutes
            </FilterChip>
            {CATEGORIES.map((c) => (
              <FilterChip key={c} active={category === c} onClick={() => setCategory(c)}>
                {c}
              </FilterChip>
            ))}
            <span className="mx-1 hidden w-px bg-border sm:block" />
            {(
              [
                ["all", "Tous les prix"],
                ["free", "Gratuit"],
                ["paid", "Payant"],
              ] as const
            ).map(([k, label]) => (
              <FilterChip key={k} active={price === k} onClick={() => setPrice(k)}>
                {label}
              </FilterChip>
            ))}
          </div>

          {filtered.length === 0 ? (
            <p className="mt-10 text-sm text-muted-foreground">
              Aucune app ne correspond à cette recherche.
            </p>
          ) : (
            <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map((app) => (
                <AppTile key={app.id} app={app} />
              ))}
            </div>
          )}
        </section>
      </main>

      <BrandFooter />
    </div>
  );
}

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        "rounded-full border px-3 py-1.5 text-xs transition-colors " +
        (active
          ? "border-primary/60 bg-primary/15 text-primary"
          : "border-border text-muted-foreground hover:border-primary/40 hover:text-foreground")
      }
    >
      {children}
    </button>
  );
}

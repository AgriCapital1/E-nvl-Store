import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Search, Star, Sparkles, Flame } from "lucide-react";
import { AppTile, AppIcon } from "@/components/AppTile";
import { StoreShell } from "@/components/StoreShell";
import { Input } from "@/components/ui/input";
import { useI18n } from "@/lib/i18n";
import { APPS, CATEGORIES, formatCount } from "@/lib/mock-data";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "E'nvlé Store — Découvrez et installez vos applications" },
      {
        name: "description",
        content:
          "Cherchez, découvrez et installez des applications en un clic : tendances, catégories, nouveautés et applications populaires.",
      },
      { property: "og:title", content: "E'nvlé Store — Découvrez et installez vos applications" },
      {
        property: "og:description",
        content: "Tendances, catégories et nouveautés : trouvez l'application qu'il vous faut.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: HomePage,
});

function HomePage() {
  const { t } = useI18n();
  const [query, setQuery] = useState("");

  const q = query.trim().toLowerCase();

  const results = useMemo(() => {
    if (!q) return [];
    return APPS.filter(
      (a) =>
        a.name.toLowerCase().includes(q) ||
        a.tagline.toLowerCase().includes(q) ||
        a.category.toLowerCase().includes(q),
    );
  }, [q]);

  const trending = useMemo(
    () => [...APPS].sort((a, b) => b.downloads24h - a.downloads24h).slice(0, 3),
    [],
  );
  const popular = useMemo(() => [...APPS].sort((a, b) => b.downloads - a.downloads).slice(0, 6), []);
  const newest = useMemo(
    () => [...APPS].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)).slice(0, 3),
    [],
  );
  const editorial = APPS[0];

  return (
    <StoreShell>
      {/* Recherche + accroche */}
      <section className="pt-8 sm:pt-12">
        <h1 className="font-display text-3xl font-bold leading-tight tracking-tight sm:text-5xl">
          {t("home.title1")}{" "}
          <span className="text-gradient-brand">{t("home.title2")}</span>
        </h1>
        <p className="mt-3 max-w-xl text-sm text-muted-foreground sm:text-base">
          {t("home.subtitle")}
        </p>

        <div className="relative mt-6 max-w-xl">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("home.search")}
            className="h-12 pl-9"
            aria-label={t("home.search")}
          />
        </div>
      </section>

      {q ? (
        <section className="py-8" aria-label={t("home.results")}>
          <h2 className="font-display text-lg font-semibold">{t("home.results")}</h2>
          {results.length === 0 ? (
            <p className="mt-4 text-sm text-muted-foreground">{t("home.empty")}</p>
          ) : (
            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {results.map((app) => (
                <AppTile key={app.id} app={app} />
              ))}
            </div>
          )}
        </section>
      ) : (
        <>
          {/* Sélection du moment */}
          {editorial && (
            <section className="py-8">
              <h2 className="flex items-center gap-2 font-display text-lg font-semibold">
                <Sparkles className="h-4 w-4 text-primary" /> {t("home.editorial")}
              </h2>
              <Link
                to="/app/$appId"
                params={{ appId: editorial.id }}
                className="surface-card mt-4 flex flex-col gap-4 rounded-2xl p-5 shadow-card transition-colors hover:border-primary/50 sm:flex-row sm:items-center"
              >
                <AppIcon app={editorial} size="lg" />
                <div className="min-w-0">
                  <p className="font-display text-lg font-semibold">{editorial.name}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{editorial.tagline}</p>
                  <p className="mt-2 text-xs text-muted-foreground">{t("home.editorialText")}</p>
                </div>
              </Link>
            </section>
          )}

          {/* Tendances */}
          <section className="py-4">
            <h2 className="flex items-center gap-2 font-display text-lg font-semibold">
              <Flame className="h-4 w-4 text-primary" /> {t("home.trending")}
            </h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
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
                    <p className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Star className="h-3 w-3 fill-accent text-accent" />
                      {app.rating.toFixed(1)} · {formatCount(app.downloads)}{" "}
                      {t("app.downloads")}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </section>

          {/* Catégories */}
          <section className="py-8">
            <div className="flex items-center justify-between gap-3">
              <h2 className="font-display text-lg font-semibold">{t("home.categories")}</h2>
              <Link to="/categories" className="text-xs text-primary hover:underline">
                {t("home.seeAll")}
              </Link>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {CATEGORIES.map((c) => (
                <Link
                  key={c}
                  to="/categories"
                  search={{ c }}
                  className="rounded-full border border-border px-4 py-2 text-sm text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                >
                  {c}
                </Link>
              ))}
            </div>
          </section>

          {/* Populaires */}
          <section className="py-4">
            <h2 className="font-display text-lg font-semibold">{t("home.popular")}</h2>
            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {popular.map((app) => (
                <AppTile key={app.id} app={app} />
              ))}
            </div>
          </section>

          {/* Nouveautés */}
          <section className="py-8">
            <h2 className="font-display text-lg font-semibold">{t("home.new")}</h2>
            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {newest.map((app) => (
                <AppTile key={app.id} app={app} />
              ))}
            </div>
          </section>
        </>
      )}
    </StoreShell>
  );
}

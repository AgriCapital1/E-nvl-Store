import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { AppTile } from "@/components/AppTile";
import { StoreShell } from "@/components/StoreShell";
import { useI18n } from "@/lib/i18n";
import type { AppItem, CategoryItem } from "@/lib/catalog-types";
import { listCatalogApps, listCatalogCategories } from "@/lib/catalog.functions";

export const Route = createFileRoute("/categories")({
  loader: async (): Promise<{ remote: AppItem[]; categories: CategoryItem[] }> => {
    try {
      const [remote, categories] = await Promise.all([
        listCatalogApps(),
        listCatalogCategories(),
      ]);
      return { remote, categories };
    } catch {
      return { remote: [], categories: [] };
    }
  },

  head: () => ({
    meta: [
      { title: "Catégories — E'nvlé Store" },
      {
        name: "description",
        content:
          "Parcourez les applications par univers : jeux, productivité, éducation, finance, social et transport.",
      },
      { property: "og:title", content: "Catégories — E'nvlé Store" },
      {
        property: "og:description",
        content: "Trouvez l'application qu'il vous faut, par catégorie.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: CategoriesPage,
});

function CategoriesPage() {
  const { t } = useI18n();
  const data = Route.useLoaderData();
  const allApps: AppItem[] = data?.remote ?? [];
  const categories = useMemo(() => {
    const set = new Set<string>([
      ...(data?.categories ?? []).map((c) => c.name),
      ...allApps.map((a) => a.category),
    ]);
    return [...set];
  }, [data, allApps]);
  const [active, setActive] = useState<string>("");
  const current = active || categories[0] || "";
  const apps = allApps.filter((a) => a.category === current);


  return (
    <StoreShell>
      <section className="py-8">
        <h1 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">
          {t("cat.title")}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">{t("cat.subtitle")}</p>

        <div className="mt-6 -mx-4 flex gap-2 overflow-x-auto px-4 pb-2 sm:mx-0 sm:flex-wrap sm:px-0">
          {categories.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setActive(c)}
              className={
                "shrink-0 rounded-full border px-4 py-2 text-sm transition-colors " +
                (current === c
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border text-muted-foreground hover:bg-secondary hover:text-foreground")
              }
            >
              {c}
            </button>
          ))}
        </div>

        <p className="mt-4 text-xs text-muted-foreground">
          {apps.length} {t("cat.apps")}
        </p>

        {apps.length === 0 ? (
          <p className="mt-10 text-sm text-muted-foreground">{t("home.empty")}</p>
        ) : (
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {apps.map((app) => (
              <AppTile key={app.id} app={app} />
            ))}
          </div>
        )}
      </section>
    </StoreShell>
  );
}

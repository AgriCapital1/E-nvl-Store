import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AppTile } from "@/components/AppTile";
import { StoreShell } from "@/components/StoreShell";
import { useI18n } from "@/lib/i18n";
import { APPS, CATEGORIES } from "@/lib/mock-data";

export const Route = createFileRoute("/categories")({
  head: () => ({
    meta: [
      { title: "Catégories d'apps — E'nvlé Store" },
      {
        name: "description",
        content:
          "Parcourez les apps africaines par catégorie : jeux, productivité, éducation, finance, social et transport.",
      },
      { property: "og:title", content: "Catégories d'apps — E'nvlé Store" },
      {
        property: "og:description",
        content: "Explorez le catalogue E'nvlé par catégorie et installez en un clic.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: CategoriesPage,
});

function CategoriesPage() {
  const { t } = useI18n();
  const [active, setActive] = useState<string>(CATEGORIES[0]);
  const apps = APPS.filter((a) => a.category === active);

  return (
    <StoreShell>
      <section className="py-8">
        <h1 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">
          {t("nav.categories")}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">{t("home.categories")}</p>

        <div className="mt-6 flex flex-wrap gap-2">
          {CATEGORIES.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setActive(c)}
              className={
                "rounded-full border px-4 py-2 text-sm transition-colors " +
                (active === c
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border text-muted-foreground hover:bg-secondary hover:text-foreground")
              }
            >
              {c}
            </button>
          ))}
        </div>

        {apps.length === 0 ? (
          <p className="mt-10 text-sm text-muted-foreground">{t("cat.empty")}</p>
        ) : (
          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {apps.map((app) => (
              <AppTile key={app.id} app={app} />
            ))}
          </div>
        )}
      </section>
    </StoreShell>
  );
}

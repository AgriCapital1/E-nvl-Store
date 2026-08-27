import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, Download, ShieldCheck, Clock, Star, HardDrive } from "lucide-react";
import { AppIcon } from "@/components/AppTile";
import { InstallDialog } from "@/components/InstallDialog";
import { ReviewsSection } from "@/components/ReviewsSection";
import { StoreShell } from "@/components/StoreShell";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useI18n } from "@/lib/i18n";
import { getApp, formatFcfa, formatCount, type AppItem } from "@/lib/mock-data";

export const Route = createFileRoute("/app/$appId")({
  loader: ({ params }) => {
    const app = getApp(params.appId);
    if (!app) throw notFound();
    return { app };
  },
  head: ({ loaderData }) => {
    if (!loaderData) {
      return {
        meta: [
          { title: "Application indisponible — E'nvlé Store" },
          { name: "robots", content: "noindex" },
        ],
      };
    }
    const { app } = loaderData;
    const title = `${app.name} — ${app.tagline} | E'nvlé Store`;
    return {
      meta: [
        { title },
        { name: "description", content: app.description.slice(0, 155) },
        { property: "og:title", content: title },
        { property: "og:description", content: app.description.slice(0, 155) },
        { property: "og:type", content: "website" },
        { name: "twitter:card", content: "summary_large_image" },
      ],
    };
  },
  notFoundComponent: AppNotFound,
  errorComponent: AppNotFound,
  component: AppDetail,
});

function AppNotFound() {
  const { t } = useI18n();
  return (
    <StoreShell>
      <div className="py-24 text-center">
        <h1 className="font-display text-2xl font-semibold">{t("app.notFound")}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{t("app.notFoundText")}</p>
        <Button variant="hero" className="mt-6" asChild>
          <Link to="/">{t("app.backHome")}</Link>
        </Button>
      </div>
    </StoreShell>
  );
}

function AppDetail() {
  const { app } = Route.useLoaderData() as { app: AppItem };
  const { t } = useI18n();
  const [installing, setInstalling] = useState(false);

  return (
    <StoreShell>
      <div className="py-6">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> {t("app.back")}
        </Link>

        <div className="mt-6 grid gap-8 lg:grid-cols-[1fr_320px]">
          <div>
            <div className="flex flex-wrap items-start gap-5">
              <AppIcon app={app} size="lg" />
              <div className="min-w-0 flex-1">
                <h1 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">
                  {app.name}
                </h1>
                <p className="mt-1 text-sm text-muted-foreground">
                  {app.developer} · {app.category}
                </p>
                <div className="mt-3 flex flex-wrap items-center gap-4 text-sm">
                  <span className="flex items-center gap-1">
                    <Star className="h-4 w-4 fill-accent text-accent" />
                    {app.rating.toFixed(1)}{" "}
                    <span className="text-muted-foreground">({app.reviewsCount})</span>
                  </span>
                  <span className="flex items-center gap-1 text-muted-foreground">
                    <Download className="h-4 w-4" /> {formatCount(app.downloads)}{" "}
                    {t("app.downloads")}
                  </span>
                  <span className="flex items-center gap-1 text-muted-foreground">
                    <HardDrive className="h-4 w-4" /> {app.sizeMb} Mo
                  </span>
                  {app.scan === "verified" ? (
                    <span className="flex items-center gap-1 text-primary">
                      <ShieldCheck className="h-4 w-4" /> {t("app.verified")}
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-warning">
                      <Clock className="h-4 w-4" /> {t("app.pending")}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Mobile install bar */}
            <div className="mt-6 lg:hidden">
              <Button
                variant="hero"
                size="xl"
                className="w-full"
                onClick={() => setInstalling(true)}
              >
                {t("app.install")} · {formatFcfa(app.priceFcfa)}
              </Button>
            </div>

            <section className="mt-8">
              <h2 className="font-display text-lg font-semibold">{t("app.screenshots")}</h2>
              <div className="mt-3 -mx-4 flex gap-3 overflow-x-auto px-4 sm:mx-0 sm:grid sm:grid-cols-4 sm:px-0">
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className="surface-card aspect-9/16 w-32 shrink-0 rounded-xl bg-gradient-to-b from-primary/10 to-transparent sm:w-auto"
                    aria-label={`${t("app.screenshots")} ${i} — ${app.name}`}
                  />
                ))}
              </div>
            </section>

            <section className="mt-10">
              <h2 className="font-display text-lg font-semibold">{t("app.description")}</h2>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                {app.description}
              </p>
            </section>

            <section className="mt-10">
              <h2 className="font-display text-lg font-semibold">{t("app.permissions")}</h2>
              <ul className="mt-3 grid gap-2 sm:grid-cols-2">
                {app.permissions.map((p) => (
                  <li
                    key={p}
                    className="surface-card rounded-xl px-3 py-2 text-sm text-muted-foreground"
                  >
                    {p}
                  </li>
                ))}
              </ul>
            </section>

            <section className="mt-10">
              <h2 className="font-display text-lg font-semibold">{t("app.whatsnew")}</h2>
              <div className="mt-3 space-y-3">
                {app.versions.slice(0, 3).map((v) => (
                  <div key={v.version} className="surface-card rounded-xl p-4">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">
                        {t("app.version")} {v.version}
                      </span>
                      <span className="text-xs text-muted-foreground">{v.date}</span>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">{v.notes}</p>
                  </div>
                ))}
              </div>
            </section>

            <ReviewsSection app={app} />
          </div>

          <aside className="hidden lg:sticky lg:top-24 lg:block lg:h-fit">
            <div className="surface-card rounded-2xl p-5 shadow-card">
              <p className="font-display text-2xl font-semibold">{formatFcfa(app.priceFcfa)}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {t("app.version")} {app.version} · {t("app.updatedOn")} {app.updatedAt}
              </p>
              <Button
                variant="hero"
                size="xl"
                className="mt-4 w-full"
                onClick={() => setInstalling(true)}
              >
                {t("app.install")}
              </Button>
              <p className="mt-3 text-center text-xs text-muted-foreground">
                {t("app.autoInstall")}
              </p>
              <Separator className="my-4" />
              <div className="space-y-1 text-xs text-muted-foreground">
                <p>
                  {t("app.editor")} : {app.developer}
                </p>
                <p>
                  {t("app.category")} : {app.category}
                </p>
                <p>
                  {t("app.size")} : {app.sizeMb} Mo
                </p>
              </div>
            </div>
          </aside>
        </div>
      </div>

      <InstallDialog app={app} open={installing} onOpenChange={setInstalling} />
    </StoreShell>
  );
}

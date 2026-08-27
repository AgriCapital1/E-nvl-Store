import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useState } from "react";
import {
  ArrowLeft,
  Download,
  ShieldCheck,
  Clock,
  Star,
  HardDrive,
  RefreshCw,
} from "lucide-react";
import { BrandFooter, BrandHeader } from "@/components/BrandHeader";
import { AppIcon } from "@/components/AppTile";
import { InstallDialog } from "@/components/InstallDialog";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
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
        meta: [{ title: "App introuvable — E'nvlé AppHub" }, { name: "robots", content: "noindex" }],
      };
    }
    const { app } = loaderData;
    const title = `${app.name} — ${app.tagline} | E'nvlé AppHub`;
    return {
      meta: [
        { title },
        { name: "description", content: app.description.slice(0, 155) },
        { property: "og:title", content: title },
        { property: "og:description", content: app.description.slice(0, 155) },
      ],
    };
  },
  notFoundComponent: AppNotFound,
  errorComponent: AppNotFound,
  component: AppDetail,
});

function AppNotFound() {
  return (
    <div className="min-h-screen">
      <BrandHeader />
      <main className="mx-auto max-w-6xl px-4 py-24 text-center">
        <h1 className="font-display text-2xl font-semibold">Cette app n'existe pas</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Elle a peut-être été retirée du catalogue.
        </p>
        <Button variant="hero" className="mt-6" asChild>
          <Link to="/">Retour au catalogue</Link>
        </Button>
      </main>
    </div>
  );
}

function AppDetail() {
  const { app } = Route.useLoaderData() as { app: AppItem };
  const [installing, setInstalling] = useState(false);

  return (
    <div className="min-h-screen">
      <BrandHeader />

      <main className="mx-auto w-full max-w-6xl px-4 py-8">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> Catalogue
        </Link>

        <div className="mt-6 grid gap-8 lg:grid-cols-[1fr_320px]">
          <div>
            <div className="flex flex-wrap items-start gap-5">
              <AppIcon app={app} size="lg" />
              <div className="min-w-0 flex-1">
                <h1 className="font-display text-3xl font-bold tracking-tight">{app.name}</h1>
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
                    <Download className="h-4 w-4" /> {formatCount(app.downloads)}
                  </span>
                  <span className="flex items-center gap-1 text-muted-foreground">
                    <HardDrive className="h-4 w-4" /> {app.sizeMb} Mo
                  </span>
                  {app.scan === "verified" ? (
                    <span className="flex items-center gap-1 text-primary">
                      <ShieldCheck className="h-4 w-4" /> Scan antivirus OK
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-warning">
                      <Clock className="h-4 w-4" /> En cours de revue
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="surface-card aspect-9/16 rounded-xl bg-gradient-to-b from-primary/10 to-transparent"
                  aria-label={`Capture d'écran ${i} de ${app.name}`}
                />
              ))}
            </div>

            <section className="mt-10">
              <h2 className="font-display text-lg font-semibold">Description</h2>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                {app.description}
              </p>
            </section>

            <section className="mt-10">
              <h2 className="font-display text-lg font-semibold">Autorisations demandées</h2>
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
              <h2 className="font-display text-lg font-semibold">Historique des versions</h2>
              <div className="mt-3 space-y-3">
                {app.versions.map((v) => (
                  <div key={v.version} className="surface-card rounded-xl p-4">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">v{v.version}</span>
                      <span className="text-xs text-muted-foreground">{v.date}</span>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">{v.notes}</p>
                    <p className="mt-2 text-xs text-muted-foreground">
                      Taux de crash : {v.crashRate}%
                    </p>
                  </div>
                ))}
              </div>
            </section>

            <section className="mt-10">
              <h2 className="font-display text-lg font-semibold">Avis</h2>
              <div className="mt-3 space-y-3">
                {app.reviews.map((r) => (
                  <div key={r.author} className="surface-card rounded-xl p-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">{r.author}</span>
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Star className="h-3 w-3 fill-accent text-accent" /> {r.rating} · {r.date}
                      </span>
                    </div>
                    <p className="mt-2 text-sm text-muted-foreground">{r.text}</p>
                  </div>
                ))}
              </div>
            </section>
          </div>

          <aside className="lg:sticky lg:top-24 lg:h-fit">
            <div className="surface-card rounded-2xl p-5 shadow-card">
              <p className="font-display text-2xl font-semibold">{formatFcfa(app.priceFcfa)}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Version {app.version} · mise à jour le {app.updatedAt}
              </p>
              <Button
                variant="hero"
                size="xl"
                className="mt-4 w-full"
                onClick={() => setInstalling(true)}
              >
                INSTALLER MAINTENANT
              </Button>
              <p className="mt-3 text-center text-xs text-muted-foreground">
                Téléchargement, installation et raccourci automatiques.
              </p>
              <Separator className="my-4" />
              <div className="space-y-2 text-xs text-muted-foreground">
                <p className="flex items-center gap-2">
                  <RefreshCw className="h-3.5 w-3.5 text-primary" /> Rollback auto si crash &gt; 50%
                </p>
                <p className="flex items-center gap-2">
                  <ShieldCheck className="h-3.5 w-3.5 text-primary" /> APK signé et scanné
                </p>
              </div>
            </div>

            <div className="surface-card mt-4 rounded-2xl p-5">
              <p className="text-sm font-medium">{app.developer}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Développeur vérifié · Abidjan · note moyenne {app.rating.toFixed(1)}
              </p>
            </div>
          </aside>
        </div>
      </main>

      <InstallDialog app={app} open={installing} onOpenChange={setInstalling} />
      <BrandFooter />
    </div>
  );
}

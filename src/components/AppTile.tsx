import { Link } from "@tanstack/react-router";
import { Download, Star, ShieldCheck, Clock } from "lucide-react";
import { formatCount, formatFcfa, type AppItem } from "@/lib/mock-data";

export function AppIcon({ app, size = "md" }: { app: AppItem; size?: "md" | "lg" }) {
  return (
    <div
      className={
        "flex shrink-0 items-center justify-center rounded-2xl bg-gradient-brand font-display font-bold text-primary-foreground shadow-glow " +
        (size === "lg" ? "h-20 w-20 text-2xl" : "h-14 w-14 text-lg")
      }
      aria-hidden
    >
      {app.initials}
    </div>
  );
}

export function AppTile({ app }: { app: AppItem }) {
  return (
    <Link
      to="/app/$appId"
      params={{ appId: app.id }}
      className="group surface-card flex flex-col gap-3 rounded-2xl p-4 shadow-card transition-all hover:-translate-y-0.5 hover:border-primary/50"
    >
      <div className="flex items-start gap-3">
        <AppIcon app={app} />
        <div className="min-w-0">
          <h3 className="truncate font-display text-sm font-semibold">{app.name}</h3>
          <p className="truncate text-xs text-muted-foreground">{app.developer}</p>
          <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
            <Star className="h-3 w-3 fill-accent text-accent" />
            {app.rating.toFixed(1)}
            <span className="opacity-50">·</span>
            <Download className="h-3 w-3" />
            {formatCount(app.downloads)}
          </div>
        </div>
      </div>

      <p className="line-clamp-2 text-xs text-muted-foreground">{app.tagline}</p>

      <div className="mt-auto flex items-center justify-between pt-1">
        <span
          className={
            "rounded-full px-2 py-0.5 text-[11px] font-medium " +
            (app.priceFcfa === 0
              ? "bg-secondary text-muted-foreground"
              : "bg-accent/15 text-accent")
          }
        >
          {formatFcfa(app.priceFcfa)}
        </span>
        <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
          {app.scan === "verified" ? (
            <>
              <ShieldCheck className="h-3.5 w-3.5 text-primary" /> Vérifiée
            </>
          ) : (
            <>
              <Clock className="h-3.5 w-3.5 text-warning" /> En revue
            </>
          )}
        </span>
      </div>
    </Link>
  );
}

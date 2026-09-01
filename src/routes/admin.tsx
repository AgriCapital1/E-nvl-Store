import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Loader2, ShieldAlert, Star } from "lucide-react";
import { toast } from "sonner";
import { StoreShell } from "@/components/StoreShell";
import { SignInIconLink } from "@/components/AccountButton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useSupabaseSession } from "@/hooks/use-supabase-session";
import {
  getAdminOverview,
  moderateReview,
  reviewVersion,
  setDeveloperStatus,
} from "@/lib/admin.functions";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Administration — E'nvlé Store" },
      {
        name: "description",
        content:
          "Console interne E'nvlé : modération des applications, des versions, des avis et des comptes développeurs.",
      },
      { property: "og:title", content: "Administration — E'nvlé Store" },
      {
        property: "og:description",
        content: "Modération des applications, versions, avis et développeurs.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: AdminPage,
});

const mb = (bytes: number) => `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;

function AdminPage() {
  const isAuthenticated = useSupabaseSession();
  const queryClient = useQueryClient();
  const fetchOverview = useServerFn(getAdminOverview);
  const reviewVersionFn = useServerFn(reviewVersion);
  const moderateReviewFn = useServerFn(moderateReview);
  const setStatusFn = useServerFn(setDeveloperStatus);

  const overview = useQuery({
    queryKey: ["admin-overview"],
    queryFn: () => fetchOverview(),
    enabled: isAuthenticated === true,
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["admin-overview"] });

  const versionMutation = useMutation({
    mutationFn: (vars: { versionId: string; approve: boolean; reason?: string }) =>
      reviewVersionFn({ data: vars }),
    onSuccess: (res) => {
      if (res.ok) {
        toast.success("Version mise à jour");
        void invalidate();
      } else toast.error(`Échec : ${res.code}`);
    },
    onError: () => toast.error("Action impossible"),
  });

  const reviewMutation = useMutation({
    mutationFn: (vars: { reviewId: string; status: "approved" | "rejected" }) =>
      moderateReviewFn({ data: vars }),
    onSuccess: (res) => {
      if (res.ok) {
        toast.success("Avis mis à jour");
        void invalidate();
      } else toast.error(`Échec : ${res.code}`);
    },
  });

  const devMutation = useMutation({
    mutationFn: (vars: { developerId: string; status: "active" | "suspended" }) =>
      setStatusFn({ data: vars }),
    onSuccess: (res) => {
      if (res.ok) {
        toast.success("Développeur mis à jour");
        void invalidate();
      } else toast.error(`Échec : ${res.code}`);
    },
  });

  return (
    <StoreShell>
      <div className="mx-auto w-full max-w-6xl px-4 py-8">
        <h1 className="font-display text-2xl font-semibold">Administration</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Modération des applications, versions, avis et comptes développeurs.
        </p>

        {isAuthenticated === false && (
          <div className="surface-card mt-6 rounded-2xl p-6">
            <p className="text-sm text-muted-foreground">
              Cette console nécessite un compte administrateur.
            </p>
            <div className="mt-3">
              <SignInIconLink />
            </div>
          </div>
        )}

        {(isAuthenticated === null || overview.isLoading) && isAuthenticated !== false && (
          <div className="mt-10 flex justify-center">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        )}

        {overview.isError && (
          <p className="mt-6 text-sm text-destructive">Chargement impossible.</p>
        )}

        {overview.data && !overview.data.isAdmin && (
          <div className="surface-card mt-6 flex items-start gap-3 rounded-2xl p-6">
            <ShieldAlert className="mt-0.5 h-5 w-5 text-destructive" />
            <div>
              <p className="font-medium">Accès refusé</p>
              <p className="text-sm text-muted-foreground">
                Votre compte ne dispose pas du rôle administrateur.
              </p>
            </div>
          </div>
        )}

        {overview.data?.isAdmin && (
          <Tabs defaultValue="apps" className="mt-6">
            <TabsList className="w-full overflow-x-auto">
              <TabsTrigger value="apps">Applications</TabsTrigger>
              <TabsTrigger value="versions">Versions</TabsTrigger>
              <TabsTrigger value="reviews">Avis</TabsTrigger>
              <TabsTrigger value="devs">Développeurs</TabsTrigger>
            </TabsList>

            <TabsContent value="apps" className="mt-4 space-y-3">
              {overview.data.apps.length === 0 && (
                <p className="text-sm text-muted-foreground">Aucune application.</p>
              )}
              {overview.data.apps.map((app) => (
                <div
                  key={app.id}
                  className="surface-card flex flex-wrap items-center gap-3 rounded-xl p-4"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{app.name}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {app.developerName} · v{app.version} · {app.downloads} installations
                    </p>
                  </div>
                  <span className="inline-flex items-center gap-1 text-sm text-muted-foreground">
                    <Star className="h-3.5 w-3.5" />
                    {app.ratingAverage.toFixed(1)} ({app.ratingCount})
                  </span>
                  <Badge variant="secondary">{app.status}</Badge>
                </div>
              ))}
            </TabsContent>

            <TabsContent value="versions" className="mt-4 space-y-3">
              {overview.data.pendingVersions.length === 0 && (
                <p className="text-sm text-muted-foreground">Aucune version soumise.</p>
              )}
              {overview.data.pendingVersions.map((v) => (
                <div
                  key={v.id}
                  className="surface-card flex flex-wrap items-center gap-3 rounded-xl p-4"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">
                      {v.appName} · v{v.version}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {mb(v.sizeBytes)} · scan {v.scanStatus} ·{" "}
                      {new Date(v.createdAt).toLocaleDateString("fr-FR")}
                    </p>
                  </div>
                  <Badge variant="secondary">{v.status}</Badge>
                  {v.status === "review" && (
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="hero"
                        disabled={versionMutation.isPending}
                        onClick={() =>
                          versionMutation.mutate({ versionId: v.id, approve: true })
                        }
                      >
                        Publier
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={versionMutation.isPending}
                        onClick={() =>
                          versionMutation.mutate({
                            versionId: v.id,
                            approve: false,
                            reason: "Refusé par la modération",
                          })
                        }
                      >
                        Refuser
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </TabsContent>

            <TabsContent value="reviews" className="mt-4 space-y-3">
              {overview.data.reviews.length === 0 && (
                <p className="text-sm text-muted-foreground">Aucun avis.</p>
              )}
              {overview.data.reviews.map((r) => (
                <div key={r.id} className="surface-card rounded-xl p-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-medium">{r.appName}</p>
                    <span className="inline-flex items-center gap-1 text-sm text-muted-foreground">
                      <Star className="h-3.5 w-3.5" />
                      {r.rating}/5
                    </span>
                    <Badge variant="secondary">{r.status}</Badge>
                    <div className="ml-auto flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={reviewMutation.isPending}
                        onClick={() =>
                          reviewMutation.mutate({ reviewId: r.id, status: "approved" })
                        }
                      >
                        Approuver
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={reviewMutation.isPending}
                        onClick={() =>
                          reviewMutation.mutate({ reviewId: r.id, status: "rejected" })
                        }
                      >
                        Masquer
                      </Button>
                    </div>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {r.authorName} · {new Date(r.createdAt).toLocaleDateString("fr-FR")}
                  </p>
                  {r.comment && <p className="mt-2 text-sm">{r.comment}</p>}
                </div>
              ))}
            </TabsContent>

            <TabsContent value="devs" className="mt-4 space-y-3">
              {overview.data.developers.length === 0 && (
                <p className="text-sm text-muted-foreground">Aucun développeur.</p>
              )}
              {overview.data.developers.map((d) => (
                <div
                  key={d.id}
                  className="surface-card flex flex-wrap items-center gap-3 rounded-xl p-4"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">
                      {d.organizationName ?? d.displayName}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Plan {d.planCode} · {d.appCount} application(s)
                      {d.country ? ` · ${d.country}` : ""}
                    </p>
                  </div>
                  <Badge variant="secondary">{d.status}</Badge>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={devMutation.isPending}
                    onClick={() =>
                      devMutation.mutate({
                        developerId: d.id,
                        status: d.status === "suspended" ? "active" : "suspended",
                      })
                    }
                  >
                    {d.status === "suspended" ? "Réactiver" : "Suspendre"}
                  </Button>
                </div>
              ))}
            </TabsContent>
          </Tabs>
        )}
      </div>
    </StoreShell>
  );
}

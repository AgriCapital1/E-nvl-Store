import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Star, ShieldCheck, Check, X, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/lib/i18n";
import type { AppItem } from "@/lib/mock-data";
import {
  createReview,
  deleteReview,
  listReviews,
  setReviewStatus,
  updateReview,
  type ReviewRecord,
} from "@/lib/reviews";

type Status = "approved" | "pending" | "rejected";

interface LocalReview {
  id: string;
  author: string;
  rating: number;
  date: string;
  text: string;
  status: Status;
  userId: string | null;
  reply?: string | null;
}

function Stars({ value, className = "" }: { value: number; className?: string }) {
  return (
    <span className={"flex items-center gap-0.5 " + className} aria-label={`${value}/5`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          className={
            "h-4 w-4 " +
            (i <= Math.round(value) ? "fill-accent text-accent" : "text-muted-foreground/40")
          }
        />
      ))}
    </span>
  );
}

function StarPicker({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((i) => (
        <button
          key={i}
          type="button"
          onClick={() => onChange(i)}
          aria-label={`${i} / 5`}
          className="rounded p-0.5 transition-transform hover:scale-110"
        >
          <Star
            className={"h-6 w-6 " + (i <= value ? "fill-accent text-accent" : "text-muted-foreground/40")}
          />
        </button>
      ))}
    </div>
  );
}

export function ReviewsSection({ app, admin = false }: { app: AppItem; admin?: boolean }) {
  const { t } = useI18n();
  const storeAppId = app.storeAppId;
  const queryClient = useQueryClient();

  /* ---------- source des données : Supabase si l'app est réelle, sinon démo locale ---------- */
  const [localReviews, setLocalReviews] = useState<LocalReview[]>(() =>
    app.reviews.map((r, i) => ({
      id: `seed-${i}`,
      status: "approved" as Status,
      userId: null,
      ...r,
    })),
  );

  const userQuery = useQuery({
    queryKey: ["auth-user"],
    queryFn: async () => (await supabase.auth.getUser()).data.user?.id ?? null,
    staleTime: 60_000,
  });
  const currentUserId = userQuery.data ?? null;

  const remoteQuery = useQuery({
    queryKey: ["reviews", storeAppId],
    queryFn: () => listReviews(storeAppId as string),
    enabled: Boolean(storeAppId),
  });

  const reviews: LocalReview[] = storeAppId
    ? (remoteQuery.data ?? []).map((r: ReviewRecord) => ({ ...r }))
    : localReviews;

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: ["reviews", storeAppId] });
  };

  const createMutation = useMutation({
    mutationFn: (input: { authorName: string; rating: number; comment: string }) =>
      createReview({ storeAppId: storeAppId as string, ...input }),
    onSuccess: () => {
      invalidate();
      toast.success(t("reviews.thanks"));
    },
    onError: (e: Error) =>
      toast.error(e.message === "AUTH_REQUIRED" ? "Connectez-vous pour publier un avis." : e.message),
  });

  const updateMutation = useMutation({
    mutationFn: (input: { id: string; rating: number; comment: string }) =>
      updateReview(input.id, { rating: input.rating, comment: input.comment }),
    onSuccess: () => {
      invalidate();
      toast.success("Avis mis à jour");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteReview(id),
    onSuccess: () => {
      invalidate();
      toast.success("Avis supprimé");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const moderateMutation = useMutation({
    mutationFn: (input: { id: string; status: "approved" | "rejected" }) =>
      setReviewStatus(input.id, input.status),
    onSuccess: (_d, v) => {
      invalidate();
      toast.success(v.status === "approved" ? t("reviews.approved") : t("reviews.rejected"));
    },
    onError: (e: Error) => toast.error(e.message),
  });

  /* ---------- formulaire ---------- */
  const [author, setAuthor] = useState("");
  const [text, setText] = useState("");
  const [rating, setRating] = useState(5);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [moderating, setModerating] = useState(admin);
  const [sort, setSort] = useState<"recent" | "best" | "worst">("recent");
  const [starFilter, setStarFilter] = useState<number | null>(null);
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 5;

  useEffect(() => {
    if (!storeAppId) setLocalReviews(
      app.reviews.map((r, i) => ({ id: `seed-${i}`, status: "approved" as Status, userId: null, ...r })),
    );
  }, [app.id, app.reviews, storeAppId]);

  const approved = useMemo(() => reviews.filter((r) => r.status === "approved"), [reviews]);
  const pending = useMemo(() => reviews.filter((r) => r.status === "pending"), [reviews]);
  const mine = useMemo(
    () => (currentUserId ? reviews.filter((r) => r.userId === currentUserId) : []),
    [reviews, currentUserId],
  );

  const average = useMemo(() => {
    if (approved.length === 0) return 0;
    return approved.reduce((s, r) => s + r.rating, 0) / approved.length;
  }, [approved]);

  const distribution = useMemo(
    () =>
      [5, 4, 3, 2, 1].map((star) => ({
        star,
        count: approved.filter((r) => r.rating === star).length,
      })),
    [approved],
  );

  const visible = useMemo(() => {
    const list = starFilter ? approved.filter((r) => r.rating === starFilter) : approved;
    const sorted = [...list];
    if (sort === "recent") sorted.sort((a, b) => b.date.localeCompare(a.date));
    if (sort === "best") sorted.sort((a, b) => b.rating - a.rating);
    if (sort === "worst") sorted.sort((a, b) => a.rating - b.rating);
    return sorted;
  }, [approved, starFilter, sort]);

  const paginated = visible.slice(0, page * PAGE_SIZE);

  function isSpam(value: string): boolean {
    const v = value.trim();
    if (v.length < 8) return true;
    if (/(https?:\/\/|www\.)/i.test(v)) return true;
    if (/(.)\1{5,}/.test(v)) return true;
    const letters = v.replace(/[^a-zA-ZÀ-ÿ]/g, "");
    if (letters.length > 6 && letters === letters.toUpperCase()) return true;
    return false;
  }

  function resetForm() {
    setAuthor("");
    setText("");
    setRating(5);
    setEditingId(null);
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!author.trim() || !text.trim()) {
      toast.error(t("reviews.needName"));
      return;
    }
    if (isSpam(text)) {
      toast.error(t("reviews.spam"));
      return;
    }
    const normalized = text.trim().toLowerCase();
    if (
      !editingId &&
      reviews.some((r) => r.text.trim().toLowerCase() === normalized)
    ) {
      toast.error(t("reviews.duplicate"));
      return;
    }

    if (storeAppId) {
      if (editingId) {
        updateMutation.mutate({ id: editingId, rating, comment: text.trim() });
      } else {
        createMutation.mutate({ authorName: author.trim(), rating, comment: text.trim() });
      }
      resetForm();
      return;
    }

    setLocalReviews((prev) => [
      {
        id: `r-${Date.now()}`,
        author: author.trim(),
        text: text.trim(),
        rating,
        date: new Date().toISOString().slice(0, 10),
        status: "pending",
        userId: null,
      },
      ...prev,
    ]);
    resetForm();
    toast.success(t("reviews.thanks"));
  }

  function moderate(id: string, next: "approved" | "reject") {
    if (storeAppId) {
      moderateMutation.mutate({ id, status: next === "reject" ? "rejected" : "approved" });
      return;
    }
    setLocalReviews((prev) =>
      next === "reject"
        ? prev.filter((r) => r.id !== id)
        : prev.map((r) => (r.id === id ? { ...r, status: "approved" } : r)),
    );
    toast.success(next === "reject" ? t("reviews.rejected") : t("reviews.approved"));
  }

  function startEdit(r: LocalReview) {
    setEditingId(r.id);
    setAuthor(r.author);
    setText(r.text);
    setRating(r.rating);
  }

  function remove(id: string) {
    if (storeAppId) {
      deleteMutation.mutate(id);
      return;
    }
    setLocalReviews((prev) => prev.filter((r) => r.id !== id));
    toast.success("Avis supprimé");
  }

  return (
    <section className="mt-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-display text-lg font-semibold">{t("app.reviews")}</h2>
        <button
          type="button"
          onClick={() => setModerating((m) => !m)}
          className="text-xs text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
        >
          {t("reviews.moderation")}
          {pending.length > 0 ? ` (${pending.length})` : ""}
        </button>
      </div>

      <div className="surface-card mt-4 grid gap-6 rounded-2xl p-5 sm:grid-cols-[200px_1fr]">
        <div className="text-center sm:text-left">
          <p className="font-display text-4xl font-bold">{average.toFixed(1)}</p>
          <Stars value={average} className="mt-2 justify-center sm:justify-start" />
          <p className="mt-1 text-xs text-muted-foreground">
            {approved.length} {t("reviews.count")}
          </p>
        </div>
        <div className="space-y-1.5">
          {distribution.map(({ star, count }) => (
            <div key={star} className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className="w-3">{star}</span>
              <Star className="h-3 w-3 fill-accent text-accent" />
              <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-gradient-brand"
                  style={{ width: `${approved.length ? (count / approved.length) * 100 : 0}%` }}
                />
              </div>
              <span className="w-6 text-right">{count}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Mes avis (CRUD) */}
      {mine.length > 0 && (
        <div className="surface-card mt-4 space-y-3 rounded-2xl p-5">
          <p className="text-sm font-medium">Mes avis</p>
          {mine.map((r) => (
            <div key={r.id} className="rounded-xl border border-border p-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <Stars value={r.rating} />
                <span className="text-xs text-muted-foreground">
                  {r.status === "approved" ? t("reviews.approved") : t("reviews.pending")}
                </span>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">{r.text}</p>
              <div className="mt-3 flex gap-2">
                <Button size="sm" variant="outline" onClick={() => startEdit(r)}>
                  <Pencil className="mr-1.5 h-3.5 w-3.5" /> Modifier
                </Button>
                <Button size="sm" variant="outline" onClick={() => remove(r.id)}>
                  <Trash2 className="mr-1.5 h-3.5 w-3.5" /> Supprimer
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {moderating && pending.length > 0 && (
        <div className="surface-card mt-4 space-y-3 rounded-2xl border-warning/40 p-5">
          <p className="flex items-center gap-2 text-sm font-medium text-warning">
            <ShieldCheck className="h-4 w-4" /> {t("reviews.moderation")} ({pending.length})
          </p>
          {pending.map((r) => (
            <div key={r.id} className="rounded-xl border border-border p-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-sm font-medium">{r.author}</span>
                <Stars value={r.rating} />
              </div>
              <p className="mt-2 text-sm text-muted-foreground">{r.text}</p>
              <div className="mt-3 flex gap-2">
                <Button size="sm" onClick={() => moderate(r.id, "approved")}>
                  <Check className="mr-1.5 h-3.5 w-3.5" /> {t("reviews.approve")}
                </Button>
                <Button size="sm" variant="outline" onClick={() => moderate(r.id, "reject")}>
                  <X className="mr-1.5 h-3.5 w-3.5" /> {t("reviews.reject")}
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <form onSubmit={submit} className="surface-card mt-4 rounded-2xl p-5">
        <p className="font-display text-sm font-semibold">
          {editingId ? "Modifier mon avis" : t("reviews.write")}
        </p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="review-author">{t("reviews.name")}</Label>
            <Input
              id="review-author"
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              placeholder="Aya K."
            />
          </div>
          <div className="space-y-1.5">
            <Label>{t("reviews.rating")}</Label>
            <StarPicker value={rating} onChange={setRating} />
          </div>
        </div>
        <div className="mt-4 space-y-1.5">
          <Label htmlFor="review-text">{t("reviews.comment")}</Label>
          <Textarea
            id="review-text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={3}
          />
        </div>
        <div className="mt-4 flex gap-2">
          <Button
            type="submit"
            variant="hero"
            disabled={createMutation.isPending || updateMutation.isPending}
          >
            {editingId ? "Enregistrer" : t("reviews.submit")}
          </Button>
          {editingId && (
            <Button type="button" variant="outline" onClick={resetForm}>
              Annuler
            </Button>
          )}
        </div>
        {storeAppId && !currentUserId && (
          <p className="mt-3 text-xs text-muted-foreground">
            Connectez-vous pour publier, modifier ou supprimer un avis.
          </p>
        )}
      </form>

      <Separator className="my-6" />

      <div className="flex flex-wrap items-center gap-2">
        {(
          [
            ["recent", t("reviews.sort.recent")],
            ["best", t("reviews.sort.best")],
            ["worst", t("reviews.sort.worst")],
          ] as const
        ).map(([k, label]) => (
          <button
            key={k}
            type="button"
            onClick={() => {
              setSort(k);
              setPage(1);
            }}
            className={
              "rounded-full border px-3 py-1.5 text-xs transition-colors " +
              (sort === k
                ? "border-primary bg-primary/15 text-primary"
                : "border-border text-muted-foreground hover:text-foreground")
            }
          >
            {label}
          </button>
        ))}
        <span className="mx-1 hidden w-px self-stretch bg-border sm:block" />
        <button
          type="button"
          onClick={() => {
            setStarFilter(null);
            setPage(1);
          }}
          className={
            "rounded-full border px-3 py-1.5 text-xs transition-colors " +
            (starFilter === null
              ? "border-primary bg-primary/15 text-primary"
              : "border-border text-muted-foreground hover:text-foreground")
          }
        >
          {t("reviews.filter.all")}
        </button>
        {[5, 4, 3, 2, 1].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => {
              setStarFilter(star);
              setPage(1);
            }}
            className={
              "flex items-center gap-1 rounded-full border px-3 py-1.5 text-xs transition-colors " +
              (starFilter === star
                ? "border-primary bg-primary/15 text-primary"
                : "border-border text-muted-foreground hover:text-foreground")
            }
          >
            {star} <Star className="h-3 w-3 fill-accent text-accent" />
          </button>
        ))}
      </div>

      <div className="mt-4 space-y-3">
        {visible.length === 0 && (
          <p className="text-sm text-muted-foreground">{t("reviews.none")}</p>
        )}
        {paginated.map((r) => (
          <div key={r.id} className="surface-card rounded-xl p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-sm font-medium">{r.author}</span>
              <span className="flex items-center gap-2 text-xs text-muted-foreground">
                <Stars value={r.rating} /> {r.date}
              </span>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">{r.text}</p>
            {r.reply && (
              <p className="mt-2 rounded-lg bg-secondary/60 p-3 text-xs text-muted-foreground">
                <span className="font-medium text-foreground">{app.developer} : </span>
                {r.reply}
              </p>
            )}
          </div>
        ))}

        {paginated.length < visible.length && (
          <Button variant="outline" className="w-full" onClick={() => setPage((p) => p + 1)}>
            {t("reviews.more")}
          </Button>
        )}
      </div>
    </section>
  );
}

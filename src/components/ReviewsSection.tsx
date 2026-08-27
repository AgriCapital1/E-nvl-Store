import { useMemo, useState } from "react";
import { Star, ShieldCheck, Check, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { useI18n } from "@/lib/i18n";
import type { AppItem } from "@/lib/mock-data";

type Status = "approved" | "pending";

interface LocalReview {
  id: string;
  author: string;
  rating: number;
  date: string;
  text: string;
  status: Status;
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
  const [reviews, setReviews] = useState<LocalReview[]>(() =>
    app.reviews.map((r, i) => ({ id: `seed-${i}`, status: "approved" as Status, ...r })),
  );
  const [author, setAuthor] = useState("");
  const [text, setText] = useState("");
  const [rating, setRating] = useState(5);
  const [moderating, setModerating] = useState(admin);

  const approved = useMemo(() => reviews.filter((r) => r.status === "approved"), [reviews]);
  const pending = useMemo(() => reviews.filter((r) => r.status === "pending"), [reviews]);

  const average = useMemo(() => {
    if (approved.length === 0) return 0;
    return approved.reduce((s, r) => s + r.rating, 0) / approved.length;
  }, [approved]);

  const distribution = useMemo(() => {
    return [5, 4, 3, 2, 1].map((star) => ({
      star,
      count: approved.filter((r) => r.rating === star).length,
    }));
  }, [approved]);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!author.trim() || !text.trim()) {
      toast.error(t("reviews.needName"));
      return;
    }
    setReviews((prev) => [
      {
        id: `r-${Date.now()}`,
        author: author.trim(),
        text: text.trim(),
        rating,
        date: new Date().toISOString().slice(0, 10),
        status: "pending",
      },
      ...prev,
    ]);
    setAuthor("");
    setText("");
    setRating(5);
    toast.success(t("reviews.thanks"));
  }

  function moderate(id: string, next: "approved" | "reject") {
    setReviews((prev) =>
      next === "reject"
        ? prev.filter((r) => r.id !== id)
        : prev.map((r) => (r.id === id ? { ...r, status: "approved" } : r)),
    );
    toast.success(next === "reject" ? t("reviews.rejected") : t("reviews.approved"));
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
                  style={{
                    width: `${approved.length ? (count / approved.length) * 100 : 0}%`,
                  }}
                />
              </div>
              <span className="w-6 text-right">{count}</span>
            </div>
          ))}
        </div>
      </div>

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
        <p className="font-display text-sm font-semibold">{t("reviews.write")}</p>
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
        <Button type="submit" variant="hero" className="mt-4">
          {t("reviews.submit")}
        </Button>
      </form>

      <Separator className="my-6" />

      <div className="space-y-3">
        {approved.length === 0 && (
          <p className="text-sm text-muted-foreground">{t("reviews.none")}</p>
        )}
        {approved.map((r) => (
          <div key={r.id} className="surface-card rounded-xl p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-sm font-medium">{r.author}</span>
              <span className="flex items-center gap-2 text-xs text-muted-foreground">
                <Stars value={r.rating} /> {r.date}
              </span>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">{r.text}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

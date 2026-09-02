import { supabase } from "@/integrations/supabase/client";

export interface ReviewRecord {
  id: string;
  author: string;
  rating: number;
  date: string;
  text: string;
  status: "approved" | "pending" | "rejected";
  userId: string | null;
  reply: string | null;
}

interface Row {
  id: string;
  user_id: string;
  author_name: string;
  rating: number;
  comment: string | null;
  created_at: string;
  status: string;
  developer_reply: string | null;
}

function mapRow(row: Row): ReviewRecord {
  return {
    id: row.id,
    author: row.author_name,
    rating: row.rating,
    date: row.created_at.slice(0, 10),
    text: row.comment ?? "",
    status: row.status === "approved" || row.status === "rejected" ? row.status : "pending",
    userId: row.user_id,
    reply: row.developer_reply,
  };
}

/**
 * Avis visibles pour l'utilisateur courant (approuvés + les siens grâce à la RLS).
 * Le user_id interne n'est jamais exposé publiquement : la liste publique ne le
 * sélectionne pas ; seuls les avis de l'utilisateur connecté sont rechargés avec
 * leur user_id (requête séparée, filtrée côté base).
 */
export async function listReviews(storeAppId: string): Promise<ReviewRecord[]> {
  const publicCols = "id, author_name, rating, comment, created_at, status, developer_reply";
  const { data, error } = await supabase
    .from("reviews")
    .select(publicCols)
    .eq("store_app_id", storeAppId)
    .order("created_at", { ascending: false })
    .limit(200);
  if (error) throw new Error(error.message);
  const rows = (data ?? []).map((r) => mapRow({ ...(r as Omit<Row, "user_id">), user_id: "" }));

  const { data: auth } = await supabase.auth.getUser();
  const uid = auth.user?.id;
  if (!uid) return rows;

  const { data: mine } = await supabase
    .from("reviews")
    .select("id")
    .eq("store_app_id", storeAppId)
    .eq("user_id", uid)
    .limit(200);
  const mineIds = new Set((mine ?? []).map((r) => r.id as string));
  return rows.map((r) => (mineIds.has(r.id) ? { ...r, userId: uid } : r));
}

export async function createReview(input: {
  storeAppId: string;
  authorName: string;
  rating: number;
  comment: string;
}): Promise<ReviewRecord> {
  const { data: auth } = await supabase.auth.getUser();
  const userId = auth.user?.id;
  if (!userId) throw new Error("AUTH_REQUIRED");

  const { data, error } = await supabase
    .from("reviews")
    .insert({
      store_app_id: input.storeAppId,
      user_id: userId,
      author_name: input.authorName,
      rating: input.rating,
      comment: input.comment,
    })
    .select("id, user_id, author_name, rating, comment, created_at, status, developer_reply")
    .single();
  if (error) throw new Error(error.message);
  return mapRow(data as Row);
}

export async function updateReview(
  id: string,
  patch: { rating?: number; comment?: string },
): Promise<void> {
  const { error } = await supabase.from("reviews").update(patch).eq("id", id);
  if (error) throw new Error(error.message);
}

export async function deleteReview(id: string): Promise<void> {
  const { error } = await supabase.from("reviews").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

/** Modération (réservée aux admins par la RLS). */
export async function setReviewStatus(
  id: string,
  status: "approved" | "rejected",
): Promise<void> {
  const { error } = await supabase.from("reviews").update({ status }).eq("id", id);
  if (error) throw new Error(error.message);
}

/** Réponse du développeur (réservée au propriétaire de l'app par la RLS). */
export async function replyToReview(id: string, reply: string): Promise<void> {
  const { error } = await supabase
    .from("reviews")
    .update({ developer_reply: reply, developer_replied_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw new Error(error.message);
}

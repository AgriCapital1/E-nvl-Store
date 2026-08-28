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

/** Avis visibles pour l'utilisateur courant (approuvés + les siens grâce à la RLS). */
export async function listReviews(storeAppId: string): Promise<ReviewRecord[]> {
  const { data, error } = await supabase
    .from("reviews")
    .select("id, user_id, author_name, rating, comment, created_at, status, developer_reply")
    .eq("store_app_id", storeAppId)
    .order("created_at", { ascending: false })
    .limit(200);
  if (error) throw new Error(error.message);
  return (data ?? []).map((r) => mapRow(r as Row));
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

import { createPublicSupabase } from "@/lib/supabase-public.server";
import {
  mapReview,
  mapStoreApp,
  mapVersion,
  type ReviewRowLike,
  type StoreAppRowLike,
  type VersionRowLike,
} from "@/lib/catalog-map";
import type { AppItem, CategoryItem } from "@/lib/catalog-types";

const APP_COLUMNS =
  "id, slug, name, publisher_name, category_slug, short_description, description, icon_path, price_fcfa, current_version, apk_size_bytes, permissions, security_scan, downloads, downloads_24h, rating_average, rating_count, updated_at";

const MEDIA_TTL = 60 * 60;

/** Signe des chemins du bucket privé `app-media` pour l'affichage public. */
async function signMedia(paths: string[]): Promise<Record<string, string>> {
  const unique = [...new Set(paths.filter((p) => p && !/^https?:\/\//.test(p)))];
  if (unique.length === 0) return {};
  try {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data } = await supabaseAdmin.storage
      .from("app-media")
      .createSignedUrls(unique, MEDIA_TTL);
    const map: Record<string, string> = {};
    for (const item of data ?? []) {
      if (item.path && item.signedUrl) map[item.path] = item.signedUrl;
    }
    return map;
  } catch (error) {
    console.error("signMedia", error);
    return {};
  }
}

function resolveMedia(path: string | null | undefined, signed: Record<string, string>): string | null {
  if (!path) return null;
  if (/^https?:\/\//.test(path)) return path;
  return signed[path] ?? null;
}

export async function fetchCategories(): Promise<CategoryItem[]> {
  const client = createPublicSupabase();
  const { data } = await client
    .from("categories")
    .select("slug, name_fr, sort_order")
    .eq("is_active", true)
    .order("sort_order", { ascending: true });
  return (data ?? []).map((row) => ({ slug: row.slug, name: row.name_fr }));
}

async function loadCategoryNames(): Promise<Record<string, string>> {
  const map: Record<string, string> = {};
  for (const c of await fetchCategories()) map[c.slug] = c.name;
  return map;
}

/** Toutes les applications publiées du store. */
export async function fetchPublishedApps(): Promise<AppItem[]> {
  const client = createPublicSupabase();
  const [{ data, error }, categoryNames] = await Promise.all([
    client
      .from("store_apps")
      .select(APP_COLUMNS)
      .eq("status", "published")
      .order("downloads", { ascending: false })
      .limit(200),
    loadCategoryNames(),
  ]);
  if (error) {
    console.error("fetchPublishedApps", error.message);
    return [];
  }
  const rows = (data ?? []) as StoreAppRowLike[];
  const signed = await signMedia(rows.map((r) => r.icon_path ?? ""));
  return rows.map((row) =>
    mapStoreApp(row, categoryNames, [], [], resolveMedia(row.icon_path, signed)),
  );
}

/** Détail d'une application publiée (versions + avis approuvés inclus). */
export async function fetchPublishedApp(slug: string): Promise<AppItem | null> {
  const client = createPublicSupabase();
  const { data, error } = await client
    .from("store_apps")
    .select(`${APP_COLUMNS}, developer_app_id, screenshots`)
    .eq("status", "published")
    .eq("slug", slug)
    .maybeSingle();

  if (error) console.error("fetchPublishedApp", error.message);
  if (!data) return null;

  const row = data as StoreAppRowLike & { developer_app_id: string; screenshots: unknown };

  const [categoryNames, versionsRes, reviewsRes] = await Promise.all([
    loadCategoryNames(),
    client
      .from("app_versions")
      .select("version, release_notes_fr, crash_rate, created_at")
      .eq("developer_app_id", row.developer_app_id)
      .eq("status", "live")
      .order("created_at", { ascending: false })
      .limit(10),
    client
      .from("reviews")
      .select("id, author_name, rating, comment, created_at")
      .eq("store_app_id", row.id)
      .eq("status", "approved")
      .order("created_at", { ascending: false })
      .limit(50),
  ]);

  const shots = Array.isArray(row.screenshots)
    ? row.screenshots.filter((s): s is string => typeof s === "string")
    : [];
  const signed = await signMedia([row.icon_path ?? "", ...shots]);

  const versions = (versionsRes.data ?? []).map((v) => mapVersion(v as VersionRowLike));
  const reviews = (reviewsRes.data ?? []).map((r) => mapReview(r as ReviewRowLike));

  return mapStoreApp(
    row,
    categoryNames,
    versions,
    reviews,
    resolveMedia(row.icon_path, signed),
    shots.map((s) => resolveMedia(s, signed)).filter((s): s is string => Boolean(s)),
  );
}

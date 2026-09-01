import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { callRpc } from "@/lib/supabase-rpc";

export interface AdminAppRow {
  id: string;
  name: string;
  slug: string;
  status: string;
  version: string;
  downloads: number;
  developerName: string;
  ratingAverage: number;
  ratingCount: number;
}

export interface AdminVersionRow {
  id: string;
  appId: string;
  appName: string;
  version: string;
  status: string;
  scanStatus: string;
  sizeBytes: number;
  createdAt: string;
}

export interface AdminReviewRow {
  id: string;
  appName: string;
  authorName: string;
  rating: number;
  comment: string | null;
  status: string;
  createdAt: string;
}

export interface AdminDeveloperRow {
  id: string;
  displayName: string;
  organizationName: string | null;
  planCode: string;
  status: string;
  country: string | null;
  appCount: number;
}

export interface AdminOverview {
  isAdmin: boolean;
  apps: AdminAppRow[];
  pendingVersions: AdminVersionRow[];
  reviews: AdminReviewRow[];
  developers: AdminDeveloperRow[];
}

const EMPTY: AdminOverview = {
  isAdmin: false,
  apps: [],
  pendingVersions: [],
  reviews: [],
  developers: [],
};

/** Vue d'ensemble de modération — réservée aux comptes disposant du rôle admin. */
export const getAdminOverview = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<AdminOverview> => {
    const supabase = context.supabase;

    const { data: isAdmin } = await callRpc(supabase, "has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    if (isAdmin !== true) return EMPTY;

    const [appsRes, versionsRes, reviewsRes, devsRes, storeRes] = await Promise.all([
      supabase
        .from("developer_apps")
        .select("id, name, slug, status, version, downloads, developer_id")
        .order("updated_at", { ascending: false })
        .limit(200),
      supabase
        .from("app_versions")
        .select("id, developer_app_id, version, status, scan_status, apk_size_bytes, created_at")
        .order("created_at", { ascending: false })
        .limit(100),
      supabase
        .from("reviews")
        .select("id, store_app_id, author_name, rating, comment, status, created_at")
        .order("created_at", { ascending: false })
        .limit(100),
      supabase
        .from("developer_profiles")
        .select("id, display_name, organization_name, plan_code, status, country")
        .order("created_at", { ascending: false })
        .limit(200),
      supabase
        .from("store_apps")
        .select("id, developer_app_id, name, rating_average, rating_count")
        .limit(500),
    ]);

    const devs = devsRes.data ?? [];
    const devName = new Map(devs.map((d) => [d.id, d.organization_name ?? d.display_name]));
    const rawApps = appsRes.data ?? [];
    const appName = new Map(rawApps.map((a) => [a.id, a.name]));
    const store = storeRes.data ?? [];
    const storeByApp = new Map(store.map((s) => [s.developer_app_id, s]));
    const storeById = new Map(store.map((s) => [s.id, s]));

    const apps: AdminAppRow[] = rawApps.map((a) => {
      const s = storeByApp.get(a.id);
      return {
        id: a.id,
        name: a.name,
        slug: a.slug,
        status: a.status,
        version: a.version,
        downloads: a.downloads,
        developerName: devName.get(a.developer_id) ?? "—",
        ratingAverage: Number(s?.rating_average ?? 0),
        ratingCount: s?.rating_count ?? 0,
      };
    });

    const appCount = new Map<string, number>();
    for (const a of rawApps) {
      appCount.set(a.developer_id, (appCount.get(a.developer_id) ?? 0) + 1);
    }

    return {
      isAdmin: true,
      apps,
      pendingVersions: (versionsRes.data ?? []).map((v) => ({
        id: v.id,
        appId: v.developer_app_id,
        appName: appName.get(v.developer_app_id) ?? "—",
        version: v.version,
        status: v.status,
        scanStatus: v.scan_status,
        sizeBytes: Number(v.apk_size_bytes ?? 0),
        createdAt: v.created_at,
      })),
      reviews: (reviewsRes.data ?? []).map((r) => ({
        id: r.id,
        appName: storeById.get(r.store_app_id)?.name ?? "—",
        authorName: r.author_name,
        rating: r.rating,
        comment: r.comment,
        status: r.status,
        createdAt: r.created_at,
      })),
      developers: devs.map((d) => ({
        id: d.id,
        displayName: d.display_name,
        organizationName: d.organization_name,
        planCode: d.plan_code,
        status: d.status,
        country: d.country,
        appCount: appCount.get(d.id) ?? 0,
      })),
    };
  });

const reviewSchema = z.object({
  versionId: z.string().uuid(),
  approve: z.boolean(),
  reason: z.string().max(500).optional(),
});

/** Approuve ou refuse une version — la RPC vérifie elle-même le rôle admin. */
export const reviewVersion = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => reviewSchema.parse(data))
  .handler(async ({ context, data }): Promise<{ ok: boolean; code?: string }> => {
    const { data: result, error } = await callRpc(context.supabase, "admin_review_version", {
      _version_id: data.versionId,
      _approve: data.approve,
      _reason: data.reason ?? null,
    });
    if (error) return { ok: false, code: error.message };
    const payload = (result ?? {}) as { ok?: boolean; code?: string };
    return payload.ok ? { ok: true } : { ok: false, code: payload.code ?? "UNKNOWN" };
  });

const moderateReviewSchema = z.object({
  reviewId: z.string().uuid(),
  status: z.enum(["approved", "pending", "rejected"]),
});

/** Modère un avis utilisateur (RLS : policies admin sur public.reviews). */
export const moderateReview = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => moderateReviewSchema.parse(data))
  .handler(async ({ context, data }): Promise<{ ok: boolean; code?: string }> => {
    const { error } = await context.supabase
      .from("reviews")
      .update({ status: data.status })
      .eq("id", data.reviewId);
    return error ? { ok: false, code: error.message } : { ok: true };
  });

const developerStatusSchema = z.object({
  developerId: z.string().uuid(),
  status: z.enum(["active", "suspended"]),
});

/** Active ou suspend un développeur. */
export const setDeveloperStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => developerStatusSchema.parse(data))
  .handler(async ({ context, data }): Promise<{ ok: boolean; code?: string }> => {
    const { error } = await context.supabase
      .from("developer_profiles")
      .update({ status: data.status })
      .eq("id", data.developerId);
    return error ? { ok: false, code: error.message } : { ok: true };
  });

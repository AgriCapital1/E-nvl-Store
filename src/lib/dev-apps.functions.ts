import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { callRpc } from "@/lib/supabase-rpc";
import {
  appInputSchema,
  fileExtension,
  IMAGE_EXTENSIONS,
  MAX_IMAGE_BYTES,
  MAX_CHECKSUM_BYTES,
  MAX_PACKAGE_BYTES,
  PACKAGE_EXTENSIONS,
  uploadInputSchema,
  versionInputSchema,
  type DeveloperAppRow,
  type DeveloperAppVersion,
  type DevWorkspace,
  type DeveloperStats,
} from "@/lib/dev-apps-types";

export interface DevActionResult {
  ok: boolean;
  code?: string | undefined;
  id?: string | undefined;
}

export interface UploadTarget {
  ok: boolean;
  code?: string | undefined;
  bucket?: string | undefined;
  path?: string | undefined;
  url?: string | undefined;
  token?: string | undefined;
}

/** Espace de travail du développeur connecté : profil, quotas, apps et versions. */
export const getDevWorkspace = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<DevWorkspace> => {
    const supabase = context.supabase;

    const [{ data: profile }, { data: cats }] = await Promise.all([
      supabase
        .from("developer_profiles")
        .select("id, display_name, organization_name, plan_code, status")
        .eq("user_id", context.userId)
        .maybeSingle(),
      supabase
        .from("categories")
        .select("slug, name_fr, sort_order")
        .eq("is_active", true)
        .order("sort_order", { ascending: true }),
    ]);

    const categories = (cats ?? []).map((c) => ({ slug: c.slug, name: c.name_fr }));

    if (!profile) {
      return { hasProfile: false, profile: null, usage: null, apps: [], categories };
    }

    const [{ data: usageRows }, { data: appRows }] = await Promise.all([
      supabase.rpc("developer_usage", { _developer_id: profile.id }),
      supabase
        .from("developer_apps")
        .select(
          "id, name, slug, category, short_description, description, pricing_type, price_fcfa, version, status, downloads, storage_bytes, icon_path, pwa_url, rejection_reason, updated_at",
        )
        .eq("developer_id", profile.id)
        .neq("status", "archived")
        .order("updated_at", { ascending: false }),
    ]);

    const apps = appRows ?? [];
    const appIds = apps.map((a) => a.id);

    let versionsByApp: Record<string, DeveloperAppVersion[]> = {};
    if (appIds.length > 0) {
      const { data: versionRows } = await supabase
        .from("app_versions")
        .select(
          "id, developer_app_id, version, version_code, status, scan_status, crash_rate, apk_size_bytes, release_notes_fr, rejection_reason, created_at",
        )
        .in("developer_app_id", appIds)
        .order("created_at", { ascending: false });

      versionsByApp = (versionRows ?? []).reduce<Record<string, DeveloperAppVersion[]>>(
        (acc, v) => {
          const list = acc[v.developer_app_id] ?? [];
          list.push({
            id: v.id,
            version: v.version,
            versionCode: v.version_code,
            status: v.status,
            scanStatus: v.scan_status,
            crashRate: Number(v.crash_rate ?? 0),
            apkSizeBytes: Number(v.apk_size_bytes ?? 0),
            releaseNotesFr: v.release_notes_fr,
            rejectionReason: v.rejection_reason,
            createdAt: v.created_at,
          });
          acc[v.developer_app_id] = list;
          return acc;
        },
        {},
      );
    }

    const usage = (usageRows as
      | {
          plan_code: string;
          app_count: number;
          app_limit: number;
          storage_used: number;
          storage_limit: number;
          commission_rate: number;
          builds_this_month: number;
          build_limit: number;
        }[]
      | null)?.[0];

    return {
      hasProfile: true,
      profile: {
        id: profile.id,
        displayName: profile.display_name,
        organizationName: profile.organization_name,
        planCode: profile.plan_code,
        status: profile.status,
      },
      usage: usage
        ? {
            planCode: usage.plan_code,
            appCount: Number(usage.app_count ?? 0),
            appLimit: Number(usage.app_limit ?? 0),
            storageUsed: Number(usage.storage_used ?? 0),
            storageLimit: Number(usage.storage_limit ?? 0),
            commissionRate: Number(usage.commission_rate ?? 0),
            buildsThisMonth: Number(usage.builds_this_month ?? 0),
            buildLimit: Number(usage.build_limit ?? 0),
          }
        : null,
      apps: apps.map(
        (a): DeveloperAppRow => ({
          id: a.id,
          name: a.name,
          slug: a.slug,
          category: a.category,
          shortDescription: a.short_description,
          description: a.description,
          pricingType: a.pricing_type,
          priceFcfa: Number(a.price_fcfa ?? 0),
          version: a.version,
          status: a.status,
          downloads: Number(a.downloads ?? 0),
          storageBytes: Number(a.storage_bytes ?? 0),
          iconPath: a.icon_path,
          pwaUrl: a.pwa_url,
          rejectionReason: a.rejection_reason,
          updatedAt: a.updated_at,
          versions: versionsByApp[a.id] ?? [],
        }),
      ),
      categories,
    };
  });

/** Crée (ou complète) le profil développeur de l'utilisateur connecté. */
export const ensureDeveloperProfile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z
      .object({ displayName: z.string().min(2).max(60), country: z.string().max(60).nullish() })
      .parse(data),
  )
  .handler(async ({ data, context }): Promise<DevActionResult> => {
    const { data: result, error } = await callRpc(context.supabase, "become_developer", {
      _display_name: data.displayName,
      _country: data.country ?? null,
    });
    if (error) {
      console.error("become_developer failed", error.message);
      return { ok: false, code: "PROFILE_CREATE_FAILED" };
    }
    return { ok: true, id: typeof result === "string" ? result : undefined };
  });

/** Crée ou met à jour une fiche d'application du développeur. */
export const saveDeveloperApp = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => appInputSchema.parse(data))
  .handler(async ({ data, context }): Promise<DevActionResult> => {
    const supabase = context.supabase;
    const { data: profile } = await supabase
      .from("developer_profiles")
      .select("id")
      .eq("user_id", context.userId)
      .maybeSingle();
    if (!profile) return { ok: false, code: "NO_DEVELOPER_PROFILE" };

    if (data.pricingType === "paid" && data.priceFcfa <= 0) {
      return { ok: false, code: "PRICE_REQUIRED" };
    }

    const payload = {
      developer_id: profile.id,
      name: data.name,
      slug: data.slug,
      category: data.category ?? null,
      short_description: data.shortDescription ?? null,
      description: data.description ?? null,
      pricing_type: data.pricingType,
      price_fcfa: data.pricingType === "paid" ? data.priceFcfa : 0,
      icon_path: data.iconPath ?? null,
      pwa_url: data.pwaUrl ?? null,
    };

    if (data.id) {
      const { error } = await supabase
        .from("developer_apps")
        .update(payload)
        .eq("id", data.id)
        .eq("developer_id", profile.id);
      if (error) {
        console.error("update developer_app", error.message);
        return { ok: false, code: mapDbError(error.message) };
      }
      return { ok: true, id: data.id };
    }

    const { data: created, error } = await supabase
      .from("developer_apps")
      .insert(payload)
      .select("id")
      .maybeSingle();
    if (error || !created) {
      console.error("insert developer_app", error?.message);
      return { ok: false, code: mapDbError(error?.message ?? "") };
    }
    return { ok: true, id: created.id };
  });

/** Archive une application (retirée de l'espace développeur et du catalogue). */
export const archiveDeveloperApp = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => z.object({ appId: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }): Promise<DevActionResult> => {
    const { error } = await context.supabase
      .from("developer_apps")
      .update({ status: "archived" })
      .eq("id", data.appId);
    if (error) {
      console.error("archive developer_app", error.message);
      return { ok: false, code: "ARCHIVE_FAILED" };
    }
    return { ok: true, id: data.appId };
  });

/** URL d'upload signée vers `app-packages` (APK/AAB) ou `app-media` (visuels). */
export const createUploadTarget = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => uploadInputSchema.parse(data))
  .handler(async ({ data, context }): Promise<UploadTarget> => {
    const supabase = context.supabase;
    const { data: profile } = await supabase
      .from("developer_profiles")
      .select("id")
      .eq("user_id", context.userId)
      .maybeSingle();
    if (!profile) return { ok: false, code: "NO_DEVELOPER_PROFILE" };

    const ext = fileExtension(data.fileName);
    const isPackage = data.kind === "package";
    const allowed: readonly string[] = isPackage ? PACKAGE_EXTENSIONS : IMAGE_EXTENSIONS;
    if (!allowed.includes(ext)) return { ok: false, code: "INVALID_EXTENSION" };

    const maxBytes = isPackage ? MAX_PACKAGE_BYTES : MAX_IMAGE_BYTES;
    if (data.fileSize > maxBytes) return { ok: false, code: "FILE_TOO_LARGE" };

    const bucket = isPackage ? "app-packages" : "app-media";
    const path = `${profile.id}/${data.kind}/${crypto.randomUUID()}.${ext}`;

    const { data: signed, error } = await supabase.storage
      .from(bucket)
      .createSignedUploadUrl(path);

    if (error || !signed) {
      console.error("createSignedUploadUrl", error?.message);
      return { ok: false, code: "SIGN_FAILED" };
    }

    return {
      ok: true,
      bucket,
      path: signed.path,
      url: signed.signedUrl,
      token: signed.token,
    };
  });

/** Soumet une nouvelle version (APK déjà déposé) à la revue E'nvlé. */
export const submitVersion = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => versionInputSchema.parse(data))
  .handler(async ({ data, context }): Promise<DevActionResult> => {
    const { data: result, error } = await callRpc(context.supabase, "submit_app_version", {
      _developer_app_id: data.appId,
      _version: data.version,
      _version_code: data.versionCode,
      _apk_path: data.apkPath,
      _apk_size_bytes: data.apkSizeBytes,
      _release_notes_fr: data.releaseNotesFr ?? null,
      _checksum: data.checksum ?? null,
      _pwa_build_id: null,
      _permissions: [],
      _min_android: data.minAndroid ?? null,
    });
    if (error) {
      console.error("submit_app_version failed", error.message);
      return { ok: false, code: "SUBMIT_FAILED" };
    }
    const parsed = z
      .object({ ok: z.boolean(), code: z.string().optional(), version_id: z.string().optional() })
      .safeParse(result);
    if (!parsed.success) return { ok: false, code: "SUBMIT_FAILED" };
    return { ok: parsed.data.ok, code: parsed.data.code, id: parsed.data.version_id };
  });

export interface PackageVerification {
  ok: boolean;
  code?: string | undefined;
  size?: number | undefined;
  checksum?: string | undefined;
}

/**
 * Vérifie côté serveur qu'un paquet téléversé existe réellement dans le bucket
 * `app-packages`, que sa taille correspond à celle annoncée, et calcule son
 * SHA-256 lorsque le fichier reste sous le seuil de téléchargement.
 */
export const verifyPackageUpload = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z
      .object({ path: z.string().min(3).max(300), expectedSize: z.number().int().positive() })
      .parse(data),
  )
  .handler(async ({ data, context }): Promise<PackageVerification> => {
    const supabase = context.supabase;
    const slash = data.path.lastIndexOf("/");
    const dir = slash > 0 ? data.path.slice(0, slash) : "";
    const fileName = slash > 0 ? data.path.slice(slash + 1) : data.path;

    const { data: entries, error } = await supabase.storage
      .from("app-packages")
      .list(dir, { search: fileName, limit: 100 });
    if (error) {
      console.error("verifyPackageUpload list failed", error.message);
      return { ok: false, code: "FILE_MISSING" };
    }
    const found = (entries ?? []).find((e) => e.name === fileName);
    if (!found) return { ok: false, code: "FILE_MISSING" };

    const size = Number(
      (found.metadata as { size?: number } | null)?.size ?? 0,
    );
    if (size !== data.expectedSize) {
      return { ok: false, code: "SIZE_MISMATCH", size };
    }

    let checksum: string | undefined;
    if (size <= MAX_CHECKSUM_BYTES) {
      const { data: blob } = await supabase.storage.from("app-packages").download(data.path);
      if (blob) {
        const digest = await crypto.subtle.digest("SHA-256", await blob.arrayBuffer());
        checksum = Array.from(new Uint8Array(digest))
          .map((b) => b.toString(16).padStart(2, "0"))
          .join("");
      }
    }

    return { ok: true, size, checksum };
  });

/** Statistiques réelles : installations sur 7 jours et versions à risque. */
export const getDevStats = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<DeveloperStats> => {
    const supabase = context.supabase;
    const { data: profile } = await supabase
      .from("developer_profiles")
      .select("id")
      .eq("user_id", context.userId)
      .maybeSingle();

    if (!profile) {
      return { hasProfile: false, totalInstalls: 0, installs7d: [], riskyVersions: [] };
    }

    const { loadInstallStats } = await import("@/lib/dev-stats.server");
    const [{ totalInstalls, installs7d }, { data: apps }] = await Promise.all([
      loadInstallStats(profile.id),
      supabase
        .from("developer_apps")
        .select("id, name")
        .eq("developer_id", profile.id)
        .neq("status", "archived"),
    ]);

    const names = new Map((apps ?? []).map((a) => [a.id, a.name] as const));
    let riskyVersions: DeveloperStats["riskyVersions"] = [];

    if (names.size > 0) {
      const { data: versions } = await supabase
        .from("app_versions")
        .select("developer_app_id, version, crash_rate, status")
        .in("developer_app_id", [...names.keys()])
        .order("crash_rate", { ascending: false })
        .limit(10);

      riskyVersions = (versions ?? [])
        .filter((v) => Number(v.crash_rate ?? 0) > 0)
        .map((v) => ({
          appName: names.get(v.developer_app_id) ?? "—",
          version: v.version,
          crashRate: Number(v.crash_rate ?? 0),
          status: v.status,
        }));
    }

    return { hasProfile: true, totalInstalls, installs7d, riskyVersions };
  });

/** Traduit les erreurs Postgres courantes en codes exploitables par l'UI. */
function mapDbError(message: string): string {
  if (message.includes("PLAN_APP_LIMIT_REACHED")) return "PLAN_APP_LIMIT_REACHED";
  if (message.includes("duplicate key")) return "SLUG_TAKEN";
  return "SAVE_FAILED";
}

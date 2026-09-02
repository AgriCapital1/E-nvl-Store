import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export interface PackageVersionRow {
  id: string;
  version: string;
  versionCode: number;
  status: string;
  apkPath: string | null;
  apkSizeBytes: number;
  checksum: string | null;
  releaseNotesFr: string | null;
  createdAt: string;
}

export interface PackageAppRow {
  id: string;
  name: string;
  slug: string;
  version: string | null;
  status: string;
  downloads: number;
  storageBytes: number;
  updatedAt: string;
  versions: PackageVersionRow[];
}

export interface PackagesWorkspace {
  hasProfile: boolean;
  apps: PackageAppRow[];
}

/** Applications déjà publiées du développeur, avec toutes leurs versions APK/AAB. */
export const listDeveloperPackages = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<PackagesWorkspace> => {
    const supabase = context.supabase;
    const { data: profile } = await supabase
      .from("developer_profiles")
      .select("id")
      .eq("user_id", context.userId)
      .maybeSingle();
    if (!profile) return { hasProfile: false, apps: [] };

    const { data: appRows } = await supabase
      .from("developer_apps")
      .select("id, name, slug, version, status, downloads, storage_bytes, updated_at")
      .eq("developer_id", profile.id)
      .order("updated_at", { ascending: false });

    const apps = appRows ?? [];
    const ids = apps.map((a) => a.id);
    let byApp: Record<string, PackageVersionRow[]> = {};

    if (ids.length > 0) {
      const { data: versions } = await supabase
        .from("app_versions")
        .select(
          "id, developer_app_id, version, version_code, status, apk_path, apk_size_bytes, checksum_sha256, release_notes_fr, created_at",
        )
        .in("developer_app_id", ids)
        .order("version_code", { ascending: false });

      byApp = (versions ?? []).reduce<Record<string, PackageVersionRow[]>>((acc, v) => {
        const list = acc[v.developer_app_id] ?? [];
        list.push({
          id: v.id,
          version: v.version,
          versionCode: v.version_code,
          status: v.status,
          apkPath: v.apk_path,
          apkSizeBytes: Number(v.apk_size_bytes ?? 0),
          checksum: v.checksum_sha256,
          releaseNotesFr: v.release_notes_fr,
          createdAt: v.created_at,
        });
        acc[v.developer_app_id] = list;
        return acc;
      }, {});
    }

    return {
      hasProfile: true,
      apps: apps.map((a) => ({
        id: a.id,
        name: a.name,
        slug: a.slug,
        version: a.version,
        status: a.status,
        downloads: Number(a.downloads ?? 0),
        storageBytes: Number(a.storage_bytes ?? 0),
        updatedAt: a.updated_at,
        versions: byApp[a.id] ?? [],
      })),
    };
  });

/** Lien de téléchargement signé (5 min) pour un paquet appartenant au développeur. */
export const getPackageDownloadUrl = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => z.object({ versionId: z.string().uuid() }).parse(data))
  .handler(
    async ({ data, context }): Promise<{ ok: boolean; code?: string; url?: string }> => {
      const supabase = context.supabase;
      // RLS restreint app_versions aux apps du développeur connecté.
      const { data: version } = await supabase
        .from("app_versions")
        .select("apk_path")
        .eq("id", data.versionId)
        .maybeSingle();

      if (!version?.apk_path) return { ok: false, code: "NO_ARTIFACT" };

      const { data: signed, error } = await supabase.storage
        .from("app-packages")
        .createSignedUrl(version.apk_path, 300, { download: true });

      if (error || !signed) {
        console.error("createSignedUrl package", error?.message);
        return { ok: false, code: "SIGN_FAILED" };
      }
      return { ok: true, url: signed.signedUrl };
    },
  );

/** Archive ou réactive une application publiée, sans passer par un build. */
export const setAppArchived = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z.object({ appId: z.string().uuid(), archived: z.boolean() }).parse(data),
  )
  .handler(async ({ data, context }): Promise<{ ok: boolean; code?: string }> => {
    const { error } = await context.supabase
      .from("developer_apps")
      .update({ status: data.archived ? "archived" : "draft" })
      .eq("id", data.appId);
    if (error) {
      console.error("setAppArchived", error.message);
      return { ok: false, code: "UPDATE_FAILED" };
    }
    return { ok: true };
  });

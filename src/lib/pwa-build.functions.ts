import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export interface PwaCheck {
  id: string;
  label: string;
  status: "pass" | "warn" | "fail";
  detail: string;
}

export interface PwaValidation {
  url: string;
  eligible: boolean;
  checks: PwaCheck[];
  appName: string | null;
  themeColor: string | null;
  suggestedPackage: string | null;
  iconUrl: string | null;
}

export interface PwaBuildRow {
  id: string;
  reference: string;
  app_name: string;
  package_name: string;
  source_url: string;
  status: string;
  progress: number;
  queue_position: number | null;
  artifact_path: string | null;
  artifact_size_bytes: number | null;
  error_code: string | null;
  error_message: string | null;
  created_at: string;
  finished_at: string | null;
}

export interface BuildRequestResult {
  ok: boolean;
  code?: string | undefined;
  reference?: string | undefined;
  queue_position?: number | undefined;
}

/** Validation runtime des réponses jsonb de `request_pwa_build`. */
const buildRequestResultSchema = z.object({
  ok: z.boolean(),
  code: z.string().optional(),
  reference: z.string().optional(),
  queue_position: z.number().optional(),
});

function parseBuildResult(value: unknown): BuildRequestResult {
  const parsed = buildRequestResultSchema.safeParse(value);
  if (!parsed.success) {
    console.error("Réponse RPC inattendue", parsed.error.message);
    return { ok: false, code: "BUILD_REQUEST_FAILED" };
  }
  return parsed.data;
}

/** Validation runtime des lignes de builds renvoyées au client. */
const pwaBuildRowSchema = z.object({
  id: z.string(),
  reference: z.string(),
  app_name: z.string(),
  package_name: z.string(),
  source_url: z.string(),
  status: z.string(),
  progress: z.number(),
  queue_position: z.number().nullable(),
  artifact_path: z.string().nullable(),
  artifact_size_bytes: z.number().nullable(),
  error_code: z.string().nullable(),
  error_message: z.string().nullable(),
  created_at: z.string(),
  finished_at: z.string().nullable(),
});

const MAX_BYTES = 2_000_000;
const FETCH_TIMEOUT_MS = 8_000;

function normalizeUrl(raw: string): string {
  const trimmed = raw.trim();
  const withScheme = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  return new URL(withScheme).toString();
}

/** Bloque les adresses IP privées, loopback, link-local et réservées (anti-SSRF). */
function isBlockedIp(host: string): boolean {
  const v4 = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/.exec(host);
  if (v4) {
    const [a, b] = [Number(v4[1]), Number(v4[2])];
    if ([a, b].some((n) => Number.isNaN(n) || n > 255)) return true;
    if (a === 0 || a === 10 || a === 127) return true;
    if (a === 169 && b === 254) return true; // link-local / métadonnées cloud
    if (a === 172 && b >= 16 && b <= 31) return true;
    if (a === 192 && b === 168) return true;
    if (a === 192 && b === 0) return true;
    if (a === 100 && b >= 64 && b <= 127) return true; // CGNAT
    if (a >= 224) return true; // multicast / réservé
    return false;
  }
  if (host.includes(":")) {
    const ip = host.replace(/^\[|\]$/g, "").toLowerCase();
    if (ip === "::" || ip === "::1") return true;
    if (/^(fc|fd|fe8|fe9|fea|feb)/.test(ip)) return true; // ULA / link-local
    if (ip.startsWith("::ffff:")) return isBlockedIp(ip.slice(7));
    return true; // toute autre IPv6 littérale : refusée par prudence
  }
  return false;
}

function isAllowedHost(hostname: string): boolean {
  const host = hostname.toLowerCase().replace(/\.$/, "");
  if (!host || host === "localhost" || host.endsWith(".localhost")) return false;
  if (host.endsWith(".internal") || host.endsWith(".local")) return false;
  if (!host.includes(".")) return false; // pas de nom d'hôte interne sans domaine
  if (isBlockedIp(host)) return false;
  return true;
}

const DNS_TIMEOUT_MS = 4_000;
const dnsCache = new Map<string, boolean>();

/**
 * Résolution DNS (DoH) de l'hôte : refuse si un enregistrement A/AAAA pointe
 * vers une adresse privée, loopback, link-local ou réservée (anti DNS rebinding).
 * Échec fermé : toute erreur de résolution refuse la cible.
 */
async function resolvesToPublicIp(hostname: string): Promise<boolean> {
  const host = hostname.toLowerCase().replace(/\.$/, "");
  if (isBlockedIp(host)) return false;
  // Adresse IP littérale déjà validée par isBlockedIp : pas de DNS à faire.
  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(host) || host.includes(":")) return true;

  const cached = dnsCache.get(host);
  if (cached !== undefined) return cached;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), DNS_TIMEOUT_MS);
  try {
    const answers: { type: number; data: string }[] = [];
    for (const type of ["A", "AAAA"] as const) {
      const res = await fetch(
        `https://cloudflare-dns.com/dns-query?name=${encodeURIComponent(host)}&type=${type}`,
        { headers: { accept: "application/dns-json" }, signal: controller.signal },
      );
      if (!res.ok) return false;
      const json = (await res.json()) as { Status?: number; Answer?: { type: number; data: string }[] };
      if (json.Status !== 0 && json.Status !== 3) return false; // 3 = NXDOMAIN pour ce type
      for (const a of json.Answer ?? []) answers.push(a);
    }

    const ips = answers.filter((a) => a.type === 1 || a.type === 28).map((a) => a.data);
    // Aucune adresse résolue, ou au moins une adresse interne → refus.
    const ok = ips.length > 0 && ips.every((ip) => !isBlockedIp(ip));
    dnsCache.set(host, ok);
    return ok;
  } catch {
    return false;
  } finally {
    clearTimeout(timer);
  }
}

async function isSafeTarget(target: URL): Promise<boolean> {
  if (target.protocol !== "https:") return false;
  if (!isAllowedHost(target.hostname)) return false;
  return await resolvesToPublicIp(target.hostname);
}

/**
 * fetch durci : HTTPS uniquement, hôtes publics uniquement (validés par DNS),
 * redirections revalidées une par une, délai et taille de réponse plafonnés.
 */
async function safeFetch(
  target: URL,
): Promise<{ ok: boolean; status: number; body: string; contentType: string } | null> {
  let current = new URL(target.toString());

  for (let hop = 0; hop < 4; hop += 1) {
    if (!(await isSafeTarget(current))) return null;


    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
    try {
      const res = await fetch(current.toString(), {
        headers: { "user-agent": "EnvleStoreBot/1.0 (+https://envle.app)" },
        redirect: "manual",
        signal: controller.signal,
      });

      if (res.status >= 300 && res.status < 400) {
        const location = res.headers.get("location");
        if (!location) return null;
        current = new URL(location, current);
        continue;
      }

      const contentType = res.headers.get("content-type") ?? "";
      const declared = Number(res.headers.get("content-length") ?? "0");
      if (declared > MAX_BYTES) return null;
      const body = res.ok ? (await res.text()).slice(0, MAX_BYTES) : "";
      return { ok: res.ok, status: res.status, body, contentType };
    } catch {
      return null;
    } finally {
      clearTimeout(timer);
    }
  }
  return null;
}

function suggestPackage(host: string): string {
  const parts = host.split(".").filter((p) => p && p !== "www").reverse();
  const cleaned = parts.map((p) => p.replace(/[^a-z0-9]/gi, "").toLowerCase() || "app");
  const withPrefix = cleaned.length >= 2 ? cleaned : ["ci", ...cleaned];
  return withPrefix.map((p) => (/^[a-z]/.test(p) ? p : `a${p}`)).join(".");
}

/** Validation réelle d'une PWA : HTTPS, manifest, icônes, service worker. */
export const validatePwa = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => z.object({ url: z.string().min(4).max(300) }).parse(data))
  .handler(async ({ data }): Promise<PwaValidation> => {
    const checks: PwaCheck[] = [];
    let url: URL;
    try {
      url = new URL(normalizeUrl(data.url));
    } catch {
      return {
        url: data.url,
        eligible: false,
        checks: [{ id: "url", label: "Adresse du site", status: "fail", detail: "Adresse invalide." }],
        appName: null,
        themeColor: null,
        suggestedPackage: null,
        iconUrl: null,
      };
    }

    const httpsOk = url.protocol === "https:";
    checks.push({
      id: "https",
      label: "HTTPS",
      status: httpsOk ? "pass" : "fail",
      detail: httpsOk ? `Certificat requis présent sur ${url.host}` : "Le site doit être servi en HTTPS.",
    });

    if (!(await isSafeTarget(url))) {
      checks.push({
        id: "host",
        label: "Hôte public",
        status: "fail",
        detail: "Cette adresse cible un réseau interne ou privé et ne peut pas être analysée.",
      });
      return {
        url: url.toString(),
        eligible: false,
        checks,
        appName: null,
        themeColor: null,
        suggestedPackage: null,
        iconUrl: null,
      };
    }

    let html = "";
    const page = await safeFetch(url);
    if (page) {
      checks.push({
        id: "reachable",
        label: "Site accessible",
        status: page.ok ? "pass" : "fail",
        detail: `Réponse HTTP ${page.status}`,
      });
      html = page.body;
    } else {
      checks.push({
        id: "reachable",
        label: "Site accessible",
        status: "fail",
        detail: "Impossible de joindre le site (hôte refusé, délai dépassé ou réponse trop volumineuse).",
      });
    }

    let manifest: Record<string, unknown> | null = null;
    let manifestUrl: string | null = null;

    if (html) {
      const match =
        /<link[^>]+rel=["'][^"']*manifest[^"']*["'][^>]*>/i.exec(html) ??
        /<link[^>]*href=["'][^"']*manifest[^"']*\.json[^"']*["'][^>]*>/i.exec(html);
      const hrefMatch = match ? /href=["']([^"']+)["']/i.exec(match[0]) : null;
      const candidates = [hrefMatch?.[1], "/manifest.webmanifest", "/manifest.json"].filter(
        Boolean,
      ) as string[];

      for (const candidate of candidates) {
        let resolved: URL;
        try {
          resolved = new URL(candidate, url);
        } catch {
          continue;
        }
        const res = await safeFetch(resolved);
        if (!res?.ok) continue;
        try {
          manifest = JSON.parse(res.body) as Record<string, unknown>;
        } catch {
          continue;
        }
        manifestUrl = resolved.toString();
        break;
      }
    }

    checks.push({
      id: "manifest",
      label: "Web App Manifest",
      status: manifest ? "pass" : "fail",
      detail: manifest ? `Manifest chargé : ${manifestUrl}` : "Aucun manifest valide trouvé.",
    });

    const display = typeof manifest?.["display"] === "string" ? (manifest["display"] as string) : null;
    if (manifest) {
      const displayOk = display === "standalone" || display === "fullscreen" || display === "minimal-ui";
      checks.push({
        id: "display",
        label: "Mode d'affichage",
        status: displayOk ? "pass" : "warn",
        detail: displayOk ? `display: ${display}` : `display: ${display ?? "non défini"} (standalone recommandé)`,
      });
    }

    const icons = Array.isArray(manifest?.["icons"])
      ? (manifest["icons"] as { src?: string; sizes?: string; purpose?: string }[])
      : [];
    const sizeList = icons.flatMap((i) => (i.sizes ?? "").split(/\s+/)).filter(Boolean);
    const has192 = sizeList.some((s) => /^(\d+)x\1$/.test(s) && parseInt(s) >= 192);
    const has512 = sizeList.some((s) => /^(\d+)x\1$/.test(s) && parseInt(s) >= 512);
    const maskable = icons.some((i) => (i.purpose ?? "").includes("maskable"));

    if (manifest) {
      checks.push({
        id: "icons",
        label: "Icônes",
        status: has192 && has512 ? "pass" : "fail",
        detail:
          icons.length === 0
            ? "Aucune icône déclarée dans le manifest."
            : `${icons.length} icône(s) — 192px ${has192 ? "OK" : "manquante"}, 512px ${has512 ? "OK" : "manquante"}`,
      });
      checks.push({
        id: "maskable",
        label: "Icône maskable",
        status: maskable ? "pass" : "warn",
        detail: maskable ? "purpose: maskable présent" : "Ajoutez une icône maskable pour un rendu Android optimal.",
      });
      const nameOk = typeof manifest["name"] === "string" || typeof manifest["short_name"] === "string";
      checks.push({
        id: "name",
        label: "Nom de l'application",
        status: nameOk ? "pass" : "fail",
        detail: nameOk
          ? String(manifest["name"] ?? manifest["short_name"])
          : "Le manifest doit contenir name ou short_name.",
      });
    }

    let swFound = /serviceWorker\s*\.\s*register/i.test(html);
    if (!swFound) {
      for (const candidate of ["/sw.js", "/service-worker.js", "/serviceworker.js"]) {
        let resolved: URL;
        try {
          resolved = new URL(candidate, url);
        } catch {
          continue;
        }
        const res = await safeFetch(resolved);
        if (res?.ok && /javascript|text\/plain/.test(res.contentType)) {
          swFound = true;
          break;
        }
      }
    }
    checks.push({
      id: "sw",
      label: "Service worker",
      status: swFound ? "pass" : "warn",
      detail: swFound ? "Service worker détecté (mode hors-ligne possible)." : "Aucun service worker détecté.",
    });

    const iconSrc = icons.find((i) => (i.sizes ?? "").includes("512"))?.src ?? icons[0]?.src ?? null;
    const appName =
      (typeof manifest?.["name"] === "string" && (manifest["name"] as string)) ||
      (typeof manifest?.["short_name"] === "string" && (manifest["short_name"] as string)) ||
      null;

    return {
      url: url.toString(),
      eligible: checks.every((c) => c.status !== "fail"),
      checks,
      appName,
      themeColor:
        typeof manifest?.["theme_color"] === "string" ? (manifest["theme_color"] as string) : null,
      suggestedPackage: suggestPackage(url.hostname),
      iconUrl: iconSrc && manifestUrl ? new URL(iconSrc, manifestUrl).toString() : null,
    };
  });

const rpc = (
  client: { rpc: unknown },
  fn: string,
  args: Record<string, unknown>,
): Promise<{ data: unknown; error: { message: string } | null }> =>
  (client.rpc as (f: string, a: Record<string, unknown>) => Promise<{ data: unknown; error: { message: string } | null }>)(
    fn,
    args,
  );

/** Enregistre une demande de build APK (quota du plan vérifié côté base). */
export const requestPwaBuild = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z
      .object({
        sourceUrl: z.string().url().startsWith("https://"),
        appName: z.string().min(2).max(60),
        packageName: z
          .string()
          .regex(/^[a-z][a-z0-9_]*(\.[a-z0-9_]+)+$/, "Nom de paquet Android invalide"),
        themeColor: z.string().max(20).nullish(),
        options: z.record(z.string(), z.unknown()).optional(),
      })
      .parse(data),
  )
  .handler(async ({ data, context }): Promise<BuildRequestResult> => {
    // Anti-SSRF : l'URL soumise au worker de build doit pointer vers un hôte public.
    let sourceUrl: URL;
    try {
      sourceUrl = new URL(data.sourceUrl);
    } catch {
      return { ok: false, code: "INVALID_URL" };
    }
    if (!(await isSafeTarget(sourceUrl))) {
      return { ok: false, code: "BLOCKED_HOST" };
    }

    const { data: result, error } = await rpc(context.supabase, "request_pwa_build", {

      _source_url: data.sourceUrl,
      _app_name: data.appName,
      _package_name: data.packageName,
      _theme_color: data.themeColor ?? null,
      _developer_app_id: null,
      _options: data.options ?? {},
    });
    if (error) {
      console.error("request_pwa_build failed", error.message);
      return { ok: false, code: "BUILD_REQUEST_FAILED" };
    }

    const parsedResult = parseBuildResult(result);
    if (!parsedResult.ok || !parsedResult.reference) {
      return parsedResult;
    }

    // Déclenchement du moteur de compilation Android.
    const { data: row } = await context.supabase
      .from("pwa_builds")
      .select("id")
      .eq("reference", parsedResult.reference)
      .maybeSingle();

    if (!row?.id) {
      return parsedResult;
    }

    const { dispatchAndroidBuild } = await import("./github-dispatch.server");
    const dispatch = await dispatchAndroidBuild({
      buildId: row.id as string,
      reference: parsedResult.reference,
      sourceUrl: data.sourceUrl,
      appName: data.appName,
      packageName: data.packageName,
      themeColor: data.themeColor ?? null,
    });

    if (!dispatch.ok) {
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      await rpc(supabaseAdmin as unknown as { rpc: unknown }, "update_pwa_build_status", {
        _build_id: row.id,
        _status: "failed",
        _progress: null,
        _artifact_path: null,
        _artifact_size_bytes: null,
        _error_code: dispatch.code,
        _error_message:
          dispatch.code === "NOT_CONFIGURED"
            ? "Moteur de compilation non configuré."
            : "Le moteur de compilation n'a pas pu être démarré.",
      });
      return { ok: false, code: dispatch.code };
    }

    return parsedResult;
  });

/** Historique des builds du développeur connecté. */
export const listPwaBuilds = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<PwaBuildRow[]> => {
    const { data } = await context.supabase
      .from("pwa_builds")
      .select(
        "id, reference, app_name, package_name, source_url, status, progress, queue_position, artifact_path, artifact_size_bytes, error_code, error_message, created_at, finished_at",
      )
      .order("created_at", { ascending: false })
      .limit(20);
    const parsed = z.array(pwaBuildRowSchema).safeParse(data ?? []);
    if (!parsed.success) {
      console.error("Lignes de build invalides", parsed.error.message);
      return [];
    }
    return parsed.data;
  });

/** Lien de téléchargement temporaire de l'APK produit (Storage privé). */
export const getBuildArtifactUrl = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => z.object({ buildId: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }) => {
    const { data: build } = await context.supabase
      .from("pwa_builds")
      .select("artifact_path, status")
      .eq("id", data.buildId)
      .maybeSingle();

    if (!build?.artifact_path || build.status !== "succeeded") {
      return { ok: false as const, code: "ARTIFACT_NOT_READY" };
    }

    const { data: signed, error } = await context.supabase.storage
      .from("app-builds")
      .createSignedUrl(build.artifact_path, 600);

    if (error || !signed) {
      return { ok: false as const, code: "SIGN_FAILED" };
    }
    return { ok: true as const, url: signed.signedUrl };
  });

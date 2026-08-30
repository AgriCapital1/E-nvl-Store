/**
 * Déclenchement du moteur de compilation Android (GitHub Actions).
 * Invisible pour le développeur : côté produit, il ne voit qu'un build E'nvlé.
 * Ne jamais importer ce module depuis du code client.
 */

export interface AndroidBuildDispatch {
  buildId: string;
  reference: string;
  sourceUrl: string;
  appName: string;
  packageName: string;
  themeColor?: string | null;
}

export type DispatchResult =
  | { ok: true }
  | { ok: false; code: "NOT_CONFIGURED" | "DISPATCH_FAILED"; detail?: string };

/** URL publique de l'application (pour le callback du worker). */
function publicBaseUrl(): string {
  return (
    process.env["ENVLE_PUBLIC_URL"] ??
    "https://project--67ff7089-8e67-4f97-adc0-c800390732b5.lovable.app"
  );
}

export async function dispatchAndroidBuild(
  build: AndroidBuildDispatch,
): Promise<DispatchResult> {
  const token = process.env["GITHUB_BUILD_TOKEN"];
  const repo = normalizeRepo(process.env["GITHUB_BUILD_REPO"]); // format "owner/repo"
  const callbackSecret = process.env["ENVLE_BUILD_CALLBACK_SECRET"];

  if (!token || !repo || !callbackSecret) {
    return { ok: false, code: "NOT_CONFIGURED" };
  }

  const res = await fetch(`https://api.github.com/repos/${repo}/dispatches`, {
    method: "POST",
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${token}`,
      "X-GitHub-Api-Version": "2022-11-28",
      "Content-Type": "application/json",
      "User-Agent": "envle-build-dispatcher",
    },
    body: JSON.stringify({
      event_type: "envle-pwa-build",
      client_payload: {
        build_id: build.buildId,
        reference: build.reference,
        source_url: build.sourceUrl,
        app_name: build.appName,
        package_name: build.packageName,
        theme_color: build.themeColor ?? "#111827",
        callback_url: `${publicBaseUrl()}/api/public/build-callback`,
      },
    }),
  });

  if (!res.ok) {
    const detail = (await res.text()).slice(0, 300);
    console.error("GitHub dispatch failed", res.status, detail);
    return { ok: false, code: "DISPATCH_FAILED", detail: `${res.status}` };
  }

  return { ok: true };
}

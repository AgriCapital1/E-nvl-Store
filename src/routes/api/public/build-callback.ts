import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

const payloadSchema = z.object({
  build_id: z.string().uuid(),
  status: z.enum([
    "queued",
    "preparing",
    "building",
    "signing",
    "uploading",
    "succeeded",
    "failed",
    "cancelled",
  ]),
  progress: z.number().int().min(0).max(100).optional(),
  artifact_path: z.string().max(400).optional(),
  artifact_size_bytes: z.number().int().nonnegative().optional(),
  error_code: z.string().max(80).optional(),
  error_message: z.string().max(600).optional(),
});

function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i += 1) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

/**
 * Callback appelé par le worker de build Android en fin de build.
 * Authentifié par un secret partagé (en-tête x-envle-build-secret).
 */
export const Route = createFileRoute("/api/public/build-callback")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const secret = process.env["ENVLE_BUILD_CALLBACK_SECRET"];
        if (!secret) {
          return new Response("Build callback not configured", { status: 503 });
        }

        const provided = request.headers.get("x-envle-build-secret") ?? "";
        if (!safeEqual(provided, secret)) {
          return new Response("Unauthorized", { status: 401 });
        }

        let parsed;
        try {
          parsed = payloadSchema.parse(await request.json());
        } catch {
          return new Response("Invalid payload", { status: 400 });
        }

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

        // Un build n'est « succeeded » qu'après vérification réelle de l'artefact en bucket.
        let status: string = parsed.status;
        let errorCode = parsed.error_code ?? null;
        let errorMessage = parsed.error_message ?? null;

        if (parsed.status === "succeeded") {
          const path = parsed.artifact_path ?? "";
          const slash = path.lastIndexOf("/");
          const dir = slash > 0 ? path.slice(0, slash) : "";
          const fileName = slash > 0 ? path.slice(slash + 1) : path;

          const { data: entries } = await supabaseAdmin.storage
            .from("app-builds")
            .list(dir, { search: fileName, limit: 100 });
          const found = (entries ?? []).find((e) => e.name === fileName);
          const size = Number((found?.metadata as { size?: number } | null)?.size ?? 0);

          if (!path || !found || size <= 0) {
            status = "failed";
            errorCode = "ARTIFACT_MISSING";
            errorMessage = "L'APK annoncé est introuvable dans le stockage E'nvlé.";
          } else if (
            typeof parsed.artifact_size_bytes === "number" &&
            parsed.artifact_size_bytes !== size
          ) {
            status = "failed";
            errorCode = "ARTIFACT_MISSING";
            errorMessage = "La taille de l'APK stocké ne correspond pas au build.";
          }
        }

        const { error } = await (
          supabaseAdmin.rpc as unknown as (
            fn: string,
            args: Record<string, unknown>,
          ) => Promise<{ error: { message: string } | null }>
        )("update_pwa_build_status", {
          _build_id: parsed.build_id,
          _status: status,
          _progress: parsed.progress ?? null,
          _artifact_path: parsed.artifact_path ?? null,
          _artifact_size_bytes: parsed.artifact_size_bytes ?? null,
          _error_code: errorCode,
          _error_message: errorMessage,
        });

        if (error) {
          console.error("update_pwa_build_status failed", error.message);
          return new Response("Update failed", { status: 500 });
        }

        return Response.json({ ok: true, status });
      },
    },
  },
});

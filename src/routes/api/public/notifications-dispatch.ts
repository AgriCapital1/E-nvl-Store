import { createFileRoute } from "@tanstack/react-router";

interface QueuedNotification {
  id: string;
  channel: string;
  destination: string | null;
  subject: string;
  body: string;
  developer_id: string;
}

function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i += 1) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

/**
 * Envoi des notifications de retrait en attente (e-mail / WhatsApp).
 * Protégé par le secret partagé ENVLE_BUILD_CALLBACK_SECRET.
 */
export const Route = createFileRoute("/api/public/notifications-dispatch")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const secret = process.env["ENVLE_BUILD_CALLBACK_SECRET"];
        if (!secret) return new Response("Not configured", { status: 503 });
        if (!safeEqual(request.headers.get("x-envle-build-secret") ?? "", secret)) {
          return new Response("Unauthorized", { status: 401 });
        }

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { data, error } = await supabaseAdmin
          .from("withdrawal_notifications")
          .select("id, channel, destination, subject, body, developer_id")
          .eq("delivery_status", "queued")
          .order("created_at")
          .limit(50);

        if (error) {
          console.error("notification fetch failed", error.message);
          return new Response("Fetch failed", { status: 500 });
        }

        const queue = (data ?? []) as QueuedNotification[];
        const resendKey = process.env["RESEND_API_KEY"];
        const whatsappToken = process.env["WHATSAPP_TOKEN"];
        const whatsappPhoneId = process.env["WHATSAPP_PHONE_NUMBER_ID"];

        let sent = 0;
        let skipped = 0;

        for (const item of queue) {
          let deliveryStatus = "skipped";
          let deliveryError: string | null = "Canal non configuré (secret manquant).";

          try {
            if (item.channel === "whatsapp" && whatsappToken && whatsappPhoneId && item.destination) {
              const res = await fetch(
                `https://graph.facebook.com/v21.0/${whatsappPhoneId}/messages`,
                {
                  method: "POST",
                  headers: {
                    Authorization: `Bearer ${whatsappToken}`,
                    "content-type": "application/json",
                  },
                  body: JSON.stringify({
                    messaging_product: "whatsapp",
                    to: item.destination.replace(/\D/g, ""),
                    type: "text",
                    text: { body: `${item.subject}\n\n${item.body}` },
                  }),
                },
              );
              deliveryStatus = res.ok ? "sent" : "failed";
              deliveryError = res.ok ? null : `WhatsApp HTTP ${res.status}`;
            } else if (item.channel === "email" && resendKey) {
              const { data: userRow } = await supabaseAdmin
                .from("developer_profiles")
                .select("user_id")
                .eq("id", item.developer_id)
                .maybeSingle();
              const authUser = userRow?.user_id
                ? await supabaseAdmin.auth.admin.getUserById(userRow.user_id)
                : null;
              const email = authUser?.data.user?.email;

              if (!email) {
                deliveryStatus = "failed";
                deliveryError = "Adresse e-mail introuvable";
              } else {
                const res = await fetch("https://api.resend.com/emails", {
                  method: "POST",
                  headers: {
                    Authorization: `Bearer ${resendKey}`,
                    "content-type": "application/json",
                  },
                  body: JSON.stringify({
                    from: "E'nvlé Store <notifications@envle.app>",
                    to: [email],
                    subject: item.subject,
                    text: item.body,
                  }),
                });
                deliveryStatus = res.ok ? "sent" : "failed";
                deliveryError = res.ok ? null : `Resend HTTP ${res.status}`;
              }
            }
          } catch (err) {
            deliveryStatus = "failed";
            deliveryError = (err as Error).message.slice(0, 200);
          }

          if (deliveryStatus === "sent") sent += 1;
          else skipped += 1;

          await supabaseAdmin
            .from("withdrawal_notifications")
            .update({
              delivery_status: deliveryStatus,
              delivery_error: deliveryError,
              sent_at: deliveryStatus === "sent" ? new Date().toISOString() : null,
            })
            .eq("id", item.id);
        }

        return Response.json({ ok: true, processed: queue.length, sent, skipped });
      },
    },
  },
});

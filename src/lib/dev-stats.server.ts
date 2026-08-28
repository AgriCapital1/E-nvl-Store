import type { DailyInstalls } from "@/lib/dev-apps-types";

/**
 * Agrégat réel des installations sur 7 jours pour un développeur.
 * Lecture privilégiée volontaire : les policies `installs` limitent la lecture
 * à l'utilisateur installateur, alors que le développeur doit voir le total
 * de SES applications uniquement (filtre explicite ci-dessous).
 */
export async function loadInstallStats(developerId: string): Promise<{
  totalInstalls: number;
  installs7d: DailyInstalls[];
}> {
  const days = buildDayBuckets();
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

  const { data: apps } = await supabaseAdmin
    .from("store_apps")
    .select("id")
    .eq("developer_id", developerId);

  const ids = (apps ?? []).map((a) => a.id);
  if (ids.length === 0) return { totalInstalls: 0, installs7d: days };

  const since = new Date(Date.now() - 6 * 86_400_000);
  since.setUTCHours(0, 0, 0, 0);

  const [{ count }, { data: rows }] = await Promise.all([
    supabaseAdmin
      .from("installs")
      .select("id", { count: "exact", head: true })
      .in("store_app_id", ids),
    supabaseAdmin
      .from("installs")
      .select("created_at")
      .in("store_app_id", ids)
      .gte("created_at", since.toISOString())
      .limit(10000),
  ]);

  for (const row of rows ?? []) {
    const key = String(row.created_at).slice(0, 10);
    const bucket = days.find((d) => d.day === key);
    if (bucket) bucket.value += 1;
  }

  return { totalInstalls: count ?? 0, installs7d: days };
}

function buildDayBuckets(): DailyInstalls[] {
  const out: DailyInstalls[] = [];
  for (let i = 6; i >= 0; i -= 1) {
    const d = new Date(Date.now() - i * 86_400_000);
    out.push({
      day: d.toISOString().slice(0, 10),
      label: d.toLocaleDateString("fr-FR", { weekday: "short" }).replace(".", ""),
      value: 0,
    });
  }
  return out;
}

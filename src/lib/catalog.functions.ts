import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { fetchCategories, fetchPublishedApp, fetchPublishedApps } from "@/lib/catalog.server";
import type { AppItem, CategoryItem } from "@/lib/catalog-types";
import { APPS as DEMO_APPS } from "@/lib/mock-data";

/** Seuil de bascule : au-delà, le catalogue n'affiche plus d'applications de démonstration. */
export const DEMO_THRESHOLD = 10;

/**
 * Liste publique des applications publiées (lecture anon, RLS appliquée).
 * Tant que le catalogue réel compte moins de 10 applications, des applications
 * de démonstration complètent la vitrine ; elles disparaissent automatiquement
 * dès la 10ᵉ application réelle publiée.
 */
export const listCatalogApps = createServerFn({ method: "GET" }).handler(
  async (): Promise<AppItem[]> => {
    const real = await fetchPublishedApps();
    if (real.length >= DEMO_THRESHOLD) return real;
    const taken = new Set(real.map((a) => a.id));
    return [...real, ...DEMO_APPS.filter((a) => !taken.has(a.id))];
  },
);

/** Détail public d'une application publiée, ou `null` si introuvable. */
export const getCatalogApp = createServerFn({ method: "GET" })
  .inputValidator((input: { slug: string }) => z.object({ slug: z.string().min(1) }).parse(input))
  .handler(async ({ data }): Promise<AppItem | null> => fetchPublishedApp(data.slug));

/** Catégories actives du catalogue. */
export const listCatalogCategories = createServerFn({ method: "GET" }).handler(
  async (): Promise<CategoryItem[]> => fetchCategories(),
);

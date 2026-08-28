import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { fetchCategories, fetchPublishedApp, fetchPublishedApps } from "@/lib/catalog.server";
import type { AppItem, CategoryItem } from "@/lib/catalog-types";

/** Liste publique des applications publiées (lecture anon, RLS appliquée). */
export const listCatalogApps = createServerFn({ method: "GET" }).handler(
  async (): Promise<AppItem[]> => fetchPublishedApps(),
);

/** Détail public d'une application publiée, ou `null` si introuvable. */
export const getCatalogApp = createServerFn({ method: "GET" })
  .inputValidator((input: { slug: string }) => z.object({ slug: z.string().min(1) }).parse(input))
  .handler(async ({ data }): Promise<AppItem | null> => fetchPublishedApp(data.slug));

/** Catégories actives du catalogue. */
export const listCatalogCategories = createServerFn({ method: "GET" }).handler(
  async (): Promise<CategoryItem[]> => fetchCategories(),
);

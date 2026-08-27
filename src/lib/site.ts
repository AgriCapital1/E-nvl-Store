/**
 * Séparation des deux expériences E'nvlé :
 *  - envle.app       → E'nvlé Store (grand public)
 *  - dev.envle.app   → E'nvlé Developers (développeurs)
 */

export const STORE_HOST = "envle.app";
export const DEV_HOST = "dev.envle.app";

export const STORE_URL = `https://${STORE_HOST}`;
export const DEV_URL = `https://${DEV_HOST}`;

/** true quand la page est servie depuis dev.envle.app (côté client uniquement). */
export function isDevHost(): boolean {
  if (typeof window === "undefined") return false;
  return window.location.hostname.startsWith("dev.");
}

export function slugifyCategory(category: string): string {
  return category
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

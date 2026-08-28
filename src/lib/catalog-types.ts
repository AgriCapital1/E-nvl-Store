export type ScanStatus = "verified" | "pending" | "blocked";

export interface AppVersion {
  version: string;
  date: string;
  notes: string;
  crashRate: number;
}

export interface Review {
  author: string;
  rating: number;
  date: string;
  text: string;
}

export interface AppItem {
  /** Slug public (`store_apps.slug`). */
  id: string;
  /** Identifiant `store_apps.id`. */
  storeAppId: string;
  name: string;
  developer: string;
  category: string;
  tagline: string;
  description: string;
  priceFcfa: number;
  rating: number;
  reviewsCount: number;
  downloads: number;
  downloads24h: number;
  sizeMb: number;
  version: string;
  updatedAt: string;
  scan: ScanStatus;
  permissions: string[];
  versions: AppVersion[];
  reviews: Review[];
  accent: string;
  initials: string;
  /** URL signée de l'icône (bucket privé `app-media`). */
  iconUrl?: string | undefined;
  /** URLs signées des captures d'écran. */
  screenshotUrls?: string[];
}

export interface CategoryItem {
  slug: string;
  name: string;
}

export function formatFcfa(v: number) {
  return v === 0 ? "Gratuit" : `${v.toLocaleString("fr-FR")} FCFA`;
}

export function formatCount(v: number) {
  if (v >= 1000) return `${(v / 1000).toFixed(v >= 10000 ? 0 : 1).replace(".", ",")}k`;
  return String(v);
}

export function formatBytes(v: number) {
  if (v >= 1024 * 1024) return `${(v / (1024 * 1024)).toFixed(1)} Mo`;
  if (v >= 1024) return `${Math.round(v / 1024)} Ko`;
  return `${v} o`;
}

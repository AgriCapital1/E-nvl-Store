import type { AppItem, AppVersion, Review, ScanStatus } from "@/lib/catalog-types";

export interface StoreAppRowLike {
  id: string;
  slug: string;
  name: string;
  publisher_name: string;
  category_slug: string | null;
  short_description: string | null;
  description: string | null;
  icon_path: string | null;
  price_fcfa: number;
  current_version: string;
  apk_size_bytes: number;
  permissions: unknown;
  security_scan: string;
  downloads: number;
  downloads_24h: number;
  rating_average: number;
  rating_count: number;
  updated_at: string;
}

export interface VersionRowLike {
  version: string;
  release_notes_fr: string | null;
  crash_rate: number;
  created_at: string;
}

export interface ReviewRowLike {
  id: string;
  author_name: string;
  rating: number;
  comment: string | null;
  created_at: string;
}

function toStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((v): v is string => typeof v === "string");
}

function initialsOf(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}

function toScan(value: string): ScanStatus {
  if (value === "verified" || value === "blocked") return value;
  return "pending";
}

export function mapVersion(row: VersionRowLike): AppVersion {
  return {
    version: row.version,
    date: row.created_at.slice(0, 10),
    notes: row.release_notes_fr ?? "",
    crashRate: Number(row.crash_rate ?? 0),
  };
}

export function mapReview(row: ReviewRowLike): Review {
  return {
    author: row.author_name,
    rating: row.rating,
    date: row.created_at.slice(0, 10),
    text: row.comment ?? "",
  };
}

export function mapStoreApp(
  row: StoreAppRowLike,
  categoryNames: Record<string, string>,
  versions: AppVersion[] = [],
  reviews: Review[] = [],
  iconUrl?: string | null,
  screenshotUrls: string[] = [],
): AppItem {
  return {
    id: row.slug,
    storeAppId: row.id,
    name: row.name,
    developer: row.publisher_name,
    category: (row.category_slug ? categoryNames[row.category_slug] : undefined) ?? "Autres",
    tagline: row.short_description ?? "",
    description: row.description ?? row.short_description ?? "",
    priceFcfa: row.price_fcfa,
    rating: Number(row.rating_average ?? 0),
    reviewsCount: row.rating_count ?? 0,
    downloads: row.downloads ?? 0,
    downloads24h: row.downloads_24h ?? 0,
    sizeMb: Math.round(((row.apk_size_bytes ?? 0) / (1024 * 1024)) * 10) / 10,
    version: row.current_version,
    updatedAt: row.updated_at.slice(0, 10),
    scan: toScan(row.security_scan),
    permissions: toStringArray(row.permissions),
    versions,
    reviews,
    accent: "brand",
    initials: initialsOf(row.name) || "AP",
    iconUrl: iconUrl ?? undefined,
    screenshotUrls,
  };
}

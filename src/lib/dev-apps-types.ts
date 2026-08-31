import { z } from "zod";

/** Types et validations partagés entre l'espace développeur et ses server functions. */

export interface DeveloperProfileInfo {
  id: string;
  displayName: string;
  organizationName: string | null;
  planCode: string;
  status: string;
}

export interface DeveloperUsage {
  planCode: string;
  appCount: number;
  appLimit: number;
  storageUsed: number;
  storageLimit: number;
  commissionRate: number;
  buildsThisMonth: number;
  buildLimit: number;
}

export interface DeveloperAppVersion {
  id: string;
  version: string;
  versionCode: number;
  status: string;
  scanStatus: string;
  crashRate: number;
  apkSizeBytes: number;
  releaseNotesFr: string | null;
  rejectionReason: string | null;
  createdAt: string;
}

export interface DeveloperAppRow {
  id: string;
  name: string;
  slug: string;
  category: string | null;
  shortDescription: string | null;
  description: string | null;
  pricingType: string;
  priceFcfa: number;
  version: string;
  status: string;
  downloads: number;
  storageBytes: number;
  iconPath: string | null;
  pwaUrl: string | null;
  rejectionReason: string | null;
  updatedAt: string;
  versions: DeveloperAppVersion[];
}

export interface DevWorkspace {
  hasProfile: boolean;
  profile: DeveloperProfileInfo | null;
  usage: DeveloperUsage | null;
  apps: DeveloperAppRow[];
  categories: { slug: string; name: string }[];
}

export interface DailyInstalls {
  day: string;
  label: string;
  value: number;
}

export interface DeveloperStats {
  hasProfile: boolean;
  totalInstalls: number;
  installs7d: DailyInstalls[];
  riskyVersions: {
    appName: string;
    version: string;
    crashRate: number;
    status: string;
  }[];
}

/* ---------- Contraintes d'upload ---------- */

export const PACKAGE_EXTENSIONS = ["apk", "aab"] as const;
export const IMAGE_EXTENSIONS = ["png", "jpg", "jpeg", "webp"] as const;
export const MAX_PACKAGE_BYTES = 500 * 1024 * 1024; // 500 Mo
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024; // 5 Mo

export function fileExtension(name: string): string {
  const parts = name.toLowerCase().split(".");
  return parts.length > 1 ? (parts.pop() as string) : "";
}

export const slugSchema = z
  .string()
  .min(3)
  .max(60)
  .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "Identifiant invalide (lettres minuscules et tirets)");

export const appInputSchema = z.object({
  id: z.string().uuid().nullish(),
  name: z.string().min(2).max(60),
  slug: slugSchema,
  category: z.string().min(1).max(40).nullish(),
  shortDescription: z.string().max(160).nullish(),
  description: z.string().max(4000).nullish(),
  pricingType: z.enum(["free", "paid"]),
  priceFcfa: z.number().int().min(0).max(1_000_000),
  iconPath: z.string().max(300).nullish(),
  pwaUrl: z.string().url().nullish(),
});

export const uploadInputSchema = z.object({
  kind: z.enum(["package", "icon", "screenshot"]),
  fileName: z.string().min(3).max(200),
  fileSize: z.number().int().positive(),
});

export const versionInputSchema = z.object({
  appId: z.string().uuid(),
  version: z
    .string()
    .min(1)
    .max(20)
    .regex(/^[0-9]+(\.[0-9]+){0,3}$/, "Format attendu : 1.0.0"),
  versionCode: z.number().int().min(1).max(2_000_000_000),
  apkPath: z.string().min(3).max(300),
  apkSizeBytes: z.number().int().min(1),
  releaseNotesFr: z.string().max(1000).nullish(),
  minAndroid: z.string().max(20).nullish(),
  checksum: z.string().max(128).nullish(),
});

/** Seuil au-dessus duquel le SHA-256 n'est pas calculé côté serveur. */
export const MAX_CHECKSUM_BYTES = 50 * 1024 * 1024; // 50 Mo

export function slugify(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

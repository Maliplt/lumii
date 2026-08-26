import type { ContentAccessLevel, PackageDef, PlanId } from "../types/types";

// paketler ve yetkiler
export const PACKAGES: PackageDef[] = [
  {
    id: "free", name: "Ücretsiz", price: "₺0", period: "", icon: "Play",
    badge: null, accent: false, free: true,
    summary: "Film ve dizi kataloğunu keşfet, sınırlı canlı TV'yi izle.",
    quality: "480p", screens: "1 ekran", downloads: "Yok", support: "Standart",
    features: ["Film ve dizi kataloğunu keşfetme", "Sınırlı ücretsiz kanallara erişim", "1 cihaz"],
    cta: "Ücretsiz Başla",
    capabilities: { maxVideoHeight: 480, contentLevel: "free", liveTvChannelLimit: 5, concurrentStreams: 1, hasAds: true, canDownload: false },
  },
  {
    id: "standard", name: "Temel", price: "₺139", period: "/ay", icon: "Zap",
    badge: "En çok tercih edilen", accent: true, free: false,
    summary: "Ana kataloğa ve daha fazla canlı kanala reklamsız erişim.",
    quality: "720p", screens: "2 ekran", downloads: "Mobil indirme", support: "Standart",
    features: ["720p görüntü kalitesi", "Film ve dizi kataloğu", "Canlı TV kanallarına erişim (spor dahil değildir)", "Reklamsız izleme", "Aynı anda 2 cihaz", "Mobil indirme"],
    cta: "Temel'e Geç",
    capabilities: { maxVideoHeight: 720, contentLevel: "standard", liveTvChannelLimit: 10, concurrentStreams: 2, hasAds: false, canDownload: true },
  },
  {
    id: "premium", name: "Premium", price: "₺240", period: "/ay", icon: "Crown",
    badge: "En kapsamlı", accent: false, free: false,
    summary: "Özel yapımlar, tüm kanallar ve en yüksek görüntü kalitesi.",
    quality: "En yüksek kalite", screens: "4 ekran", downloads: "Tüm cihazlar", support: "Öncelikli",
    features: ["En yüksek görüntü kalitesi", "Premium özel yapımlar dahil tüm katalog", "Sınırsız canlı TV erişimi", "Reklamsız izleme", "Aynı anda 4 cihaz", "Tüm cihazlarda indirme"],
    cta: "Premium'a Geç",
    capabilities: { maxVideoHeight: 1080, contentLevel: "premium", liveTvChannelLimit: null, concurrentStreams: 4, hasAds: false, canDownload: true },
  },
];

const PLAN_RANK: Record<PlanId, number> = { free: 0, standard: 1, premium: 2 };

export function findPackage(id?: string | null): PackageDef | undefined {
  return PACKAGES.find((pkg) => pkg.id === id);
}

export function effectivePlanId(id?: string | null): PlanId {
  return (findPackage(id)?.id as PlanId | undefined) ?? "free";
}

export function getPlan(id?: string | null): PackageDef {
  return findPackage(effectivePlanId(id)) ?? PACKAGES[0];
}

export function canUseLevel(planId: string | null | undefined, required: ContentAccessLevel): boolean {
  return PLAN_RANK[effectivePlanId(planId)] >= PLAN_RANK[required];
}

export function requiredPlanName(level: ContentAccessLevel): string {
  return getPlan(level).name;
}

export function upgradeCtaLabel(level: ContentAccessLevel): string {
  return level === "premium" ? "Premium'a Yükselt" : `${requiredPlanName(level)} Pakete Yükselt`;
}

export function channelAccessLevel(channelIndex: number, category?: string): ContentAccessLevel {
  if (category?.toLocaleLowerCase("tr") === "spor") return "premium";
  const freeLimit = getPlan("free").capabilities.liveTvChannelLimit ?? 0;
  const standardLimit = getPlan("standard").capabilities.liveTvChannelLimit ?? freeLimit;
  if (channelIndex < freeLimit) return "free";
  if (channelIndex < standardLimit) return "standard";
  return "premium";
}

export function canAccessChannel(planId: string | null | undefined, channelIndex: number, category?: string): boolean {
  return canUseLevel(planId, channelAccessLevel(channelIndex, category));
}

export interface CatalogEntry {
  type: "movie" | "tv";
  id: number;
  access: ContentAccessLevel;
  manifest?: string;
}

// paket eşleşmeleri
export const CONTENT_CATALOG: CatalogEntry[] = [
  { type: "movie", id: 278, access: "standard" },
  { type: "movie", id: 550, access: "standard" },
  { type: "movie", id: 238, access: "standard" },
  { type: "movie", id: 680, access: "standard" },
  { type: "tv", id: 1396, access: "standard" },
  { type: "movie", id: 155, access: "premium" },
  { type: "movie", id: 27205, access: "premium" },
  { type: "tv", id: 1399, access: "premium" },
];

export function contentRule(type: string, id: string | number): CatalogEntry | undefined {
  return CONTENT_CATALOG.find((entry) => entry.type === type && entry.id === Number(id));
}

export function contentAccessLevel(type: string, id: string | number, fallback: ContentAccessLevel = "standard"): ContentAccessLevel {
  return contentRule(type, id)?.access ?? fallback;
}

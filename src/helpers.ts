import { useState, useEffect, useRef, type TouchEvent } from "react";
import a1 from "./images/avatars/a1.svg";
import a2 from "./images/avatars/a2.svg";
import a3 from "./images/avatars/a3.svg";
import a4 from "./images/avatars/a4.svg";
import a5 from "./images/avatars/a5.svg";
import a6 from "./images/avatars/a6.svg";
import a7 from "./images/avatars/a7.svg";
import a8 from "./images/avatars/a8.svg";
import a9 from "./images/avatars/a9.svg";
import a10 from "./images/avatars/a10.svg";
import type { Movie, TVShow, PackageDef } from "./types/types";

// avatarlar
export const AVATARS: Record<string, string> = {
  a1,
  a2,
  a3,
  a4,
  a5,
  a6,
  a7,
  a8,
  a9,
  a10,
};

// paketler
export const PACKAGES: PackageDef[] = [
  {
    id: "free",
    name: "Ücretsiz",
    price: "₺0",
    period: "",
    icon: "Play",
    badge: null,
    accent: false,
    free: true,
    features: [
      "SD Kalite (480p)",
      "Reklamlı İzleme",
      "Sınırlı Film & Dizi",
      "1 Cihaz",
      "Temel Oyunlar",
    ],
    cta: "Ücretsiz Başla",
  },
  {
    id: "standard",
    name: "Standart",
    price: "₺49",
    period: "/ay",
    icon: "Zap",
    badge: "En Popüler",
    accent: false,
    free: false,
    features: [
      "Full HD Kalite (1080p)",
      "Reklamsız İzleme",
      "Tüm Film & Diziler",
      "2 Cihaz",
      "Tüm Oyunlar",
    ],
    cta: "Başla",
  },
  {
    id: "premium",
    name: "Premium",
    price: "₺79",
    period: "/ay",
    icon: "Crown",
    badge: null,
    accent: true,
    free: false,
    features: [
      "4K Ultra HD",
      "Reklamsız İzleme",
      "Tüm İçerikler + Özel Yapımlar",
      "4 Cihaz + İndirme",
      "Öncelikli Destek",
    ],
    cta: "Başla",
  },
];

// fetch hook
interface FetchResult<T> {
  key: string | number;
  data: T | null;
  error: boolean;
}

export function useFetch<T>(
  fetcher: () => Promise<T>,
  key: string | number = 0,
) {
  const [result, setResult] = useState<FetchResult<T> | null>(null);

  // fetcher ref
  const fetcherRef = useRef(fetcher);
  useEffect(() => {
    fetcherRef.current = fetcher;
  });

  useEffect(() => {
    let cancelled = false;

    fetcherRef
      .current()
      .then((data) => {
        if (!cancelled) setResult({ key, data, error: false });
      })
      .catch(() => {
        if (!cancelled) setResult({ key, data: null, error: true });
      });

    return () => {
      cancelled = true;
    };
  }, [key]);

  const ready = result !== null && result.key === key;
  return {
    data: ready ? result.data : null,
    loading: !ready,
    error: ready ? result.error : false,
  };
}

// film/dizi ortak alanlari (cast yerine)
export const mediaName = (m: Movie | TVShow): string =>
  "title" in m ? m.title : m.name;

export const mediaYear = (m: Movie | TVShow): string =>
  ("release_date" in m ? m.release_date : m.first_air_date)?.slice(0, 4) ?? "";

// azaltilmis hareket tercihi
export function prefersReducedMotion(): boolean {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

// sekme basligi
export function useTitle(title: string) {
  useEffect(() => {
    document.title = title ? `Lumii — ${title}` : "Lumii";
  }, [title]);
}

const SWIPE_THRESHOLD = 50;

// swipe hook
export function useSwipe(onLeft: () => void, onRight: () => void) {
  const startX = useRef<number | null>(null);

  const onTouchStart = (e: TouchEvent) => {
    startX.current = e.touches[0]?.clientX ?? null;
  };

  const onTouchEnd = (e: TouchEvent) => {
    if (startX.current === null) return;

    const distance = (e.changedTouches[0]?.clientX ?? 0) - startX.current;
    startX.current = null;

    if (Math.abs(distance) <= SWIPE_THRESHOLD) return;
    if (distance < 0) onLeft();
    else onRight();
  };

  return { onTouchStart, onTouchEnd };
}

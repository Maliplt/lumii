import { useState, useEffect, useRef, type TouchEvent, type MouseEvent } from "react";
import { useNavigate } from "react-router-dom";
import {
  useAppDispatch,
  useAppSelector,
  toggleWatchlist,
  toggleLiked,
  selectLibrary,
  sameSavedItem,
  type SavedItem,
} from "./store/store";
import { useToast, toastText } from "./components/Toast";
import type { Movie, TVShow, PackageDef, SearchResult } from "./types/types";

// avatarlar
export interface AvatarItem {
  key: string;
  name: string;
  src: string;
}

export interface AvatarCategory {
  id: string;
  label: string;
  avatars: AvatarItem[];
}

export const AVATAR_CATEGORIES: AvatarCategory[] = [
  {
    id: "animals",
    label: "Hayvanlar",
    avatars: [
      { key: "animal-cat", name: "Kedi", src: "https://images.unsplash.com/photo-1574158622682-e40e69881006?auto=format&fit=crop&w=360&h=450&q=88" },
      { key: "animal-dog", name: "Köpek", src: "https://images.unsplash.com/photo-1517849845537-4d257902454a?auto=format&fit=crop&w=360&h=450&q=88" },
      { key: "animal-lion", name: "Aslan", src: "https://images.unsplash.com/photo-1546182990-dffeafbe841d?auto=format&fit=crop&w=360&h=450&q=88" },
      { key: "animal-fox", name: "Tilki", src: "https://images.unsplash.com/photo-1474511320723-9a56873867b5?auto=format&fit=crop&w=360&h=450&q=88" },
    ],
  },
  {
    id: "cinema",
    label: "Sinema",
    avatars: [
      { key: "cinema-noir-photo", name: "Noir", src: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=360&h=450&q=88" },
      { key: "cinema-hero", name: "Kahraman", src: "https://images.unsplash.com/photo-1608889175123-8ee362201f81?auto=format&fit=crop&w=360&h=450&q=88" },
      { key: "cinema-space-photo", name: "Uzay", src: "https://images.unsplash.com/photo-1614728263952-84ea256f9679?auto=format&fit=crop&w=360&h=450&q=88" },
      { key: "cinema-mask", name: "Maske", src: "https://images.unsplash.com/photo-1503095396549-807759245b35?auto=format&fit=crop&w=360&h=450&q=88" },
    ],
  },
  {
    id: "comic",
    label: "Çizgi Roman",
    avatars: [
      { key: "comic-mask", name: "Maskeli", src: "https://images.unsplash.com/photo-1635805737707-575885ab0820?auto=format&fit=crop&w=360&h=450&q=88" },
      { key: "comic-figure", name: "Figür", src: "https://images.unsplash.com/photo-1612036782180-6f0b6cd846fe?auto=format&fit=crop&w=360&h=450&q=88" },
      { key: "comic-panel", name: "Panel", src: "https://images.unsplash.com/photo-1618519764620-7403abdbdfe9?auto=format&fit=crop&w=360&h=450&q=88" },
      { key: "comic-color", name: "Renkli", src: "https://images.unsplash.com/photo-1513364776144-60967b0f800f?auto=format&fit=crop&w=360&h=450&q=88" },
    ],
  },
  {
    id: "animated",
    label: "Animasyon",
    avatars: [
      { key: "animated-toy", name: "Oyuncak", src: "https://images.unsplash.com/photo-1566576912321-d58ddd7a6088?auto=format&fit=crop&w=360&h=450&q=88" },
      { key: "animated-robot", name: "Robot", src: "https://images.unsplash.com/photo-1485827404703-89b55fcc595e?auto=format&fit=crop&w=360&h=450&q=88" },
      { key: "animated-cosplay", name: "Cosplay", src: "https://images.unsplash.com/photo-1608889825103-eb5ed706fc64?auto=format&fit=crop&w=360&h=450&q=88" },
      { key: "animated-neon", name: "Neon", src: "https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=360&h=450&q=88" },
    ],
  },
];

export const DEFAULT_AVATAR = AVATAR_CATEGORIES[0].avatars[0].key;

export const AVATARS: Record<string, string> = Object.fromEntries(
  AVATAR_CATEGORIES.flatMap((group) => group.avatars).map((avatar) => [
    avatar.key,
    avatar.src,
  ]),
);

Object.assign(AVATARS, {
  "default-blue": AVATARS["animal-cat"],
  "default-mint": AVATARS["animal-dog"],
  "default-gold": AVATARS["animal-lion"],
  "cinema-noir": AVATARS["cinema-noir-photo"],
  "cinema-action": AVATARS["cinema-hero"],
  "cinema-space": AVATARS["cinema-space-photo"],
  "toon-pop": AVATARS["animated-toy"],
  "toon-spark": AVATARS["comic-figure"],
  "toon-wave": AVATARS["comic-color"],
  "fantasy-mage": AVATARS["animated-robot"],
  "fantasy-hero": AVATARS["animated-cosplay"],
  "fantasy-shadow": AVATARS["comic-mask"],
  a1: AVATARS["animal-cat"],
  a2: AVATARS["animal-dog"],
  a3: AVATARS["animal-lion"],
  a4: AVATARS["cinema-noir-photo"],
  a5: AVATARS["cinema-hero"],
  a6: AVATARS["cinema-space-photo"],
  a7: AVATARS["comic-mask"],
  a8: AVATARS["comic-figure"],
  a9: AVATARS["animated-toy"],
  a10: AVATARS["animated-robot"],
});

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
    summary: "TENET'i denemek ve temel kataloğa erişmek için.",
    quality: "SD 480p",
    screens: "1 ekran",
    downloads: "Yok",
    support: "Standart",
    features: [
      "SD Kalite (480p)",
      "Reklamlı izleme",
      "Sınırlı film ve dizi kataloğu",
      "1 cihaz",
      "Temel oyunlar",
      "Profil yönetimi",
    ],
    cta: "Ücretsiz Başla",
  },
  {
    id: "standard",
    name: "Standart",
    price: "₺49",
    period: "/ay",
    icon: "Zap",
    badge: "Dengeli",
    accent: false,
    free: false,
    summary: "Reklamsız izleme ve aile kullanımı için en dengeli plan.",
    quality: "Full HD 1080p",
    screens: "2 ekran",
    downloads: "Mobil indirme",
    support: "Standart",
    features: [
      "Full HD Kalite (1080p)",
      "Reklamsız izleme",
      "Tüm film ve dizi kataloğu",
      "Aynı anda 2 cihaz",
      "Mobil indirme",
      "Tüm oyunlar",
      "Çocuk profili ve profil kilidi",
    ],
    cta: "Standart'a Geç",
  },
  {
    id: "premium",
    name: "Premium",
    price: "₺79",
    period: "/ay",
    icon: "Crown",
    badge: "En kapsamlı",
    accent: false,
    free: false,
    summary: "En yüksek kalite, daha fazla ekran ve öncelikli destek.",
    quality: "4K Ultra HD",
    screens: "4 ekran",
    downloads: "Tüm cihazlar",
    support: "Öncelikli",
    features: [
      "4K Ultra HD",
      "Reklamsız izleme",
      "Tüm içerikler ve özel yapımlar",
      "Aynı anda 4 cihaz",
      "Tüm cihazlarda indirme",
      "Öncelikli destek",
      "Erken erişim koleksiyonları",
    ],
    cta: "Premium'a Geç",
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

export function isLatinTitle(text: string): boolean {
  return !/[^\u0020-\u024f\u1e00-\u1eff\s]/.test(text);
}

export const mediaName = (m: Movie | TVShow): string =>
  "title" in m ? m.title : m.name;

export const mediaYear = (m: Movie | TVShow): string =>
  ("release_date" in m ? m.release_date : m.first_air_date)?.slice(0, 4) ?? "";

type MediaItem = Movie | TVShow;

export const withPoster = <T extends readonly MediaItem[]>(list: T): Array<T[number]> =>
  list.filter((m) => m.poster_path);

export const withMedia = <T extends readonly MediaItem[]>(list: T): Array<T[number]> =>
  list.filter((m) => m.poster_path && m.backdrop_path);

export function heroFrom<T extends readonly MediaItem[]>(list: T, count = 5): Array<T[number]> {
  return withMedia(list)
    .filter((m) => isLatinTitle(mediaName(m)) && m.overview?.trim())
    .slice(0, count);
}

export function isPlayableSearchResult(result: {
  media_type?: string;
  poster_path?: string | null;
}): result is SearchResult {
  return (
    (result.media_type === "movie" || result.media_type === "tv") &&
    !!result.poster_path
  );
}

// sekme basligi
export function useTitle(title: string) {
  useEffect(() => {
    document.title = title ? `TENET — ${title}` : "TENET";
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

export function popButton(el: HTMLElement) {
  el.classList.remove("is-pop");
  void el.offsetWidth;
  el.classList.add("is-pop");
}

export function useLibraryActions(
  item: Movie | TVShow | SavedItem,
  type: "movie" | "tv",
) {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const toast = useToast();
  const mediaType = (item as SavedItem).media_type ?? type;
  const saved = { ...item, media_type: mediaType } as SavedItem;
  const isLoggedIn = useAppSelector((s) => !!s.auth.currentUser);
  const inWatchlist = useAppSelector((s) =>
    selectLibrary(s).watchlist.some((x) => sameSavedItem(x, saved)),
  );
  const isLiked = useAppSelector((s) =>
    selectLibrary(s).liked.some((x) => sameSavedItem(x, saved)),
  );

  const requireLogin = (message: string) => {
    if (isLoggedIn) return true;
    toast(message, "warning");
    navigate("/login");
    return false;
  };

  const onWatchlist = (e: MouseEvent) => {
    e.stopPropagation();
    popButton(e.currentTarget as HTMLElement);
    if (!requireLogin(toastText.loginForWatchlist)) return;
    dispatch(toggleWatchlist(saved));
    toast(inWatchlist ? toastText.watchlistRemoved : toastText.watchlistAdded);
  };

  const onLike = (e: MouseEvent) => {
    e.stopPropagation();
    popButton(e.currentTarget as HTMLElement);
    if (!requireLogin(toastText.loginForLike)) return;
    dispatch(toggleLiked(saved));
    toast(isLiked ? toastText.unliked : toastText.liked);
  };

  return { inWatchlist, isLiked, onWatchlist, onLike };
}

export function useLazyReveal(total: number, initial = 3, step = 2) {
  const [visible, setVisible] = useState(() => Math.min(initial, total));
  const sentinelRef = useRef<HTMLDivElement>(null);
  const safeVisible = Math.min(visible, total);

  // data  gelince total 0'dan art
  useEffect(() => {
    if (total > 0 && visible === 0) {
      setVisible(Math.min(initial, total));
    }
  }, [total, initial, visible]);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el || safeVisible >= total) return;

    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setVisible((c) => Math.min(c + step, total));
      },
      { rootMargin: "160px 0px" },
    );

    io.observe(el);
    return () => io.disconnect();
  }, [total, step, safeVisible]);

  return { visible: safeVisible, sentinelRef };
}

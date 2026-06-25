import { useState, useEffect, useRef, type TouchEvent, type MouseEvent } from "react";
import { useNavigate } from "react-router-dom";
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

export function isLatinTitle(text: string): boolean {
  return !/[^\u0020-\u024f\u1e00-\u1eff\s]/.test(text);
}

export const mediaName = (m: Movie | TVShow): string =>
  "title" in m ? m.title : m.name;

export const mediaYear = (m: Movie | TVShow): string =>
  ("release_date" in m ? m.release_date : m.first_air_date)?.slice(0, 4) ?? "";

// liste suzgecleri — Home ve Explore ayni mantigi tekrarliyordu, tek yere aldim
type MediaItem = Movie | TVShow;

export const withPoster = <T extends readonly MediaItem[]>(list: T): Array<T[number]> =>
  list.filter((m) => m.poster_path);

export const withMedia = <T extends readonly MediaItem[]>(list: T): Array<T[number]> =>
  list.filter((m) => m.poster_path && m.backdrop_path);

// hero serisi: poster+backdrop'i olan, latin baslikli ve ozeti dolu ilk birkac icerik
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

// kucuk pop animasyonu — class'i sifirlayip yeniden tetikler
export function popButton(el: HTMLElement) {
  el.classList.remove("is-pop");
  void el.offsetWidth;
  el.classList.add("is-pop");
}

// watchlist/begeni aksiyonlari — ContentCarousel ve HeroCarousel tek yerden besleniyor
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

// satir satir lazy reveal — Home ve Explore uzun listeleri parca parca gosteriyor
export function useLazyReveal(total: number, initial = 3, step = 2) {
  const [visible, setVisible] = useState(initial);
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setVisible(Math.min(initial, total));
  }, [initial, total]);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el || visible >= total) return;

    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setVisible((c) => Math.min(c + step, total));
      },
      { rootMargin: "160px 0px" },
    );

    io.observe(el);
    return () => io.disconnect();
  }, [total, step, visible]);

  return { visible, sentinelRef };
}

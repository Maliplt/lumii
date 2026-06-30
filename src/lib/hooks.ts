import {
  useState,
  useEffect,
  useRef,
  type TouchEvent,
  type MouseEvent,
} from "react";
import { useNavigate } from "react-router-dom";
import {
  useAppDispatch,
  useAppSelector,
  toggleWatchlist,
  toggleLiked,
  selectLibrary,
  sameSavedItem,
  type SavedItem,
} from "../store/store";
import { useToast, toastText } from "../components/Toast";
import type { Movie, TVShow } from "../types/types";
import { popButton } from "./utils";

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

  // data gelince artir
  useEffect(() => {
    if (total > 0 && visible === 0) {
      const id = window.setTimeout(() => {
        setVisible(Math.min(initial, total));
      }, 0);
      return () => window.clearTimeout(id);
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

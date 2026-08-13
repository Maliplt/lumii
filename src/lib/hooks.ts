import { useState, useEffect, useMemo, useRef, type TouchEvent, type MouseEvent, type RefObject } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAppDispatch, useAppSelector, toggleWatchlist, toggleLiked, selectLibrary, sameSavedItem, logout, type SavedItem } from "../store/store";
import { useToast, toastText } from "./toast";
import type { Movie, TVShow } from "../types/types";
import { popButton } from "./utils";
import { safeAuthReturnTo } from "./authRouting";
import {
  resolveServiceError,
  type ServiceError,
  type ServiceErrorContext,
} from "../services/serviceError";

// veri isteği
interface FetchResult<T> {
  key: string | number;
  attempt: number;
  data: T | null;
  error: ServiceError | null;
}

export function useFetch<T>(
  fetcher: () => Promise<T>,
  key: string | number = 0,
  errorContext: Exclude<ServiceErrorContext, "action"> = "page",
) {
  const [result, setResult] = useState<FetchResult<T> | null>(null);
  const [attempt, setAttempt] = useState(0);

  // güncel fetcher
  const fetcherRef = useRef(fetcher);
  useEffect(() => {
    fetcherRef.current = fetcher;
  });

  useEffect(() => {
    let cancelled = false;

    fetcherRef
      .current()
      .then((data) => {
        if (!cancelled) setResult({ key, attempt, data, error: null });
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          const failure = resolveServiceError(error, errorContext);
          setResult({
            key,
            attempt,
            data: null,
            error: failure.surface === "silent" ? null : failure.error,
          });
        }
      });

    return () => {
      cancelled = true;
    };
  }, [key, attempt, errorContext]);

  const ready =
    result !== null && result.key === key && result.attempt === attempt;
  return {
    data: ready ? result.data : null,
    loading: !ready,
    error: ready ? result.error : null,
    retry: () => setAttempt((value) => value + 1),
  };
}

// sekme basligi
export function useTitle(title: string) {
  useEffect(() => {
    document.title = title ? `TENET - ${title}` : "TENET";
  }, [title]);
}

const SWIPE_THRESHOLD = 50;

// kaydırma hareketi
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
  const location = useLocation();
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
    navigate("/login", {
      state: {
        returnTo: `${location.pathname}${location.search}${location.hash}`,
      },
    });
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

// youtube
const YT_PLAYING = 1;
const YT_ENDED = 0;

export function useYouTubeEmbed(
  frameRef: RefObject<HTMLIFrameElement | null>,
  videoKey: string | null,
) {
  const [ready, setReady] = useState(false);
  const [muted, setMuted] = useState(true);
  const [prevVideoKey, setPrevVideoKey] = useState(videoKey);
  const readyTimer = useRef<number | null>(null);

  // video sıfırlama
  if (videoKey !== prevVideoKey) {
    setPrevVideoKey(videoKey);
    setReady(false);
    setMuted(true);
  }

  useEffect(() => {
    if (!videoKey) return;

    readyTimer.current = window.setTimeout(() => setReady(true), 2600);
    const onMessage = (e: MessageEvent) => {
      if (
        e.origin !== "https://www.youtube.com" &&
        e.origin !== "https://www.youtube-nocookie.com"
      )
        return;
      let msg: { info?: { playerState?: number } };
      try {
        msg = JSON.parse(e.data);
      } catch {
        return;
      }
      const state = msg.info?.playerState;
      if (state === YT_PLAYING) {
        if (readyTimer.current) window.clearTimeout(readyTimer.current);
        setReady(true);
      }
      if (state === YT_ENDED)
        frameRef.current?.contentWindow?.postMessage(
          JSON.stringify({ event: "command", func: "playVideo" }),
          "*",
        );
    };
    window.addEventListener("message", onMessage);
    return () => {
      window.removeEventListener("message", onMessage);
      if (readyTimer.current) window.clearTimeout(readyTimer.current);
    };
  }, [videoKey, frameRef]);

  const onFrameLoad = () => {
    const win = frameRef.current?.contentWindow;
    if (!win) return;
    win.postMessage(JSON.stringify({ event: "listening", channel: "widget" }), "*");
    window.setTimeout(() => {
      win.postMessage(JSON.stringify({ event: "command", func: "mute" }), "*");
      win.postMessage(JSON.stringify({ event: "command", func: "playVideo" }), "*");
    }, 350);
  };

  const toggleMute = () => {
    const win = frameRef.current?.contentWindow;
    if (!win) return;
    win.postMessage(
      JSON.stringify({ event: "command", func: muted ? "unMute" : "mute" }),
      "*",
    );
    setMuted((m) => !m);
  };

  return { ready, muted, onFrameLoad, toggleMute };
}

// cikis akisi
export function useLogout() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const toast = useToast();

  return () => {
    dispatch(logout());
    toast(toastText.loggedOut, "info");
    navigate("/");
  };
}

const ROTATE_INTERVAL_MS = 5000;
const ROTATE_LIMIT = 8;

// giriş arka planı
export function useRotatingBackdrop(
  fetcher: () => Promise<{ results: Movie[] }>,
  intervalMs = ROTATE_INTERVAL_MS,
  limit = ROTATE_LIMIT,
) {
  const [bgIdx, setBgIdx] = useState(0);
  const { data } = useFetch(fetcher, "rotating-backdrop", "enhancement");

  const movies = useMemo(
    () =>
      (data?.results ?? [])
        .filter((movie) => movie.backdrop_path && movie.overview)
        .slice(0, limit),
    [data, limit],
  );

  useEffect(() => {
    if (movies.length <= 1) return;
    const id = window.setInterval(
      () => setBgIdx((index) => (index + 1) % movies.length),
      intervalMs,
    );
    return () => window.clearInterval(id);
  }, [movies.length, intervalMs]);

  return { movies, bgIdx, currentMovie: movies[bgIdx] ?? null };
}

// giriş yönlendirmesi
export function useAuthRedirectOnSuccess(
  currentUser: { name: string } | null | undefined,
  submitted: RefObject<boolean>,
  welcomeMessage: (name: string) => string,
) {
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();
  const returnTo = safeAuthReturnTo(location.state);

  useEffect(() => {
    if (currentUser) {
      if (submitted.current) toast(welcomeMessage(currentUser.name));
      navigate("/profiles", { replace: true, state: { returnTo } });
    }
  }, [currentUser, navigate, returnTo, toast, submitted, welcomeMessage]);
}

export function useLazyReveal(total: number, initial = 3, step = 2) {
  const [visible, setVisible] = useState(() => Math.min(initial, total));
  const sentinelRef = useRef<HTMLDivElement>(null);
  const safeVisible = Math.min(visible, total);

    // ilk grup
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

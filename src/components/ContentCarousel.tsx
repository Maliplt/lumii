import {
  memo,
  useRef,
  useState,
  useMemo,
  useEffect,
  type ReactNode,
} from "react";
import { Carousel } from "rsuite";
import { Link, useNavigate } from "react-router-dom";
import { animate, stagger } from "animejs";
import { Star } from "lucide-react";
import { MotionIcon } from "motion-icons-react";
import { getImageUrl, tmdbApi, pickTrailer } from "../services/tmdb";
import { useToast } from "./Toast";
import { useSwipe } from "../helpers";
import {
  useAppDispatch,
  useAppSelector,
  toggleWatchlist,
  toggleLiked,
  type SavedItem,
} from "../store/store";
import type { Movie, TVShow } from "../types/types";

const HOVER_EXPAND_DELAY = 500;

// yt states
const YT_ENDED = 0;
const YT_PLAYING = 1;

// tek istek
const trailerCache = new Map<string, string | null>();

// tek kart oynat
let activeStop: (() => void) | null = null;
let activeToken: object | null = null;

// pop animasyonu
function pop(el: HTMLElement) {
  el.classList.remove("is-pop");
  void el.offsetWidth;
  el.classList.add("is-pop");
}

// kart sayisi
function calcCount(width: number): number {
  if (width <= 480) return 2;
  if (width <= 768) return 3;
  if (width <= 1024) return 4;
  return 6;
}

function useVisibleCount(): number {
  const [count, setCount] = useState(() => calcCount(window.innerWidth));

  useEffect(() => {
    const handler = () => setCount(calcCount(window.innerWidth));
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);

  return count;
}

interface ContentCarouselProps {
  type: "movie" | "tv";
  title: string;
  items: (Movie | TVShow)[];
  headerExtra?: ReactNode;
}

const ItemCard = memo(function ItemCard({
  item,
  type,
}: {
  item: Movie | TVShow;
  type: "movie" | "tv";
}) {
  const ref = useRef<HTMLDivElement>(null);
  const frameRef = useRef<HTMLIFrameElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const expanded = useRef(false);
  const token = useRef({});
  const [showTitle, setShowTitle] = useState(false);
  const [trailerKey, setTrailerKey] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [muted, setMuted] = useState(true);
  const navigate = useNavigate();

  // kart tipi
  const cardType = (item as SavedItem).media_type ?? type;

  // redux
  const dispatch = useAppDispatch();
  const isLoggedIn = useAppSelector((s) => !!s.auth.currentUser);
  const inWatchlist = useAppSelector((s) =>
    s.library.watchlist.some((x) => x.id === item.id),
  );
  const isLiked = useAppSelector((s) =>
    s.library.liked.some((x) => x.id === item.id),
  );

  const toast = useToast();
  const saved = { ...item, media_type: cardType } as SavedItem;

  const onWatchlist = (e: React.MouseEvent) => {
    pop(e.currentTarget as HTMLElement);
    if (!isLoggedIn) {
      toast("İzleme listeni kullanmak için önce giriş yapmalısın.", "warning");
      navigate("/login");
      return;
    }
    dispatch(toggleWatchlist(saved));
    toast(
      inWatchlist
        ? "İzleme listesinden çıkarıldı."
        : "İzleme listesine eklendi.",
    );
  };

  const onLike = (e: React.MouseEvent) => {
    pop(e.currentTarget as HTMLElement);
    if (!isLoggedIn) {
      toast("İçerikleri beğenmek için önce giriş yapmalısın.", "warning");
      navigate("/login");
      return;
    }
    dispatch(toggleLiked(saved));
    toast(isLiked ? "Beğeni geri alındı." : "Beğenildi.");
  };

  useEffect(() => {
    if (!showTitle) return;
    const buttons = ref.current?.querySelectorAll(".cc-item__action-btn");
    if (!buttons || buttons.length === 0) return;
    animate(buttons, {
      opacity: [0, 1],
      scale: [0.5, 1],
      translateY: [8, 0],
      duration: 420,
      delay: stagger(60),
      ease: "outBack",
    });
  }, [showTitle]);

  // boslari gizle
  const name = (item as Movie).title ?? (item as TVShow).name;
  const year =
    ((item as Movie).release_date || (item as TVShow).first_air_date)?.slice(
      0,
      4,
    ) ?? "";
  const rating = item.vote_average ? item.vote_average.toFixed(1) : "";
  const overviewSnippet = item.overview?.trim() ?? "";

  // hover ile fragman
  const loadTrailer = async () => {
    const cacheKey = `${cardType}-${item.id}`;
    const cached = trailerCache.get(cacheKey);
    if (cached !== undefined) {
      setTrailerKey(cached);
      return;
    }
    try {
      const { results } = await tmdbApi.getVideos(cardType, item.id);
      const key = pickTrailer(results);
      trailerCache.set(cacheKey, key);
      if (expanded.current) setTrailerKey(key);
    } catch {
      trailerCache.set(cacheKey, null);
    }
  };

  const doExpand = () => {
    if (activeStop && activeToken !== token.current) activeStop();
    activeToken = token.current;
    activeStop = doCollapse;
    expanded.current = true;
    setShowTitle(true);
    loadTrailer();
    if (ref.current)
      animate(ref.current, { flexGrow: 2, duration: 380, ease: "outQuart" });
  };

  const doCollapse = () => {
    if (activeToken === token.current) {
      activeToken = null;
      activeStop = null;
    }
    expanded.current = false;
    setShowTitle(false);
    setTrailerKey(null);
    setReady(false);
    setMuted(true);
    if (ref.current)
      animate(ref.current, { flexGrow: 1, duration: 260, ease: "outQuart" });
  };

  const onEnter = () => {
    if (window.matchMedia("(hover: none)").matches) return;
    timer.current = setTimeout(doExpand, HOVER_EXPAND_DELAY);
  };
  const onLeave = () => {
    if (timer.current) {
      clearTimeout(timer.current);
      timer.current = null;
    }
    if (expanded.current) doCollapse();
  };

  // sesi ac/kapa
  const toggleMute = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    pop(e.currentTarget as HTMLElement);
    const win = frameRef.current?.contentWindow;
    if (!win) return;
    win.postMessage(
      JSON.stringify({ event: "command", func: muted ? "unMute" : "mute" }),
      "*",
    );
    setMuted((prev) => !prev);
  };

  const trailerSrc = trailerKey
    ? `https://www.youtube.com/embed/${trailerKey}?autoplay=1&mute=1&controls=0&disablekb=1&fs=0&modestbranding=1&rel=0&iv_load_policy=3&playsinline=1&enablejsapi=1`
    : "";

  // yt listen
  const startTrailer = () => {
    frameRef.current?.contentWindow?.postMessage(
      JSON.stringify({ event: "listening", channel: "widget" }),
      "*",
    );
  };

  // poster/yt gecisi
  useEffect(() => {
    if (!showTitle || !trailerKey) return;
    const onMessage = (e: MessageEvent) => {
      if (e.origin !== "https://www.youtube.com") return;
      let msg: { info?: { playerState?: number } };
      try {
        msg = JSON.parse(e.data);
      } catch {
        return;
      }
      const state = msg.info?.playerState;
      if (state === undefined) return;
      setReady(state === YT_PLAYING);
      if (state === YT_ENDED) {
        frameRef.current?.contentWindow?.postMessage(
          JSON.stringify({ event: "command", func: "playVideo" }),
          "*",
        );
      }
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [showTitle, trailerKey]);

  return (
    <div
      ref={ref}
      className="cc-item"
      style={{ flexGrow: 1 }}
      onMouseEnter={onEnter}
      onMouseLeave={onLeave}
    >
      <Link className="cc-item__link" to={`/${cardType}/${item.id}`}>
        <img
          className="cc-item__poster"
          src={getImageUrl(item.poster_path, "w300")}
          alt={name}
          loading="lazy"
        />
      </Link>
      {showTitle && trailerKey && (
        <>
          <div className={`cc-item__trailer ${ready ? "is-ready" : ""}`}>
            <iframe
              ref={frameRef}
              src={trailerSrc}
              title={name}
              allow="autoplay"
              onLoad={startTrailer}
            />
          </div>
          {/* seffaf katman */}
          <div
            className="cc-item__trailer-shield"
            onClick={() => navigate(`/${cardType}/${item.id}`)}
          />
          <button
            className="cc-item__action-btn cc-item__mute"
            type="button"
            onClick={toggleMute}
            aria-label={muted ? "Sesi aç" : "Sesi kapat"}
          >
            {muted ? (
              <MotionIcon
                name="VolumeX"
                size={18}
                trigger="hover"
                animation="pop"
              />
            ) : (
              <MotionIcon
                name="Volume2"
                size={18}
                trigger="hover"
                animation="pop"
              />
            )}
          </button>
        </>
      )}
      <div className={`cc-item__overlay ${showTitle ? "active" : ""}`}>
        <div className="cc-item__details">
          <div className="cc-item__actions-row">
            <div className="cc-item__actions-left">
              <button
                className="cc-item__action-btn play"
                type="button"
                onClick={() => navigate(`/${cardType}/${item.id}`)}
                aria-label="Oynat"
              >
                <MotionIcon
                  name="Play"
                  size={18}
                  trigger="hover"
                  animation="nudge"
                />
              </button>
              <button
                className={`cc-item__action-btn outline${inWatchlist ? " active" : ""}`}
                type="button"
                onClick={onWatchlist}
                aria-label={inWatchlist ? "Listeden çıkar" : "Listeye ekle"}
              >
                {inWatchlist ? (
                  <MotionIcon
                    name="Check"
                    size={19}
                    trigger="hover"
                    animation="pop"
                  />
                ) : (
                  <MotionIcon
                    name="Plus"
                    size={20}
                    trigger="hover"
                    animation="spin"
                  />
                )}
              </button>
              <button
                className={`cc-item__action-btn outline${isLiked ? " active" : ""}`}
                type="button"
                onClick={onLike}
                aria-label={isLiked ? "Beğeniyi geri al" : "Beğen"}
              >
                <MotionIcon
                  name="Heart"
                  size={17}
                  trigger="hover"
                  animation="heartbeat"
                />
              </button>
            </div>
          </div>
          <h4 className="cc-item__name">{name}</h4>
          {(year || rating) && (
            <div className="cc-item__meta">
              {year && <span className="cc-item__year">{year}</span>}
              {year && rating && <span className="cc-item__divider">•</span>}
              {rating && (
                <span className="cc-item__rating">
                  <Star
                    size={11}
                    fill="currentColor"
                    className="cc-item__star"
                  />
                  {rating}
                </span>
              )}
            </div>
          )}
          {overviewSnippet && (
            <div className="cc-item__overview-container">
              <p className="cc-item__overview">{overviewSnippet}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

export default function ContentCarousel({
  type,
  title,
  items,
  headerExtra,
}: ContentCarouselProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const visible = useVisibleCount();

  const slides = useMemo(() => {
    // filtrele
    const list = items.filter((it) => it.poster_path && it.overview?.trim());
    const result: Array<(Movie | TVShow)[]> = [];
    for (let i = 0; i < list.length; i += visible) {
      result.push(list.slice(i, i + visible));
    }
    return result;
  }, [items, visible]);

  // aktif index
  const currentIndex =
    slides.length > 0 ? Math.min(activeIndex, slides.length - 1) : 0;

  const handlePrev = () => {
    setActiveIndex((prev) => (prev === 0 ? slides.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setActiveIndex((prev) => (prev === slides.length - 1 ? 0 : prev + 1));
  };

  const swipe = useSwipe(handleNext, handlePrev);

  if (slides.length === 0 && !headerExtra) return null;

  return (
    <div className="content-carousel">
      <div className="cc-header">
        <div className="cc-header__left">
          <h3 className="cc-header__title">{title}</h3>
        </div>
        <div className="cc-header__right">
          {headerExtra}
          {slides.length > 1 && (
            <div className="cc-header__indicators">
              {slides.map((_, index) => (
                <span
                  key={index}
                  role="button"
                  tabIndex={0}
                  className={`cc-indicator-dot ${index === currentIndex ? "active" : ""}`}
                  aria-label={`Slayt ${index + 1}`}
                  aria-current={index === currentIndex ? true : undefined}
                  onClick={() => setActiveIndex(index)}
                  onKeyDown={(e) =>
                    (e.key === "Enter" || e.key === " ") &&
                    setActiveIndex(index)
                  }
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {slides.length > 0 && (
        <div className="cc-carousel-wrapper" {...swipe}>
          {slides.length > 1 && currentIndex > 0 && (
            <button
              className="cc-nav-arrow prev"
              onClick={handlePrev}
              aria-label="Önceki slayt"
            >
              <MotionIcon
                name="ChevronLeft"
                size={30}
                trigger="hover"
                animation="nudge"
              />
            </button>
          )}

          {slides.length > 1 && currentIndex < slides.length - 1 && (
            <button
              className="cc-nav-arrow next"
              onClick={handleNext}
              aria-label="Sonraki slayt"
            >
              <MotionIcon
                name="ChevronRight"
                size={30}
                trigger="hover"
                animation="nudge"
              />
            </button>
          )}

          <Carousel
            placement="bottom"
            activeIndex={currentIndex}
            onSelect={setActiveIndex}
          >
            {slides.map((slide, si) => (
              <div key={si} className="cc-slide">
                {slide.map((item) => (
                  <ItemCard key={item.id} item={item} type={type} />
                ))}
                {/* bosluklar */}
                {Array.from({ length: visible - slide.length }).map((_, i) => (
                  <div
                    key={`bos-${i}`}
                    className="cc-item cc-item--empty"
                    style={{ flexGrow: 1 }}
                  />
                ))}
              </div>
            ))}
          </Carousel>
        </div>
      )}
    </div>
  );
}

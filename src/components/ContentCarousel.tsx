import { memo, useRef, useState, useMemo, useEffect, type ReactNode } from "react";
import { Carousel } from "rsuite";
import { Link, useNavigate } from "react-router-dom";
import { Star } from "lucide-react";
import { MotionIcon } from "motion-icons-react";
import { getImageUrl, tmdbApi, pickTrailer, genreNames, formatRuntime } from "../services/tmdb";
import { useSwipe, mediaName, mediaYear, useLibraryActions, popButton, formatTime, useYouTubeEmbed, buildYoutubeEmbedUrl } from "../helpers";
import { useAppSelector, resumeLabel, canResumeProgress, type SavedItem } from "../store/store";
import type { Movie, TVShow } from "../types/types";

type Media = Movie | TVShow;

export function MediaActionButtons({
  item,
  type,
  className = "",
}: {
  item: Movie | TVShow | SavedItem;
  type: "movie" | "tv";
  className?: string;
}) {
  const lib = useLibraryActions(item, type);
  const watchlistLabel = lib.inWatchlist ? "Listeden çıkar" : "Listeye ekle";
  const likeLabel = lib.isLiked ? "Beğeniyi geri al" : "Beğen";

  return (
    <>
      <button
        className={`cc-item__action-btn outline cc-item__watchlist ${className}${lib.inWatchlist ? " active" : ""}`}
        type="button"
        onClick={lib.onWatchlist}
        aria-label={watchlistLabel}
        data-action-label={watchlistLabel}
      >
        <MotionIcon
          name={lib.inWatchlist ? "Check" : "Plus"}
          size={lib.inWatchlist ? 19 : 20}
          trigger="click"
          animation="pop"
        />
      </button>
      <button
        className={`cc-item__action-btn outline cc-item__like ${className}${lib.isLiked ? " active" : ""}`}
        type="button"
        onClick={lib.onLike}
        aria-label={likeLabel}
        data-action-label={likeLabel}
      >
        <MotionIcon name="Heart" size={17} trigger="click" animation="heartbeat" />
      </button>
    </>
  );
}

const HOVER_EXPAND_DELAY = 500;

const detailCache = new Map<
  string,
  { trailer: string | null; runtime: number; seasons: number }
>();

let closeOpenCard: (() => void) | null = null;
let openToken: object | null = null;

function visibleFor(width: number): number {
  if (width <= 480) return 2;
  if (width <= 768) return 3;
  if (width <= 1024) return 4;
  return 6;
}

function useVisibleCount(): number {
  const [count, setCount] = useState(() =>
    typeof window === "undefined" ? 6 : visibleFor(window.innerWidth),
  );
  useEffect(() => {
    const onResize = () => setCount(visibleFor(window.innerWidth));
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);
  return count;
}

function usePages(items: Media[], visible: number) {
  return useMemo(() => {
    const flat = items.filter((it) => it.poster_path && it.overview?.trim());
    const pages: Media[][] = [];
    for (let start = 0; start < flat.length; start += visible)
      pages.push(flat.slice(start, start + visible));
    return { flat, pages };
  }, [items, visible]);
}

interface ContentCarouselProps {
  type: "movie" | "tv";
  title: string;
  items: Media[];
  headerExtra?: ReactNode;
}

const ItemCard = memo(function ItemCard({
  item,
  type,
}: {
  item: Media;
  type: "movie" | "tv";
}) {
  const ref = useRef<HTMLDivElement>(null);
  const frameRef = useRef<HTMLIFrameElement>(null);
  const hoverTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const token = useRef({});
  const [open, setOpen] = useState(false);
  const [trailerKey, setTrailerKey] = useState<string | null>(null);
  const [runtime, setRuntime] = useState(0);
  const [seasons, setSeasons] = useState(0);
  const navigate = useNavigate();
  const { ready, muted, onFrameLoad, toggleMute: toggleTrailerMute } =
    useYouTubeEmbed(frameRef, open ? trailerKey : null);

  const cardType = (item as SavedItem).media_type ?? type;
  const previewsEnabled = useAppSelector((s) => s.settings.previews);

  const name = mediaName(item);
  const year = mediaYear(item);
  const rating = item.vote_average ? item.vote_average.toFixed(1) : "";
  const genres = genreNames(item.genre_ids, 3);
  const adult = (item as Movie).adult === true;
  const extra =
    cardType === "movie"
      ? formatRuntime(runtime)
      : seasons > 0
        ? `${seasons} Sezon`
        : "";
  // fragman yükle
  useEffect(() => {
    if (!open) return;
    const key = `${cardType}-${item.id}`;
    const cached = detailCache.get(key);
    if (cached) {
      queueMicrotask(() => {
        setTrailerKey(cached.trailer);
        setRuntime(cached.runtime);
        setSeasons(cached.seasons);
      });
      return;
    }
    let cancelled = false;
    tmdbApi
      .getVideos(cardType, item.id)
      .then((videos) => {
        const detail = {
          trailer: pickTrailer(videos.results ?? []),
          runtime: 0,
          seasons: 0,
        };
        detailCache.set(key, detail);
        if (cancelled) return;
        setTrailerKey(detail.trailer);
        setRuntime(detail.runtime);
        setSeasons(detail.seasons);
      })
      .catch(() => {
        detailCache.set(key, { trailer: null, runtime: 0, seasons: 0 });
      });
    return () => {
      cancelled = true;
    };
  }, [open, cardType, item.id]);

  // hover temizliği
  useEffect(() => {
    const myToken = token.current;
    return () => {
      if (hoverTimer.current) clearTimeout(hoverTimer.current);
      if (openToken === myToken) {
        openToken = null;
        closeOpenCard = null;
      }
    };
  }, []);

  const expand = () => {
    if (closeOpenCard && openToken !== token.current) closeOpenCard();
    openToken = token.current;
    closeOpenCard = collapse;
    setOpen(true);
  };

  const collapse = () => {
    if (openToken === token.current) {
      openToken = null;
      closeOpenCard = null;
    }
    setOpen(false);
    setTrailerKey(null);
    setSeasons(0);
    setRuntime(0);
  };

  const onEnter = () => {
    if (!previewsEnabled) return;
    if (window.matchMedia("(hover: none)").matches) return;
    hoverTimer.current = setTimeout(expand, HOVER_EXPAND_DELAY);
  };
  const onLeave = () => {
    if (hoverTimer.current) {
      clearTimeout(hoverTimer.current);
      hoverTimer.current = null;
    }
    if (open) collapse();
  };

  const toggleMute = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    popButton(e.currentTarget as HTMLElement);
    toggleTrailerMute();
  };

  const trailerSrc = trailerKey ? buildYoutubeEmbedUrl(trailerKey) : "";

  const wp = (item as SavedItem).watchProgress;
  const actionLabel = resumeLabel(cardType, wp, formatTime) ?? "Oynat";
  const isResumeAction = actionLabel !== "Oynat";
  const playerState =
    cardType === "tv" && canResumeProgress(wp) && wp.season && wp.episode
      ? { title: name, season: wp.season, episode: wp.episode }
      : { title: name };
  const watchPct =
    wp && wp.duration > 0
      ? Math.min(99, (wp.position / wp.duration) * 100)
      : 0;

  return (
    <div
      ref={ref}
      className={`cc-item${open ? " is-open" : ""}${ready ? " is-playing" : ""}`}
      style={{ flexGrow: open ? 2 : 1 }}
      onMouseEnter={onEnter}
      onMouseLeave={onLeave}
    >
      <Link className="cc-item__link" to={`/${cardType}/${item.id}`}>
        <img
          className="cc-item__poster"
          src={getImageUrl(item.poster_path, "w300")}
          alt={name}
          loading="lazy"
          decoding="async"
        />
      </Link>
      {watchPct > 0 && (
        <div className="cc-progress-bar">
          <div className="cc-progress-bar__fill" style={{ width: `${watchPct}%` }} />
        </div>
      )}



      {open && trailerKey && (
        <>
          <div className={`cc-item__trailer ${ready ? "is-ready" : ""}`}>
            <iframe
              ref={frameRef}
              src={trailerSrc}
              title={name}
              allow="autoplay"
              onLoad={onFrameLoad}
            />
          </div>
          <div
            className="cc-item__trailer-shield"
            onClick={() => navigate(`/${cardType}/${item.id}`)}
          />
          <button
            className="cc-item__action-btn cc-item__mute"
            type="button"
            onClick={toggleMute}
            aria-label={muted ? "Sesi aç" : "Sesi kapat"}
            data-action-label={muted ? "Sesi aç" : "Sesi kapat"}
          >
            <MotionIcon
              name={muted ? "VolumeX" : "Volume2"}
              size={18}
              trigger="click"
              animation="pop"
            />
          </button>
        </>
      )}

      <div
        className={`cc-item__overlay ${open ? "active" : ""}`}
        onClick={() => navigate(`/${cardType}/${item.id}`)}
      >
        <div className="cc-item__details">
          <div className="cc-item__actions-row">
            <div className="cc-item__actions-left">
              <button
                className={`cc-item__action-btn play${isResumeAction ? " is-resume" : ""}`}
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(`/${cardType}/${item.id}/player`, { state: playerState });
                }}
                aria-label={actionLabel}
                data-action-label={actionLabel}
              >
                <MotionIcon name="Play" size={18} trigger="click" animation="nudge" />
                {isResumeAction && (
                  <span className="cc-item__action-text">{actionLabel}</span>
                )}
              </button>
              <MediaActionButtons item={item} type={cardType} />
            </div>
          </div>
          <h4 className="cc-item__name">{name}</h4>
          {(year || rating) && (
            <div className="cc-item__meta">
              {year && <span className="cc-item__year">{year}</span>}
              {year && rating && <span className="cc-item__divider">•</span>}
              {rating && (
                <span className="cc-item__rating">
                  <Star size={11} fill="currentColor" className="cc-item__star" />
                  {rating}
                </span>
              )}
            </div>
          )}
          {(genres.length > 0 || adult || extra) && (
            <div className="cc-item__tagline">
              {adult && <span className="cc-item__age">18+</span>}
              <span className="cc-item__genres">
                {[...genres, extra].filter(Boolean).join(" · ")}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

function Peek({
  item,
  side,
  onClick,
}: {
  item: Media;
  side: "prev" | "next";
  onClick: () => void;
}) {
  return (
    <button
      className={`cc-peek ${side}`}
      onClick={onClick}
      aria-label={side === "prev" ? "Önceki" : "Sonraki"}
      tabIndex={-1}
    >
      <img
        src={getImageUrl(item.poster_path, "w300")}
        alt=""
        loading="lazy"
        decoding="async"
      />
    </button>
  );
}

function NavArrow({ side, onClick }: { side: "prev" | "next"; onClick: () => void }) {
  return (
    <button
      className={`cc-nav-arrow ${side}`}
      onClick={onClick}
      aria-label={side === "prev" ? "Önceki slayt" : "Sonraki slayt"}
    >
      <MotionIcon
        name={side === "prev" ? "ChevronLeft" : "ChevronRight"}
        size={30}
        trigger="click"
        animation="nudge"
      />
    </button>
  );
}

export default function ContentCarousel({
  type,
  title,
  items,
  headerExtra,
}: ContentCarouselProps) {
  const [page, setPage] = useState(0);
  const visible = useVisibleCount();
  const { flat, pages } = usePages(items, visible);
  const trackRef = useRef<HTMLDivElement>(null);

  const current = pages.length > 0 ? Math.min(page, pages.length - 1) : 0;

  const from = current * visible;
  const peekPrev = from > 0 ? flat[from - 1] : null;
  const peekNext = from + visible < flat.length ? flat[from + visible] : null;

  const goPrev = () => setPage((p) => (p === 0 ? pages.length - 1 : p - 1));
  const goNext = () => setPage((p) => (p === pages.length - 1 ? 0 : p + 1));
  const swipe = useSwipe(goNext, goPrev);

  if (pages.length === 0 && !headerExtra) return null;

  const multi = pages.length > 1;

  return (
    <div className="content-carousel">
      <div className="cc-header">
        <div className="cc-header__left">
          <h3 className="cc-header__title">{title}</h3>
        </div>
        <div className="cc-header__right">
          {multi && (
            <div className="cc-header__indicators">
              {pages.map((_, i) => (
                <span
                  key={i}
                  role="button"
                  tabIndex={0}
                  className={`cc-indicator-dot ${i === current ? "active" : ""}`}
                  aria-label={`Slayt ${i + 1}`}
                  aria-current={i === current ? true : undefined}
                  onClick={() => setPage(i)}
                  onKeyDown={(e) =>
                    (e.key === "Enter" || e.key === " ") && setPage(i)
                  }
                />
              ))}
            </div>
          )}
          {headerExtra}
        </div>
      </div>

      {pages.length > 0 && (
        <div className="cc-carousel-wrapper" ref={trackRef} {...swipe}>
          {multi && current > 0 && <NavArrow side="prev" onClick={goPrev} />}
          {multi && current < pages.length - 1 && (
            <NavArrow side="next" onClick={goNext} />
          )}
          {peekPrev && (
            <Peek
              key={`prev-${peekPrev.id}`}
              item={peekPrev}
              side="prev"
              onClick={goPrev}
            />
          )}
          {peekNext && (
            <Peek
              key={`next-${peekNext.id}`}
              item={peekNext}
              side="next"
              onClick={goNext}
            />
          )}

          <Carousel placement="bottom" activeIndex={current} onSelect={setPage}>
            {pages.map((slide, si) => (
              <div key={si} className="cc-slide">
                {slide.map((it) => (
                  <ItemCard key={`${type}-${it.id}`} item={it} type={type} />
                ))}
                {Array.from({ length: visible - slide.length }).map((_, i) => (
                  <div
                    key={`empty-${i}`}
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

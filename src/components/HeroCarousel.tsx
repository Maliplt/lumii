import { useState, useRef, useEffect } from "react";
import { Carousel, Button } from "rsuite";
import { Link, useNavigate } from "react-router-dom";
import { Play, Info, Film, Star } from "lucide-react";
import { MotionIcon } from "motion-icons-react";
import {
  getImageUrl,
  genreNames,
  tmdbApi,
  formatRuntime,
  pickTrailer,
} from "../services/tmdb";
import { useSwipe, mediaName, mediaYear, popButton } from "../helpers";
import { MediaActionButtons } from "./ContentCarousel";
import type { Movie, TVShow, MovieDetail, TVShowDetail } from "../types/types";

type HeroItem = Movie | TVShow;

const heroMetaCache = new Map<string, string>();

interface HeroCarouselProps {
  movies: HeroItem[];
  onTrailer?: (movie: HeroItem) => void;
  meta?: string[];
  director?: string;
  directorLabel?: string;
  inlineTrailer?: boolean;
  trailerDelayMs?: number;
  hideMoreInfo?: boolean;
}

const AUTO_SLIDE_DELAY = 6000;
const YT_ENDED = 0;
const YT_PLAYING = 1;

export default function HeroCarousel({
  movies,
  onTrailer,
  meta,
  director,
  inlineTrailer = false,
  trailerDelayMs = 1400,
  hideMoreInfo = false,
  directorLabel = "Yönetmen",
}: HeroCarouselProps) {
  const navigate = useNavigate();
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [inView, setInView] = useState(true);
  const [autoMeta, setAutoMeta] = useState<string[]>([]);
  const [heroTrailerKey, setHeroTrailerKey] = useState<string | null>(null);
  const [heroTrailerReady, setHeroTrailerReady] = useState(false);
  const [heroTrailerMuted, setHeroTrailerMuted] = useState(true);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const fillRef = useRef<HTMLDivElement>(null);
  const trailerRef = useRef<HTMLIFrameElement>(null);
  const isPausedRef = useRef(false);
  const multi = movies.length > 1;

  const handlePrev = () =>
    setActiveIndex((prev) => (prev === 0 ? movies.length - 1 : prev - 1));

  const handleNext = () =>
    setActiveIndex((prev) => (prev === movies.length - 1 ? 0 : prev + 1));

  const swipe = useSwipe(handleNext, handlePrev);

  const toggleHeroSound = (e: React.MouseEvent) => {
    e.stopPropagation();
    popButton(e.currentTarget as HTMLElement);
    trailerRef.current?.contentWindow?.postMessage(
      JSON.stringify({
        event: "command",
        func: heroTrailerMuted ? "unMute" : "mute",
      }),
      "*",
    );
    setHeroTrailerMuted((m) => !m);
  };

  useEffect(() => {
    isPausedRef.current = isPaused;
  }, [isPaused]);

  useEffect(() => {
    if (meta && meta.length) return;
    const m = movies[activeIndex];
    if (!m) return;
    const mtype = "title" in m ? "movie" : "tv";
    const key = `${mtype}-${m.id}`;
    const cached = heroMetaCache.get(key);
    if (cached !== undefined) {
      queueMicrotask(() => setAutoMeta(cached ? [cached] : []));
      return;
    }
    let alive = true;
    (async () => {
      try {
        const d =
          mtype === "movie"
            ? await tmdbApi.getMovieDetail(m.id)
            : await tmdbApi.getTVShowDetail(m.id);
        const text =
          mtype === "movie"
            ? formatRuntime((d as MovieDetail).runtime ?? 0)
            : (d as TVShowDetail).number_of_seasons
              ? `${(d as TVShowDetail).number_of_seasons} Sezon`
              : "";
        heroMetaCache.set(key, text);
        if (alive) setAutoMeta(text ? [text] : []);
      } catch {
        heroMetaCache.set(key, "");
        if (alive) setAutoMeta([]);
      }
    })();
    return () => {
      alive = false;
    };
  }, [activeIndex, movies, meta]);

  useEffect(() => {
    const el = wrapperRef.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setInView(e.isIntersecting), {
      threshold: 0.35,
    });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (!multi || !inView) return;
    const fill = fillRef.current;
    if (fill) {
      fill.style.width = "100%";
      fill.style.transform = "scaleX(0)";
    }
    let raf = 0;
    let last = performance.now();
    let elapsed = 0;
    const tick = (now: number) => {
      const dt = now - last;
      last = now;
      if (!isPausedRef.current) elapsed += Math.min(dt, 100);
      const ratio = Math.min(1, elapsed / AUTO_SLIDE_DELAY);
      if (fill) fill.style.transform = `scaleX(${ratio})`;
      if (ratio >= 1) {
        setActiveIndex((p) => (p === movies.length - 1 ? 0 : p + 1));
        return;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [activeIndex, multi, inView, movies.length]);

  useEffect(() => {
    setHeroTrailerKey(null);
    setHeroTrailerReady(false);
    setHeroTrailerMuted(true);
    if (!inlineTrailer || !inView) return;
    const m = movies[activeIndex];
    if (!m) return;

    let alive = true;
    const timer = setTimeout(async () => {
      try {
        const mtype = "title" in m ? "movie" : "tv";
        const videos = await tmdbApi.getVideos(mtype, m.id);
        if (!alive) return;
        setHeroTrailerKey(pickTrailer(videos.results));
      } catch {
        if (alive) setHeroTrailerKey(null);
      }
    }, trailerDelayMs);

    return () => {
      alive = false;
      clearTimeout(timer);
    };
  }, [activeIndex, inlineTrailer, inView, movies, trailerDelayMs]);

  useEffect(() => {
    if (!heroTrailerKey) return;
    const onMessage = (e: MessageEvent) => {
      if (e.origin !== "https://www.youtube.com") return;
      let msg: { info?: { playerState?: number } };
      try {
        msg = JSON.parse(e.data);
      } catch {
        return;
      }
      const state = msg.info?.playerState;
      if (state === YT_PLAYING) setHeroTrailerReady(true);
      if (state === YT_ENDED)
        trailerRef.current?.contentWindow?.postMessage(
          JSON.stringify({ event: "command", func: "playVideo" }),
          "*",
        );
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [heroTrailerKey]);

  if (movies.length === 0) return null;

  return (
    <div
      className={`hero-carousel-wrapper${isPaused ? " is-paused" : ""}`}
      ref={wrapperRef}
      {...swipe}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <Carousel
        placement="bottom"
        shape="dot"
        activeIndex={activeIndex}
        onSelect={(index) => setActiveIndex(index)}
        className="hero-carousel-inner"
      >
        {movies.map((movie, index) => {
          const genres = genreNames(movie.genre_ids, 3);
          const hasRating = movie.vote_average > 0;
          const title = mediaName(movie);
          const year = mediaYear(movie);
          const mtype = "title" in movie ? "movie" : "tv";
          const inlineTrailerKey =
            inlineTrailer && index === activeIndex ? heroTrailerKey : null;
          const showInlineTrailer = !!inlineTrailerKey;
          const trailerOrigin =
            typeof window === "undefined"
              ? ""
              : `&origin=${encodeURIComponent(window.location.origin)}`;
          const trailerSrc = showInlineTrailer
            ? `https://www.youtube.com/embed/${inlineTrailerKey}?autoplay=1&mute=1&controls=0&disablekb=1&fs=0&modestbranding=1&rel=0&iv_load_policy=3&playsinline=1&enablejsapi=1${trailerOrigin}`
            : "";
          // detay metasi
          const slideMeta =
            meta && meta.length
              ? meta
              : index === activeIndex
                ? autoMeta
                : [];

          return (
            <div key={movie.id} className="hero-slide">
              <img
                className="hero-slide__img"
                src={getImageUrl(movie.backdrop_path, "w1280")}
                alt={title}
                loading={index === 0 ? "eager" : "lazy"}
                decoding="async"
                fetchPriority={index === 0 ? "high" : "auto"}
              />
              {showInlineTrailer && (
                <div
                  className={`hero-trailer${heroTrailerReady ? " is-ready" : ""}`}
                >
                  <iframe
                    ref={trailerRef}
                    src={trailerSrc}
                    title={`${title} fragman`}
                    allow="autoplay; encrypted-media; fullscreen"
                    onLoad={() =>
                      trailerRef.current?.contentWindow?.postMessage(
                        JSON.stringify({ event: "listening", channel: "widget" }),
                        "*",
                      )
                    }
                  />
                </div>
              )}
              {showInlineTrailer && (
                <button
                  type="button"
                  className="hero-sound-toggle"
                  onClick={toggleHeroSound}
                  aria-label={heroTrailerMuted ? "Sesi aç" : "Sesi kapat"}
                >
                  <MotionIcon
                    name={heroTrailerMuted ? "VolumeX" : "Volume2"}
                    size={20}
                    trigger="click"
                    animation="pop"
                  />
                </button>
              )}
              <div className="hero-overlay" />
              <div className="hero-bottom-fade" />

              <div className="hero-info">
                {genres.length > 0 && (
                  <div className="hero-info__genres">
                    {genres.map((name) => (
                      <span key={name} className="hero-genre-tag">
                        {name}
                      </span>
                    ))}
                  </div>
                )}

                <h1 className="hero-info__title">{title}</h1>

                {(hasRating || year || slideMeta.length > 0) && (
                  <div className="hero-info__meta-row">
                    {hasRating && (
                      <span className="hero-rating">
                        <Star size={12} fill="currentColor" />
                        {movie.vote_average.toFixed(1)}
                      </span>
                    )}
                    {year && <span className="hero-year-badge">{year}</span>}
                    {slideMeta.map((m) => (
                      <span key={m} className="hero-meta-extra">
                        {m}
                      </span>
                    ))}
                  </div>
                )}

                {director && (
                  <p className="hero-crew">
                    <strong>{directorLabel}:</strong> {director}
                  </p>
                )}

                <p className="hero-overview">{movie.overview}</p>

                <div className="hero-info__buttons">
                  <Button
                    className="btn-play"
                    size="lg"
                    onClick={() =>
                      navigate(`/${mtype}/${movie.id}/player`, {
                        state: { title },
                      })
                    }
                  >
                    <Play size={20} fill="currentColor" className="play-icon" />{" "}
                    Oynat
                  </Button>

                  {inlineTrailer && (
                    <MediaActionButtons
                      item={movie}
                      type={mtype}
                      className="hero-action-btn"
                    />
                  )}

                  {onTrailer && !inlineTrailer ? (
                    <button
                      type="button"
                      className="btn-more-info"
                      onClick={() => onTrailer(movie)}
                    >
                      <Film size={20} />
                      Fragman İzle
                    </button>
                  ) : !hideMoreInfo ? (
                    <Link to={`/${mtype}/${movie.id}`} className="btn-more-info">
                      <Info size={20} />
                      Daha Fazla Bilgi
                    </Link>
                  ) : null}
                </div>
              </div>
            </div>
          );
        })}
      </Carousel>

      {multi && (
        <>
          <button
            className="hero-nav-btn prev"
            onClick={handlePrev}
            aria-label="Önceki"
          >
            <MotionIcon name="ChevronLeft" size={24} trigger="click" animation="nudge" />
          </button>
          <button
            className="hero-nav-btn next"
            onClick={handleNext}
            aria-label="Sonraki"
          >
            <MotionIcon name="ChevronRight" size={24} trigger="click" animation="nudge" />
          </button>
        </>
      )}

      {multi && (
        <div className="hero-progress">
          {movies.map((_, i) => (
            <div key={i} className="hero-progress__seg">
              <div
                ref={i === activeIndex ? fillRef : undefined}
                className="hero-progress__seg-fill"
                style={{
                  width:
                    i < activeIndex ? "100%" : i > activeIndex ? "0%" : undefined,
                }}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

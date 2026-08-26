import { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Play, Info, Film, Lock, Star } from "lucide-react";
import { MotionIcon } from "../ui/MotionIcon";
import MediaActionButtons from "./MediaActionButtons";
import { getImageUrl, getMediaDetail, genreNames, formatRuntime } from "../../services/tmdb";
import { optionalServiceRequest } from "../../services/serviceError";
import { useSwipe, mediaName, mediaYear, mediaTypeOf, useYouTubeEmbed, buildYoutubeEmbedUrl, canUseLevel, contentAccessLevel, navigateToPlayback, upgradeCtaLabel } from "../../helpers";
import { selectAutoplayEnabled, selectPreviewsEnabled, useAppSelector } from "../../store/store";
import type { ContentAccessLevel, Movie, TVShow } from "../../types/types";
import { useTrailerPreview } from "../../lib/useTrailerPreview";
import OptimizedImage from "../ui/OptimizedImage";
import TrailerPreviewButton from "./TrailerPreviewButton";
import ActionButton from "../ui/ActionButton";
import TrailerEmbedFrame from "./TrailerEmbedFrame";

type HeroItem = Movie | TVShow;

const heroMetaCache = new Map<string, string>();

interface HeroCarouselProps {
  movies: HeroItem[];
  onTrailer?: (movie: HeroItem) => void;
  meta?: string[];
  director?: string;
  directorLabel?: string;
  inlineTrailer?: boolean;
  manualTrailerControl?: boolean;
  inlineTrailerKey?: string | null;
  trailerDelayMs?: number;
  hideMoreInfo?: boolean;
  ctaLabel?: string;
  ctaNavState?: { season?: number; episode?: number };
  accessLevel?: ContentAccessLevel;
}

const AUTO_SLIDE_DELAY = 6000;

export default function HeroCarousel({
  movies,
  onTrailer,
  meta,
  director,
  inlineTrailer = false,
  manualTrailerControl = false,
  trailerDelayMs = 1400,
  hideMoreInfo = false,
  directorLabel = "Yönetmen",
  inlineTrailerKey,
  ctaLabel,
  ctaNavState,
  accessLevel,
}: HeroCarouselProps) {
  const navigate = useNavigate();
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [inView, setInView] = useState(true);
  const [autoMeta, setAutoMeta] = useState<string[]>([]);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const progressFillRef = useRef<HTMLDivElement>(null);
  const isPausedRef = useRef(false);
  const multi = movies.length > 1;
  const userPlan = useAppSelector((s) => s.auth.currentUser?.plan);
  const autoplayEnabled = useAppSelector(selectAutoplayEnabled);
  const previewsEnabled = useAppSelector(selectPreviewsEnabled);
  const manualPreviewEnabled = inlineTrailer && manualTrailerControl && previewsEnabled && inView;
  const autoPreviewEnabled = inlineTrailer && !manualTrailerControl && autoplayEnabled && previewsEnabled && inView;
  const previewEnabled = manualPreviewEnabled || autoPreviewEnabled;
  const activeMovie = movies[activeIndex];
  const activeMediaType = activeMovie ? mediaTypeOf(activeMovie) : null;
  const {
    videoKey: heroTrailerKey,
    status: heroTrailerStatus,
    start: startHeroTrailer,
    stop: stopHeroTrailer,
  } = useTrailerPreview({
    mediaType: activeMediaType,
    mediaId: activeMovie?.id ?? null,
    enabled: previewEnabled,
    priority: manualTrailerControl ? "user" : "automatic",
    autoStart: autoPreviewEnabled,
    delayMs: trailerDelayMs,
    inlineVideoKey: inlineTrailerKey,
  });

  const {
    ready: heroTrailerReady,
    onFrameLoad: onTrailerFrameLoad,
  } = useYouTubeEmbed(previewEnabled ? heroTrailerKey : null);

  const handlePrev = () => {
    if (progressFillRef.current) progressFillRef.current.style.width = "0%";
    setActiveIndex((prev) => (prev === 0 ? movies.length - 1 : prev - 1));
  };

  const handleNext = () => {
    if (progressFillRef.current) progressFillRef.current.style.width = "0%";
    setActiveIndex((prev) => (prev === movies.length - 1 ? 0 : prev + 1));
  };

  const swipe = useSwipe(handleNext, handlePrev);

  const toggleManualTrailer = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    if (heroTrailerKey) {
      stopHeroTrailer();
      return;
    }
    void startHeroTrailer();
  };

  useEffect(() => {
    isPausedRef.current = isPaused;
  }, [isPaused]);

  useEffect(() => {
    if (meta && meta.length) return;
    const m = movies[activeIndex];
    if (!m) return;
    const mtype = mediaTypeOf(m);
    const key = `${mtype}-${m.id}`;
    const cached = heroMetaCache.get(key);
    if (cached !== undefined) {
      queueMicrotask(() => setAutoMeta(cached ? [cached] : []));
      return;
    }
    let alive = true;
    (async () => {
      const d = await optionalServiceRequest(getMediaDetail(mtype, m.id));
      if (!d) {
        heroMetaCache.set(key, "");
        if (alive) setAutoMeta([]);
        return;
      }
      const text =
        d.media_type === "movie"
          ? formatRuntime(d.runtime ?? 0)
          : d.number_of_seasons
            ? `${d.number_of_seasons} Sezon`
            : "";
      heroMetaCache.set(key, text);
      if (alive) setAutoMeta(text ? [text] : []);
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
    if (progressFillRef.current) progressFillRef.current.style.width = "0%";
    let raf = 0;
    let last = performance.now();
    let elapsed = 0;
    const tick = (now: number) => {
      const dt = now - last;
      last = now;
      if (!isPausedRef.current) elapsed += Math.min(dt, 100);
      const ratio = Math.min(1, elapsed / AUTO_SLIDE_DELAY);
      if (progressFillRef.current) {
        progressFillRef.current.style.width = `${ratio * 100}%`;
      }
      if (ratio >= 1) {
        setActiveIndex((p) => (p === movies.length - 1 ? 0 : p + 1));
        return;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [activeIndex, multi, inView, movies.length]);

  if (movies.length === 0) return null;

  return (
    <div
      className={`hero-carousel-wrapper${isPaused ? " is-paused" : ""}`}
      ref={wrapperRef}
      {...swipe}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <div className="hero-carousel-inner">
        <div
          className="hero-carousel-track"
          style={{ transform: `translateX(-${activeIndex * 100}%)` }}
        >
        {movies.map((movie, index) => {
          const genres = genreNames(movie.genre_ids, 3);
          const hasRating = movie.vote_average > 0;
          const title = mediaName(movie);
          const year = mediaYear(movie);
          const mtype = mediaTypeOf(movie);
          const requiredLevel = contentAccessLevel(mtype, movie.id, accessLevel);
          const locked = !canUseLevel(userPlan, requiredLevel);
          const activeTrailerKey =
            previewEnabled &&
            index === activeIndex &&
            activeMovie?.id === movie.id
              ? heroTrailerKey
              : null;
          const showInlineTrailer = !!activeTrailerKey;
          const trailerSrc = showInlineTrailer
              ? buildYoutubeEmbedUrl(activeTrailerKey, {
                autoplay: manualTrailerControl || autoplayEnabled,
                muted: !manualTrailerControl,
              })
            : "";
          // detay bilgileri
          const slideMeta =
            meta && meta.length
              ? meta
              : index === activeIndex
                ? autoMeta
                : [];

          return (
            <div
              key={movie.id}
              className="hero-slide"
              aria-hidden={index !== activeIndex}
              inert={index !== activeIndex}
            >
              <OptimizedImage
                className="hero-slide__img"
                src={getImageUrl(movie.backdrop_path, "w1280")}
                alt={title}
                priority={index === 0}
              />
              {showInlineTrailer && (
                <div
                  className={`hero-trailer${heroTrailerReady ? " is-ready" : ""}`}
                >
                  <TrailerEmbedFrame
                    src={trailerSrc}
                    title={`${title} fragman`}
                    onLoad={onTrailerFrameLoad}
                  />
                </div>
              )}
              <div className="hero-overlay" />
              <div className="hero-bottom-fade" />

              <div
                className="hero-info"
                key={index === activeIndex ? `active-${activeIndex}` : `idle-${index}`}
              >
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

                <div className={`hero-info__buttons${manualTrailerControl && previewsEnabled ? " has-manual-trailer" : ""}`}>
                  <ActionButton
                    className="btn-play"
                    label={locked ? upgradeCtaLabel(requiredLevel) : (ctaLabel ?? "Oynat")}
                    onClick={() => {
                      stopHeroTrailer();
                      navigateToPlayback({
                        navigate,
                        type: mtype,
                        id: movie.id,
                        planId: userPlan,
                        accessLevel,
                        autoplayEnabled,
                        title,
                        ...ctaNavState,
                      });
                    }}
                  >
                    {locked ? <Lock size={19} /> : <Play size={20} fill="currentColor" className="play-icon" />}{" "}
                    <span className="btn-play__label">
                      {locked ? upgradeCtaLabel(requiredLevel) : (ctaLabel ?? "Oynat")}
                    </span>
                  </ActionButton>

                  {inlineTrailer && (
                    <MediaActionButtons
                      item={movie}
                      type={mtype}
                      className="hero-icon-action"
                    />
                  )}

                  {manualTrailerControl && previewsEnabled && (
                    <TrailerPreviewButton
                      className="hero-icon-action"
                      status={heroTrailerStatus}
                      active={showInlineTrailer}
                      iconOnly
                      onClick={toggleManualTrailer}
                      ariaLabel={showInlineTrailer ? "Fragmanı durdur" : "Fragmanı izle"}
                    />
                  )}

                  {onTrailer && !inlineTrailer ? (
                    <ActionButton
                      className="btn-more-info"
                      label="Fragman İzle"
                      onClick={() => onTrailer(movie)}
                    >
                      <Film size={20} />
                      <span className="btn-more-info__label">Fragman İzle</span>
                    </ActionButton>
                  ) : !hideMoreInfo ? (
                    <Link
                      to={`/${mtype}/${movie.id}`}
                      className="btn-more-info"
                      aria-label="Daha Fazla Bilgi"
                    >
                      <Info size={20} />
                      <span className="btn-more-info__label">Daha Fazla Bilgi</span>
                    </Link>
                  ) : null}
                </div>

                {multi && index === activeIndex && (
                  <div className="hero-progress">
                    {movies.map((_, i) => (
                      <div key={i} className={`hero-progress__seg${i < activeIndex ? " is-past" : ""}`}>
                        <div
                          ref={i === activeIndex ? progressFillRef : undefined}
                          className={`hero-progress__seg-fill${i === activeIndex ? " active" : ""}`}
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}
        </div>
      </div>

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

    </div>
  );
}

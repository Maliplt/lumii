import { useState, useRef, useEffect } from "react";
import { Carousel, Button } from "rsuite";
import { Link, useNavigate } from "react-router-dom";
import { Play, Info, Star } from "lucide-react";
import { MotionIcon } from "motion-icons-react";
import { animate, stagger } from "animejs";
import { getImageUrl } from "../services/tmdb";
import { useSwipe } from "../helpers";
import type { Movie } from "../types/types";

interface HeroCarouselProps {
  movies: Movie[];
}

// tmdb tur id -> turkce
const GENRE_MAP: Record<number, string> = {
  28: "Aksiyon", 12: "Macera", 16: "Animasyon", 35: "Komedi",
  80: "Suç", 99: "Belgesel", 18: "Dram", 10751: "Aile",
  14: "Fantastik", 36: "Tarih", 27: "Korku", 10402: "Müzik",
  9648: "Gizem", 10749: "Romantik", 878: "Bilim-Kurgu",
  10770: "TV Film", 53: "Gerilim", 10752: "Savaş", 37: "Western",
};

// otomatik gecis suresi (ms)
const AUTO_SLIDE_DELAY = 6000;

export default function HeroCarousel({ movies }: HeroCarouselProps) {
  const navigate = useNavigate();
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const fillRef = useRef<HTMLDivElement>(null);
  const isPausedRef = useRef(false);

  const handlePrev = () =>
    setActiveIndex((prev) => (prev === 0 ? movies.length - 1 : prev - 1));

  const handleNext = () =>
    setActiveIndex((prev) => (prev === movies.length - 1 ? 0 : prev + 1));

  const swipe = useSwipe(handleNext, handlePrev);

  // slayt animasyonu
  useEffect(() => {
    const slides = wrapperRef.current?.querySelectorAll(".hero-slide");
    const active = slides?.[activeIndex];
    const els = active?.querySelectorAll(".hero-info > *");
    if (els && els.length) {
      animate(els, {
        opacity: [0, 1],
        translateY: [20, 0],
        duration: 500,
        delay: stagger(65),
        ease: "out(3)",
      });
    }
  }, [activeIndex]);

  // hover durumunu rAF dongusu icin sakla
  useEffect(() => {
    isPausedRef.current = isPaused;
  }, [isPaused]);

  // otomatik gecis + ilerleme cubugu — rAF/delta-time, asla donmaz, hover'da duraklar
  useEffect(() => {
    if (movies.length <= 1) return;
    const fill = fillRef.current;
    if (fill) fill.style.width = "0%";
    let raf = 0;
    let last = performance.now();
    let elapsed = 0;
    const tick = (now: number) => {
      const dt = now - last;
      last = now;
      if (!isPausedRef.current) elapsed += Math.min(dt, 100);
      const ratio = Math.min(1, elapsed / AUTO_SLIDE_DELAY);
      if (fill) fill.style.width = `${ratio * 100}%`;
      if (ratio >= 1) {
        setActiveIndex((p) => (p === movies.length - 1 ? 0 : p + 1));
        return;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [activeIndex, movies.length]);

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
          const genres = (movie.genre_ids ?? [])
            .map((id) => GENRE_MAP[id])
            .filter(Boolean)
            .slice(0, 3);
          const hasRating = movie.vote_average > 0;
          const year = movie.release_date?.slice(0, 4);

          return (
            <div key={movie.id} className="hero-slide">
              <img
                className="hero-slide__img"
                src={getImageUrl(movie.backdrop_path, "original")}
                alt={movie.title}
                loading={index === 0 ? "eager" : "lazy"}
                fetchPriority={index === 0 ? "high" : "auto"}
              />
              <div className="hero-overlay" />

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

                <h1 className="hero-info__title">{movie.title}</h1>

                {(hasRating || year) && (
                  <div className="hero-info__meta-row">
                    {hasRating && (
                      <span className="hero-rating">
                        <Star size={12} fill="currentColor" />
                        {movie.vote_average.toFixed(1)}
                      </span>
                    )}
                    {year && <span className="hero-year-badge">{year}</span>}
                  </div>
                )}

                {/* dogal tasma */}
                <p className="hero-overview">{movie.overview}</p>

                <div className="hero-info__buttons">
                  <Button
                    className="btn-play"
                    size="lg"
                    onClick={() =>
                      navigate(`/movie/${movie.id}/player`, {
                        state: { title: movie.title },
                      })
                    }
                  >
                    <Play size={20} fill="currentColor" className="play-icon" />{" "}
                    Oynat
                  </Button>

                  <Link to={`/movie/${movie.id}`} className="btn-more-info">
                    <Info size={18} />
                    Detaylar
                  </Link>
                </div>
              </div>
            </div>
          );
        })}
      </Carousel>

      {/* nav butonlar */}
      <button
        className="hero-nav-btn prev"
        onClick={handlePrev}
        aria-label="Önceki"
      >
        <MotionIcon name="ChevronLeft" size={28} trigger="hover" animation="nudge" />
      </button>
      <button
        className="hero-nav-btn next"
        onClick={handleNext}
        aria-label="Sonraki"
      >
        <MotionIcon name="ChevronRight" size={28} trigger="hover" animation="nudge" />
      </button>

      {movies.length > 1 && (
        <div className="hero-progress">
          <div ref={fillRef} className="hero-progress__fill" />
        </div>
      )}

      <div className="hero-bottom-fade" />
    </div>
  );
}

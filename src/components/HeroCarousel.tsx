import { useState, useRef, useEffect } from "react";
import { Carousel, Button } from "rsuite";
import { useNavigate } from "react-router-dom";
import { Play } from "lucide-react";
import { MotionIcon } from "motion-icons-react";
import { animate, stagger } from "animejs";
import { getImageUrl } from "../services/tmdb";
import { useSwipe } from "../helpers";
import type { Movie } from "../types/types";

interface HeroCarouselProps {
  movies: Movie[];
}

const OVERVIEW_MAX = 180;

export default function HeroCarousel({ movies }: HeroCarouselProps) {
  const navigate = useNavigate();
  const [activeIndex, setActiveIndex] = useState(0);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const handlePrev = () => {
    setActiveIndex((prev) => (prev === 0 ? movies.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setActiveIndex((prev) => (prev === movies.length - 1 ? 0 : prev + 1));
  };

  const swipe = useSwipe(handleNext, handlePrev);

  useEffect(() => {
    const slides = wrapperRef.current?.querySelectorAll(".hero-slide");
    const active = slides?.[activeIndex];
    const els = active?.querySelectorAll(".hero-info > *");
    if (els && els.length) {
      animate(els, {
        opacity: [0, 1],
        translateY: [24, 0],
        duration: 520,
        delay: stagger(70),
        ease: "out(3)",
      });
    }
  }, [activeIndex]);

  if (movies.length === 0) return null;

  return (
    <div className="hero-carousel-wrapper" ref={wrapperRef} {...swipe}>
      <Carousel
        placement="bottom"
        shape="dot"
        activeIndex={activeIndex}
        onSelect={(index) => setActiveIndex(index)}
        className="hero-carousel-inner"
      >
        {movies.map((movie, index) => (
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
              <h1 className="hero-info__title">{movie.title}</h1>
              <p className="hero-meta">{movie.release_date?.slice(0, 4)}</p>
              <p className="hero-overview">
                {movie.overview?.slice(0, OVERVIEW_MAX)}
                {(movie.overview?.length ?? 0) > OVERVIEW_MAX ? "…" : ""}
              </p>
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
            </div>
          </div>
        ))}
      </Carousel>

      <button
        className="hero-nav-btn prev"
        onClick={handlePrev}
        aria-label="Önceki slayt"
      >
        <MotionIcon
          name="ChevronLeft"
          size={36}
          trigger="hover"
          animation="nudge"
        />
      </button>
      <button
        className="hero-nav-btn next"
        onClick={handleNext}
        aria-label="Sonraki slayt"
      >
        <MotionIcon
          name="ChevronRight"
          size={36}
          trigger="hover"
          animation="nudge"
        />
      </button>

      <div className="hero-bottom-fade" />
    </div>
  );
}

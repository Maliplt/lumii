import { useRef, useState, useEffect, useCallback, type MouseEvent } from "react";
import { Link } from "react-router-dom";
import { Gamepad2, ChevronLeft, ChevronRight } from "lucide-react";
import { GAMES, type GameDef } from "../../lib/games";
import OptimizedImage from "../ui/OptimizedImage";

interface GameCarouselProps {
  games?: GameDef[];
  title?: string;
}

export default function GameCarousel({
  games = GAMES,
  title = "TENET Oyunlar",
}: GameCarouselProps) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const [isDragging, setIsDragging] = useState(false);
  const dragInfo = useRef({ startX: 0, scrollLeft: 0, moved: false });

  const updateScrollState = useCallback(() => {
    const el = wrapperRef.current;
    if (!el) return;
    const { scrollLeft, scrollWidth, clientWidth } = el;
    setCanScrollLeft(scrollLeft > 6);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 6);
  }, []);

  useEffect(() => {
    updateScrollState();
    const el = wrapperRef.current;
    if (!el) return;
    el.addEventListener("scroll", updateScrollState, { passive: true });
    window.addEventListener("resize", updateScrollState);
    return () => {
      el.removeEventListener("scroll", updateScrollState);
      window.removeEventListener("resize", updateScrollState);
    };
  }, [updateScrollState, games]);

  const scroll = (direction: "prev" | "next") => {
    const el = wrapperRef.current;
    if (!el) return;
    const scrollAmount = (direction === "prev" ? -1 : 1) * Math.max(380, el.clientWidth * 0.65);
    el.scrollBy({ left: scrollAmount, behavior: "smooth" });
  };

  const onMouseDown = (e: MouseEvent<HTMLDivElement>) => {
    const el = wrapperRef.current;
    if (!el) return;
    dragInfo.current = {
      startX: e.pageX - el.offsetLeft,
      scrollLeft: el.scrollLeft,
      moved: false,
    };
    setIsDragging(true);
  };

  const onMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    const el = wrapperRef.current;
    if (!el) return;
    const x = e.pageX - el.offsetLeft;
    const walk = (x - dragInfo.current.startX) * 1.3;
    if (Math.abs(walk) > 4) {
      dragInfo.current.moved = true;
    }
    el.scrollLeft = dragInfo.current.scrollLeft - walk;
  };

  const onMouseUp = () => {
    setIsDragging(false);
  };

  const onCardClick = (e: React.MouseEvent) => {
    if (dragInfo.current.moved) {
      e.preventDefault();
      dragInfo.current.moved = false;
    }
  };

  return (
    <div className="game-carousel">
      <div className="gc-header">
        <div className="gc-header__left">
          <Gamepad2 className="gc-header__icon" size={20} />
          <h3>{title}</h3>
        </div>
        <div className="gc-header__nav">
          <button
            type="button"
            className={`gc-nav-btn gc-nav-btn--prev ${!canScrollLeft ? "is-disabled" : ""}`}
            onClick={() => scroll("prev")}
            disabled={!canScrollLeft}
            aria-label="Önceki oyunlar"
          >
            <ChevronLeft size={18} />
          </button>
          <button
            type="button"
            className={`gc-nav-btn gc-nav-btn--next ${!canScrollRight ? "is-disabled" : ""}`}
            onClick={() => scroll("next")}
            disabled={!canScrollRight}
            aria-label="Sonraki oyunlar"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      <div className="gc-viewport-container">
        {canScrollLeft && (
          <button
            type="button"
            className="gc-side-arrow gc-side-arrow--left"
            onClick={() => scroll("prev")}
            aria-label="Sola kaydır"
          >
            <ChevronLeft size={26} />
          </button>
        )}

        <div
          className={`gc-wrapper ${isDragging ? "is-dragging" : ""}`}
          ref={wrapperRef}
          onMouseDown={onMouseDown}
          onMouseMove={onMouseMove}
          onMouseUp={onMouseUp}
          onMouseLeave={onMouseUp}
        >
          <div className="gc-track">
            {games.map((game) => (
              <div key={game.id} className="gc-item">
                <Link
                  className="gc-card__link"
                  to={game.path}
                  aria-label={`${game.name} oyununu aç`}
                  onClick={onCardClick}
                >
                  <div className="gc-card">
                    <OptimizedImage
                      src={game.image}
                      alt={game.name}
                      className="gc-card__image"
                    />
                    <div className="gc-card__overlay">
                      <div className="gc-card__details">
                        <span className="gc-card__tag">{game.tag}</span>
                        <h4 className="gc-card__name">{game.name}</h4>
                        <p className="gc-card__desc">{game.description}</p>
                        <span className="gc-card__badge">OYNA</span>
                      </div>
                    </div>
                  </div>
                </Link>
              </div>
            ))}
          </div>
        </div>

        {canScrollRight && (
          <button
            type="button"
            className="gc-side-arrow gc-side-arrow--right"
            onClick={() => scroll("next")}
            aria-label="Sağa kaydır"
          >
            <ChevronRight size={26} />
          </button>
        )}
      </div>
    </div>
  );
}

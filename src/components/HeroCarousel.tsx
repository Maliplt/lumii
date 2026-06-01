import { useState } from 'react'
import { Carousel, Button } from 'rsuite'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { getImageUrl } from '../services/tmdb'
import type { Movie } from '../types/types'

interface HeroCarouselProps {
  movies: Movie[]
}

export default function HeroCarousel({ movies }: HeroCarouselProps) {
  const navigate = useNavigate()
  const [activeIndex, setActiveIndex] = useState(0)

  const handlePrev = () => {
    setActiveIndex((prev) => (prev === 0 ? movies.length - 1 : prev - 1))
  }

  const handleNext = () => {
    setActiveIndex((prev) => (prev === movies.length - 1 ? 0 : prev + 1))
  }

  return (
    <div className="hero-carousel-wrapper" style={{ position: 'relative' }}>
      <Carousel 
        placement="bottom" 
        shape="dot" 
        activeIndex={activeIndex}
        onSelect={(index) => setActiveIndex(index)}
        style={{ height: '80vh' }}
      >
        {movies.map((movie) => (
          <div key={movie.id} className="hero-slide">
            <img
              src={getImageUrl(movie.backdrop_path, 'original')}
              alt={movie.title}
              loading="lazy"
            />
            <div className="hero-overlay" />
            <div className="hero-info">
              <h1>{movie.title}</h1>
              <p className="hero-meta">{movie.release_date?.slice(0, 4)}</p>
              <p className="hero-overview">
                {movie.overview?.slice(0, 180)}{(movie.overview?.length ?? 0) > 180 ? '…' : ''}
              </p>
              <Button className="btn-play" size="lg" onClick={() => navigate('/play')}>
                <span className="play-icon">▶</span> Oynat
              </Button>
            </div>
          </div>
        ))}
      </Carousel>

      {/* Chevron Navigation Buttons */}
      <button className="hero-nav-btn prev" onClick={handlePrev} aria-label="Previous Slide">
        <ChevronLeft size={36} />
      </button>
      <button className="hero-nav-btn next" onClick={handleNext} aria-label="Next Slide">
        <ChevronRight size={36} />
      </button>

      {/* Smooth Bottom Fade Overlay */}
      <div className="hero-bottom-fade" />
    </div>
  )
}

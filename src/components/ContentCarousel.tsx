import { memo, useRef, useState, useMemo, useEffect } from 'react'
import { Carousel } from 'rsuite'
import { Link, useNavigate } from 'react-router-dom'
import { animate, stagger } from 'animejs'
import { ChevronLeft, ChevronRight, Play, Plus, ThumbsUp, ChevronDown } from 'lucide-react'
import { getImageUrl } from '../services/tmdb'
import { useVisibleCount } from '../hooks/useVisibleCount'
import { useSwipe } from '../hooks/useSwipe'
import type { Movie, TVShow } from '../types/types'

const HOVER_EXPAND_DELAY = 500

interface ContentCarouselProps {
  type: 'movie' | 'tv'
  title: string
  items: Movie[] | TVShow[]
}

const ItemCard = memo(function ItemCard({ item, type }: { item: Movie | TVShow; type: 'movie' | 'tv' }) {
  const ref = useRef<HTMLDivElement>(null)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const expanded = useRef(false)
  const [showTitle, setShowTitle] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    if (!showTitle) return
    const buttons = ref.current?.querySelectorAll('.cc-item__action-btn')
    if (!buttons || buttons.length === 0) return
    animate(buttons, {
      opacity: [0, 1],
      scale: [0.5, 1],
      translateY: [8, 0],
      duration: 420,
      delay: stagger(60),
      ease: 'outBack',
    })
  }, [showTitle])

  const name = (item as Movie).title ?? (item as TVShow).name
  const year = ((item as Movie).release_date || (item as TVShow).first_air_date)?.slice(0, 4) ?? ''
  const rating = item.vote_average ? item.vote_average.toFixed(1) : 'N/A'
  const overviewSnippet = item.overview || ''

  const doExpand = () => {
    expanded.current = true
    setShowTitle(true)
    if (ref.current) animate(ref.current, { flexGrow: 2, duration: 380, ease: 'outQuart' })
  }

  const doCollapse = () => {
    expanded.current = false
    setShowTitle(false)
    if (ref.current) animate(ref.current, { flexGrow: 1, duration: 260, ease: 'outQuart' })
  }

  const onEnter = () => {
    if (window.matchMedia('(hover: none)').matches) return
    timer.current = setTimeout(doExpand, HOVER_EXPAND_DELAY)
  }
  const onLeave = () => {
    if (timer.current) { clearTimeout(timer.current); timer.current = null }
    if (expanded.current) doCollapse()
  }

  return (
    <div
      ref={ref}
      className="cc-item"
      style={{ flexGrow: 1 }}
      onMouseEnter={onEnter}
      onMouseLeave={onLeave}
    >
      <Link className="cc-item__link" to={`/${type}/${item.id}`}>
        <img
          className="cc-item__poster"
          src={getImageUrl(item.poster_path, 'w300')}
          alt={name}
          loading="lazy"
        />
      </Link>
      <div className={`cc-item__overlay ${showTitle ? 'active' : ''}`}>
        <div className="cc-item__details">
          <div className="cc-item__actions-row">
            <div className="cc-item__actions-left">
              <button className="cc-item__action-btn play" type="button" onClick={() => navigate(`/${type}/${item.id}`)}>
                <Play size={12} fill="currentColor" />
              </button>
              <button className="cc-item__action-btn outline" type="button" aria-label="Listeye ekle">
                <Plus size={12} />
              </button>
              <button className="cc-item__action-btn outline" type="button" aria-label="Begen">
                <ThumbsUp size={12} />
              </button>
            </div>
            <button className="cc-item__action-btn outline detail-trigger" type="button" aria-label="Detaylar">
              <ChevronDown size={12} />
            </button>
          </div>
          <h4 className="cc-item__name">{name}</h4>
          <div className="cc-item__meta">
            <span className="cc-item__year">{year}</span>
            <span className="cc-item__divider">•</span>
            <span className="cc-item__rating">{rating} Puan</span>
          </div>
          {overviewSnippet && (
            <div className="cc-item__overview-container">
              <p className="cc-item__overview">{overviewSnippet}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
})

export default function ContentCarousel({ type, title, items }: ContentCarouselProps) {
  const [activeIndex, setActiveIndex] = useState(0)
  const visible = useVisibleCount()

  const slides = useMemo(() => {
    const result: Array<(Movie | TVShow)[]> = []
    for (let i = 0; i < items.length; i += visible) {
      result.push(items.slice(i, i + visible) as (Movie | TVShow)[])
    }
    return result
  }, [items, visible])

  // aktif index
  const currentIndex = slides.length > 0 ? Math.min(activeIndex, slides.length - 1) : 0

  const handlePrev = () => {
    setActiveIndex((prev) => (prev === 0 ? slides.length - 1 : prev - 1))
  }

  const handleNext = () => {
    setActiveIndex((prev) => (prev === slides.length - 1 ? 0 : prev + 1))
  }

  const swipe = useSwipe(handleNext, handlePrev)

  if (slides.length === 0) return null

  return (
    <div className="content-carousel">
      <div className="cc-header">
        <div className="cc-header__left">
          <h3 className="cc-header__title">{title}</h3>
        </div>
        {slides.length > 1 && (
          <div className="cc-header__indicators">
            {slides.map((_, index) => (
              <span
                key={index}
                role="button"
                tabIndex={0}
                className={`cc-indicator-dot ${index === currentIndex ? 'active' : ''}`}
                aria-label={`Slayt ${index + 1}`}
                aria-current={index === currentIndex ? true : undefined}
                onClick={() => setActiveIndex(index)}
                onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && setActiveIndex(index)}
              />
            ))}
          </div>
        )}
      </div>

      <div className="cc-carousel-wrapper" {...swipe}>
        {slides.length > 1 && currentIndex > 0 && (
          <button className="cc-nav-arrow prev" onClick={handlePrev} aria-label="Önceki slayt">
            <ChevronLeft size={30} />
          </button>
        )}

        {slides.length > 1 && currentIndex < slides.length - 1 && (
          <button className="cc-nav-arrow next" onClick={handleNext} aria-label="Sonraki slayt">
            <ChevronRight size={30} />
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
            </div>
          ))}
        </Carousel>
      </div>
    </div>
  )
}

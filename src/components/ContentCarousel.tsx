import { useRef, useState } from 'react'
import { Carousel } from 'rsuite'
import { Link } from 'react-router-dom'
import { animate } from 'animejs'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { getImageUrl } from '../services/tmdb'
import type { Movie, TVShow } from '../types/types'

interface ContentCarouselProps {
  type: 'movie' | 'tv'
  title: string
  items: Movie[] | TVShow[]
}

const VISIBLE = 6
const CAROUSEL_H = '25vw'

function ItemCard({ item, type }: { item: Movie | TVShow; type: 'movie' | 'tv' }) {
  const ref = useRef<HTMLDivElement>(null)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const expanded = useRef(false)
  const [showTitle, setShowTitle] = useState(false)
  const name = (item as Movie).title ?? (item as TVShow).name

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

  const onEnter = () => { timer.current = setTimeout(doExpand, 500) }
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
      <Link to={`/${type}/${item.id}`} style={{ display: 'block' }}>
        <img
          src={getImageUrl(item.poster_path, 'w300')}
          alt={name}
          loading="lazy"
        />
      </Link>
      <div className="cc-item__title" style={{ opacity: showTitle ? 1 : 0 }}>
        {name}
      </div>
    </div>
  )
}

export default function ContentCarousel({ type, title, items }: ContentCarouselProps) {
  const [activeIndex, setActiveIndex] = useState(0)
  const slides: Array<(Movie | TVShow)[]> = []
  for (let i = 0; i < items.length; i += VISIBLE) {
    slides.push(items.slice(i, i + VISIBLE) as (Movie | TVShow)[])
  }

  const handlePrev = () => {
    setActiveIndex((prev) => (prev === 0 ? slides.length - 1 : prev - 1))
  }

  const handleNext = () => {
    setActiveIndex((prev) => (prev === slides.length - 1 ? 0 : prev + 1))
  }

  if (slides.length === 0) return null

  return (
    <div className="content-carousel">
      <div className="cc-header">
        <div className="cc-header__left">
          <h3>{title}</h3>
        </div>
        {slides.length > 1 && (
          <div className="cc-header__nav">
            <button className="cc-nav-btn" onClick={handlePrev} aria-label="Previous items">
              <ChevronLeft size={18} />
            </button>
            <button className="cc-nav-btn" onClick={handleNext} aria-label="Next items">
              <ChevronRight size={18} />
            </button>
          </div>
        )}
      </div>

      <Carousel
        placement="bottom"
        style={{ height: CAROUSEL_H }}
        activeIndex={activeIndex}
        onSelect={(index) => setActiveIndex(index)}
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
  )
}

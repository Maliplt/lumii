import { useState, useEffect, useRef } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Search, X } from 'lucide-react'
import { animate } from 'animejs'

// debounce
function useDebouncedValue<T>(value: T, delay = 400): T {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(id)
  }, [value, delay])
  return debounced
}

// acilis genisligi
function targetWidth(): string {
  const w = document.documentElement.clientWidth
  return w <= 768 ? `${w - 16}px` : '520px'
}

interface SearchBarProps {
  open: boolean
  onClose: () => void
}

export default function SearchBar({ open, onClose }: SearchBarProps) {
  const location = useLocation()
  const navigate = useNavigate()
  const wrapperRef = useRef<HTMLDivElement>(null)

  const initial = location.pathname === '/search'
    ? (new URLSearchParams(location.search).get('q') ?? '')
    : ''
  const [query, setQuery] = useState(initial)
  const debounced = useDebouncedValue(query.trim(), 400)

  // arama navigasyonu
  const lastSent = useRef(initial)
  useEffect(() => {
    if (debounced === lastSent.current) return
    lastSent.current = debounced
    if (debounced) {
      navigate(`/search?q=${encodeURIComponent(debounced)}`, {
        replace: location.pathname === '/search',
      })
    } else if (location.pathname === '/search') {
      navigate('/search', { replace: true })
    }
  }, [debounced, location.pathname, navigate])

  // acilis animasyonu
  useEffect(() => {
    if (open && wrapperRef.current) {
      animate(wrapperRef.current, {
        width: ['0px', targetWidth()],
        opacity: [0, 1],
        duration: 450,
        easing: 'easeOutQuart',
      })
    }
  }, [open])

  const handleClose = () => {
    if (wrapperRef.current) {
      animate(wrapperRef.current, {
        width: [targetWidth(), '0px'],
        opacity: [1, 0],
        duration: 300,
        easing: 'easeInQuart',
        complete: () => { setQuery(''); onClose() },
      })
    } else {
      setQuery('')
      onClose()
    }
  }

  const handleSubmit = () => {
    const q = query.trim()
    if (q) navigate(`/search?q=${encodeURIComponent(q)}`)
  }

  if (!open) return null

  return (
    <div
      ref={wrapperRef}
      className="animated-search-container centered-search"
      style={{ overflow: 'hidden', width: '0px', opacity: 0 }}
    >
      <Search size={18} className="search-accent-icon" />
      <input
        type="text"
        placeholder="Film veya dizi arayın..."
        className="search-animated-input"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={(e) => { if (e.key === 'Enter') handleSubmit() }}
        autoFocus
      />
      <button className="search-animated-close" onClick={handleClose} aria-label="Aramayı kapat">
        <X size={18} />
      </button>
    </div>
  )
}

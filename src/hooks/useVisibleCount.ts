import { useState, useEffect } from 'react'

// kart sayisi
function calcCount(width: number): number {
  if (width <= 480) return 2
  if (width <= 768) return 3
  if (width <= 1024) return 4
  return 6
}

export function useVisibleCount(): number {
  // state
  const [count, setCount] = useState(() => calcCount(window.innerWidth))

  // resize
  useEffect(() => {
    const handler = () => setCount(calcCount(window.innerWidth))
    window.addEventListener('resize', handler)
    return () => window.removeEventListener('resize', handler)
  }, [])

  return count
}

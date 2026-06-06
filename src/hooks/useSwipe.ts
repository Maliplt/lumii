import { useRef } from 'react'

const SWIPE_THRESHOLD = 50

export function useSwipe(onLeft: () => void, onRight: () => void) {
  // baslangic
  const startX = useRef<number | null>(null)

  return {
    // dokunma
    onTouchStart: (e: React.TouchEvent) => {
      startX.current = e.touches[0]?.clientX ?? null
    },
    // yon
    onTouchEnd: (e: React.TouchEvent) => {
      if (startX.current === null) return
      const dx = (e.changedTouches[0]?.clientX ?? 0) - startX.current
      startX.current = null
      if (Math.abs(dx) <= SWIPE_THRESHOLD) return
      if (dx < 0) onLeft()
      else onRight()
    },
  }
}

import { useState, useEffect, useRef, type TouchEvent } from 'react'

// veri cekme
export function useFetch<T>(fetcher: () => Promise<T>, key: string | number = 0) {
  const fetcherRef = useRef(fetcher)
  useEffect(() => { fetcherRef.current = fetcher })

  const [result, setResult] = useState<{ key: string | number; data: T | null; error: boolean } | null>(null)

  useEffect(() => {
    let cancelled = false
    fetcherRef.current()
      .then((data) => { if (!cancelled) setResult({ key, data, error: false }) })
      .catch(() => { if (!cancelled) setResult({ key, data: null, error: true }) })
    return () => { cancelled = true }
  }, [key])

  const ready = result !== null && result.key === key
  return {
    data: ready ? result.data : null,
    loading: !ready,
    error: ready ? result.error : false,
  }
}

const SWIPE_THRESHOLD = 50

// sag/sol kaydirma
export function useSwipe(onLeft: () => void, onRight: () => void) {
  const startX = useRef<number | null>(null)

  return {
    onTouchStart: (e: TouchEvent) => {
      startX.current = e.touches[0]?.clientX ?? null
    },
    onTouchEnd: (e: TouchEvent) => {
      if (startX.current === null) return
      const dx = (e.changedTouches[0]?.clientX ?? 0) - startX.current
      startX.current = null
      if (Math.abs(dx) <= SWIPE_THRESHOLD) return
      if (dx < 0) onLeft()
      else onRight()
    },
  }
}

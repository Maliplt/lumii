import { useState, useEffect, useRef, type TouchEvent } from 'react'
import { Play, Zap, Crown } from 'lucide-react'
import a1 from './images/avatars/a1.svg'
import a2 from './images/avatars/a2.svg'
import a3 from './images/avatars/a3.svg'
import a4 from './images/avatars/a4.svg'
import type { PackageDef } from './types/types'

// profil resimleri
export const AVATARS: Record<string, string> = { a1, a2, a3, a4 }

// paketler
export const PACKAGES: PackageDef[] = [
  {
    id: 'free',
    name: 'Ücretsiz',
    price: '₺0',
    period: '',
    Icon: Play,
    badge: null,
    accent: false,
    free: true,
    features: [
      'SD Kalite (480p)',
      'Reklamlı İzleme',
      'Sınırlı Film & Dizi',
      '1 Cihaz',
      'Temel Oyunlar',
    ],
    cta: 'Ücretsiz Başla',
  },
  {
    id: 'standard',
    name: 'Standart',
    price: '₺49',
    period: '/ay',
    Icon: Zap,
    badge: 'En Popüler',
    accent: false,
    free: false,
    features: [
      'Full HD Kalite (1080p)',
      'Reklamsız İzleme',
      'Tüm Film & Diziler',
      '2 Cihaz',
      'Tüm Oyunlar',
    ],
    cta: 'Başla',
  },
  {
    id: 'premium',
    name: 'Premium',
    price: '₺79',
    period: '/ay',
    Icon: Crown,
    badge: null,
    accent: true,
    free: false,
    features: [
      '4K Ultra HD',
      'Reklamsız İzleme',
      'Tüm İçerikler + Özel Yapımlar',
      '4 Cihaz + İndirme',
      'Öncelikli Destek',
    ],
    cta: 'Başla',
  },
]

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

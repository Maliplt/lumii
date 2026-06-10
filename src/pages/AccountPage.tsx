import { useState, useEffect, useRef, type RefObject } from 'react'
import { useNavigate } from 'react-router-dom'
import { Sidenav, Nav } from 'rsuite'
import { User, Bookmark, ThumbsUp, History } from 'lucide-react'
import PageLayout from '../components/PageLayout'
import MediaCard from '../components/MediaCard'
import { useAppSelector, type SavedItem } from '../store/store'

const SECTIONS = [
  { key: 'profil', label: 'Hesap Bilgileri', Icon: User },
  { key: 'watchlist', label: 'İzleme Listem', Icon: Bookmark },
  { key: 'liked', label: 'Beğendiklerim', Icon: ThumbsUp },
  { key: 'history', label: 'İzleme Geçmişi', Icon: History },
] as const

function MediaGrid({ items, empty }: { items: SavedItem[]; empty: string }) {
  if (items.length === 0) return <p className="account-empty">{empty}</p>
  return (
    <div className="search-grid">
      {items.map((it) => (
        <MediaCard key={`${it.media_type}-${it.id}`} item={it} type={it.media_type} />
      ))}
    </div>
  )
}

export default function AccountPage() {
  const navigate = useNavigate()

  // redux
  const currentUser = useAppSelector((s) => s.auth.currentUser)
  const { watchlist, liked, history } = useAppSelector((s) => s.library)

  const [active, setActive] = useState('profil')

  const profilRef = useRef<HTMLDivElement>(null)
  const watchlistRef = useRef<HTMLElement>(null)
  const likedRef = useRef<HTMLElement>(null)
  const historyRef = useRef<HTMLElement>(null)

  // korumali sayfa
  useEffect(() => {
    if (!currentUser) navigate('/login')
  }, [currentUser, navigate])

  // aktif bolum takibi
  useEffect(() => {
    const refs: [string, RefObject<HTMLElement | HTMLDivElement | null>][] = [
      ['profil', profilRef],
      ['watchlist', watchlistRef],
      ['liked', likedRef],
      ['history', historyRef],
    ]
    const onScroll = () => {
      let current = 'profil'
      for (const [key, ref] of refs) {
        const el = ref.current
        if (el && el.getBoundingClientRect().top <= 150) current = key
      }
      // dibe gelindiyse son bolum
      if (window.innerHeight + window.scrollY >= document.body.scrollHeight - 10) {
        current = refs[refs.length - 1][0]
      }
      setActive(current)
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  if (!currentUser) return null

  const refMap: Record<string, RefObject<HTMLElement | HTMLDivElement | null>> = {
    profil: profilRef,
    watchlist: watchlistRef,
    liked: likedRef,
    history: historyRef,
  }

  const scrollTo = (key: string) => {
    refMap[key]?.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <PageLayout className="account-page" mainClassName="account-main">
      <div className="account-layout">
        <Sidenav className="account-sidenav" appearance="subtle">
          <Sidenav.Body>
            <Nav activeKey={active} onSelect={(key) => key && scrollTo(key as string)}>
              {SECTIONS.map(({ key, label, Icon }) => (
                <Nav.Item key={key} eventKey={key}><Icon size={16} /> {label}</Nav.Item>
              ))}
            </Nav>
          </Sidenav.Body>
        </Sidenav>

        <div className="account-content">
          <div className="account-profile" ref={profilRef}>
            <h2>Hesap Bilgileri</h2>
            <div className="account-profile__row">
              <div className="account-avatar-lg">{currentUser.name.charAt(0).toUpperCase()}</div>
              <div className="account-profile__info">
                <div className="account-info-row"><span>Ad</span><strong>{currentUser.name}</strong></div>
                <div className="account-info-row"><span>E-posta</span><strong>{currentUser.email}</strong></div>
              </div>
            </div>
          </div>

          <section className="account-section" ref={watchlistRef}>
            <h2>İzleme Listem</h2>
            <MediaGrid items={watchlist} empty="İzleme listen henüz boş." />
          </section>

          <section className="account-section" ref={likedRef}>
            <h2>Beğendiklerim</h2>
            <MediaGrid items={liked} empty="Henüz beğendiğin bir içerik yok." />
          </section>

          <section className="account-section" ref={historyRef}>
            <h2>İzleme Geçmişi</h2>
            <MediaGrid items={history} empty="İzleme geçmişin henüz boş." />
          </section>
        </div>
      </div>
    </PageLayout>
  )
}

import { useState, useEffect, useRef, type RefObject } from 'react'
import { useNavigate } from 'react-router-dom'
import { Sidenav, Nav, Button, Toggle, Modal } from 'rsuite'
import { User, Crown, Settings, Bookmark, ThumbsUp, History, Check, Pencil, Receipt } from 'lucide-react'
import PageLayout from '../components/PageLayout'
import MediaCard from '../components/MediaCard'
import { useToast } from '../components/Toast'
import { AVATARS, PACKAGES } from '../helpers'
import {
  useAppSelector, useAppDispatch,
  toggleWatchlist, toggleLiked, logout, clearLibrary, setSetting, setAvatar,
  type SavedItem,
} from '../store/store'

const SECTIONS = [
  { key: 'profil', label: 'Hesap Bilgileri', Icon: User },
  { key: 'plan', label: 'Üyelik', Icon: Crown },
  { key: 'makbuz', label: 'Makbuzlarım', Icon: Receipt },
  { key: 'ayarlar', label: 'Ayarlar', Icon: Settings },
  { key: 'watchlist', label: 'İzleme Listem', Icon: Bookmark },
  { key: 'liked', label: 'Beğendiklerim', Icon: ThumbsUp },
  { key: 'history', label: 'İzleme Geçmişi', Icon: History },
] as const

const PLAN_FEATURES = ['SD Kalite (480p)', 'Reklamlı İzleme', '1 Cihaz', 'Temel Oyunlar']

const SETTING_ROWS = [
  { key: 'autoplay', label: 'Otomatik Oynatma', desc: 'Oynatıcı açılınca video kendiliğinden başlasın.' },
  { key: 'continueRow', label: '"İzlemeye Devam Et" Satırı', desc: 'Yarım kalan içerikleri anasayfada göster.' },
] as const

function MediaGrid({ items, empty, onRemove }: { items: SavedItem[]; empty: string; onRemove?: (it: SavedItem) => void }) {
  if (items.length === 0) return <p className="account-empty">{empty}</p>
  return (
    <div className="search-grid">
      {items.map((it) => (
        <MediaCard
          key={`${it.media_type}-${it.id}`}
          item={it}
          type={it.media_type}
          onRemove={onRemove ? () => onRemove(it) : undefined}
        />
      ))}
    </div>
  )
}

export default function AccountPage() {
  const navigate = useNavigate()
  const toast = useToast()

  // redux
  const dispatch = useAppDispatch()
  const currentUser = useAppSelector((s) => s.auth.currentUser)
  const { watchlist, liked, history } = useAppSelector((s) => s.library)
  const settings = useAppSelector((s) => s.settings)
  const receipt = useAppSelector((s) => s.auth.receipt)

  const [active, setActive] = useState('profil')
  const [avatarModal, setAvatarModal] = useState(false)

  const profilRef = useRef<HTMLDivElement>(null)
  const planRef = useRef<HTMLElement>(null)
  const makbuzRef = useRef<HTMLElement>(null)
  const ayarlarRef = useRef<HTMLElement>(null)
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
      ['plan', planRef],
      ['makbuz', makbuzRef],
      ['ayarlar', ayarlarRef],
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
    plan: planRef,
    makbuz: makbuzRef,
    ayarlar: ayarlarRef,
    watchlist: watchlistRef,
    liked: likedRef,
    history: historyRef,
  }

  const scrollTo = (key: string) => {
    refMap[key]?.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const removeWatchlist = (it: SavedItem) => {
    dispatch(toggleWatchlist(it))
    toast('İzleme listesinden çıkarıldı.')
  }

  const removeLiked = (it: SavedItem) => {
    dispatch(toggleLiked(it))
    toast('Beğeni geri alındı.')
  }

  const handlePassword = () => {
    toast(`Sıfırlama bağlantısı ${currentUser.email} adresine gönderildi.`, 'info')
  }

  const handleLogout = () => {
    dispatch(logout())
    dispatch(clearLibrary())
    toast('Çıkış yapıldı.', 'info')
    navigate('/')
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
              <div className="account-avatar-wrap">
                <div className="account-avatar-lg">
                  {currentUser.avatar
                    ? <img src={AVATARS[currentUser.avatar]} alt="" />
                    : currentUser.name.charAt(0).toUpperCase()}
                </div>
                <button type="button" className="account-avatar-edit" aria-label="Profil resmini değiştir" onClick={() => setAvatarModal(true)}>
                  <Pencil size={13} />
                </button>
              </div>
              <div className="account-profile__info">
                <div className="account-info-row"><span>Ad</span><strong>{currentUser.name}</strong></div>
                <div className="account-info-row"><span>E-posta</span><strong>{currentUser.email}</strong></div>
                {currentUser.createdAt && (
                  <div className="account-info-row"><span>Üyelik</span><strong>{currentUser.createdAt}</strong></div>
                )}
              </div>
              <div className="account-profile__actions">
                <Button appearance="ghost" size="sm" onClick={handlePassword}>Şifre Değiştir</Button>
                <Button appearance="subtle" size="sm" className="account-logout-btn" onClick={handleLogout}>Çıkış Yap</Button>
              </div>
            </div>

            <Modal open={avatarModal} onClose={() => setAvatarModal(false)} size="xs" className="avatar-modal">
              <Modal.Header><Modal.Title>Profil Resmi Seç</Modal.Title></Modal.Header>
              <Modal.Body>
                <div className="avatar-picker__list">
                  {Object.entries(AVATARS).map(([id, src]) => (
                    <button
                      key={id}
                      type="button"
                      className={`avatar-picker__item${currentUser.avatar === id ? ' active' : ''}`}
                      onClick={() => { dispatch(setAvatar(id)); setAvatarModal(false); toast('Profil resmi güncellendi.') }}
                      aria-label={`Avatar ${id}`}
                    >
                      <img src={src} alt="" />
                    </button>
                  ))}
                </div>
              </Modal.Body>
            </Modal>
          </div>

          <section className="account-section" ref={planRef}>
            <h2>Üyelik</h2>
            <div className="account-plan">
              <div className="account-plan__info">
                <span className="account-plan__badge">
                  {PACKAGES.find((p) => p.id === currentUser.plan)?.name ?? 'Ücretsiz'} Plan
                </span>
                <ul>
                  {(PACKAGES.find((p) => p.id === currentUser.plan)?.features ?? PLAN_FEATURES).map((f) => (
                    <li key={f}><Check size={14} /> {f}</li>
                  ))}
                </ul>
              </div>
              <div className="account-plan__cta">
                {currentUser.plan
                  ? <p>Planın aktif, iyi seyirler!</p>
                  : <p>Reklamsız ve 4K izlemek için planını yükselt.</p>}
                <Button appearance="primary" onClick={() => navigate('/packages')}>Paketleri Gör</Button>
              </div>
            </div>
          </section>

          <section className="account-section" ref={makbuzRef}>
            <h2>Makbuzlarım</h2>
            {receipt ? (
              <div className="account-receipt">
                <div className="account-receipt__header">
                  <span className="account-receipt__badge">Ödeme Makbuzu</span>
                  <span className="account-receipt__date">{receipt.date}</span>
                </div>
                <div className="account-receipt__body">
                  <div className="account-receipt__row">
                    <span>Plan</span>
                    <strong>{receipt.planName}</strong>
                  </div>
                  <div className="account-receipt__row">
                    <span>Tutar</span>
                    <strong className="account-receipt__amount">{receipt.amount}{receipt.period}</strong>
                  </div>
                  <div className="account-receipt__row">
                    <span>Hesap</span>
                    <strong>{receipt.email}</strong>
                  </div>
                  <div className="account-receipt__row">
                    <span>Durum</span>
                    <strong className="account-receipt__status"><Check size={13} /> Ödendi</strong>
                  </div>
                </div>
              </div>
            ) : (
              <p className="account-empty">Henüz bir ödeme makbuzun yok.</p>
            )}
          </section>

          <section className="account-section" ref={ayarlarRef}>
            <h2>Ayarlar</h2>
            <div className="account-settings">
              {SETTING_ROWS.map(({ key, label, desc }) => (
                <div key={key} className="account-setting-row">
                  <div>
                    <strong>{label}</strong>
                    <p>{desc}</p>
                  </div>
                  <Toggle
                    checked={settings[key]}
                    onChange={(value) => dispatch(setSetting({ key, value }))}
                    aria-label={label}
                  />
                </div>
              ))}
            </div>
          </section>

          <section className="account-section" ref={watchlistRef}>
            <h2>İzleme Listem {watchlist.length > 0 && <em>({watchlist.length})</em>}</h2>
            <MediaGrid items={watchlist} empty="İzleme listen henüz boş." onRemove={removeWatchlist} />
          </section>

          <section className="account-section" ref={likedRef}>
            <h2>Beğendiklerim {liked.length > 0 && <em>({liked.length})</em>}</h2>
            <MediaGrid items={liked} empty="Henüz beğendiğin bir içerik yok." onRemove={removeLiked} />
          </section>

          <section className="account-section" ref={historyRef}>
            <h2>İzleme Geçmişi {history.length > 0 && <em>({history.length})</em>}</h2>
            <MediaGrid items={history} empty="İzleme geçmişin henüz boş." />
          </section>
        </div>
      </div>
    </PageLayout>
  )
}

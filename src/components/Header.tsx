import { useState, useEffect, useRef } from 'react'
import { Navbar, Nav, Button, Stack } from 'rsuite'
import { Search, Home, Film, Tv, Crown, X, Menu, User, LogOut, ChevronDown } from 'lucide-react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import Logo from './Logo'
import SearchBar from './SearchBar'
import { useToast } from './Toast'
import { AVATARS } from '../helpers'
import { useAppSelector, useAppDispatch, logout, clearLibrary } from '../store/store'

const NAV_LINKS = [
  { to: '/', label: 'Anasayfa', icon: Home },
  { to: '/explore', label: 'Seç İzle', icon: Film },
  { to: '/tv', label: 'TV İzle', icon: Tv },
]

export default function Header() {
  const location = useLocation()
  const navigate = useNavigate()
  // redux
  const dispatch = useAppDispatch()
  const currentUser = useAppSelector((s) => s.auth.currentUser)

  const hasQuery = location.pathname === '/search'
    && !!new URLSearchParams(location.search).get('q')
  const [showSearch, setShowSearch] = useState(hasQuery)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [accountMenuOpen, setAccountMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const accountMenuRef = useRef<HTMLDivElement>(null)

  const toast = useToast()

  // disari tiklayinca veya esc ile kapat
  useEffect(() => {
    if (!accountMenuOpen) return
    const onDown = (e: MouseEvent) => {
      if (accountMenuRef.current && !accountMenuRef.current.contains(e.target as Node)) setAccountMenuOpen(false)
    }
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape')  setAccountMenuOpen(false) }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [accountMenuOpen])

  const handleLogout = () => {
    dispatch(logout())
    dispatch(clearLibrary())
    setMobileMenuOpen(false)
    setAccountMenuOpen(false)
    toast('Çıkış yapıldı.', 'info')
    navigate('/')
  }

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 30)
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <>
      <Navbar className={`custom-header${scrolled ? ' scrolled' : ''}${accountMenuOpen ? ' menu-open' : ''}`}>
        <Navbar.Content className="header-left">
          <Navbar.Brand as={Link} to="/" className="header-brand-link">
            <Logo />
          </Navbar.Brand>
          <Nav activeKey={location.pathname} className="header-main-nav">
            {NAV_LINKS.map(({ to, label, icon: Icon }) => (
              <Nav.Item key={to} as={Link} to={to} eventKey={to} className="nav-link">
                <Stack spacing={8}>
                  <Icon size={18} />
                  <span>{label}</span>
                </Stack>
              </Nav.Item>
            ))}
          </Nav>
        </Navbar.Content>

        <SearchBar open={showSearch} onClose={() => setShowSearch(false)} />

        <Navbar.Content className="header-right">
          <div className="header-desktop-actions">
            {!showSearch && (
              <Button appearance="subtle" onClick={() => setShowSearch(true)} className="search-btn">
                <Search size={22} />
              </Button>
            )}
            {!currentUser?.plan && (
              <Button appearance="primary" className="paket-btn" onClick={() => navigate('/packages')}>
                <Stack spacing={8}>
                  <span>Paket Al</span>
                  <Crown size={18} />
                </Stack>
              </Button>
            )}
            {currentUser ? (
              <div className="account-menu" ref={accountMenuRef}>
                <button
                  type="button"
                  className="account-trigger"
                  aria-expanded={accountMenuOpen}
                  aria-label="Hesap"
                  onClick={() => setAccountMenuOpen((p) => !p)}
                >
                  <span className="account-avatar">
                    {currentUser.avatar
                      ? <img src={AVATARS[currentUser.avatar]} alt="" />
                      : currentUser.name.charAt(0).toUpperCase()}
                  </span>
                  <span className="account-trigger__name">{currentUser.name}</span>
                  <ChevronDown size={15} className="account-trigger__caret" />
                </button>

                {accountMenuOpen && (
                  <div className="account-menu__panel">
                    <button
                      type="button"
                      className="account-menu__head"
                      onClick={() => { setAccountMenuOpen(false); navigate('/account') }}
                    >
                      <strong>{currentUser.name}</strong>
                      <span>{currentUser.email}</span>
                      <em>Hesabı Yönet</em>
                    </button>
                    <div className="account-menu__divider" />
                    <button type="button" className="account-menu__logout" onClick={handleLogout}>
                      Çıkış Yap <LogOut size={16} />
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Button appearance="ghost" className="giris-btn" onClick={() => navigate('/login')}>
                Giriş Yap
              </Button>
            )}
          </div>

          <div className="header-mobile-actions">
            <Button appearance="subtle" className="search-btn" onClick={() => setShowSearch((p) => !p)}>
              <Search size={22} />
            </Button>
            <button
              className="mobile-menu-btn"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Menüyü aç/kapat"
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </Navbar.Content>
      </Navbar>

      {mobileMenuOpen && (
        <div className="mobile-nav-overlay" onClick={() => setMobileMenuOpen(false)}>
          <nav className="mobile-nav-panel" onClick={(e) => e.stopPropagation()}>
            {NAV_LINKS.map(({ to, label, icon: Icon }) => (
              <Link
                key={to}
                to={to}
                className={`mobile-nav-link${location.pathname === to ? ' active' : ''}`}
                onClick={() => setMobileMenuOpen(false)}
              >
                <Icon size={20} />
                <span>{label}</span>
              </Link>
            ))}
            <div className="mobile-nav-divider" />
            <div className="mobile-nav-cta">
              {!currentUser?.plan && (
                <Button
                  appearance="primary"
                  className="paket-btn"
                  block
                  onClick={() => { navigate('/packages'); setMobileMenuOpen(false) }}
                >
                  <Stack spacing={8}><span>Paket Al</span><Crown size={18} /></Stack>
                </Button>
              )}
              {currentUser ? (
                <>
                  <Button
                    appearance="ghost"
                    className="giris-btn"
                    block
                    onClick={() => { navigate('/account'); setMobileMenuOpen(false) }}
                  >
                    <Stack spacing={8}><User size={18} /><span>Hesabım</span></Stack>
                  </Button>
                  <Button appearance="subtle" className="cikis-btn" block onClick={handleLogout}>
                    <Stack spacing={8}><LogOut size={18} /><span>Çıkış Yap</span></Stack>
                  </Button>
                </>
              ) : (
                <Button
                  appearance="ghost"
                  className="giris-btn"
                  block
                  onClick={() => { navigate('/login'); setMobileMenuOpen(false) }}
                >
                  Giriş Yap
                </Button>
              )}
            </div>
          </nav>
        </div>
      )}
    </>
  )
}

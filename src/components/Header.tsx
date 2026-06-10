import { useState, useEffect } from 'react'
import { Navbar, Nav, Button, Stack, Dropdown } from 'rsuite'
import { Search, Home, Film, Tv, Crown, X, Menu, User, LogOut } from 'lucide-react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import Logo from './Logo'
import SearchBar from './SearchBar'
import { useToast } from './Toast'
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
  const [scrolled, setScrolled] = useState(false)

  const toast = useToast()

  const handleLogout = () => {
    dispatch(logout())
    dispatch(clearLibrary())
    setMobileMenuOpen(false)
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
      <Navbar className={`custom-header${scrolled ? ' scrolled' : ''}`}>
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
            <Button appearance="primary" className="paket-btn" onClick={() => navigate('/packages')}>
              <Stack spacing={8}>
                <span>Paket Al</span>
                <Crown size={18} />
              </Stack>
            </Button>
            {currentUser ? (
              <Dropdown
                className="account-dropdown"
                placement="bottomEnd"
                renderToggle={(props, ref) => (
                  <button {...props} ref={ref} className="account-avatar" aria-label="Hesap">
                    {currentUser.name.charAt(0).toUpperCase()}
                  </button>
                )}
              >
                <Dropdown.Item panel className="account-menu-head">
                  <strong>{currentUser.name}</strong>
                  <span>{currentUser.email}</span>
                </Dropdown.Item>
                <Dropdown.Separator />
                <Dropdown.Item onClick={() => navigate('/account')}><User size={16} /> Hesabım</Dropdown.Item>
                <Dropdown.Item className="account-menu-logout" onClick={handleLogout}><LogOut size={16} /> Çıkış Yap</Dropdown.Item>
              </Dropdown>
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
              <Button
                appearance="primary"
                className="paket-btn"
                block
                onClick={() => { navigate('/packages'); setMobileMenuOpen(false) }}
              >
                <Stack spacing={8}><span>Paket Al</span><Crown size={18} /></Stack>
              </Button>
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

import { useState, useRef, useEffect } from 'react'
import { Navbar, Nav, Button, Stack } from 'rsuite'
import { Search, Home, Film, Tv, Crown, X, Menu } from 'lucide-react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { animate } from 'animejs'

const NAV_LINKS = [
  { to: '/', label: 'Anasayfa', icon: Home },
  { to: '/explore', label: 'Seç İzle', icon: Film },
  { to: '/tv', label: 'TV İzle', icon: Tv },
]

export default function Header() {
  const location = useLocation()
  const navigate = useNavigate()
  const [showSearch, setShowSearch] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const searchWrapperRef = useRef<HTMLDivElement>(null)

  useEffect(() => { setMobileMenuOpen(false) }, [location.pathname])

  useEffect(() => {
    if (showSearch && searchWrapperRef.current) {
      const targetWidth = window.innerWidth <= 768
        ? `${window.innerWidth - 16}px`
        : '520px'
      animate(searchWrapperRef.current, {
        width: ['0px', targetWidth],
        opacity: [0, 1],
        duration: 450,
        easing: 'easeOutQuart',
      })
    }
  }, [showSearch])

  const handleCloseSearch = () => {
    if (searchWrapperRef.current) {
      const fromWidth = window.innerWidth <= 768
        ? `${window.innerWidth - 16}px`
        : '520px'
      animate(searchWrapperRef.current, {
        width: [fromWidth, '0px'],
        opacity: [1, 0],
        duration: 300,
        easing: 'easeInQuart',
        complete: () => setShowSearch(false),
      })
    } else {
      setShowSearch(false)
    }
  }

  return (
    <>
      <Navbar className="custom-header">
        <Navbar.Content className="header-left">
          <Navbar.Brand href="/" className="header-brand-link">
            MSmart
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

        {showSearch && (
          <div
            ref={searchWrapperRef}
            className="animated-search-container centered-search"
            style={{ overflow: 'hidden', width: '0px', opacity: 0 }}
          >
            <Search size={18} className="search-accent-icon" />
            <input
              type="text"
              placeholder="Aramak için yazın..."
              className="search-animated-input"
              autoFocus
            />
            <button className="search-animated-close" onClick={handleCloseSearch} aria-label="Aramayı kapat">
              <X size={18} />
            </button>
          </div>
        )}

        <Navbar.Content className="header-right">
          <div className="header-desktop-actions">
            {!showSearch && (
              <Button appearance="subtle" onClick={() => setShowSearch(true)} className="search-btn">
                <Search size={22} />
              </Button>
            )}
            <Button appearance="primary" className="paket-btn" onClick={() => navigate('/work-in-progress')}>
              <Stack spacing={8}>
                <span>Paket Al</span>
                <Crown size={18} />
              </Stack>
            </Button>
            <Button appearance="ghost" className="giris-btn" onClick={() => navigate('/work-in-progress')}>
              Giriş Yap
            </Button>
          </div>

          <div className="header-mobile-actions">
            <Button appearance="subtle" className="search-btn" onClick={() => setShowSearch(!showSearch)}>
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
                onClick={() => { navigate('/work-in-progress'); setMobileMenuOpen(false) }}
              >
                <Stack spacing={8}><span>Paket Al</span><Crown size={18} /></Stack>
              </Button>
              <Button
                appearance="ghost"
                className="giris-btn"
                block
                onClick={() => { navigate('/work-in-progress'); setMobileMenuOpen(false) }}
              >
                Giriş Yap
              </Button>
            </div>
          </nav>
        </div>
      )}
    </>
  )
}

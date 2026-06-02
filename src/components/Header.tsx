import { useState, useRef, useEffect } from 'react'
import { Navbar, Nav, Button, Stack } from 'rsuite'
import { Search, Home, Film, Tv, Crown, X } from 'lucide-react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { animate } from 'animejs'

const Brand = () => (
  <Navbar.Brand href="/" style={{ color: 'var(--accent)', fontWeight: 800, fontSize: '28px', background: 'transparent' }}>
    MSmart
  </Navbar.Brand>
)

export default function Header() {
  const location = useLocation()
  const navigate = useNavigate()
  const [showSearch, setShowSearch] = useState(false)
  const searchWrapperRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (showSearch && searchWrapperRef.current) {
      animate(searchWrapperRef.current, {
        width: ['0px', '520px'],
        opacity: [0, 1],
        duration: 450,
        easing: 'easeOutQuart'
      })
    }
  }, [showSearch])

  const handleCloseSearch = () => {
    if (searchWrapperRef.current) {
      animate(searchWrapperRef.current, {
        width: ['520px', '0px'],
        opacity: [1, 0],
        duration: 300,
        easing: 'easeInQuart',
        complete: () => setShowSearch(false)
      })
    } else {
      setShowSearch(false)
    }
  }

  return (
    <Navbar className="custom-header">
      <Navbar.Content showFrom="xs">
        <Brand />
        <Nav activeKey={location.pathname}>
          <Nav.Item as={Link} to="/" eventKey="/" className="nav-link">
            <Stack spacing={8}>
              <Home size={18} />
              <span>Anasayfa</span>
            </Stack>
          </Nav.Item>
          <Nav.Item as={Link} to="/explore" eventKey="/explore" className="nav-link">
            <Stack spacing={8}>
              <Film size={18} />
              <span>Seç İzle</span>
            </Stack>
          </Nav.Item>
          <Nav.Item as={Link} to="/tv" eventKey="/tv" className="nav-link">
            <Stack spacing={8}>
              <Tv size={18} />
              <span>TV İzle</span>
            </Stack>
          </Nav.Item>
        </Nav>
      </Navbar.Content>

      <Navbar.Content hideFrom="xs">
        <Navbar.Toggle />
        <Brand />
      </Navbar.Content>

      {/* Centered Search Overlay Container */}
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
          <button 
            className="search-animated-close" 
            onClick={handleCloseSearch}
            aria-label="Close search"
          >
            <X size={18} />
          </button>
        </div>
      )}

      <Navbar.Content style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center' }}>
        <Stack spacing={16} style={{ padding: '8px 16px' }}>
          {!showSearch && (
            <Button 
              appearance="subtle" 
              onClick={() => setShowSearch(true)} 
              className="search-btn"
            >
              <Search size={22} />
            </Button>
          )}
          <Button 
            appearance="primary" 
            className="paket-btn"
            onClick={() => navigate('/work-in-progress')}
          >
            <Stack spacing={8}>
              <span>Paket Al</span>
              <Crown size={18} />
            </Stack>
          </Button>
          <Button 
            appearance="ghost" 
            className="giris-btn"
            onClick={() => navigate('/work-in-progress')}
          >
            Giriş Yap
          </Button>
        </Stack>
      </Navbar.Content>
    </Navbar>
  )
}

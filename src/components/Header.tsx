import { useState } from 'react'
import { Navbar, Nav, Input, Button, Stack } from 'rsuite'
import { Search } from 'lucide-react'
import { Link, useLocation } from 'react-router-dom'

const Brand = () => (
  <Navbar.Brand href="/">MSmart</Navbar.Brand>
)

export default function Header() {
  const location = useLocation()
  const [showSearch, setShowSearch] = useState(false)

  return (
    <Navbar>
      <Navbar.Content showFrom="xs">
        <Brand />
        <Nav activeKey={location.pathname}>
          <Nav.Item as={Link} to="/" eventKey="/">
            Home
          </Nav.Item>
          <Nav.Item as={Link} to="/movies" eventKey="/movies">
            Movies
          </Nav.Item>
          <Nav.Item as={Link} to="/tv" eventKey="/tv">
            TV Shows
          </Nav.Item>
        </Nav>
      </Navbar.Content>

      <Navbar.Content hideFrom="xs">
        <Navbar.Toggle />
        <Brand />
      </Navbar.Content>

      <Navbar.Content style={{ marginLeft: 'auto' }}>
        <Stack spacing={10} style={{ padding: '8px 16px' }}>
          {showSearch && (
            <Input 
              type="search" 
              placeholder="Search here..." 
              style={{ width: 180 }}
              autoFocus
            />
          )}
          <Button appearance="subtle" onClick={() => setShowSearch(!showSearch)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Search size={20} />
          </Button>
          <Button appearance="ghost">Paket Satın Al</Button>
          <Button appearance="primary">Giriş Yap</Button>
        </Stack>
      </Navbar.Content>
    </Navbar>
  )
}

import { useState, useEffect } from "react";
import { Navbar, Button, Stack } from "rsuite";
import { MotionIcon } from "motion-icons-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import Logo from "./Logo";
import SearchBar from "./SearchBar";
import HeaderNav from "./HeaderNav";
import HeaderAccountMenu from "./HeaderAccountMenu";
import HeaderMobileNav from "./HeaderMobileNav";
import { useAppSelector } from "../../store/store";

export default function Header() {
  const location = useLocation();
  const navigate = useNavigate();
  const currentUser = useAppSelector((s) => s.auth.currentUser);

  const hasQuery =
    location.pathname === "/search" &&
    !!new URLSearchParams(location.search).get("q");
  const [showSearch, setShowSearch] = useState(hasQuery);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(() =>
    typeof window === "undefined" ? false : window.scrollY > 30,
  );

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 30);
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <>
      <Navbar
        className={`custom-header${scrolled ? " scrolled" : ""}${showSearch ? " searching" : ""}`}
      >
        <Navbar.Content className="header-left">
          <Navbar.Brand as={Link} to="/" className="header-brand-link">
            <Logo />
          </Navbar.Brand>
          <HeaderNav />
        </Navbar.Content>

        <SearchBar
          key={`${location.pathname}${location.search}`}
          open={showSearch}
          onClose={() => setShowSearch(false)}
        />

        <Navbar.Content className="header-right">
          <div className="header-desktop-actions">
            {!showSearch && (
              <Button
                appearance="subtle"
                onClick={() => setShowSearch(true)}
                className="search-btn"
              >
                <MotionIcon
                  name="Search"
                  size={22}
                  trigger="hover"
                  animation="pop"
                />
              </Button>
            )}
            {!currentUser?.plan && (
              <Button
                appearance="primary"
                className="paket-btn"
                onClick={() => navigate("/packages")}
              >
                <Stack spacing={8}>
                  <span>Paket Al</span>
                  <MotionIcon
                    name="Crown"
                    size={18}
                    trigger="hover"
                    animation="pop"
                  />
                </Stack>
              </Button>
            )}
            <HeaderAccountMenu />
          </div>

          <div className="header-mobile-actions">
            <Button
              appearance="subtle"
              className="search-btn"
              onClick={() => setShowSearch((p) => !p)}
            >
              <MotionIcon
                name="Search"
                size={22}
                trigger="hover"
                animation="pop"
              />
            </Button>
            <button
              className="mobile-menu-btn"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Menüyü aç/kapat"
            >
              <MotionIcon
                name={mobileMenuOpen ? "X" : "Menu"}
                size={24}
                trigger="hover"
                animation="pop"
              />
            </button>
          </div>
        </Navbar.Content>
      </Navbar>

      <HeaderMobileNav
        open={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
      />
    </>
  );
}

import { useState, useEffect } from "react";
import { Navbar, Button } from "rsuite";
import { MotionIcon } from "../ui/MotionIcon";
import { Link, useLocation, useNavigate } from "react-router-dom";
import Logo from "./Logo";
import SearchBar from "./SearchBar";
import HeaderNav from "./HeaderNav";
import HeaderAccountMenu from "./HeaderAccountMenu";
import HeaderMobileNav from "./HeaderMobileNav";
import { selectShownProfile, useAppSelector } from "../../store/store";
import HeaderPackageButton from "./HeaderPackageButton";

export default function Header() {
  const location = useLocation();
  const navigate = useNavigate();
  const currentUser = useAppSelector((s) => s.auth.currentUser);
  const shownProfile = useAppSelector(selectShownProfile);

  const hasQuery =
    location.pathname === "/search" &&
    !!new URLSearchParams(location.search).get("q");
  const [showSearch, setShowSearch] = useState(hasQuery);
  const [searchOriginPath, setSearchOriginPath] = useState(location.pathname);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(() =>
    typeof window === "undefined" ? false : window.scrollY > 30,
  );

  useEffect(() => {
    let frame = 0;
    const updateScrolled = () => {
      frame = 0;
      const next = window.scrollY > 30;
      setScrolled((current) => (current === next ? current : next));
    };
    const handleScroll = () => {
      if (!frame) frame = window.requestAnimationFrame(updateScrolled);
    };
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", handleScroll);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, []);

  const searchVisible =
    showSearch &&
    (location.pathname === "/search" || location.pathname === searchOriginPath);
  const toggleSearch = () => {
    if (searchVisible) {
      setShowSearch(false);
      return;
    }
    setSearchOriginPath(location.pathname);
    setShowSearch(true);
  };

  return (
    <>
      <Navbar
        className={`custom-header${scrolled ? " scrolled" : ""}${searchVisible ? " searching" : ""}`}
      >
        <Navbar.Content className="header-left">
          <Navbar.Brand as={Link} to="/" className="header-brand-link">
            <Logo />
          </Navbar.Brand>
          <HeaderNav pathname={location.pathname} />
        </Navbar.Content>

        <SearchBar
          key={`${location.pathname}${location.search}`}
          open={searchVisible}
          onClose={() => setShowSearch(false)}
        />

        <Navbar.Content className="header-right">
          <div className="header-desktop-actions">
            {!searchVisible && (
              <Button
                appearance="subtle"
                onClick={toggleSearch}
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
              <HeaderPackageButton onClick={() => navigate("/packages")} />
            )}
            <HeaderAccountMenu
              currentUser={currentUser}
              shownProfile={shownProfile}
            />
          </div>

          <div className="header-mobile-actions">
            <Button
              appearance="subtle"
              className="search-btn"
              onClick={toggleSearch}
            >
              <MotionIcon
                name="Search"
                size={22}
                trigger="hover"
                animation="pop"
              />
            </Button>
            {!currentUser && (
              <Button
                appearance="ghost"
                className="mobile-login-btn"
                onClick={() => navigate("/login")}
              >
                Giriş Yap
              </Button>
            )}
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

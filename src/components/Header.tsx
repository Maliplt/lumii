import { useState, useEffect, useRef } from "react";
import { Navbar, Nav, Button, Stack } from "rsuite";
import { ChevronDown } from "lucide-react";
import { MotionIcon } from "motion-icons-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import Logo from "./Logo";
import SearchBar from "./SearchBar";
import { useToast } from "./Toast";
import { AVATARS, PACKAGES } from "../helpers";
import {
  useAppSelector,
  useAppDispatch,
  logout,
  selectProfile,
  selectActiveProfile,
} from "../store/store";

const NAV_LINKS = [
  { to: "/", label: "Anasayfa", icon: "Home" },
  { to: "/explore", label: "Seç İzle", icon: "Film" },
  { to: "/tv", label: "TV İzle", icon: "Tv" },
];

export default function Header() {
  const location = useLocation();
  const navigate = useNavigate();
  //redux
  const dispatch = useAppDispatch();
  const currentUser = useAppSelector((s) => s.auth.currentUser);
  const activeProfile = useAppSelector(selectActiveProfile);
  const shownProfile = activeProfile ?? currentUser?.profiles[0] ?? null;
  const otherProfiles = (currentUser?.profiles ?? []).filter(
    (p) => p.id !== shownProfile?.id,
  );

  const hasQuery =
    location.pathname === "/search" &&
    !!new URLSearchParams(location.search).get("q");
  const [showSearch, setShowSearch] = useState(hasQuery);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const accountMenuRef = useRef<HTMLDivElement>(null);
  const accountCloseTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const toast = useToast();
  const userPlanName = currentUser
    ? PACKAGES.find((p) => p.id === currentUser.plan)?.name || "Ücretsiz Plan"
    : "";

  //disari tiklayinca kapat
  useEffect(() => {
    if (!accountMenuOpen) return;
    const onDown = (e: MouseEvent) => {
      if (
        accountMenuRef.current &&
        !accountMenuRef.current.contains(e.target as Node)
      )
        setAccountMenuOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setAccountMenuOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [accountMenuOpen]);

  const handleLogout = () => {
    dispatch(logout());
    setMobileMenuOpen(false);
    setAccountMenuOpen(false);
    toast("Çıkış yapıldı.", "info");
    navigate("/");
  };

  const switchProfile = (id: string) => {
    dispatch(selectProfile(id));
    setAccountMenuOpen(false);
    navigate("/");
  };

  // hover ile ac; ayrilinca kisa gecikmeyle kapat ki panele giderken kapanmasin
  const openAccountMenu = () => {
    if (accountCloseTimer.current) clearTimeout(accountCloseTimer.current);
    setAccountMenuOpen(true);
  };
  const scheduleCloseAccountMenu = () => {
    if (accountCloseTimer.current) clearTimeout(accountCloseTimer.current);
    accountCloseTimer.current = setTimeout(() => setAccountMenuOpen(false), 260);
  };

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 30);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(
    () => () => {
      if (accountCloseTimer.current) clearTimeout(accountCloseTimer.current);
    },
    [],
  );

  return (
    <>
      <Navbar
        className={`custom-header${scrolled ? " scrolled" : ""}${accountMenuOpen ? " menu-open" : ""}${showSearch ? " searching" : ""}`}
      >
        <Navbar.Content className="header-left">
          <Navbar.Brand as={Link} to="/" className="header-brand-link">
            <Logo />
          </Navbar.Brand>
          <Nav activeKey={location.pathname} className="header-main-nav">
            {NAV_LINKS.map(({ to, label, icon }) => (
              <Nav.Item
                key={to}
                as={Link}
                to={to}
                eventKey={to}
                className="nav-link"
              >
                <Stack spacing={8}>
                  <span className="nav-icon-wrapper">
                    <MotionIcon
                      name={icon}
                      size={18}
                      trigger="hover"
                      animation="nudge"
                    />
                  </span>
                  <span className="nav-text-label">{label}</span>
                </Stack>
              </Nav.Item>
            ))}
          </Nav>
        </Navbar.Content>

        <SearchBar open={showSearch} onClose={() => setShowSearch(false)} />

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
            {currentUser ? (
              <div
                className="account-menu"
                ref={accountMenuRef}
                onMouseEnter={openAccountMenu}
                onMouseLeave={scheduleCloseAccountMenu}
              >
                <button
                  type="button"
                  className="account-trigger"
                  aria-expanded={accountMenuOpen}
                  aria-label="Hesap"
                  onClick={() => setAccountMenuOpen((p) => !p)}
                >
                  <span className="account-avatar">
                    {shownProfile?.avatar ? (
                      <img src={AVATARS[shownProfile.avatar]} alt="" />
                    ) : (
                      currentUser.name.charAt(0).toUpperCase()
                    )}
                  </span>
                  <span className="account-trigger__name">
                    {shownProfile?.name ?? currentUser.name}
                  </span>
                  <ChevronDown size={15} className="account-trigger__caret" />
                </button>

                {accountMenuOpen && (
                  <div className="account-menu__panel">
                    <div className="account-menu__decal account-menu__decal--tr" />
                    <div className="account-menu__decal account-menu__decal--bl" />
                    <button
                      type="button"
                      className="account-menu__head"
                      onClick={() => {
                        setAccountMenuOpen(false);
                        navigate("/account");
                      }}
                    >
                      <div className="account-menu__head-card">
                        <span className="account-menu__head-avatar">
                          {shownProfile?.avatar ? (
                            <img src={AVATARS[shownProfile.avatar]} alt="" />
                          ) : (
                            currentUser.name.charAt(0).toUpperCase()
                          )}
                        </span>
                        <div className="account-menu__head-info">
                          <strong>{shownProfile?.name ?? currentUser.name}</strong>
                          <span>{currentUser.email}</span>
                        </div>
                      </div>
                      <div className="account-menu__plan-section">
                        <span className={`account-plan-badge account-plan-badge--${currentUser.plan || "free"}`}>
                          {userPlanName}
                        </span>
                        <em>Hesabı Yönet</em>
                      </div>
                    </button>

                    <div className="account-menu__divider" />

                    <div className="account-menu__profiles">
                      {otherProfiles.map((p) => (
                        <button
                          key={p.id}
                          type="button"
                          className="account-menu__profile"
                          onClick={() => switchProfile(p.id)}
                        >
                          <span className="account-menu__profile-avatar">
                            <img src={AVATARS[p.avatar]} alt="" />
                          </span>
                          <span>{p.name}</span>
                          {p.kids && (
                            <span className="account-menu__profile-kids">
                              KIDS
                            </span>
                          )}
                        </button>
                      ))}
                      <button
                        type="button"
                        className="account-menu__switch"
                        onClick={() => {
                          setAccountMenuOpen(false);
                          navigate("/profiles");
                        }}
                      >
                        <MotionIcon
                          name="Users"
                          size={16}
                          trigger="hover"
                          animation="pop"
                        />
                        Profilleri Yönet
                      </button>
                    </div>

                    <div className="account-menu__divider" />
                    <button
                      type="button"
                      className="account-menu__logout"
                      onClick={handleLogout}
                    >
                      <span>Çıkış Yap</span>
                      <MotionIcon
                        name="LogOut"
                        size={16}
                        trigger="hover"
                        animation="pop"
                      />
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Button
                appearance="ghost"
                className="giris-btn"
                onClick={() => navigate("/login")}
              >
                Giriş Yap
              </Button>
            )}
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
              {mobileMenuOpen ? (
                <MotionIcon
                  name="X"
                  size={24}
                  trigger="hover"
                  animation="pop"
                />
              ) : (
                <MotionIcon
                  name="Menu"
                  size={24}
                  trigger="hover"
                  animation="pop"
                />
              )}
            </button>
          </div>
        </Navbar.Content>
      </Navbar>

      {mobileMenuOpen && (
        <div
          className="mobile-nav-overlay"
          onClick={() => setMobileMenuOpen(false)}
        >
          <nav
            className="mobile-nav-panel"
            onClick={(e) => e.stopPropagation()}
          >
            {NAV_LINKS.map(({ to, label, icon }) => (
              <Link
                key={to}
                to={to}
                className={`mobile-nav-link${location.pathname === to ? " active" : ""}`}
                onClick={() => setMobileMenuOpen(false)}
              >
                <MotionIcon
                  name={icon}
                  size={20}
                  trigger="hover"
                  animation="nudge"
                />
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
                  onClick={() => {
                    navigate("/packages");
                    setMobileMenuOpen(false);
                  }}
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
              {currentUser ? (
                <>
                  <Button
                    appearance="ghost"
                    className="giris-btn"
                    block
                    onClick={() => {
                      navigate("/profiles");
                      setMobileMenuOpen(false);
                    }}
                  >
                    <Stack spacing={8}>
                      <MotionIcon
                        name="Users"
                        size={18}
                        trigger="hover"
                        animation="pop"
                      />
                      <span>Profil Değiştir</span>
                    </Stack>
                  </Button>
                  <Button
                    appearance="ghost"
                    className="giris-btn"
                    block
                    onClick={() => {
                      navigate("/account");
                      setMobileMenuOpen(false);
                    }}
                  >
                    <Stack spacing={8}>
                      <MotionIcon
                        name="User"
                        size={18}
                        trigger="hover"
                        animation="pop"
                      />
                      <span>Hesabım</span>
                    </Stack>
                  </Button>
                  <Button
                    appearance="subtle"
                    className="cikis-btn"
                    block
                    onClick={handleLogout}
                  >
                    <Stack spacing={8}>
                      <MotionIcon
                        name="LogOut"
                        size={18}
                        trigger="hover"
                        animation="pop"
                      />
                      <span>Çıkış Yap</span>
                    </Stack>
                  </Button>
                </>
              ) : (
                <Button
                  appearance="ghost"
                  className="giris-btn"
                  block
                  onClick={() => {
                    navigate("/login");
                    setMobileMenuOpen(false);
                  }}
                >
                  Giriş Yap
                </Button>
              )}
            </div>
          </nav>
        </div>
      )}
    </>
  );
}

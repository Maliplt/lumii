import { useState, useEffect, useRef } from "react";
import { Navbar, Nav, Button, Stack } from "rsuite";
import {
  ChevronDown,
  ChevronRight,
  Film,
  Tv,
  Users,
  Settings,
  LogOut,
} from "lucide-react";
import { MotionIcon } from "motion-icons-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import Logo from "./Logo";
import SearchBar from "./SearchBar";
import { useToast, toastText } from "./Toast";
import { AVATARS } from "../helpers";
import {
  useAppSelector,
  useAppDispatch,
  logout,
  selectProfile,
  selectActiveProfile,
} from "../store/store";

const NAV_LINKS = [
  { to: "/", label: "Ana Sayfa", icon: "Home" },
  { to: "/explore", label: "Seç İzle", icon: "Film" },
  { to: "/tv", label: "TV İzle", icon: "Tv" },
];

export default function Header() {
  const location = useLocation();
  const navigate = useNavigate();
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
  const exploreType = new URLSearchParams(location.search).get("type");
  const [showSearch, setShowSearch] = useState(hasQuery);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const [selectOpen, setSelectOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const accountMenuRef = useRef<HTMLDivElement>(null);
  const accountCloseTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const selectCloseTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const toast = useToast();

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
    toast(toastText.loggedOut, "info");
    navigate("/");
  };

  const switchProfile = (id: string) => {
    dispatch(selectProfile(id));
    setAccountMenuOpen(false);
    navigate("/");
  };

  const openAccountMenu = () => {
    if (accountCloseTimer.current) clearTimeout(accountCloseTimer.current);
    setAccountMenuOpen(true);
  };
  const scheduleCloseAccountMenu = () => {
    if (accountCloseTimer.current) clearTimeout(accountCloseTimer.current);
    accountCloseTimer.current = setTimeout(() => setAccountMenuOpen(false), 260);
  };

  const openSelectMenu = () => {
    if (selectCloseTimer.current) clearTimeout(selectCloseTimer.current);
    setSelectOpen(true);
  };
  const scheduleCloseSelectMenu = () => {
    if (selectCloseTimer.current) clearTimeout(selectCloseTimer.current);
    selectCloseTimer.current = setTimeout(() => setSelectOpen(false), 220);
  };

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 30);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(
    () => () => {
      if (accountCloseTimer.current) clearTimeout(accountCloseTimer.current);
      if (selectCloseTimer.current) clearTimeout(selectCloseTimer.current);
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
            {NAV_LINKS.map(({ to, label, icon }) => {
              const active =
                to === "/"
                  ? location.pathname === "/"
                  : location.pathname.startsWith(to);
              const item = (
                <Nav.Item
                  key={to}
                  as={Link}
                  to={to}
                  eventKey={to}
                  active={active}
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
              );

              if (to !== "/explore") return item;
              return (
                <div
                  key={to}
                  className="nav-select"
                  onMouseEnter={openSelectMenu}
                  onMouseLeave={scheduleCloseSelectMenu}
                >
                  <button
                    type="button"
                    className={`nav-link nav-select__trigger${active ? " is-active" : ""}`}
                    aria-haspopup="true"
                    aria-expanded={selectOpen}
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
                  </button>
                  {selectOpen && (
                    <div className="nav-select__panel">
                      <Link
                        to="/explore?type=movie"
                        className="nav-select__btn"
                        onClick={() => setSelectOpen(false)}
                      >
                        <Film size={20} />
                        <span>Film İzle</span>
                      </Link>
                      <Link
                        to="/explore?type=tv"
                        className="nav-select__btn"
                        onClick={() => setSelectOpen(false)}
                      >
                        <Tv size={20} />
                        <span>Dizi İzle</span>
                      </Link>
                    </div>
                  )}
                </div>
              );
            })}
          </Nav>
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
                    <div className="account-menu__current">
                      <span className="account-menu__current-avatar">
                        {shownProfile?.avatar ? (
                          <img src={AVATARS[shownProfile.avatar]} alt="" />
                        ) : (
                          currentUser.name.charAt(0).toUpperCase()
                        )}
                      </span>
                      <div className="account-menu__current-info">
                        <strong>{shownProfile?.name ?? currentUser.name}</strong>
                        <span>{currentUser.email}</span>
                      </div>
                    </div>

                    <div className="account-menu__divider" />

                    <button
                      type="button"
                      className="account-menu__section"
                      onClick={() => {
                        setAccountMenuOpen(false);
                        navigate("/profiles");
                      }}
                    >
                      <Users size={17} />
                      <span>Profiller</span>
                      <ChevronRight
                        size={16}
                        className="account-menu__section-caret"
                      />
                    </button>

                    {otherProfiles.length > 0 && (
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
                      </div>
                    )}

                    <div className="account-menu__divider" />

                    <button
                      type="button"
                      className="account-menu__item"
                      onClick={() => {
                        setAccountMenuOpen(false);
                        navigate("/account");
                      }}
                    >
                      <Settings size={17} />
                      <span>Ayarlar</span>
                    </button>

                    <div className="account-menu__divider" />

                    <button
                      type="button"
                      className="account-menu__item account-menu__item--logout"
                      onClick={handleLogout}
                    >
                      <LogOut size={17} />
                      <span>Oturumu Kapat</span>
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
            <div className="mobile-nav-head">
              <Link
                to="/"
                className="mobile-nav-brand"
                onClick={() => setMobileMenuOpen(false)}
                aria-label="Lumii ana sayfa"
              >
                <Logo />
              </Link>
              <button
                type="button"
                className="mobile-nav-close"
                onClick={() => setMobileMenuOpen(false)}
                aria-label="Menüyü kapat"
              >
                <MotionIcon
                  name="X"
                  size={22}
                  trigger="hover"
                  animation="pop"
                />
              </button>
            </div>

            {currentUser && (
              <button
                type="button"
                className="mobile-nav-account"
                onClick={() => {
                  navigate("/account");
                  setMobileMenuOpen(false);
                }}
              >
                <span className="mobile-nav-account__avatar">
                  {shownProfile?.avatar ? (
                    <img src={AVATARS[shownProfile.avatar]} alt="" />
                  ) : (
                    currentUser.name.charAt(0).toUpperCase()
                  )}
                </span>
                <span className="mobile-nav-account__text">
                  <strong>{shownProfile?.name ?? currentUser.name}</strong>
                  <small>{currentUser.email}</small>
                </span>
                <ChevronRight size={18} />
              </button>
            )}

            <div className="mobile-nav-list">
            {NAV_LINKS.map(({ to, label, icon }) =>
              to === "/explore" ? (
                <div key={to} className="mobile-nav-sub">
                  <Link
                    to="/explore?type=movie"
                    className={`mobile-nav-link${location.pathname === "/explore" && exploreType !== "tv" ? " active" : ""}`}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <Film size={21} />
                    <span>Film İzle</span>
                  </Link>
                  <Link
                    to="/explore?type=tv"
                    className={`mobile-nav-link${location.pathname === "/explore" && exploreType === "tv" ? " active" : ""}`}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <Tv size={21} />
                    <span>Dizi İzle</span>
                  </Link>
                </div>
              ) : (
                <Link
                  key={to}
                  to={to}
                  className={`mobile-nav-link${location.pathname === to ? " active" : ""}`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <MotionIcon
                    name={icon}
                    size={21}
                    trigger="hover"
                    animation="nudge"
                  />
                  <span>{label}</span>
                </Link>
              ),
            )}
            </div>
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

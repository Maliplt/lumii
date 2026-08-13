import { useEffect, useRef } from "react";
import { Button, Stack } from "rsuite";
import { ChevronRight, Film, Tv } from "lucide-react";
import { MotionIcon } from "motion-icons-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import Logo from "./Logo";
import { useLogout } from "../../helpers";
import { useAppSelector, selectShownProfile } from "../../store/store";
import { NAV_LINKS } from "./headerLinks";
import AvatarOrInitial from "./AvatarOrInitial";

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function HeaderMobileNav({ open, onClose }: Props) {
  const location = useLocation();
  const navigate = useNavigate();
  const logoutUser = useLogout();
  const currentUser = useAppSelector((s) => s.auth.currentUser);
  const shownProfile = useAppSelector(selectShownProfile);
  const exploreType = new URLSearchParams(location.search).get("type");
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;

    const root = document.documentElement;
    const body = document.body;
    const previousRootOverflow = root.style.overflow;
    const previousBodyOverflow = body.style.overflow;
    root.style.overflow = "hidden";
    body.style.overflow = "hidden";
    closeButtonRef.current?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      root.style.overflow = previousRootOverflow;
      body.style.overflow = previousBodyOverflow;
    };
  }, [open, onClose]);

  if (!open) return null;

  const go = (to: string) => {
    navigate(to);
    onClose();
  };

  const handleLogout = () => {
    logoutUser();
    onClose();
  };

  return (
    <div className="mobile-nav-overlay" onClick={onClose}>
      <nav
        className="mobile-nav-panel"
        aria-label="Mobil menü"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mobile-nav-head">
          <Link
            to="/"
            className="mobile-nav-brand"
            onClick={onClose}
            aria-label="TENET ana sayfa"
          >
            <Logo />
          </Link>
          <button
            ref={closeButtonRef}
            type="button"
            className="mobile-nav-close"
            onClick={onClose}
            aria-label="Menüyü kapat"
          >
            <MotionIcon name="X" size={22} trigger="hover" animation="pop" />
          </button>
        </div>

        {currentUser && (
          <button
            type="button"
            className="mobile-nav-account"
            onClick={() => go("/account")}
          >
            <span className="mobile-nav-account__avatar">
              <AvatarOrInitial profile={shownProfile} fallbackName={currentUser.name} />
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
                  onClick={onClose}
                >
                  <Film size={21} />
                  <span>Film İzle</span>
                </Link>
                <Link
                  to="/explore?type=tv"
                  className={`mobile-nav-link${location.pathname === "/explore" && exploreType === "tv" ? " active" : ""}`}
                  onClick={onClose}
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
                onClick={onClose}
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
              onClick={() => go("/packages")}
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
                onClick={() => go("/profiles")}
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
                onClick={() => go("/account")}
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
              onClick={() => go("/login")}
            >
              Giriş Yap
            </Button>
          )}
        </div>
      </nav>
    </div>
  );
}

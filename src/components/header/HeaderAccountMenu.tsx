import { useState, useEffect, useRef } from "react";
import { ChevronDown, ChevronRight, Users, Settings, LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { avatarFor, useLogout } from "../../helpers";
import { useAppSelector, useAppDispatch, selectProfile, selectShownProfile } from "../../store/store";
import AvatarOrInitial from "./AvatarOrInitial";

export default function HeaderAccountMenu() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const logoutUser = useLogout();
  const currentUser = useAppSelector((s) => s.auth.currentUser);
  const shownProfile = useAppSelector(selectShownProfile);
  const otherProfiles = (currentUser?.profiles ?? []).filter(
    (p) => p.id !== shownProfile?.id,
  );

  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node))
        setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  useEffect(
    () => () => {
      if (closeTimer.current) clearTimeout(closeTimer.current);
    },
    [],
  );

  if (!currentUser) {
    return (
      <button
        className="rs-btn rs-btn-ghost giris-btn"
        onClick={() => navigate("/login")}
      >
        Giriş Yap
      </button>
    );
  }

  const openMenu = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    setOpen(true);
  };
  const scheduleClose = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    closeTimer.current = setTimeout(() => setOpen(false), 260);
  };

  const switchProfile = (id: string) => {
    dispatch(selectProfile(id));
    setOpen(false);
    navigate("/");
  };

  const handleLogout = () => {
    logoutUser();
    setOpen(false);
  };

  return (
    <div
      className="account-menu"
      ref={menuRef}
      onMouseEnter={openMenu}
      onMouseLeave={scheduleClose}
    >
      <button
        type="button"
        className="account-trigger"
        aria-expanded={open}
        aria-label="Hesap"
        onClick={() => setOpen((p) => !p)}
      >
        <span className="account-avatar">
          <AvatarOrInitial profile={shownProfile} fallbackName={currentUser.name} />
        </span>
        <span className="account-trigger__name">
          {shownProfile?.name ?? currentUser.name}
        </span>
        <ChevronDown size={15} className="account-trigger__caret" />
      </button>

      {open && (
        <div className="account-menu__panel">
          <div className="account-menu__current">
            <span className="account-menu__current-avatar">
              <AvatarOrInitial profile={shownProfile} fallbackName={currentUser.name} />
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
              setOpen(false);
              navigate("/profiles");
            }}
          >
            <Users size={17} />
            <span>Profiller</span>
            <ChevronRight size={16} className="account-menu__section-caret" />
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
                    <img src={avatarFor(p)} alt="" />
                  </span>
                  <span>{p.name}</span>
                  {p.kids && (
                    <span className="account-menu__profile-kids">Çocuk</span>
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
              setOpen(false);
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
  );
}

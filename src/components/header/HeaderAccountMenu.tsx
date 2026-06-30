import { useState, useEffect, useRef } from "react";
import {
  ChevronDown,
  ChevronRight,
  Users,
  Settings,
  LogOut,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useToast, toastText } from "../Toast";
import { AVATARS } from "../../helpers";
import {
  useAppSelector,
  useAppDispatch,
  logout,
  selectProfile,
  selectActiveProfile,
} from "../../store/store";

export default function HeaderAccountMenu() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const toast = useToast();
  const currentUser = useAppSelector((s) => s.auth.currentUser);
  const activeProfile = useAppSelector(selectActiveProfile);
  const shownProfile = activeProfile ?? currentUser?.profiles[0] ?? null;
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
    dispatch(logout());
    setOpen(false);
    toast(toastText.loggedOut, "info");
    navigate("/");
  };

  const avatarNode = shownProfile?.avatar ? (
    <img src={AVATARS[shownProfile.avatar]} alt="" />
  ) : (
    currentUser.name.charAt(0).toUpperCase()
  );

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
        <span className="account-avatar">{avatarNode}</span>
        <span className="account-trigger__name">
          {shownProfile?.name ?? currentUser.name}
        </span>
        <ChevronDown size={15} className="account-trigger__caret" />
      </button>

      {open && (
        <div className="account-menu__panel">
          <div className="account-menu__current">
            <span className="account-menu__current-avatar">{avatarNode}</span>
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
                    <img src={AVATARS[p.avatar]} alt="" />
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

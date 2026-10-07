import { useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { Menu, X, ArrowRight, ExternalLink } from "lucide-react";
import tenetLogo from "../../assets/images/tenet-logo.svg";

export default function CorporateHeader() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  const closeMenu = () => setMobileOpen(false);

  return (
    <header className="corp-header">
      <div className="corp-header__inner">
        {/* Marka Logo & Tag */}
        <Link to="/" className="corp-header__brand" onClick={closeMenu}>
          <img src={tenetLogo} alt="Tenett" className="corp-logo-img" />
          <span className="corp-brand-tag">MEDIA TECH</span>
        </Link>

        {/* Masaüstü Navigasyon */}
        <nav className="corp-header__nav">
          <NavLink 
            to="/" 
            className={({ isActive }) => `corp-header__link ${isActive && location.pathname === "/" ? "active" : ""}`}
          >
            Genel Bakış
          </NavLink>
          <NavLink 
            to="/products" 
            className={({ isActive }) => `corp-header__link ${isActive ? "active" : ""}`}
          >
            Ürünlerimiz
          </NavLink>
          <NavLink 
            to="/about" 
            className={({ isActive }) => `corp-header__link ${isActive ? "active" : ""}`}
          >
            Hakkımızda & Kuruluş
          </NavLink>
          <NavLink 
            to="/investors" 
            className={({ isActive }) => `corp-header__link ${isActive ? "active" : ""}`}
          >
            Yatırımcılar
          </NavLink>
          <NavLink 
            to="/contact" 
            className={({ isActive }) => `corp-header__link ${isActive ? "active" : ""}`}
          >
            İletişim
          </NavLink>
        </nav>

        {/* Eylemler */}
        <div className="corp-header__actions">
          {/* Canlı Platforma Geçiş Butonu */}
          <Link 
            to="/app" 
            className="corp-btn corp-btn--app-live"
            title="Tenet Canlı Medya Platformunu Başlat"
          >
            <span className="corp-pulse-dot"></span>
            Canlı Platform
            <ExternalLink size={13} style={{ marginLeft: "2px" }} />
          </Link>

          <Link 
            to="/contact" 
            className="corp-btn corp-btn--primary"
            style={{ display: "none" }} // Küçük ekranlarda gizle
          >
            İletişim
          </Link>

          <button 
            className="corp-header__mobile-toggle"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Menüyü Aç / Kapat"
          >
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobil Çekmece */}
      {mobileOpen && (
        <div className="corp-mobile-drawer">
          <Link to="/" className="corp-header__link" onClick={closeMenu}>Genel Bakış</Link>
          <Link to="/products" className="corp-header__link" onClick={closeMenu}>Ürünlerimiz</Link>
          <Link to="/about" className="corp-header__link" onClick={closeMenu}>Hakkımızda & Kuruluş</Link>
          <Link to="/investors" className="corp-header__link" onClick={closeMenu}>Yatırımcı İlişkileri</Link>
          <Link to="/contact" className="corp-header__link" onClick={closeMenu}>İletişim & Basın</Link>

          <div style={{ marginTop: "20px", display: "flex", flexDirection: "column", gap: "12px" }}>
            <Link 
              to="/app" 
              className="corp-btn corp-btn--primary corp-btn--lg" 
              onClick={closeMenu}
              style={{ justifyContent: "center" }}
            >
              Canlı Tenet Platformunu Başlat
              <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}

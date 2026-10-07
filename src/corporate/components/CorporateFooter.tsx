import { Link } from "react-router-dom";
import { ArrowUpRight, Mail, MapPin, Globe, Shield } from "lucide-react";
import tenetLogo from "../../assets/images/tenet-logo.svg";

export default function CorporateFooter() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="corp-footer">
      <div className="corp-footer__inner">
        <div className="corp-footer__top">
          {/* Marka & Kurumsal Bilgi */}
          <div className="corp-footer__brand">
            <img src={tenetLogo} alt="Tenett" className="corp-logo-img" />
            <p>
              Yüksek bit-oranlı medya akışını, entegre WebAssembly oyun motorunu ve dağıtık debrid altyapısını birleştiren yeni nesil eğlence teknolojisi.
            </p>
            <div className="corp-hq-info">
              <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "4px" }}>
                <MapPin size={13} color="#A91D3A" />
                <span>İstanbul: Maslak Mah. Büyükdere Cad. No: 255, Sarıyer</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <Globe size={13} color="#38bdf8" />
                <span>London: 128 City Road, EC1V 2NX, United Kingdom</span>
              </div>
            </div>
          </div>

          {/* Sütun 1: Ürün & Teknoloji */}
          <div>
            <h4 className="corp-footer__col-title">Ürün & Ekosistem</h4>
            <ul className="corp-footer__links">
              <li><Link to="/products#stream-os">Tenet Stream OS (4K)</Link></li>
              <li><Link to="/products#arcade">Tenet Arcade (WASM Oyunlar)</Link></li>
              <li><Link to="/products#tv-hub">Tenet TV & Living Room Hub</Link></li>
              <li><Link to="/products#debrid">Multi-Source Debrid Engine</Link></li>
              <li>
                <Link to="/app" style={{ color: "#ff8097", display: "inline-flex", alignItems: "center", gap: "4px" }}>
                  Canlı Platformu Test Et <ArrowUpRight size={13} />
                </Link>
              </li>
            </ul>
          </div>

          {/* Sütun 2: Şirket & Yatırımcılar */}
          <div>
            <h4 className="corp-footer__col-title">Şirket</h4>
            <ul className="corp-footer__links">
              <li><Link to="/about">Hakkımızda & Kuruluş</Link></li>
              <li><Link to="/about#team">Liderlik & Mühendislik</Link></li>
              <li><Link to="/investors">Yatırımcı İlişkileri & Turlar</Link></li>
              <li><Link to="/investors#metrics">Büyüme Metrikleri & Finans</Link></li>
              <li><Link to="/contact#press">Basın Kiti (Press Kit)</Link></li>
            </ul>
          </div>

          {/* Sütun 3: İletişim & Güvenlik */}
          <div>
            <h4 className="corp-footer__col-title">İletişim & Kurumsal</h4>
            <ul className="corp-footer__links">
              <li><Link to="/contact">Kurumsal İş Birliği</Link></li>
              <li><Link to="/contact">Demo & Partner Başvurusu</Link></li>
              <li>
                <a href="mailto:corporate@tenett.media" style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
                  <Mail size={13} /> corporate@tenett.media
                </a>
              </li>
              <li><Link to="/legal">Gizlilik Politikası</Link></li>
              <li><Link to="/legal/kosullar">Kullanım Koşulları</Link></li>
            </ul>
          </div>
        </div>

        {/* Alt Telif & Bilgilendirme */}
        <div className="corp-footer__bottom">
          <div>
            © {currentYear} Tenett Medya Teknolojileri A.Ş. & Tenett Technologies Ltd. Tüm hakları saklıdır.
          </div>
          <div style={{ display: "flex", gap: "20px" }}>
            <span style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
              <Shield size={14} color="#2ecc71" />
              SOC2 & GDPR Uyumlu Medya Altyapısı
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}

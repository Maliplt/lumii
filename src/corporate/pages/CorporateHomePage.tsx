import { Link } from "react-router-dom";
import { ArrowRight, Film, Gamepad2, Tv, Database, Zap, CheckCircle2, Play } from "lucide-react";
import ProductVisualMockup from "../components/ProductVisualMockup";

export default function CorporateHomePage() {
  return (
    <div>
      {/* HERO SECTION */}
      <section className="corp-hero">
        <div className="corp-hero__badge-wrap">
          <div className="corp-hero__badge">
            <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#A91D3A", display: "inline-block" }}></span>
            Tenett Medya Teknolojileri • Seed Round & Platform v2.6
          </div>
        </div>

        <h1 className="corp-hero__title">
          Yeni Nesil Medya Akışı ve <br />
          <span className="corp-gradient-text">Entegre Eğlence Ekosistemi</span>
        </h1>

        <p className="corp-hero__subtitle">
          Tenett; 4K Ultra-HD sinema akışını, sıfır kurulumlu WebAssembly oyun motorunu ve dağıtık debrid ağ mimarisini tek bir akıcı deneyimde buluşturur.
        </p>

        <div className="corp-hero__cta-group">
          <Link to="/products" className="corp-btn corp-btn--primary corp-btn--lg">
            Ürünlerimizi İnceleyin
            <ArrowRight size={18} />
          </Link>
          <Link to="/app" className="corp-btn corp-btn--app-live corp-btn--lg">
            <span className="corp-pulse-dot"></span>
            Canlı Platformu Test Et (Demo)
          </Link>
          <Link to="/investors" className="corp-btn corp-btn--secondary corp-btn--lg">
            Yatırımcı Dosyası
          </Link>
        </div>

        {/* Canlı Ürün Görseli / İnteraktif Mockup */}
        <div style={{ marginTop: "20px", marginBottom: "60px" }}>
          <ProductVisualMockup />
        </div>

        {/* Temel Metrikler */}
        <div className="corp-hero__metrics">
          <div className="corp-hero__metric-item">
            <div className="corp-metric-value">&lt; 180 ms</div>
            <div className="corp-metric-label">İlk Kare Başlatma (TTFB)</div>
          </div>
          <div className="corp-hero__metric-item">
            <div className="corp-metric-value">4K 60fps</div>
            <div className="corp-metric-label">Adaptif HDR / HLS v7</div>
          </div>
          <div className="corp-hero__metric-item">
            <div className="corp-metric-value">7+ Oyun</div>
            <div className="corp-metric-label">Dahili WebAssembly Arcade</div>
          </div>
          <div className="corp-hero__metric-item">
            <div className="corp-metric-value">%99.98</div>
            <div className="corp-metric-label">Uptime & Multi-CDN Dağıtımı</div>
          </div>
        </div>
      </section>

      {/* ÜRÜNLERİMİZ ÖZETİ */}
      <section className="corp-section">
        <div className="corp-section__header">
          <span className="corp-section__tag">Bütünleşik Ekosistem</span>
          <h2 className="corp-section__title">Eğlenceyi Ayrık Parçalardan Kurtardık</h2>
          <p className="corp-section__desc">
            Kullanıcılar artık video için ayrı, mini oyunlar için ayrı, TV için ayrı platformlara ihtiyaç duymuyor. Tenett, tüm deneyimi tek bir performans çekirdeğinde sunar.
          </p>
        </div>

        <div className="corp-products-grid">
          {/* Ürün 1: Stream OS */}
          <div className="corp-product-card">
            <div className="corp-product-card__icon-box">
              <Film size={26} />
            </div>
            <div className="corp-product-card__category">Ana Medya Motoru</div>
            <h3 className="corp-product-card__title">Tenet Stream OS</h3>
            <p className="corp-product-card__desc">
              Gelişmiş HLS.js tampon mimarisi ve multi-audio/subtitle desteğiyle, yüksek bit-oranlı 4K filmleri ve dizileri gecikmesiz akıtır.
            </p>
            <ul className="corp-product-card__features">
              <li><CheckCircle2 size={16} /> 4K Ultra HD & HDR10 renk doğruluğu</li>
              <li><CheckCircle2 size={16} /> Türkçe dublaj & orijinal ses parçası geçişi</li>
              <li><CheckCircle2 size={16} /> Akıllı izleme geçmişi ve kaldığı yerden devam</li>
            </ul>
            <div style={{ marginTop: "auto" }}>
              <Link to="/products#stream-os" className="corp-btn corp-btn--secondary" style={{ width: "100%" }}>
                Teknik Detaylar &gt;
              </Link>
            </div>
          </div>

          {/* Ürün 2: Tenet Arcade */}
          <div className="corp-product-card">
            <div className="corp-product-card__icon-box" style={{ background: "rgba(56, 189, 248, 0.15)", borderColor: "rgba(56, 189, 248, 0.3)", color: "#38bdf8" }}>
              <Gamepad2 size={26} />
            </div>
            <div className="corp-product-card__category" style={{ color: "#38bdf8" }}>Etkileşimli Deneyim</div>
            <h3 className="corp-product-card__title">Tenet Arcade</h3>
            <p className="corp-product-card__desc">
              WebAssembly derlemeli klasik Doom'dan modern zeka oyunlarına (Block Bloom, 2048, Mahjong) kadar indirme gerektirmeyen anında oyun motoru.
            </p>
            <ul className="corp-product-card__features">
              <li><CheckCircle2 size={16} /> Sıfır indirme ve 0.4 saniyede başlatma</li>
              <li><CheckCircle2 size={16} /> TV kumandası, klavye ve dokunmatik uyumu</li>
              <li><CheckCircle2 size={16} /> Yerel skor kaydı ve profil eşitleme</li>
            </ul>
            <div style={{ marginTop: "auto" }}>
              <Link to="/products#arcade" className="corp-btn corp-btn--secondary" style={{ width: "100%" }}>
                Arcade Motorunu Keşfet &gt;
              </Link>
            </div>
          </div>

          {/* Ürün 3: TV Hub */}
          <div className="corp-product-card">
            <div className="corp-product-card__icon-box" style={{ background: "rgba(245, 158, 11, 0.15)", borderColor: "rgba(245, 158, 11, 0.3)", color: "#f59e0b" }}>
              <Tv size={26} />
            </div>
            <div className="corp-product-card__category" style={{ color: "#f59e0b" }}>Oturma Odası</div>
            <h3 className="corp-product-card__title">Tenet TV & Leanback</h3>
            <p className="corp-product-card__desc">
              Smart TV ve büyük ekranlar için geliştirilen 10-foot arayüzü; viewport kilitleme ve canlı kanal akışıyla televizyon konforunu zirveye taşır.
            </p>
            <ul className="corp-product-card__features">
              <li><CheckCircle2 size={16} /> Uzaktan kumanda odak ve navigasyon desteği</li>
              <li><CheckCircle2 size={16} /> Canlı TV / IPTV düşük gecikmeli akış</li>
              <li><CheckCircle2 size={16} /> Sinematik spot ışığı ve tam ekran modları</li>
            </ul>
            <div style={{ marginTop: "auto" }}>
              <Link to="/products#tv-hub" className="corp-btn corp-btn--secondary" style={{ width: "100%" }}>
                TV Hub Detayları &gt;
              </Link>
            </div>
          </div>

          {/* Ürün 4: Multi-Source Engine */}
          <div className="corp-product-card">
            <div className="corp-product-card__icon-box" style={{ background: "rgba(16, 185, 129, 0.15)", borderColor: "rgba(16, 185, 129, 0.3)", color: "#10b981" }}>
              <Database size={26} />
            </div>
            <div className="corp-product-card__category" style={{ color: "#10b981" }}>Altyapı & Protokol</div>
            <h3 className="corp-product-card__title">Debrid Core & Multi-Source</h3>
            <p className="corp-product-card__desc">
              Real-Debrid, Torrentio ve akıllı CDN önbellek ağını birleştiren akıllı kaynak bulucu; en yüksek hızda ve kesintisiz akış garantisi sunar.
            </p>
            <ul className="corp-product-card__features">
              <li><CheckCircle2 size={16} /> Otomatik en hızlı eş ve kaynak seçimi</li>
              <li><CheckCircle2 size={16} /> TMDB entegrasyonlu anlık meta-veri zenginleştirme</li>
              <li><CheckCircle2 size={16} /> Uçtan uca şifreli ve gizlilik odaklı mimari</li>
            </ul>
            <div style={{ marginTop: "auto" }}>
              <Link to="/products#debrid" className="corp-btn corp-btn--secondary" style={{ width: "100%" }}>
                Protokol Mimarisi &gt;
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* YATIRIMCILAR & BÜYÜME ŞERİDİ */}
      <section className="corp-section corp-investors-section">
        <div className="corp-section__header">
          <span className="corp-section__tag">Büyüme & Yatırımcılar</span>
          <h2 className="corp-section__title">Geleceğin Medya Altyapısını İnşa Ediyoruz</h2>
          <p className="corp-section__desc">
            Tenett, Avrupa ve Türkiye'nin önde gelen melek yatırımcıları ve erken aşama teknoloji fonları tarafından desteklenmektedir.
          </p>
        </div>

        <div className="corp-investor-grid">
          <div className="corp-investor-card">
            <div className="corp-investor-stage">Pre-Seed Round</div>
            <div className="corp-investor-amount">$450.000</div>
            <div className="corp-investor-date">Eylül 2024 • Tamamlandı</div>
            <p className="corp-investor-desc">
              Çekirdek oynatıcı motorunun, WebAssembly oyun entegrasyonunun ve patentli akış mimarisinin prototiplenmesi için kullanıldı.
            </p>
            <div className="corp-investor-leads">
              Lider Yatırımcılar:
              <strong>Melek Girişimciler Syndicate & MediaTech Lab</strong>
            </div>
          </div>

          <div className="corp-investor-card" style={{ borderColor: "rgba(169, 29, 58, 0.4)", background: "rgba(22, 18, 25, 0.85)" }}>
            <div className="corp-investor-stage">Seed Round (Aktif Büyüme)</div>
            <div className="corp-investor-amount">$1.800.000</div>
            <div className="corp-investor-date">Haziran 2025 • Tamamlandı</div>
            <p className="corp-investor-desc">
              Multi-CDN altyapısının genişletilmesi, Smart TV mağaza entegrasyonları ve bölgesel içerik dağıtım ağının kurulumuna ayrıldı.
            </p>
            <div className="corp-investor-leads">
              Lider Fonlar:
              <strong>Emerging Digital Ventures & Scale Media Partners</strong>
            </div>
          </div>

          <div className="corp-investor-card">
            <div className="corp-investor-stage">Genişleme & Hedefler</div>
            <div className="corp-investor-amount">$5.0M+ ARR</div>
            <div className="corp-investor-date">2026-2027 Projeksiyonu</div>
            <p className="corp-investor-desc">
              WebOS/Tizen yerel TV uygulamalarının piyasaya sürülmesi ve Avrupa genelinde 250.000 aktif abonelik hedefi.
            </p>
            <div className="corp-investor-leads">
              Stratejik Ortaklar:
              <strong>Cloud CDN Alliances & Telco Syndicates</strong>
            </div>
          </div>
        </div>

        {/* Teknoloji Partnerleri Banner */}
        <div className="corp-partners-banner">
          <div className="partner-logo">Cloudflare Streaming</div>
          <div className="partner-logo">TMDB API Platform</div>
          <div className="partner-logo">HLS Protocol Alliance</div>
          <div className="partner-logo">Rust & WASM Working Group</div>
          <div className="partner-logo">Real-Debrid Infrastructure</div>
        </div>
      </section>

      {/* ŞİRKET KURULUŞ VİZYONU */}
      <section className="corp-section">
        <div style={{ 
          background: "linear-gradient(135deg, rgba(169, 29, 58, 0.12) 0%, rgba(18, 19, 26, 0.8) 100%)",
          border: "1px solid rgba(169, 29, 58, 0.3)",
          borderRadius: "24px",
          padding: "50px 40px",
          display: "grid",
          gridTemplateColumns: "1.2fr 0.8fr",
          gap: "40px",
          alignItems: "center"
        }}>
          <div>
            <span className="corp-section__tag">Kuruluş Hikayemiz</span>
            <h2 style={{ fontSize: "32px", fontWeight: 800, color: "#fff", marginBottom: "16px", lineHeight: 1.2 }}>
              Hantal Yayıncılığa Karşı <br />Saf Mühendislik Yaklaşımı
            </h2>
            <p style={{ color: "#d1d5db", fontSize: "16px", lineHeight: 1.6, marginBottom: "24px" }}>
              Tenett, 2024 yılında İstanbul ve Londra'da bir avuç yayın mühendisi ve sistem mimarı tarafından kuruldu. Amacımız basitti: Yavaşlayan, şişkin reklamlarla dolu ve cihazlar arasında kopuk çalışan medya deneyimlerini yıkıp, sıfır gecikmeli yeni bir standart üretmek.
            </p>
            <div style={{ display: "flex", gap: "16px", flexWrap: "wrap" }}>
              <Link to="/about" className="corp-btn corp-btn--primary">
                Şirket Hikayesini Oku
              </Link>
              <Link to="/contact" className="corp-btn corp-btn--secondary">
                Bizimle İletişime Geçin
              </Link>
            </div>
          </div>

          <div style={{ 
            background: "rgba(0,0,0,0.6)", 
            borderRadius: "16px", 
            padding: "28px", 
            border: "1px solid rgba(255,255,255,0.08)"
          }}>
            <h4 style={{ color: "#fff", fontSize: "16px", fontWeight: 700, marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
              <Zap size={18} color="#A91D3A" /> Kurumsal İlkelerimiz
            </h4>
            <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              <div style={{ display: "flex", gap: "10px" }}>
                <span style={{ color: "#A91D3A", fontWeight: 700 }}>01.</span>
                <span style={{ color: "#e5e7eb", fontSize: "14px" }}><strong>Sıfır Şişkinlik (Zero Bloat):</strong> İzleme akışını bozan gereksiz takipçiler ve ağır katmanlar bulunmaz.</span>
              </div>
              <div style={{ display: "flex", gap: "10px" }}>
                <span style={{ color: "#A91D3A", fontWeight: 700 }}>02.</span>
                <span style={{ color: "#e5e7eb", fontSize: "14px" }}><strong>Medya Özgürlüğü:</strong> Çok kaynaklı mimari ile tek bir sunucuya bağımlı olmayan dağıtık güç.</span>
              </div>
              <div style={{ display: "flex", gap: "10px" }}>
                <span style={{ color: "#A91D3A", fontWeight: 700 }}>03.</span>
                <span style={{ color: "#e5e7eb", fontSize: "14px" }}><strong>Gizlilik Temelli:</strong> İzleme alışkanlıkları satılmaz, yerel profil şifreleme korunur.</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ALT ÇAĞRI (CTA) ALANI */}
      <section className="corp-section" style={{ textAlign: "center", paddingBottom: "100px" }}>
        <h2 style={{ fontSize: "36px", fontWeight: 800, color: "#fff", marginBottom: "16px" }}>
          Tenett Ekosistemini Canlı Olarak Deneyimleyin
        </h2>
        <p style={{ color: "#9ca3af", fontSize: "17px", maxWidth: "600px", margin: "0 auto 32px" }}>
          Şirket sunumumuzun ötesinde, geliştirdiğimiz gerçek çalışan platformu test edebilir; filmleri, canlı kanalları ve arcade oyunlarını deneyebilirsiniz.
        </p>
        <div style={{ display: "flex", justifyContent: "center", gap: "16px", flexWrap: "wrap" }}>
          <Link to="/app" className="corp-btn corp-btn--primary corp-btn--lg">
            <Play size={18} fill="#fff" />
            Canlı Platformu Başlat
          </Link>
          <Link to="/contact" className="corp-btn corp-btn--secondary corp-btn--lg">
            Yatırımcı & Demo İletişimi
          </Link>
        </div>
      </section>
    </div>
  );
}

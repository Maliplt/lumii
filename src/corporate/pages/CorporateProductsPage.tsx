import { Link } from "react-router-dom";
import { Film, Gamepad2, Tv, Database, Cpu, CheckCircle2, Play, Sliders } from "lucide-react";
import ProductVisualMockup from "../components/ProductVisualMockup";
import doomSvg from "../../assets/images/doom.svg";
import game2048 from "../../assets/images/2048.webp";
import blockblast from "../../assets/images/blockblast.webp";
import mahjong from "../../assets/images/mahjong.webp";
import sudoku from "../../assets/images/sudoku.webp";
import kelimezinciri from "../../assets/images/kelimezinciri.webp";

export default function CorporateProductsPage() {
  return (
    <div style={{ paddingBottom: "100px" }}>
      {/* BAŞLIK */}
      <section className="corp-hero" style={{ paddingBottom: "40px" }}>
        <div className="corp-hero__badge-wrap">
          <div className="corp-hero__badge">
            <Cpu size={14} color="#A91D3A" />
            Tenett Ürün & Mimari Portföyü
          </div>
        </div>

        <h1 className="corp-hero__title">
          Bütünleşik Medya ve <br />
          <span className="corp-gradient-text">Yüksek Hızlı Eğlence Teknolojileri</span>
        </h1>

        <p className="corp-hero__subtitle">
          Tenett ürün ailesi; akış gecikmesini minimuma indirmek, cihazlar arası senkronizasyonu mükemmelleştirmek ve medya tüketimini interaktif oyunlarla zenginleştirmek üzere tasarlandı.
        </p>

        <div style={{ display: "flex", justifyContent: "center", gap: "16px", flexWrap: "wrap", marginBottom: "40px" }}>
          <Link to="/app" className="corp-btn corp-btn--app-live corp-btn--lg">
            <span className="corp-pulse-dot"></span>
            Canlı Ortamda Deneyin (Live Platform)
          </Link>
          <a href="#matrix" className="corp-btn corp-btn--secondary corp-btn--lg">
            Teknik Karşılaştırma Matrisi
          </a>
        </div>
      </section>

      {/* İNTERAKTİF GÖRSEL / MOCKUP */}
      <div style={{ maxWidth: "1280px", margin: "0 auto 80px", padding: "0 24px" }}>
        <ProductVisualMockup />
      </div>

      {/* ÜRÜN 1: TENET STREAM OS */}
      <section id="stream-os" className="corp-section">
        <div style={{
          background: "var(--corp-card)",
          border: "1px solid var(--corp-border)",
          borderRadius: "24px",
          padding: "48px",
          display: "grid",
          gridTemplateColumns: "1.2fr 0.8fr",
          gap: "48px",
          alignItems: "center"
        }}>
          <div>
            <div style={{ display: "inline-flex", alignItems: "center", gap: "8px", color: "#A91D3A", fontSize: "12px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "12px" }}>
              <Film size={16} /> Ürün 01 • Akış Çekirdeği
            </div>
            <h2 style={{ fontSize: "32px", fontWeight: 800, color: "#fff", marginBottom: "16px" }}>
              Tenet Stream OS: 4K Ultra-HD Oynatıcı Motoru
            </h2>
            <p style={{ color: "#d1d5db", fontSize: "16px", lineHeight: 1.6, marginBottom: "24px" }}>
              Tenet Stream OS, modern web ve TV tarayıcıları için optimize edilmiş, özel bir HLS.js akış hattıdır. Ağ dalgalanmalarını öngören dinamik adaptif bit hızı (ABR) algoritması sayesinde takılmaları engeller ve 4K 60fps HDR10 renk gamını korur.
            </p>
            
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "28px" }}>
              <div style={{ background: "rgba(255,255,255,0.03)", padding: "16px", borderRadius: "12px", border: "1px solid var(--corp-border)" }}>
                <div style={{ fontSize: "20px", fontWeight: 800, color: "#fff" }}>&lt; 180ms</div>
                <div style={{ fontSize: "12px", color: "#9ca3af", marginTop: "4px" }}>İlk tamponlama başlatma süresi</div>
              </div>
              <div style={{ background: "rgba(255,255,255,0.03)", padding: "16px", borderRadius: "12px", border: "1px solid var(--corp-border)" }}>
                <div style={{ fontSize: "20px", fontWeight: 800, color: "#fff" }}>Dolby 5.1</div>
                <div style={{ fontSize: "12px", color: "#9ca3af", marginTop: "4px" }}>Çoklu ses ve dinamik altyazı desteği</div>
              </div>
            </div>

            <ul style={{ listStyle: "none", padding: 0, margin: "0 0 28px 0", display: "flex", flexDirection: "column", gap: "10px" }}>
              <li style={{ display: "flex", alignItems: "center", gap: "10px", color: "#e5e7eb", fontSize: "14px" }}>
                <CheckCircle2 size={16} color="#2ecc71" /> Otomatik çözünürlük ölçeklendirme (480p, 720p, 1080p, 4K)
              </li>
              <li style={{ display: "flex", alignItems: "center", gap: "10px", color: "#e5e7eb", fontSize: "14px" }}>
                <CheckCircle2 size={16} color="#2ecc71" /> Çoklu ses kanalları arasında kesintisiz anlık geçiş (Türkçe Dublaj / Orijinal)
              </li>
              <li style={{ display: "flex", alignItems: "center", gap: "10px", color: "#e5e7eb", fontSize: "14px" }}>
                <CheckCircle2 size={16} color="#2ecc71" /> WebVTT tabanlı çok dilli ve özelleştirilebilir altyazı motoru
              </li>
            </ul>

            <Link to="/app" className="corp-btn corp-btn--primary">
              <Play size={16} /> Oynatıcıyı Canlı Test Et
            </Link>
          </div>

          <div style={{ background: "#0a0b10", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "16px", padding: "24px" }}>
            <h4 style={{ color: "#fff", fontSize: "14px", fontWeight: 700, marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
              <Sliders size={16} color="#A91D3A" /> Oynatıcı Protokol Mimarisi
            </h4>
            <div style={{ display: "flex", flexDirection: "column", gap: "12px", fontSize: "13px" }}>
              <div style={{ padding: "10px", background: "rgba(255,255,255,0.02)", borderRadius: "8px", borderLeft: "3px solid #A91D3A" }}>
                <strong style={{ color: "#fff" }}>Ingest Katmanı:</strong> Dağıtık HLS parçacıkları & CDN kenar önbelleği.
              </div>
              <div style={{ padding: "10px", background: "rgba(255,255,255,0.02)", borderRadius: "8px", borderLeft: "3px solid #38bdf8" }}>
                <strong style={{ color: "#fff" }}>Bitrate Optimizer:</strong> İstemci bant genişliğine göre 0.1s frekansında ölçüm.
              </div>
              <div style={{ padding: "10px", background: "rgba(255,255,255,0.02)", borderRadius: "8px", borderLeft: "3px solid #10b981" }}>
                <strong style={{ color: "#fff" }}>Donanım Hızlandırma:</strong> WebGL & CSS transform destekli sıfır CPU kaybı.
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ÜRÜN 2: TENET ARCADE ENGINE */}
      <section id="arcade" className="corp-section">
        <div style={{
          background: "var(--corp-card)",
          border: "1px solid var(--corp-border)",
          borderRadius: "24px",
          padding: "48px",
          display: "grid",
          gridTemplateColumns: "0.9fr 1.1fr",
          gap: "48px",
          alignItems: "center"
        }}>
          <div>
            <div style={{ display: "inline-flex", alignItems: "center", gap: "8px", color: "#38bdf8", fontSize: "12px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "12px" }}>
              <Gamepad2 size={16} /> Ürün 02 • Etkileşimli Bulut & WASM
            </div>
            <h2 style={{ fontSize: "32px", fontWeight: 800, color: "#fff", marginBottom: "16px" }}>
              Tenet Arcade: Dahili WebAssembly Oyun Motoru
            </h2>
            <p style={{ color: "#d1d5db", fontSize: "16px", lineHeight: 1.6, marginBottom: "24px" }}>
              Medya izleyicilerinin oturum sürelerini ve etkileşimini artırmak için geliştirilen Tenet Arcade, tarayıcıda doğrudan 60fps çalışan zengin bir oyun kütüphanesi sunar. Hiçbir kurulum, ek eklenti veya bekleme süresi gerekmez.
            </p>

            <ul style={{ listStyle: "none", padding: 0, margin: "0 0 28px 0", display: "flex", flexDirection: "column", gap: "10px" }}>
              <li style={{ display: "flex", alignItems: "center", gap: "10px", color: "#e5e7eb", fontSize: "14px" }}>
                <CheckCircle2 size={16} color="#38bdf8" /> <strong>Doom (WASM):</strong> Efsanevi FPS motorunun C/C++ WebAssembly derlemesi.
              </li>
              <li style={{ display: "flex", alignItems: "center", gap: "10px", color: "#38bdf8", fontSize: "14px" }}>
                <CheckCircle2 size={16} color="#38bdf8" /> <strong>Zeka & Bulmaca Serisi:</strong> Block Bloom, 2048, Sudoku, Mahjong Sanctuary.
              </li>
              <li style={{ display: "flex", alignItems: "center", gap: "10px", color: "#38bdf8", fontSize: "14px" }}>
                <CheckCircle2 size={16} color="#38bdf8" /> <strong>Türkçe Kelime Zinciri:</strong> Geniş lügat veritabanıyla yerel rekabet modu.
              </li>
            </ul>

            <Link to="/app" className="corp-btn corp-btn--secondary">
              Arcade Kütüphanesini Canlı Dene &gt;
            </Link>
          </div>

          {/* Arcade Görsel Galerisi */}
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: "12px",
            background: "#08090d",
            padding: "20px",
            borderRadius: "18px",
            border: "1px solid rgba(255,255,255,0.08)"
          }}>
            <div style={{ background: "#11131a", borderRadius: "10px", padding: "12px", textAlign: "center", border: "1px solid rgba(255,255,255,0.05)" }}>
              <img src={doomSvg} alt="Doom" style={{ height: "48px", margin: "8px auto" }} />
              <div style={{ fontSize: "12px", fontWeight: 700, color: "#fff", marginTop: "8px" }}>Doom WASM</div>
              <div style={{ fontSize: "10px", color: "#9ca3af" }}>3D Retro FPS</div>
            </div>
            <div style={{ background: "#11131a", borderRadius: "10px", padding: "12px", textAlign: "center", border: "1px solid rgba(255,255,255,0.05)" }}>
              <img src={blockblast} alt="Block Bloom" style={{ width: "100%", aspectRatio: 1, objectFit: "cover", borderRadius: "6px" }} />
              <div style={{ fontSize: "12px", fontWeight: 700, color: "#fff", marginTop: "8px" }}>Block Bloom</div>
              <div style={{ fontSize: "10px", color: "#9ca3af" }}>Blok Bulmaca</div>
            </div>
            <div style={{ background: "#11131a", borderRadius: "10px", padding: "12px", textAlign: "center", border: "1px solid rgba(255,255,255,0.05)" }}>
              <img src={game2048} alt="2048" style={{ width: "100%", aspectRatio: 1, objectFit: "cover", borderRadius: "6px" }} />
              <div style={{ fontSize: "12px", fontWeight: 700, color: "#fff", marginTop: "8px" }}>2048</div>
              <div style={{ fontSize: "10px", color: "#9ca3af" }}>Matematik & Mantık</div>
            </div>
            <div style={{ background: "#11131a", borderRadius: "10px", padding: "12px", textAlign: "center", border: "1px solid rgba(255,255,255,0.05)" }}>
              <img src={mahjong} alt="Mahjong" style={{ width: "100%", aspectRatio: 1, objectFit: "cover", borderRadius: "6px" }} />
              <div style={{ fontSize: "12px", fontWeight: 700, color: "#fff", marginTop: "8px" }}>Mahjong</div>
              <div style={{ fontSize: "10px", color: "#9ca3af" }}>Sanctuary Karo Eşle</div>
            </div>
            <div style={{ background: "#11131a", borderRadius: "10px", padding: "12px", textAlign: "center", border: "1px solid rgba(255,255,255,0.05)" }}>
              <img src={sudoku} alt="Sudoku" style={{ width: "100%", aspectRatio: 1, objectFit: "cover", borderRadius: "6px" }} />
              <div style={{ fontSize: "12px", fontWeight: 700, color: "#fff", marginTop: "8px" }}>Sudoku</div>
              <div style={{ fontSize: "10px", color: "#9ca3af" }}>Çok Seviyeli Rakam</div>
            </div>
            <div style={{ background: "#11131a", borderRadius: "10px", padding: "12px", textAlign: "center", border: "1px solid rgba(255,255,255,0.05)" }}>
              <img src={kelimezinciri} alt="Kelime Zinciri" style={{ width: "100%", aspectRatio: 1, objectFit: "cover", borderRadius: "6px" }} />
              <div style={{ fontSize: "12px", fontWeight: 700, color: "#fff", marginTop: "8px" }}>Kelime Zinciri</div>
              <div style={{ fontSize: "10px", color: "#9ca3af" }}>Sözlük Eşleme</div>
            </div>
          </div>
        </div>
      </section>

      {/* ÜRÜN 3 & 4: TV HUB & DEBRID MULTI-SOURCE */}
      <section className="corp-section">
        <div className="corp-products-grid">
          {/* TV Hub */}
          <div id="tv-hub" className="corp-product-card">
            <div className="corp-product-card__icon-box" style={{ background: "rgba(245, 158, 11, 0.15)", borderColor: "rgba(245, 158, 11, 0.3)", color: "#f59e0b" }}>
              <Tv size={26} />
            </div>
            <div className="corp-product-card__category" style={{ color: "#f59e0b" }}>Büyük Ekran Teknolojisi</div>
            <h3 className="corp-product-card__title">Tenet TV & Leanback Modu</h3>
            <p className="corp-product-card__desc">
              Televizyon kumandaları için D-Pad odak yönetimli 10-foot arayüzü. Viewport kilitleme mekanizması sayesinde Android TV, Apple TV tarayıcıları ve akıllı televizyonlarda sarsıntısız sinema keyfi.
            </p>
            <ul className="corp-product-card__features">
              <li><CheckCircle2 size={16} /> Kumanda yön tuşlarıyla %100 klavyesiz gezinme</li>
              <li><CheckCircle2 size={16} /> Canlı TV kanalları için anlık EPG ve rehber görünümü</li>
              <li><CheckCircle2 size={16} /> Ekran koruyucu ve odak sabitleme koruması</li>
            </ul>
            <div style={{ marginTop: "auto" }}>
              <Link to="/app" className="corp-btn corp-btn--secondary" style={{ width: "100%" }}>
                TV Arayüzünü Test Et &gt;
              </Link>
            </div>
          </div>

          {/* Debrid Multi-Source */}
          <div id="debrid" className="corp-product-card">
            <div className="corp-product-card__icon-box" style={{ background: "rgba(16, 185, 129, 0.15)", borderColor: "rgba(16, 185, 129, 0.3)", color: "#10b981" }}>
              <Database size={26} />
            </div>
            <div className="corp-product-card__category" style={{ color: "#10b981" }}>Protokol Katmanı</div>
            <h3 className="corp-product-card__title">Debrid Core & Akıllı Yönlendirme</h3>
            <p className="corp-product-card__desc">
              Kullanıcının seçtiği içeriğe göre en yakın ve en yüksek bant genişliğine sahip sunucuları anlık olarak puanlayan akıllı eşleştirme algoritması.
            </p>
            <ul className="corp-product-card__features">
              <li><CheckCircle2 size={16} /> Real-Debrid ve Torrentio API entegrasyonu</li>
              <li><CheckCircle2 size={16} /> Çoklu CDN yük dengeleme ve sıfır darboğaz</li>
              <li><CheckCircle2 size={16} /> TMDB anlık görsel, kadro ve özet zenginleştirme</li>
            </ul>
            <div style={{ marginTop: "auto" }}>
              <Link to="/app" className="corp-btn corp-btn--secondary" style={{ width: "100%" }}>
                Kaynak Yönlendiriciyi İncele &gt;
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* KARŞILAŞTIRMA MATRİSİ */}
      <section id="matrix" className="corp-section">
        <div className="corp-section__header">
          <span className="corp-section__tag">Teknoloji Kıyaslaması</span>
          <h2 className="corp-section__title">Neden Tenett Mimarisi Farklı?</h2>
          <p className="corp-section__desc">
            Geleneksel medya akış platformları ile Tenett'in saf mühendislik odaklı mimarisinin doğrudan karşılaştırması.
          </p>
        </div>

        <div style={{
          overflowX: "auto",
          background: "var(--corp-card)",
          border: "1px solid var(--corp-border)",
          borderRadius: "16px",
          padding: "24px"
        }}>
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "680px", fontSize: "14px", textAlign: "left" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--corp-border)", color: "#9ca3af" }}>
                <th style={{ padding: "16px" }}>Özellik / Yetenek</th>
                <th style={{ padding: "16px", color: "#A91D3A", fontWeight: 800 }}>Tenett Stream OS</th>
                <th style={{ padding: "16px" }}>Klasik Web Oyuncuları</th>
                <th style={{ padding: "16px" }}>Geleneksel IPTV Kutuları</th>
              </tr>
            </thead>
            <tbody>
              <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                <td style={{ padding: "16px", color: "#fff", fontWeight: 600 }}>İlk Kare Başlatma Hızı</td>
                <td style={{ padding: "16px", color: "#2ecc71", fontWeight: 700 }}>&lt; 180 ms</td>
                <td style={{ padding: "16px", color: "#9ca3af" }}>1.8 - 3.5 saniye</td>
                <td style={{ padding: "16px", color: "#9ca3af" }}>4.0 - 8.0 saniye</td>
              </tr>
              <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                <td style={{ padding: "16px", color: "#fff", fontWeight: 600 }}>Entegre Oyun Deneyimi</td>
                <td style={{ padding: "16px", color: "#2ecc71", fontWeight: 700 }}>Dahili 7+ WASM Oyunu</td>
                <td style={{ padding: "16px", color: "#ef4444" }}>Yok</td>
                <td style={{ padding: "16px", color: "#ef4444" }}>Ayrı Cihaz Gerekir</td>
              </tr>
              <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                <td style={{ padding: "16px", color: "#fff", fontWeight: 600 }}>Akıllı Debrid & CDN Seçimi</td>
                <td style={{ padding: "16px", color: "#2ecc71", fontWeight: 700 }}>Otomatik Çoklu Kaynak</td>
                <td style={{ padding: "16px", color: "#ef4444" }}>Tek Sunucu / Darboğaz</td>
                <td style={{ padding: "16px", color: "#ef4444" }}>Sabit M3U Sunucusu</td>
              </tr>
              <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                <td style={{ padding: "16px", color: "#fff", fontWeight: 600 }}>TV Kumanda & Viewport Kilidi</td>
                <td style={{ padding: "16px", color: "#2ecc71", fontWeight: 700 }}>Yerel Focus Yönetimi</td>
                <td style={{ padding: "16px", color: "#ef4444" }}>Fare / Dokunmatik Zorunlu</td>
                <td style={{ padding: "16px", color: "#9ca3af" }}>Kaba TV Arayüzü</td>
              </tr>
              <tr>
                <td style={{ padding: "16px", color: "#fff", fontWeight: 600 }}>Gizlilik & Takip Koruması</td>
                <td style={{ padding: "16px", color: "#2ecc71", fontWeight: 700 }}>Sıfır Üçüncü Parti İzleyici</td>
                <td style={{ padding: "16px", color: "#ef4444" }}>20+ Reklam Takipçisi</td>
                <td style={{ padding: "16px", color: "#9ca3af" }}>Belirsiz</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

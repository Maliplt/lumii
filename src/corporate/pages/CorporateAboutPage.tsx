import { Link } from "react-router-dom";
import { Globe, Target, Building2, MapPin, CheckCircle2 } from "lucide-react";

export default function CorporateAboutPage() {
  return (
    <div style={{ paddingBottom: "100px" }}>
      {/* BAŞLIK */}
      <section className="corp-hero" style={{ paddingBottom: "40px" }}>
        <div className="corp-hero__badge-wrap">
          <div className="corp-hero__badge">
            <Building2 size={14} color="#A91D3A" />
            Şirket Tarihçesi & Kurumsal Kimlik
          </div>
        </div>

        <h1 className="corp-hero__title">
          Medya Özgürlüğü ve <br />
          <span className="corp-gradient-text">Yüksek Mühendislik Kültürü</span>
        </h1>

        <p className="corp-hero__subtitle">
          Tenett; 2024 yılında İstanbul ve Londra merkezli olarak, geleneksel yayıncılığın hantal altyapısını ve karmaşık tüketim alışkanlıklarını saf performansla değiştirmek üzere kuruldu.
        </p>
      </section>

      {/* KURULUŞ HİKAYESİ & MİSYON */}
      <section className="corp-section">
        <div style={{
          display: "grid",
          gridTemplateColumns: "1.1fr 0.9fr",
          gap: "48px",
          alignItems: "center",
          marginBottom: "80px"
        }}>
          <div>
            <span className="corp-section__tag">Kuruluş Vizyonu</span>
            <h2 style={{ fontSize: "34px", fontWeight: 800, color: "#fff", marginBottom: "20px", lineHeight: 1.2 }}>
              Neden Tenett'i Kurduk?
            </h2>
            <p style={{ color: "#d1d5db", fontSize: "16px", lineHeight: 1.7, marginBottom: "16px" }}>
              2020'lerin ortalarında dijital eğlence dünyası beklenmedik bir krizle karşılaştı: Kullanıcılar dizi ve filmler için onlarca farklı aboneliğe bölünmüş, her platform kendi ağır, yavaş ve reklam dolu arayüzünü dayatmaya başlamıştı.
            </p>
            <p style={{ color: "#d1d5db", fontSize: "16px", lineHeight: 1.7, marginBottom: "20px" }}>
              Bizler ise eğlencenin tıpkı modern bir işletim sistemi gibi hızlı, minimalist ve kesintisiz olması gerektiğine inandık. Bir video oynatıcısının 200 milisaniye altında başlaması, tek bir arayüzden hem 4K sinemaya hem de WebAssembly mini oyunlarına erişilebilmesi mümkündü. Tenett işte bu mühendislik inancının sonucudur.
            </p>
            <div style={{ display: "flex", gap: "16px" }}>
              <Link to="/products" className="corp-btn corp-btn--primary">
                Ürün Ekosistemimiz
              </Link>
              <Link to="/investors" className="corp-btn corp-btn--secondary">
                Yatırımcı Raporu
              </Link>
            </div>
          </div>

          <div style={{
            background: "var(--corp-card)",
            border: "1px solid var(--corp-border)",
            borderRadius: "20px",
            padding: "36px",
            boxShadow: "0 20px 40px rgba(0,0,0,0.5)"
          }}>
            <h3 style={{ color: "#fff", fontSize: "18px", fontWeight: 700, marginBottom: "20px", display: "flex", alignItems: "center", gap: "8px" }}>
              <Target size={20} color="#A91D3A" /> Misyon & Temel Taahhütlerimiz
            </h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div style={{ display: "flex", gap: "12px" }}>
                <CheckCircle2 size={18} color="#2ecc71" style={{ flexShrink: 0, marginTop: "2px" }} />
                <div>
                  <strong style={{ color: "#fff" }}>Sıfır Gecikme Politikası:</strong>
                  <p style={{ color: "#9ca3af", fontSize: "13px", margin: "4px 0 0" }}>Tüm oynatıcı hattı 60fps akıcılığı ve anlık tepki süresini hedefleyecek şekilde optimize edilir.</p>
                </div>
              </div>
              <div style={{ display: "flex", gap: "12px" }}>
                <CheckCircle2 size={18} color="#2ecc71" style={{ flexShrink: 0, marginTop: "2px" }} />
                <div>
                  <strong style={{ color: "#fff" }}>Dağıtık ve Dayanıklı Altyapı:</strong>
                  <p style={{ color: "#9ca3af", fontSize: "13px", margin: "4px 0 0" }}>Tek bir sunucu merkezine bağımlı olmayan çoklu CDN ve debrid tamponlama mimarisi.</p>
                </div>
              </div>
              <div style={{ display: "flex", gap: "12px" }}>
                <CheckCircle2 size={18} color="#2ecc71" style={{ flexShrink: 0, marginTop: "2px" }} />
                <div>
                  <strong style={{ color: "#fff" }}>Eğlencede Bütünlük:</strong>
                  <p style={{ color: "#9ca3af", fontSize: "13px", margin: "4px 0 0" }}>Film izleme ile oyun oynama arasındaki sınırları kaldıran akıllı salon deneyimi.</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ZAMAN ÇİZELGESİ (TIMELINE) */}
        <div className="corp-section__header">
          <span className="corp-section__tag">Kilometre Taşları</span>
          <h2 className="corp-section__title">Şirket Yolculuğumuz</h2>
          <p className="corp-section__desc">
            Fikir aşamasından yüz binlerce aktif akışa uzanan mühendislik serüvenimiz.
          </p>
        </div>

        <div className="corp-timeline">
          <div className="corp-timeline__item">
            <div className="corp-timeline__year">Ocak 2024</div>
            <h3 className="corp-timeline__title">Şirket Kuruluşu ve Çekirdek Ekip</h3>
            <p className="corp-timeline__text">
              Tenett Medya Teknolojileri A.Ş. İstanbul Maslak'ta ve Tenett Technologies Ltd. Londra'da tescillendi. Dağıtık medya akışı için ilk Ar-Ge laboratuvarı kuruldu.
            </p>
          </div>

          <div className="corp-timeline__item">
            <div className="corp-timeline__year">Eylül 2024</div>
            <h3 className="corp-timeline__title">Pre-Seed Yatırım Turu ($450K)</h3>
            <p className="corp-timeline__text">
              Önde gelen medya ve teknoloji meleklerinin katılımıyla 450.000 dolarlık ilk tohum öncesi sermaye tamamlandı. Tenet Stream OS v1.0 özel testlere açıldı.
            </p>
          </div>

          <div className="corp-timeline__item">
            <div className="corp-timeline__year">Mart 2025</div>
            <h3 className="corp-timeline__title">Tenet Arcade ve WebAssembly Atılımı</h3>
            <p className="corp-timeline__text">
              Klasik Doom (WASM) ve bulmaca serisinin platforma entegre edilmesiyle medya akışının yanına sıfır kurulumlu anında oyun motoru eklendi.
            </p>
          </div>

          <div className="corp-timeline__item">
            <div className="corp-timeline__year">Haziran 2025</div>
            <h3 className="corp-timeline__title">Seed Round ($1.8M) & Multi-Debrid Entegrasyonu</h3>
            <p className="corp-timeline__text">
              Scale Media Partners ve Emerging Digital Ventures liderliğinde 1.8 milyon dolarlık Tohum Yatırım turu kapatıldı. Real-Debrid ve Torrentio akıllı önbellek mimarisi devreye alındı.
            </p>
          </div>

          <div className="corp-timeline__item">
            <div className="corp-timeline__year">2026 (Günümüz)</div>
            <h3 className="corp-timeline__title">Tenet v2.6 ve Smart TV Ekosistemi</h3>
            <p className="corp-timeline__text">
              React 19, Vite ve TV Viewport kilitleme teknolojileriyle donatılan yeni nesil platform; akıllı televizyonlar, tabletler ve bilgisayarlarda 100K+ eşzamanlı izleyiciye ulaştı.
            </p>
          </div>
        </div>
      </section>

      {/* EKİP & LİDERLİK */}
      <section id="team" className="corp-section">
        <div className="corp-section__header">
          <span className="corp-section__tag">Liderlik & Mühendislik</span>
          <h2 className="corp-section__title">Sistemlerimizi İnşa Eden Ekip</h2>
          <p className="corp-section__desc">
            Yüksek hacimli dağıtık ağlar, video codec mimarileri ve interaktif oyun sistemlerinde deneyimli lider kadromuz.
          </p>
        </div>

        <div className="corp-team-grid">
          <div className="corp-team-card">
            <div className="corp-team-card__avatar">P.O.</div>
            <h3 className="corp-team-card__name">Polat Ö.</h3>
            <div className="corp-team-card__role">Kurucu Ortak & CEO</div>
            <p className="corp-team-card__bio">
              Yüksek performanslı medya sistemleri mimarı. Tenett'in genel ürün vizyonunu ve uluslararası genişleme stratejisini yönetir.
            </p>
          </div>

          <div className="corp-team-card">
            <div className="corp-team-card__avatar">K.E.</div>
            <h3 className="corp-team-card__name">Kaan E.</h3>
            <div className="corp-team-card__role">CTO & Streaming Systems Lead</div>
            <p className="corp-team-card__bio">
              Düşük gecikmeli HLS, WebRTC ve video codec uzmanı. Tenet Stream OS'in mikro-mimari çekirdeğini yönetir.
            </p>
          </div>

          <div className="corp-team-card">
            <div className="corp-team-card__avatar">D.S.</div>
            <h3 className="corp-team-card__name">Deniz S.</h3>
            <div className="corp-team-card__role">Head of Product & Design</div>
            <p className="corp-team-card__bio">
              TV Focus modu, 10-foot oturma odası deneyimi ve minimalist kullanıcı arayüzü ekibinin lideri.
            </p>
          </div>

          <div className="corp-team-card">
            <div className="corp-team-card__avatar">A.B.</div>
            <h3 className="corp-team-card__name">Ali B.</h3>
            <div className="corp-team-card__role">WASM & Gaming Architecture Lead</div>
            <p className="corp-team-card__bio">
              C/C++ WebAssembly derleyicileri ve tarayıcı içi yüksek kare hızlı mikro-oyun sistemleri kıdemli mühendisi.
            </p>
          </div>
        </div>
      </section>

      {/* MERKEZLER & YASAL VARLIK */}
      <section className="corp-section">
        <div style={{
          background: "rgba(255, 255, 255, 0.02)",
          border: "1px solid var(--corp-border)",
          borderRadius: "20px",
          padding: "40px",
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "32px"
        }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#A91D3A", fontSize: "14px", fontWeight: 700, marginBottom: "12px" }}>
              <MapPin size={18} /> İstanbul Ar-Ge & Operasyon Merkezi
            </div>
            <h4 style={{ color: "#fff", fontSize: "18px", fontWeight: 700, marginBottom: "8px" }}>Tenett Medya Teknolojileri A.Ş.</h4>
            <p style={{ color: "#9ca3af", fontSize: "14px", lineHeight: 1.6 }}>
              Maslak Mah. Büyükdere Cad. No: 255, Spine Tower Plaza Kat: 18, Sarıyer / İstanbul<br />
              Ticaret Sicil No: 489201-5 • Maslak Vergi Dairesi
            </p>
          </div>

          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#38bdf8", fontSize: "14px", fontWeight: 700, marginBottom: "12px" }}>
              <Globe size={18} /> Global & Investor Entity
            </div>
            <h4 style={{ color: "#fff", fontSize: "18px", fontWeight: 700, marginBottom: "8px" }}>Tenett Technologies Ltd.</h4>
            <p style={{ color: "#9ca3af", fontSize: "14px", lineHeight: 1.6 }}>
              128 City Road, EC1V 2NX, London, United Kingdom<br />
              Companies House Reg: #15894120 • European Media Alliance Member
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}

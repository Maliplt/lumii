import { useState } from "react";
import { Link } from "react-router-dom";
import { TrendingUp, ShieldCheck, Download, CheckCircle2 } from "lucide-react";

export default function CorporateInvestorsPage() {
  const [deckRequested, setDeckRequested] = useState(false);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [firm, setFirm] = useState("");

  const handleDeckSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setDeckRequested(true);
  };

  return (
    <div style={{ paddingBottom: "100px" }}>
      {/* BAŞLIK */}
      <section className="corp-hero" style={{ paddingBottom: "40px" }}>
        <div className="corp-hero__badge-wrap">
          <div className="corp-hero__badge">
            <TrendingUp size={14} color="#A91D3A" />
            Yatırımcı İlişkileri & Sermaye Büyümesi
          </div>
        </div>

        <h1 className="corp-hero__title">
          Yüksek Büyümeli Medya Altyapısı ve <br />
          <span className="corp-gradient-text">Stratejik Yatırım Turları</span>
        </h1>

        <p className="corp-hero__subtitle">
          Tenett; güçlü birim ekonomisi, dağıtık teknoloji sayesinde sağlanan %70 daha düşük CDN maliyeti ve yüksek kullanıcı bağlılığıyla hızla ölçeklenmektedir.
        </p>

        <div style={{ display: "flex", justifyContent: "center", gap: "16px", flexWrap: "wrap", marginBottom: "30px" }}>
          <a href="#deck" className="corp-btn corp-btn--primary corp-btn--lg">
            <Download size={16} /> Pitch Deck & Finansal Model Talep Et
          </a>
          <Link to="/app" className="corp-btn corp-btn--app-live corp-btn--lg">
            <span className="corp-pulse-dot"></span>
            Canlı Ürünü İncele (Demo)
          </Link>
        </div>
      </section>

      {/* YATIRIM TURLARI & GEÇMİŞİ */}
      <section className="corp-section">
        <div className="corp-section__header">
          <span className="corp-section__tag">Finansman Geçmişi</span>
          <h2 className="corp-section__title">Alınan Yatırımlar & Sermaye Dağılımı</h2>
          <p className="corp-section__desc">
            Kuruluşumuzdan bu yana toplam 2.25 milyon dolar kurumsal ve melek sermaye toplandı.
          </p>
        </div>

        <div className="corp-investor-grid">
          {/* Tur 1: Pre-Seed */}
          <div className="corp-investor-card">
            <div className="corp-investor-card__stage">Tohum Öncesi (Pre-Seed)</div>
            <div className="corp-investor-card__amount">$450.000</div>
            <div className="corp-investor-card__date">Eylül 2024 • Başarıyla Kapatıldı</div>
            <p className="corp-investor-card__desc">
              Patentli düşük gecikmeli oynatıcı mimarisi, Rust/WebAssembly oyun köprüsü ve ilk istemci prototiplerinin geliştirilmesi.
            </p>
            <div className="corp-investor-card__leads">
              Lider Katılımcılar:
              <strong>MediaTech Angels Network & Erken Aşama Melekleri</strong>
            </div>
          </div>

          {/* Tur 2: Seed Round */}
          <div className="corp-investor-card" style={{ border: "2px solid #A91D3A", background: "rgba(22, 18, 26, 0.9)" }}>
            <div style={{ position: "absolute", top: "16px", right: "16px", background: "#A91D3A", color: "#fff", fontSize: "10px", fontWeight: 800, padding: "2px 8px", borderRadius: "999px" }}>
              ÖNE ÇIKAN TUR
            </div>
            <div className="corp-investor-card__stage">Tohum Yatırım (Seed Round)</div>
            <div className="corp-investor-card__amount">$1.800.000</div>
            <div className="corp-investor-card__date">Haziran 2025 • Kapatıldı</div>
            <p className="corp-investor-card__desc">
              Multi-Debrid ve Torrentio akıllı önbellek ağının genişletilmesi, Smart TV optimizasyonları ve Avrupa pazar lansmanı.
            </p>
            <div className="corp-investor-card__leads">
              Lider VC & Sendikalar:
              <strong>Scale Media Partners & Emerging Digital Ventures</strong>
            </div>
          </div>

          {/* Tur 3: Pre-Series A / Büyüme */}
          <div className="corp-investor-card">
            <div className="corp-investor-card__stage">Genişleme Hedefi (Series A Hazırlığı)</div>
            <div className="corp-investor-card__amount">$4.500.000</div>
            <div className="corp-investor-card__date">2026 Q4 / 2027 Q1 Hedef Turu</div>
            <p className="corp-investor-card__desc">
              Smart TV mağaza dağıtımı (LG WebOS, Samsung Tizen), telco operatör entegrasyonları ve B2B whitelabel lisanslama altyapısı.
            </p>
            <div className="corp-investor-card__leads">
              Durum:
              <strong>Stratejik Kurumsal Görüşmeler Devam Ediyor</strong>
            </div>
          </div>
        </div>
      </section>

      {/* METRİKLER & BİRİM EKONOMİSİ */}
      <section id="metrics" className="corp-section">
        <div className="corp-section__header">
          <span className="corp-section__tag">Büyüme Göstergeleri</span>
          <h2 className="corp-section__title">Ölçeklenme ve Temel Metrikler (KPIs)</h2>
          <p className="corp-section__desc">
            Güçlü tutundurma ve düşük müşteri edinme maliyetiyle sektör ortalamasının üzerinde performans.
          </p>
        </div>

        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: "20px",
          marginBottom: "60px"
        }}>
          <div style={{ background: "var(--corp-card)", border: "1px solid var(--corp-border)", borderRadius: "16px", padding: "24px", textAlign: "center" }}>
            <div style={{ fontSize: "36px", fontWeight: 800, color: "#fff" }}>%86.4</div>
            <div style={{ fontSize: "13px", color: "#2ecc71", fontWeight: 600, marginTop: "4px" }}>30 Günlük Tutundurma (Retention)</div>
            <p style={{ fontSize: "12px", color: "#9ca3af", marginTop: "8px" }}>Sektör ortalaması %62</p>
          </div>

          <div style={{ background: "var(--corp-card)", border: "1px solid var(--corp-border)", borderRadius: "16px", padding: "24px", textAlign: "center" }}>
            <div style={{ fontSize: "36px", fontWeight: 800, color: "#fff" }}>3.4 Saat</div>
            <div style={{ fontSize: "13px", color: "#38bdf8", fontWeight: 600, marginTop: "4px" }}>Günlük Ortalama İzleme & Oyun</div>
            <p style={{ fontSize: "12px", color: "#9ca3af", marginTop: "8px" }}>Arcade entegrasyonu oturum süresini %40 artırdı</p>
          </div>

          <div style={{ background: "var(--corp-card)", border: "1px solid var(--corp-border)", borderRadius: "16px", padding: "24px", textAlign: "center" }}>
            <div style={{ fontSize: "36px", fontWeight: 800, color: "#fff" }}>-%72</div>
            <div style={{ fontSize: "13px", color: "#A91D3A", fontWeight: 600, marginTop: "4px" }}>Bant Genişliği Maliyeti</div>
            <p style={{ fontSize: "12px", color: "#9ca3af", marginTop: "8px" }}>Akıllı debrid önbellekleme sayesinde</p>
          </div>

          <div style={{ background: "var(--corp-card)", border: "1px solid var(--corp-border)", borderRadius: "16px", padding: "24px", textAlign: "center" }}>
            <div style={{ fontSize: "36px", fontWeight: 800, color: "#fff" }}>4.8x</div>
            <div style={{ fontSize: "13px", color: "#f59e0b", fontWeight: 600, marginTop: "4px" }}>LTV / CAC Oranı</div>
            <p style={{ fontSize: "12px", color: "#9ca3af", marginTop: "8px" }}>Yüksek organik kullanıcı tavsiyesi</p>
          </div>
        </div>

        {/* Sermaye Kullanım Planı & Grafik Temsili */}
        <div style={{
          background: "var(--corp-card)",
          border: "1px solid var(--corp-border)",
          borderRadius: "20px",
          padding: "36px",
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "40px",
          alignItems: "center"
        }}>
          <div>
            <h3 style={{ fontSize: "22px", fontWeight: 700, color: "#fff", marginBottom: "16px" }}>
              Sermaye Kullanım Dağılımı (Allocation)
            </h3>
            <p style={{ color: "#d1d5db", fontSize: "15px", lineHeight: 1.6, marginBottom: "20px" }}>
              Alınan yatırımların her doları, platformun teknolojik üstünlüğünü ve sunucu maliyet avantajını korumak üzere titizlikle harcanmaktadır.
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", marginBottom: "4px" }}>
                  <span>%45 • Ar-Ge, Oynatıcı & WASM Mühendisliği</span>
                  <strong>$810.000</strong>
                </div>
                <div style={{ height: "6px", background: "rgba(255,255,255,0.1)", borderRadius: "3px", overflow: "hidden" }}>
                  <div style={{ width: "45%", height: "100%", background: "#A91D3A" }}></div>
                </div>
              </div>

              <div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", marginBottom: "4px" }}>
                  <span>%25 • Dağıtık CDN & Çoklu Sunucu Altyapısı</span>
                  <strong>$450.000</strong>
                </div>
                <div style={{ height: "6px", background: "rgba(255,255,255,0.1)", borderRadius: "3px", overflow: "hidden" }}>
                  <div style={{ width: "25%", height: "100%", background: "#38bdf8" }}></div>
                </div>
              </div>

              <div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", marginBottom: "4px" }}>
                  <span>%15 • Smart TV Mağaza Lisansları & Yayın Uyumu</span>
                  <strong>$270.000</strong>
                </div>
                <div style={{ height: "6px", background: "rgba(255,255,255,0.1)", borderRadius: "3px", overflow: "hidden" }}>
                  <div style={{ width: "15%", height: "100%", background: "#2ecc71" }}></div>
                </div>
              </div>

              <div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", marginBottom: "4px" }}>
                  <span>%15 • Büyüme & Avrupa Pazar Genişlemesi</span>
                  <strong>$270.000</strong>
                </div>
                <div style={{ height: "6px", background: "rgba(255,255,255,0.1)", borderRadius: "3px", overflow: "hidden" }}>
                  <div style={{ width: "15%", height: "100%", background: "#f59e0b" }}></div>
                </div>
              </div>
            </div>
          </div>

          <div style={{ background: "#0a0b10", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "16px", padding: "28px" }}>
            <h4 style={{ color: "#fff", fontSize: "16px", fontWeight: 700, marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
              <ShieldCheck size={18} color="#2ecc71" /> Kurumsal Yönetim & Güvenceler
            </h4>
            <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "12px", fontSize: "14px", color: "#d1d5db" }}>
              <li style={{ display: "flex", gap: "10px" }}>
                <CheckCircle2 size={16} color="#2ecc71" style={{ flexShrink: 0, marginTop: "2px" }} />
                <span>İngiltere (UK) ve Türkiye çift tescilli kurumsal yapı ve şeffaf denetim.</span>
              </li>
              <li style={{ display: "flex", gap: "10px" }}>
                <CheckCircle2 size={16} color="#2ecc71" style={{ flexShrink: 0, marginTop: "2px" }} />
                <span>Çeyreklik bağımsız finansal raporlama ve yatırımcı bilgilendirme bülteni.</span>
              </li>
              <li style={{ display: "flex", gap: "10px" }}>
                <CheckCircle2 size={16} color="#2ecc71" style={{ flexShrink: 0, marginTop: "2px" }} />
                <span>Tüm fikri mülkiyet ve oynatıcı kaynak kodları tescil altındadır.</span>
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* PITCH DECK & İLETİŞİM ALANI */}
      <section id="deck" className="corp-section">
        <div style={{
          background: "linear-gradient(135deg, rgba(169, 29, 58, 0.2) 0%, rgba(10, 11, 16, 0.9) 100%)",
          border: "1px solid rgba(169, 29, 58, 0.4)",
          borderRadius: "24px",
          padding: "50px",
          maxWidth: "840px",
          margin: "0 auto",
          textAlign: "center"
        }}>
          <h2 style={{ fontSize: "32px", fontWeight: 800, color: "#fff", marginBottom: "14px" }}>
            Yatırımcı Dosyası ve Finansal Modeli Talep Edin
          </h2>
          <p style={{ color: "#d1d5db", fontSize: "16px", marginBottom: "32px", maxWidth: "600px", margin: "0 auto 32px" }}>
            Kurumsal yatırımcılar, fon yöneticileri ve stratejik ortaklar için hazırlanan detaylı Pitch Deck, birim ekonomi tablosu ve teknik mimari dökümanı.
          </p>

          {deckRequested ? (
            <div style={{ background: "rgba(46, 204, 113, 0.15)", border: "1px solid #2ecc71", borderRadius: "12px", padding: "20px", color: "#2ecc71", fontWeight: 600 }}>
              ✓ Talebiniz alındı. Yetkili yatırımcı dökümanları {email} adresine iletilecektir.
            </div>
          ) : (
            <form onSubmit={handleDeckSubmit} style={{ display: "flex", flexDirection: "column", gap: "14px", maxWidth: "480px", margin: "0 auto" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <input 
                  type="text" 
                  placeholder="Ad Soyad"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  style={{ background: "#06070a", border: "1px solid var(--corp-border)", borderRadius: "8px", padding: "12px", color: "#fff", fontSize: "14px" }}
                />
                <input 
                  type="text" 
                  placeholder="Fon / Kurum Adı"
                  value={firm}
                  onChange={(e) => setFirm(e.target.value)}
                  required
                  style={{ background: "#06070a", border: "1px solid var(--corp-border)", borderRadius: "8px", padding: "12px", color: "#fff", fontSize: "14px" }}
                />
              </div>

              <input 
                type="email" 
                placeholder="Kurumsal E-posta Adresi (ör. ad@venture.com)"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                style={{ background: "#06070a", border: "1px solid var(--corp-border)", borderRadius: "8px", padding: "12px", color: "#fff", fontSize: "14px" }}
              />

              <button type="submit" className="corp-btn corp-btn--primary corp-btn--lg" style={{ width: "100%", justifyContent: "center" }}>
                <Download size={18} /> Dosyayı Talep Et (PDF)
              </button>
            </form>
          )}

          <div style={{ marginTop: "24px", fontSize: "12px", color: "#9ca3af" }}>
            Doğrudan yatırımcı ilişkileri ekibiyle görüşmek için: <a href="mailto:investors@tenett.media" style={{ color: "#ff8097" }}>investors@tenett.media</a>
          </div>
        </div>
      </section>
    </div>
  );
}

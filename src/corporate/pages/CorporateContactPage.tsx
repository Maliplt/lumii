import { useState } from "react";
import { Link } from "react-router-dom";
import { Mail, MapPin, Globe, Send, CheckCircle2, Download } from "lucide-react";
import tenetLogo from "../../assets/images/tenet-logo.svg";

export default function CorporateContactPage() {
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    company: "",
    topic: "yatirim",
    message: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.email || !formData.name) return;
    setSubmitted(true);
  };

  return (
    <div style={{ paddingBottom: "100px" }}>
      {/* BAŞLIK */}
      <section className="corp-hero" style={{ paddingBottom: "40px" }}>
        <div className="corp-hero__badge-wrap">
          <div className="corp-hero__badge">
            <Mail size={14} color="#A91D3A" />
            Kurumsal İletişim & Partnerlik
          </div>
        </div>

        <h1 className="corp-hero__title">
          Geleceğin Medya Deneyimini <br />
          <span className="corp-gradient-text">Birlikte Şekillendirelim</span>
        </h1>

        <p className="corp-hero__subtitle">
          Yatırımcı görüşmeleri, dağıtıcı lisans anlaşmaları, teknoloji ortaklıkları ve basın talepleri için kurumsal ekibimizle iletişime geçin.
        </p>
      </section>

      {/* İLETİŞİM FORMU VE DETAYLAR */}
      <section className="corp-section">
        <div style={{
          display: "grid",
          gridTemplateColumns: "1.1fr 0.9fr",
          gap: "48px",
          alignItems: "start"
        }}>
          {/* Sol Form */}
          <div style={{
            background: "var(--corp-card)",
            border: "1px solid var(--corp-border)",
            borderRadius: "24px",
            padding: "40px"
          }}>
            <h2 style={{ fontSize: "24px", fontWeight: 700, color: "#fff", marginBottom: "8px" }}>
              Bize Mesaj Gönderin
            </h2>
            <p style={{ color: "#9ca3af", fontSize: "14px", marginBottom: "28px" }}>
              Talebiniz ilgili kurumsal birimimize (Yatırımcı İlişkileri, Mühendislik veya Basın) 24 saat içinde iletilecektir.
            </p>

            {submitted ? (
              <div style={{
                background: "rgba(46, 204, 113, 0.15)",
                border: "1px solid #2ecc71",
                borderRadius: "16px",
                padding: "32px",
                textAlign: "center"
              }}>
                <CheckCircle2 size={48} color="#2ecc71" style={{ margin: "0 auto 16px" }} />
                <h3 style={{ color: "#fff", fontSize: "20px", fontWeight: 700, marginBottom: "8px" }}>Mesajınız Başarıyla İletildi</h3>
                <p style={{ color: "#d1d5db", fontSize: "14px" }}>
                  Teşekkür ederiz. Kurumsal ekibimiz en kısa sürede {formData.email} adresiniz üzerinden sizinle irtibata geçecektir.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                  <div>
                    <label style={{ display: "block", fontSize: "12px", color: "#d1d5db", marginBottom: "6px" }}>Adınız Soyadınız *</label>
                    <input 
                      type="text" 
                      required
                      placeholder="Ad Soyad"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      style={{ width: "100%", background: "#0a0b10", border: "1px solid var(--corp-border)", borderRadius: "8px", padding: "12px", color: "#fff", fontSize: "14px" }}
                    />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: "12px", color: "#d1d5db", marginBottom: "6px" }}>Kurum / Şirket Adı</label>
                    <input 
                      type="text" 
                      placeholder="Şirket / Fon"
                      value={formData.company}
                      onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                      style={{ width: "100%", background: "#0a0b10", border: "1px solid var(--corp-border)", borderRadius: "8px", padding: "12px", color: "#fff", fontSize: "14px" }}
                    />
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                  <div>
                    <label style={{ display: "block", fontSize: "12px", color: "#d1d5db", marginBottom: "6px" }}>Kurumsal E-posta *</label>
                    <input 
                      type="email" 
                      required
                      placeholder="ad@sirket.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      style={{ width: "100%", background: "#0a0b10", border: "1px solid var(--corp-border)", borderRadius: "8px", padding: "12px", color: "#fff", fontSize: "14px" }}
                    />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: "12px", color: "#d1d5db", marginBottom: "6px" }}>Görüşme Konusu</label>
                    <select
                      value={formData.topic}
                      onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
                      style={{ width: "100%", background: "#0a0b10", border: "1px solid var(--corp-border)", borderRadius: "8px", padding: "12px", color: "#fff", fontSize: "14px" }}
                    >
                      <option value="yatirim">Yatırımcı İlişkileri & Turlar</option>
                      <option value="partnerlik">Stratejik Partnerlik & Telco</option>
                      <option value="basin">Basın & Medya Röportajı</option>
                      <option value="teknik">Teknik İş Birliği & API</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "12px", color: "#d1d5db", marginBottom: "6px" }}>Mesajınız *</label>
                  <textarea 
                    rows={5}
                    required
                    placeholder="Talebinizi, kurumunuzu veya merak ettiğiniz konuları kısaca özetleyin..."
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    style={{ width: "100%", background: "#0a0b10", border: "1px solid var(--corp-border)", borderRadius: "8px", padding: "12px", color: "#fff", fontSize: "14px", resize: "vertical" }}
                  />
                </div>

                <button type="submit" className="corp-btn corp-btn--primary corp-btn--lg" style={{ justifyContent: "center" }}>
                  <Send size={16} /> Talebi Gönder
                </button>
              </form>
            )}
          </div>

          {/* Sağ Ofis & İletişim Kanalları */}
          <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
            <div style={{ background: "var(--corp-card)", border: "1px solid var(--corp-border)", borderRadius: "20px", padding: "32px" }}>
              <h3 style={{ fontSize: "18px", fontWeight: 700, color: "#fff", marginBottom: "16px" }}>Doğrudan İletişim E-postaları</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: "12px", fontSize: "14px" }}>
                <div>
                  <span style={{ color: "#9ca3af", display: "block", fontSize: "12px" }}>Genel Kurumsal Talepler:</span>
                  <a href="mailto:corporate@tenett.media" style={{ color: "#ff8097", fontWeight: 600 }}>corporate@tenett.media</a>
                </div>
                <div>
                  <span style={{ color: "#9ca3af", display: "block", fontSize: "12px" }}>Yatırımcı & Fon İlişkileri:</span>
                  <a href="mailto:investors@tenett.media" style={{ color: "#ff8097", fontWeight: 600 }}>investors@tenett.media</a>
                </div>
                <div>
                  <span style={{ color: "#9ca3af", display: "block", fontSize: "12px" }}>Basın & İletişim:</span>
                  <a href="mailto:press@tenett.media" style={{ color: "#ff8097", fontWeight: 600 }}>press@tenett.media</a>
                </div>
              </div>
            </div>

            <div style={{ background: "var(--corp-card)", border: "1px solid var(--corp-border)", borderRadius: "20px", padding: "32px" }}>
              <h3 style={{ fontSize: "18px", fontWeight: 700, color: "#fff", marginBottom: "16px" }}>Ofis Lokasyonları</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: "16px", fontSize: "14px", color: "#d1d5db" }}>
                <div style={{ display: "flex", gap: "12px" }}>
                  <MapPin size={18} color="#A91D3A" style={{ flexShrink: 0, marginTop: "2px" }} />
                  <div>
                    <strong style={{ color: "#fff" }}>İstanbul Maslak Ar-Ge Merkezi</strong>
                    <p style={{ color: "#9ca3af", fontSize: "13px", margin: "4px 0 0" }}>
                      Spine Tower Plaza Kat: 18, Maslak Mah. Büyükdere Cad. No: 255, Sarıyer / İstanbul
                    </p>
                  </div>
                </div>

                <div style={{ display: "flex", gap: "12px" }}>
                  <Globe size={18} color="#38bdf8" style={{ flexShrink: 0, marginTop: "2px" }} />
                  <div>
                    <strong style={{ color: "#fff" }}>Londra Genel Merkez (UK)</strong>
                    <p style={{ color: "#9ca3af", fontSize: "13px", margin: "4px 0 0" }}>
                      128 City Road, EC1V 2NX, London, United Kingdom
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Basın Kiti İndirme Kutusu */}
            <div id="press" style={{ background: "rgba(169, 29, 58, 0.08)", border: "1px solid rgba(169, 29, 58, 0.3)", borderRadius: "20px", padding: "28px" }}>
              <h3 style={{ fontSize: "16px", fontWeight: 700, color: "#ff8097", marginBottom: "8px", display: "flex", alignItems: "center", gap: "8px" }}>
                <Download size={18} /> Basın Kiti & Marka Varlıkları (Press Kit)
              </h3>
              <p style={{ color: "#d1d5db", fontSize: "13px", lineHeight: 1.5, marginBottom: "16px" }}>
                Vektörel Tenett logoları (SVG, PNG), marka renk rehberi ve yüksek çözünürlüklü ürün ekran görüntülerini içeren resmi medya kiti.
              </p>
              <div style={{ display: "flex", gap: "10px" }}>
                <a href={tenetLogo} download="tenett-official-logo.svg" className="corp-btn corp-btn--secondary" style={{ fontSize: "12px", padding: "8px 14px" }}>
                  Logoyu İndir (SVG)
                </a>
                <Link to="/app" className="corp-btn corp-btn--app-live" style={{ fontSize: "12px", padding: "8px 14px" }}>
                  Canlı Platform Görselleri
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

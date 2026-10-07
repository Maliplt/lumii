import { useState } from "react";
import { Link } from "react-router-dom";
import { Play, Pause, Volume2, Maximize2, Tv, Gamepad2, Film, ShieldCheck, Zap } from "lucide-react";
import doomLogo from "../../assets/images/doom.svg";
import game2048 from "../../assets/images/2048.webp";
import blockblast from "../../assets/images/blockblast.webp";
import mahjong from "../../assets/images/mahjong.webp";
import sudoku from "../../assets/images/sudoku.webp";
import kelimezinciri from "../../assets/images/kelimezinciri.webp";
import minesweeper from "../../assets/images/minesweeper.webp";

export default function ProductVisualMockup() {
  const [isPlaying, setIsPlaying] = useState(true);
  const [activeTab, setActiveTab] = useState<"player" | "arcade" | "tv">("player");
  const [audioTrack, setAudioTrack] = useState<"tr" | "en">("tr");

  return (
    <div className="corp-mockup-frame">
      {/* Üst Tarayıcı / Pencere Çubuğu */}
      <div className="corp-mockup-frame__topbar">
        <div className="dot-group">
          <span></span>
          <span></span>
          <span></span>
        </div>
        <div className="address-bar">
          https://tenett.media/ecosystem/stream-os-v2.6
        </div>
        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
          <span style={{ fontSize: "11px", color: "#2ecc71", display: "flex", alignItems: "center", gap: "4px" }}>
            <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#2ecc71" }}></span>
            Online CDN
          </span>
        </div>
      </div>

      {/* Kontrol Sekmeleri */}
      <div style={{ 
        display: "flex", 
        background: "#090a0f", 
        borderBottom: "1px solid rgba(255,255,255,0.08)",
        padding: "8px 20px",
        gap: "12px",
        alignItems: "center",
        justifyContent: "space-between",
        flexWrap: "wrap"
      }}>
        <div style={{ display: "flex", gap: "8px" }}>
          <button 
            onClick={() => setActiveTab("player")}
            style={{
              background: activeTab === "player" ? "rgba(169, 29, 58, 0.25)" : "transparent",
              border: activeTab === "player" ? "1px solid #A91D3A" : "1px solid transparent",
              color: activeTab === "player" ? "#fff" : "#9ca3af",
              borderRadius: "8px",
              padding: "6px 12px",
              fontSize: "12px",
              fontWeight: 600,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "6px"
            }}
          >
            <Film size={14} color="#A91D3A" /> Tenet Stream Player (4K HDR)
          </button>

          <button 
            onClick={() => setActiveTab("arcade")}
            style={{
              background: activeTab === "arcade" ? "rgba(169, 29, 58, 0.25)" : "transparent",
              border: activeTab === "arcade" ? "1px solid #A91D3A" : "1px solid transparent",
              color: activeTab === "arcade" ? "#fff" : "#9ca3af",
              borderRadius: "8px",
              padding: "6px 12px",
              fontSize: "12px",
              fontWeight: 600,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "6px"
            }}
          >
            <Gamepad2 size={14} color="#38bdf8" /> Tenet Arcade Hub (WASM)
          </button>

          <button 
            onClick={() => setActiveTab("tv")}
            style={{
              background: activeTab === "tv" ? "rgba(169, 29, 58, 0.25)" : "transparent",
              border: activeTab === "tv" ? "1px solid #A91D3A" : "1px solid transparent",
              color: activeTab === "tv" ? "#fff" : "#9ca3af",
              borderRadius: "8px",
              padding: "6px 12px",
              fontSize: "12px",
              fontWeight: 600,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "6px"
            }}
          >
            <Tv size={14} color="#f59e0b" /> TV Leanback UI
          </button>
        </div>

        <Link 
          to="/app" 
          className="corp-btn corp-btn--app-live"
          title="Çalışan canlı Tenet platformunu aç"
        >
          <span className="corp-pulse-dot"></span>
          Canlı Platformu Aç
        </Link>
      </div>

      {/* Gövde */}
      <div className="corp-mockup-frame__body">
        {/* Sol Ana Ekran */}
        {activeTab === "player" && (
          <div className="corp-mockup-frame__player-screen" style={{
            backgroundImage: "radial-gradient(ellipse at center, rgba(169, 29, 58, 0.3) 0%, rgba(5,5,8,0.95) 75%), url('https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&w=1200&q=80')",
            backgroundSize: "cover",
            backgroundPosition: "center"
          }}>
            <div className="corp-mockup-frame__player-hud-top">
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span className="quality-badge">4K ULTRA HD</span>
                <span style={{ fontSize: "11px", padding: "2px 6px", background: "rgba(255,255,255,0.15)", borderRadius: "4px", color: "#fff" }}>HDR10</span>
                <span style={{ fontSize: "11px", padding: "2px 6px", background: "rgba(56, 189, 248, 0.2)", color: "#38bdf8", borderRadius: "4px", border: "1px solid rgba(56, 189, 248, 0.4)" }}>Multi-Debrid Stream</span>
              </div>
              <div className="meta-title">TENET: Original Media Pipeline — Bölüm 01</div>
            </div>

            <div className="corp-mockup-frame__player-hud-center">
              <button 
                className="play-btn-circle" 
                onClick={() => setIsPlaying(!isPlaying)}
                aria-label={isPlaying ? "Durdur" : "Oynat"}
              >
                {isPlaying ? <Pause size={24} color="#ffffff" /> : <Play size={24} color="#ffffff" style={{ marginLeft: "4px" }} />}
              </button>
            </div>

            <div className="corp-mockup-frame__player-hud-bottom">
              <div className="progress-bar-bg">
                <div className="progress-bar-fill" style={{ width: isPlaying ? "74%" : "45%" }}></div>
              </div>
              <div className="player-controls">
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <span>01:14:28 / 02:30:00</span>
                  <Volume2 size={16} />
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <button 
                    onClick={() => setAudioTrack(audioTrack === "tr" ? "en" : "tr")}
                    style={{ background: "rgba(255,255,255,0.1)", border: "none", color: "#fff", fontSize: "11px", padding: "2px 6px", borderRadius: "4px", cursor: "pointer" }}
                  >
                    Ses: {audioTrack === "tr" ? "Türkçe 5.1" : "İngilizce Atmos"}
                  </button>
                  <span style={{ fontSize: "11px", background: "rgba(255,255,255,0.1)", padding: "2px 6px", borderRadius: "4px" }}>Altyazı: Açık</span>
                  <Maximize2 size={16} />
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "arcade" && (
          <div className="corp-mockup-frame__player-screen" style={{
            backgroundImage: "radial-gradient(circle at center, rgba(30, 41, 59, 0.9) 0%, rgba(5,5,8,0.98) 100%)",
            justifyContent: "center",
            alignItems: "center",
            textAlign: "center",
            padding: "32px"
          }}>
            <div style={{ maxWidth: "420px", margin: "0 auto", position: "relative", zIndex: 2 }}>
              <div style={{ display: "inline-flex", padding: "10px", background: "rgba(169, 29, 58, 0.2)", borderRadius: "14px", border: "1px solid rgba(169, 29, 58, 0.4)", marginBottom: "16px" }}>
                <img src={doomLogo} alt="Doom" style={{ height: "36px" }} />
              </div>
              <h3 style={{ color: "#fff", fontSize: "20px", fontWeight: 700, marginBottom: "8px" }}>Tenet Arcade Engine</h3>
              <p style={{ color: "#9ca3af", fontSize: "13px", lineHeight: 1.5, marginBottom: "16px" }}>
                Platforma entegre WebAssembly mimarisiyle, indirme gerektirmeden tarayıcı ve TV üzerinden doğrudan 60fps retro ve bulut oyun deneyimi.
              </p>
              <div style={{ display: "flex", gap: "8px", justifyContent: "center" }}>
                <Link to="/app" style={{ background: "#A91D3A", color: "#fff", padding: "8px 16px", borderRadius: "8px", fontSize: "12px", fontWeight: 600, textDecoration: "none" }}>
                  Doom'u Başlat (WASM)
                </Link>
                <Link to="/app" style={{ background: "rgba(255,255,255,0.1)", color: "#fff", padding: "8px 16px", borderRadius: "8px", fontSize: "12px", fontWeight: 600, textDecoration: "none" }}>
                  Tüm Arcade Kataloğu
                </Link>
              </div>
            </div>
          </div>
        )}

        {activeTab === "tv" && (
          <div className="corp-mockup-frame__player-screen" style={{
            backgroundImage: "linear-gradient(135deg, #0f172a 0%, #030712 100%)",
            padding: "24px"
          }}>
            <div style={{ position: "relative", zIndex: 2 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                <div style={{ fontSize: "18px", fontWeight: 800, color: "#fff" }}>TENET TV / Living Room UI</div>
                <div style={{ fontSize: "12px", color: "#f59e0b", background: "rgba(245, 158, 11, 0.15)", padding: "4px 10px", borderRadius: "999px", border: "1px solid rgba(245, 158, 11, 0.3)" }}>
                  Kumanda & Focus Modu Aktif
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "12px" }}>
                <div style={{ background: "rgba(255,255,255,0.05)", border: "2px solid #A91D3A", borderRadius: "10px", padding: "14px" }}>
                  <div style={{ fontSize: "11px", color: "#A91D3A", fontWeight: 700 }}>SEÇİLİ KANAL</div>
                  <div style={{ fontSize: "14px", fontWeight: 700, color: "#fff", marginTop: "4px" }}>Tenet Sinema HD</div>
                  <div style={{ fontSize: "11px", color: "#9ca3af", marginTop: "4px" }}>1080p 50fps • Düşük Gecikme</div>
                </div>
                <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "10px", padding: "14px" }}>
                  <div style={{ fontSize: "11px", color: "#9ca3af", fontWeight: 700 }}>SPOR & CANLI</div>
                  <div style={{ fontSize: "14px", fontWeight: 700, color: "#fff", marginTop: "4px" }}>Canlı Maç Yayını</div>
                  <div style={{ fontSize: "11px", color: "#9ca3af", marginTop: "4px" }}>Canlı Akış • HLS v7</div>
                </div>
                <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "10px", padding: "14px" }}>
                  <div style={{ fontSize: "11px", color: "#9ca3af", fontWeight: 700 }}>BELGESEL</div>
                  <div style={{ fontSize: "14px", fontWeight: 700, color: "#fff", marginTop: "4px" }}>Doğa & Evren 4K</div>
                  <div style={{ fontSize: "11px", color: "#9ca3af", marginTop: "4px" }}>Ultra Netlik</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Sağ Bilgi ve Öne Çıkanlar Paneli */}
        <div className="corp-mockup-frame__sidebar">
          <div className="side-card">
            <div className="side-card-title">
              <Zap size={14} color="#A91D3A" /> Performans ve HLS Pipeline
            </div>
            <div style={{ fontSize: "12px", color: "#9ca3af", lineHeight: 1.5 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                <span>İlk Kare Gecikmesi:</span>
                <strong style={{ color: "#2ecc71" }}>&lt; 180 ms</strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                <span>Protokol:</span>
                <strong style={{ color: "#fff" }}>Adaptive HLS / Debrid Cache</strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span>Viewport:</span>
                <strong style={{ color: "#fff" }}>TV / Web / Mobile Sync</strong>
              </div>
            </div>
          </div>

          <div className="side-card">
            <div className="side-card-title">
              <Gamepad2 size={14} color="#38bdf8" /> Dahili Arcade Oyun Motoru
            </div>
            <div className="arcade-mini-grid">
              <img src={game2048} alt="2048" title="2048" />
              <img src={blockblast} alt="Block Blast" title="Block Bloom" />
              <img src={sudoku} alt="Sudoku" title="Sudoku" />
              <img src={mahjong} alt="Mahjong" title="Mahjong Sanctuary" />
              <img src={minesweeper} alt="Minesweeper" title="Minesweeper" />
              <img src={kelimezinciri} alt="Kelime Zinciri" title="Kelime Zinciri" />
            </div>
            <div style={{ fontSize: "11px", color: "#9ca3af", marginTop: "8px", textAlign: "center" }}>
              7+ Yüksek Performanslı Tarayıcı Oyunu
            </div>
          </div>

          <div className="side-card" style={{ background: "rgba(169, 29, 58, 0.08)", borderColor: "rgba(169, 29, 58, 0.3)" }}>
            <div className="side-card-title" style={{ color: "#ff8097" }}>
              <ShieldCheck size={14} color="#ff8097" /> Kurumsal Güvenlik & Aile
            </div>
            <p style={{ fontSize: "11px", color: "#d1d5db", margin: 0, lineHeight: 1.4 }}>
              PIN korumalı çoklu kullanıcı profilleri, yaş filtreleme ve yerel cihaz güvenliği.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

import { useState } from "react";
import { Check, HardDrive, Layers, Server, Settings, Sparkles, X } from "lucide-react";
import type { StreamSource } from "../../types/types";

interface StreamSourceSelectorProps {
  sources: StreamSource[];
  activeSourceId?: string;
  isVidFastActive?: boolean;
  onSelectSource: (source: StreamSource) => void;
  onSwitchToVidFast?: () => void;
  onOpenSettings?: () => void;
}

export default function StreamSourceSelector({
  sources,
  activeSourceId,
  isVidFastActive = false,
  onSelectSource,
  onSwitchToVidFast,
  onOpenSettings,
}: StreamSourceSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);

  const activeSource = sources.find((s) => s.id === activeSourceId);

  const getQualityBadgeClass = (quality: StreamSource["quality"]) => {
    switch (quality) {
      case "4K":
        return "stream-badge--4k";
      case "1080p":
        return "stream-badge--1080p";
      case "720p":
        return "stream-badge--720p";
      default:
        return "stream-badge--sd";
    }
  };

  return (
    <div className="stream-source-selector-container">
      {/* Tetikleyici Buton */}
      <button
        type="button"
        className="stream-source-trigger-btn"
        onClick={() => setIsOpen(true)}
        title="Akış Kaynağını Değiştir"
        aria-label="Akış Kaynakları"
      >
        <Layers size={16} />
        <span className="stream-source-trigger-label">
          {isVidFastActive ? (
            "VidFast (Embed)"
          ) : activeSource ? (
            <>
              <span className="stream-rd-tag">RD+</span>
              <span className="stream-q-tag">{activeSource.quality}</span>
              {activeSource.size && <span className="stream-size-tag">· {activeSource.size}</span>}
            </>
          ) : (
            "Kaynak Seç"
          )}
        </span>
      </button>

      {/* Modal / Drawer */}
      {isOpen && (
        <div className="stream-source-modal-backdrop" onClick={() => setIsOpen(false)}>
          <div
            className="stream-source-modal-content"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label="Yayın Kaynakları"
          >
            <div className="stream-source-modal-header">
              <div className="stream-source-modal-title">
                <Sparkles size={18} className="stream-sparkle-icon" />
                <h3>Yayın Kaynakları & Kalite</h3>
              </div>
              <button
                type="button"
                className="stream-source-close-btn"
                onClick={() => setIsOpen(false)}
                aria-label="Kapat"
              >
                <X size={20} />
              </button>
            </div>

            <div className="stream-source-modal-body">
              {sources.length > 0 ? (
                <div className="stream-source-list">
                  {sources.map((source) => {
                    const isSelected = !isVidFastActive && source.id === activeSourceId;
                    return (
                      <button
                        key={source.id}
                        type="button"
                        className={`stream-source-item${isSelected ? " is-active" : ""}`}
                        onClick={() => {
                          onSelectSource(source);
                          setIsOpen(false);
                        }}
                      >
                        <div className="stream-source-item__main">
                          <div className="stream-source-item__badges">
                            {source.isRealDebrid && (
                              <span className="stream-badge stream-badge--rd">RD+</span>
                            )}
                            <span className={`stream-badge ${getQualityBadgeClass(source.quality)}`}>
                              {source.quality}
                            </span>
                            {source.codec && (
                              <span className="stream-badge stream-badge--codec">
                                {source.codec}
                              </span>
                            )}
                            {source.size && (
                              <span className="stream-badge stream-badge--size">
                                <HardDrive size={11} style={{ marginRight: 3, verticalAlign: "middle" }} />
                                {source.size}
                              </span>
                            )}
                            {source.tracker && (
                              <span className="stream-badge stream-badge--tracker">
                                {source.tracker}
                              </span>
                            )}
                          </div>

                          <div className="stream-source-item__title" title={source.title}>
                            {source.title}
                          </div>

                          {source.audio && (
                            <div className="stream-source-item__meta">
                              🔊 {source.audio}
                            </div>
                          )}
                        </div>

                        <div className="stream-source-item__action">
                          {isSelected ? (
                            <span className="stream-source-selected-icon">
                              <Check size={18} />
                            </span>
                          ) : (
                            <span className="stream-source-play-text">Seç</span>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="stream-source-empty">
                  <Server size={32} style={{ opacity: 0.5, marginBottom: 8 }} />
                  <p>Torrentio üzerinde uygun Real-Debrid akışı bulunamadı.</p>
                  <p className="stream-source-empty__sub">
                    Real-Debrid API anahtarınızın geçerli olduğundan emin olun.
                  </p>
                </div>
              )}

              {/* Alternatif Oynatıcılar ve Ayarlar */}
              <div className="stream-source-alternatives">
                <div className="stream-source-alternatives__label">Alternatif Oynatıcılar</div>
                <div className="stream-source-alternatives__buttons">
                  {onSwitchToVidFast && (
                    <button
                      type="button"
                      className={`stream-alt-btn${isVidFastActive ? " is-active" : ""}`}
                      onClick={() => {
                        onSwitchToVidFast();
                        setIsOpen(false);
                      }}
                    >
                      <Server size={15} />
                      <span>VidFast Player'a Geç (Embed)</span>
                    </button>
                  )}

                  {onOpenSettings && (
                    <button
                      type="button"
                      className="stream-alt-btn"
                      onClick={() => {
                        setIsOpen(false);
                        onOpenSettings();
                      }}
                    >
                      <Settings size={15} />
                      <span>Real-Debrid Ayarları</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

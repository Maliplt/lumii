import { ArrowRight, Play } from "lucide-react";
import ModalCloseButton from "../modals/ModalCloseButton";
import IconActionButton from "../ui/IconActionButton";
import { MotionIcon } from "../ui/MotionIcon";
import type { CinemaNextEpisode, CinemaRecommendation } from "./cinemaPlayerTypes";

interface CinemaEndScreenProps {
  recommendations: CinemaRecommendation[];
  onClose?: () => void;
  nextEpisode?: CinemaNextEpisode;
  title?: string;
  onReplay?: () => void;
}

export default function CinemaEndScreen({ recommendations, onClose = () => undefined, nextEpisode }: CinemaEndScreenProps) {
  if (nextEpisode) return (
    <aside className="cine-end cine-end--next" aria-label="Sıradaki bölüm">
      <div className="cine-end__heading"><span>Sıradaki bölüm</span><strong>{nextEpisode.title}</strong><small>{nextEpisode.eyebrow}</small></div>
      <button type="button" className="cine-end__next-button" onClick={nextEpisode.onPlay}><Play size={16} fill="currentColor" /> Sonraki Bölüm <ArrowRight size={16} /></button>
    </aside>
  );
  if (!recommendations.length) return null;
  return (
    <aside className="cine-end" aria-label="Benzer içerikler">
      <div className="cine-end__heading">
        <span>İzlemeye devam et</span>
        <strong>Bunları da sevebilirsin</strong>
        <ModalCloseButton standalone className="cine-shared-close" onClose={onClose} />
      </div>
      <div className="cine-end__grid">
        {recommendations.slice(0, 3).map((item) => (
          <article key={item.id} className="cine-end-card">
            <button type="button" className="cine-end-card__main" onClick={item.onSelect} aria-label={`${item.title} içeriğini oynat`}>
              <img src={item.image} alt="" />
              <span className="cine-end-card__shade" />
              <span className="cine-end-card__play"><Play size={15} fill="currentColor" /></span>
              <span className="cine-end-card__copy"><strong>{item.title}</strong>{item.meta && <small>{item.meta}</small>}</span>
            </button>
            <span className="cine-end-card__actions">
              {item.onWatchlist && (
                <IconActionButton
                  className="cc-item__action-btn outline cc-item__watchlist cine-end-card__action"
                  label={item.inWatchlist ? "İzleme listesinden çıkar" : "İzleme listesine ekle"}
                  tooltipLabel={item.inWatchlist ? "Listeden çıkar" : "Listeye ekle"}
                  active={item.inWatchlist}
                  onClick={item.onWatchlist}
                  icon={<MotionIcon name={item.inWatchlist ? "Check" : "Plus"} size={item.inWatchlist ? 19 : 20} trigger="click" animation="pop" />}
                />
              )}
              {item.onLike && (
                <IconActionButton
                  className="cc-item__action-btn outline cc-item__like cine-end-card__action"
                  label={item.liked ? "Beğeniyi kaldır" : "Beğen"}
                  tooltipLabel={item.liked ? "Beğeniyi kaldır" : "Beğen"}
                  active={item.liked}
                  onClick={item.onLike}
                  icon={<MotionIcon name="Heart" size={20} trigger="click" animation="heartbeat" />}
                />
              )}
            </span>
          </article>
        ))}
      </div>
    </aside>
  );
}

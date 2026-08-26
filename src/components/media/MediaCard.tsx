import { memo } from "react";
import { Link } from "react-router-dom";
import { Lock, Star } from "lucide-react";
import { MotionIcon } from "../ui/MotionIcon";
import { getImageUrl } from "../../services/tmdb";
import { canUseLevel, contentAccessLevel, mediaName, mediaYear, requiredPlanName } from "../../helpers";
import { useAppSelector } from "../../store/store";
import type { Movie, TVShow } from "../../types/types";
import OptimizedImage from "../ui/OptimizedImage";

interface MediaCardProps {
  item: Movie | TVShow;
  type: "movie" | "tv";
  onRemove?: () => void;
}

function MediaCard({ item, type, onRemove }: MediaCardProps) {
  const name = mediaName(item);
  const year = mediaYear(item);
  const rating = item.vote_average ? item.vote_average.toFixed(1) : "";
  const userPlan = useAppSelector((s) => s.auth.currentUser?.plan);
  const requiredLevel = contentAccessLevel(type, item.id);
  const locked = !canUseLevel(userPlan, requiredLevel);

  return (
    <Link to={`/${type}/${item.id}`} className={`media-card${locked ? " is-locked" : ""}`}>
      <div className="media-card__poster">
        <OptimizedImage
          src={getImageUrl(item.poster_path, "w300")}
          alt={name}
        />
        {rating && (
          <span className="media-card__rating">
            <Star size={11} fill="currentColor" />
            {rating}
          </span>
        )}
        {locked && (
          <span className="media-card__lock" title={`${requiredPlanName(requiredLevel)} paketine dahil`}><Lock size={15} /></span>
        )}
        {onRemove && (
          <button
            type="button"
            className="media-card__remove"
            aria-label="Kaldır"
            onClick={(e) => {
              e.preventDefault();
              onRemove();
            }}
          >
            <MotionIcon name="X" size={14} trigger="hover" animation="pop" />
          </button>
        )}
      </div>
      <div className="media-card__info">
        <h4 className="media-card__name">{name}</h4>
        {year && <span className="media-card__year">{year}</span>}
      </div>
    </Link>
  );
}

export default memo(MediaCard);

import { memo } from "react";
import { Link } from "react-router-dom";
import { Star } from "lucide-react";
import { MotionIcon } from "motion-icons-react";
import { getImageUrl } from "../services/tmdb";
import { mediaName, mediaYear } from "../helpers";
import type { Movie, TVShow } from "../types/types";

interface MediaCardProps {
  item: Movie | TVShow;
  type: "movie" | "tv";
  onRemove?: () => void;
}

function MediaCard({ item, type, onRemove }: MediaCardProps) {
  const name = mediaName(item);
  const year = mediaYear(item);
  const rating = item.vote_average ? item.vote_average.toFixed(1) : "";

  return (
    <Link to={`/${type}/${item.id}`} className="media-card">
      <div className="media-card__poster">
        <img
          src={getImageUrl(item.poster_path, "w300")}
          alt={name}
          loading="lazy"
        />
        {rating && (
          <span className="media-card__rating">
            <Star size={11} fill="currentColor" />
            {rating}
          </span>
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

import type { Movie, TVShow } from "../../types/types";
import type { SavedItem } from "../../store/store";
import { useLibraryActions } from "../../helpers";
import IconActionButton from "../ui/IconActionButton";
import { MotionIcon } from "../ui/MotionIcon";

interface MediaActionButtonsProps {
  item: Movie | TVShow | SavedItem;
  type: "movie" | "tv";
  className?: string;
  tabIndex?: number;
}

export default function MediaActionButtons({
  item,
  type,
  className = "",
  tabIndex,
}: MediaActionButtonsProps) {
  const library = useLibraryActions(item, type);
  const watchlistLabel = library.inWatchlist ? "Listeden çıkar" : "Listeye ekle";
  const likeLabel = library.isLiked ? "Beğeniyi geri al" : "Beğen";

  return (
    <>
      <IconActionButton
        className={`cc-item__action-btn outline cc-item__watchlist ${className}`}
        label={watchlistLabel}
        tooltipLabel={watchlistLabel}
        active={library.inWatchlist}
        onClick={library.onWatchlist}
        tabIndex={tabIndex}
        icon={
          <MotionIcon
            name={library.inWatchlist ? "Check" : "Plus"}
            size={library.inWatchlist ? 19 : 20}
            trigger="click"
            animation="pop"
          />
        }
      />
      <IconActionButton
        className={`cc-item__action-btn outline cc-item__like ${className}`}
        label={likeLabel}
        tooltipLabel={likeLabel}
        active={library.isLiked}
        onClick={library.onLike}
        tabIndex={tabIndex}
        icon={<MotionIcon name="Heart" size={20} trigger="click" animation="heartbeat" />}
      />
    </>
  );
}

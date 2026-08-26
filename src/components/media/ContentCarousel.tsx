import { memo, useRef, useState, useMemo, useEffect, type CSSProperties, type ReactNode } from "react";
import { Carousel } from "rsuite";
import { Link, useNavigate } from "react-router-dom";
import { Lock, Star } from "lucide-react";
import { MotionIcon } from "../ui/MotionIcon";
import { getImageUrl, genreNames } from "../../services/tmdb";
import { useSwipe, mediaName, mediaYear, mediaTypeOf, formatTime, useYouTubeEmbed, buildYoutubeEmbedUrl, canUseLevel, contentAccessLevel, navigateToPlayback, requiredPlanName, upgradeCtaLabel } from "../../helpers";
import { useAppSelector, resumeLabel, canResumeProgress, selectAutoplayEnabled, selectPreviewsEnabled, type SavedItem } from "../../store/store";
import type { ContentAccessLevel, Movie, TVShow } from "../../types/types";
import type { SpotlightTheme } from "../../data/spotlightDefinitions";
import { useTrailerPreview } from "../../lib/useTrailerPreview";
import OptimizedImage from "../ui/OptimizedImage";
import TrailerPreviewButton from "./TrailerPreviewButton";
import ActionButton from "../ui/ActionButton";
import TrailerEmbedFrame from "./TrailerEmbedFrame";
import MediaActionButtons from "./MediaActionButtons";
import {
  shouldRenderCarouselPage,
  useCarouselVisibleCount,
} from "./useCarouselLayout";

type Media = Movie | TVShow;

const HOVER_EXPAND_DELAY = 500;

function usesTouchPreviewInteraction(): boolean {
  return window.matchMedia("(hover: none), (pointer: coarse)").matches;
}

let closeOpenCard: (() => void) | null = null;
let openToken: object | null = null;

function usePages(items: Media[], visible: number) {
  return useMemo(() => {
    const flat = items.filter((it) => it.poster_path && it.overview?.trim());
    const pages: Media[][] = [];
    for (let start = 0; start < flat.length; start += visible)
      pages.push(flat.slice(start, start + visible));
    return { flat, pages };
  }, [items, visible]);
}

interface ContentCarouselProps {
  type: "movie" | "tv";
  title: string;
  items: Media[];
  headerExtra?: ReactNode;
  accessLevel?: ContentAccessLevel;
  spotlight?: {
    eyebrow: string;
    description: string;
    backgroundPath: string | null;
    theme: SpotlightTheme;
  };
}

const ItemCard = memo(function ItemCard({
  item,
  type,
  accessLevel,
}: {
  item: Media;
  type: "movie" | "tv";
  accessLevel?: ContentAccessLevel;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const hoverTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const token = useRef({});
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  const cardType = mediaTypeOf(item, type);
  const userPlan = useAppSelector((s) => s.auth.currentUser?.plan);
  const autoplayEnabled = useAppSelector(selectAutoplayEnabled);
  const requiredLevel = contentAccessLevel(cardType, item.id, accessLevel);
  const locked = !canUseLevel(userPlan, requiredLevel);
  const previewsEnabled = useAppSelector(selectPreviewsEnabled);
  const {
    videoKey: trailerKey,
    status: trailerStatus,
    start: startTrailer,
    stop: stopTrailer,
  } = useTrailerPreview({
    mediaType: cardType,
    mediaId: item.id,
    enabled: previewsEnabled,
    priority: "user",
  });
  const { ready, onFrameLoad } = useYouTubeEmbed(open ? trailerKey : null);

  const name = mediaName(item);
  const year = mediaYear(item);
  const rating = item.vote_average ? item.vote_average.toFixed(1) : "";
  const genres = genreNames(item.genre_ids, 3);
  const adult = (item as Movie).adult === true;

  // fragman tıklamayla yüklenir
  const toggleTrailer = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (trailerKey) {
      stopTrailer();
      return;
    }
    void startTrailer();
  };

  // hover temizliği
  useEffect(() => {
    const myToken = token.current;
    return () => {
      if (hoverTimer.current) clearTimeout(hoverTimer.current);
      if (openToken === myToken) {
        openToken = null;
        closeOpenCard = null;
      }
    };
  }, []);

  const expand = () => {
    if (closeOpenCard && openToken !== token.current) closeOpenCard();
    openToken = token.current;
    closeOpenCard = collapse;
    setOpen(true);
  };

  const collapse = () => {
    stopTrailer();
    if (openToken === token.current) {
      openToken = null;
      closeOpenCard = null;
    }
    setOpen(false);
  };

  const onEnter = () => {
    if (!previewsEnabled) return;
    if (usesTouchPreviewInteraction()) return;
    hoverTimer.current = setTimeout(expand, HOVER_EXPAND_DELAY);
  };
  const onLeave = () => {
    if (hoverTimer.current) {
      clearTimeout(hoverTimer.current);
      hoverTimer.current = null;
    }
    if (open) collapse();
  };

  const openMobilePreview = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (!previewsEnabled || open) return;
    if (!usesTouchPreviewInteraction()) return;
    e.preventDefault();
    e.stopPropagation();
    expand();
  };

  const trailerSrc = trailerKey
    ? buildYoutubeEmbedUrl(trailerKey, { autoplay: true, muted: false })
    : "";

  const wp = (item as SavedItem).watchProgress;
  const actionLabel = resumeLabel(cardType, wp, formatTime) ?? "Oynat";
  const visibleActionLabel = locked ? "Yükselt" : actionLabel;
  const actionAriaLabel = locked
    ? `${upgradeCtaLabel(requiredLevel)}; paket seçeneklerini görüntüle`
    : actionLabel;
  const isResumeAction = locked || actionLabel !== "Oynat";
  const playerState =
    cardType === "tv" && canResumeProgress(wp) && wp.season && wp.episode
      ? { title: name, season: wp.season, episode: wp.episode }
      : { title: name };
  const watchPct =
    wp && wp.duration > 0
      ? Math.min(99, (wp.position / wp.duration) * 100)
      : 0;

  return (
    <div
      ref={ref}
      className={`cc-item${open ? " is-open" : ""}${ready ? " is-playing" : ""}${locked ? " is-locked" : ""}`}
      style={{ flexGrow: open ? 2 : 1 }}
      onMouseEnter={onEnter}
      onMouseLeave={onLeave}
    >
      <Link
        className="cc-item__link"
        to={`/${cardType}/${item.id}`}
        aria-label={name}
        onClick={openMobilePreview}
      >
        <OptimizedImage
          className="cc-item__poster"
          src={getImageUrl(item.poster_path, "w300")}
          alt={name}
        />
      </Link>
      {locked && (
        <span
          className="cc-item__access-badge"
          title={`${requiredPlanName(requiredLevel)} paketine dahil`}
          aria-label={`${requiredPlanName(requiredLevel)} paketine dahil`}
        ><Lock size={15} /></span>
      )}
      {watchPct > 0 && (
        <div className="cc-progress-bar">
          <div className="cc-progress-bar__fill" style={{ width: `${watchPct}%` }} />
        </div>
      )}



      {open && trailerKey && (
        <>
          <div className={`cc-item__trailer ${ready ? "is-ready" : ""}`}>
            <TrailerEmbedFrame
              src={trailerSrc}
              title={name}
              onLoad={onFrameLoad}
            />
          </div>
          <div
            className="cc-item__trailer-shield"
            onClick={() => navigate(`/${cardType}/${item.id}`)}
          />
        </>
      )}

      <div
        className={`cc-item__overlay ${open ? "active" : ""}`}
        onClick={() => navigate(`/${cardType}/${item.id}`)}
      >
        <div className="cc-item__details">
          <div className="cc-item__actions-row">
            <div className="cc-item__actions-left">
              <ActionButton
                className={`cc-item__action-btn play${isResumeAction ? " is-resume" : ""}${locked ? " is-locked" : ""}`}
                label={actionAriaLabel}
                tooltipLabel={isResumeAction ? undefined : visibleActionLabel}
                onClick={(e) => {
                  e.stopPropagation();
                  stopTrailer();
                  navigateToPlayback({
                    navigate,
                    type: cardType,
                    id: item.id,
                    planId: userPlan,
                    accessLevel,
                    autoplayEnabled,
                    ...playerState,
                  });
                }}
                tabIndex={open ? 0 : -1}
              >
                <MotionIcon name={locked ? "Lock" : "Play"} size={18} trigger="click" animation="nudge" />
                {isResumeAction && (
                  <span className="cc-item__action-text">{visibleActionLabel}</span>
                )}
              </ActionButton>
              <MediaActionButtons item={item} type={cardType} tabIndex={open ? 0 : -1} />
              {previewsEnabled && open && (
                <TrailerPreviewButton
                  className="cc-item__action-btn"
                  status={trailerStatus}
                  active={Boolean(trailerKey)}
                  iconOnly
                  onClick={toggleTrailer}
                  ariaLabel={
                    trailerStatus === "unavailable"
                      ? `${name} için fragman bulunamadı`
                      : trailerKey
                        ? `${name} fragmanını durdur`
                        : `${name} fragmanını izle`
                  }
                  tabIndex={open ? 0 : -1}
                />
              )}
            </div>
          </div>
          <div className="cc-item__summary">
            <h4 className="cc-item__name">{name}</h4>
            {(year || rating) && (
              <div className="cc-item__meta">
                {year && <span className="cc-item__year">{year}</span>}
                {year && rating && <span className="cc-item__divider">•</span>}
                {rating && (
                  <span className="cc-item__rating">
                    <Star size={11} fill="currentColor" className="cc-item__star" />
                    {rating}
                  </span>
                )}
              </div>
            )}
            {(genres.length > 0 || adult) && (
              <div className="cc-item__tagline">
                {adult && <span className="cc-item__age">18+</span>}
                <span className="cc-item__genres">
                  {genres.join(" · ")}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
});

function Peek({
  item,
  side,
  onClick,
}: {
  item: Media;
  side: "prev" | "next";
  onClick: () => void;
}) {
  return (
    <button
      className={`cc-peek ${side}`}
      onClick={onClick}
      aria-label={side === "prev" ? "Önceki" : "Sonraki"}
      tabIndex={-1}
    >
      <OptimizedImage
        src={getImageUrl(item.poster_path, "w300")}
        alt=""
      />
    </button>
  );
}

function NavArrow({ side, onClick }: { side: "prev" | "next"; onClick: () => void }) {
  return (
    <button
      className={`cc-nav-arrow ${side}`}
      onClick={onClick}
      aria-label={side === "prev" ? "Önceki slayt" : "Sonraki slayt"}
    >
      <MotionIcon
        name={side === "prev" ? "ChevronLeft" : "ChevronRight"}
        size={30}
        trigger="click"
        animation="nudge"
      />
    </button>
  );
}

export default function ContentCarousel({
  type,
  title,
  items,
  headerExtra,
  accessLevel,
  spotlight,
}: ContentCarouselProps) {
  const [page, setPage] = useState(0);
  const visible = useCarouselVisibleCount();
  const { flat, pages } = usePages(items, visible);
  const trackRef = useRef<HTMLDivElement>(null);

  const current = pages.length > 0 ? Math.min(page, pages.length - 1) : 0;

  const from = current * visible;
  const peekPrev = from > 0 ? flat[from - 1] : null;
  const peekNext = from + visible < flat.length ? flat[from + visible] : null;

  const goPrev = () => setPage((p) => (p === 0 ? pages.length - 1 : p - 1));
  const goNext = () => setPage((p) => (p === pages.length - 1 ? 0 : p + 1));
  const swipe = useSwipe(goNext, goPrev);

  if (pages.length === 0 && !headerExtra) return null;

  const multi = pages.length > 1;
  const spotlightStyle = spotlight
    ? ({
        "--spotlight-image": `url("${getImageUrl(spotlight.backgroundPath, "w1280")}")`,
        "--spotlight-accent": spotlight.theme.accent,
        "--spotlight-accent-contrast": spotlight.theme.accentContrast,
        "--spotlight-position": spotlight.theme.backgroundPosition ?? "center",
      } as CSSProperties)
    : undefined;

  return (
    <div
      className={`content-carousel${spotlight ? ` content-carousel--spotlight spotlight-typography--${spotlight.theme.typography}` : ""}`}
      style={spotlightStyle}
    >
      <div className="cc-header">
        <div className="cc-header__left">
          <h3 className="cc-header__title">{title}</h3>
          {spotlight?.description && (
            <p className="cc-header__description">{spotlight.description}</p>
          )}
        </div>
        <div className="cc-header__right">
          {multi && (
            <div className="cc-header__indicators">
              {pages.map((_, i) => (
                <span
                  key={i}
                  role="button"
                  tabIndex={i === current ? 0 : -1}
                  className={`cc-indicator-dot ${i === current ? "active" : ""}`}
                  aria-label={`Slayt ${i + 1}`}
                  aria-current={i === current ? true : undefined}
                  onClick={() => setPage(i)}
                  onKeyDown={(e) =>
                    (e.key === "Enter" || e.key === " ") && setPage(i)
                  }
                />
              ))}
            </div>
          )}
          {headerExtra}
        </div>
      </div>

      {pages.length > 0 && (
        <div className="cc-carousel-wrapper" ref={trackRef} {...swipe}>
          {multi && current > 0 && <NavArrow side="prev" onClick={goPrev} />}
          {multi && current < pages.length - 1 && (
            <NavArrow side="next" onClick={goNext} />
          )}
          {peekPrev && (
            <Peek
              key={`prev-${peekPrev.id}`}
              item={peekPrev}
              side="prev"
              onClick={goPrev}
            />
          )}
          {peekNext && (
            <Peek
              key={`next-${peekNext.id}`}
              item={peekNext}
              side="next"
              onClick={goNext}
            />
          )}

          <Carousel placement="bottom" activeIndex={current} onSelect={setPage}>
            {pages.map((slide, si) => (
              <div
                key={si}
                className="cc-slide"
                aria-hidden={si !== current}
                inert={si !== current}
              >
                {shouldRenderCarouselPage(si, current) && (
                  <>
                    {slide.map((it) => (
                      <ItemCard key={`${type}-${it.id}`} item={it} type={type} accessLevel={accessLevel} />
                    ))}
                    {Array.from({ length: visible - slide.length }).map((_, i) => (
                      <div
                        key={`empty-${i}`}
                        className="cc-item cc-item--empty"
                        style={{ flexGrow: 1 }}
                      />
                    ))}
                  </>
                )}
              </div>
            ))}
          </Carousel>
        </div>
      )}
    </div>
  );
}

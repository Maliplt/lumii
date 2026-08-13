import { useCallback, useEffect, useState } from "react";
import { Navigate, useParams, useNavigate, useLocation } from "react-router-dom";
import VidFastPlayer, { type VidFastProgressContext } from "../components/player/VidFastPlayer";
import { resolvePlaybackSource } from "../services/player";
import { tmdbApi } from "../services/tmdb";
import { canUseLevel, contentAccessLevel, isMobilePlaybackDevice, requestMobilePlaybackFullscreen, requiredPlanName, upgradeCtaLabel, useFetch } from "../helpers";
import { useAppDispatch, useAppSelector, startWatching, updateWatchProgress, selectAutoplayEnabled, selectLibrary, type SavedItem } from "../store/store";

interface PlayerNavState {
  title?: string;
  season?: number;
  episode?: number;
}

export default function PlayerPage() {
  const { type, id } = useParams<{ type: string; id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useAppDispatch();
  const isLoggedIn = useAppSelector((s) => !!s.auth.currentUser);
  const library = useAppSelector(selectLibrary);

  const userPlan = useAppSelector((s) => s.auth.currentUser?.plan);
  const catalogLevel = contentAccessLevel(type ?? "", id ?? "");
  const requiredLevel = catalogLevel === "free" ? "standard" : catalogLevel;
  const canPlay = canUseLevel(userPlan, requiredLevel);

  // otomatik oynatma
  const autoplay = useAppSelector(selectAutoplayEnabled);

  const navState = (location.state as PlayerNavState | null) ?? {};

  // kayıtlı pozisyon
  const numId = Number(id);
  const invalidRequest =
    (type !== "movie" && type !== "tv") ||
    !Number.isFinite(numId) ||
    numId <= 0;
  useEffect(() => {
    if (!autoplay || !canPlay || invalidRequest || !isMobilePlaybackDevice()) {
      return;
    }

    const timer = window.setTimeout(() => {
      void requestMobilePlaybackFullscreen();
    }, 150);

    return () => {
      window.clearTimeout(timer);
    };
  }, [autoplay, canPlay, invalidRequest]);
  const savedItem = library?.continueWatching.find(
    (x) => x.id === numId && x.media_type === type,
  );
  const savedProgress = savedItem?.watchProgress;
  const season = type === "tv" ? (navState.season ?? savedProgress?.season ?? 1) : undefined;
  const episode = type === "tv" ? (navState.episode ?? savedProgress?.episode ?? 1) : undefined;
  const [startPosition] = useState(() => {
    const p = savedProgress;
    if (!p || p.position >= p.duration - 15) return 0;
    if (
      type === "tv" &&
      ((p.season ?? 1) !== season || (p.episode ?? 1) !== episode)
    ) {
      return 0;
    }
    return p.position;
  });

  const source = !canPlay || invalidRequest
    ? null
    : resolvePlaybackSource({
        type,
        id,
        season,
        episode,
        autoPlay: autoplay,
        startAt: startPosition,
      });

  // metadata
  const metadata = useFetch(async () => {
    if (!canPlay || invalidRequest) return null;
    return type === "movie"
      ? tmdbApi.getMovieDetail(numId)
      : tmdbApi.getTVShowDetail(numId);
  }, `${type}-${id}-${canPlay}-${invalidRequest}`);

  const detail = metadata.data;
  const title = detail
    ? detail.media_type === "movie"
      ? detail.title
      : detail.name
    : (navState.title ?? "");

  useEffect(() => {
    if (detail && isLoggedIn && canPlay) {
      dispatch(startWatching({ ...detail } as SavedItem));
    }
  }, [detail, isLoggedIn, canPlay, dispatch]);

  const handleProgress = useCallback(
    (
      position: number,
      duration: number,
      progressContext?: VidFastProgressContext,
    ) => {
      if (!isLoggedIn || !type) return;
      dispatch(
        updateWatchProgress({
          id: numId,
          media_type: type as "movie" | "tv",
          position,
          duration,
          season: progressContext?.season ?? season,
          episode: progressContext?.episode ?? episode,
        }),
      );
    },
    [dispatch, isLoggedIn, numId, type, season, episode],
  );

  const episodeInfo =
    type === "tv" && season != null && episode != null
      ? `${season}. Sezon · ${episode}. Bölüm`
      : "";
  const openPlanOptions = () => navigate("/packages");

  if (invalidRequest) {
    return <Navigate to="/" replace />;
  }

  if (!canPlay) {
    return (
      <div className="player-page player-access-gate">
        <div className="player-access-gate__card">
          <h1>{requiredPlanName(requiredLevel)} paketine dahil</h1>
          <p>Bu yapımın tamamını izlemek için paketini değiştirebilirsin.</p>
          <button type="button" onClick={openPlanOptions}>{upgradeCtaLabel(requiredLevel)}</button>
          <button type="button" className="is-secondary" onClick={() => navigate(-1)}>Geri Dön</button>
        </div>
      </div>
    );
  }

  if (!source) return <Navigate to="/" replace />;

  return (
    <div className="player-page">
      <VidFastPlayer
        key={source.url}
        src={source.url}
        title={episodeInfo ? `${title} - ${episodeInfo}` : title}
        startPosition={startPosition}
        onBack={() => navigate(-1)}
        onProgress={handleProgress}
      />
    </div>
  );
}

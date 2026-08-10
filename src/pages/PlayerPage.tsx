import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import VidFastPlayer, { type VidFastProgressContext } from "../components/player/VidFastPlayer";
import Spinner from "../components/Spinner";
import ServiceErrorView from "../components/ServiceErrorView";
import { resolvePlaybackSource } from "../services/player";
import { tmdbApi } from "../services/tmdb";
import { ServiceError, serviceErrorMessage } from "../services/serviceError";
import { canUseLevel, contentAccessLevel, requiredPlanName, upgradeCtaLabel, useFetch } from "../helpers";
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
  // On-demand movies and series always require a paid plan.
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

  const sourceKey = `${type}-${id}-${season}-${episode}-${autoplay}-${canPlay}`;
  const playback = useFetch(async () => {
    if (!canPlay) return null;
    if (invalidRequest) {
      throw new ServiceError("not-found", serviceErrorMessage("not-found"));
    }
    const [source, detail] = await Promise.all([
      resolvePlaybackSource({ type, id, season, episode, autoPlay: autoplay }),
      type === "movie"
        ? tmdbApi.getMovieDetail(numId)
        : tmdbApi.getTVShowDetail(numId),
    ]);
    return { source, detail };
  }, `${sourceKey}-${invalidRequest}`);

  const detail = playback.data?.detail;
  const source = playback.data?.source;
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
    return (
      <div className="player-page">
        <ServiceErrorView
          error={new ServiceError("not-found", serviceErrorMessage("not-found"))}
          title="İçerik bulunamadı"
          onBack={() => navigate(-1)}
        />
      </div>
    );
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

  if (playback.error) {
    return (
      <div className="player-page">
        <ServiceErrorView
          error={playback.error}
          title="Oynatma başlatılamadı"
          onRetry={playback.retry}
          onBack={() => navigate(-1)}
        />
      </div>
    );
  }

  if (playback.loading || !source) {
    return (
      <div className="player-page">
        <Spinner />
      </div>
    );
  }

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

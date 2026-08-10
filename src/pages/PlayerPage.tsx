import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import MediaPlayer from "../components/player/MediaPlayer";
import TrailerPlayer from "../components/player/TrailerPlayer";
import Spinner from "../components/Spinner";
import ServiceErrorView from "../components/ServiceErrorView";
import { resolvePlaybackSource } from "../services/player";
import { tmdbApi } from "../services/tmdb";
import { ServiceError, serviceErrorMessage } from "../services/serviceError";
import { canUseLevel, contentAccessLevel, getPlan, requiredPlanName, upgradeCtaLabel, useFetch } from "../helpers";
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
  const planDef = getPlan(userPlan);
  const qualityLabel = planDef?.quality ?? "Full HD 1080p";
  const isFreeTier = planDef.free;
  const requiredLevel = contentAccessLevel(type ?? "", id ?? "");
  const canPlay = canUseLevel(userPlan, requiredLevel);

  // otomatik oynatma
  const autoplay = useAppSelector(selectAutoplayEnabled);

  const navState = (location.state as PlayerNavState | null) ?? {};
  const { season, episode } = navState;

  // kayıtlı pozisyon
  const numId = Number(id);
  const invalidRequest =
    (type !== "movie" && type !== "tv") ||
    !Number.isFinite(numId) ||
    numId <= 0;
  const savedItem = library?.continueWatching.find(
    (x) => x.id === numId && x.media_type === type,
  );
  const [startPosition] = useState(() => {
    const p = savedItem?.watchProgress;
    if (!p || p.position >= p.duration - 15) return 0;
    return p.position;
  });

  const sourceKey = `${type}-${id}-${canPlay}`;
  const playback = useFetch(async () => {
    if (!canPlay) return null;
    if (invalidRequest) {
      throw new ServiceError("not-found", serviceErrorMessage("not-found"));
    }
    const [source, detail] = await Promise.all([
      resolvePlaybackSource({ type, id }),
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
    (position: number, duration: number) => {
      if (!isLoggedIn || !type) return;
      dispatch(
        updateWatchProgress({
          id: numId,
          media_type: type as "movie" | "tv",
          position,
          duration,
          season,
          episode,
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
      {source.kind === "youtube" ? (
        <TrailerPlayer
          key={source.key}
          youtubeKey={source.key}
          title={title}
          subtitle={episodeInfo || source.name}
          startPosition={startPosition}
          autoPlay={autoplay}
          qualityLabel={qualityLabel}
          onUpgrade={!isLoggedIn || isFreeTier ? openPlanOptions : undefined}
          onBack={() => navigate(-1)}
          onProgress={handleProgress}
        />
      ) : (
        <MediaPlayer
          src={source.url}
          title={episodeInfo ? `${title} - ${episodeInfo}` : title}
          autoPlay={autoplay}
          startPosition={startPosition}
          qualityLabel={qualityLabel}
          maxVideoHeight={planDef.capabilities.maxVideoHeight}
          onUpgrade={!isLoggedIn || isFreeTier ? openPlanOptions : undefined}
          onBack={() => navigate(-1)}
          onProgress={handleProgress}
        />
      )}
    </div>
  );
}

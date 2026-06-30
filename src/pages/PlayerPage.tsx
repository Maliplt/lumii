import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import MediaPlayer from "../components/player/MediaPlayer";
import TrailerPlayer from "../components/player/TrailerPlayer";
import Spinner from "../components/Spinner";
import { useToast } from "../components/Toast";
import { resolvePlaybackSource, type PlaybackSource } from "../services/player";
import { tmdbApi } from "../services/tmdb";
import { PACKAGES } from "../helpers";
import {
  useAppDispatch,
  useAppSelector,
  startWatching,
  updateWatchProgress,
  selectActiveProfile,
  selectLibrary,
  type SavedItem,
} from "../store/store";
import type { MovieDetail, TVShowDetail } from "../types/types";

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
  const toast = useToast();

  const isLoggedIn = useAppSelector((s) => !!s.auth.currentUser);
  const library = useAppSelector(selectLibrary);

  const userPlan = useAppSelector((s) => s.auth.currentUser?.plan);
  const planDef =
    PACKAGES.find((p) => p.id === userPlan) ??
    PACKAGES.find((p) => p.id === "standard") ??
    PACKAGES[0];
  const qualityLabel = planDef?.quality ?? "Full HD 1080p";
  const isFreeTier = userPlan ? !!planDef?.free : false;

  // otomatik oynatma ayari
  const activeProfile = useAppSelector(selectActiveProfile);
  const settingsAutoplay = useAppSelector((s) => s.settings.autoplay);
  const autoplay = activeProfile?.playback
    ? activeProfile.playback === "auto"
    : settingsAutoplay;

  const navState = (location.state as PlayerNavState | null) ?? {};
  const [title, setTitle] = useState(navState.title ?? "");
  const { season, episode } = navState;

  // kayitli pozisyon
  const numId = Number(id);
  const savedItem = library?.continueWatching.find(
    (x) => x.id === numId && x.media_type === type,
  );
  const [startPosition] = useState(() => {
    const p = savedItem?.watchProgress;
    // bittiginde bastan baslat
    if (!p || p.position >= p.duration - 15) return 0;
    return p.position;
  });

  const sourceKey = `${type}-${id}`;
  const [resolved, setResolved] = useState<{
    key: string;
    src: PlaybackSource;
  } | null>(null);
  useEffect(() => {
    let alive = true;
    resolvePlaybackSource({ type, id }).then((src) => {
      if (alive) setResolved({ key: `${type}-${id}`, src });
    });
    return () => {
      alive = false;
    };
  }, [type, id]);
  // farkli baslik secilirse eski kaynagi gosterme
  const source = resolved?.key === sourceKey ? resolved.src : null;

  // baslik ve izleme kaydi
  useEffect(() => {
    if (!type || !id) return;
    const request =
      type === "movie"
        ? tmdbApi.getMovieDetail(numId)
        : tmdbApi.getTVShowDetail(numId);
    request
      .then((detail) => {
        setTitle(
          type === "movie"
            ? (detail as MovieDetail).title
            : (detail as TVShowDetail).name,
        );
        if (isLoggedIn) {
          dispatch(
            startWatching({
              ...detail,
              media_type: type as "movie" | "tv",
            } as SavedItem),
          );
        }
      })
      .catch(() => {
        toast("İçerik bilgisi yüklenemedi, oynatma devam ediyor.", "warning");
      });
  }, [type, id, numId, isLoggedIn, dispatch, toast]);

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

  if (!source) {
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
          youtubeKey={source.key}
          title={title}
          subtitle={episodeInfo || source.name}
          startPosition={startPosition}
          autoPlay={autoplay}
          qualityLabel={qualityLabel}
          onUpgrade={!isLoggedIn || isFreeTier ? () => navigate("/packages") : undefined}
          onBack={() => navigate(-1)}
          onProgress={handleProgress}
        />
      ) : (
        <MediaPlayer
          src={source.url}
          title={episodeInfo ? `${title} — ${episodeInfo}` : title}
          autoPlay={autoplay}
          startPosition={startPosition}
          qualityLabel={qualityLabel}
          onUpgrade={!isLoggedIn || isFreeTier ? () => navigate("/packages") : undefined}
          onBack={() => navigate(-1)}
          onProgress={handleProgress}
        />
      )}
    </div>
  );
}

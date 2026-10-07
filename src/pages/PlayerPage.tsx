import { useCallback, useEffect, useRef, useState } from "react";
import { Navigate, useParams, useNavigate, useLocation } from "react-router-dom";
import VidFastPlayer, { type VidFastProgressContext } from "../components/player/VidFastPlayer";
import MediaPlayer from "../components/player/MediaPlayer";
import StreamSourceSelector from "../components/player/StreamSourceSelector";
import AccessGate from "../components/access/AccessGate";
import { resolvePlaybackSource } from "../services/player";
import { getMediaDetail } from "../services/tmdb";
import { fetchTorrentioStreams } from "../services/torrentio";
import { canUseLevel, contentAccessLevel, requiredPlanName, upgradeCtaLabel, useFetch } from "../helpers";
import {
  useAppDispatch,
  useAppSelector,
  startWatching,
  updateWatchProgress,
  selectAutoplayEnabled,
  selectLibrary,
  selectShownProfile,
  type SavedItem,
} from "../store/store";
import type { StreamSource } from "../types/types";

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
  const profile = useAppSelector(selectShownProfile);

  const realDebridApiKey =
    profile?.preferences.realDebridApiKey ||
    import.meta.env.VITE_REALDEBRID_API_KEY?.trim();
  const preferredStreamProvider = profile?.preferences.preferredStreamProvider ?? "auto";

  const userPlan = useAppSelector((s) => s.auth.currentUser?.plan);
  const catalogLevel = contentAccessLevel(type ?? "", id ?? "");
  const requiredLevel = catalogLevel === "free" ? "standard" : catalogLevel;
  const canPlay = canUseLevel(userPlan, requiredLevel);

  // otomatik oynatma
  const autoplayEnabled = useAppSelector(selectAutoplayEnabled);

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

  const currentPositionRef = useRef(startPosition);

  // VidFast kaynağı
  const vidfastSource = !canPlay || invalidRequest
    ? null
    : resolvePlaybackSource({
        type,
        id,
        season,
        episode,
        autoplayEnabled,
        startAt: startPosition,
      });

  // Metadata
  const metadata = useFetch(async () => {
    if (!canPlay || invalidRequest) return null;
    return getMediaDetail(type as "movie" | "tv", numId);
  }, `${type}-${id}-${canPlay}-${invalidRequest}`, "enhancement");

  const detail = metadata.data;
  const title = detail
    ? detail.media_type === "movie"
      ? detail.title
      : detail.name
    : (navState.title ?? "");

  // Torrentio & Real-Debrid Akış Durumları
  const [availableStreams, setAvailableStreams] = useState<StreamSource[]>([]);
  const [selectedStream, setSelectedStream] = useState<StreamSource | null>(null);
  const [playerMode, setPlayerMode] = useState<"torrentio" | "vidfast">("vidfast");

  useEffect(() => {
    if (detail && isLoggedIn && canPlay) {
      dispatch(startWatching({ ...detail } as SavedItem));
    }
  }, [detail, isLoggedIn, canPlay, dispatch]);

  // Torrentio akışlarını yükleme
  useEffect(() => {
    let cancelled = false;

    if (!detail || !canPlay || invalidRequest) return;

    const imdbId = detail.imdb_id || detail.external_ids?.imdb_id;
    if (!imdbId) return;

    const loadStreams = async () => {
      try {
        const streams = await fetchTorrentioStreams({
          type: type === "movie" ? "movie" : "tv",
          imdbId,
          season,
          episode,
          realDebridApiKey,
        });

        if (cancelled) return;

        setAvailableStreams(streams);

        // Kullanıcı tercihine göre başlatıcı seçimi
        if (streams.length > 0 && preferredStreamProvider !== "vidfast") {
          // RD önbellekli veya en kaliteli akışı seç
          setSelectedStream(streams[0]);
          setPlayerMode("torrentio");
        } else {
          setPlayerMode("vidfast");
        }
      } catch {
        if (!cancelled) {
          setPlayerMode("vidfast");
        }
      }
    };

    loadStreams();

    return () => {
      cancelled = true;
    };
  }, [detail, canPlay, invalidRequest, type, season, episode, realDebridApiKey, preferredStreamProvider]);

  const handleProgress = useCallback(
    (
      position: number,
      duration: number,
      progressContext?: VidFastProgressContext,
    ) => {
      currentPositionRef.current = position;
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
        <AccessGate
          className="player-access-gate__card"
          headingLevel={1}
          title={`${requiredPlanName(requiredLevel)} paketine dahil`}
          description="Bu yapımın tamamını izlemek için paketini değiştirebilirsin."
          primaryLabel={upgradeCtaLabel(requiredLevel)}
          secondaryLabel="Geri Dön"
          onPrimary={openPlanOptions}
          onSecondary={() => navigate(-1)}
        />
      </div>
    );
  }

  const [failedStreamIds, setFailedStreamIds] = useState<Set<string>>(new Set());

  const handleStreamError = useCallback(
    (err: MediaError | null) => {
      console.warn(
        "Stream playback failed in browser (codec/container), trying next compatible stream...",
        err,
      );
      if (selectedStream) {
        setFailedStreamIds((prev) => {
          const next = new Set(prev);
          next.add(selectedStream.id);
          return next;
        });

        // Kalan denenmemiş akışlardan birini seç
        const nextStream = availableStreams.find(
          (s) => s.id !== selectedStream.id && !failedStreamIds.has(s.id),
        );

        if (nextStream) {
          setSelectedStream(nextStream);
        } else {
          // Bütün akışlar tarayıcıda başarısız olursa VidFast'e geç
          setPlayerMode("vidfast");
        }
      } else {
        setPlayerMode("vidfast");
      }
    },
    [availableStreams, failedStreamIds, selectedStream],
  );

  const displayTitle = episodeInfo ? `${title} - ${episodeInfo}` : title;

  // Torrentio / Real-Debrid ile Kendi MediaPlayer'ımız
  if (playerMode === "torrentio" && selectedStream) {
    return (
      <div className="player-page">
        <MediaPlayer
          key={selectedStream.url}
          src={selectedStream.url}
          title={displayTitle}
          autoplayEnabled={autoplayEnabled}
          startPosition={startPosition}
          qualityLabel={selectedStream.quality}
          onBack={() => navigate(-1)}
          onProgress={handleProgress}
          onError={handleStreamError}
          topRightAction={
            <StreamSourceSelector
              sources={availableStreams}
              activeSourceId={selectedStream.id}
              isVidFastActive={false}
              onSelectSource={(source) => {
                setSelectedStream(source);
                setPlayerMode("torrentio");
              }}
              onSwitchToVidFast={() => setPlayerMode("vidfast")}
              onOpenSettings={() => navigate("/account")}
            />
          }
        />
      </div>
    );
  }

  // VidFast Embed Oynatıcı (Fallback)
  return (
    <div className="player-page" style={{ position: "relative" }}>
      {vidfastSource && (
        <VidFastPlayer
          key={vidfastSource.url}
          src={vidfastSource.url}
          title={displayTitle}
          startPosition={currentPositionRef.current || startPosition}
          onBack={() => navigate(-1)}
          onProgress={handleProgress}
        />
      )}

      {/* VidFast üzerinde kaynak değiştirme butonu */}
      <div
        style={{
          position: "absolute",
          top: "max(16px, env(safe-area-inset-top))",
          right: "max(16px, env(safe-area-inset-right))",
          zIndex: 10,
        }}
      >
        <StreamSourceSelector
          sources={availableStreams}
          activeSourceId={selectedStream?.id}
          isVidFastActive={true}
          onSelectSource={(source) => {
            setSelectedStream(source);
            setPlayerMode("torrentio");
          }}
          onSwitchToVidFast={() => setPlayerMode("vidfast")}
          onOpenSettings={() => navigate("/account")}
        />
      </div>
    </div>
  );
}

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Navigate, useParams, useNavigate, useLocation } from "react-router-dom";
import AccessGate from "../components/access/AccessGate";
import CinemaPlayer from "../components/cinema-player/CinemaPlayer";
import { getImageUrl, getMediaDetail, getSimilarMedia, tmdbApi } from "../services/tmdb";
import {
  getTorboxStreams,
  DEFAULT_STREAM_API_KEY,
  detectPlaybackCapabilities,
  findBestStreamForQuality,
  findNextTorboxStreamIndex,
  streamsForPlayback,
  STREAM_QUALITY_ORDER,
  type TorboxResolution,
  type TorboxStream,
} from "../services/torbox";
import {
  getSubtitleOptions,
  mergeSubtitleOptions,
  rankSubtitleOptions,
  type SubtitleOption,
} from "../services/subtitles";
import {
  normalizeServiceError,
  optionalServiceRequest,
  playbackError,
  ServiceError,
} from "../services/serviceError";
import {
  canUseLevel,
  contentAccessLevel,
  requiredPlanName,
  upgradeCtaLabel,
  useFetch,
} from "../helpers";
import {
  useAppDispatch,
  useAppSelector,
  startWatching,
  updateWatchProgress,
  selectAutoplayEnabled,
  selectLibrary,
  sameSavedItem,
  toSavedItem,
  toggleLiked,
  toggleWatchlist,
  type SavedItem,
} from "../store/store";
import { toastText, useToast } from "../lib/toast";

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
  const isLoggedIn = useAppSelector((state) => !!state.auth.currentUser);
  const library = useAppSelector(selectLibrary);
  const autoplayEnabled = useAppSelector(selectAutoplayEnabled);
  const userPlan = useAppSelector((state) => state.auth.currentUser?.plan);
  const playbackCapabilities = useMemo(() => detectPlaybackCapabilities(), []);

  const catalogLevel = contentAccessLevel(type ?? "", id ?? "");
  const requiredLevel = catalogLevel === "free" ? "standard" : catalogLevel;
  const canPlay = canUseLevel(userPlan, requiredLevel);
  const navState = (location.state as PlayerNavState | null) ?? {};

  const numId = Number(id);
  const invalidRequest =
    (type !== "movie" && type !== "tv") ||
    !Number.isFinite(numId) ||
    numId <= 0;
  const savedItem = library?.continueWatching.find(
    (item) => item.id === numId && item.media_type === type,
  );
  const savedProgress = savedItem?.watchProgress;
  const season = type === "tv"
    ? (navState.season ?? savedProgress?.season ?? 1)
    : undefined;
  const episode = type === "tv"
    ? (navState.episode ?? savedProgress?.episode ?? 1)
    : undefined;
  const startPosition = useMemo(() => {
    const progress = savedProgress;
    if (!progress || progress.position >= progress.duration - 15) return 0;
    if (
      type === "tv" &&
      ((progress.season ?? 1) !== season || (progress.episode ?? 1) !== episode)
    ) {
      return 0;
    }
    return progress.position;
  }, [episode, savedProgress, season, type]);

  const metadata = useFetch(async () => {
    if (!canPlay || invalidRequest) return null;
    return getMediaDetail(type, numId);
  }, `${type}-${id}-${canPlay}-${invalidRequest}`, "page");

  const playbackExtras = useFetch(async () => {
    const currentDetail = metadata.data;
    if (!currentDetail || !canPlay || invalidRequest) return null;
    const similarPromise = optionalServiceRequest(getSimilarMedia(currentDetail.media_type, currentDetail.id));
    if (currentDetail.media_type === "movie" || season == null || episode == null) {
      return { similar: await similarPromise, currentSeason: null, previousSeason: null, followingSeason: null };
    }
    const currentSeason = await optionalServiceRequest(tmdbApi.getTVSeasonDetails(currentDetail.id, season));
    const currentIndex = currentSeason?.episodes.findIndex((item) => item.episode_number === episode) ?? -1;
    const needsFollowingSeason = currentIndex >= 0 &&
      currentIndex === (currentSeason?.episodes.length ?? 0) - 1 &&
      season < currentDetail.number_of_seasons;
    const needsPreviousSeason = currentIndex === 0 && season > 1;
    const previousSeason = needsPreviousSeason
      ? await optionalServiceRequest(tmdbApi.getTVSeasonDetails(currentDetail.id, season - 1))
      : null;
    const followingSeason = needsFollowingSeason
      ? await optionalServiceRequest(tmdbApi.getTVSeasonDetails(currentDetail.id, season + 1))
      : null;
    return { similar: await similarPromise, currentSeason, previousSeason, followingSeason };
  }, `player-extras-${type}-${id}-${season ?? 0}-${episode ?? 0}-${metadata.data?.id ?? 0}`, "section");

  const [streams, setStreams] = useState<TorboxStream[]>([]);
  const [subtitles, setSubtitles] = useState<SubtitleOption[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [streamsLoading, setStreamsLoading] = useState(false);
  const [streamsError, setStreamsError] = useState<ServiceError | null>(null);
  const [streamAttempt, setStreamAttempt] = useState(0);
  const failedSourceIdsRef = useRef(new Set<string>());
  const preferredQualityRef = useRef<TorboxResolution | null>(null);
  const selectedSourceIdRef = useRef<string | null>(null);
  const selectedSourceRef = useRef<TorboxStream | null>(null);
  const sourceSelectionLockedRef = useRef(false);
  const subtitleContentKeyRef = useRef("");

  const detail = metadata.data;
  const imdbId = detail?.external_ids?.imdb_id?.trim() ?? "";
  const title = detail
    ? detail.media_type === "movie"
      ? detail.title
      : detail.name
    : (navState.title ?? "");
  const sourceSearchTitle = detail
    ? detail.media_type === "movie"
      ? detail.original_title
      : detail.original_name
    : title;
  const releaseYear = Number(
    (detail?.media_type === "movie" ? detail.release_date : detail?.first_air_date)
      ?.slice(0, 4),
  ) || undefined;
  const streamConfigurationError = detail && !DEFAULT_STREAM_API_KEY
    ? new ServiceError("configuration")
    : detail && !imdbId
      ? playbackError()
      : null;
  const selectedStream = streams[selectedIndex];
  const selectedStreamId = selectedStream?.id ?? "";
  const selectedVideoHash = selectedStream?.videoHash ?? "";
  const selectedVideoSize = selectedStream?.sizeBytes ?? null;
  const selectedFilename = selectedStream?.filename ?? "";

  useEffect(() => {
    if (!detail || !canPlay || invalidRequest) return;
    if (!DEFAULT_STREAM_API_KEY || !imdbId) return;

    const controller = new AbortController();
    failedSourceIdsRef.current.clear();

    const applyStreams = (nextStreams: TorboxStream[], allowFallback = false) => {
      if (controller.signal.aborted || !nextStreams.length) return;
      const playableStreams = streamsForPlayback(
        nextStreams,
        playbackCapabilities,
        allowFallback,
      );
      if (!playableStreams.length) return;
      const retainedSource = selectedSourceRef.current;
      const availableStreams = selectedSourceIdRef.current && retainedSource &&
          !playableStreams.some((stream) => stream.id === selectedSourceIdRef.current)
        ? [retainedSource, ...playableStreams]
        : playableStreams;
      setStreams(availableStreams);
      const currentIndex = selectedSourceIdRef.current
        ? availableStreams.findIndex((stream) => stream.id === selectedSourceIdRef.current)
        : -1;
      if (currentIndex >= 0) {
        setSelectedIndex(currentIndex);
      } else {
        preferredQualityRef.current ??= "1080p";
        const bestIndex = findBestStreamForQuality(availableStreams, preferredQualityRef.current);
        selectedSourceIdRef.current = availableStreams[bestIndex]?.id ?? null;
        selectedSourceRef.current = availableStreams[bestIndex] ?? null;
        setSelectedIndex(Math.max(0, bestIndex));
      }
      setStreamsLoading(false);
    };

    Promise.resolve()
      .then(() => {
        if (controller.signal.aborted) return [] as TorboxStream[];
        setStreams([]);
        setSelectedIndex(0);
        selectedSourceIdRef.current = null;
        selectedSourceRef.current = null;
        sourceSelectionLockedRef.current = false;
        setStreamsLoading(true);
        setStreamsError(null);
        return getTorboxStreams({
          type: type as "movie" | "tv",
          imdbId,
          season,
          episode,
          title: sourceSearchTitle,
          year: releaseYear,
          originalLanguage: detail.original_language,
          signal: controller.signal,
          onPartial: applyStreams,
        });
      })
      .then((nextStreams) => {
        if (controller.signal.aborted) return;
        if (!nextStreams.length) throw playbackError();
        applyStreams(nextStreams, true);
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError") return;
        setStreams([]);
        setStreamsError(normalizeServiceError(error));
      })
      .finally(() => {
        if (!controller.signal.aborted) setStreamsLoading(false);
      });

    return () => controller.abort();
  }, [canPlay, detail, episode, imdbId, invalidRequest, playbackCapabilities, releaseYear, season, sourceSearchTitle, streamAttempt, type]);

  useEffect(() => {
    if (!selectedStreamId || !imdbId || invalidRequest) return;
    const controller = new AbortController();
    const contentKey = `${type}:${imdbId}:${season ?? 0}:${episode ?? 0}`;
    if (subtitleContentKeyRef.current !== contentKey) {
      subtitleContentKeyRef.current = contentKey;
      setSubtitles([]);
    }
    getSubtitleOptions({
      type: type as "movie" | "tv",
      imdbId,
      season,
      episode,
      videoHash: selectedVideoHash,
      videoSize: selectedVideoSize,
      filename: selectedFilename,
      signal: controller.signal,
      onPartial: (options) => {
        if (!controller.signal.aborted) {
          setSubtitles((current) => mergeSubtitleOptions(options, current));
        }
      },
    }).then((matches) => {
      if (!controller.signal.aborted && matches.length) {
        setSubtitles((current) => mergeSubtitleOptions(matches, current));
      }
    }).catch(() => undefined);
    return () => controller.abort();
  }, [episode, imdbId, invalidRequest, season, selectedFilename, selectedStreamId, selectedVideoHash, selectedVideoSize, type]);

  useEffect(() => {
    if (detail && isLoggedIn && canPlay) {
      dispatch(startWatching(toSavedItem({ ...detail } as SavedItem)));
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
    [dispatch, episode, isLoggedIn, numId, season, type],
  );

  const handlePlaybackError = () => {
    if (!selectedStream) return false;
    failedSourceIdsRef.current.add(selectedStream.id);
    const nextIndex = findNextTorboxStreamIndex(
      streams,
      selectedIndex,
      failedSourceIdsRef.current,
    );
    if (nextIndex < 0) return false;
    sourceSelectionLockedRef.current = true;
    selectedSourceIdRef.current = streams[nextIndex].id;
    selectedSourceRef.current = streams[nextIndex];
    setSelectedIndex(nextIndex);
    return true;
  };

  const sourceOptions = useMemo(
    () => streams.map((stream) => ({
      id: stream.id,
      provider: stream.provider,
      catalog: stream.catalog,
      release: stream.releaseName,
      quality: stream.resolution,
      codec: stream.codec,
      audioCodec: stream.audioCodec,
      audioCompatible: stream.audioCompatible,
      language: stream.language,
      sizeLabel: stream.sizeLabel,
    })),
    [streams],
  );

  const qualityOptions = useMemo(
    () => STREAM_QUALITY_ORDER
      .filter((quality) => streams.some((stream) => stream.resolution === quality))
      .map((quality) => ({
          id: quality,
          label: quality,
          active: selectedStream?.resolution === quality,
          available: true,
        })),
    [selectedStream?.resolution, streams],
  );

  const rankedSubtitles = useMemo(
    () => selectedStream
      ? rankSubtitleOptions(
          subtitles,
          [`${selectedStream.filename} ${selectedStream.releaseName}`],
          selectedStream.videoHash,
        )
      : [],
    [selectedStream, subtitles],
  );

  const recommendedSubtitle = rankedSubtitles.find((option) => option.language === "tur")
    ?? rankedSubtitles.find((option) => option.language === "eng")
    ?? null;

  const visibleSubtitles = rankedSubtitles.filter((option) => option.language === "tur" || option.language === "eng");

  const episodeInfo =
    type === "tv" && season != null && episode != null
      ? `${season}. Sezon · ${episode}. Bölüm`
      : "";
  const liked = detail
    ? library.liked.some((item) => sameSavedItem(item, { id: detail.id, media_type: detail.media_type }))
    : false;
  const currentSeasonEpisodes = playbackExtras.data?.currentSeason?.episodes ?? [];
  const currentEpisodeIndex = currentSeasonEpisodes.findIndex((item) => item.episode_number === episode);
  const previousEpisode = currentEpisodeIndex >= 0
    ? currentSeasonEpisodes[currentEpisodeIndex - 1] ?? playbackExtras.data?.previousSeason?.episodes.at(-1)
    : null;
  const previousSeasonNumber = currentSeasonEpisodes[currentEpisodeIndex - 1]
    ? season
    : playbackExtras.data?.previousSeason?.season_number;
  const followingEpisode = currentEpisodeIndex >= 0
    ? currentSeasonEpisodes[currentEpisodeIndex + 1] ?? playbackExtras.data?.followingSeason?.episodes[0]
    : null;
  const followingSeasonNumber = currentSeasonEpisodes[currentEpisodeIndex + 1]
    ? season
    : playbackExtras.data?.followingSeason?.season_number;
  const nextEpisode = type === "tv" && followingEpisode && followingSeasonNumber
    ? {
        title: followingEpisode.name || `${followingEpisode.episode_number}. Bölüm`,
        eyebrow: `${followingSeasonNumber}. Sezon · ${followingEpisode.episode_number}. Bölüm`,
        image: getImageUrl(followingEpisode.still_path || detail?.backdrop_path || null, "w780"),
        onPlay: () => navigate(`/tv/${numId}/player`, {
          state: {
            title,
            season: followingSeasonNumber,
            episode: followingEpisode.episode_number,
          },
        }),
      }
    : undefined;
  const playPreviousEpisode = type === "tv" && previousEpisode && previousSeasonNumber
    ? () => navigate(`/tv/${numId}/player`, {
        state: {
          title,
          season: previousSeasonNumber,
          episode: previousEpisode.episode_number,
        },
      })
    : undefined;
  const endRecommendations = (playbackExtras.data?.similar?.results ?? [])
    .filter((item) => item.backdrop_path || item.poster_path)
    .slice(0, 3)
    .map((item) => {
      const recommendationTitle = "title" in item ? item.title : item.name;
      const date = "release_date" in item ? item.release_date : item.first_air_date;
      const recommendationSaved = toSavedItem({ ...item, media_type: type } as SavedItem);
      const recommendationLiked = library.liked.some((entry) => sameSavedItem(entry, recommendationSaved));
      const recommendationInWatchlist = library.watchlist.some((entry) => sameSavedItem(entry, recommendationSaved));
      const requireRecommendationLogin = (message: string) => {
        if (isLoggedIn) return true;
        toast(message, "warning");
        navigate("/login", { state: { returnTo: location.pathname } });
        return false;
      };
      return {
        id: `${type}-${item.id}`,
        title: recommendationTitle,
        image: getImageUrl(item.backdrop_path || item.poster_path, "w780"),
        meta: date?.slice(0, 4),
        liked: recommendationLiked,
        inWatchlist: recommendationInWatchlist,
        onSelect: () => navigate(`/${type}/${item.id}/player`, {
          state: { title: recommendationTitle, ...(type === "tv" ? { season: 1, episode: 1 } : {}) },
        }),
        onLike: () => {
          if (!requireRecommendationLogin(toastText.loginForLike)) return;
          dispatch(toggleLiked(recommendationSaved));
          toast(recommendationLiked ? toastText.unliked : toastText.liked);
        },
        onWatchlist: () => {
          if (!requireRecommendationLogin(toastText.loginForWatchlist)) return;
          dispatch(toggleWatchlist(recommendationSaved));
          toast(recommendationInWatchlist ? toastText.watchlistRemoved : toastText.watchlistAdded);
        },
      };
    });
  const openPlanOptions = () => navigate("/packages");

  if (invalidRequest) return <Navigate to="/404" replace />;

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

  const pageError = metadata.error ?? streamConfigurationError ?? streamsError;
  const streamRequestPending = Boolean(
    !pageError && (!detail || !selectedStream),
  );

  return (
    <div className="player-page">
      <CinemaPlayer
        key={`${type}:${numId}:${season ?? 0}:${episode ?? 0}`}
        src={selectedStream?.url}
        streamType="file"
        mode={type === "tv" ? "episode" : "movie"}
        title={title}
        eyebrow={episodeInfo}
        poster={getImageUrl(detail?.backdrop_path ?? null, "w1280")}
        autoplay={autoplayEnabled}
        startPosition={startPosition}
        qualityLabel={selectedStream?.resolution}
        sourceOptions={sourceOptions}
        qualityOptions={qualityOptions}
        subtitleOptions={visibleSubtitles}
        subtitleSourceOptions={subtitles}
        preferredSubtitleId={recommendedSubtitle?.id}
        subtitleSelectionKey={`${type}:${imdbId}:${season ?? 0}:${episode ?? 0}`}
        loading={metadata.loading || streamsLoading || streamRequestPending}
        error={pageError}
        onRetry={metadata.error ? metadata.retry : () => setStreamAttempt((value) => value + 1)}
        minimumDuration={45}
        activeSourceId={selectedStream?.id}
        onSourceSelect={(sourceId) => {
          const nextIndex = streams.findIndex((stream) => stream.id === sourceId);
          if (nextIndex >= 0) {
            failedSourceIdsRef.current.clear();
            sourceSelectionLockedRef.current = true;
            selectedSourceIdRef.current = streams[nextIndex].id;
            selectedSourceRef.current = streams[nextIndex];
            setSelectedIndex(nextIndex);
          }
        }}
        onQualitySelect={(quality) => {
          const nextIndex = findBestStreamForQuality(
            streams,
            quality as TorboxResolution,
          );
          if (nextIndex >= 0) {
            failedSourceIdsRef.current.clear();
            sourceSelectionLockedRef.current = true;
            preferredQualityRef.current = quality as TorboxResolution;
            selectedSourceIdRef.current = streams[nextIndex].id;
            selectedSourceRef.current = streams[nextIndex];
            setSelectedIndex(nextIndex);
          }
        }}
        onPlaybackError={handlePlaybackError}
        onBack={() => navigate(-1)}
        onProgress={handleProgress}
        liked={liked}
        onLike={() => {
          if (!detail) return;
          if (!isLoggedIn) {
            toast(toastText.loginForLike, "warning");
            navigate("/login", { state: { returnTo: location.pathname } });
            return;
          }
          dispatch(toggleLiked(toSavedItem({ ...detail } as SavedItem)));
          toast(liked ? toastText.unliked : toastText.liked);
        }}
        nextEpisode={nextEpisode}
        onPrevious={playPreviousEpisode}
        onNext={nextEpisode?.onPlay}
        recommendations={endRecommendations}
      />
    </div>
  );
}

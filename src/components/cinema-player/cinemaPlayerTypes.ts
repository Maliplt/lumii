import type { SubtitleOption } from "../../services/subtitles";
import type { ServiceError } from "../../services/serviceError";

export type CinemaPlayerMode = "movie" | "episode" | "live";

export interface CinemaSourceOption {
  id: string;
  provider: string;
  catalog: string;
  release: string;
  quality: string;
  codec: string;
  audioCodec: string;
  audioCompatible: boolean;
  language: string;
  sizeLabel: string;
}

export interface CinemaQualityOption {
  id: string;
  label: string;
  active: boolean;
  available: boolean;
}

export interface CinemaNextEpisode {
  title: string;
  eyebrow: string;
  image?: string;
  onPlay: () => void;
}

export interface CinemaRecommendation {
  id: string;
  title: string;
  image: string;
  meta?: string;
  onSelect: () => void;
  liked?: boolean;
  inWatchlist?: boolean;
  onLike?: () => void;
  onWatchlist?: () => void;
}

export interface CinemaPlayerProps {
  src?: string;
  streamType?: "file" | "hls";
  mode: CinemaPlayerMode;
  title: string;
  eyebrow?: string;
  poster?: string;
  autoplay?: boolean;
  startMuted?: boolean;
  startPosition?: number;
  maxVideoHeight?: number;
  minimumDuration?: number;
  qualityLabel?: string;
  sourceOptions?: CinemaSourceOption[];
  qualityOptions?: CinemaQualityOption[];
  activeSourceId?: string;
  subtitleOptions?: SubtitleOption[];
  subtitleSourceOptions?: SubtitleOption[];
  preferredSubtitleId?: string;
  subtitleSelectionKey?: string;
  liked?: boolean;
  loading?: boolean;
  error?: ServiceError | null;
  nextEpisode?: CinemaNextEpisode;
  recommendations?: CinemaRecommendation[];
  className?: string;
  onBack?: () => void;
  onLike?: () => void;
  onRetry?: () => void;
  onProgress?: (position: number, duration: number) => void;
  onPrevious?: () => void;
  onNext?: () => void;
  onSourceSelect?: (id: string) => void;
  onQualitySelect?: (id: string) => void;
  onPlaybackError?: () => boolean;
}

export interface CaptionStyle {
  size: "small" | "medium" | "large";
  background: "none" | "soft" | "solid";
  color: "white" | "yellow" | "cyan";
  italic: boolean;
  bold: boolean;
}

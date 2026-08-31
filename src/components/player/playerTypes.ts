import type { SubtitleOption } from "../../services/subtitles";
import type { ServiceError } from "../../services/serviceError";

export interface SourcePickerOption {
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

export interface CaptionAppearance {
  size: "small" | "medium" | "large";
  background: "none" | "soft" | "solid";
  color: "white" | "yellow" | "cyan";
}

export interface QualityPickerOption {
  id: string;
  label: string;
  active: boolean;
  available: boolean;
}

export type SubtitlePickerOption = Pick<SubtitleOption, "id" | "label">;

export interface MediaPlayerProps {
  src?: string;
  streamType?: "file" | "hls";
  title?: string;
  live?: boolean;
  startMuted?: boolean;
  autoplayEnabled: boolean;
  startPosition?: number;
  qualityLabel?: string;
  maxVideoHeight?: number;
  onBack?: () => void;
  onUpgrade?: () => void;
  onProgress?: (position: number, duration: number) => void;
  onPrevious?: () => void;
  onNext?: () => void;
  sourceOptions?: SourcePickerOption[];
  qualityOptions?: QualityPickerOption[];
  activeSourceId?: string;
  onSourceSelect?: (id: string) => void;
  onQualitySelect?: (id: string) => void;
  onPlaybackError?: () => boolean;
  subtitleOptions?: SubtitleOption[];
  preferredSubtitleId?: string;
  subtitleSelectionKey?: string;
  loading?: boolean;
  error?: ServiceError | null;
  onRetry?: () => void;
  minimumDuration?: number;
  className?: string;
}

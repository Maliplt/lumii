import { playbackError } from "./serviceError";

const VIDFAST_BASE_URL = "https://vidfast.vc";

export interface PlaybackSource {
  kind: "vidfast";
  url: string;
}

export interface PlaybackRequest {
  type: string | undefined;
  id: string | number | undefined;
  season?: number;
  episode?: number;
  autoPlay?: boolean;
  startAt?: number;
}

export function resolvePlaybackSource({
  type,
  id,
  season = 1,
  episode = 1,
  autoPlay = true,
  startAt = 0,
}: PlaybackRequest): PlaybackSource {
  const numId = Number(id);
  if (
    (type !== "movie" && type !== "tv") ||
    !Number.isInteger(numId) ||
    numId <= 0
  ) {
    throw playbackError();
  }

  const path =
    type === "movie"
      ? `/movie/${numId}`
      : `/tv/${numId}/${Math.max(1, season)}/${Math.max(1, episode)}`;
  const params = new URLSearchParams({
    autoPlay: String(autoPlay),
    title: "true",
    poster: "true",
    theme: "A91D3A",
    sub: "tr",
    hideServer: "false",
    fullscreenButton: "true",
    chromecast: "true",
  });

  if (Number.isFinite(startAt) && startAt > 0) {
    params.set("startAt", String(Math.floor(startAt)));
  }

  if (type === "tv") {
    params.set("nextButton", "true");
    params.set("autoNext", String(autoPlay));
  }

  return { kind: "vidfast", url: `${VIDFAST_BASE_URL}${path}?${params}` };
}

import { tmdbApi, findBestTrailer } from "./tmdb";
import { contentRule } from "../lib/subscription";
import { playbackError } from "./serviceError";

export type PlaybackSource =
  | { kind: "youtube"; key: string; name: string }
  | { kind: "hls"; url: string };

export interface PlaybackRequest {
  type: string | undefined;
  id: string | number | undefined;
}

// oynatma kaynağı
export async function resolvePlaybackSource(
  req: PlaybackRequest,
): Promise<PlaybackSource> {
  const { type, id } = req;
  const numId = Number(id);
  const configured = contentRule(type ?? "", numId);
  if (configured?.manifest) return { kind: "hls", url: configured.manifest };
  if (
    (type === "movie" || type === "tv") &&
    Number.isFinite(numId) &&
    numId > 0
  ) {
    const videos = await tmdbApi.getVideos(type, numId);
    const trailer = findBestTrailer(videos.results);
    if (trailer) return { kind: "youtube", key: trailer.key, name: trailer.name };
  }
  throw playbackError();
}

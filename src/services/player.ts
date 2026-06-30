import { tmdbApi } from "./tmdb";
import type { Video } from "../types/types";

// test yayini
const TEST_HLS = "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8";

export type PlaybackSource =
  | { kind: "youtube"; key: string; name: string }
  | { kind: "hls"; url: string };

export interface PlaybackRequest {
  type: string | undefined;
  id: string | number | undefined;
}

function findTrailerVideo(videos: Video[]): Video | null {
  const yt = videos.filter((v) => v.site === "YouTube");
  return (
    yt.find((v) => v.official && v.type === "Trailer") ??
    yt.find((v) => v.type === "Trailer") ??
    yt.find((v) => v.type === "Teaser") ??
    yt[0] ??
    null
  );
}

// tmdb fragmani yoksa test hls kullanir
export async function resolvePlaybackSource(
  req: PlaybackRequest,
): Promise<PlaybackSource> {
  const { type, id } = req;
  const numId = Number(id);
  if (
    (type === "movie" || type === "tv") &&
    Number.isFinite(numId) &&
    numId > 0
  ) {
    try {
      const videos = await tmdbApi.getVideos(type, numId);
      const trailer = findTrailerVideo(videos.results);
      if (trailer) return { kind: "youtube", key: trailer.key, name: trailer.name };
    } catch (err) {
      console.warn("Fragman çözümlenemedi, fallback yayına geçiliyor:", err);
    }
  }
  return { kind: "hls", url: TEST_HLS };
}

export function getFallbackStream(): string {
  return TEST_HLS;
}

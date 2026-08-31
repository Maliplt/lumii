import type { Movie, TVShow, SearchResult } from "../types/types";
import { normalizeServiceError } from "../services/serviceError";

// liste çözümleme
export async function settleList<T extends readonly unknown[]>(
  requests: readonly [...T],
): Promise<{ [K in keyof T]: Awaited<T[K]> | null }> {
  const results = await Promise.allSettled(requests);
  if (results.every((result) => result.status === "rejected")) {
    const firstFailure = results.find(
      (result): result is PromiseRejectedResult => result.status === "rejected",
    );
    throw normalizeServiceError(firstFailure?.reason);
  }
  return results.map((result) =>
    result.status === "fulfilled" ? result.value : null,
  ) as { [K in keyof T]: Awaited<T[K]> | null };
}

export function isLatinTitle(text: string): boolean {
  return !/[^ -ɏḀ-ỿ\s]/.test(text);
}

export function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

// uzun tarih formati
export function formatLongDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("tr-TR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

interface YoutubeEmbedOptions {
  autoplay: boolean;
  muted?: boolean;
}

export async function settleTasks<T>(
  tasks: readonly (() => Promise<T>)[],
  concurrency = 3,
): Promise<Array<T | null>> {
  const results: Array<T | null> = [];
  let firstFailure: unknown;
  let fulfilled = 0;
  const batchSize = Math.max(1, Math.floor(concurrency));

  for (let index = 0; index < tasks.length; index += batchSize) {
    const batch = await Promise.allSettled(
      tasks.slice(index, index + batchSize).map((task) => task()),
    );
    batch.forEach((result) => {
      if (result.status === "fulfilled") {
        fulfilled += 1;
        results.push(result.value);
      } else {
        firstFailure ??= result.reason;
        results.push(null);
      }
    });
  }

  if (!fulfilled && tasks.length) throw normalizeServiceError(firstFailure);
  return results;
}

// youtube embed
export function buildYoutubeEmbedUrl(
  key: string,
  { autoplay, muted = true }: YoutubeEmbedOptions,
): string {
  const domain = "www.youtube-nocookie.com";
  const params = new URLSearchParams({
    autoplay: autoplay ? "1" : "0",
    mute: muted ? "1" : "0",
    controls: "0",
    disablekb: "1",
    fs: "0",
    rel: "0",
    iv_load_policy: "3",
    playsinline: "1",
    cc_load_policy: "0",
  });
  return `https://${domain}/embed/${key}?${params.toString()}`;
}

export const mediaName = (m: Movie | TVShow): string =>
  "title" in m ? m.title : m.name;

export const mediaYear = (m: Movie | TVShow): string =>
  ("release_date" in m ? m.release_date : m.first_air_date)?.slice(0, 4) ?? "";

export function mediaTypeOf(
  media: { media_type?: string; title?: unknown; name?: unknown },
  fallback: "movie" | "tv" = "tv",
): "movie" | "tv" {
  if (media.media_type === "movie" || media.media_type === "tv") {
    return media.media_type;
  }
  if ("title" in media) return "movie";
  if ("name" in media) return "tv";
  return fallback;
}

type MediaItem = Movie | TVShow;

export function isKidsMedia(item: MediaItem): boolean {
  if ("title" in item) {
    return !item.adult && item.genre_ids?.includes(10751);
  }
  return item.genre_ids?.includes(10762);
}

export const withPoster = <T extends readonly MediaItem[]>(
  list: T,
): Array<T[number]> => list.filter((m) => m.poster_path);

export const withMedia = <T extends readonly MediaItem[]>(
  list: T,
): Array<T[number]> => list.filter((m) => m.poster_path && m.backdrop_path);

export function heroFrom<T extends readonly MediaItem[]>(
  list: T,
  count = 5,
): Array<T[number]> {
  return withMedia(list)
    .filter((m) => isLatinTitle(mediaName(m)) && m.overview?.trim())
    .slice(0, count);
}

export function interleaveEvenly<T>(primary: T[], featured: T[]): T[] {
  if (!primary.length) return [...featured];
  if (!featured.length) return [...primary];

  const result: T[] = [];
  let featuredIndex = 0;
  primary.forEach((item, index) => {
    result.push(item);
    const target = Math.floor(((index + 1) * featured.length) / primary.length);
    while (featuredIndex < target) {
      result.push(featured[featuredIndex]);
      featuredIndex += 1;
    }
  });
  return result;
}

export function formatTime(s: number): string {
  if (!isFinite(s) || isNaN(s) || s < 0) return "0:00";
  const total = Math.floor(s);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const sec = total % 60;
  if (h > 0)
    return `${h}:${m.toString().padStart(2, "0")}:${sec.toString().padStart(2, "0")}`;
  return `${m}:${sec.toString().padStart(2, "0")}`;
}

export function isPlayableSearchResult(result: {
  media_type?: string;
  poster_path?: string | null;
}): result is SearchResult {
  return (
    (result.media_type === "movie" || result.media_type === "tv") &&
    !!result.poster_path
  );
}

// buton animasyonu
export function popButton(el: HTMLElement) {
  el.classList.remove("is-pop");
  void el.offsetWidth;
  el.classList.add("is-pop");
}

import type { Movie, TVShow, SearchResult } from "../types/types";

// tek istek hatasinda sayfa bosalmasin
export async function settleList<T extends readonly unknown[]>(
  requests: readonly [...T],
): Promise<{ [K in keyof T]: Awaited<T[K]> | null }> {
  const results = await Promise.allSettled(requests);
  if (results.every((result) => result.status === "rejected")) {
    throw new Error("Tum liste istekleri basarisiz oldu.");
  }
  return results.map((result) =>
    result.status === "fulfilled" ? result.value : null,
  ) as { [K in keyof T]: Awaited<T[K]> | null };
}

export function isLatinTitle(text: string): boolean {
  return !/[^ -ɏḀ-ỿ\s]/.test(text);
}

export const mediaName = (m: Movie | TVShow): string =>
  "title" in m ? m.title : m.name;

export const mediaYear = (m: Movie | TVShow): string =>
  ("release_date" in m ? m.release_date : m.first_air_date)?.slice(0, 4) ?? "";

type MediaItem = Movie | TVShow;

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

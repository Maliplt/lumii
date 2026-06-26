import axios from "axios";
import type {
  Movie,
  TVShow,
  TMDBResponse,
  SearchResult,
  MovieDetail,
  TVShowDetail,
  TVSeasonDetail,
  Video,
  VideosResponse,
} from "../types/types";

const IMAGE_BASE_URL = "https://image.tmdb.org/t/p";

// tmdb tur id -> turkce (film + dizi)
export const GENRES: Record<number, string> = {
  28: "Aksiyon", 12: "Macera", 16: "Animasyon", 35: "Komedi", 80: "Suç",
  99: "Belgesel", 18: "Dram", 10751: "Aile", 14: "Fantastik", 36: "Tarih",
  27: "Korku", 10402: "Müzik", 9648: "Gizem", 10749: "Romantik", 878: "Bilim-Kurgu",
  10770: "TV Film", 53: "Gerilim", 10752: "Savaş", 37: "Western",
  10759: "Aksiyon & Macera", 10762: "Çocuk", 10763: "Haber", 10764: "Realite",
  10765: "Bilim-Kurgu & Fantastik", 10766: "Pembe Dizi", 10767: "Talk Show",
  10768: "Savaş & Politika",
};

// tur id'lerinden okunabilir etiketler
export function genreNames(ids: number[] = [], limit = 3): string[] {
  return ids.map((id) => GENRES[id]).filter(Boolean).slice(0, limit);
}

// dakikadan "2sa 15dk" / "48dk"
export function formatRuntime(mins?: number | null): string {
  if (!mins || mins <= 0) return "";
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return h ? `${h}sa ${m}dk` : `${m}dk`;
}

const tmdbClient = axios.create({
  baseURL: "https://api.themoviedb.org/3",
  params: {
    api_key: import.meta.env.VITE_TMDB_API_KEY,
    language: "tr-TR",
  },
});

// istek
async function tmdbFetch<T>(
  endpoint: string,
  params: Record<string, string | number> = {},
): Promise<T> {
  const response = await tmdbClient.get<T>(endpoint, { params });
  return response.data;
}

export const getImageUrl = (
  path: string | null,
  size: "w300" | "w500" | "w780" | "w1280" | "original" = "w500",
): string => {
  if (!path) return "https://placehold.co/500x750?text=No+Image";
  return `${IMAGE_BASE_URL}/${size}${path}`;
};

// fragman sec
export function pickTrailer(videos: Video[]): string | null {
  const youtube = videos.filter((v) => v.site === "YouTube");
  const trailer =
    youtube.find((v) => v.official && v.type === "Trailer") ??
    youtube.find((v) => v.type === "Trailer") ??
    youtube.find((v) => v.type === "Teaser") ??
    youtube[0];
  return trailer?.key ?? null;
}

export const tmdbApi = {
  getPopularMovies: (page = 1): Promise<TMDBResponse<Movie>> =>
    tmdbFetch<TMDBResponse<Movie>>("/movie/popular", { page }),

  getPopularTVShows: (page = 1): Promise<TMDBResponse<TVShow>> =>
    tmdbFetch<TMDBResponse<TVShow>>("/tv/popular", { page }),

  search: (query: string, page = 1): Promise<TMDBResponse<SearchResult>> =>
    tmdbFetch<TMDBResponse<SearchResult>>("/search/multi", { query, page }),

  getMovieDetail: (id: number): Promise<MovieDetail> =>
    tmdbFetch<MovieDetail>(`/movie/${id}`, {
      append_to_response: "credits,videos",
      include_video_language: "tr,en,null",
    }),

  getTVShowDetail: (id: number): Promise<TVShowDetail> =>
    tmdbFetch<TVShowDetail>(`/tv/${id}`, {
      append_to_response: "credits,videos",
      include_video_language: "tr,en,null",
    }),

  getSimilarMovies: (id: number): Promise<TMDBResponse<Movie>> =>
    tmdbFetch<TMDBResponse<Movie>>(`/movie/${id}/similar`),

  getSimilarTVShows: (id: number): Promise<TMDBResponse<TVShow>> =>
    tmdbFetch<TMDBResponse<TVShow>>(`/tv/${id}/similar`),

  getTVSeasonDetails: (
    tvId: number,
    seasonNumber: number,
  ): Promise<TVSeasonDetail> =>
    tmdbFetch<TVSeasonDetail>(`/tv/${tvId}/season/${seasonNumber}`),

  // en-US cek
  getVideos: (type: "movie" | "tv", id: number): Promise<VideosResponse> =>
    tmdbFetch<VideosResponse>(`/${type}/${id}/videos`, { language: "en-US" }),

  getTopRatedMovies: (page = 1): Promise<TMDBResponse<Movie>> =>
    tmdbFetch<TMDBResponse<Movie>>("/movie/top_rated", { page }),

  getTopRatedTVShows: (page = 1): Promise<TMDBResponse<TVShow>> =>
    tmdbFetch<TMDBResponse<TVShow>>("/tv/top_rated", { page }),

  getTrendingMovies: (page = 1): Promise<TMDBResponse<Movie>> =>
    tmdbFetch<TMDBResponse<Movie>>("/trending/movie/day", { page }),

  getTrendingTVShows: (page = 1): Promise<TMDBResponse<TVShow>> =>
    tmdbFetch<TMDBResponse<TVShow>>("/trending/tv/day", { page }),

  getUpcomingMovies: (page = 1): Promise<TMDBResponse<Movie>> =>
    tmdbFetch<TMDBResponse<Movie>>("/movie/upcoming", { page }),

  getNowPlayingMovies: (page = 1): Promise<TMDBResponse<Movie>> =>
    tmdbFetch<TMDBResponse<Movie>>("/movie/now_playing", { page }),

  getAiringTodayTVShows: (page = 1): Promise<TMDBResponse<TVShow>> =>
    tmdbFetch<TMDBResponse<TVShow>>("/tv/airing_today", { page }),

  getOnTheAirTVShows: (page = 1): Promise<TMDBResponse<TVShow>> =>
    tmdbFetch<TMDBResponse<TVShow>>("/tv/on_the_air", { page }),

  getMoviesByGenre: (
    genreId: number | string,
    page = 1,
    sortBy?: string,
  ): Promise<TMDBResponse<Movie>> =>
    tmdbFetch<TMDBResponse<Movie>>("/discover/movie", {
      with_genres: genreId,
      page,
      ...(sortBy ? { sort_by: sortBy, "vote_count.gte": 200 } : {}),
    }),

  getTVShowsByGenre: (
    genreId: number | string,
    page = 1,
    sortBy?: string,
  ): Promise<TMDBResponse<TVShow>> =>
    tmdbFetch<TMDBResponse<TVShow>>("/discover/tv", {
      with_genres: genreId,
      page,
      ...(sortBy ? { sort_by: sortBy, "vote_count.gte": 100 } : {}),
    }),
};

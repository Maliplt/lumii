import axios from "axios";
import type { Movie, TVShow, TMDBResponse, SearchResult, MovieDetail, TVShowDetail, TVSeasonDetail, Video, VideosResponse, MovieCollection, PersonWithMovieCredits } from "../types/types";
import {
  normalizeServiceError,
  ServiceError,
  serviceErrorMessage,
} from "./serviceError";

const IMAGE_BASE_URL = "https://image.tmdb.org/t/p";
const TMDB_API_KEY = import.meta.env.VITE_TMDB_API_KEY?.trim();

// tür çevirisi
export const GENRES: Record<number, string> = {
  28: "Aksiyon", 12: "Macera", 16: "Animasyon", 35: "Komedi", 80: "Suç",
  99: "Belgesel", 18: "Dram", 10751: "Aile", 14: "Fantastik", 36: "Tarih",
  27: "Korku", 10402: "Müzik", 9648: "Gizem", 10749: "Romantik", 878: "Bilim-Kurgu",
  10770: "TV Film", 53: "Gerilim", 10752: "Savaş", 37: "Western",
  10759: "Aksiyon & Macera", 10762: "Çocuk", 10763: "Haber", 10764: "Realite",
  10765: "Bilim-Kurgu & Fantastik", 10766: "Pembe Dizi", 10767: "Talk Show",
  10768: "Savaş & Politika",
};

// tür isimleri
export function genreNames(ids: number[] = [], limit = 3): string[] {
  return ids.map((id) => GENRES[id]).filter(Boolean).slice(0, limit);
}

// süre formatı
export function formatRuntime(mins?: number | null): string {
  if (!mins || mins <= 0) return "";
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return h ? `${h}sa ${m}dk` : `${m}dk`;
}

const tmdbClient = axios.create({
  baseURL: "https://api.themoviedb.org/3",
  params: {
    api_key: TMDB_API_KEY,
    language: "tr-TR",
  },
});

tmdbClient.interceptors.request.use((config) => {
  if (!TMDB_API_KEY) {
    return Promise.reject(
      new ServiceError("configuration", serviceErrorMessage("configuration")),
    );
  }
  return config;
});

tmdbClient.interceptors.response.use(
  (response) => response,
  (error: unknown) => Promise.reject(normalizeServiceError(error)),
);

// veri çekme
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

// fragman seçimi
export function findBestTrailer(videos: Video[]): Video | null {
  const youtube = videos.filter((v) => v.site === "YouTube");
  return (
    youtube.find((v) => v.official && v.type === "Trailer") ??
    youtube.find((v) => v.type === "Trailer") ??
    youtube.find((v) => v.type === "Teaser") ??
    youtube[0] ??
    null
  );
}

export function pickTrailer(videos: Video[]): string | null {
  return findBestTrailer(videos)?.key ?? null;
}

export const tmdbApi = {
  getPopularMovies: (page = 1): Promise<TMDBResponse<Movie>> =>
    tmdbFetch<TMDBResponse<Movie>>("/movie/popular", { page }),

  getPopularTVShows: (page = 1): Promise<TMDBResponse<TVShow>> =>
    tmdbFetch<TMDBResponse<TVShow>>("/tv/popular", { page }),

  search: (query: string, page = 1): Promise<TMDBResponse<SearchResult>> =>
    tmdbFetch<TMDBResponse<SearchResult>>("/search/multi", { query, page }),

  getMovieCollection: async (id: number): Promise<MovieCollection> => {
    const data = await tmdbFetch<MovieCollection>(`/collection/${id}`);
    const needsFallback = data.parts.some(
      (movie) => !movie.title?.trim() || !movie.overview?.trim(),
    );
    if (!needsFallback) return data;

    const fallback = await tmdbFetch<MovieCollection>(`/collection/${id}`, {
      language: "en-US",
    }).catch(() => null);
    if (!fallback) return data;

    const fallbackMovies = new Map(
      fallback.parts.map((movie) => [movie.id, movie]),
    );
    return {
      ...data,
      name: data.name?.trim() || fallback.name,
      overview: data.overview?.trim() || fallback.overview,
      backdrop_path: data.backdrop_path || fallback.backdrop_path,
      poster_path: data.poster_path || fallback.poster_path,
      parts: data.parts.map((movie) => {
        const english = fallbackMovies.get(movie.id);
        return {
          ...movie,
          title: movie.title?.trim() || english?.title || movie.original_title,
          overview: movie.overview?.trim() || english?.overview || "",
          poster_path: movie.poster_path || english?.poster_path || null,
          backdrop_path: movie.backdrop_path || english?.backdrop_path || null,
        };
      }),
    };
  },

  getPersonMovieCredits: (id: number): Promise<PersonWithMovieCredits> =>
    tmdbFetch<PersonWithMovieCredits>(`/person/${id}`, {
      append_to_response: "movie_credits",
    }),

  getMovieDetail: async (id: number): Promise<MovieDetail> => {
    const data = await tmdbFetch<Omit<MovieDetail, "media_type">>(`/movie/${id}`, {
      append_to_response: "credits,videos",
      include_video_language: "tr,en,null",
    });
    return { ...data, media_type: "movie" };
  },

  getTVShowDetail: async (id: number): Promise<TVShowDetail> => {
    const data = await tmdbFetch<Omit<TVShowDetail, "media_type">>(`/tv/${id}`, {
      append_to_response: "credits,videos",
      include_video_language: "tr,en,null",
    });
    if (data.overview?.trim()) return { ...data, media_type: "tv" };

    const fallback = await tmdbFetch<Omit<TVShowDetail, "media_type">>(
      `/tv/${id}`,
      { language: "en-US" },
    ).catch(() => null);
    return {
      ...data,
      overview: data.overview?.trim() || fallback?.overview || "",
      tagline: data.tagline?.trim() || fallback?.tagline || "",
      episode_run_time: data.episode_run_time?.length
        ? data.episode_run_time
        : (fallback?.episode_run_time ?? []),
      media_type: "tv",
    };
  },

  getSimilarMovies: (id: number): Promise<TMDBResponse<Movie>> =>
    tmdbFetch<TMDBResponse<Movie>>(`/movie/${id}/similar`),

  getSimilarTVShows: (id: number): Promise<TMDBResponse<TVShow>> =>
    tmdbFetch<TMDBResponse<TVShow>>(`/tv/${id}/similar`),

  getTVSeasonDetails: async (
    tvId: number,
    seasonNumber: number,
  ): Promise<TVSeasonDetail> => {
    const data = await tmdbFetch<TVSeasonDetail>(
      `/tv/${tvId}/season/${seasonNumber}`,
    );
    const needsFallback =
      !data.overview?.trim() ||
      data.episodes.some(
        (episode) => !episode.name?.trim() || !episode.overview?.trim(),
      );
    if (!needsFallback) return data;

    const fallback = await tmdbFetch<TVSeasonDetail>(
      `/tv/${tvId}/season/${seasonNumber}`,
      { language: "en-US" },
    ).catch(() => null);
    if (!fallback) return data;

    const fallbackEpisodes = new Map(
      fallback.episodes.map((episode) => [episode.episode_number, episode]),
    );
    return {
      ...data,
      name: data.name?.trim() || fallback.name,
      overview: data.overview?.trim() || fallback.overview,
      episodes: data.episodes.map((episode) => {
        const english = fallbackEpisodes.get(episode.episode_number);
        return {
          ...episode,
          name: episode.name?.trim() || english?.name || "",
          overview: episode.overview?.trim() || english?.overview || "",
        };
      }),
    };
  },

  // video listesi
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

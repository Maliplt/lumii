export interface Movie {
  id: number;
  title: string;
  original_title: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  release_date: string;
  genre_ids: number[];
  adult: boolean;
  original_language: string;
  popularity: number;
  vote_average: number;
  vote_count: number;
  video: boolean;
}

export interface TVShow {
  id: number;
  name: string;
  original_name: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  first_air_date: string;
  genre_ids: number[];
  origin_country: string[];
  original_language: string;
  popularity: number;
  vote_average: number;
  vote_count: number;
}

export interface TMDBResponse<T> {
  page: number;
  results: T[];
  total_pages: number;
  total_results: number;
}

export interface MovieCollection {
  id: number;
  name: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  parts: Movie[];
}

export interface PersonMovieCredit extends Movie {
  character?: string;
  order?: number;
}

export interface PersonWithMovieCredits {
  id: number;
  name: string;
  profile_path: string | null;
  movie_credits: {
    cast: PersonMovieCredit[];
  };
}

export type SearchResult =
  | (Movie & { media_type: "movie" })
  | (TVShow & { media_type: "tv" });

export interface Genre {
  id: number;
  name: string;
}

export interface CastMember {
  id: number;
  name: string;
  character: string;
  profile_path: string | null;
}

export interface CrewMember {
  id: number;
  name: string;
  job: string;
  department: string;
}

export interface Credits {
  cast: CastMember[];
  crew: CrewMember[];
}

export interface ExternalIds {
  imdb_id?: string | null;
  facebook_id?: string | null;
  instagram_id?: string | null;
  twitter_id?: string | null;
  id?: number;
}

export interface MovieDetail extends Movie {
  media_type: "movie";
  genres: Genre[];
  runtime: number | null;
  tagline: string;
  status: string;
  imdb_id?: string | null;
  external_ids?: ExternalIds;
  credits?: Credits;
  videos?: VideosResponse;
}

export interface TVShowDetail extends TVShow {
  media_type: "tv";
  genres: Genre[];
  episode_run_time: number[];
  tagline: string;
  status: string;
  imdb_id?: string | null;
  external_ids?: ExternalIds;
  number_of_seasons: number;
  number_of_episodes: number;
  credits?: Credits;
  videos?: VideosResponse;
}

export interface Episode {
  id: number;
  name: string;
  overview: string;
  episode_number: number;
  air_date: string | null;
  still_path: string | null;
  runtime: number | null;
}

export interface TVSeasonDetail {
  id: number;
  name: string;
  season_number: number;
  overview: string;
  air_date: string | null;
  poster_path: string | null;
  episodes: Episode[];
}

export interface Video {
  key: string;
  site: string;
  type: string;
  name: string;
  official: boolean;
  iso_639_1: string;
  published_at: string;
}

export interface VideosResponse {
  id: number;
  results: Video[];
}

export interface PackageDef {
  id: string;
  name: string;
  price: string;
  period: string;
  icon: "Play" | "Zap" | "Crown";
  badge: string | null;
  accent: boolean;
  features: string[];
  summary?: string;
  quality?: string;
  screens?: string;
  downloads?: string;
  support?: string;
  cta: string;
  free: boolean;
  capabilities: PlanCapabilities;
}

export type PlanId = "free" | "standard" | "premium";
export type ContentAccessLevel = PlanId;

export interface PlanCapabilities {
  maxVideoHeight: 480 | 720 | 1080;
  contentLevel: ContentAccessLevel;
  liveTvChannelLimit: number | null;
  concurrentStreams: number;
  hasAds: boolean;
  canDownload: boolean;
}

export interface TorrentioStream {
  name: string;
  title: string;
  url?: string;
  infoHash?: string;
  fileIdx?: number;
  behaviorHints?: {
    bingeGroup?: string;
    filename?: string;
  };
}

export interface TorrentioResponse {
  streams?: TorrentioStream[];
}

export interface StreamSource {
  id: string;
  title: string;
  quality: "4K" | "1080p" | "720p" | "480p" | "SD" | "Bilinmeyen";
  size?: string;
  codec?: string;
  audio?: string;
  tracker?: string;
  format?: "mp4" | "mkv" | "webm" | "other";
  isBrowserFriendly: boolean;
  isRealDebrid: boolean;
  url: string;
  originalName: string;
  originalTitle: string;
}


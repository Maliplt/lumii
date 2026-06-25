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

export interface MovieDetail extends Movie {
  genres: Genre[];
  runtime: number | null;
  tagline: string;
  status: string;
  credits?: Credits;
  videos?: VideosResponse;
}

export interface TVShowDetail extends TVShow {
  genres: Genre[];
  episode_run_time: number[];
  tagline: string;
  status: string;
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
  icon: string;
  badge: string | null;
  accent: boolean;
  features: string[];
  cta: string;
  free: boolean;
}

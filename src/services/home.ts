import { tmdbApi } from "./tmdb";
import { withPoster, withMedia, heroFrom, settleList } from "../lib/utils";
import type { Movie, TVShow } from "../types/types";

export type HomeMedia = Movie | TVShow;

const HERO_COUNT = 5;

export interface HomeCriticalData {
  heroMovies: HomeMedia[];
  popular: HomeMedia[];
  nowPlaying: HomeMedia[];
  trendingMovies: HomeMedia[];
  popularTV: HomeMedia[];
  trendingTV: HomeMedia[];
}

// ana satırlar
export async function loadCriticalHome(): Promise<HomeCriticalData> {
  const [popularMovies, nowPlayingMovies, trending, popularTV, trendingShows] =
    await settleList([
      tmdbApi.getPopularMovies(),
      tmdbApi.getNowPlayingMovies(),
      tmdbApi.getTrendingMovies(),
      tmdbApi.getPopularTVShows(),
      tmdbApi.getTrendingTVShows(),
    ]);
  return {
    heroMovies: heroFrom(popularMovies?.results ?? [], HERO_COUNT),
    popular: withMedia(popularMovies?.results ?? []),
    nowPlaying: withPoster(nowPlayingMovies?.results ?? []),
    trendingMovies: withPoster(trending?.results ?? []),
    popularTV: withPoster(popularTV?.results ?? []),
    trendingTV: withPoster(trendingShows?.results ?? []),
  };
}

export interface HomeRestData {
  upcoming: HomeMedia[];
  topRatedTV: HomeMedia[];
  airingToday: HomeMedia[];
  adventure: HomeMedia[];
  animation: HomeMedia[];
  topMovies: HomeMedia[];
  horrorMovies: HomeMedia[];
  comedyMovies: HomeMedia[];
  thrillerMovies: HomeMedia[];
  sciFiMovies: HomeMedia[];
  crimeTV: HomeMedia[];
  sciFiTV: HomeMedia[];
  comedyTV: HomeMedia[];
  dramaTV: HomeMedia[];
}

// ek satırlar
export async function loadRestHome(): Promise<HomeRestData> {
  const [
    upcomingMovies,
    topRatedShows,
    airingShows,
    adventureMovies,
    animationMovies,
    topRatedMovies,
    horrorMovies,
    comedyMovies,
    thrillerMovies,
    sciFiMovies,
    crimeTV,
    sciFiTV,
    comedyTV,
    dramaTV,
  ] = await settleList([
    tmdbApi.getUpcomingMovies(),
    tmdbApi.getTopRatedTVShows(),
    tmdbApi.getAiringTodayTVShows(),
    tmdbApi.getMoviesByGenre(12),
    tmdbApi.getMoviesByGenre(16),
    tmdbApi.getTopRatedMovies(),
    tmdbApi.getMoviesByGenre(27, 1, "popularity.desc"),
    tmdbApi.getMoviesByGenre(35, 1, "popularity.desc"),
    tmdbApi.getMoviesByGenre(53, 1, "popularity.desc"),
    tmdbApi.getMoviesByGenre(878, 1, "popularity.desc"),
    tmdbApi.getTVShowsByGenre(80, 1, "popularity.desc"),
    tmdbApi.getTVShowsByGenre(10765, 1, "popularity.desc"),
    tmdbApi.getTVShowsByGenre(35, 1, "popularity.desc"),
    tmdbApi.getTVShowsByGenre(18, 1, "popularity.desc"),
  ]);
  return {
    upcoming: withPoster(upcomingMovies?.results ?? []),
    topRatedTV: withPoster(topRatedShows?.results ?? []),
    airingToday: withPoster(airingShows?.results ?? []),
    adventure: withPoster(adventureMovies?.results ?? []),
    animation: withPoster(animationMovies?.results ?? []),
    topMovies: withPoster(topRatedMovies?.results ?? []),
    horrorMovies: withPoster(horrorMovies?.results ?? []),
    comedyMovies: withPoster(comedyMovies?.results ?? []),
    thrillerMovies: withPoster(thrillerMovies?.results ?? []),
    sciFiMovies: withPoster(sciFiMovies?.results ?? []),
    crimeTV: withPoster(crimeTV?.results ?? []),
    sciFiTV: withPoster(sciFiTV?.results ?? []),
    comedyTV: withPoster(comedyTV?.results ?? []),
    dramaTV: withPoster(dramaTV?.results ?? []),
  };
}

export interface HomeKidsData {
  heroMovies: HomeMedia[];
  familyMovies: HomeMedia[];
  animMovies: HomeMedia[];
  kidsTV: HomeMedia[];
  animTV: HomeMedia[];
  moreFamily: HomeMedia[];
}

// çocuk verisi
export async function loadKidsHome(): Promise<HomeKidsData> {
  const [familyMovies, animMovies, kidsTV, animTV, moreFamily] = await settleList([
    tmdbApi.getMoviesByGenre("16,10751"),
    tmdbApi.getMoviesByGenre(16),
    tmdbApi.getTVShowsByGenre(10762),
    tmdbApi.getTVShowsByGenre(16),
    tmdbApi.getMoviesByGenre("16,10751", 2),
  ]);
  return {
    heroMovies: heroFrom(familyMovies?.results ?? [], HERO_COUNT),
    familyMovies: withPoster([
      ...(familyMovies?.results ?? []),
      ...(animMovies?.results ?? []),
    ]),
    animMovies: withPoster(animMovies?.results ?? []),
    kidsTV: withPoster(kidsTV?.results ?? []),
    animTV: withPoster(animTV?.results ?? []),
    moreFamily: withPoster(moreFamily?.results ?? []),
  };
}

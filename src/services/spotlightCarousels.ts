import {
  SPOTLIGHT_CAROUSELS,
  SPOTLIGHT_CAROUSELS_ENABLED,
  type SpotlightDefinition,
  type SpotlightPlacement,
  type SpotlightTheme,
} from "../data/spotlightCarousels";
import { settleList, withPoster } from "../lib/utils";
import { seededShuffle } from "../lib/contentPersonalization";
import type { Movie, TVShow } from "../types/types";
import { tmdbApi } from "./tmdb";

export interface SpotlightCarouselData {
  id: string;
  title: string;
  mediaType: "movie" | "tv";
  items: Array<Movie | TVShow>;
  presentation: {
    eyebrow: string;
    description: string;
    backgroundPath: string | null;
    theme: SpotlightTheme;
  };
}

const spotlightCache = new Map<string, Promise<SpotlightCarouselData | null>>();

const DAILY_SPOTLIGHT_LIMITS = {
  home: 18,
  exploreMovie: 20,
  exploreTV: 10,
} as const;

function uniqueMovies(movies: Movie[]): Movie[] {
  return Array.from(new Map(movies.map((movie) => [movie.id, movie])).values());
}

function uniqueTVShows(shows: TVShow[]): TVShow[] {
  return Array.from(new Map(shows.map((show) => [show.id, show])).values());
}

function releasedMovie(movie: Movie): boolean {
  return !movie.release_date || movie.release_date <= new Date().toISOString().slice(0, 10);
}

function releasedTVShow(show: TVShow): boolean {
  return !show.first_air_date || show.first_air_date <= new Date().toISOString().slice(0, 10);
}

async function fetchSpotlightCarousel(
  definition: SpotlightDefinition,
): Promise<SpotlightCarouselData | null> {
  if (definition.source === "collection") {
    const collectionResults = await settleList(
      definition.sourceIds.map((id) => tmdbApi.getMovieCollection(id)),
    );
    const collections = collectionResults.filter(
      (collection) => collection !== null,
    );
    if (!collections.length) return null;

    const collectionMovies = uniqueMovies(
      collections.flatMap((collection) => collection.parts),
    ).filter(releasedMovie);
    const items = withPoster(
      definition.order === "source"
        ? collectionMovies
        : collectionMovies.sort((a, b) =>
            a.release_date.localeCompare(b.release_date),
          ),
    );
    if (!items.length) return null;

    return {
      id: definition.id,
      title: definition.title,
      mediaType: "movie",
      items,
      presentation: {
        eyebrow: definition.eyebrow,
        description: definition.description,
        backgroundPath:
          collections.find((collection) => collection.backdrop_path)?.backdrop_path ||
          items.find((movie) => movie.backdrop_path)?.backdrop_path ||
          null,
        theme: definition.theme,
      },
    };
  }

  if (definition.source === "tv-universe") {
    const showResults = await settleList(
      definition.sourceIds.map((id) => tmdbApi.getTVShowDetail(id)),
    );
    const shows = uniqueTVShows(
      showResults.filter((show) => show !== null),
    ).filter(releasedTVShow);
    const items = withPoster(
      definition.order === "release"
        ? shows.sort((a, b) => a.first_air_date.localeCompare(b.first_air_date))
        : shows,
    );
    if (!items.length) return null;

    const backgroundSeries = items.find(
      (show) => show.id === definition.backgroundSeriesId,
    );
    return {
      id: definition.id,
      title: definition.title,
      mediaType: "tv",
      items,
      presentation: {
        eyebrow: definition.eyebrow,
        description: definition.description,
        backgroundPath:
          backgroundSeries?.backdrop_path ||
          items.find((show) => show.backdrop_path)?.backdrop_path ||
          null,
        theme: definition.theme,
      },
    };
  }

  const person = await tmdbApi.getPersonMovieCredits(definition.sourceId);
  const items = withPoster(
    uniqueMovies(person.movie_credits.cast)
      .filter((movie) => releasedMovie(movie) && movie.overview?.trim())
      .sort((a, b) => b.vote_count - a.vote_count)
      .slice(0, 24),
  );
  if (!items.length) return null;

  const backgroundMovie = person.movie_credits.cast.find(
    (movie) => movie.id === definition.backgroundMovieId,
  );
  return {
    id: definition.id,
    title: definition.title,
    mediaType: "movie",
    items,
    presentation: {
      eyebrow: definition.eyebrow,
      description: definition.description,
      backgroundPath:
        backgroundMovie?.backdrop_path || items.find((movie) => movie.backdrop_path)?.backdrop_path || null,
      theme: definition.theme,
    },
  };
}

function cachedSpotlight(definition: SpotlightDefinition) {
  const cached = spotlightCache.get(definition.id);
  if (cached) return cached;

  const request = fetchSpotlightCarousel(definition).catch((error: unknown) => {
    spotlightCache.delete(definition.id);
    throw error;
  });
  spotlightCache.set(definition.id, request);
  return request;
}

export function loadSpotlightCarousel(definition: SpotlightDefinition) {
  return cachedSpotlight(definition);
}

export function getSpotlightDefinitions(
  placement: SpotlightPlacement,
  audienceKey?: string,
  mediaType?: "movie" | "tv",
): SpotlightDefinition[] {
  if (!SPOTLIGHT_CAROUSELS_ENABLED) return [];
  const definitions = SPOTLIGHT_CAROUSELS.filter(
    (item) =>
      item.placements.includes(placement) &&
      (!mediaType || (item.source === "tv-universe" ? "tv" : "movie") === mediaType),
  );
  if (!audienceKey) return definitions;

  const personalized = seededShuffle(
    definitions,
    `${audienceKey}:${placement}:${mediaType ?? "all"}`,
  );
  const limit = placement === "home"
    ? DAILY_SPOTLIGHT_LIMITS.home
    : mediaType === "tv"
      ? DAILY_SPOTLIGHT_LIMITS.exploreTV
      : DAILY_SPOTLIGHT_LIMITS.exploreMovie;
  return personalized.slice(0, limit);
}

function normalizeSpotlightSearch(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("tr-TR")
    .replace(/ı/g, "i")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function normalizeContentName(value: string): string {
  return normalizeSpotlightSearch(value)
    .replace(
      /\b(serisi|koleksiyonu|evreni|uclemesi|destani|dizileri|animasyonlari|filmleri|klasikleri)\b/g,
      " ",
    )
    .replace(/\s+/g, " ")
    .trim();
}

export function searchSpotlightDefinitions(
  query: string,
  audienceKey: string,
  limit = 6,
): SpotlightDefinition[] {
  if (!SPOTLIGHT_CAROUSELS_ENABLED) return [];
  const normalizedQuery = normalizeSpotlightSearch(query);
  if (normalizedQuery.length < 2) return [];
  const terms = normalizedQuery.split(/\s+/).filter(Boolean);

  const matches: Array<{ definition: SpotlightDefinition; score: number }> = [];
  for (const definition of SPOTLIGHT_CAROUSELS) {
    if (definition.source === "person") continue;
    const searchableNames = (definition.searchTerms?.length
      ? definition.searchTerms
      : [definition.eyebrow]
    ).map(normalizeContentName);
    const haystack = searchableNames.join(" ");
    if (!terms.every((term) => haystack.includes(term))) continue;

    const exactName = searchableNames.some((name) => name === normalizedQuery);
    const phraseMatch = searchableNames.some((name) => name.includes(normalizedQuery));
    const score = exactName ? 40 : phraseMatch ? 24 : terms.length * 8;
    matches.push({ definition, score });
  }

  const shuffled = seededShuffle(matches, `${audienceKey}:search:${normalizedQuery}`);
  return shuffled
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(({ definition }) => definition);
}

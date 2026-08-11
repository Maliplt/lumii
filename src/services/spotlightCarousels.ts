import {
  SPOTLIGHT_CAROUSELS,
  SPOTLIGHT_CAROUSELS_ENABLED,
  type SpotlightDefinition,
  type SpotlightPlacement,
  type SpotlightTheme,
} from "../data/spotlightCarousels";
import { withPoster } from "../lib/utils";
import type { Movie } from "../types/types";
import { tmdbApi } from "./tmdb";

export interface SpotlightCarouselData {
  id: string;
  title: string;
  items: Movie[];
  presentation: {
    eyebrow: string;
    description: string;
    backgroundPath: string | null;
    theme: SpotlightTheme;
  };
}

const spotlightCache = new Map<string, Promise<SpotlightCarouselData | null>>();

function uniqueMovies(movies: Movie[]): Movie[] {
  return Array.from(new Map(movies.map((movie) => [movie.id, movie])).values());
}

function releasedMovie(movie: Movie): boolean {
  return !movie.release_date || movie.release_date <= new Date().toISOString().slice(0, 10);
}

async function fetchSpotlightCarousel(
  definition: SpotlightDefinition,
): Promise<SpotlightCarouselData | null> {
  if (definition.source === "collection") {
    const collectionResults = await Promise.allSettled(
      definition.sourceIds.map((id) => tmdbApi.getMovieCollection(id)),
    );
    const collections = collectionResults.flatMap((result) =>
      result.status === "fulfilled" ? [result.value] : [],
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

  const request = fetchSpotlightCarousel(definition).catch(() => null);
  spotlightCache.set(definition.id, request);
  return request;
}

export function loadSpotlightCarousel(definition: SpotlightDefinition) {
  return cachedSpotlight(definition);
}

export function getSpotlightDefinitions(
  placement: SpotlightPlacement,
): SpotlightDefinition[] {
  if (!SPOTLIGHT_CAROUSELS_ENABLED) return [];
  return SPOTLIGHT_CAROUSELS.filter((item) =>
    item.placements.includes(placement),
  );
}

export async function loadSpotlightCarousels(
  placement: SpotlightPlacement,
): Promise<SpotlightCarouselData[]> {
  const definitions = getSpotlightDefinitions(placement);
  const results = await Promise.all(definitions.map(cachedSpotlight));
  return results.filter((item): item is SpotlightCarouselData => item !== null);
}

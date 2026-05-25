import type { Movie, TVShow, TMDBResponse, SearchResult } from '../types/types'

const API_KEY = import.meta.env.VITE_TMDB_API_KEY
const BASE_URL = 'https://api.themoviedb.org/3'
const IMAGE_BASE_URL = 'https://image.tmdb.org/t/p'

async function tmdbFetch<T>(endpoint: string, params: Record<string, string | number> = {}): Promise<T> {
    const url = new URL(`${BASE_URL}${endpoint}`)
    url.searchParams.set('api_key', API_KEY)
    url.searchParams.set('language', 'tr-TR')

    for (const [key, value] of Object.entries(params)) {
        url.searchParams.set(key, String(value))
    }

    const res = await fetch(url.toString())
    if (!res.ok) throw new Error(`TMDB API error: ${res.status} ${res.statusText}`)
    return res.json() as Promise<T>
}

export const getImageUrl = (
    path: string | null,
    size: 'w300' | 'w500' | 'original' = 'w500'
): string => {
    if (!path) return 'https://placehold.co/500x750?text=No+Image'
    return `${IMAGE_BASE_URL}/${size}${path}`
}

export const tmdbApi = {
    getPopularMovies: (page = 1): Promise<TMDBResponse<Movie>> =>
        tmdbFetch<TMDBResponse<Movie>>('/movie/popular', { page }),

    getPopularTVShows: (page = 1): Promise<TMDBResponse<TVShow>> =>
        tmdbFetch<TMDBResponse<TVShow>>('/tv/popular', { page }),

    search: (query: string, page = 1): Promise<TMDBResponse<SearchResult>> =>
        tmdbFetch<TMDBResponse<SearchResult>>('/search/multi', { query, page }),
}
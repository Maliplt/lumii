export interface Movie {
    id: number
    title: string
    original_title: string
    overview: string
    poster_path: string | null
    backdrop_path: string | null
    release_date: string
    genre_ids: number[]
    adult: boolean
    original_language: string
    popularity: number
    vote_average: number
    vote_count: number
    video: boolean
}

export interface TVShow {
    id: number
    name: string
    original_name: string
    overview: string
    poster_path: string | null
    backdrop_path: string | null
    first_air_date: string
    genre_ids: number[]
    origin_country: string[]
    original_language: string
    popularity: number
    vote_average: number
    vote_count: number
}

export interface TMDBResponse<T> {
    page: number
    results: T[]
    total_pages: number
    total_results: number
}

export type SearchResult =
    | (Movie & { media_type: 'movie' })
    | (TVShow & { media_type: 'tv' })
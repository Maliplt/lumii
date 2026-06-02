import { useMemo } from 'react'
import Header from '../components/Header'
import Footer from '../components/Footer'
import HeroCarousel from '../components/HeroCarousel'
import ContentCarousel from '../components/ContentCarousel'
import GameCarousel from '../components/GameCarousel'
import Spinner from '../components/Spinner'
import { tmdbApi } from '../services/tmdb'
import { useAsyncData } from '../hooks/useAsyncData'
import type { Movie, TVShow } from '../types/types'

export default function HomePage() {
    const { data, loading } = useAsyncData(() =>
        Promise.all([tmdbApi.getPopularMovies(), tmdbApi.getPopularTVShows()])
    )

    const movies = useMemo(
        () => (data?.[0].results.filter((m) => m.poster_path && m.backdrop_path) ?? []) as Movie[],
        [data]
    )

    const tvShows = useMemo(
        () => (data?.[1].results.filter((tv) => tv.poster_path) ?? []) as TVShow[],
        [data]
    )

    return (
        <div className="home-page">
            {loading && <Spinner />}
            <Header />
            <main className="home-main">
                <HeroCarousel movies={movies.slice(0, 5)} />
                <div className="home-content">
                    <GameCarousel />
                    <ContentCarousel type="movie" title="Popüler Filmler" items={movies} />
                    <ContentCarousel type="tv" title="Popüler Diziler" items={tvShows} />
                </div>
            </main>
            <Footer />
        </div>
    )
}

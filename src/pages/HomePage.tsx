import { useEffect, useState } from 'react'
import Header from '../components/Header'
import Footer from '../components/Footer'
import HeroCarousel from '../components/HeroCarousel'
import ContentCarousel from '../components/ContentCarousel'
import GameCarousel from '../components/GameCarousel'
import Spinner from '../components/Spinner'
import { tmdbApi } from '../services/tmdb'
import type { Movie, TVShow } from '../types/types'

export default function HomePage() {
    const [movies, setMovies] = useState<Movie[]>([])
    const [tvShows, setTvShows] = useState<TVShow[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        Promise.all([
            tmdbApi.getPopularMovies(),
            tmdbApi.getPopularTVShows(),
        ]).then(([moviesRes, tvRes]) => {
            setMovies(moviesRes.results.filter((m) => m.poster_path && m.backdrop_path))
            setTvShows(tvRes.results.filter((tv) => tv.poster_path))
            setLoading(false)
        })
    }, [])

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

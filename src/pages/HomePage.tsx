import { useEffect, useState } from 'react'
import Header from '../components/Header'
import Footer from '../components/Footer'
import HeroCarousel from '../components/HeroCarousel'
import ContentCarousel from '../components/ContentCarousel'
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
    <div className="flex flex-col min-h-screen">
      {loading && <Spinner />}
      <Header />
      <main className="flex-1">
        <HeroCarousel movies={movies.slice(0, 5)} />
        <div className="home-content">
          <ContentCarousel type="movie" title="Popüler Filmler" items={movies} />
          <ContentCarousel type="tv" title="Popüler Diziler" items={tvShows} />
        </div>
      </main>
      <Footer />
    </div>
  )
}

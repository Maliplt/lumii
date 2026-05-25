import { useEffect, useState } from 'react'
import Header from '../components/Header'
import Footer from '../components/Footer'
import ContentCard from '../components/ContentCard'
import HeroCarousel from '../components/HeroCarousel'
import { tmdbApi } from '../services/tmdb'
import type { Movie } from '../types/types'

export default function HomePage() {
  const [movies, setMovies] = useState<Movie[]>([])

  useEffect(() => {
    tmdbApi.getPopularMovies().then((res) => setMovies(res.results))
  }, [])

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1 p-4">
        <HeroCarousel />
        <div className="flex flex-wrap gap-4 mt-4">
          {movies.map((movie) => (
            <ContentCard
              key={movie.id}
              id={movie.id}
              type="movie"
              title={movie.title}
              posterPath={movie.poster_path}
              rating={movie.vote_average}
              date={movie.release_date}
            />
          ))}
        </div>
      </main>
      <Footer />
    </div>
  )
}

import { useEffect, useState } from 'react'
import { Carousel } from 'rsuite'
import { tmdbApi, getImageUrl } from '../services/tmdb'
import type { Movie } from '../types/types'

export default function HeroCarousel() {
  const [movies, setMovies] = useState<Movie[]>([])

  useEffect(() => {
    tmdbApi.getPopularMovies().then((res) => setMovies(res.results.slice(0, 5)))
  }, [])

  return (
    <Carousel placement="bottom" shape="bar" style={{ height: 480 }}>
      {movies.map((movie) => (
        <div key={movie.id} style={{ position: 'relative', height: 480 }}>
          <img
            src={getImageUrl(movie.backdrop_path, 'original')}
            alt={movie.title}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
          <div style={{
            position: 'absolute',
            bottom: 32,
            left: 24,
            background: 'rgba(0,0,0,0.45)',
            padding: '6px 14px',
            borderRadius: 6,
          }}>
            <span style={{ color: '#fff', fontSize: 22, fontWeight: 600 }}>
              {movie.title}
            </span>
          </div>
        </div>
      ))}
    </Carousel>
  )
}

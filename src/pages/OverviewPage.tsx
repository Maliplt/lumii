import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Button } from 'rsuite'
import Header from '../components/Header'
import Footer from '../components/Footer'
import ContentCarousel from '../components/ContentCarousel'
import Spinner from '../components/Spinner'
import { tmdbApi, getImageUrl } from '../services/tmdb'
import type { MovieDetail, TVShowDetail, Movie, TVShow } from '../types/types'

export default function OverviewPage() {
  const { type, id } = useParams<{ type: 'movie' | 'tv'; id: string }>()
  const navigate = useNavigate()
  const [detail, setDetail] = useState<MovieDetail | TVShowDetail | null>(null)
  const [similar, setSimilar] = useState<Movie[] | TVShow[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!type || !id) return
    setLoading(true)
    setDetail(null)
    const numId = Number(id)
    const detailFetch = type === 'movie' ? tmdbApi.getMovieDetail(numId) : tmdbApi.getTVShowDetail(numId)
    const similarFetch = type === 'movie' ? tmdbApi.getSimilarMovies(numId) : tmdbApi.getSimilarTVShows(numId)

    Promise.all([detailFetch, similarFetch]).then(([det, sim]) => {
      setDetail(det as MovieDetail | TVShowDetail)
      setSimilar(sim.results.filter((item) => item.poster_path) as Movie[] | TVShow[])
      setLoading(false)
    })
  }, [type, id])

  if (loading || !detail) return (
    <div className="flex flex-col min-h-screen">
      <Spinner />
      <Header />
    </div>
  )

  const isMovie = type === 'movie'
  const title = isMovie ? (detail as MovieDetail).title : (detail as TVShowDetail).name
  const year = isMovie
    ? (detail as MovieDetail).release_date?.slice(0, 4)
    : (detail as TVShowDetail).first_air_date?.slice(0, 4)
  const runtime = isMovie
    ? (detail as MovieDetail).runtime ? `${(detail as MovieDetail).runtime} dk` : null
    : (detail as TVShowDetail).episode_run_time?.[0] ? `${(detail as TVShowDetail).episode_run_time[0]} dk` : null
  const genres = detail.genres?.map((g) => g.name).join(' / ')
  const director = isMovie
    ? detail.credits?.crew?.find((c) => c.job === 'Director')?.name
    : detail.credits?.crew?.find((c) => c.job === 'Executive Producer')?.name
  const cast = detail.credits?.cast?.slice(0, 5).map((c) => c.name).join(', ')

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1">
        <div className="overview-hero">
          <img
            src={getImageUrl(detail.backdrop_path, 'original')}
            alt={title}
            loading="lazy"
          />
          <div className="overview-hero__overlay" />
          <div className="overview-hero__info">
            <h1>{title}</h1>
            <p className="overview-meta">{[genres, runtime, year].filter(Boolean).join(' · ')}</p>
            <p className="overview-text">{detail.overview}</p>
            {director && (
              <p className="overview-crew"><strong>Yönetmen:</strong> {director}</p>
            )}
            {cast && (
              <p className="overview-cast"><strong>Oyuncular:</strong> {cast}</p>
            )}
            <Button className="btn-play" size="lg" onClick={() => navigate('/play')}>
              <span className="play-icon">▶</span> Oynat
            </Button>
          </div>
        </div>

        <div className="overview-similar">
          <ContentCarousel type={type!} title="Benzer İçerikler" items={similar} />
        </div>
      </main>
      <Footer />
    </div>
  )
}

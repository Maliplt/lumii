import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Button } from 'rsuite'
import Header from '../components/Header'
import Footer from '../components/Footer'
import ContentCarousel from '../components/ContentCarousel'
import Spinner from '../components/Spinner'
import { tmdbApi, getImageUrl } from '../services/tmdb'
import type { MovieDetail, TVShowDetail, Movie, TVShow, TVSeasonDetail, Episode } from '../types/types'

export default function OverviewPage() {
    const { type, id } = useParams<{ type: 'movie' | 'tv'; id: string }>()
    const navigate = useNavigate()

    const [detail, setDetail] = useState<MovieDetail | TVShowDetail | null>(null)
    const [similar, setSimilar] = useState<Movie[] | TVShow[]>([])
    const [loading, setLoading] = useState(true)
    const [selectedSeason, setSelectedSeason] = useState<number>(1)
    const [seasonData, setSeasonData] = useState<TVSeasonDetail | null>(null)
    const [episodesLoading, setEpisodesLoading] = useState(false)

    useEffect(() => {
        if (!type || !id) return
        setLoading(true)
        setDetail(null)
        setSelectedSeason(1)
        setSeasonData(null)
        const numId = Number(id)
        Promise.all([
            type === 'movie' ? tmdbApi.getMovieDetail(numId) : tmdbApi.getTVShowDetail(numId),
            type === 'movie' ? tmdbApi.getSimilarMovies(numId) : tmdbApi.getSimilarTVShows(numId),
        ]).then(([det, sim]) => {
            setDetail(det as MovieDetail | TVShowDetail)
            setSimilar(sim.results.filter((item) => item.poster_path) as Movie[] | TVShow[])
        }).catch(() => {
            // API hatası — boş içerikle devam et
        }).finally(() => {
            setLoading(false)
        })
    }, [type, id])

    useEffect(() => {
        if (type !== 'tv' || !id || loading || !detail) return
        setEpisodesLoading(true)
        tmdbApi.getTVSeasonDetails(Number(id), selectedSeason)
            .then((data) => {
                setSeasonData(data)
                setEpisodesLoading(false)
            })
            .catch(() => setEpisodesLoading(false))
    }, [type, id, selectedSeason, loading, detail])

    if (loading || !detail) return (
        <div className="overview-loading-screen">
            <Header />
            <Spinner />
        </div>
    )

    const isMovie = type === 'movie'
    const tvDetail = detail as TVShowDetail
    const movieDetail = detail as MovieDetail

    const title = isMovie ? movieDetail.title : tvDetail.name
    const year = isMovie ? movieDetail.release_date?.slice(0, 4) : tvDetail.first_air_date?.slice(0, 4)
    const runtime = isMovie
        ? movieDetail.runtime ? `${movieDetail.runtime} dk` : null
        : tvDetail.episode_run_time?.[0] ? `${tvDetail.episode_run_time[0]} dk` : null
    const genres = detail.genres?.map((g) => g.name).join(' / ')
    const director = isMovie
        ? detail.credits?.crew?.find((c) => c.job === 'Director')?.name
        : detail.credits?.crew?.find((c) => c.job === 'Executive Producer')?.name
    const cast = detail.credits?.cast?.slice(0, 5).map((c) => c.name).join(', ')
    const seasonsInfo = !isMovie && tvDetail.number_of_seasons
        ? `${tvDetail.number_of_seasons} Sezon`
        : null

    const formatDate = (dateStr: string) =>
        new Date(dateStr).toLocaleDateString('tr-TR', { year: 'numeric', month: 'long', day: 'numeric' })

    return (
        <div className="overview-page">
            <Header />
            <main className="overview-main">
                <div className="overview-hero">
                    <img
                        src={getImageUrl(detail.backdrop_path, 'original')}
                        alt={title}
                        loading="lazy"
                    />
                    <div className="overview-hero__overlay" />
                    <div className="overview-hero__info">
                        <h1>{title}</h1>
                        <p className="overview-meta">{[genres, runtime, seasonsInfo, year].filter(Boolean).join(' · ')}</p>
                        <p className="overview-text">{detail.overview}</p>
                        {director && <p className="overview-crew"><strong>Yönetmen:</strong> {director}</p>}
                        {cast && <p className="overview-cast"><strong>Oyuncular:</strong> {cast}</p>}
                        <Button className="btn-play" size="lg" onClick={() => navigate('/work-in-progress')}>
                            <span className="play-icon">▶</span> Oynat
                        </Button>
                    </div>
                </div>

                {!isMovie && (
                    <div className="overview-seasons-section">
                        <div className="seasons-header-row">
                            <h2 className="seasons-title">Sezonlar & Bölümler</h2>
                            {tvDetail.number_of_seasons > 0 && (
                                <div className="season-select-wrapper">
                                    <select
                                        className="season-select"
                                        value={selectedSeason}
                                        onChange={(e) => setSelectedSeason(Number(e.target.value))}
                                    >
                                        {Array.from({ length: tvDetail.number_of_seasons }, (_, i) => i + 1).map((sNum) => (
                                            <option key={sNum} value={sNum}>{sNum}. Sezon</option>
                                        ))}
                                    </select>
                                </div>
                            )}
                        </div>

                        {episodesLoading ? (
                            <div className="seasons-loading">
                                <Spinner />
                            </div>
                        ) : seasonData?.episodes?.length ? (
                            <div className="episodes-list">
                                {seasonData.episodes.map((episode: Episode) => (
                                    <div key={episode.id} className="episode-card">
                                        <div className="episode-card__media">
                                            <img
                                                src={getImageUrl(episode.still_path || detail.backdrop_path, 'w300')}
                                                alt={episode.name}
                                                loading="lazy"
                                            />
                                            <div className="episode-card__media-overlay">
                                                <span className="play-icon-mini" onClick={() => navigate('/work-in-progress')}>▶</span>
                                            </div>
                                        </div>
                                        <div className="episode-card__info">
                                            <div className="episode-card__title-row">
                                                <h4 className="episode-card__title">
                                                    {episode.episode_number}. {episode.name || 'Bölüm'}
                                                </h4>
                                                {episode.air_date && (
                                                    <span className="episode-airdate">{formatDate(episode.air_date)}</span>
                                                )}
                                            </div>
                                            <p className="episode-overview">
                                                {episode.overview || 'Bu bölüm için açıklama bulunmuyor.'}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="seasons-empty">Bölüm bilgileri yüklenemedi.</div>
                        )}
                    </div>
                )}

                <div className="overview-similar">
                    <ContentCarousel type={type!} title="Benzer İçerikler" items={similar} />
                </div>
            </main>
            <Footer />
        </div>
    )
}

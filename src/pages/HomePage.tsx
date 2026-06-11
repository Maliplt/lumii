import { useMemo } from 'react'
import { AlertTriangle } from 'lucide-react'
import PageLayout from '../components/PageLayout'
import HeroCarousel from '../components/HeroCarousel'
import ContentCarousel from '../components/ContentCarousel'
import GameCarousel from '../components/GameCarousel'
import StateView from '../components/StateView'
import { tmdbApi } from '../services/tmdb'
import { useFetch } from '../helpers'
import { useAppSelector } from '../store/store'
import type { Movie, TVShow } from '../types/types'

const HERO_COUNT = 5

export default function HomePage() {
    // redux
    const continueWatching = useAppSelector((s) => s.library.continueWatching)
    const isLoggedIn = useAppSelector((s) => !!s.auth.currentUser)
    const showContinueRow = useAppSelector((s) => s.settings.continueRow)

    const { data, loading, error } = useFetch(() =>
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
        <PageLayout className="home-page" mainClassName="home-main" loading={loading}>
            {error ? (
                <StateView
                    Icon={AlertTriangle}
                    title="İçerik yüklenemedi"
                    description="Veriler getirilirken bir sorun oluştu. Lütfen sayfayı yenileyin."
                />
            ) : (
                <>
                    <HeroCarousel movies={movies.slice(0, HERO_COUNT)} />
                    <div className="home-content">
                        {isLoggedIn && showContinueRow && continueWatching.length > 0 && (
                            <ContentCarousel type="movie" title="İzlemeye Devam Et" items={continueWatching} />
                        )}
                        <GameCarousel />
                        <ContentCarousel type="movie" title="Popüler Filmler" items={movies} />
                        <ContentCarousel type="tv" title="Popüler Diziler" items={tvShows} />
                    </div>
                </>
            )}
        </PageLayout>
    )
}

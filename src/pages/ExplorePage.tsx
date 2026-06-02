import { useEffect, useState } from 'react'
import Header from '../components/Header'
import Footer from '../components/Footer'
import HeroCarousel from '../components/HeroCarousel'
import ContentCarousel from '../components/ContentCarousel'
import Spinner from '../components/Spinner'
import { tmdbApi } from '../services/tmdb'
import type { Movie } from '../types/types'

interface ExploreData {
    hero: Movie[]
    oscar: Movie[]
    kids: Movie[]
    action: Movie[]
    thriller: Movie[]
    horror: Movie[]
}

const EMPTY: ExploreData = { hero: [], oscar: [], kids: [], action: [], thriller: [], horror: [] }

export default function ExplorePage() {
    const [data, setData] = useState<ExploreData>(EMPTY)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        Promise.all([
            tmdbApi.getTopRatedMovies(),
            tmdbApi.getMoviesByGenre('16,10751'),
            tmdbApi.getMoviesByGenre(28),
            tmdbApi.getMoviesByGenre(53),
            tmdbApi.getMoviesByGenre(27),
        ]).then(([topRatedRes, kidsRes, actionRes, thrillerRes, horrorRes]) => {
            const withMedia = (list: Movie[]) => list.filter((m) => m.poster_path && m.backdrop_path)
            const topRated = withMedia(topRatedRes.results)
            setData({
                hero: topRated.slice(5, 10),
                oscar: topRated,
                kids: withMedia(kidsRes.results),
                action: withMedia(actionRes.results),
                thriller: withMedia(thrillerRes.results),
                horror: withMedia(horrorRes.results),
            })
        }).catch(() => {
            // API hatası — boş liste ile devam et
        }).finally(() => {
            setLoading(false)
        })
    }, [])

    return (
        <div className="explore-page">
            {loading && <Spinner />}
            <Header />
            <main className="explore-main">
                {data.hero.length > 0 && <HeroCarousel movies={data.hero} />}
                <div className="explore-content">
                    {data.oscar.length > 0 && (
                        <ContentCarousel type="movie" title="En İyi Oscar Filmleri" items={data.oscar} />
                    )}
                    {data.kids.length > 0 && (
                        <ContentCarousel type="movie" title="Şimdi Çocuk Olmak Vardı" items={data.kids} />
                    )}
                    {data.action.length > 0 && (
                        <ContentCarousel type="movie" title="Aksiyon ve Macera" items={data.action} />
                    )}
                    {data.thriller.length > 0 && (
                        <ContentCarousel type="movie" title="Gerilim ve Heyecan" items={data.thriller} />
                    )}
                    {data.horror.length > 0 && (
                        <ContentCarousel type="movie" title="Korku ve Ürperti" items={data.horror} />
                    )}
                </div>
            </main>
            <Footer />
        </div>
    )
}

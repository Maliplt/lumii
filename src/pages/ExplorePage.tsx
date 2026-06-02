import { useEffect, useState } from 'react'
import Header from '../components/Header'
import Footer from '../components/Footer'
import HeroCarousel from '../components/HeroCarousel'
import ContentCarousel from '../components/ContentCarousel'
import Spinner from '../components/Spinner'
import { tmdbApi } from '../services/tmdb'
import type { Movie } from '../types/types'

export default function ExplorePage() {
    const [heroMovies, setHeroMovies] = useState<Movie[]>([])
    const [oscarMovies, setOscarMovies] = useState<Movie[]>([])
    const [kidsMovies, setKidsMovies] = useState<Movie[]>([])
    const [actionMovies, setActionMovies] = useState<Movie[]>([])
    const [thrillerMovies, setThrillerMovies] = useState<Movie[]>([])
    const [horrorMovies, setHorrorMovies] = useState<Movie[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        Promise.all([
            tmdbApi.getTopRatedMovies(),
            tmdbApi.getMoviesByGenre('16,10751'),
            tmdbApi.getMoviesByGenre(28),
            tmdbApi.getMoviesByGenre(53),
            tmdbApi.getMoviesByGenre(27),
        ]).then(([topRatedRes, kidsRes, actionRes, thrillerRes, horrorRes]) => {
            const filterWithMedia = (list: Movie[]) => list.filter((m) => m.poster_path && m.backdrop_path)
            
            const topRatedFiltered = filterWithMedia(topRatedRes.results)
            setHeroMovies(topRatedFiltered.slice(5, 10))
            setOscarMovies(topRatedFiltered)
            setKidsMovies(filterWithMedia(kidsRes.results))
            setActionMovies(filterWithMedia(actionRes.results))
            setThrillerMovies(filterWithMedia(thrillerRes.results))
            setHorrorMovies(filterWithMedia(horrorRes.results))
            setLoading(false)
        }).catch(() => {
            setLoading(false)
        })
    }, [])

    return (
        <div className="explore-page">
            {loading && <Spinner />}
            <Header />
            <main className="explore-main">
                {heroMovies.length > 0 && <HeroCarousel movies={heroMovies} />}
                <div className="explore-content">
                    {oscarMovies.length > 0 && (
                        <ContentCarousel type="movie" title="En İyi Oscar Filmleri" items={oscarMovies} />
                    )}
                    {kidsMovies.length > 0 && (
                        <ContentCarousel type="movie" title="Şimdi Çocuk Olmak Vardı" items={kidsMovies} />
                    )}
                    {actionMovies.length > 0 && (
                        <ContentCarousel type="movie" title="Aksiyon ve Macera" items={actionMovies} />
                    )}
                    {thrillerMovies.length > 0 && (
                        <ContentCarousel type="movie" title="Gerilim ve Heyecan" items={thrillerMovies} />
                    )}
                    {horrorMovies.length > 0 && (
                        <ContentCarousel type="movie" title="Korku ve Ürperti" items={horrorMovies} />
                    )}
                </div>
            </main>
            <Footer />
        </div>
    )
}

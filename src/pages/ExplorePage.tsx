import { useMemo } from 'react'
import PageLayout from '../components/PageLayout'
import HeroCarousel from '../components/HeroCarousel'
import ContentCarousel from '../components/ContentCarousel'
import { tmdbApi } from '../services/tmdb'
import { useAsyncData } from '../hooks/useAsyncData'
import type { Movie } from '../types/types'

// tür bilgileri
const GENRE = {
    kidsAndFamily: '16,10751',
    action: 28,
    thriller: 53,
    horror: 27,
} as const

const HERO_RANGE = [5, 10] as const

const withMedia = (list: Movie[]) => list.filter((m) => m.poster_path && m.backdrop_path)

export default function ExplorePage() {
    const { data, loading } = useAsyncData(() =>
        Promise.all([
            tmdbApi.getTopRatedMovies(),
            tmdbApi.getMoviesByGenre(GENRE.kidsAndFamily),
            tmdbApi.getMoviesByGenre(GENRE.action),
            tmdbApi.getMoviesByGenre(GENRE.thriller),
            tmdbApi.getMoviesByGenre(GENRE.horror),
        ])
    )

    const sections = useMemo(() => {
        if (!data) return null
        const [topRatedRes, kidsRes, actionRes, thrillerRes, horrorRes] = data
        const oscar = withMedia(topRatedRes.results)
        return {
            hero: oscar.slice(HERO_RANGE[0], HERO_RANGE[1]),
            oscar,
            kids: withMedia(kidsRes.results),
            action: withMedia(actionRes.results),
            thriller: withMedia(thrillerRes.results),
            horror: withMedia(horrorRes.results),
        }
    }, [data])

    return (
        <PageLayout className="explore-page" mainClassName="explore-main" loading={loading}>
            {sections && (
                <>
                    {sections.hero.length > 0 && <HeroCarousel movies={sections.hero} />}
                    <div className="explore-content">
                        <ContentCarousel type="movie" title="En İyi Oscar Filmleri" items={sections.oscar} />
                        <ContentCarousel type="movie" title="Şimdi Çocuk Olmak Vardı" items={sections.kids} />
                        <ContentCarousel type="movie" title="Aksiyon ve Macera" items={sections.action} />
                        <ContentCarousel type="movie" title="Gerilim ve Heyecan" items={sections.thriller} />
                        <ContentCarousel type="movie" title="Korku ve Ürperti" items={sections.horror} />
                    </div>
                </>
            )}
        </PageLayout>
    )
}

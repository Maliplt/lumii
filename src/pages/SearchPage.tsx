import { useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { SearchX, Search as SearchIcon } from 'lucide-react'
import PageLayout from '../components/PageLayout'
import MediaCard from '../components/MediaCard'
import Spinner from '../components/Spinner'
import StateView from '../components/StateView'
import { tmdbApi } from '../services/tmdb'
import { useFetch } from '../helpers'
import type { SearchResult } from '../types/types'

function isPlayable(result: { media_type?: string; poster_path?: string | null }): result is SearchResult {
  return (result.media_type === 'movie' || result.media_type === 'tv') && !!result.poster_path
}

export default function SearchPage() {
  const [searchParams] = useSearchParams()
  const query = (searchParams.get('q') ?? '').trim()

  const { data, loading, error } = useFetch(
    () => (query ? tmdbApi.search(query) : Promise.resolve(null)),
    query
  )

  const results = useMemo(
    () => (data?.results ?? []).filter(isPlayable),
    [data]
  )

  const renderBody = () => {
    if (!query) {
      return (
        <StateView
          Icon={SearchIcon}
          title="Film veya dizi arayın"
          description="Yukarıdaki arama çubuğuna bir başlık yazarak keşfetmeye başlayın."
        />
      )
    }
    if (loading) return <Spinner inline />
    if (error) {
      return (
        <StateView
          Icon={SearchX}
          title="Arama başarısız oldu"
          description="Sonuçlar getirilirken bir sorun oluştu. Lütfen tekrar deneyin."
        />
      )
    }
    if (results.length === 0) {
      return (
        <StateView
          Icon={SearchX}
          title={`"${query}" için sonuç bulunamadı`}
          description="Farklı bir başlık veya anahtar kelime ile tekrar deneyin."
        />
      )
    }
    return (
      <div className="search-grid">
        {results.map((item) => (
          <MediaCard key={`${item.media_type}-${item.id}`} item={item} type={item.media_type} />
        ))}
      </div>
    )
  }

  return (
    <PageLayout className="search-page" mainClassName="search-main">
      {query && !loading && results.length > 0 && (
        <div className="search-results-header">
          <h2>
            <span className="search-results-query">"{query}"</span> için sonuçlar
          </h2>
          <span className="search-results-count">{results.length} içerik</span>
        </div>
      )}
      {renderBody()}
    </PageLayout>
  )
}

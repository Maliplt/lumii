import { useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { SearchX, Search as SearchIcon } from "lucide-react";
import PageLayout from "../components/PageLayout";
import ContentCarousel from "../components/ContentCarousel";
import Spinner from "../components/Spinner";
import StateView from "../components/StateView";
import { tmdbApi } from "../services/tmdb";
import { isPlayableSearchResult, useFetch, useTitle } from "../helpers";

export default function SearchPage() {
  const [searchParams] = useSearchParams();
  const query = (searchParams.get("q") ?? "").trim();
  useTitle(query ? `"${query}" araması` : "Arama");

  const { data, loading, error } = useFetch(
    () => (query ? tmdbApi.search(query) : Promise.resolve(null)),
    query,
  );

  // oynatilabilir sonuclar
  const allResults = useMemo(
    () => (data?.results ?? []).filter(isPlayableSearchResult),
    [data],
  );

  // sonuclari ture gore ayir — her tur kendi ContentCarousel satirinda
  const movieResults = useMemo(
    () => allResults.filter((r) => r.media_type === "movie"),
    [allResults],
  );
  const tvResults = useMemo(
    () => allResults.filter((r) => r.media_type === "tv"),
    [allResults],
  );

  const renderBody = () => {
    if (!query) {
      return (
        <StateView
          Icon={SearchIcon}
          title="Film veya dizi arayın"
          description="Yukarıdaki arama çubuğuna bir başlık yazarak keşfedin."
        />
      );
    }
    if (loading) return <Spinner inline />;
    if (error) {
      return (
        <StateView
          Icon={SearchX}
          title="Arama başarısız oldu"
          description="Sonuçlar getirilirken bir sorun oluştu. Lütfen tekrar deneyin."
        />
      );
    }
    if (allResults.length === 0) {
      return (
        <StateView
          Icon={SearchX}
          title={`"${query}" için sonuç bulunamadı`}
          description="Farklı bir başlık veya anahtar kelime ile tekrar deneyin."
        />
      );
    }
    // sonuclar ana sayfadaki gibi sira sira ContentCarousel ile
    return (
      <div className="search-rows">
        {movieResults.length > 0 && (
          <ContentCarousel
            type="movie"
            title="Sonuç Filmler"
            items={movieResults}
          />
        )}
        {tvResults.length > 0 && (
          <ContentCarousel type="tv" title="Sonuç Diziler" items={tvResults} />
        )}
      </div>
    );
  };

  return (
    <PageLayout className="search-page" mainClassName="search-main">
      {query && !loading && allResults.length > 0 && (
        <div className="search-head">
          <h2 className="search-head__title">
            <span className="search-head__query">"{query}"</span> için sonuçlar
          </h2>
        </div>
      )}

      {renderBody()}
    </PageLayout>
  );
}

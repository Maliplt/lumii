import { useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { SearchX, Search as SearchIcon } from "lucide-react";
import PageLayout from "../components/layout/PageLayout";
import ContentCarousel from "../components/media/ContentCarousel";
import SpotlightContentCarousel from "../components/media/SpotlightContentCarousel";
import Spinner from "../components/ui/Spinner";
import StateView from "../components/feedback/StateView";
import ServiceErrorView from "../components/feedback/ServiceErrorView";
import { tmdbApi } from "../services/tmdb";
import { isKidsMedia, isPlayableSearchResult, useFetch, useTitle } from "../helpers";
import { useContentAudienceKey } from "../lib/useContentAudienceKey";
import { searchSpotlightDefinitions } from "../services/spotlightCarousels";
import { selectActiveProfile, useAppSelector } from "../store/store";

export default function SearchPage() {
  const [searchParams] = useSearchParams();
  const query = (searchParams.get("q") ?? "").trim();
  const audienceKey = useContentAudienceKey();
  const isKids = useAppSelector(selectActiveProfile)?.kids ?? false;
  const spotlightResults = useMemo(
    () => isKids ? [] : searchSpotlightDefinitions(query, audienceKey),
    [audienceKey, isKids, query],
  );
  useTitle(query ? `"${query}" araması` : "Arama");

  const { data, loading, error, retry } = useFetch(
    () => (query ? tmdbApi.search(query) : Promise.resolve(null)),
    query,
  );

  // sonuçlar
  const allResults = useMemo(
    () => (data?.results ?? [])
      .filter(isPlayableSearchResult)
      .filter((result) => !isKids || isKidsMedia(result)),
    [data, isKids],
  );

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
        <ServiceErrorView
          error={error}
          onRetry={retry}
        />
      );
    }
    if (allResults.length === 0 && spotlightResults.length === 0) {
      return (
        <StateView
          Icon={SearchX}
          title={`"${query}" için sonuç bulunamadı`}
          description="Farklı bir film veya dizi adıyla tekrar deneyin."
        />
      );
    }
    return (
      <div className="search-rows">
        {spotlightResults.map((definition) => (
          <SpotlightContentCarousel
            key={definition.id}
            definition={definition}
            audienceKey={audienceKey}
          />
        ))}
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
      {query && !loading && !error && (allResults.length > 0 || spotlightResults.length > 0) && (
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

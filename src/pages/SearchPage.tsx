import { useMemo, useState, useRef, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { animate, stagger } from "animejs";
import { SearchX, Search as SearchIcon } from "lucide-react";
import { RiMovie2Line, RiTvLine, RiApps2Line } from "react-icons/ri";
import PageLayout from "../components/PageLayout";
import MediaCard from "../components/MediaCard";
import Spinner from "../components/Spinner";
import StateView from "../components/StateView";
import { tmdbApi } from "../services/tmdb";
import { useFetch, useTitle } from "../helpers";
import type { SearchResult } from "../types/types";

// sadece posterli icerikler
function isPlayable(result: {
  media_type?: string;
  poster_path?: string | null;
}): result is SearchResult {
  return (
    (result.media_type === "movie" || result.media_type === "tv") &&
    !!result.poster_path
  );
}

type MediaFilter = "all" | "movie" | "tv";

// filtre butonlarinin tanimlari
const FILTERS: { id: MediaFilter; label: string; Icon: React.ElementType }[] =
  [
    { id: "all", label: "Tümü", Icon: RiApps2Line },
    { id: "movie", label: "Film", Icon: RiMovie2Line },
    { id: "tv", label: "Dizi", Icon: RiTvLine },
  ];

export default function SearchPage() {
  const [searchParams] = useSearchParams();
  const query = (searchParams.get("q") ?? "").trim();
  useTitle(query ? `"${query}" araması` : "Arama");

  // varsayilan tum
  const [mediaFilter, setMediaFilter] = useState<MediaFilter>("all");

  const { data, loading, error } = useFetch(
    () => (query ? tmdbApi.search(query) : Promise.resolve(null)),
    query,
  );

  // tum sonuclar
  const allResults = useMemo(
    () => (data?.results ?? []).filter(isPlayable),
    [data],
  );

  // gosterilecek liste
  const results = useMemo(() => {
    if (mediaFilter === "all") return allResults;
    return allResults.filter((r) => r.media_type === mediaFilter);
  }, [allResults, mediaFilter]);

  // sonuc izgarasi sirayla canlanir (transform-only)
  const gridRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const cards = gridRef.current?.children;
    if (cards && cards.length)
      animate(Array.from(cards), {
        translateY: [22, 0],
        scale: [0.96, 1],
        duration: 460,
        delay: stagger(35),
        ease: "out(3)",
      });
  }, [results]);

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
    if (results.length === 0) {
      return (
        <StateView
          Icon={SearchX}
          title={`"${query}" için sonuç bulunamadı`}
          description="Farklı bir başlık veya anahtar kelime ile tekrar deneyin."
        />
      );
    }
    return (
      <div className="search-grid" ref={gridRef}>
        {results.map((item) => (
          <MediaCard
            key={`${item.media_type}-${item.id}`}
            item={item}
            type={item.media_type}
          />
        ))}
      </div>
    );
  };

  return (
    <PageLayout className="search-page" mainClassName="search-main">
      {query && !loading && allResults.length > 0 && (
        <div className="search-results-header">
          <h2>
            <span className="search-results-query">"{query}"</span> için
            sonuçlar
          </h2>
          <span className="search-results-count">{results.length} içerik</span>
        </div>
      )}

      {/* tur filtresi */}
      {query && !loading && allResults.length > 0 && (
        <div className="search-filters">
          <span className="search-filter-label">Tur:</span>
          {FILTERS.map(({ id, label, Icon }) => (
            <button
              key={id}
              className={`search-filter-pill${mediaFilter === id ? " active" : ""}`}
              onClick={() => setMediaFilter(id)}
              type="button"
            >
              <Icon size={14} />
              {label}
            </button>
          ))}
        </div>
      )}

      {renderBody()}
    </PageLayout>
  );
}

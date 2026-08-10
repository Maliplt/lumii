import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import PageLayout from "../components/PageLayout";
import HeroCarousel from "../components/HeroCarousel";
import ContentCarousel from "../components/ContentCarousel";
import ServiceErrorView from "../components/ServiceErrorView";
import CategoryDropdown from "../components/CategoryDropdown";
import { MOVIE_CATS, TV_CATS, loadAll, loadCategory, type MediaType, type Section, type ExploreData } from "../services/explore";
import { useFetch, useTitle, useLazyReveal } from "../helpers";

export default function ExplorePage() {
  const [searchParams] = useSearchParams();
  const type: MediaType = searchParams.get("type") === "tv" ? "tv" : "movie";
  const [catByType, setCatByType] = useState<Record<MediaType, string>>({
    movie: "all",
    tv: "all",
  });

  useTitle(type === "tv" ? "Dizi İzle" : "Film İzle");

  const cat = catByType[type];
  const cats = type === "tv" ? TV_CATS : MOVIE_CATS;
  const activeCat = cats.find((c) => c.id === cat) ?? cats[0];
  const setCat = (id: string) =>
    setCatByType((prev) => ({ ...prev, [type]: id }));

  const base = useFetch<ExploreData>(() => loadAll(type), `base-${type}`);
  const catFetch = useFetch<Section[]>(
    () =>
      activeCat.genre == null
        ? Promise.resolve([])
        : loadCategory(type, activeCat.genre, activeCat.label),
    `${type}-${cat}`,
  );

  const liveRows: Section[] | null =
    cat === "all" ? (base.data?.rows ?? null) : catFetch.data;
  const rows = liveRows ?? [];
  const catError = cat !== "all" && catFetch.error;

  const dropdown = (
    <CategoryDropdown cats={cats} active={cat} onSelect={setCat} />
  );

  const cards = rows
    .filter((r) => r.items.length > 0)
    .map((r, i) => (
      <ContentCarousel
        key={r.title}
        type={type}
        title={r.title}
        items={r.items}
        headerExtra={i === 0 ? dropdown : undefined}
      />
    ));

  const { visible, sentinelRef } = useLazyReveal(cards.length);

  return (
    <PageLayout
      className="explore-page"
      mainClassName="explore-main"
      loading={base.loading}
    >
      {base.error ? (
        <ServiceErrorView error={base.error} onRetry={base.retry} />
      ) : (
        base.data && (
          <>
            {base.data.hero.length > 0 && (
              <HeroCarousel movies={base.data.hero} />
            )}
            <div className="explore-content">
              {catError && rows.length === 0 ? (
                <ServiceErrorView
                  error={catError}
                  title="Kategori yüklenemedi"
                  onRetry={catFetch.retry}
                />
              ) : (
                <>
                  {cards.slice(0, visible)}
                  {visible < cards.length && (
                    <div className="lazy-row-sentinel" ref={sentinelRef} aria-hidden="true" />
                  )}
                </>
              )}
            </div>
          </>
        )
      )}
    </PageLayout>
  );
}

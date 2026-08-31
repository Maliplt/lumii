import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import PageLayout from "../components/layout/PageLayout";
import HeroCarousel from "../components/media/HeroCarousel";
import ContentCarousel from "../components/media/ContentCarousel";
import SpotlightContentCarousel from "../components/media/SpotlightContentCarousel";
import ServiceErrorView from "../components/feedback/ServiceErrorView";
import CategoryDropdown from "../components/catalog/CategoryDropdown";
import { KIDS_MOVIE_CATS, KIDS_TV_CATS, MOVIE_CATS, TV_CATS, loadAll, loadCategory, type MediaType, type Section, type ExploreData } from "../services/explore";
import { getSpotlightDefinitions } from "../services/spotlightCarousels";
import { interleaveEvenly } from "../lib/utils";
import { useContentAudienceKey } from "../lib/useContentAudienceKey";
import { useFetch, useTitle, useLazyReveal } from "../helpers";
import { selectActiveProfile, useAppSelector } from "../store/store";

export default function ExplorePage() {
  const [searchParams] = useSearchParams();
  const audienceKey = useContentAudienceKey();
  const isKids = useAppSelector(selectActiveProfile)?.kids ?? false;
  const type: MediaType = searchParams.get("type") === "tv" ? "tv" : "movie";
  const [catByType, setCatByType] = useState<Record<MediaType, string>>({
    movie: "all",
    tv: "all",
  });

  useTitle(type === "tv" ? "Dizi İzle" : "Film İzle");

  const cats = isKids
    ? type === "tv" ? KIDS_TV_CATS : KIDS_MOVIE_CATS
    : type === "tv" ? TV_CATS : MOVIE_CATS;
  const cat = cats.some((item) => item.id === catByType[type])
    ? catByType[type]
    : "all";
  const activeCat = cats.find((c) => c.id === cat) ?? cats[0];
  const setCat = (id: string) =>
    setCatByType((prev) => ({ ...prev, [type]: id }));

  const base = useFetch<ExploreData>(() => loadAll(type, isKids), `base-${type}-${isKids}`);
  const catFetch = useFetch<Section[]>(
    () =>
      activeCat.genre == null
        ? Promise.resolve([])
        : loadCategory(type, activeCat.genre, activeCat.label, isKids),
    `${type}-${cat}-${isKids}`,
    "section",
  );
  const liveRows: Section[] | null =
    cat === "all" ? (base.data?.rows ?? null) : catFetch.data;
  const rows = liveRows ?? [];
  const catError = cat !== "all" && catFetch.error;

  const dropdown = (
    <CategoryDropdown cats={cats} active={cat} onSelect={setCat} />
  );

  const standardCards = rows
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

  const spotlightCards = (isKids ? [] : getSpotlightDefinitions("explore", audienceKey, type)).map((definition) => (
    <SpotlightContentCarousel
      key={definition.id}
      definition={definition}
      audienceKey={audienceKey}
    />
  ));
  const cards = cat === "all"
    ? interleaveEvenly(standardCards, spotlightCards)
    : standardCards;

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
                  context="section"
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

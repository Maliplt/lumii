import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import PageLayout from "../components/PageLayout";
import HeroCarousel from "../components/HeroCarousel";
import ContentCarousel from "../components/ContentCarousel";
import SpotlightContentCarousel from "../components/SpotlightContentCarousel";
import ServiceErrorView from "../components/ServiceErrorView";
import CategoryDropdown from "../components/CategoryDropdown";
import { MOVIE_CATS, TV_CATS, loadAll, loadCategory, type MediaType, type Section, type ExploreData } from "../services/explore";
import { getSpotlightDefinitions } from "../services/spotlightCarousels";
import { interleaveEvenly } from "../lib/utils";
import { contentAudienceKey } from "../lib/contentPersonalization";
import { useFetch, useTitle, useLazyReveal } from "../helpers";
import { useAppSelector } from "../store/store";

export default function ExplorePage() {
  const [searchParams] = useSearchParams();
  const activeProfileId = useAppSelector((s) => s.auth.activeProfileId);
  const userEmail = useAppSelector((s) => s.auth.currentUser?.email);
  const audienceKey = useMemo(
    () => contentAudienceKey(userEmail, activeProfileId),
    [activeProfileId, userEmail],
  );
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

  const spotlightCards = getSpotlightDefinitions("explore", audienceKey, type).map((definition) => (
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
                  title="Kategori yüklenemedi"
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

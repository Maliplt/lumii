import { useState, useEffect, useMemo, type ReactElement } from "react";
import PageLayout from "../components/PageLayout";
import HeroCarousel from "../components/HeroCarousel";
import ContentCarousel from "../components/ContentCarousel";
import SpotlightContentCarousel from "../components/SpotlightContentCarousel";
import GameCarousel from "../components/GameCarousel";
import ServiceErrorView from "../components/ServiceErrorView";
import { loadCriticalHome, loadRestHome, loadKidsHome } from "../services/home";
import { getSpotlightDefinitions } from "../services/spotlightCarousels";
import { interleaveEvenly } from "../lib/utils";
import { contentAudienceKey } from "../lib/contentPersonalization";
import { useFetch, useTitle, useLazyReveal, effectivePlanId } from "../helpers";
import { useAppSelector, selectLibrary, selectActiveProfile } from "../store/store";

export default function HomePage() {
  useTitle("");

  const continueWatching = useAppSelector((s) => selectLibrary(s).continueWatching);
  const isLoggedIn = useAppSelector((s) => !!s.auth.currentUser);
  const userPlan = useAppSelector((s) => s.auth.currentUser?.plan);
  const isFreeExperience = effectivePlanId(userPlan) === "free";
  const showContinueRow = useAppSelector((s) => s.settings.continueRow);
  const activeProfile = useAppSelector(selectActiveProfile);
  const activeProfileId = useAppSelector((s) => s.auth.activeProfileId);
  const userEmail = useAppSelector((s) => s.auth.currentUser?.email);
  const isKids = activeProfile?.kids ?? false;
  const audienceKey = useMemo(
    () => contentAudienceKey(userEmail, activeProfileId),
    [activeProfileId, userEmail],
  );

  // çocuk profili
  const kidsData = useFetch(
    () => (isKids ? loadKidsHome() : Promise.resolve(null)),
    `kids-${isKids}`,
  );

  // ana satırlar
  const critical = useFetch(
    () => (!isKids ? loadCriticalHome() : Promise.resolve(null)),
    `home-critical-${isKids}`,
  );
  // arka plan yükleme
  const [deferReady, setDeferReady] = useState(false);
  useEffect(() => {
    if (isKids || !critical.data || deferReady) return;
    const ric = window.requestIdleCallback;
    if (ric) {
      const handle = ric(() => setDeferReady(true), { timeout: 1500 });
      return () => window.cancelIdleCallback?.(handle);
    }
    const t = setTimeout(() => setDeferReady(true), 400);
    return () => clearTimeout(t);
  }, [isKids, critical.data, deferReady]);

  const rest = useFetch(
    () => (!isKids && deferReady ? loadRestHome() : Promise.resolve(null)),
    `home-rest-${isKids}-${deferReady}`,
    "section",
  );
  const heroMovies = isKids
    ? (kidsData.data?.heroMovies ?? [])
    : (critical.data?.heroMovies ?? []);

  // çocuk satırları
  const kidsRows = !isKids || !kidsData.data
    ? []
    : [
        <ContentCarousel key="kids-family" type="movie" title="Aile Filmleri" items={kidsData.data.familyMovies} />,
        <ContentCarousel key="kids-anim" type="movie" title="Animasyon Filmleri" items={kidsData.data.animMovies} />,
        <ContentCarousel key="kids-tv" type="tv" title="Çocuk Dizileri" items={kidsData.data.kidsTV} />,
        <ContentCarousel key="kids-animtv" type="tv" title="Animasyon Dizileri" items={kidsData.data.animTV} />,
        <ContentCarousel key="kids-more" type="movie" title="Daha Fazla Çocuk Filmi" items={kidsData.data.moreFamily} />,
      ];
  // normal satırlar
  const standardRows = isKids || !critical.data
    ? []
    : [
        <ContentCarousel key="popular" type="movie" title="Bu Hafta Popüler Filmler" items={critical.data.popular} />,
        !isFreeExperience ? <GameCarousel key="games" /> : null,
        !isFreeExperience && isLoggedIn && showContinueRow && continueWatching.length > 0 ? (
          <ContentCarousel key="continue" type="movie" title="İzlemeye Devam Et" items={continueWatching} />
        ) : null,
        <ContentCarousel key="nowplaying" type="movie" title="Sinemalarda Vizyondakiler" items={critical.data.nowPlaying} />,
        <ContentCarousel key="trending" type="movie" title="Gündemdeki Filmler" items={critical.data.trendingMovies} />,
        <ContentCarousel key="poptv" type="tv" title="Popüler Diziler" items={critical.data.popularTV} />,
        <ContentCarousel key="airing" type="tv" title="Bugün Yayındaki Diziler" items={rest.data?.airingToday ?? []} />,
        <ContentCarousel key="toptv" type="tv" title="Top 10 Diziler" items={rest.data?.topRatedTV ?? []} />,
        <ContentCarousel key="topmovies" type="movie" title="Top 10 Filmler" items={rest.data?.topMovies ?? []} />,
        <ContentCarousel key="horrormovies" type="movie" title="Korku Filmleri" items={rest.data?.horrorMovies ?? []} />,
        <ContentCarousel key="horrortv" type="tv" title="Korku ve Suç Dizileri" items={rest.data?.crimeTV ?? []} />,
        <ContentCarousel key="comedymovies" type="movie" title="Komedi Filmleri" items={rest.data?.comedyMovies ?? []} />,
        <ContentCarousel key="comedytv" type="tv" title="Komedi Dizileri" items={rest.data?.comedyTV ?? []} />,
        <ContentCarousel key="thriller" type="movie" title="Gerilim Filmleri" items={rest.data?.thrillerMovies ?? []} />,
        <ContentCarousel key="scifimovies" type="movie" title="Bilim Kurgu Filmleri" items={rest.data?.sciFiMovies ?? []} />,
        <ContentCarousel key="scifitv" type="tv" title="Fantastik Diziler" items={rest.data?.sciFiTV ?? []} />,
        <ContentCarousel key="dramatv" type="tv" title="Dram Dizileri" items={rest.data?.dramaTV ?? []} />,
        <ContentCarousel key="adventure" type="movie" title="Macera Filmleri" items={rest.data?.adventure ?? []} />,
        <ContentCarousel key="upcoming" type="movie" title="Yakında Gelecekler" items={rest.data?.upcoming ?? []} />,
        <ContentCarousel key="animation" type="movie" title="Animasyon Filmleri" items={rest.data?.animation ?? []} />,
        <ContentCarousel key="trendingtv" type="tv" title="Gündemdeki Diziler" items={critical.data.trendingTV} />,
      ].filter((row): row is ReactElement => row !== null);

  const spotlightRows = !isKids && critical.data
    ? getSpotlightDefinitions("home", audienceKey).map((definition) => (
        <SpotlightContentCarousel
          key={definition.id}
          definition={definition}
          audienceKey={audienceKey}
        />
      ))
    : [];
  const rows = interleaveEvenly(standardRows, spotlightRows);

  const activeRows = isKids ? kidsRows : rows;
  const isLoading = isKids ? kidsData.loading : critical.loading;
  const pageError = isKids ? kidsData.error : critical.error;
  const retryPage = isKids ? kidsData.retry : critical.retry;

  const { visible, sentinelRef } = useLazyReveal(activeRows.length, 4, 3);

  return (
    <PageLayout
      className="home-page"
      mainClassName="home-main"
      loading={isLoading}
    >
      {pageError ? (
        <ServiceErrorView error={pageError} onRetry={retryPage} />
      ) : (
        <>
          <HeroCarousel movies={heroMovies} />
          <div className="home-content">
            {activeRows.slice(0, visible)}
            {rest.error && (
              <ServiceErrorView
                error={rest.error}
                context="section"
                onRetry={rest.retry}
              />
            )}
            {visible < activeRows.length && (
              <div className="lazy-row-sentinel" ref={sentinelRef} aria-hidden="true" />
            )}
          </div>
        </>
      )}
    </PageLayout>
  );
}

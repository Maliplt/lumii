import { lazy, Suspense, useState, useEffect, useRef, type ReactElement } from "react";
import PageLayout from "../components/layout/PageLayout";
import HeroCarousel from "../components/media/HeroCarousel";
import ContentCarousel from "../components/media/ContentCarousel";
import SpotlightContentCarousel from "../components/media/SpotlightContentCarousel";
import ServiceErrorView from "../components/feedback/ServiceErrorView";
import {
  loadCriticalHome,
  loadPrimaryHome,
  loadExtendedHome,
  loadKidsHome,
} from "../services/home";
import { getSpotlightDefinitions } from "../services/spotlightCarousels";
import { interleaveEvenly } from "../lib/utils";
import { useContentAudienceKey } from "../lib/useContentAudienceKey";
import { useFetch, useTitle, useLazyReveal, effectivePlanId } from "../helpers";
import { useAppSelector, selectLibrary, selectActiveProfile, selectContinueWatchingRowEnabled } from "../store/store";

const GameCarousel = lazy(() => import("../components/media/GameCarousel"));

export default function HomePage() {
  useTitle("");

  const continueWatching = useAppSelector((s) => selectLibrary(s).continueWatching);
  const isLoggedIn = useAppSelector((s) => !!s.auth.currentUser);
  const userPlan = useAppSelector((s) => s.auth.currentUser?.plan);
  const isFreeExperience = effectivePlanId(userPlan) === "free";
  const showContinueRow = useAppSelector(selectContinueWatchingRowEnabled);
  const activeProfile = useAppSelector(selectActiveProfile);
  const isKids = activeProfile?.kids ?? false;
  const audienceKey = useContentAudienceKey();

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

  const primary = useFetch(
    () => (!isKids && deferReady ? loadPrimaryHome() : Promise.resolve(null)),
    `home-primary-${isKids}-${deferReady}`,
    "section",
  );
  const [extendedReady, setExtendedReady] = useState(false);
  const extendedSentinelRef = useRef<HTMLDivElement>(null);

  const extended = useFetch(
    () =>
      !isKids && extendedReady
        ? loadExtendedHome()
        : Promise.resolve(null),
    `home-extended-${isKids}-${extendedReady}`,
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
  const pinnedRows = isKids || !critical.data
    ? []
    : [
        <ContentCarousel key="popular" type="movie" title="Bu Hafta Popüler Filmler" items={critical.data.popular} />,
        <Suspense key="games" fallback={null}>
          <GameCarousel />
        </Suspense>,
      ];
  const standardRows = isKids || !critical.data
    ? []
    : [
        !isFreeExperience && isLoggedIn && showContinueRow && continueWatching.length > 0 ? (
          <ContentCarousel key="continue" type="movie" title="İzlemeye Devam Et" items={continueWatching} />
        ) : null,
        <ContentCarousel key="nowplaying" type="movie" title="Sinemalarda Vizyondakiler" items={primary.data?.nowPlaying ?? []} />,
        <ContentCarousel key="trending" type="movie" title="Gündemdeki Filmler" items={primary.data?.trendingMovies ?? []} />,
        <ContentCarousel key="poptv" type="tv" title="Popüler Diziler" items={primary.data?.popularTV ?? []} />,
        ...(extended.data
          ? [
              <ContentCarousel key="airing" type="tv" title="Bugün Yayındaki Diziler" items={extended.data.airingToday} />,
              <ContentCarousel key="toptv" type="tv" title="Top 10 Diziler" items={extended.data.topRatedTV} />,
              <ContentCarousel key="topmovies" type="movie" title="Top 10 Filmler" items={extended.data.topMovies} />,
              <ContentCarousel key="horrormovies" type="movie" title="Korku Filmleri" items={extended.data.horrorMovies} />,
              <ContentCarousel key="horrortv" type="tv" title="Korku ve Suç Dizileri" items={extended.data.crimeTV} />,
              <ContentCarousel key="comedymovies" type="movie" title="Komedi Filmleri" items={extended.data.comedyMovies} />,
              <ContentCarousel key="comedytv" type="tv" title="Komedi Dizileri" items={extended.data.comedyTV} />,
              <ContentCarousel key="thriller" type="movie" title="Gerilim Filmleri" items={extended.data.thrillerMovies} />,
              <ContentCarousel key="scifimovies" type="movie" title="Bilim Kurgu Filmleri" items={extended.data.sciFiMovies} />,
              <ContentCarousel key="scifitv" type="tv" title="Fantastik Diziler" items={extended.data.sciFiTV} />,
              <ContentCarousel key="dramatv" type="tv" title="Dram Dizileri" items={extended.data.dramaTV} />,
              <ContentCarousel key="adventure" type="movie" title="Macera Filmleri" items={extended.data.adventure} />,
              <ContentCarousel key="upcoming" type="movie" title="Yakında Gelecekler" items={extended.data.upcoming} />,
              <ContentCarousel key="animation" type="movie" title="Animasyon Filmleri" items={extended.data.animation} />,
              <ContentCarousel key="trendingtv" type="tv" title="Gündemdeki Diziler" items={extended.data.trendingTV} />,
            ]
          : []),
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
  const rows = [...pinnedRows, ...interleaveEvenly(standardRows, spotlightRows)];

  const activeRows = isKids ? kidsRows : rows;
  const isLoading = isKids ? kidsData.loading : critical.loading;
  const pageError = isKids ? kidsData.error : critical.error;
  const retryPage = isKids ? kidsData.retry : critical.retry;

  const { visible, sentinelRef } = useLazyReveal(activeRows.length, 4, 3);

  useEffect(() => {
    const sentinel = extendedSentinelRef.current;
    if (
      isKids ||
      extendedReady ||
      !primary.data ||
      visible < activeRows.length ||
      !sentinel
    ) {
      return;
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setExtendedReady(true);
      },
      { rootMargin: "500px 0px" },
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [activeRows.length, extendedReady, isKids, primary.data, visible]);

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
            {primary.error && (
              <ServiceErrorView
                error={primary.error}
                context="section"
                onRetry={primary.retry}
              />
            )}
            {extended.error && (
              <ServiceErrorView
                error={extended.error}
                context="section"
                onRetry={extended.retry}
              />
            )}
            {visible < activeRows.length ? (
              <div className="lazy-row-sentinel" ref={sentinelRef} aria-hidden="true" />
            ) : !isKids && primary.data && !extendedReady ? (
              <div
                className="lazy-row-sentinel"
                ref={extendedSentinelRef}
                aria-hidden="true"
              />
            ) : null}
          </div>
        </>
      )}
    </PageLayout>
  );
}

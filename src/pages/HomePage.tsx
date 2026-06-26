import { useMemo } from "react";
import { AlertTriangle } from "lucide-react";
import PageLayout from "../components/PageLayout";
import HeroCarousel from "../components/HeroCarousel";
import ContentCarousel from "../components/ContentCarousel";
import GameCarousel from "../components/GameCarousel";
import StateView from "../components/StateView";
import { tmdbApi } from "../services/tmdb";
import {
  useFetch,
  useTitle,
  withPoster,
  withMedia,
  heroFrom,
  useLazyReveal,
} from "../helpers";
import { useAppSelector, selectLibrary, selectActiveProfile } from "../store/store";

const HERO_COUNT = 5;

export default function HomePage() {
  useTitle("");

  const continueWatching = useAppSelector((s) => selectLibrary(s).continueWatching);
  const isLoggedIn = useAppSelector((s) => !!s.auth.currentUser);
  const showContinueRow = useAppSelector((s) => s.settings.continueRow);
  const activeProfile = useAppSelector(selectActiveProfile);
  const isKids = activeProfile?.kids ?? false;

  // çocuk profili için içerik
  const kidsData = useFetch(
    () =>
      isKids
        ? Promise.all([
            tmdbApi.getMoviesByGenre("16,10751"),
            tmdbApi.getMoviesByGenre(16),
            tmdbApi.getTVShowsByGenre(10762),
            tmdbApi.getTVShowsByGenre(16),
            tmdbApi.getMoviesByGenre("16,10751", 2),
          ])
        : Promise.resolve(null),
    `kids-${isKids}`,
  );

  // normal içerik
  const { data, loading, error } = useFetch(() =>
    !isKids
      ? Promise.all([
          tmdbApi.getPopularMovies(),
          tmdbApi.getPopularTVShows(),
          tmdbApi.getTrendingMovies(),
          tmdbApi.getTrendingTVShows(),
          tmdbApi.getUpcomingMovies(),
          tmdbApi.getTopRatedTVShows(),
          tmdbApi.getNowPlayingMovies(),
          tmdbApi.getAiringTodayTVShows(),
          tmdbApi.getMoviesByGenre(12),
          tmdbApi.getMoviesByGenre(16),
          tmdbApi.getTopRatedMovies(),
          tmdbApi.getMoviesByGenre(27, 1, "popularity.desc"),
          tmdbApi.getMoviesByGenre(35, 1, "popularity.desc"),
          tmdbApi.getMoviesByGenre(53, 1, "popularity.desc"),
          tmdbApi.getMoviesByGenre(878, 1, "popularity.desc"),
          tmdbApi.getTVShowsByGenre(80, 1, "popularity.desc"),
          tmdbApi.getTVShowsByGenre(10765, 1, "popularity.desc"),
          tmdbApi.getTVShowsByGenre(35, 1, "popularity.desc"),
          tmdbApi.getTVShowsByGenre(18, 1, "popularity.desc"),
        ])
      : Promise.resolve(null),
    `home-${isKids}`,
  );

  const lists = useMemo(() => {
    if (isKids) {
      const kd = kidsData.data;
      if (!kd) return null;
      const [familyMovies, animMovies, kidsTV, animTV, moreFamily] = kd;
      return {
        heroMovies: heroFrom(familyMovies?.results ?? [], HERO_COUNT),
        familyMovies: withPoster([
          ...(familyMovies?.results ?? []),
          ...(animMovies?.results ?? []),
        ]),
        animMovies: withPoster(animMovies?.results ?? []),
        kidsTV: withPoster(kidsTV?.results ?? []),
        animTV: withPoster(animTV?.results ?? []),
        moreFamily: withPoster(moreFamily?.results ?? []),
      };
    }

    // data henüz gelmedi
    if (!data) return null;

    const [
      popularMovies,
      popularTV,
      trending,
      trendingShows,
      upcomingMovies,
      topRatedShows,
      nowPlayingMovies,
      airingShows,
      adventureMovies,
      animationMovies,
      topRatedMovies,
      horrorMovies,
      comedyMovies,
      thrillerMovies,
      sciFiMovies,
      crimeTV,
      sciFiTV,
      comedyTV,
      dramaTV,
    ] = data;

    return {
      movies: withMedia(popularMovies?.results ?? []),
      heroMovies: heroFrom(popularMovies?.results ?? [], HERO_COUNT),
      tvShows: withPoster(popularTV?.results ?? []),
      trendingMovies: withPoster(trending?.results ?? []),
      trendingTV: withPoster(trendingShows?.results ?? []),
      upcoming: withPoster(upcomingMovies?.results ?? []),
      topRatedTV: withPoster(topRatedShows?.results ?? []),
      nowPlaying: withPoster(nowPlayingMovies?.results ?? []),
      airingToday: withPoster(airingShows?.results ?? []),
      adventure: withPoster(adventureMovies?.results ?? []),
      animation: withPoster(animationMovies?.results ?? []),
      topMovies: withPoster(topRatedMovies?.results ?? []),
      horrorMovies: withPoster(horrorMovies?.results ?? []),
      comedyMovies: withPoster(comedyMovies?.results ?? []),
      thrillerMovies: withPoster(thrillerMovies?.results ?? []),
      sciFiMovies: withPoster(sciFiMovies?.results ?? []),
      crimeTV: withPoster(crimeTV?.results ?? []),
      sciFiTV: withPoster(sciFiTV?.results ?? []),
      comedyTV: withPoster(comedyTV?.results ?? []),
      dramaTV: withPoster(dramaTV?.results ?? []),
    };
  }, [data, kidsData.data, isKids]);

  // çocuk satırları
  const kidsRows = useMemo(() => {
    if (!isKids || !lists) return [];
    const l = lists as {
      familyMovies: ReturnType<typeof withPoster>;
      animMovies: ReturnType<typeof withPoster>;
      kidsTV: ReturnType<typeof withPoster>;
      animTV: ReturnType<typeof withPoster>;
      moreFamily: ReturnType<typeof withPoster>;
    };
    return [
      <ContentCarousel key="kids-family" type="movie" title="Aile Filmleri" items={l.familyMovies} />,
      <ContentCarousel key="kids-anim" type="movie" title="Animasyon Filmleri" items={l.animMovies} />,
      <ContentCarousel key="kids-tv" type="tv" title="Çocuk Dizileri" items={l.kidsTV} />,
      <ContentCarousel key="kids-animtv" type="tv" title="Animasyon Dizileri" items={l.animTV} />,
      <ContentCarousel key="kids-more" type="movie" title="Daha Fazla Çocuk Filmi" items={l.moreFamily} />,
    ].filter(Boolean);
  }, [isKids, lists]);

  // normal satırlar
  const rows = useMemo(() => {
    if (isKids || !lists) return [];
    const l = lists as {
      movies: ReturnType<typeof withMedia>;
      tvShows: ReturnType<typeof withPoster>;
      trendingMovies: ReturnType<typeof withPoster>;
      trendingTV: ReturnType<typeof withPoster>;
      upcoming: ReturnType<typeof withPoster>;
      topRatedTV: ReturnType<typeof withPoster>;
      nowPlaying: ReturnType<typeof withPoster>;
      airingToday: ReturnType<typeof withPoster>;
      adventure: ReturnType<typeof withPoster>;
      animation: ReturnType<typeof withPoster>;
      topMovies: ReturnType<typeof withPoster>;
      horrorMovies: ReturnType<typeof withPoster>;
      comedyMovies: ReturnType<typeof withPoster>;
      thrillerMovies: ReturnType<typeof withPoster>;
      sciFiMovies: ReturnType<typeof withPoster>;
      crimeTV: ReturnType<typeof withPoster>;
      sciFiTV: ReturnType<typeof withPoster>;
      comedyTV: ReturnType<typeof withPoster>;
      dramaTV: ReturnType<typeof withPoster>;
    };
    return [
      <ContentCarousel key="popular" type="movie" title="Bu Hafta Popüler Filmler" items={l.movies} />,
      <GameCarousel key="games" />,
      isLoggedIn && showContinueRow && continueWatching.length > 0 ? (
        <ContentCarousel key="continue" type="movie" title="İzlemeye Devam Et" items={continueWatching} />
      ) : null,
      <ContentCarousel key="nowplaying" type="movie" title="Sinemalarda Vizyondakiler" items={l.nowPlaying} />,
      <ContentCarousel key="trending" type="movie" title="Gündemdeki Filmler" items={l.trendingMovies} />,
      <ContentCarousel key="poptv" type="tv" title="Popüler Diziler" items={l.tvShows} />,
      <ContentCarousel key="airing" type="tv" title="Bugün Yayındaki Diziler" items={l.airingToday} />,
      <ContentCarousel key="toptv" type="tv" title="Top 10 Diziler" items={l.topRatedTV} />,
      <ContentCarousel key="topmovies" type="movie" title="Top 10 Filmler" items={l.topMovies} />,
      <ContentCarousel key="horrormovies" type="movie" title="Korku Filmleri" items={l.horrorMovies} />,
      <ContentCarousel key="horrortv" type="tv" title="Korku ve Suç Dizileri" items={l.crimeTV} />,
      <ContentCarousel key="comedymovies" type="movie" title="Komedi Filmleri" items={l.comedyMovies} />,
      <ContentCarousel key="comedytv" type="tv" title="Komedi Dizileri" items={l.comedyTV} />,
      <ContentCarousel key="thriller" type="movie" title="Gerilim Filmleri" items={l.thrillerMovies} />,
      <ContentCarousel key="scifimovies" type="movie" title="Bilim Kurgu Filmleri" items={l.sciFiMovies} />,
      <ContentCarousel key="scifitv" type="tv" title="Fantastik Diziler" items={l.sciFiTV} />,
      <ContentCarousel key="dramatv" type="tv" title="Dram Dizileri" items={l.dramaTV} />,
      <ContentCarousel key="adventure" type="movie" title="Macera Filmleri" items={l.adventure} />,
      <ContentCarousel key="upcoming" type="movie" title="Yakında Gelecekler" items={l.upcoming} />,
      <ContentCarousel key="animation" type="movie" title="Animasyon Filmleri" items={l.animation} />,
      <ContentCarousel key="trendingtv" type="tv" title="Gündemdeki Diziler" items={l.trendingTV} />,
    ].filter(Boolean);
  }, [isKids, lists, isLoggedIn, showContinueRow, continueWatching]);

  const activeRows = isKids ? kidsRows : rows;
  const isLoading = isKids ? kidsData.loading : loading;
  const isError = isKids ? kidsData.error : error;
  const heroMovies = (lists as { heroMovies?: ReturnType<typeof withPoster> } | null)?.heroMovies ?? [];

  const { visible, sentinelRef } = useLazyReveal(activeRows.length, 4, 3);

  return (
    <PageLayout
      className="home-page"
      mainClassName="home-main"
      loading={isLoading}
    >
      {isError ? (
        <StateView
          Icon={AlertTriangle}
          title="İçerik yüklenemedi"
          description="Veriler getirilirken bir sorun oluştu. Lütfen sayfayı yenileyin."
        />
      ) : (
        <>
          <HeroCarousel movies={heroMovies} />
          <div className="home-content">
            {activeRows.slice(0, visible)}
            {visible < activeRows.length && (
              <div className="lazy-row-sentinel" ref={sentinelRef} aria-hidden="true" />
            )}
          </div>
        </>
      )}
    </PageLayout>
  );
}

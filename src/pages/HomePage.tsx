import { useMemo } from "react";
import { AlertTriangle } from "lucide-react";
import PageLayout from "../components/PageLayout";
import HeroCarousel from "../components/HeroCarousel";
import ContentCarousel from "../components/ContentCarousel";
import GameCarousel from "../components/GameCarousel";
import StateView from "../components/StateView";
import { tmdbApi } from "../services/tmdb";
import { useFetch, useTitle, withPoster, withMedia, heroFrom, useLazyReveal } from "../helpers";
import { useAppSelector, selectLibrary } from "../store/store";

const HERO_COUNT = 5;

export default function HomePage() {
  useTitle("");

  // redux
  const continueWatching = useAppSelector((s) => selectLibrary(s).continueWatching);
  const isLoggedIn = useAppSelector((s) => !!s.auth.currentUser);
  const showContinueRow = useAppSelector((s) => s.settings.continueRow);

  const { data, loading, error } = useFetch(() =>
    Promise.all([
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
    ]),
  );

  // Promise.all sirasini bir kez isimlere bagla; asagisi indeks yerine isimle okusun
  const lists = useMemo(() => {
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
    ] = data ?? [];

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
    };
  }, [data]);

  const {
    movies,
    heroMovies,
    tvShows,
    trendingMovies,
    trendingTV,
    upcoming,
    topRatedTV,
    nowPlaying,
    airingToday,
    adventure,
    animation,
  } = lists;

  // tum satirlar tek dizide; useLazyReveal scroll'a gore parca parca gosteriyor
  const rows = [
    <ContentCarousel key="popular" type="movie" title="Bu Hafta Popüler" items={movies} />,
    <GameCarousel key="games" />,
    isLoggedIn && showContinueRow && continueWatching.length > 0 ? (
      <ContentCarousel key="continue" type="movie" title="İzlemeye Devam Et" items={continueWatching} />
    ) : null,
    <ContentCarousel key="nowplaying" type="movie" title="Sinemalarda Vizyondakiler" items={nowPlaying} />,
    <ContentCarousel key="trending" type="movie" title="Gündemdekiler" items={trendingMovies} />,
    <ContentCarousel key="poptv" type="tv" title="Popüler Diziler" items={tvShows} />,
    <ContentCarousel key="airing" type="tv" title="Televizyonda Bugün" items={airingToday} />,
    <ContentCarousel key="toptv" type="tv" title="En Beğenilen Diziler" items={topRatedTV} />,
    <ContentCarousel key="adventure" type="movie" title="Macera Severlere" items={adventure} />,
    <ContentCarousel key="upcoming" type="movie" title="Yakında Gelecekler" items={upcoming} />,
    <ContentCarousel key="animation" type="movie" title="Animasyon Dünyası" items={animation} />,
    <ContentCarousel key="trendingtv" type="tv" title="Gündemdeki Diziler" items={trendingTV} />,
  ].filter(Boolean);

  const { visible, sentinelRef } = useLazyReveal(rows.length);

  return (
    <PageLayout
      className="home-page"
      mainClassName="home-main"
      loading={loading}
    >
      {error ? (
        <StateView
          Icon={AlertTriangle}
          title="İçerik yüklenemedi"
          description="Veriler getirilirken bir sorun oluştu. Lütfen sayfayı yenileyin."
        />
      ) : (
        <>
          <HeroCarousel movies={heroMovies} />
          <div className="home-content">
            {rows.slice(0, visible)}
            {visible < rows.length && (
              <div className="lazy-row-sentinel" ref={sentinelRef} aria-hidden="true" />
            )}
          </div>
        </>
      )}
    </PageLayout>
  );
}

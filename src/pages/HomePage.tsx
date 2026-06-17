import { useMemo } from "react";
import { AlertTriangle } from "lucide-react";
import PageLayout from "../components/PageLayout";
import HeroCarousel from "../components/HeroCarousel";
import ContentCarousel from "../components/ContentCarousel";
import GameCarousel from "../components/GameCarousel";
import StateView from "../components/StateView";
import { tmdbApi } from "../services/tmdb";
import { useFetch } from "../helpers";
import { useAppSelector, selectLibrary } from "../store/store";
import type { Movie, TVShow } from "../types/types";

const HERO_COUNT = 5;

//latin dışı başlıkları filtrele
function isLatinTitle(title: string): boolean {
  return !/[^\u0020-\u024F\u1E00-\u1EFF\u2000-\u206F\u20A0-\u20CF\u2100-\u214F\s]/.test(title);
}

export default function HomePage() {
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

  const movies = useMemo(
    () =>
      (data?.[0].results.filter((m) => m.poster_path && m.backdrop_path) ??
        []) as Movie[],
    [data],
  );

  //hero için latin filtre
  const heroMovies = useMemo(
    () => movies.filter((m) => isLatinTitle(m.title ?? "")).slice(0, HERO_COUNT),
    [movies],
  );

  const tvShows = useMemo(
    () => (data?.[1].results.filter((tv) => tv.poster_path) ?? []) as TVShow[],
    [data],
  );

  const trendingMovies = useMemo(
    () => (data?.[2].results.filter((m) => m.poster_path) ?? []) as Movie[],
    [data],
  );

  const trendingTV = useMemo(
    () => (data?.[3].results.filter((tv) => tv.poster_path) ?? []) as TVShow[],
    [data],
  );

  const upcoming = useMemo(
    () => (data?.[4].results.filter((m) => m.poster_path) ?? []) as Movie[],
    [data],
  );

  const topRatedTV = useMemo(
    () => (data?.[5].results.filter((tv) => tv.poster_path) ?? []) as TVShow[],
    [data],
  );

  const nowPlaying = useMemo(
    () => (data?.[6].results.filter((m) => m.poster_path) ?? []) as Movie[],
    [data],
  );

  const airingToday = useMemo(
    () => (data?.[7].results.filter((tv) => tv.poster_path) ?? []) as TVShow[],
    [data],
  );

  const adventure = useMemo(
    () => (data?.[8].results.filter((m) => m.poster_path) ?? []) as Movie[],
    [data],
  );

  const animation = useMemo(
    () => (data?.[9].results.filter((m) => m.poster_path) ?? []) as Movie[],
    [data],
  );

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
            {isLoggedIn && showContinueRow && continueWatching.length > 0 && (
              <ContentCarousel
                type="movie"
                title="İzlemeye Devam Et"
                items={continueWatching}
              />
            )}
            <GameCarousel />
            <ContentCarousel
              type="movie"
              title="Popüler Filmler"
              items={movies}
            />
            <ContentCarousel
              type="movie"
              title="Sinemalarda Vizyondakiler"
              items={nowPlaying}
            />
            <ContentCarousel
              type="movie"
              title="Gündemdekiler"
              items={trendingMovies}
            />
            <ContentCarousel
              type="tv"
              title="Popüler Diziler"
              items={tvShows}
            />
            <ContentCarousel
              type="tv"
              title="Televizyonda Bugün"
              items={airingToday}
            />
            <ContentCarousel
              type="tv"
              title="En Beğenilen Diziler"
              items={topRatedTV}
            />
            <ContentCarousel
              type="movie"
              title="Macera Severlere"
              items={adventure}
            />
            <ContentCarousel
              type="movie"
              title="Yakında Gelecekler"
              items={upcoming}
            />
            <ContentCarousel
              type="movie"
              title="Animasyon Dünyası"
              items={animation}
            />
            <ContentCarousel
              type="tv"
              title="Gündemdeki Diziler"
              items={trendingTV}
            />
          </div>
        </>
      )}
    </PageLayout>
  );
}

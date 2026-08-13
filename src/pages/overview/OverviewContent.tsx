import { useLayoutEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Lock, Play } from "lucide-react";
import PageLayout from "../../components/PageLayout";
import HeroCarousel from "../../components/HeroCarousel";
import ContentCarousel from "../../components/ContentCarousel";
import Spinner from "../../components/Spinner";
import ServiceErrorView from "../../components/ServiceErrorView";
import NotFoundPage from "../NotFoundPage";
import { tmdbApi, getImageUrl, formatRuntime, pickTrailer } from "../../services/tmdb";
import { normalizeServiceError, optionalServiceRequest, ServiceError, serviceErrorMessage } from "../../services/serviceError";
import { canUseLevel, contentAccessLevel, navigateToPlayback, useFetch, useTitle, formatTime, formatLongDate } from "../../helpers";
import { useAppSelector, selectLibrary, resumeLabel, canResumeProgress } from "../../store/store";
import type { Movie, TVShow, Episode } from "../../types/types";

export default function OverviewContent({
  type,
  id,
}: {
  type: "movie" | "tv";
  id: string;
}) {
  const navigate = useNavigate();
  const [selectedSeason, setSelectedSeason] = useState(1);
  const numId = Number(id);
  const isMovie = type === "movie";
  const userPlan = useAppSelector((s) => s.auth.currentUser?.plan);
  const episodesGridRef = useRef<HTMLDivElement>(null);
  const requiredLevel = contentAccessLevel(type, id);
  const contentLocked = !canUseLevel(userPlan, requiredLevel);

  const { data, loading, error, retry } = useFetch(async () => {
    if (!Number.isFinite(numId)) {
      throw new ServiceError("not-found", serviceErrorMessage("not-found"));
    }
    const detail = isMovie
      ? await tmdbApi.getMovieDetail(numId)
      : await tmdbApi.getTVShowDetail(numId);
    const similar = isMovie
      ? await optionalServiceRequest(tmdbApi.getSimilarMovies(numId))
      : await optionalServiceRequest(tmdbApi.getSimilarTVShows(numId));
    return [detail, similar] as const;
  }, `${type}-${id}`);

  const detail = data?.[0] ?? null;
  const similar = (data?.[1]?.results.filter((item) => item.poster_path) ??
    []) as Movie[] | TVShow[];
  const season = useFetch(
    () =>
      isMovie
        ? Promise.resolve(null)
        : tmdbApi.getTVSeasonDetails(numId, selectedSeason),
    isMovie ? "movie" : `season-${numId}-${selectedSeason}`,
    "section",
  );

  useLayoutEffect(() => {
    const grid = episodesGridRef.current;
    if (!grid || !season.data?.episodes?.length) {
      return;
    }

    const cards = Array.from(grid.children).filter(
      (child): child is HTMLElement => child instanceof HTMLElement,
    );
    const gap = Number.parseFloat(getComputedStyle(grid).columnGap) || 0;
    const resizeCard = (card: HTMLElement) => {
      const height = card.getBoundingClientRect().height;
      card.style.gridRowEnd = `span ${Math.ceil(height + gap)}`;
    };
    const resizeCards = () => cards.forEach(resizeCard);

    grid.classList.add("is-masonry");
    resizeCards();

    const observer = typeof ResizeObserver === "undefined"
      ? null
      : new ResizeObserver((entries) => {
        entries.forEach((entry) => resizeCard(entry.target as HTMLElement));
      });
    if (observer) {
      cards.forEach((card) => observer.observe(card));
    } else {
      window.addEventListener("resize", resizeCards);
    }

    return () => {
      observer?.disconnect();
      window.removeEventListener("resize", resizeCards);
      grid.classList.remove("is-masonry");
      cards.forEach((card) => card.style.removeProperty("grid-row-end"));
    };
  }, [detail, season.data?.episodes]);

  const tvDetail = detail?.media_type === "tv" ? detail : null;
  const movieDetail = detail?.media_type === "movie" ? detail : null;
  const title = isMovie ? movieDetail?.title : tvDetail?.name;
  useTitle(title ?? "");

  const library = useAppSelector(selectLibrary);
  const savedItem = library.continueWatching.find(
    (x) => x.id === numId && x.media_type === type,
  );
  const wp = savedItem?.watchProgress;
  const ctaLabel = resumeLabel(type, wp, formatTime) ?? undefined;
  const ctaNavState =
    canResumeProgress(wp) && !isMovie && wp.season && wp.episode
      ? { season: wp.season, episode: wp.episode }
      : undefined;

  const runtimeMin = isMovie
    ? (movieDetail?.runtime ?? 0)
    : (tvDetail?.episode_run_time?.[0] ?? 0);
  const director = isMovie
    ? detail?.credits?.crew?.find((c) => c.job === "Director")?.name
    : detail?.credits?.crew?.find((c) => c.job === "Executive Producer")?.name;
  const seasonsInfo =
    !isMovie && tvDetail?.number_of_seasons
      ? `${tvDetail.number_of_seasons} Sezon`
      : null;
  const heroMeta = [formatRuntime(runtimeMin), seasonsInfo].filter(
    Boolean,
  ) as string[];
  const heroItems = useMemo(
    () =>
      detail
        ? ([
            {
              ...detail,
              genre_ids: detail.genres?.map((g) => g.id) ?? [],
            },
          ] as (Movie | TVShow)[])
        : [],
    [detail],
  );
  const heroTrailerKey = pickTrailer(detail?.videos?.results ?? []);

  if (error && normalizeServiceError(error).code === "not-found") {
    return <NotFoundPage />;
  }

  return (
    <PageLayout
      className="overview-page"
      mainClassName="overview-main"
      loading={loading}
    >
      {error && (
        <ServiceErrorView
          error={error}
          onRetry={retry}
          onBack={() => navigate(-1)}
        />
      )}

      {detail && (
        <>
          <HeroCarousel
            movies={heroItems}
            inlineTrailer
            inlineTrailerKey={heroTrailerKey}
            hideMoreInfo
            meta={heroMeta}
            director={director}
            directorLabel={isMovie ? "Yönetmen" : "Yapımcı"}
            ctaLabel={ctaLabel}
            ctaNavState={ctaNavState}
          />

          <div className="overview-content">
            {!isMovie && (tvDetail?.number_of_seasons ?? 0) > 0 && (
              <section className="episodes-block" aria-label="Bölümler">
                <div className="episodes-panel">
                  {(tvDetail?.number_of_seasons ?? 0) > 1 && (
                    <div className="season-pills" aria-label="Sezonlar">
                      {Array.from(
                        { length: tvDetail?.number_of_seasons ?? 0 },
                        (_, i) => i + 1,
                      ).map((n) => (
                        <button
                          key={n}
                          type="button"
                          className={`season-pill${selectedSeason === n ? " active" : ""}`}
                          onClick={() => setSelectedSeason(n)}
                        >
                          {String(n).padStart(2, "0")}
                        </button>
                      ))}
                    </div>
                  )}

                  {season.loading ? (
                    <div className="seasons-loading">
                      <Spinner variant="compact" />
                    </div>
                  ) : season.data?.episodes?.length ? (
                    <div ref={episodesGridRef} className="episodes-grid">
                      {season.data.episodes.map((episode: Episode) => (
                        <article
                          key={episode.id}
                          className={`ep-card${contentLocked ? " is-locked" : ""}`}
                          role="button"
                          tabIndex={0}
                          aria-label={`${episode.name || `${episode.episode_number}. Bölüm`} bölümünü oynat`}
                          onClick={() => navigateToPlayback({
                            navigate,
                            type,
                            id,
                            planId: userPlan,
                            autoFullscreen: true,
                            title,
                            season: selectedSeason,
                            episode: episode.episode_number,
                          })}
                          onKeyDown={(event) => {
                            if (event.key !== "Enter" && event.key !== " ") return;
                            event.preventDefault();
                            event.currentTarget.click();
                          }}
                        >
                          <div className="ep-card__thumb">
                            <img
                              src={getImageUrl(
                                episode.still_path || detail.backdrop_path,
                                "w300",
                              )}
                              alt={episode.name}
                              loading="lazy"
                            />
                            <span className="ep-card__index">
                              {String(episode.episode_number).padStart(2, "0")}
                            </span>
                            <span className="ep-card__play">
                              {contentLocked ? <Lock size={16} /> : <Play size={16} fill="currentColor" />}
                            </span>
                          </div>

                          <div className="ep-card__body">
                            <div className="ep-card__head">
                              <h4 className="ep-card__title">
                                {episode.name ||
                                  `${episode.episode_number}. Bölüm`}
                              </h4>
                              {episode.runtime ? (
                                <span className="ep-card__runtime">
                                  {episode.runtime} dk
                                </span>
                              ) : null}
                            </div>
                            <p className="ep-card__overview">
                              {episode.overview ||
                                "Bu bölüm için açıklama bulunmuyor."}
                            </p>
                            {episode.air_date && (
                              <span className="ep-card__date">
                                {formatLongDate(episode.air_date)}
                              </span>
                            )}
                          </div>
                        </article>
                      ))}
                    </div>
                  ) : season.error ? (
                    <ServiceErrorView
                      error={season.error}
                      title="Bölümler yüklenemedi"
                      context="section"
                      onRetry={season.retry}
                      compact
                    />
                  ) : (
                    <div className="seasons-empty">Bu sezonda bölüm bulunmuyor.</div>
                  )}
                </div>
              </section>
            )}

            <div className="overview-similar">
              <ContentCarousel
                type={type}
                title="Benzer İçerikler"
                items={similar}
              />
            </div>
          </div>
        </>
      )}
    </PageLayout>
  );
}

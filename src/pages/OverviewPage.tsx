import { useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { AlertTriangle, Play, ChevronDown, Tv } from "lucide-react";
import PageLayout from "../components/PageLayout";
import HeroCarousel from "../components/HeroCarousel";
import ContentCarousel from "../components/ContentCarousel";
import Spinner from "../components/Spinner";
import StateView from "../components/StateView";
import { tmdbApi, getImageUrl, formatRuntime } from "../services/tmdb";
import { useFetch, useTitle } from "../helpers";
import type {
  MovieDetail,
  TVShowDetail,
  Movie,
  TVShow,
  Episode,
} from "../types/types";

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("tr-TR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

// tip/id degisince yenilenir
export default function OverviewPage() {
  const { type, id } = useParams<{ type: "movie" | "tv"; id: string }>();
  if (!type || !id) return null;
  return <OverviewContent key={`${type}-${id}`} type={type} id={id} />;
}

function OverviewContent({ type, id }: { type: "movie" | "tv"; id: string }) {
  const navigate = useNavigate();
  const [selectedSeason, setSelectedSeason] = useState(1);
  const [episodesOpen, setEpisodesOpen] = useState(false);

  const numId = Number(id);
  const isMovie = type === "movie";

  // ilk ekran verisi
  const { data, loading, error } = useFetch(() =>
    Number.isFinite(numId)
      ? Promise.all([
          isMovie ? tmdbApi.getMovieDetail(numId) : tmdbApi.getTVShowDetail(numId),
          isMovie
            ? tmdbApi.getSimilarMovies(numId)
            : tmdbApi.getSimilarTVShows(numId),
        ])
      : Promise.reject(new Error("Geçersiz içerik ID")),
  );
  const detail = data?.[0] ?? null;
  const similar = (data?.[1].results.filter((item) => item.poster_path) ??
    []) as Movie[] | TVShow[];

  // bolumleri cek
  const season = useFetch(
    () =>
      isMovie
        ? Promise.resolve(null)
        : tmdbApi.getTVSeasonDetails(numId, selectedSeason),
    isMovie ? "movie" : `sezon-${selectedSeason}`,
  );

  const tvDetail = detail as TVShowDetail;
  const movieDetail = detail as MovieDetail;

  const title = isMovie ? movieDetail?.title : tvDetail?.name;
  useTitle(title ?? "");
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

  // hero meta-row icine kutusuz plain metinler (sure, sezon)
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

  return (
    <PageLayout
      className="overview-page"
      mainClassName="overview-main"
      loading={loading}
    >
      {(error || !detail) && (
        <StateView
          Icon={AlertTriangle}
          title="İçerik yüklenemedi"
          description="Bu içeriğe şu anda ulaşılamıyor. Lütfen daha sonra tekrar dene."
        />
      )}
      {detail && (
        <>
          <HeroCarousel
            movies={heroItems}
            inlineTrailer
            hideMoreInfo
            meta={heroMeta}
            director={director}
            directorLabel={isMovie ? "Yönetmen" : "Yapımcı"}
          />

          <div className="overview-content">
          {!isMovie && tvDetail.number_of_seasons > 0 && (
            <div className={`episodes-block${episodesOpen ? " is-open" : ""}`}>
              <button
                type="button"
                className="episodes-toggle"
                onClick={() => setEpisodesOpen((o) => !o)}
                aria-expanded={episodesOpen}
              >
                <span className="episodes-toggle__art">
                  <Tv size={22} />
                </span>
                <span className="episodes-toggle__texts">
                  <span className="episodes-toggle__title">Bölümler</span>
                  <span className="episodes-toggle__sub">
                    {tvDetail.number_of_seasons} sezon · keşfetmek için tıkla
                  </span>
                </span>
                <span
                  className={`episodes-toggle__chev${episodesOpen ? " open" : ""}`}
                >
                  <ChevronDown size={20} />
                </span>
              </button>

              {episodesOpen && (
                <div className="episodes-panel">
                  {tvDetail.number_of_seasons > 1 && (
                    <div className="season-pills">
                      {Array.from(
                        { length: tvDetail.number_of_seasons },
                        (_, i) => i + 1,
                      ).map((n) => (
                        <button
                          key={n}
                          type="button"
                          className={`season-pill${selectedSeason === n ? " active" : ""}`}
                          onClick={() => setSelectedSeason(n)}
                        >
                          {n}. Sezon
                        </button>
                      ))}
                    </div>
                  )}

                  {season.loading ? (
                    <div className="seasons-loading">
                      <Spinner inline />
                    </div>
                  ) : season.data?.episodes?.length ? (
                    <div className="episodes-grid">
                      {season.data.episodes.map((episode: Episode) => (
                        <article
                          key={episode.id}
                          className="ep-card"
                          onClick={() =>
                            navigate(`/${type}/${id}/player`, {
                              state: { title },
                            })
                          }
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
                              <Play size={18} fill="currentColor" />
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
                                {formatDate(episode.air_date)}
                              </span>
                            )}
                          </div>
                        </article>
                      ))}
                    </div>
                  ) : (
                    <div className="seasons-empty">
                      Bölüm bilgilerine şu anda ulaşılamıyor.
                    </div>
                  )}
                </div>
              )}
            </div>
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

import { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button, Modal } from "rsuite";
import { Play, ChevronDown, Tv } from "lucide-react";
import { MotionIcon } from "motion-icons-react";
import PageLayout from "../components/PageLayout";
import ContentCarousel from "../components/ContentCarousel";
import Spinner from "../components/Spinner";
import { tmdbApi, getImageUrl, pickTrailer } from "../services/tmdb";
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
  const [trailerOpen, setTrailerOpen] = useState(false);
  const [episodesOpen, setEpisodesOpen] = useState(false);
  const textClipRef = useRef<HTMLDivElement>(null);

  const numId = Number(id);
  const isMovie = type === "movie";

  // toplu yukleme
  const { data, loading } = useFetch(() =>
    Promise.all([
      isMovie ? tmdbApi.getMovieDetail(numId) : tmdbApi.getTVShowDetail(numId),
      isMovie
        ? tmdbApi.getSimilarMovies(numId)
        : tmdbApi.getSimilarTVShows(numId),
      tmdbApi.getVideos(type, numId),
    ]),
  );
  const detail = data?.[0] ?? null;
  const similar = (data?.[1].results.filter((item) => item.poster_path) ??
    []) as Movie[] | TVShow[];
  const trailerKey = data ? pickTrailer(data[2].results) : null;

  // bolumleri cek
  const season = useFetch(
    () =>
      isMovie
        ? Promise.resolve(null)
        : tmdbApi.getTVSeasonDetails(numId, selectedSeason),
    isMovie ? "movie" : `sezon-${selectedSeason}`,
  );

  // ozet kayar
  useEffect(() => {
    const el = textClipRef.current;
    if (!el) return;
    const measure = () => {
      el.classList.remove("is-overflowing");
      const overflow = el.scrollHeight - el.clientHeight;
      if (overflow > 8) {
        el.style.setProperty("--overview-scroll", `-${overflow}px`);
        el.style.setProperty(
          "--overview-scroll-dur",
          `${Math.max(10, Math.round(overflow / 18) + 8)}s`,
        );
        el.classList.add("is-overflowing");
      }
    };
    const raf = requestAnimationFrame(measure);
    window.addEventListener("resize", measure);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", measure);
    };
  }, [detail]);

  const tvDetail = detail as TVShowDetail;
  const movieDetail = detail as MovieDetail;

  const title = isMovie ? movieDetail?.title : tvDetail?.name;
  useTitle(title ?? "");
  const year = isMovie
    ? movieDetail?.release_date?.slice(0, 4)
    : tvDetail?.first_air_date?.slice(0, 4);
  const runtime = isMovie
    ? movieDetail?.runtime
      ? `${movieDetail.runtime} dk`
      : null
    : tvDetail?.episode_run_time?.[0]
      ? `${tvDetail.episode_run_time[0]} dk`
      : null;
  const genres = detail?.genres?.map((g) => g.name).join(" / ");
  const director = isMovie
    ? detail?.credits?.crew?.find((c) => c.job === "Director")?.name
    : detail?.credits?.crew?.find((c) => c.job === "Executive Producer")?.name;
  const seasonsInfo =
    !isMovie && tvDetail?.number_of_seasons
      ? `${tvDetail.number_of_seasons} Sezon`
      : null;

  return (
    <PageLayout
      className="overview-page"
      mainClassName="overview-main"
      loading={loading || !detail}
    >
      {detail && (
        <>
          <div className="overview-hero">
            <img
              className="overview-hero__img"
              src={getImageUrl(detail.backdrop_path, "original")}
              alt={title}
              loading="lazy"
            />
            <div className="overview-hero__overlay" />
            <div className="overview-hero__info">
              <h1 className="overview-hero__title">{title}</h1>
              <p className="overview-meta">
                {[genres, runtime, seasonsInfo, year]
                  .filter(Boolean)
                  .join(" · ")}
              </p>
              <div className="overview-text-clip" ref={textClipRef}>
                <p className="overview-text">{detail.overview}</p>
              </div>
              {director && (
                <p className="overview-crew">
                  <strong>Yönetmen:</strong> {director}
                </p>
              )}
              <div className="overview-actions">
                <Button
                  className="btn-play"
                  size="lg"
                  onClick={() =>
                    navigate(`/${type}/${id}/player`, { state: { title } })
                  }
                >
                  <Play size={20} fill="currentColor" className="play-icon" />{" "}
                  Oynat
                </Button>
                {trailerKey && (
                  <Button
                    className="btn-trailer"
                    size="lg"
                    onClick={() => setTrailerOpen(true)}
                  >
                    <MotionIcon
                      name="Film"
                      size={20}
                      trigger="hover"
                      animation="pop"
                    />{" "}
                    Fragman İzle
                  </Button>
                )}
              </div>
            </div>
          </div>

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

          {trailerKey && (
            <Modal
              open={trailerOpen}
              onClose={() => setTrailerOpen(false)}
              size="lg"
              className="lumii-modal trailer-modal"
            >
              <Modal.Header>
                <Modal.Title>{title} — Fragman</Modal.Title>
              </Modal.Header>
              <Modal.Body>
                {trailerOpen && (
                  <div className="trailer-frame">
                    <iframe
                      src={`https://www.youtube.com/embed/${trailerKey}?autoplay=1&rel=0&modestbranding=1`}
                      title="Fragman"
                      allow="autoplay; encrypted-media; fullscreen"
                      allowFullScreen
                    />
                  </div>
                )}
              </Modal.Body>
            </Modal>
          )}
        </>
      )}
    </PageLayout>
  );
}

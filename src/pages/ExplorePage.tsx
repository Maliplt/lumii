import { useMemo, useState } from "react";
import { Dropdown } from "rsuite";
import { AlertTriangle } from "lucide-react";
import PageLayout from "../components/PageLayout";
import HeroCarousel from "../components/HeroCarousel";
import ContentCarousel from "../components/ContentCarousel";
import StateView from "../components/StateView";
import Spinner from "../components/Spinner";
import { tmdbApi } from "../services/tmdb";
import { useFetch } from "../helpers";
import type { Movie } from "../types/types";

const GENRE = {
  kidsAndFamily: "16,10751",
  action: 28,
  thriller: 53,
  horror: 27,
  scifi: 878,
  comedy: 35,
  romance: 10749,
} as const;

const HERO_RANGE = [5, 10] as const;

const ALL_CATEGORY = { id: "all", label: "Tümü", genre: null as number | null };

const CATEGORIES = [
  ALL_CATEGORY,
  { id: "28", label: "Aksiyon", genre: 28 },
  { id: "35", label: "Komedi", genre: 35 },
  { id: "27", label: "Korku", genre: 27 },
  { id: "878", label: "Bilim-Kurgu", genre: 878 },
];

const withMedia = (list: Movie[]) =>
  list.filter((m) => m.poster_path && m.backdrop_path);

export default function ExplorePage() {
  const [activeCat, setActiveCat] = useState<string>("all");

  const { data, loading, error } = useFetch(() =>
    Promise.all([
      tmdbApi.getTopRatedMovies(),
      tmdbApi.getMoviesByGenre(GENRE.kidsAndFamily),
      tmdbApi.getMoviesByGenre(GENRE.action),
      tmdbApi.getMoviesByGenre(GENRE.thriller),
      tmdbApi.getMoviesByGenre(GENRE.horror),
      tmdbApi.getMoviesByGenre(GENRE.scifi),
      tmdbApi.getMoviesByGenre(GENRE.comedy),
      tmdbApi.getMoviesByGenre(GENRE.romance),
    ]),
  );

  const active = CATEGORIES.find((c) => c.id === activeCat) ?? ALL_CATEGORY;

  // tur
  const genre = useFetch<Movie[]>(
    () =>
      active.genre == null
        ? Promise.resolve([])
        : tmdbApi
            .getMoviesByGenre(active.genre)
            .then((r) => withMedia(r.results)),
    active.genre ?? "all",
  );

  // filtre
  const filterDropdown = (
    <Dropdown
      title={active.label}
      className="explore-dropdown"
      activeKey={activeCat}
      onSelect={(key) => setActiveCat((key as string) ?? "all")}
      placement="bottomStart"
      size="sm"
    >
      {CATEGORIES.map((c) => (
        <Dropdown.Item key={c.id} eventKey={c.id} active={c.id === activeCat}>
          {c.label}
        </Dropdown.Item>
      ))}
    </Dropdown>
  );

  const sections = useMemo(() => {
    if (!data) return null;
    const [
      topRatedRes,
      kidsRes,
      actionRes,
      thrillerRes,
      horrorRes,
      scifiRes,
      comedyRes,
      romanceRes,
    ] = data;
    const oscar = withMedia(topRatedRes.results);
    return {
      hero: oscar.slice(HERO_RANGE[0], HERO_RANGE[1]),
      oscar,
      kids: withMedia(kidsRes.results),
      action: withMedia(actionRes.results),
      thriller: withMedia(thrillerRes.results),
      horror: withMedia(horrorRes.results),
      scifi: withMedia(scifiRes.results),
      comedy: withMedia(comedyRes.results),
      romance: withMedia(romanceRes.results),
    };
  }, [data]);

  return (
    <PageLayout
      className="explore-page"
      mainClassName="explore-main"
      loading={loading}
    >
      {error ? (
        <StateView
          Icon={AlertTriangle}
          title="İçerik yüklenemedi"
          description="Veriler getirilirken bir sorun oluştu. Lütfen sayfayı yenileyin."
        />
      ) : (
        sections && (
          <>
            {sections.hero.length > 0 && (
              <HeroCarousel movies={sections.hero} />
            )}
            <div className="explore-content">
              {activeCat === "all" ? (
                <>
                  <ContentCarousel
                    type="movie"
                    title="En İyi Oscar Filmleri"
                    items={sections.oscar}
                    headerExtra={filterDropdown}
                  />
                  <ContentCarousel
                    type="movie"
                    title="Şimdi Çocuk Olmak Vardı"
                    items={sections.kids}
                  />
                  <ContentCarousel
                    type="movie"
                    title="Aksiyon ve Macera"
                    items={sections.action}
                  />
                  <ContentCarousel
                    type="movie"
                    title="Komedi Rüzgarı"
                    items={sections.comedy}
                  />
                  <ContentCarousel
                    type="movie"
                    title="Bilim Kurgu ve Fantastik"
                    items={sections.scifi}
                  />
                  <ContentCarousel
                    type="movie"
                    title="Gerilim ve Heyecan"
                    items={sections.thriller}
                  />
                  <ContentCarousel
                    type="movie"
                    title="Aşk ve Romantizm"
                    items={sections.romance}
                  />
                  <ContentCarousel
                    type="movie"
                    title="Korku ve Ürperti"
                    items={sections.horror}
                  />
                </>
              ) : (
                <>
                  <ContentCarousel
                    type="movie"
                    title={active.label}
                    items={genre.data ?? []}
                    headerExtra={filterDropdown}
                  />
                  {genre.loading && <Spinner inline />}
                  {genre.error && (
                    <StateView
                      Icon={AlertTriangle}
                      title="Kategori yüklenemedi"
                      description="Bu kategori getirilirken bir sorun oluştu. Lütfen tekrar deneyin."
                    />
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

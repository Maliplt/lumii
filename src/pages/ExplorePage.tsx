import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { AlertTriangle, ChevronUp } from "lucide-react";
import PageLayout from "../components/PageLayout";
import HeroCarousel from "../components/HeroCarousel";
import ContentCarousel from "../components/ContentCarousel";
import StateView from "../components/StateView";
import Spinner from "../components/Spinner";
import { tmdbApi } from "../services/tmdb";
import { useFetch, useTitle, withPoster, heroFrom, useLazyReveal } from "../helpers";
import type { Movie, TVShow } from "../types/types";

type Media = Movie | TVShow;
type MediaType = "movie" | "tv";

interface Section {
  title: string;
  items: Media[];
}
interface ExploreData {
  hero: Media[];
  rows: Section[];
}
interface Cat {
  id: string;
  label: string;
  genre: number | string | null;
}

const MOVIE_CATS: Cat[] = [
  { id: "all", label: "Tümü", genre: null },
  { id: "28", label: "Aksiyon", genre: 28 },
  { id: "12", label: "Macera", genre: 12 },
  { id: "35", label: "Komedi", genre: 35 },
  { id: "18", label: "Dram", genre: 18 },
  { id: "27", label: "Korku", genre: 27 },
  { id: "878", label: "Bilim-Kurgu", genre: 878 },
  { id: "53", label: "Gerilim", genre: 53 },
  { id: "10749", label: "Romantik", genre: 10749 },
  { id: "16", label: "Animasyon", genre: 16 },
];

const TV_CATS: Cat[] = [
  { id: "all", label: "Tümü", genre: null },
  { id: "10759", label: "Aksiyon & Macera", genre: 10759 },
  { id: "35", label: "Komedi", genre: 35 },
  { id: "18", label: "Dram", genre: 18 },
  { id: "10765", label: "Bilim-Kurgu & Fantastik", genre: 10765 },
  { id: "80", label: "Suç", genre: 80 },
  { id: "9648", label: "Gizem", genre: 9648 },
  { id: "16", label: "Animasyon", genre: 16 },
  { id: "10764", label: "Realite", genre: 10764 },
];

function CategoryDropdown({
  cats,
  active,
  onSelect,
}: {
  cats: Cat[];
  active: string;
  onSelect: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const activeCat = cats.find((c) => c.id === active) ?? cats[0];

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  return (
    <div className={`cat-dd${open ? " open" : ""}`} ref={ref}>
      <button
        type="button"
        className="cat-dd__toggle"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
      >
        <span>{activeCat.label}</span>
        <ChevronUp size={16} className="cat-dd__caret" />
      </button>
      {open && (
        <div className="cat-dd__menu">
          {cats.map((c) => (
            <button
              key={c.id}
              type="button"
              className={`cat-dd__item${c.id === active ? " active" : ""}`}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => {
                onSelect(c.id);
                setOpen(false);
              }}
            >
              {c.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

async function loadAll(type: MediaType): Promise<ExploreData> {
  if (type === "movie") {
    const [
      trending,
      topRated,
      nowPlaying,
      action,
      comedy,
      scifi,
      thriller,
      romance,
      horror,
      family,
    ] = await Promise.all([
      tmdbApi.getTrendingMovies(),
      tmdbApi.getTopRatedMovies(),
      tmdbApi.getNowPlayingMovies(),
      tmdbApi.getMoviesByGenre(28),
      tmdbApi.getMoviesByGenre(35),
      tmdbApi.getMoviesByGenre(878),
      tmdbApi.getMoviesByGenre(53),
      tmdbApi.getMoviesByGenre(10749),
      tmdbApi.getMoviesByGenre(27),
      tmdbApi.getMoviesByGenre("16,10751"),
    ]);
    return {
      hero: heroFrom(trending.results),
      rows: [
        { title: "En Yüksek Puanlılar", items: withPoster(topRated.results) },
        { title: "Sinemalarda Vizyondakiler", items: withPoster(nowPlaying.results) },
        { title: "Gündemdekiler", items: withPoster(trending.results) },
        { title: "Aksiyon ve Macera", items: withPoster(action.results) },
        { title: "Komedi Rüzgarı", items: withPoster(comedy.results) },
        { title: "Bilim Kurgu ve Fantastik", items: withPoster(scifi.results) },
        { title: "Gerilim ve Heyecan", items: withPoster(thriller.results) },
        { title: "Aşk ve Romantizm", items: withPoster(romance.results) },
        { title: "Korku ve Ürperti", items: withPoster(horror.results) },
        { title: "Çocuklar ve Aile", items: withPoster(family.results) },
      ],
    };
  }

  const [
    trending,
    topRated,
    airing,
    onAir,
    actionAdv,
    comedy,
    drama,
    scifiFan,
    crime,
    anim,
  ] = await Promise.all([
    tmdbApi.getTrendingTVShows(),
    tmdbApi.getTopRatedTVShows(),
    tmdbApi.getAiringTodayTVShows(),
    tmdbApi.getOnTheAirTVShows(),
    tmdbApi.getTVShowsByGenre(10759),
    tmdbApi.getTVShowsByGenre(35),
    tmdbApi.getTVShowsByGenre(18),
    tmdbApi.getTVShowsByGenre(10765),
    tmdbApi.getTVShowsByGenre(80),
    tmdbApi.getTVShowsByGenre(16),
  ]);
  return {
    hero: heroFrom(trending.results),
    rows: [
      { title: "En Beğenilen Diziler", items: withPoster(topRated.results) },
      { title: "Bugün Yayında", items: withPoster(airing.results) },
      { title: "Yeni Bölümler", items: withPoster(onAir.results) },
      { title: "Gündemdeki Diziler", items: withPoster(trending.results) },
      { title: "Aksiyon ve Macera", items: withPoster(actionAdv.results) },
      { title: "Komedi Dizileri", items: withPoster(comedy.results) },
      { title: "Dram", items: withPoster(drama.results) },
      { title: "Bilim Kurgu ve Fantastik", items: withPoster(scifiFan.results) },
      { title: "Suç ve Polisiye", items: withPoster(crime.results) },
      { title: "Animasyon Dizileri", items: withPoster(anim.results) },
    ],
  };
}

async function loadCategory(
  type: MediaType,
  genre: number | string,
  label: string,
): Promise<Section[]> {
  const byGenre = (page: number, sort?: string) =>
    type === "movie"
      ? tmdbApi.getMoviesByGenre(genre, page, sort)
      : tmdbApi.getTVShowsByGenre(genre, page, sort);

  const [p1, top, p2, p3] = await Promise.all([
    byGenre(1),
    byGenre(1, "vote_average.desc"),
    byGenre(2),
    byGenre(3),
  ]);
  return [
    { title: `${label} — Öne Çıkanlar`, items: withPoster(p1.results) },
    { title: `${label} — En Yüksek Puanlılar`, items: withPoster(top.results) },
    { title: `${label} — Daha Fazlası`, items: withPoster(p2.results) },
    { title: `${label} — Keşfet`, items: withPoster(p3.results) },
  ];
}

export default function ExplorePage() {
  const [searchParams] = useSearchParams();
  const type: MediaType = searchParams.get("type") === "tv" ? "tv" : "movie";
  const [catByType, setCatByType] = useState<Record<MediaType, string>>({
    movie: "all",
    tv: "all",
  });
  const scrollBeforeCategory = useRef<number | null>(null);

  useTitle(type === "tv" ? "Dizi İzle" : "Film İzle");

  const cat = catByType[type];
  const cats = type === "tv" ? TV_CATS : MOVIE_CATS;
  const activeCat = cats.find((c) => c.id === cat) ?? cats[0];
  const setCat = (id: string) => {
    scrollBeforeCategory.current = window.scrollY;
    setCatByType((prev) => ({ ...prev, [type]: id }));
  };

  const base = useFetch<ExploreData>(() => loadAll(type), `base-${type}`);
  const catFetch = useFetch<Section[]>(
    () =>
      activeCat.genre == null
        ? Promise.resolve([])
        : loadCategory(type, activeCat.genre, activeCat.label),
    `${type}-${cat}`,
  );

  const rows = cat === "all" ? (base.data?.rows ?? []) : (catFetch.data ?? []);
  const catLoading = cat !== "all" && catFetch.loading;

  useLayoutEffect(() => {
    if (scrollBeforeCategory.current == null) return;
    const y = scrollBeforeCategory.current;
    const keepScroll = () => window.scrollTo({ top: y });
    keepScroll();
    requestAnimationFrame(keepScroll);
    window.setTimeout(keepScroll, 250);
    window.setTimeout(() => {
      keepScroll();
      scrollBeforeCategory.current = null;
    }, 750);
  }, [cat, catLoading, rows.length]);

  const dropdown = (
    <CategoryDropdown cats={cats} active={cat} onSelect={setCat} />
  );

  // dolu satirlari elemana cevir; useLazyReveal scroll'a gore parca parca gosteriyor
  const cards = rows
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

  const { visible, sentinelRef } = useLazyReveal(cards.length);

  return (
    <PageLayout
      className="explore-page"
      mainClassName="explore-main"
      loading={base.loading}
    >
      {base.error ? (
        <StateView
          Icon={AlertTriangle}
          title="İçerik yüklenemedi"
          description="Veriler getirilirken bir sorun oluştu. Lütfen sayfayı yenileyin."
        />
      ) : (
        base.data && (
          <>
            {base.data.hero.length > 0 && (
              <HeroCarousel movies={base.data.hero} />
            )}
            <div className="explore-content">
              {catLoading ? (
                <>
                  <ContentCarousel
                    type={type}
                    title={activeCat.label}
                    items={[]}
                    headerExtra={dropdown}
                  />
                  <Spinner inline />
                </>
              ) : catFetch.error ? (
                <StateView
                  Icon={AlertTriangle}
                  title="Kategori yüklenemedi"
                  description="Bu kategori getirilirken bir sorun oluştu. Lütfen tekrar deneyin."
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

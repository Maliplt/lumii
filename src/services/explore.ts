import { tmdbApi, GENRES } from "./tmdb";
import { withPoster, heroFrom, settleList } from "../lib/utils";
import type { Movie, TVShow } from "../types/types";

export type Media = Movie | TVShow;
export type MediaType = "movie" | "tv";

export interface Section {
  title: string;
  items: Media[];
}

export interface ExploreData {
  hero: Media[];
  rows: Section[];
}

export interface Cat {
  id: string;
  label: string;
  genre: number | string | null;
}

// kategoriler
export const MOVIE_CATS: Cat[] = [
  { id: "all", label: "Tümü", genre: null },
  { id: "28", label: GENRES[28], genre: 28 },
  { id: "12", label: GENRES[12], genre: 12 },
  { id: "35", label: GENRES[35], genre: 35 },
  { id: "18", label: GENRES[18], genre: 18 },
  { id: "27", label: GENRES[27], genre: 27 },
  { id: "878", label: GENRES[878], genre: 878 },
  { id: "53", label: GENRES[53], genre: 53 },
  { id: "10749", label: GENRES[10749], genre: 10749 },
  { id: "16", label: GENRES[16], genre: 16 },
];

export const TV_CATS: Cat[] = [
  { id: "all", label: "Tümü", genre: null },
  { id: "10759", label: GENRES[10759], genre: 10759 },
  { id: "35", label: GENRES[35], genre: 35 },
  { id: "18", label: GENRES[18], genre: 18 },
  { id: "10765", label: GENRES[10765], genre: 10765 },
  { id: "80", label: GENRES[80], genre: 80 },
  { id: "9648", label: GENRES[9648], genre: 9648 },
  { id: "16", label: GENRES[16], genre: 16 },
  { id: "10764", label: GENRES[10764], genre: 10764 },
];

// varsayılan satırlar
const MOVIE_GENRE_ROWS: { title: string; genre: number | string }[] = [
  { title: "Aksiyon ve Macera", genre: 28 },
  { title: "Komedi Rüzgarı", genre: 35 },
  { title: "Bilim Kurgu ve Fantastik", genre: 878 },
  { title: "Gerilim ve Heyecan", genre: 53 },
  { title: "Aşk ve Romantizm", genre: 10749 },
  { title: "Korku ve Ürperti", genre: 27 },
  { title: "Çocuklar ve Aile", genre: "16,10751" },
];

const TV_GENRE_ROWS: { title: string; genre: number | string }[] = [
  { title: "Aksiyon ve Macera", genre: 10759 },
  { title: "Komedi Dizileri", genre: 35 },
  { title: "Dram", genre: 18 },
  { title: "Bilim Kurgu ve Fantastik", genre: 10765 },
  { title: "Suç ve Polisiye", genre: 80 },
  { title: "Animasyon Dizileri", genre: 16 },
];

export async function loadAll(type: MediaType): Promise<ExploreData> {
  if (type === "movie") {
    const [trending, topRated, nowPlaying, ...genreResults] = await settleList([
      tmdbApi.getTrendingMovies(),
      tmdbApi.getTopRatedMovies(),
      tmdbApi.getNowPlayingMovies(),
      ...MOVIE_GENRE_ROWS.map((row) => tmdbApi.getMoviesByGenre(row.genre)),
    ]);
    return {
      hero: heroFrom(trending?.results ?? []),
      rows: [
        { title: "En Yüksek Puanlı Filmler", items: withPoster(topRated?.results ?? []) },
        { title: "Sinemalarda Vizyondakiler", items: withPoster(nowPlaying?.results ?? []) },
        { title: "Gündemdekiler", items: withPoster(trending?.results ?? []) },
        ...MOVIE_GENRE_ROWS.map((row, i) => ({
          title: row.title,
          items: withPoster(genreResults[i]?.results ?? []),
        })),
      ],
    };
  }

  const [trending, topRated, airing, onAir, ...genreResults] = await settleList([
    tmdbApi.getTrendingTVShows(),
    tmdbApi.getTopRatedTVShows(),
    tmdbApi.getAiringTodayTVShows(),
    tmdbApi.getOnTheAirTVShows(),
    ...TV_GENRE_ROWS.map((row) => tmdbApi.getTVShowsByGenre(row.genre)),
  ]);
  return {
    hero: heroFrom(trending?.results ?? []),
    rows: [
      { title: "En Beğenilen Diziler", items: withPoster(topRated?.results ?? []) },
      { title: "Bugün Yayında", items: withPoster(airing?.results ?? []) },
      { title: "Yeni Bölümler", items: withPoster(onAir?.results ?? []) },
      { title: "Gündemdeki Diziler", items: withPoster(trending?.results ?? []) },
      ...TV_GENRE_ROWS.map((row, i) => ({
        title: row.title,
        items: withPoster(genreResults[i]?.results ?? []),
      })),
    ],
  };
}

export async function loadCategory(
  type: MediaType,
  genre: number | string,
  label: string,
): Promise<Section[]> {
  const byGenre = (page: number, sort?: string) =>
    type === "movie"
      ? tmdbApi.getMoviesByGenre(genre, page, sort)
      : tmdbApi.getTVShowsByGenre(genre, page, sort);

  const [p1, top, p2, p3] = await settleList([
    byGenre(1),
    byGenre(1, "vote_average.desc"),
    byGenre(2),
    byGenre(3),
  ]);
  const noun = type === "movie" ? "Filmler" : "Diziler";
  return [
    { title: `${label} - Öne Çıkan ${noun}`, items: withPoster(p1?.results ?? []) },
    { title: `${label} - En Yüksek Puanlı ${noun}`, items: withPoster(top?.results ?? []) },
    { title: `${label} - Daha Fazla ${noun}`, items: withPoster(p2?.results ?? []) },
    { title: `${label} - Keşfet`, items: withPoster(p3?.results ?? []) },
  ];
}

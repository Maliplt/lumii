import sudokuImg from "../assets/images/sudoku.webp";
import minesweepImg from "../assets/images/minesweeper.webp";
import blockblastImg from "../assets/images/blockblast.webp";
import mahjongImg from "../assets/images/mahjong.webp";
import game2048Img from "../assets/images/2048.webp";
import kelimezinciriImg from "../assets/images/kelimezinciri.webp";
import doomImg from "../assets/images/doom.svg";

export interface GameDef {
  id: string;
  name: string;
  path: string;
  image: string;
  description: string;
  tag: string;
  storageKey: string;
  scoreLabel: string;
  isScore: boolean;
  showScore?: boolean;
}

// oyun listesi
export const GAMES: GameDef[] = [
  {
    id: "doom",
    name: "Doom",
    path: "/play/doom",
    image: doomImg,
    description: "Klasik birinci şahıs aksiyon",
    tag: "Aksiyon",
    storageKey: "doom_session",
    scoreLabel: "İlerleme",
    isScore: false,
    showScore: false,
  },
  {
    id: "2048",
    name: "2048",
    path: "/play/2048",
    image: game2048Img,
    description: "Sayıları Birleştir",
    tag: "Strateji",
    storageKey: "game2048_best_score",
    scoreLabel: "En İyi Skor",
    isScore: true,
  },
  {
    id: "kelimezinciri",
    name: "Kelime Zinciri",
    path: "/play/kelimezinciri",
    image: kelimezinciriImg,
    description: "Zeka ve Hafıza Oyunu",
    tag: "Dil",
    storageKey: "kelimezinciri_best",
    scoreLabel: "En İyi Skor",
    isScore: true,
  },
  {
    id: "sudoku",
    name: "Sudoku",
    path: "/play/sudoku",
    image: sudokuImg,
    description: "Zeka ve Mantık Oyunu",
    tag: "Bulmaca",
    storageKey: "sudoku_best_time",
    scoreLabel: "En İyi Süre",
    isScore: false,
  },
  {
    id: "minesweeper",
    name: "Mayın Tarlası",
    path: "/play/minesweeper",
    image: minesweepImg,
    description: "Klasik Mayın Bulma",
    tag: "Klasik",
    storageKey: "minesweeper_best_time",
    scoreLabel: "En İyi Süre",
    isScore: false,
  },
  {
    id: "blockbloom",
    name: "Block Bloom",
    path: "/play/blockbloom",
    image: blockblastImg,
    description: "Blok Yerleştirme Bulmacası",
    tag: "Bulmaca",
    storageKey: "blockbloom_best_score",
    scoreLabel: "En İyi Skor",
    isScore: true,
  },
  {
    id: "mahjong",
    name: "Mahjong",
    path: "/play/mahjong",
    image: mahjongImg,
    description: "Taş Eşleştirme",
    tag: "Klasik",
    storageKey: "mahjong_best_score",
    scoreLabel: "En İyi Skor",
    isScore: true,
  },
];

export function findGame(id: string | undefined): GameDef | undefined {
  return GAMES.find((g) => g.id === id);
}

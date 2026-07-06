import { lazy, type ComponentType, type LazyExoticComponent } from "react";
import sudokuImg from "../assets/images/sudoku.webp";
import minesweepImg from "../assets/images/minesweeper.webp";
import blockblastImg from "../assets/images/blockblast.webp";
import mahjongImg from "../assets/images/mahjong.webp";
import game2048Img from "../assets/images/2048.webp";
import kelimezinciriImg from "../assets/images/kelimezinciri.webp";

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
  Component: LazyExoticComponent<ComponentType>;
}

// tum oyunlarin tek kaynagi - GameCarousel ve PlayGamePage buradan okur
export const GAMES: GameDef[] = [
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
    Component: lazy(() => import("../games/Game2048/Game2048")),
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
    Component: lazy(() => import("../games/KelimeZinciri/KelimeZinciri")),
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
    Component: lazy(() => import("../games/Sudoku/Sudoku")),
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
    Component: lazy(() => import("../games/Minesweeper/Minesweeper")),
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
    Component: lazy(() => import("../games/BlockBloomPuzzle/BlockBloomPuzzle")),
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
    Component: lazy(() => import("../games/MahjongSanctuary/MahjongSanctuary")),
  },
];

export function findGame(id: string | undefined): GameDef | undefined {
  return GAMES.find((g) => g.id === id);
}

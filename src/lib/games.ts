import bambooHopImg from "../assets/images/bamboo-hop.jpg";
import rotaImg from "../assets/images/rota.jpg";
import prizmaImg from "../assets/images/prizma.jpg";
import dengeImg from "../assets/images/denge.jpg";
import sudokuImg from "../assets/images/sudoku.webp";
import minesweepImg from "../assets/images/minesweeper.webp";
import blockblastImg from "../assets/images/blockblast.webp";
import mahjongImg from "../assets/images/mahjong.webp";
import game2048Img from "../assets/images/2048.jpg";
import eggHopImg from "../assets/images/egg-hop.jpg";
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
    id: "2048",
    name: "2048",
    path: "/play/2048",
    image: game2048Img,
    description: "Sayıları Birleştir",
    tag: "Strateji",
    storageKey: "puzzle-suite.v1.2048",
    scoreLabel: "En İyi Skor",
    isScore: true,
    showScore: true,
  },
  {
    id: "egg-hop",
    name: "Egg Hop",
    path: "/play/egg-hop",
    image: eggHopImg,
    description: "Yumurtayı Zıplat & Puan Topla",
    tag: "Arcade",
    storageKey: "egg-hop-v1",
    scoreLabel: "En İyi Skor",
    isScore: true,
    showScore: true,
  },
  {
    id: "bamboo-hop",
    name: "Bamboo Hop",
    path: "/play/bamboo-hop",
    image: bambooHopImg,
    description: "3D Panda Orman Macerası",
    tag: "Macera",
    storageKey: "bamboo-hop",
    scoreLabel: "En İyi Skor",
    isScore: true,
    showScore: true,
  },
  {
    id: "rota",
    name: "Rota",
    path: "/play/rota",
    image: rotaImg,
    description: "Nokta ve Çizgi Bulmacası",
    tag: "Bulmaca",
    storageKey: "puzzle-suite.v1.katman.connect",
    scoreLabel: "İlerleme",
    isScore: false,
    showScore: true,
  },
  {
    id: "prizma",
    name: "Prizma",
    path: "/play/prizma",
    image: prizmaImg,
    description: "Işık ve Enerji Bulmacası",
    tag: "Bulmaca",
    storageKey: "puzzle-suite.v1.prizma",
    scoreLabel: "İlerleme",
    isScore: false,
    showScore: true,
  },
  {
    id: "denge",
    name: "Denge",
    path: "/play/denge",
    image: dengeImg,
    description: "Sayı ve Mantık Bulmacası",
    tag: "Mantık",
    storageKey: "puzzle-suite.v1.denge",
    scoreLabel: "İlerleme",
    isScore: false,
    showScore: true,
  },
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
    showScore: true,
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
    showScore: true,
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
    showScore: true,
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
    showScore: true,
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
    showScore: true,
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
    showScore: true,
  },
];

export function findGame(id: string | undefined): GameDef | undefined {
  return GAMES.find((g) => g.id === id);
}

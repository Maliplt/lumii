import bambooHopImg from "../assets/images/games/bamboo-hop.svg";
import prizmaImg from "../assets/images/games/prizma.svg";
import dengeImg from "../assets/images/games/denge.svg";
import sudokuImg from "../assets/images/games/sudoku.svg";
import minesweepImg from "../assets/images/minesweeper.webp";
import blockblastImg from "../assets/images/blockblast.webp";
import mahjongImg from "../assets/images/mahjong.webp";
import game2048Img from "../assets/images/games/2048.svg";
import eggHopImg from "../assets/images/games/egg-hop.svg";
import satrancImg from "../assets/images/games/satranc.svg";
import renkRenkImg from "../assets/images/games/renk-renk.svg";
import siyrilImg from "../assets/images/games/ok-cikmazi.svg";
import kelimezinciriImg from "../assets/images/kelimezinciri.webp";
import doomImg from "../assets/images/doom.svg";
import fuzyonImg from "../assets/images/games/fuzyon.svg";
import katmanImg from "../assets/images/games/katman.svg";
import onlukImg from "../assets/images/games/onluk.svg";
import zarIziImg from "../assets/images/games/zar-izi.svg";
import orguImg from "../assets/images/games/orgu.svg";
import wellbloomImg from "../assets/images/games/wellbloom.svg";
import blockhavenImg from "../assets/images/games/blockhaven.svg";
import mines98Img from "../assets/images/games/mines98.svg";
import knotwiseImg from "../assets/images/games/knotwise.svg";
import purrfitImg from "../assets/images/games/purrfit.svg";
import yirmibirHaniImg from "../assets/images/games/yirmibir-hani.svg";

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
    id: "satranc",
    name: "Satranç",
    path: "/play/satranc",
    image: satrancImg,
    description: "Zeka ve Taktik Düellosu",
    tag: "Strateji",
    storageKey: "satranc.v1",
    scoreLabel: "İlerleme",
    isScore: false,
    showScore: true,
  },
  {
    id: "renk-renk",
    name: "Renk Renk",
    path: "/play/renk-renk",
    image: renkRenkImg,
    description: "Tüpleri Renklerine Göre Ayır",
    tag: "Bulmaca",
    storageKey: "renk-renk.v1",
    scoreLabel: "İlerleme",
    isScore: false,
    showScore: true,
  },
  {
    id: "ok-cikmazi",
    name: "Ok Çıkmazı",
    path: "/play/ok-cikmazi",
    image: siyrilImg,
    description: "Önü Açık Olan Oku Çıkar",
    tag: "Bulmaca",
    storageKey: "siyril.v1",
    scoreLabel: "İlerleme",
    isScore: false,
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
    id: "katman",
    name: "Katman",
    path: "/play/katman",
    image: katmanImg,
    description: "Renklerin Yolu Nokta Bulmacası",
    tag: "Bulmaca",
    storageKey: "puzzle-suite.v1.katman.connect",
    scoreLabel: "İlerleme",
    isScore: false,
    showScore: true,
  },
  {
    id: "fuzyon",
    name: "Füzyon",
    path: "/play/fuzyon",
    image: fuzyonImg,
    description: "Sayı Reaktörü & Birleştirme",
    tag: "Bulmaca",
    storageKey: "puzzle-suite.v1.fuzyon.reactor",
    scoreLabel: "En İyi Skor",
    isScore: true,
    showScore: true,
  },
  {
    id: "onluk",
    name: "Onluk",
    path: "/play/onluk",
    image: onlukImg,
    description: "Toplamı 10 Yap & Zincir Kur",
    tag: "Bulmaca",
    storageKey: "puzzle-suite.v1.onluk.arcade",
    scoreLabel: "En İyi Skor",
    isScore: true,
    showScore: true,
  },
  {
    id: "orgu",
    name: "Örgü",
    path: "/play/orgu",
    image: orguImg,
    description: "Kesişen Eşitlikler Bulmacası",
    tag: "Mantık",
    storageKey: "puzzle-suite.v1.orgu.weave",
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
    id: "zar-izi",
    name: "Zar İzi",
    path: "/play/zar-izi",
    image: zarIziImg,
    description: "Renkleri Birleştir, Sayıların İzini Sür",
    tag: "Bulmaca",
    storageKey: "puzzle-suite.v1.zar-izi.chains",
    scoreLabel: "İlerleme",
    isScore: false,
    showScore: true,
  },
  {
    id: "wellbloom",
    name: "Wellbloom",
    path: "/play/wellbloom",
    image: wellbloomImg,
    description: "Kanalları Çevir, Bahçeyi Sula",
    tag: "Bulmaca",
    storageKey: "wellbloom.save",
    scoreLabel: "İlerleme",
    isScore: false,
    showScore: true,
  },
  {
    id: "blockhaven",
    name: "Blockhaven",
    path: "/play/blockhaven",
    image: blockhavenImg,
    description: "Blokları Yerleştir, Satırları Patlat",
    tag: "Bulmaca",
    storageKey: "blockhaven.v1.progress",
    scoreLabel: "İlerleme",
    isScore: false,
    showScore: true,
  },
  {
    id: "knotwise",
    name: "Knotwise",
    path: "/play/knotwise",
    image: knotwiseImg,
    description: "İpleri Çöz, Resmi Ortaya Çıkar",
    tag: "Bulmaca",
    storageKey: "knotwise.v1.progress",
    scoreLabel: "İlerleme",
    isScore: false,
    showScore: true,
  },
  {
    id: "purrfit",
    name: "Purrfit",
    path: "/play/purrfit",
    image: purrfitImg,
    description: "Her Kediye Tam Boy Kutu",
    tag: "Bulmaca",
    storageKey: "purrfit.v1.progress",
    scoreLabel: "İlerleme",
    isScore: false,
    showScore: true,
  },
  {
    id: "yirmibir-hani",
    name: "Yirmibir Hanı",
    path: "/play/yirmibir-hani",
    image: yirmibirHaniImg,
    description: "Kartları Diz, 21'i Tuttur",
    tag: "Kart",
    storageKey: "yirmibir-hani.v1.progress",
    scoreLabel: "İlerleme",
    isScore: false,
    showScore: true,
  },
  {
    id: "mines98",
    name: "Mines98",
    path: "/play/mines98",
    image: mines98Img,
    description: "Tahminsiz Klasik Mayın Bulmacası",
    tag: "Klasik",
    storageKey: "mines98.v1.progress",
    scoreLabel: "En İyi Süre",
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
    storageKey: "sudoku.v1",
    scoreLabel: "İlerleme",
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
  // Keep previously shared URLs working after the folder/name correction.
  return GAMES.find((g) => g.id === (id === "siyril" ? "ok-cikmazi" : id));
}

import { Link } from "react-router-dom";
import { RiGamepadLine } from "react-icons/ri";

import sudokuImg from "../assets/images/sudoku.webp";
import minesweepImg from "../assets/images/minesweeper.webp";
import blockblastImg from "../assets/images/blockblast.webp";
import mahjongImg from "../assets/images/mahjong.webp";
import game2048Img from "../assets/images/2048.webp";
import kelimezinciriImg from "../assets/images/kelimezinciri.webp";

interface GameDef {
  id: string;
  name: string;
  path: string;
  image: string;
  description: string;
  tag: string;
}

const GAMES: GameDef[] = [
  {
    id: "2048",
    name: "2048",
    path: "/play/2048",
    image: game2048Img,
    description: "Sayıları Birleştir",
    tag: "Strateji",
  },
  {
    id: "kelimezinciri",
    name: "Kelime Zinciri",
    path: "/play/kelimezinciri",
    image: kelimezinciriImg,
    description: "Zeka ve Hafıza Oyunu",
    tag: "Dil",
  },
  {
    id: "sudoku",
    name: "Sudoku",
    path: "/play/sudoku",
    image: sudokuImg,
    description: "Zeka ve Mantık Oyunu",
    tag: "Bulmaca",
  },
  {
    id: "minesweeper",
    name: "Mayın Tarlası",
    path: "/play/minesweeper",
    image: minesweepImg,
    description: "Klasik Mayın Bulma",
    tag: "Klasik",
  },
  {
    id: "blockbloom",
    name: "Block Bloom",
    path: "/play/blockbloom",
    image: blockblastImg,
    description: "Blok Yerleştirme Bulmacası",
    tag: "Bulmaca",
  },
  {
    id: "mahjong",
    name: "Mahjong",
    path: "/play/mahjong",
    image: mahjongImg,
    description: "Taş Eşleştirme",
    tag: "Klasik",
  },
];

export default function GameCarousel() {
  return (
    <div className="game-carousel">
      <div className="gc-header">
        <div className="gc-header__left">
          <RiGamepadLine className="gc-header__icon" size={20} />
          <h3>TENET Oyunlar</h3>
        </div>
      </div>

      <div className="gc-wrapper">
        <div className="gc-track">
          {GAMES.map((game) => (
            <div key={game.id} className="gc-item">
              <Link
                className="gc-card__link"
                to={game.path}
                aria-label={`${game.name} oyununu aç`}
              >
                <div className="gc-card">
                  <img
                    src={game.image}
                    alt={game.name}
                    className="gc-card__image"
                    loading="lazy"
                  />
                  <div className="gc-card__overlay">
                    <div className="gc-card__details">
                      <span className="gc-card__tag">{game.tag}</span>
                      <h4 className="gc-card__name">{game.name}</h4>
                      <p className="gc-card__desc">{game.description}</p>
                      <span className="gc-card__badge">OYNA</span>
                    </div>
                  </div>
                </div>
              </Link>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

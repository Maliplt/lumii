import { Link } from "react-router-dom";
import { RiGamepadLine } from "react-icons/ri";

// güncellenmiş görseller
import sudokuImg from "../images/sudoku.svg";
import minesweepImg from "../images/minesweepr.svg";
import blockblastImg from "../images/blockblast.svg";
import mahjongImg from "../images/mahjong.svg";

// boşluk içeren dosya adları için raw URL
const game2048Img = new URL("../images/2048 (1).svg", import.meta.url).href;
const kelimezinciriImg = new URL("../images/kelimezinciri (1).svg", import.meta.url).href;

interface GameDef {
  id: string;
  name: string;
  path: string;
  image: string;
  description: string;
  tag: string;
  soon?: boolean;
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
    soon: true,
  },
  {
    id: "mahjong",
    name: "Mahjong Sanctuary",
    path: "/play/mahjong",
    image: mahjongImg,
    description: "Geleneksel Taş Eşleştirme",
    tag: "Klasik",
    soon: true,
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
          {GAMES.map((game) => {
            const card = (
              <div className={`gc-card${game.soon ? " gc-card--soon" : ""}`}>
                <img
                  src={game.image}
                  alt={game.name}
                  className="gc-card__image"
                  loading="lazy"
                />
                {game.soon && (
                  <span className="gc-card__tag">Yakında</span>
                )}
                {!game.soon && (
                  <div className="gc-card__overlay">
                    <div className="gc-card__details">
                      <span className="gc-card__tag">{game.tag}</span>
                      <h4 className="gc-card__name">{game.name}</h4>
                      <p className="gc-card__desc">{game.description}</p>
                      <span className="gc-card__badge">OYNA</span>
                    </div>
                  </div>
                )}
              </div>
            );

            return (
              <div key={game.id} className="gc-item">
                {game.soon ? (
                  card
                ) : (
                  <Link to={game.path}>{card}</Link>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

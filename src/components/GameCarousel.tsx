import { useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import { animate, stagger } from "animejs";
import { RiGamepadLine } from "react-icons/ri";
import { prefersReducedMotion } from "../helpers";
import sudokuImg from "../images/sudoku.svg";
import minesweepImg from "../images/minesweep.svg";
import game2048Img from "../images/2048.svg";
import kelimezinciriImg from "../images/kelimezinciri.svg";

const GAMES = [
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
];

export default function GameCarousel() {
  const trackRef = useRef<HTMLDivElement>(null);

  // kartlar acilista sirayla canlanir (transform-only)
  useEffect(() => {
    if (prefersReducedMotion()) return;
    const items = trackRef.current?.querySelectorAll(".gc-item");
    if (items && items.length)
      animate(items, {
        translateY: [26, 0],
        scale: [0.94, 1],
        duration: 520,
        delay: stagger(70),
        ease: "out(3)",
      });
  }, []);

  return (
    <div className="game-carousel">
      <div className="gc-header">
        <div className="gc-header__left">
          {/* baslik */}
          <RiGamepadLine className="gc-header__icon" size={20} />
          <h3>Lumii Oyunlar</h3>
        </div>
      </div>

      <div className="gc-wrapper">
        <div className="gc-track" ref={trackRef}>
          {GAMES.map((game) => (
            <div key={game.id} className="gc-item">
              <Link to={game.path}>
                <div className="gc-card">
                  <img
                    src={game.image}
                    alt={game.name}
                    className="gc-card__image"
                    loading="lazy"
                  />
                  <div className="gc-card__overlay">
                    <div className="gc-card__details">
                      {/* etiket */}
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

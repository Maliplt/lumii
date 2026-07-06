import { Link } from "react-router-dom";
import { Gamepad2 } from "lucide-react";
import { GAMES, type GameDef } from "../lib/games";

interface GameCarouselProps {
  games?: GameDef[];
  title?: string;
}

export default function GameCarousel({
  games = GAMES,
  title = "TENET Oyunlar",
}: GameCarouselProps) {
  return (
    <div className="game-carousel">
      <div className="gc-header">
        <div className="gc-header__left">
          <Gamepad2 className="gc-header__icon" size={20} />
          <h3>{title}</h3>
        </div>
      </div>

      <div className="gc-wrapper">
        <div className="gc-track">
          {games.map((game) => (
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

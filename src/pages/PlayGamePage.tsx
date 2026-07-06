import { useEffect, useState, Suspense } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "rsuite";
import { MotionIcon } from "motion-icons-react";
import Spinner from "../components/Spinner";
import { findGame } from "../lib/games";

function readBestScore(gameId: string): string {
  const game = findGame(gameId);
  if (!game) return "";
  const raw = localStorage.getItem(game.storageKey);
  if (!raw) return "Henüz skor yok";
  const val = parseInt(raw, 10);
  return game.isScore ? `${val.toLocaleString("tr-TR")} puan` : `${raw} saniye`;
}

export default function PlayGamePage() {
  const { gameId } = useParams<{ gameId: string }>();
  const navigate = useNavigate();
  const [bestScore, setBestScore] = useState(() => readBestScore(gameId ?? ""));

  useEffect(() => {
    const update = () => setBestScore(readBestScore(gameId ?? ""));
    const interval = setInterval(update, 2000);
    window.addEventListener("storage", update);
    return () => {
      clearInterval(interval);
      window.removeEventListener("storage", update);
    };
  }, [gameId]);

  const game = findGame(gameId);

  return (
    <div className="play-game-page">
      <header className="pg-header">
        <Button className="pg-back-btn" onClick={() => navigate("/")}>
          <MotionIcon
            name="ArrowLeft"
            size={18}
            trigger="hover"
            animation="nudge"
            className="pg-back-icon"
          />
          Geri Dön
        </Button>
        <div className="pg-score-card">
          <MotionIcon
            name="Trophy"
            size={18}
            trigger="hover"
            animation="pop"
            className="pg-score-icon"
          />
          <span>
            {game?.scoreLabel ?? "En İyi Skor"}: <strong>{bestScore}</strong>
          </span>
        </div>
      </header>
      <main className="pg-main-content">
        <Suspense fallback={<Spinner inline />}>
          {game ? <game.Component /> : <div className="pg-error">Oyun bulunamadı.</div>}
        </Suspense>
      </main>
    </div>
  );
}

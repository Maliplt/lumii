import { useEffect, useState, lazy, Suspense } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "rsuite";
import { MotionIcon } from "motion-icons-react";
import Spinner from "../components/Spinner";

const SudokuApp = lazy(() => import("../games/Sudoku"));
const MinesweeperApp = lazy(() => import("../games/Minesweeper"));
const Game2048 = lazy(() => import("../games/Game2048"));
const KelimeZinciri = lazy(() => import("../games/KelimeZinciri"));

const SCORE_KEYS: Record<string, string> = {
  sudoku: "sudoku_best_time",
  minesweeper: "minesweeper_best_time",
  "2048": "game2048_best_score",
  kelimezinciri: "kelimezinciri_best",
};

const SCORE_LABELS: Record<string, string> = {
  sudoku: "En İyi Süre",
  minesweeper: "En İyi Süre",
  "2048": "En İyi Skor",
  kelimezinciri: "En İyi Skor",
};

const SCORE_GAMES = new Set(["2048", "kelimezinciri"]);

function readBestScore(gameId: string): string {
  const key = SCORE_KEYS[gameId];
  if (!key) return "";
  const raw = localStorage.getItem(key);
  if (!raw) return "Henüz skor yok";
  const val = parseInt(raw, 10);
  return SCORE_GAMES.has(gameId)
    ? `${val.toLocaleString("tr-TR")} puan`
    : `${raw} saniye`;
}

export default function PlayGamePage() {
  const { gameId } = useParams<{ gameId: string }>();
  const navigate = useNavigate();
  const [bestScore, setBestScore] = useState(() => readBestScore(gameId ?? ""));

  // skoru yenile
  useEffect(() => {
    const update = () => setBestScore(readBestScore(gameId ?? ""));
    const interval = setInterval(update, 2000);
    window.addEventListener("storage", update);
    return () => {
      clearInterval(interval);
      window.removeEventListener("storage", update);
    };
  }, [gameId]);

  const scoreLabel = SCORE_LABELS[gameId ?? ""] ?? "En İyi Skor";

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
            {scoreLabel}: <strong>{bestScore}</strong>
          </span>
        </div>
      </header>
      <main className="pg-main-content">
        <Suspense fallback={<Spinner inline />}>
          {gameId === "sudoku" ? (
            <SudokuApp />
          ) : gameId === "minesweeper" ? (
            <MinesweeperApp />
          ) : gameId === "2048" ? (
            <Game2048 />
          ) : gameId === "kelimezinciri" ? (
            <KelimeZinciri />
          ) : (
            <div className="pg-error">Oyun bulunamadı.</div>
          )}
        </Suspense>
      </main>
    </div>
  );
}

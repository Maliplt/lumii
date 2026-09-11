import { useEffect, useState, Suspense } from "react";
import { Navigate, useParams, useNavigate } from "react-router-dom";
import { Button } from "rsuite";
import { MotionIcon } from "../components/ui/MotionIcon";
import Spinner from "../components/ui/Spinner";
import { hasGameComponent, LoadedGame } from "../lib/gameLoaders";
import { findGame } from "../lib/games";
import { useTitle } from "../helpers";

function parseJsonSafe(val: string | null) {
  if (!val) return null;
  try {
    return JSON.parse(val);
  } catch {
    return null;
  }
}

function getSuiteProgress(gameId: string) {
  const suiteKey = `game-suite.v1:${gameId}:guest:main`;
  const suiteRaw = localStorage.getItem(suiteKey);
  const suiteObj = parseJsonSafe(suiteRaw);
  if (suiteObj?.data?.progress) {
    return parseJsonSafe(suiteObj.data.progress) ?? suiteObj.data.progress;
  }
  return null;
}

function readBestScore(gameId: string): string {
  const game = findGame(gameId);
  if (!game) return "";

  if (gameId === "egg-hop") {
    const suite = getSuiteProgress("egg-hop");
    if (suite && typeof suite.best === "number") {
      return `${suite.best.toLocaleString("tr-TR")} puan`;
    }
    const direct = parseJsonSafe(localStorage.getItem("egg-hop-v1"));
    if (direct && typeof direct.best === "number") {
      return `${direct.best.toLocaleString("tr-TR")} puan`;
    }
    return "0 puan";
  }

  if (gameId === "2048") {
    const suite = getSuiteProgress("2048");
    if (suite && typeof suite.best === "number") {
      return `${suite.best.toLocaleString("tr-TR")} puan`;
    }
    const direct = parseJsonSafe(localStorage.getItem("puzzle-suite.v1.2048"));
    if (direct && typeof direct.best === "number") {
      return `${direct.best.toLocaleString("tr-TR")} puan`;
    }
    const legacy = localStorage.getItem("game2048_best_score");
    if (legacy) {
      const num = parseInt(legacy, 10);
      if (!isNaN(num)) return `${num.toLocaleString("tr-TR")} puan`;
    }
    return "0 puan";
  }

  if (gameId === "bamboo-hop") {
    const suite = getSuiteProgress("bamboo-hop");
    const best = suite?.progress?.best ?? suite?.best;
    if (typeof best === "number") {
      return `${best.toLocaleString("tr-TR")} puan`;
    }
    const direct =
      parseJsonSafe(localStorage.getItem("bamboo-hop:guest:main")) ||
      parseJsonSafe(localStorage.getItem("bamboo-hop"));
    const directBest = direct?.progress?.best ?? direct?.best;
    if (typeof directBest === "number") {
      return `${directBest.toLocaleString("tr-TR")} puan`;
    }
    return "0 puan";
  }

  if (gameId === "rota") {
    const suite = getSuiteProgress("katman");
    const direct =
      parseJsonSafe(localStorage.getItem("puzzle-suite.v1.katman.connect")) ||
      parseJsonSafe(localStorage.getItem("puzzle-suite.v1.rota.connect"));
    const data = suite ?? direct;
    if (data) {
      const recordsCount = data.records ? Object.keys(data.records).length : 0;
      if (recordsCount > 0) return `${recordsCount} Bölüm Tamamlandı`;
      if (data.next) return `Bölüm ${data.next}`;
    }
    return "Bölüm 1";
  }

  if (gameId === "prizma") {
    const direct = parseJsonSafe(localStorage.getItem("puzzle-suite.v1.prizma"));
    if (direct?.levels && Array.isArray(direct.levels) && direct.levels.length > 0) {
      return `${direct.levels.length} Bölüm Tamamlandı`;
    }
    const legacy = localStorage.getItem("prizma_journey");
    if (legacy) {
      const num = parseInt(legacy, 10);
      if (!isNaN(num) && num > 0) return `${num} Bölüm`;
    }
    return "Bölüm 1";
  }

  if (gameId === "denge") {
    const direct = parseJsonSafe(localStorage.getItem("puzzle-suite.v1.denge"));
    if (direct?.levels && Array.isArray(direct.levels) && direct.levels.length > 0) {
      return `${direct.levels.length} Bölüm Tamamlandı`;
    }
    const legacy = localStorage.getItem("denge_journey");
    if (legacy) {
      const num = parseInt(legacy, 10);
      if (!isNaN(num) && num > 0) return `${num} Bölüm`;
    }
    return "Bölüm 1";
  }

  const raw = localStorage.getItem(game.storageKey);
  if (!raw) return game.isScore ? "0 puan" : "Henüz skor yok";
  const val = parseInt(raw, 10);
  if (isNaN(val)) return raw;
  return game.isScore ? `${val.toLocaleString("tr-TR")} puan` : `${raw} saniye`;
}

export default function PlayGamePage() {
  const { gameId } = useParams<{ gameId: string }>();
  const navigate = useNavigate();
  const [bestScore, setBestScore] = useState(() => readBestScore(gameId ?? ""));

  useEffect(() => {
    const update = () => setBestScore(readBestScore(gameId ?? ""));
    const interval = setInterval(update, 1000);
    window.addEventListener("storage", update);
    return () => {
      clearInterval(interval);
      window.removeEventListener("storage", update);
    };
  }, [gameId]);

  const game = findGame(gameId);
  useTitle(game ? `${game.name} Oyunu` : "Oyun");

  if (!game || !hasGameComponent(game.id)) return <Navigate to="/" replace />;

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
        {game.showScore !== false && (
          <div className="pg-score-card">
            <MotionIcon
              name="Trophy"
              size={18}
              trigger="hover"
              animation="pop"
              className="pg-score-icon"
            />
            <span>
              {game.scoreLabel}: <strong>{bestScore}</strong>
            </span>
          </div>
        )}
      </header>
      <main className="pg-main-content">
        <Suspense fallback={<Spinner inline />}>
          <LoadedGame gameId={game.id} />
        </Suspense>
      </main>
    </div>
  );
}

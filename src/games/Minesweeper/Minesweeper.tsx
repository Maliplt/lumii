import "./Minesweeper.scss";
import { useState, useEffect, useRef } from "react";



const CONFIGS = {
  kolay: { rows: 9, cols: 9, mines: 10 },
  orta: { rows: 16, cols: 16, mines: 40 },
  zor: { rows: 16, cols: 30, mines: 99 },
  uzman: { rows: 20, cols: 30, mines: 145 },
};

interface Cell {
  mine: boolean;
  revealed: boolean;
  flagged: boolean;
  count: number;
  justRevealed: boolean;
}

function createBoard(
  rows: number,
  cols: number,
  mines: number,
  firstR: number,
  firstC: number,
): Cell[][] {
  const forbidden = new Set<number>();
  for (let dr = -1; dr <= 1; dr++)
    for (let dc = -1; dc <= 1; dc++) {
      const nr = firstR + dr,
        nc = firstC + dc;
      if (nr >= 0 && nr < rows && nc >= 0 && nc < cols)
        forbidden.add(nr * cols + nc);
    }

  const allCells = [...Array(rows * cols).keys()].filter(
    (i) => !forbidden.has(i),
  );
  const mineSet = new Set<number>();
  while (mineSet.size < Math.min(mines, allCells.length)) {
    mineSet.add(allCells[Math.floor(Math.random() * allCells.length)]);
  }

  const board = Array.from({ length: rows }, (_, r) =>
    Array.from({ length: cols }, (_, c) => ({
      mine: mineSet.has(r * cols + c),
      revealed: false,
      flagged: false,
      count: 0,
      justRevealed: false,
    })),
  );

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (board[r][c].mine) continue;
      let cnt = 0;
      for (let dr = -1; dr <= 1; dr++)
        for (let dc = -1; dc <= 1; dc++) {
          const nr = r + dr,
            nc = c + dc;
          if (
            nr >= 0 &&
            nr < rows &&
            nc >= 0 &&
            nc < cols &&
            board[nr][nc].mine
          )
            cnt++;
        }
      board[r][c].count = cnt;
    }
  }
  return board;
}

function floodReveal(
  board: Cell[][],
  r: number,
  c: number,
  rows: number,
  cols: number,
  toReveal: [number, number][] = [],
): [number, number][] {
  if (r < 0 || r >= rows || c < 0 || c >= cols) return toReveal;
  const cell = board[r][c];
  if (cell.revealed || cell.flagged || cell.mine) return toReveal;
  toReveal.push([r, c]);
  cell.revealed = true;
  if (cell.count === 0) {
    for (let dr = -1; dr <= 1; dr++)
      for (let dc = -1; dc <= 1; dc++)
        if (dr !== 0 || dc !== 0)
          floodReveal(board, r + dr, c + dc, rows, cols, toReveal);
  }
  return toReveal;
}

function useTimer() {
  const [time, setTime] = useState<number>(0);
  const [running, setRunning] = useState<boolean>(false);
  const ref = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (running) {
      ref.current = setInterval(() => setTime((t) => t + 1), 1000);
    } else if (ref.current) {
      clearInterval(ref.current);
    }
    return () => {
      if (ref.current) clearInterval(ref.current);
    };
  }, [running]);

  return {
    time,
    fmt: (t: number) => String(Math.min(t, 999)).padStart(3, "0"),
    start: () => setRunning(true),
    stop: () => setRunning(false),
    reset: () => {
      setRunning(false);
      setTime(0);
    },
  };
}

const DoodleBg = () => (
  <div className="doodle-bg">
    {[
      { top: "5%", left: "3%", w: 80, h: 80, bg: "#ff6b6b" },
      { top: "15%", left: "88%", w: 60, h: 60, bg: "#ffa502" },
      { top: "40%", left: "92%", w: 100, h: 100, bg: "#2ed573" },
      { top: "65%", left: "2%", w: 70, h: 70, bg: "#5352ed" },
      { top: "80%", left: "85%", w: 90, h: 90, bg: "#ff4757" },
      { top: "50%", left: "5%", w: 50, h: 50, bg: "#1e90ff" },
      { top: "30%", left: "10%", w: 40, h: 40, bg: "#ffd32a" },
      { top: "70%", left: "90%", w: 55, h: 55, bg: "#ff6348" },
      { top: "90%", left: "30%", w: 65, h: 65, bg: "#7bed9f" },
    ].map((s, i) => (
      <div
        key={i}
        className="doodle-shape"
        style={{
          top: s.top,
          left: s.left,
          width: s.w,
          height: s.h,
          background: s.bg,
          borderRadius:
            i % 3 === 0
              ? "30% 70% 70% 30% / 30% 30% 70% 70%"
              : i % 3 === 1
                ? "50%"
                : "20% 80% 30% 70% / 50% 60% 40% 50%",
        }}
      />
    ))}
  </div>
);

export default function MinesweeperApp() {
  const [difficulty, setDifficulty] = useState<string>("kolay");
  const [board, setBoard] = useState<Cell[][] | null>(null);
  const [status, setStatus] = useState<string>("idle");
  const [flagMode, setFlagMode] = useState<boolean>(false);
  const [flagCount, setFlagCount] = useState<number>(0);
  const [revealedCount, setRevealedCount] = useState<number>(0);
  const [justRevealedCells, setJustRevealedCells] = useState<Set<string>>(
    new Set(),
  );
  const { time, fmt, start, stop, reset } = useTimer();

  const cfg = CONFIGS[difficulty as keyof typeof CONFIGS];

  // tahtayi sifirla
  const newGame = () => {
    setBoard(null);
    setStatus("idle");
    setFlagCount(0);
    setRevealedCount(0);
    setJustRevealedCells(new Set());
    reset();
  };

  const handleClick = (r: number, c: number) => {
    if (status === "win" || status === "lose") return;

    if (!board) {
      const newBoard = createBoard(cfg.rows, cfg.cols, cfg.mines, r, c);
      const boardCopy = newBoard.map((row) => row.map((cell) => ({ ...cell })));
      const revealed = floodReveal(boardCopy, r, c, cfg.rows, cfg.cols);
      const revSet = new Set(revealed.map(([rr, cc]) => `${rr}-${cc}`));
      setJustRevealedCells(revSet);
      setTimeout(() => setJustRevealedCells(new Set()), 500);
      setBoard(boardCopy);
      setRevealedCount(revealed.length);
      setStatus("playing");
      start();
      return;
    }

    const cell = board[r][c];
    if (cell.revealed || cell.flagged) return;

    if (flagMode) {
      const newBoard = board.map((row) => row.map((cell) => ({ ...cell })));
      newBoard[r][c].flagged = !newBoard[r][c].flagged;
      setFlagCount((fc) => (newBoard[r][c].flagged ? fc + 1 : fc - 1));
      setBoard(newBoard);
      return;
    }

    if (cell.mine) {
      const newBoard = board.map((row) => row.map((cell) => ({ ...cell })));
      newBoard[r][c].revealed = true;
      setBoard(newBoard);
      setStatus("lose");
      stop();
      return;
    }

    const newBoard = board.map((row) => row.map((cell) => ({ ...cell })));
    const revealed = floodReveal(newBoard, r, c, cfg.rows, cfg.cols);
    const revSet = new Set(revealed.map(([rr, cc]) => `${rr}-${cc}`));
    setJustRevealedCells(revSet);
    setTimeout(() => setJustRevealedCells(new Set()), 400);

    const newRevCount = revealedCount + revealed.length;
    setRevealedCount(newRevCount);
    setBoard(newBoard);

    if (newRevCount >= totalSafe) {
      setStatus("win");
      stop();
      const best = localStorage.getItem("minesweeper_best_time");
      if (!best || time < Number(best)) {
        localStorage.setItem("minesweeper_best_time", String(time));
      }
    }
  };

  const handleRightClick = (e: React.MouseEvent, r: number, c: number) => {
    e.preventDefault();
    if (!board || status === "win" || status === "lose") return;
    const cell = board[r][c];
    if (cell.revealed) return;
    const newBoard = board.map((row) => row.map((cell) => ({ ...cell })));
    newBoard[r][c].flagged = !newBoard[r][c].flagged;
    setFlagCount((fc) => (newBoard[r][c].flagged ? fc + 1 : fc - 1));
    setBoard(newBoard);
  };

  const renderCell = (cell: Cell, r: number, c: number) => {
    const key = `${r}-${c}`;
    let cls = "ms-cell";
    let content = null;

    if (!cell.revealed) {
      if (cell.flagged) {
        cls += " flagged";
        content = "🚩";
      } else {
        cls += " hidden";
        if (status === "lose" && cell.mine) {
          cls = "ms-cell mine-revealed";
          content = "💣";
        }
      }
    } else {
      if (cell.mine) {
        cls += " mine-hit";
        content = "💥";
      } else if (cell.count === 0) {
        cls += " revealed empty";
      } else {
        cls += ` revealed n${cell.count}`;
        content = cell.count;
      }
      if (justRevealedCells.has(key)) cls += " just-revealed";
    }

    if (status === "win" && !cell.revealed && cell.mine) {
      cls = "ms-cell mine-safe";
      content = "🎯";
    }

    return (
      <div
        key={key}
        className={cls}
        onClick={() => handleClick(r, c)}
        onContextMenu={(e) => handleRightClick(e, r, c)}
      >
        {content}
      </div>
    );
  };

  const remainingMines = cfg.mines - flagCount;
  const totalSafe = cfg.rows * cfg.cols - cfg.mines;
  const progress = board ? Math.round((revealedCount / totalSafe) * 100) : 0;

  return (
    <>
      <div className="ms-app">
        <DoodleBg />
        <div className="ms-content">
          <div className="ms-title-row">
            <span className="bomb-icon">💣</span>
            <div className="ms-title">Mayın Tarlası</div>
            <span className="bomb-icon" style={{ animationDelay: "1.5s" }}>
              💣
            </span>
          </div>
          <div className="ms-subtitle">Dikkatli ol, patlayabilir!</div>

          <div className="diff-row">
            {["kolay", "orta", "zor", "uzman"].map((d) => (
              <button
                key={d}
                className={`ms-diff-btn${difficulty === d ? ` active-${d}` : ""}`}
                onClick={() => {
                  setDifficulty(d);
                  newGame();
                }}
              >
                {d === "kolay"
                  ? "😊 Kolay"
                  : d === "orta"
                    ? "🤔 Orta"
                    : d === "zor"
                      ? "😰 Zor"
                      : "💀 Uzman"}
              </button>
            ))}
          </div>

          <div className="stats-bar">
            <div className="stat-pill mines">
              <span className="stat-icon">💣</span>
              {remainingMines}
            </div>
            <div className="stat-pill timer">
              <span className="stat-icon">⏱</span>
              {fmt(time)}s
            </div>
            <div className="stat-pill flags">
              <span className="stat-icon">🚩</span>
              {flagCount} bayrak
            </div>
            {board && (
              <div
                className="stat-pill"
                style={{ borderColor: "#c0e0c0", color: "#4a9a4a" }}
              >
                <span className="stat-icon">📊</span>
                {progress}%
              </div>
            )}
          </div>

          <div className="board-container">
            {board ? (
              <div
                className="ms-board"
                style={{ gridTemplateColumns: `repeat(${cfg.cols}, 36px)` }}
              >
                {board.map((row, r) =>
                  row.map((cell, c) => renderCell(cell, r, c)),
                )}
              </div>
            ) : (
              <div
                className="ms-board"
                style={{ gridTemplateColumns: `repeat(${cfg.cols}, 36px)` }}
              >
                {Array.from({ length: cfg.rows }, (_, r) =>
                  Array.from({ length: cfg.cols }, (_, c) => (
                    <div
                      key={`${r}-${c}`}
                      className="ms-cell hidden"
                      onClick={() => handleClick(r, c)}
                    />
                  )),
                )}
              </div>
            )}
          </div>

          <div className="action-row">
            <button
              className={`ms-btn ms-btn-flag${flagMode ? " active" : ""}`}
              onClick={() => setFlagMode((m) => !m)}
            >
              🚩 {flagMode ? "Bayrak Modu Açık" : "Bayrak Koy"}
            </button>
            <button className="ms-btn ms-btn-new" onClick={newGame}>
              🔄 Yeni Oyun
            </button>
          </div>

          <div
            style={{
              marginTop: 10,
              fontSize: 12,
              color: "#ccc",
              fontFamily: "Nunito, sans-serif",
              fontWeight: 600,
              textAlign: "center",
            }}
          >
            Sağ tık = bayrak • Masaüstü | Bayrak modu = mobil
          </div>
        </div>

        {(status === "win" || status === "lose") && (
          <div
            className={`overlay overlay-bg-${status === "win" ? "win" : "lose"}`}
          >
            <div className={`result-card ${status}`}>
              <span className="result-emoji">
                {status === "win" ? "🎉" : "💥"}
              </span>
              <div className="result-title">
                {status === "win" ? "Kazandın!" : "Boom!"}
              </div>
              <div className="result-sub">
                {status === "win"
                  ? "Tüm mayınları buldun!"
                  : "Mayına bastın..."}
              </div>
              <div className="result-stats">
                <div className="result-stat">
                  <div className="result-stat-val">{fmt(time)}s</div>
                  <div className="result-stat-label">Süre</div>
                </div>
                {status === "win" && (
                  <div className="result-stat">
                    <div className="result-stat-val">{flagCount}</div>
                    <div className="result-stat-label">Bayrak</div>
                  </div>
                )}
                <div className="result-stat">
                  <div className="result-stat-val">{cfg.mines}</div>
                  <div className="result-stat-label">Mayın</div>
                </div>
              </div>
              <button
                className={`result-btn ${status === "win" ? "win-btn" : "lose-btn"}`}
                onClick={newGame}
              >
                Tekrar Oyna
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

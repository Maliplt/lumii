import "./Sudoku.scss";
import { useState, useEffect, useCallback } from "react";



interface SudokuCell {
  value: number;
  given: boolean;
  error: boolean;
  hint: boolean;
}

interface SudokuGame {
  solution: number[][];
}

function isValid(
  board: number[][],
  row: number,
  col: number,
  num: number,
): boolean {
  for (let i = 0; i < 9; i++) {
    if (board[row][i] === num) return false;
    if (board[i][col] === num) return false;
  }
  const br = Math.floor(row / 3) * 3,
    bc = Math.floor(col / 3) * 3;
  for (let i = 0; i < 3; i++)
    for (let j = 0; j < 3; j++) if (board[br + i][bc + j] === num) return false;
  return true;
}

function fillGrid(grid: number[][]): boolean {
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      if (grid[r][c] === 0) {
        const nums = [1, 2, 3, 4, 5, 6, 7, 8, 9];
        for (let i = 0; i < 9; i++) {
          const j = Math.floor(Math.random() * 9);
          const temp = nums[i];
          nums[i] = nums[j];
          nums[j] = temp;
        }
        for (const n of nums) {
          if (isValid(grid, r, c, n)) {
            grid[r][c] = n;
            if (fillGrid(grid)) return true;
            grid[r][c] = 0;
          }
        }
        return false;
      }
    }
  }
  return true;
}

function hasUniqueSolution(grid: number[][]): boolean {
  const board = grid.map((r) => [...r]);
  let count = 0;

  function solve(): boolean {
    for (let i = 0; i < 9; i++) {
      for (let j = 0; j < 9; j++) {
        if (board[i][j] === 0) {
          for (let n = 1; n <= 9; n++) {
            if (isValid(board, i, j, n)) {
              board[i][j] = n;
              if (solve()) return true;
              board[i][j] = 0;
            }
          }
          return false;
        }
      }
    }
    count++;
    return count > 1;
  }

  solve();
  return count === 1;
}

function generateSudoku(difficulty: string): {
  puzzle: number[][];
  solution: number[][];
} {
  const grid = Array.from({ length: 9 }, () => Array(9).fill(0));
  fillGrid(grid);

  const puzzle = grid.map((r) => [...r]);
  const removals: Record<string, number> = { kolay: 35, orta: 45, zor: 55 };
  const toRemove = removals[difficulty] || 45;

  const cells: number[] = [];
  for (let i = 0; i < 81; i++) cells.push(i);
  for (let i = 80; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const temp = cells[i];
    cells[i] = cells[j];
    cells[j] = temp;
  }

  let removed = 0;
  for (const idx of cells) {
    if (removed >= toRemove) break;
    const r = Math.floor(idx / 9);
    const c = idx % 9;
    const val = puzzle[r][c];
    puzzle[r][c] = 0;
    if (hasUniqueSolution(puzzle)) {
      removed++;
    } else {
      puzzle[r][c] = val;
    }
  }

  return { puzzle, solution: grid };
}

function useTimer() {
  const [time, setTime] = useState<number>(0);
  const [running, setRunning] = useState<boolean>(false);

  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => setTime((t) => t + 1), 1000);
    return () => clearInterval(id);
  }, [running]);

  const fmt = (t: number): string =>
    `${String(Math.floor(t / 60)).padStart(2, "0")}:${String(t % 60).padStart(2, "0")}`;
  return {
    time,
    fmt,
    start: () => setRunning(true),
    stop: () => setRunning(false),
    reset: () => {
      setTime(0);
      setRunning(false);
    },
  };
}

// yeni bulmaca uret
function newBoard(diff: string) {
  const { puzzle, solution } = generateSudoku(diff);
  const board: SudokuCell[][] = puzzle.map((r) =>
    r.map((v) => ({
      value: v,
      given: v !== 0,
      error: false,
      hint: false,
    })),
  );
  return { game: { solution }, board };
}

export default function SudokuApp() {
  // ilk bulmaca
  const [initial] = useState(() => newBoard("orta"));
  const [difficulty, setDifficulty] = useState<string>("orta");
  const [game, setGame] = useState<SudokuGame | null>(initial.game);
  const [board, setBoard] = useState<SudokuCell[][]>(initial.board);
  const [selected, setSelected] = useState<{ r: number; c: number } | null>(
    null,
  );
  const [mistakes, setMistakes] = useState<number>(0);
  const [won, setWon] = useState<boolean>(false);
  const [level, setLevel] = useState<number>(1);
  const { time, fmt, start, stop, reset } = useTimer();

  const startGame = useCallback(
    (diff: string) => {
      const next = newBoard(diff);
      setGame(next.game);
      setBoard(next.board);
      setSelected(null);
      setMistakes(0);
      setWon(false);
      reset();
      setTimeout(start, 100);
    },
    [reset, start],
  );

  // acilista sayaci baslat
  useEffect(() => {
    const t = setTimeout(start, 100);
    return () => clearTimeout(t);
  }, [start]);

  const handleCellClick = (r: number, c: number) => {
    setSelected({ r, c });
  };

  const handleNumber = useCallback(
    (num: number) => {
      if (!selected || won || !game) return;
      const { r, c } = selected;
      if (board[r][c].given || board[r][c].hint) return;

      const newBoard = board.map((row) => row.map((cell) => ({ ...cell })));
      if (num === 0) {
        newBoard[r][c].value = 0;
        newBoard[r][c].error = false;
      } else {
        const tempNums = newBoard.map((row) => row.map((cell) => cell.value));
        tempNums[r][c] = 0;
        const valid = isValid(tempNums, r, c, num);
        newBoard[r][c].value = num;
        newBoard[r][c].error = !valid;
        if (!valid) {
          setMistakes((m) => m + 1);
        }
      }

      setBoard(newBoard);
      setSelected(null);

      const nums = newBoard.map((row) => row.map((cell) => cell.value));
      const boardComplete = (): boolean => {
        if (nums.some((row) => row.some((v) => v === 0))) return false;
        for (let i = 0; i < 9; i++) {
          if (new Set(nums[i]).size !== 9) return false;
          if (new Set(nums.map((r2) => r2[i])).size !== 9) return false;
        }
        for (let br = 0; br < 3; br++) {
          for (let bc = 0; bc < 3; bc++) {
            const box: number[] = [];
            for (let i = 0; i < 3; i++)
              for (let j = 0; j < 3; j++)
                box.push(nums[br * 3 + i][bc * 3 + j]);
            if (new Set(box).size !== 9) return false;
          }
        }
        return true;
      };
      if (boardComplete()) {
        setWon(true);
        stop();
        const best = localStorage.getItem("sudoku_best_time");
        if (!best || time < Number(best)) {
          localStorage.setItem("sudoku_best_time", String(time));
        }
      }
    },
    [selected, board, game, won, stop, time],
  );

  const handleHint = () => {
    if (!selected || !game || won) return;
    const { r, c } = selected;
    if (board[r][c].given || board[r][c].hint) return;
    const newBoard = board.map((row) => row.map((cell) => ({ ...cell })));
    newBoard[r][c].value = game.solution[r][c];
    newBoard[r][c].hint = true;
    newBoard[r][c].error = false;
    setBoard(newBoard);
  };

  const handleErase = () => {
    if (!selected || won) return;
    const { r, c } = selected;
    if (board[r][c].given || board[r][c].hint) return;
    const newBoard = board.map((row) => row.map((cell) => ({ ...cell })));
    newBoard[r][c].value = 0;
    newBoard[r][c].error = false;
    setBoard(newBoard);
  };

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      let processed = false;
      if (e.key >= "1" && e.key <= "9") {
        handleNumber(parseInt(e.key));
        processed = true;
      }
      if (e.key === "0" || e.key === "Backspace" || e.key === "Delete") {
        handleNumber(0);
        processed = true;
      }
      if (selected) {
        const { r, c } = selected;
        if (e.key === "ArrowUp" && r > 0) {
          setSelected({ r: r - 1, c });
          processed = true;
        }
        if (e.key === "ArrowDown" && r < 8) {
          setSelected({ r: r + 1, c });
          processed = true;
        }
        if (e.key === "ArrowLeft" && c > 0) {
          setSelected({ r, c: c - 1 });
          processed = true;
        }
        if (e.key === "ArrowRight" && c < 8) {
          setSelected({ r, c: c + 1 });
          processed = true;
        }
      }
      if (processed) {
        e.preventDefault();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [handleNumber, selected]);

  const getHighlightType = (
    r: number,
    c: number,
  ): "selected" | "same-num" | "highlight" | null => {
    if (!selected) return null;
    const { r: sr, c: sc } = selected;
    if (r === sr && c === sc) return "selected";
    const selVal = board[sr]?.[sc]?.value;
    if (selVal && selVal !== 0 && board[r]?.[c]?.value === selVal)
      return "same-num";
    if (r === sr || c === sc) return "highlight";
    if (
      Math.floor(r / 3) === Math.floor(sr / 3) &&
      Math.floor(c / 3) === Math.floor(sc / 3)
    )
      return "highlight";
    return null;
  };

  const renderCell = (cell: SudokuCell, r: number, c: number) => {
    const hl = getHighlightType(r, c);
    const key = `${r}-${c}`;

    let className = "cell";
    if (cell.given) className += " given";
    if (cell.hint) className += " hint-cell";
    else if (cell.error && !cell.given) className += " error";
    else if (!cell.given && cell.value) className += " user-input";
    if (hl === "selected") className += " selected";
    else if (hl === "same-num") className += " same-num";
    else if (hl === "highlight") className += " highlight";
    if (r === 2 || r === 5) className += " row-separator";

    return (
      <div
        key={key}
        className={className}
        onClick={() => handleCellClick(r, c)}
      >
        {cell.value !== 0 ? cell.value : ""}
      </div>
    );
  };

  return (
    <>
      <div className="sudoku-app">
        <div className="wood-grain" />
        <div className="content-wrap">
          <div className="title-block">
            <div className="title-main">Sudoku</div>
            <div className="ornament">
              <div className="ornament-line" />
              <span>✦</span>
              <div className="ornament-line" />
            </div>
            <div className="title-sub">Zeka Oyunu</div>
          </div>

          <div className="controls-row">
            {["kolay", "orta", "zor"].map((d) => (
              <button
                key={d}
                className={`diff-btn${difficulty === d ? " active" : ""}`}
                onClick={() => {
                  setDifficulty(d);
                  startGame(d);
                }}
              >
                {d.charAt(0).toUpperCase() + d.slice(1)}
              </button>
            ))}
          </div>

          <div className="board-wrap">
            <div className="board-inner">
              {board.map((row, r) =>
                row.map((cell, c) => renderCell(cell, r, c)),
              )}
            </div>
          </div>

          <div className="status-bar">
            <div className="status-item">
              <div className="status-label">Bölüm</div>
              <div className="status-value" style={{ fontSize: 18 }}>
                {level}
              </div>
            </div>
            <div className="status-item">
              <div className="status-label">Süre</div>
              <div className="status-value">{fmt(time)}</div>
            </div>
            <div className="status-item">
              <div className="status-label">Hatalar</div>
              <div className="status-value">
                {[0, 1, 2].map((i) => (
                  <span
                    key={i}
                    className={`mistakes-dot${i < mistakes ? " used" : ""}`}
                  />
                ))}
              </div>
            </div>
          </div>

          <div className="numpad-wrap">
            <div className="numpad-row">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
                <button
                  key={n}
                  className="num-btn"
                  onClick={() => handleNumber(n)}
                >
                  {n}
                </button>
              ))}
            </div>
            <div className="tools-row">
              <button className="tool-btn" onClick={handleErase}>
                ⌫ Sil
              </button>
              <button className="tool-btn" onClick={handleHint}>
                💡 İpucu
              </button>
              <button
                className="tool-btn"
                onClick={() => startGame(difficulty)}
              >
                ↺ Yenile
              </button>
            </div>
          </div>
        </div>

        {won && (
          <div className="win-overlay">
            <div className="win-card">
              <div className="win-level-badge">Bölüm {level}</div>
              <div className="win-title">Tebrikler!</div>
              <div
                className="ornament"
                style={{ justifyContent: "center", marginBottom: 8 }}
              >
                <div className="ornament-line" />
                <span style={{ color: "#c8a070", fontSize: 16 }}>✦</span>
                <div className="ornament-line" />
              </div>
              <div className="win-sub">Bulmacayı başarıyla tamamladınız</div>
              <div className="win-stats">
                <div className="status-item">
                  <div className="status-label">Süre</div>
                  <div className="status-value" style={{ fontSize: 24 }}>
                    {fmt(time)}
                  </div>
                </div>
                <div className="status-item">
                  <div className="status-label">Hatalar</div>
                  <div className="status-value" style={{ fontSize: 24 }}>
                    {mistakes}
                  </div>
                </div>
                <div className="status-item">
                  <div className="status-label">Zorluk</div>
                  <div className="status-value" style={{ fontSize: 18 }}>
                    {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}
                  </div>
                </div>
              </div>
              <div className="win-btn-row">
                <button
                  className="win-btn win-btn-next"
                  onClick={() => {
                    setLevel((l) => l + 1);
                    startGame(difficulty);
                  }}
                >
                  Sonraki Bölüm →
                </button>
                <button
                  className="win-btn win-btn-ghost"
                  onClick={() => {
                    startGame(difficulty);
                  }}
                >
                  Tekrar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

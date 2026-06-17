import { useState, useEffect, useCallback } from "react";

const FONT_URL =
  "https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;0,700;1,400&family=Libre+Baskerville:ital,wght@0,400;0,700;1,400&display=swap";

const STYLES = `
@import url('${FONT_URL}');
* { box-sizing: border-box; margin: 0; padding: 0; }
body { background: #f5ede0; }

.sudoku-app {
  min-height: 100vh;
  background: linear-gradient(160deg, #f9f1e6 0%, #ede3d2 50%, #e2d5c0 100%);
  font-family: 'Libre Baskerville', serif;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 24px 16px 40px;
  position: relative;
  overflow: hidden;
}

.wood-grain {
  position: fixed;
  inset: 0;
  background-image:
    repeating-linear-gradient(
      93deg,
      transparent 0px,
      transparent 4px,
      rgba(139,100,60,0.04) 4px,
      rgba(139,100,60,0.04) 5px
    ),
    repeating-linear-gradient(
      180deg,
      transparent 0px,
      transparent 18px,
      rgba(139,100,60,0.025) 18px,
      rgba(139,100,60,0.025) 19px
    );
  pointer-events: none;
  z-index: 0;
}

.content-wrap {
  position: relative;
  z-index: 1;
  width: 100%;
  max-width: 540px;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.title-block {
  text-align: center;
  margin-bottom: 20px;
}

.title-main {
  font-family: 'Playfair Display', serif;
  font-size: 42px;
  font-weight: 700;
  color: #4a2e12;
  letter-spacing: -0.5px;
  line-height: 1;
}

.title-sub {
  font-family: 'Libre Baskerville', serif;
  font-size: 12px;
  font-weight: 400;
  font-style: italic;
  color: #8b6040;
  letter-spacing: 3px;
  text-transform: uppercase;
  margin-top: 6px;
}

.ornament {
  display: flex;
  align-items: center;
  gap: 12px;
  margin: 8px auto;
  color: #c8a070;
  font-size: 18px;
}
.ornament-line {
  width: 60px;
  height: 1px;
  background: #c8a070;
  opacity: 0.6;
}

.controls-row {
  display: flex;
  gap: 10px;
  margin-bottom: 18px;
  flex-wrap: wrap;
  justify-content: center;
}

.diff-btn {
  font-family: 'Libre Baskerville', serif;
  font-size: 11px;
  font-weight: 400;
  letter-spacing: 1.5px;
  text-transform: uppercase;
  padding: 8px 18px;
  border: 1.5px solid #c0956a;
  background: transparent;
  color: #6b3d1e;
  border-radius: 3px;
  cursor: pointer;
  transition: all 0.2s;
}

.diff-btn.active {
  background: #6b3d1e;
  color: #f9ede0;
  border-color: #6b3d1e;
}

.diff-btn:hover:not(.active) {
  background: rgba(107,61,30,0.1);
}

.board-wrap {
  background: #d4b896;
  padding: 12px;
  border-radius: 4px;
  box-shadow:
    0 2px 0 #a07850,
    0 4px 0 #8a6640,
    0 6px 0 #74563a,
    0 8px 16px rgba(74,46,18,0.35),
    inset 0 1px 0 rgba(255,240,210,0.5);
  position: relative;
}

.board-inner {
  background: #f7efe3;
  border: 2px solid #8a6640;
  border-radius: 2px;
  display: inline-grid;
  grid-template-columns: repeat(9, 1fr);
  gap: 0;
  position: relative;
}

.cell {
  width: 52px;
  height: 52px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: 'Playfair Display', serif;
  font-size: 20px;
  font-weight: 600;
  cursor: pointer;
  border-right: 0.75px solid #c4a882;
  border-bottom: 0.75px solid #c4a882;
  position: relative;
  transition: background 0.15s;
  color: #3a2410;
  background: #f7efe3;
  -webkit-user-select: none;
  user-select: none;
}

.cell:nth-child(3n) { border-right: 2px solid #8a6640; }
.cell:nth-child(9n) { border-right: none; }
.cell:nth-last-child(-n+9) { border-bottom: none; }

.cell-row-7 .cell,
.cell-row-8 .cell,
.cell-row-9 .cell { }

.row-separator { border-bottom: 2px solid #8a6640 !important; }

.cell.given {
  color: #2c1a08;
  font-weight: 700;
}

.cell.selected {
  background: #e8d4b4 !important;
  z-index: 2;
}

.cell.highlight {
  background: #f2e8d8;
}

.cell.same-num {
  background: #ddc9a8;
}

.cell.error {
  color: #8b2020;
}

.cell.user-input {
  color: #5c3a1e;
}

.cell.hint-cell {
  color: #2a6b3a !important;
  background: #e8f4ea !important;
}

.cell:hover:not(.given) {
  background: #ead8be;
}

.pencil-marks {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  grid-template-rows: repeat(3, 1fr);
  width: 100%;
  height: 100%;
  padding: 2px;
}
.pencil-mark {
  font-family: 'Libre Baskerville', serif;
  font-size: 9px;
  color: #9b7555;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 400;
}

.numpad-wrap {
  margin-top: 18px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
}

.numpad-row {
  display: flex;
  gap: 8px;
}

.num-btn {
  width: 46px;
  height: 50px;
  font-family: 'Playfair Display', serif;
  font-size: 22px;
  font-weight: 600;
  border: 1.5px solid #b89070;
  background: #f0e4d0;
  color: #4a2e12;
  border-radius: 3px;
  cursor: pointer;
  box-shadow: 0 2px 0 #9a7050, 0 3px 4px rgba(74,46,18,0.2);
  transition: all 0.1s;
  position: relative;
  top: 0;
}

.num-btn:active {
  box-shadow: 0 0px 0 #9a7050;
  top: 2px;
}

.num-btn:hover {
  background: #e8d8c0;
}

.num-btn.selected-num {
  background: #6b3d1e;
  color: #f9ede0;
  border-color: #4a2a10;
  box-shadow: 0 2px 0 #3a2010, 0 3px 4px rgba(74,46,18,0.3);
}

.tool-btn {
  font-family: 'Libre Baskerville', serif;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.5px;
  padding: 8px 16px;
  border: 1.5px solid #b89070;
  background: #f0e4d0;
  color: #4a2e12;
  border-radius: 3px;
  cursor: pointer;
  box-shadow: 0 2px 0 #9a7050, 0 3px 4px rgba(74,46,18,0.15);
  transition: all 0.1s;
  position: relative;
  top: 0;
  text-transform: uppercase;
}

.tool-btn:active { box-shadow: 0 0px 0 #9a7050; top: 2px; }
.tool-btn:hover { background: #e8d8c0; }
.tool-btn.active-tool {
  background: #a07040;
  color: #f9ede0;
  border-color: #7a5030;
  box-shadow: 0 2px 0 #5a3820, 0 3px 4px rgba(74,46,18,0.3);
}

.tools-row {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  justify-content: center;
}

.status-bar {
  display: flex;
  align-items: center;
  gap: 24px;
  margin-top: 16px;
  padding: 10px 24px;
  background: rgba(200,160,90,0.2);
  border: 1px solid rgba(200,160,90,0.4);
  border-radius: 3px;
  width: 100%;
  justify-content: center;
}

.status-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
}

.status-label {
  font-size: 10px;
  letter-spacing: 1.5px;
  text-transform: uppercase;
  color: #9a7050;
  font-family: 'Libre Baskerville', serif;
}

.status-value {
  font-family: 'Playfair Display', serif;
  font-size: 20px;
  font-weight: 600;
  color: #4a2e12;
}

.mistakes-dot {
  width: 10px; height: 10px;
  border-radius: 50%;
  background: #c8a070;
  display: inline-block;
  margin: 0 2px;
}
.mistakes-dot.used { background: #8b2020; }

.win-overlay {
  position: fixed;
  inset: 0;
  background: rgba(74,46,18,0.75);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
  animation: fadeIn 0.4s ease;
}

@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
@keyframes scaleIn { from { transform: scale(0.85); opacity: 0; } to { transform: scale(1); opacity: 1; } }

.win-card {
  background: #f7efe3;
  padding: 40px 48px;
  border-radius: 4px;
  text-align: center;
  border: 2px solid #c8a070;
  box-shadow: 0 8px 32px rgba(74,46,18,0.4);
  animation: scaleIn 0.35s ease;
}

.win-title {
  font-family: 'Playfair Display', serif;
  font-size: 36px;
  font-weight: 700;
  color: #4a2e12;
  margin-bottom: 8px;
}

.win-sub {
  font-family: 'Libre Baskerville', serif;
  font-size: 13px;
  font-style: italic;
  color: #8b6040;
  margin-bottom: 24px;
}

.win-stats {
  display: flex;
  gap: 32px;
  justify-content: center;
  margin-bottom: 28px;
}

.win-btn {
  font-family: 'Libre Baskerville', serif;
  font-size: 12px;
  letter-spacing: 2px;
  text-transform: uppercase;
  padding: 12px 32px;
  border: 1.5px solid #6b3d1e;
  background: #6b3d1e;
  color: #f9ede0;
  border-radius: 3px;
  cursor: pointer;
  box-shadow: 0 3px 0 #3a2010;
  transition: all 0.1s;
  position: relative; top: 0;
}

.win-btn:active { box-shadow: 0 0px 0 #3a2010; top: 3px; }

.win-level-badge {
  font-family: 'Libre Baskerville', serif;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 2.5px;
  text-transform: uppercase;
  color: #9a7050;
  background: rgba(200,160,90,0.12);
  border: 1px solid rgba(200,160,90,0.3);
  padding: 4px 16px;
  border-radius: 3px;
  margin-bottom: 12px;
  display: inline-block;
}

.win-btn-row {
  display: flex;
  gap: 10px;
  justify-content: center;
  flex-wrap: wrap;
}

.win-btn-next {
  background: #6b3d1e;
  color: #f9ede0;
  border-color: #4a2a10;
  box-shadow: 0 3px 0 #3a2010;
  min-width: 160px;
}

.win-btn-ghost {
  background: transparent;
  color: #8b6040;
  border: 1.5px solid #c0956a;
  box-shadow: 0 2px 0 rgba(0,0,0,0.1);
  min-width: 90px;
}

@media (max-width: 540px) {
  .sudoku-app { padding: 12px 8px 32px; }
  .board-wrap { padding: 8px; }
  .cell {
    width: calc((100vw - 36px) / 9);
    height: calc((100vw - 36px) / 9);
    font-size: clamp(11px, calc((100vw - 36px) / 9 * 0.38), 20px);
  }
  .num-btn {
    width: calc((100vw - 40px) / 9 - 4px);
    height: calc((100vw - 40px) / 9 - 2px);
    font-size: clamp(13px, calc((100vw - 40px) / 9 * 0.44), 22px);
  }
  .numpad-row { gap: 3px; }
  .tools-row { gap: 4px; }
  .tool-btn { font-size: 10px; padding: 6px 10px; }
  .title-main { font-size: 30px; }
  .status-bar { padding: 8px 12px; gap: 16px; }
  .status-value { font-size: 16px; }
  .win-card { padding: 24px 20px; }
  .win-title { font-size: 26px; }
  .win-stats { gap: 20px; }
}
`;

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
      <style>{STYLES}</style>
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

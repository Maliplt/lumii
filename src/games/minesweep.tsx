import { useState, useEffect, useRef } from "react";

const FONT_URL = "https://fonts.googleapis.com/css2?family=Fredoka+One&family=Nunito:wght@400;600;700;800&display=swap";

const STYLES = `
@import url('${FONT_URL}');
* { box-sizing: border-box; margin: 0; padding: 0; }

.ms-app {
  min-height: 100vh;
  background: #fef9f0;
  font-family: 'Nunito', sans-serif;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px 12px 40px;
  position: relative;
  overflow: hidden;
}

.doodle-bg {
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 0;
  overflow: hidden;
}

.doodle-shape {
  position: absolute;
  border-radius: 50%;
  opacity: 0.12;
}

.ms-content {
  position: relative;
  z-index: 1;
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.ms-title {
  font-family: 'Fredoka One', cursive;
  font-size: 46px;
  color: #ff4757;
  letter-spacing: -1px;
  line-height: 1;
  text-shadow:
    3px 3px 0 #ffb3ba,
    -1px -1px 0 rgba(255,71,87,0.3);
  margin-bottom: 2px;
}

.ms-title-row {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 4px;
}

.bomb-icon {
  font-size: 36px;
  animation: wiggle 3s ease-in-out infinite;
}

@keyframes wiggle {
  0%, 100% { transform: rotate(-5deg); }
  50% { transform: rotate(5deg); }
}

.ms-subtitle {
  font-family: 'Nunito', sans-serif;
  font-size: 13px;
  font-weight: 700;
  color: #ff9a9a;
  letter-spacing: 3px;
  text-transform: uppercase;
  margin-bottom: 16px;
}

.diff-row {
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
  flex-wrap: wrap;
  justify-content: center;
}

.ms-diff-btn {
  font-family: 'Fredoka One', cursive;
  font-size: 14px;
  padding: 6px 18px;
  border: 2.5px solid #ddd;
  background: white;
  color: #888;
  border-radius: 50px;
  cursor: pointer;
  transition: all 0.2s;
  letter-spacing: 0.5px;
}

.ms-diff-btn.active-kolay {
  border-color: #2ed573;
  background: #f0fff5;
  color: #2ed573;
}
.ms-diff-btn.active-orta {
  border-color: #ffa502;
  background: #fffbf0;
  color: #ffa502;
}
.ms-diff-btn.active-zor {
  border-color: #ff4757;
  background: #fff5f5;
  color: #ff4757;
}
.ms-diff-btn.active-uzman {
  border-color: #5352ed;
  background: #f5f5ff;
  color: #5352ed;
}

.stats-bar {
  display: flex;
  gap: 12px;
  margin-bottom: 12px;
  flex-wrap: wrap;
  justify-content: center;
}

.stat-pill {
  display: flex;
  align-items: center;
  gap: 6px;
  background: white;
  border: 2px solid #ffe0e0;
  border-radius: 50px;
  padding: 6px 16px;
  font-family: 'Fredoka One', cursive;
  font-size: 16px;
  color: #ff6b6b;
  box-shadow: 0 2px 8px rgba(255,107,107,0.15);
}

.stat-pill.timer { border-color: #c0e8ff; color: #4a90d9; }
.stat-pill.flags { border-color: #ffd0a0; color: #ff8c42; }
.stat-pill.mines { border-color: #ffc0c0; color: #ff4757; }

.stat-icon { font-size: 16px; }

.board-container {
  background: white;
  border: 3px solid #ffe0e0;
  border-radius: 16px;
  padding: 12px;
  box-shadow:
    0 4px 0 #ffc0c0,
    0 8px 20px rgba(255,100,100,0.15);
  overflow: auto;
  max-width: 98vw;
}

.ms-board {
  display: inline-grid;
  gap: 2px;
  border-radius: 8px;
  overflow: hidden;
}

.ms-cell {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: 'Fredoka One', cursive;
  font-size: 16px;
  cursor: pointer;
  border-radius: 6px;
  transition: all 0.12s;
  position: relative;
  user-select: none;
  -webkit-user-select: none;
}

.ms-cell.hidden {
  background: linear-gradient(135deg, #f8f0ff 0%, #f0e8ff 100%);
  border: 2px solid #e0d0ff;
  box-shadow: 0 2px 0 #c0a0e8, inset 0 1px 0 rgba(255,255,255,0.9);
}

.ms-cell.hidden:hover:not(.flagged) {
  background: linear-gradient(135deg, #fff0f8 0%, #ffe8f5 100%);
  border-color: #ffb0d8;
  box-shadow: 0 2px 0 #ff90c0, inset 0 1px 0 rgba(255,255,255,0.9);
  transform: translateY(-1px);
}

.ms-cell.hidden:active:not(.flagged) {
  transform: translateY(1px);
  box-shadow: 0 0 0 #c0a0e8;
}

.ms-cell.flagged {
  background: linear-gradient(135deg, #fff8e0 0%, #fff0c0 100%);
  border: 2px solid #ffd060;
  box-shadow: 0 2px 0 #e8b020, inset 0 1px 0 rgba(255,255,255,0.9);
  font-size: 18px;
}

.ms-cell.revealed {
  background: #f8f8ff;
  border: 2px solid transparent;
  cursor: default;
  box-shadow: inset 0 1px 3px rgba(0,0,0,0.06);
}

.ms-cell.revealed.empty { background: #f0f8f0; }

.ms-cell.revealed.n1 { color: #2196F3; }
.ms-cell.revealed.n2 { color: #4CAF50; }
.ms-cell.revealed.n3 { color: #F44336; }
.ms-cell.revealed.n4 { color: #9C27B0; }
.ms-cell.revealed.n5 { color: #FF5722; }
.ms-cell.revealed.n6 { color: #009688; }
.ms-cell.revealed.n7 { color: #212121; }
.ms-cell.revealed.n8 { color: #757575; }

.ms-cell.mine-hit {
  background: #ff4757 !important;
  border-color: #ff1f30 !important;
  animation: shake 0.4s ease;
}

.ms-cell.mine-revealed {
  background: #ffe4e4;
  border-color: #ffb0b0;
}

.ms-cell.mine-safe {
  background: #e8ffe8;
  border-color: #90e890;
}

@keyframes shake {
  0%, 100% { transform: translateX(0); }
  20% { transform: translateX(-4px) rotate(-2deg); }
  40% { transform: translateX(4px) rotate(2deg); }
  60% { transform: translateX(-2px); }
  80% { transform: translateX(2px); }
}

@keyframes pop {
  0% { transform: scale(0.7); opacity: 0; }
  70% { transform: scale(1.15); }
  100% { transform: scale(1); opacity: 1; }
}

.ms-cell.just-revealed {
  animation: pop 0.2s ease;
}

.action-row {
  display: flex;
  gap: 10px;
  margin-top: 14px;
  flex-wrap: wrap;
  justify-content: center;
}

.ms-btn {
  font-family: 'Fredoka One', cursive;
  font-size: 14px;
  padding: 8px 20px;
  border: 2.5px solid #ddd;
  background: white;
  border-radius: 50px;
  cursor: pointer;
  transition: all 0.15s;
  display: flex;
  align-items: center;
  gap: 6px;
}

.ms-btn-flag {
  border-color: #ffd060;
  color: #e8a000;
  background: #fffce0;
}
.ms-btn-flag.active {
  background: #ffd060;
  color: #7a5000;
  border-color: #e8a000;
  box-shadow: 0 2px 8px rgba(255,208,96,0.4);
}

.ms-btn-new {
  border-color: #ff9eb5;
  color: #ff4757;
  background: #fff5f7;
}
.ms-btn-new:hover {
  background: #ff4757;
  color: white;
  border-color: #ff4757;
  box-shadow: 0 3px 12px rgba(255,71,87,0.35);
}

.overlay {
  position: fixed;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
  animation: fadeIn 0.3s ease;
}

.overlay-bg-lose { background: rgba(255,71,87,0.7); }
.overlay-bg-win { background: rgba(46,213,115,0.7); }

@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
@keyframes bounceIn {
  0% { transform: scale(0.5); opacity: 0; }
  60% { transform: scale(1.1); }
  100% { transform: scale(1); opacity: 1; }
}

.result-card {
  background: white;
  border-radius: 20px;
  padding: 36px 44px;
  text-align: center;
  box-shadow: 0 16px 40px rgba(0,0,0,0.25);
  animation: bounceIn 0.4s ease;
  border: 3px solid transparent;
}

.result-card.win { border-color: #2ed573; }
.result-card.lose { border-color: #ff4757; }

.result-emoji { font-size: 64px; margin-bottom: 12px; display: block; }
.result-title {
  font-family: 'Fredoka One', cursive;
  font-size: 36px;
  margin-bottom: 8px;
}
.result-card.win .result-title { color: #2ed573; }
.result-card.lose .result-title { color: #ff4757; }

.result-sub {
  font-size: 14px;
  font-weight: 600;
  color: #aaa;
  margin-bottom: 20px;
  font-family: 'Nunito', sans-serif;
}

.result-stats {
  display: flex;
  gap: 24px;
  justify-content: center;
  margin-bottom: 24px;
}

.result-stat {
  display: flex;
  flex-direction: column;
  gap: 3px;
  align-items: center;
}

.result-stat-val {
  font-family: 'Fredoka One', cursive;
  font-size: 26px;
  color: #333;
}

.result-stat-label {
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 1px;
  color: #bbb;
}

.result-btn {
  font-family: 'Fredoka One', cursive;
  font-size: 16px;
  padding: 12px 32px;
  border: none;
  border-radius: 50px;
  cursor: pointer;
  transition: all 0.15s;
  letter-spacing: 0.5px;
}

.result-btn.win-btn {
  background: #2ed573;
  color: white;
  box-shadow: 0 4px 0 #1aaf58;
}
.result-btn.win-btn:hover { background: #26c065; }
.result-btn.lose-btn {
  background: #ff4757;
  color: white;
  box-shadow: 0 4px 0 #cc1f30;
}
.result-btn.lose-btn:hover { background: #e83040; }
`;

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



function createBoard(rows: number, cols: number, mines: number, firstR: number, firstC: number): Cell[][] {
    const forbidden = new Set<number>();
    for (let dr = -1; dr <= 1; dr++)
        for (let dc = -1; dc <= 1; dc++) {
            const nr = firstR + dr, nc = firstC + dc;
            if (nr >= 0 && nr < rows && nc >= 0 && nc < cols)
                forbidden.add(nr * cols + nc);
        }

    const allCells = [...Array(rows * cols).keys()].filter(i => !forbidden.has(i));
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
        }))
    );

    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            if (board[r][c].mine) continue;
            let cnt = 0;
            for (let dr = -1; dr <= 1; dr++)
                for (let dc = -1; dc <= 1; dc++) {
                    const nr = r + dr, nc = c + dc;
                    if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && board[nr][nc].mine) cnt++;
                }
            board[r][c].count = cnt;
        }
    }
    return board;
}

function floodReveal(board: Cell[][], r: number, c: number, rows: number, cols: number, toReveal: [number, number][] = []): [number, number][] {
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
            ref.current = setInterval(() => setTime(t => t + 1), 1000);
        } else if (ref.current) {
            clearInterval(ref.current);
        }
        return () => { if (ref.current) clearInterval(ref.current); };
    }, [running]);

    return {
        time,
        fmt: (t: number) => String(Math.min(t, 999)).padStart(3, '0'),
        start: () => setRunning(true),
        stop: () => setRunning(false),
        reset: () => { setRunning(false); setTime(0); },
    };
}

const DoodleBg = () => (
    <div className="doodle-bg">
        {[
            { top: '5%', left: '3%', w: 80, h: 80, bg: '#ff6b6b' },
            { top: '15%', left: '88%', w: 60, h: 60, bg: '#ffa502' },
            { top: '40%', left: '92%', w: 100, h: 100, bg: '#2ed573' },
            { top: '65%', left: '2%', w: 70, h: 70, bg: '#5352ed' },
            { top: '80%', left: '85%', w: 90, h: 90, bg: '#ff4757' },
            { top: '50%', left: '5%', w: 50, h: 50, bg: '#1e90ff' },
            { top: '30%', left: '10%', w: 40, h: 40, bg: '#ffd32a' },
            { top: '70%', left: '90%', w: 55, h: 55, bg: '#ff6348' },
            { top: '90%', left: '30%', w: 65, h: 65, bg: '#7bed9f' },
        ].map((s, i) => (
            <div
                key={i}
                className="doodle-shape"
                style={{
                    top: s.top, left: s.left,
                    width: s.w, height: s.h,
                    background: s.bg,
                    borderRadius: i % 3 === 0 ? '30% 70% 70% 30% / 30% 30% 70% 70%' :
                        i % 3 === 1 ? '50%' : '20% 80% 30% 70% / 50% 60% 40% 50%',
                }}
            />
        ))}
    </div>
);

export default function MinesweeperApp() {
    const [difficulty, setDifficulty] = useState<string>('kolay');
    const [board, setBoard] = useState<Cell[][] | null>(null);
    const [status, setStatus] = useState<string>('idle');
    const [flagMode, setFlagMode] = useState<boolean>(false);
    const [flagCount, setFlagCount] = useState<number>(0);
    const [revealedCount, setRevealedCount] = useState<number>(0);
    const [justRevealedCells, setJustRevealedCells] = useState<Set<string>>(new Set());
    const { time, fmt, start, stop, reset } = useTimer();

    const cfg = CONFIGS[difficulty as keyof typeof CONFIGS];

    // tahtayi sifirla
    const newGame = () => {
        setBoard(null);
        setStatus('idle');
        setFlagCount(0);
        setRevealedCount(0);
        setJustRevealedCells(new Set());
        reset();
    };

    const handleClick = (r: number, c: number) => {
        if (status === 'win' || status === 'lose') return;

        if (!board) {
            const newBoard = createBoard(cfg.rows, cfg.cols, cfg.mines, r, c);
            const boardCopy = newBoard.map(row => row.map(cell => ({ ...cell })));
            const revealed = floodReveal(boardCopy, r, c, cfg.rows, cfg.cols);
            const revSet = new Set(revealed.map(([rr, cc]) => `${rr}-${cc}`));
            setJustRevealedCells(revSet);
            setTimeout(() => setJustRevealedCells(new Set()), 500);
            setBoard(boardCopy);
            setRevealedCount(revealed.length);
            setStatus('playing');
            start();
            return;
        }

        const cell = board[r][c];
        if (cell.revealed || cell.flagged) return;

        if (flagMode) {
            const newBoard = board.map(row => row.map(cell => ({ ...cell })));
            newBoard[r][c].flagged = !newBoard[r][c].flagged;
            setFlagCount(fc => newBoard[r][c].flagged ? fc + 1 : fc - 1);
            setBoard(newBoard);
            return;
        }

        if (cell.mine) {
            const newBoard = board.map(row => row.map(cell => ({ ...cell })));
            newBoard[r][c].revealed = true;
            setBoard(newBoard);
            setStatus('lose');
            stop();
            return;
        }

        const newBoard = board.map(row => row.map(cell => ({ ...cell })));
        const revealed = floodReveal(newBoard, r, c, cfg.rows, cfg.cols);
        const revSet = new Set(revealed.map(([rr, cc]) => `${rr}-${cc}`));
        setJustRevealedCells(revSet);
        setTimeout(() => setJustRevealedCells(new Set()), 400);

        const newRevCount = revealedCount + revealed.length;
        setRevealedCount(newRevCount);
        setBoard(newBoard);

        if (newRevCount >= totalSafe) {
            setStatus('win');
            stop();
            const best = localStorage.getItem('minesweeper_best_time');
            if (!best || time < Number(best)) {
                localStorage.setItem('minesweeper_best_time', String(time));
            }
        }
    };

    const handleRightClick = (e: React.MouseEvent, r: number, c: number) => {
        e.preventDefault();
        if (!board || status === 'win' || status === 'lose') return;
        const cell = board[r][c];
        if (cell.revealed) return;
        const newBoard = board.map(row => row.map(cell => ({ ...cell })));
        newBoard[r][c].flagged = !newBoard[r][c].flagged;
        setFlagCount(fc => newBoard[r][c].flagged ? fc + 1 : fc - 1);
        setBoard(newBoard);
    };

    const renderCell = (cell: Cell, r: number, c: number) => {
        const key = `${r}-${c}`;
        let cls = 'ms-cell';
        let content = null;

        if (!cell.revealed) {
            if (cell.flagged) {
                cls += ' flagged';
                content = '🚩';
            } else {
                cls += ' hidden';
                if (status === 'lose' && cell.mine) {
                    cls = 'ms-cell mine-revealed';
                    content = '💣';
                }
            }
        } else {
            if (cell.mine) {
                cls += ' mine-hit';
                content = '💥';
            } else if (cell.count === 0) {
                cls += ' revealed empty';
            } else {
                cls += ` revealed n${cell.count}`;
                content = cell.count;
            }
            if (justRevealedCells.has(key)) cls += ' just-revealed';
        }

        if (status === 'win' && !cell.revealed && cell.mine) {
            cls = 'ms-cell mine-safe';
            content = '🎯';
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
            <style>{STYLES}</style>
            <div className="ms-app">
                <DoodleBg />
                <div className="ms-content">
                    <div className="ms-title-row">
                        <span className="bomb-icon">💣</span>
                        <div className="ms-title">Mayın Tarlası</div>
                        <span className="bomb-icon" style={{ animationDelay: '1.5s' }}>💣</span>
                    </div>
                    <div className="ms-subtitle">Dikkatli ol, patlayabilir!</div>

                    <div className="diff-row">
                        {['kolay', 'orta', 'zor', 'uzman'].map(d => (
                            <button
                                key={d}
                                className={`ms-diff-btn${difficulty === d ? ` active-${d}` : ''}`}
                                onClick={() => { setDifficulty(d); newGame(); }}
                            >
                                {d === 'kolay' ? '😊 Kolay' : d === 'orta' ? '🤔 Orta' : d === 'zor' ? '😰 Zor' : '💀 Uzman'}
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
                            <div className="stat-pill" style={{ borderColor: '#c0e0c0', color: '#4a9a4a' }}>
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
                                {board.map((row, r) => row.map((cell, c) => renderCell(cell, r, c)))}
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
                                    ))
                                )}
                            </div>
                        )}
                    </div>

                    <div className="action-row">
                        <button
                            className={`ms-btn ms-btn-flag${flagMode ? ' active' : ''}`}
                            onClick={() => setFlagMode(m => !m)}
                        >
                            🚩 {flagMode ? 'Bayrak Modu Açık' : 'Bayrak Koy'}
                        </button>
                        <button
                            className="ms-btn ms-btn-new"
                            onClick={newGame}
                        >
                            🔄 Yeni Oyun
                        </button>
                    </div>

                    <div style={{ marginTop: 10, fontSize: 12, color: '#ccc', fontFamily: 'Nunito, sans-serif', fontWeight: 600, textAlign: 'center' }}>
                        Sağ tık = bayrak • Masaüstü | Bayrak modu = mobil
                    </div>
                </div>

                {(status === 'win' || status === 'lose') && (
                    <div className={`overlay overlay-bg-${status === 'win' ? 'win' : 'lose'}`}>
                        <div className={`result-card ${status}`}>
                            <span className="result-emoji">{status === 'win' ? '🎉' : '💥'}</span>
                            <div className="result-title">
                                {status === 'win' ? 'Kazandın!' : 'Boom!'}
                            </div>
                            <div className="result-sub">
                                {status === 'win' ? 'Tüm mayınları buldun!' : 'Mayına bastın...'}
                            </div>
                            <div className="result-stats">
                                <div className="result-stat">
                                    <div className="result-stat-val">{fmt(time)}s</div>
                                    <div className="result-stat-label">Süre</div>
                                </div>
                                {status === 'win' && (
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
                                className={`result-btn ${status === 'win' ? 'win-btn' : 'lose-btn'}`}
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

import { useState, useEffect, useCallback, useRef } from "react";
import type React from "react";

const FONT_URL =
  "https://fonts.googleapis.com/css2?family=Quicksand:wght@400;500;600;700&family=Baloo+2:wght@500;600;700;800&display=swap";

const SIZE = 4;
const GAP = 2.6;
const CELL = (100 - (SIZE - 1) * GAP) / SIZE;
const cellPos = (i: number) => i * (CELL + GAP);

const STYLES = `
@import url('${FONT_URL}');
* { box-sizing: border-box; margin: 0; padding: 0; -webkit-tap-highlight-color: transparent; }

.g2-app {
  min-height: 100vh;
  background:
    radial-gradient(140% 100% at 12% -10%, #fef1f6 0%, transparent 50%),
    radial-gradient(140% 100% at 95% 110%, #ecf1fc 0%, transparent 50%),
    #f6f2fb;
  font-family: 'Quicksand', sans-serif;
  display: flex; flex-direction: column; align-items: center;
  padding: 24px 16px 44px;
  position: relative; overflow: hidden;
  touch-action: none;
}

.g2-orb { position: fixed; border-radius: 50%; filter: blur(80px); pointer-events: none; z-index: 0; opacity: 0.5; }

.g2-content { position: relative; z-index: 1; width: 100%; max-width: 480px; display: flex; flex-direction: column; align-items: center; }

/* HEADER */
.g2-header { width: 100%; display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
.g2-title {
  font-family: 'Baloo 2', cursive; font-size: 52px; font-weight: 800;
  color: #8b6fd0; line-height: 1; letter-spacing: -1.5px;
  text-shadow: 0 2px 0 #e3d8f7, 0 4px 12px rgba(139,111,208,0.2);
}
.g2-subtitle { font-family: 'Quicksand', sans-serif; font-size: 12.5px; font-weight: 600; color: #b1a3d2; margin-top: 2px; }

.g2-scores { display: flex; gap: 9px; }
.score-box {
  background: #fff; border-radius: 15px; padding: 9px 16px; text-align: center; min-width: 80px;
  box-shadow: 0 4px 14px rgba(139,111,208,0.12); border: 1px solid #efe9f9; position: relative; overflow: hidden;
}
.score-box.best { background: linear-gradient(135deg, #fff7e6, #fff); border-color: #f5e6c0; }
.score-label { font-size: 9.5px; font-weight: 700; letter-spacing: 1.4px; color: #bdb0da; text-transform: uppercase; }
.score-box.best .score-label { color: #d4a843; }
.score-value { font-family: 'Baloo 2', cursive; font-size: 23px; font-weight: 700; color: #6e57a8; line-height: 1.15; }
.score-box.best .score-value { color: #c9963a; }
.score-pop {
  position: absolute; top: 3px; right: 8px;
  font-family: 'Baloo 2', cursive; font-size: 14px; font-weight: 700; color: #7ec47e;
  animation: scoreFloat 0.8s ease forwards; pointer-events: none;
}
@keyframes scoreFloat { 0%{opacity:0;transform:translateY(8px)} 25%{opacity:1} 100%{opacity:0;transform:translateY(-18px)} }

/* COMBO BAR */
.combo-strip { width: 100%; height: 30px; margin-bottom: 14px; display: flex; align-items: center; gap: 10px; }
.combo-label {
  font-family: 'Baloo 2', cursive; font-size: 14px; font-weight: 700; white-space: nowrap;
  transition: color 0.3s; min-width: 92px;
}
.combo-track { flex: 1; height: 8px; background: #ece4f7; border-radius: 5px; overflow: hidden; }
.combo-fill { height: 100%; border-radius: 5px; transition: width 0.4s cubic-bezier(0.34,1.4,0.64,1), background 0.3s; }

/* CONTROLS */
.g2-controls { width: 100%; display: flex; gap: 9px; margin-bottom: 16px; }
.g2-btn {
  font-family: 'Baloo 2', cursive; font-size: 13.5px; font-weight: 700; padding: 10px 0; border: none;
  border-radius: 13px; cursor: pointer; transition: all 0.18s cubic-bezier(0.34,1.56,0.64,1);
  display: flex; align-items: center; justify-content: center; gap: 6px; flex: 1;
}
.g2-btn.primary { background: linear-gradient(135deg, #a98ee6, #8b6fd0); color: #fff; box-shadow: 0 4px 12px rgba(139,111,208,0.35); }
.g2-btn.primary:hover { transform: translateY(-2px); box-shadow: 0 7px 18px rgba(139,111,208,0.45); }
.g2-btn.ghost { background: #fff; color: #8b6fd0; border: 1.5px solid #e6dcf6; }
.g2-btn.ghost:hover:not(:disabled) { background: #faf6ff; border-color: #d4c4f0; }
.g2-btn:active:not(:disabled) { transform: scale(0.95); }
.g2-btn:disabled { opacity: 0.4; cursor: not-allowed; }

/* BOARD */
.board-shell {
  position: relative; background: #e4d9f6; border-radius: 22px; padding: ${GAP}%;
  box-shadow: 0 12px 32px rgba(139,111,208,0.22), inset 0 2px 8px rgba(255,255,255,0.7);
  width: 100%; max-width: 440px; aspect-ratio: 1;
}
.board-shell.bump-left   { animation: bumpLeft 0.4s cubic-bezier(0.36,0,0.2,1); }
.board-shell.bump-right  { animation: bumpRight 0.4s cubic-bezier(0.36,0,0.2,1); }
.board-shell.bump-up     { animation: bumpUp 0.4s cubic-bezier(0.36,0,0.2,1); }
.board-shell.bump-down   { animation: bumpDown 0.4s cubic-bezier(0.36,0,0.2,1); }
@keyframes bumpLeft  { 0%{transform:translateX(0)} 38%{transform:translateX(-6px)} 72%{transform:translateX(2px)} 100%{transform:translateX(0)} }
@keyframes bumpRight { 0%{transform:translateX(0)} 38%{transform:translateX(6px)} 72%{transform:translateX(-2px)} 100%{transform:translateX(0)} }
@keyframes bumpUp    { 0%{transform:translateY(0)} 38%{transform:translateY(-6px)} 72%{transform:translateY(2px)} 100%{transform:translateY(0)} }
@keyframes bumpDown  { 0%{transform:translateY(0)} 38%{transform:translateY(6px)} 72%{transform:translateY(-2px)} 100%{transform:translateY(0)} }

.grid-bg { position: absolute; inset: ${GAP}%; }
.grid-cell { position: absolute; background: rgba(255,255,255,0.45); border-radius: 13px; }

.tiles-layer { position: absolute; inset: ${GAP}%; }

.tile { position: absolute; border-radius: 13px; }
.tile-inner {
  position: absolute; inset: 0; display: flex; align-items: center; justify-content: center;
  border-radius: 13px; font-family: 'Baloo 2', cursive; font-weight: 800;
}
.tile.spawn .tile-inner { animation: tileSpawn 0.22s cubic-bezier(0.34,1.7,0.5,1); }
.tile.merged .tile-inner { animation: tileMerge 0.26s cubic-bezier(0.34,1.9,0.5,1); }
@keyframes tileSpawn { 0%{transform:scale(0);opacity:0.4} 65%{transform:scale(1.14)} 100%{transform:scale(1)} }
@keyframes tileMerge { 0%{transform:scale(1)} 38%{transform:scale(1.24)} 68%{transform:scale(0.93)} 100%{transform:scale(1)} }

/* RIPPLE on wall hit */
.ripple {
  position: absolute; border-radius: 50%; pointer-events: none;
  background: radial-gradient(circle, rgba(255,255,255,0.9) 0%, rgba(168,142,230,0.35) 55%, transparent 72%);
  animation: rippleOut 0.5s ease-out forwards;
}
@keyframes rippleOut { 0%{transform:scale(0.3);opacity:0.85} 100%{transform:scale(2.6);opacity:0} }

/* SPARKLES */
.sparkle { position: absolute; pointer-events: none; animation: sparkleFly 0.7s ease-out forwards; }
@keyframes sparkleFly { 0%{transform:translate(0,0) scale(0.4) rotate(0);opacity:1} 100%{transform:translate(var(--sx),var(--sy)) scale(1.1) rotate(140deg);opacity:0} }

/* FLOATING POINTS */
.float-pts {
  position: absolute; pointer-events: none; font-family: 'Baloo 2', cursive; font-weight: 800;
  font-size: clamp(14px,4vw,20px); color: #fff; text-shadow: 0 2px 6px rgba(0,0,0,0.25);
  animation: floatUp 0.85s ease-out forwards; z-index: 15;
}
@keyframes floatUp { 0%{transform:translate(-50%,-50%) scale(0.6);opacity:0} 25%{opacity:1;transform:translate(-50%,-60%) scale(1.05)} 100%{transform:translate(-50%,-130%) scale(1);opacity:0} }

/* OVERLAY */
.g2-overlay {
  position: absolute; inset: ${GAP}%; display: flex; flex-direction: column; align-items: center; justify-content: center;
  border-radius: 16px; z-index: 20; animation: overlayFade 0.45s ease; backdrop-filter: blur(3px);
}
@keyframes overlayFade { from{opacity:0} to{opacity:1} }
.g2-overlay.win  { background: rgba(255,248,228,0.93); }
.g2-overlay.lose { background: rgba(248,238,246,0.94); }
.overlay-emoji { font-size: 58px; margin-bottom: 6px; animation: emojiBounce 0.6s cubic-bezier(0.34,1.7,0.5,1); }
@keyframes emojiBounce { 0%{transform:scale(0) rotate(-20deg)} 60%{transform:scale(1.2) rotate(8deg)} 100%{transform:scale(1) rotate(0)} }
.overlay-title { font-family: 'Baloo 2', cursive; font-size: 36px; font-weight: 800; margin-bottom: 4px; }
.g2-overlay.win .overlay-title { color: #dca636; }
.g2-overlay.lose .overlay-title { color: #b87397; }
.overlay-sub { font-size: 14px; font-weight: 600; color: #ab9cc4; margin-bottom: 20px; text-align: center; padding: 0 20px; }
.overlay-btns { display: flex; gap: 10px; }
.overlay-btn { font-family: 'Baloo 2', cursive; font-size: 15px; font-weight: 700; padding: 12px 26px; border: none; border-radius: 13px; cursor: pointer; transition: all 0.18s cubic-bezier(0.34,1.56,0.64,1); }
.overlay-btn.primary { background: linear-gradient(135deg, #a98ee6, #8b6fd0); color: #fff; box-shadow: 0 4px 12px rgba(139,111,208,0.4); }
.overlay-btn.primary:hover { transform: translateY(-2px); }
.overlay-btn.ghost { background: rgba(255,255,255,0.8); color: #8b6fd0; border: 1.5px solid #d8c8f0; }
.overlay-btn:active { transform: scale(0.95); }

/* MILESTONE BANNER */
.milestone {
  position: fixed; top: 24px; left: 50%; transform: translateX(-50%); z-index: 200;
  font-family: 'Baloo 2', cursive; font-size: 16px; font-weight: 800; padding: 12px 28px;
  border-radius: 16px; pointer-events: none; animation: milestoneIn 2.2s ease forwards;
  background: linear-gradient(135deg, #ffe9b3, #ffd479); color: #9a6a18;
  box-shadow: 0 8px 26px rgba(218,166,54,0.4); display: flex; align-items: center; gap: 8px;
}
@keyframes milestoneIn {
  0%{transform:translateX(-50%) translateY(-30px) scale(0.8);opacity:0}
  12%{transform:translateX(-50%) translateY(0) scale(1.05);opacity:1}
  20%{transform:translateX(-50%) translateY(0) scale(1)}
  85%{opacity:1;transform:translateX(-50%) translateY(0) scale(1)}
  100%{opacity:0;transform:translateX(-50%) translateY(-16px) scale(0.95)}
}

.g2-hint { margin-top: 18px; font-family: 'Quicksand', sans-serif; font-size: 12.5px; font-weight: 600; color: #bcafd8; text-align: center; line-height: 1.7; }
.key-cap {
  display: inline-block; padding: 1px 7px; background: #fff; border: 1px solid #e6dcf6; border-radius: 6px;
  font-family: 'Baloo 2', cursive; font-size: 12px; color: #8b6fd0; box-shadow: 0 2px 0 #e6dcf6; margin: 0 1px;
}
`;

const TILE_THEME: Record<number, { bg: string; color: string; shadow: string }> = {
  2:    { bg: "#fdeef4", color: "#c081a0", shadow: "rgba(192,129,160,0.18)" },
  4:    { bg: "#fbe0ec", color: "#b8708f", shadow: "rgba(184,112,143,0.2)" },
  8:    { bg: "#f9c9e0", color: "#fff",    shadow: "rgba(232,140,185,0.35)" },
  16:   { bg: "#f4abd2", color: "#fff",    shadow: "rgba(232,120,180,0.4)" },
  32:   { bg: "#dd9ad8", color: "#fff",    shadow: "rgba(200,120,200,0.42)" },
  64:   { bg: "#bd97e0", color: "#fff",    shadow: "rgba(170,120,224,0.45)" },
  128:  { bg: "#9d8fe6", color: "#fff",    shadow: "rgba(135,120,224,0.48)" },
  256:  { bg: "#85a3ec", color: "#fff",    shadow: "rgba(110,150,232,0.5)" },
  512:  { bg: "#74bce4", color: "#fff",    shadow: "rgba(90,180,224,0.5)" },
  1024: { bg: "#6fd0c2", color: "#fff",    shadow: "rgba(90,200,184,0.52)" },
  2048: { bg: "#ffce6e", color: "#fff",    shadow: "rgba(255,196,90,0.6)" },
  4096: { bg: "#ffb066", color: "#fff",    shadow: "rgba(255,150,80,0.6)" },
  8192: { bg: "#ff8f80", color: "#fff",    shadow: "rgba(255,120,110,0.6)" },
};
const themeFor = (v: number) => TILE_THEME[v] || TILE_THEME[8192];
const fontFor = (v: number) =>
  v < 100 ? "clamp(26px,9vw,42px)" : v < 1000 ? "clamp(22px,7.5vw,36px)" : "clamp(17px,5.8vw,28px)";

let TILE_ID = 1;

interface Tile {
  id: number;
  value: number;
  row: number;
  col: number;
  isNew?: boolean;
  merged?: boolean;
}
type Dir = "up" | "down" | "left" | "right";

function emptyCells(tiles: Tile[]): [number, number][] {
  const occ = new Set(tiles.map((t) => `${t.row}-${t.col}`));
  const out: [number, number][] = [];
  for (let r = 0; r < SIZE; r++) for (let c = 0; c < SIZE; c++) if (!occ.has(`${r}-${c}`)) out.push([r, c]);
  return out;
}
function spawnTile(tiles: Tile[]): Tile[] {
  const cells = emptyCells(tiles);
  if (!cells.length) return tiles;
  const [r, c] = cells[Math.floor(Math.random() * cells.length)];
  return [...tiles, { id: TILE_ID++, value: Math.random() < 0.9 ? 2 : 4, row: r, col: c, isNew: true }];
}
function initBoard(): Tile[] {
  let t: Tile[] = [];
  t = spawnTile(t);
  t = spawnTile(t);
  return t;
}

interface MoveResult { tiles: Tile[]; moved: boolean; scoreGain: number; mergedValues: number[]; mergeCount: number; }

function move(tiles: Tile[], dir: Dir): MoveResult {
  const grid: (Tile | null)[][] = Array.from({ length: SIZE }, () => Array.from({ length: SIZE }, () => null));
  tiles.forEach((t) => { grid[t.row][t.col] = { ...t, isNew: false, merged: false }; });

  let moved = false, scoreGain = 0, mergeCount = 0;
  const mergedValues: number[] = [];

  const getLine = (i: number): (Tile | null)[] => {
    const line: (Tile | null)[] = [];
    for (let j = 0; j < SIZE; j++) {
      if (dir === "left") line.push(grid[i][j]);
      else if (dir === "right") line.push(grid[i][SIZE - 1 - j]);
      else if (dir === "up") line.push(grid[j][i]);
      else line.push(grid[SIZE - 1 - j][i]);
    }
    return line;
  };
  const setLine = (i: number, line: (Tile | null)[]) => {
    for (let j = 0; j < SIZE; j++) {
      let r: number, c: number;
      if (dir === "left") { r = i; c = j; }
      else if (dir === "right") { r = i; c = SIZE - 1 - j; }
      else if (dir === "up") { r = j; c = i; }
      else { r = SIZE - 1 - j; c = i; }
      const tile = line[j];
      if (tile) { tile.row = r; tile.col = c; }
      grid[r][c] = tile;
    }
  };

  for (let i = 0; i < SIZE; i++) {
    const line = getLine(i);
    const filled = line.filter((t): t is Tile => t !== null);
    const merged: (Tile | null)[] = [];
    let k = 0;
    while (k < filled.length) {
      if (k + 1 < filled.length && filled[k].value === filled[k + 1].value) {
        const v = filled[k].value * 2;
        merged.push({ ...filled[k], value: v, merged: true });
        scoreGain += v; mergeCount++; mergedValues.push(v);
        k += 2;
      } else { merged.push({ ...filled[k] }); k += 1; }
    }
    while (merged.length < SIZE) merged.push(null);
    for (let j = 0; j < SIZE; j++) {
      const o = line[j], n = merged[j];
      if ((o?.id ?? null) !== (n?.id ?? null)) moved = true;
    }
    setLine(i, merged);
  }

  const result: Tile[] = [];
  for (let r = 0; r < SIZE; r++) for (let c = 0; c < SIZE; c++) if (grid[r][c]) result.push(grid[r][c]!);
  return { tiles: result, moved, scoreGain, mergedValues, mergeCount };
}

function canMove(tiles: Tile[]): boolean {
  if (emptyCells(tiles).length > 0) return true;
  const g: number[][] = Array.from({ length: SIZE }, () => Array(SIZE).fill(0));
  tiles.forEach((t) => { g[t.row][t.col] = t.value; });
  for (let r = 0; r < SIZE; r++) for (let c = 0; c < SIZE; c++) {
    if (c + 1 < SIZE && g[r][c] === g[r][c + 1]) return true;
    if (r + 1 < SIZE && g[r][c] === g[r + 1][c]) return true;
  }
  return false;
}

interface Ripple { id: number; dir: Dir; }
interface SparkleFx { id: number; x: number; y: number; emoji: string; sx: number; sy: number; }
interface FloatPts { id: number; x: number; y: number; text: string; }

const COMBO_TIERS = [
  { min: 0, label: "", color: "#bcafd8" },
  { min: 2, label: "Güzel!", color: "#7ec47e" },
  { min: 4, label: "Süper!", color: "#5ab0e0" },
  { min: 6, label: "Harika!", color: "#a98ee6" },
  { min: 9, label: "Muhteşem!", color: "#e88cc0" },
  { min: 13, label: "İnanılmaz!", color: "#dca636" },
];
const comboTier = (n: number) => COMBO_TIERS.reduce((b, t) => (n >= t.min ? t : b), COMBO_TIERS[0]);

export default function Game2048() {
  const [tiles, setTiles] = useState<Tile[]>(() => initBoard());
  const [history, setHistory] = useState<{ tiles: Tile[]; score: number }[]>([]);
  const [score, setScore] = useState(0);
  const [best, setBest] = useState(() => {
    const saved = localStorage.getItem("game2048_best_score");
    return saved ? parseInt(saved, 10) : 0;
  });
  const [scorePop, setScorePop] = useState<number | null>(null);

  useEffect(() => {
    localStorage.setItem("game2048_best_score", best.toString());
  }, [best]);
  const [status, setStatus] = useState<"playing" | "won" | "lost">("playing");
  const [keepGoing, setKeepGoing] = useState(false);
  const [bump, setBump] = useState<Dir | null>(null);
  const [ripples, setRipples] = useState<Ripple[]>([]);
  const [sparkles, setSparkles] = useState<SparkleFx[]>([]);
  const [floatPts, setFloatPts] = useState<FloatPts[]>([]);
  const [combo, setCombo] = useState(0);
  const [milestone, setMilestone] = useState<string | null>(null);
  const [reachedMax, setReachedMax] = useState(2);

  const lockRef = useRef(false);
  const touchStart = useRef<{ x: number; y: number } | null>(null);
  const comboTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const tier = comboTier(combo);

  const restart = useCallback(() => {
    TILE_ID = 1;
    setTiles(initBoard());
    setHistory([]);
    setScore(0);
    setStatus("playing");
    setKeepGoing(false);
    setScorePop(null);
    setCombo(0);
    setReachedMax(2);
  }, []);

  const undo = useCallback(() => {
    if (!history.length || lockRef.current) return;
    const last = history[history.length - 1];
    setTiles(last.tiles);
    setScore(last.score);
    setHistory((h) => h.slice(0, -1));
    setStatus("playing");
    setCombo(0);
  }, [history]);

  const triggerEffects = useCallback((dir: Dir, mergedValues: number[], mergeCount: number) => {
    setBump(dir);
    setTimeout(() => setBump(null), 400);
    const rid = Date.now();
    setRipples((p) => [...p, { id: rid, dir }]);
    setTimeout(() => setRipples((p) => p.filter((r) => r.id !== rid)), 520);

    if (mergeCount >= 1) {
      const maxMerge = Math.max(...mergedValues);
      const big = maxMerge >= 64 || mergeCount >= 2;
      if (big) {
        const emojis = ["✨", "⭐", "💫", "🌟", "💜"];
        const count = Math.min(8, 3 + mergeCount + (maxMerge >= 256 ? 3 : 0));
        const fx: SparkleFx[] = [];
        for (let i = 0; i < count; i++) {
          const a = (Math.PI * 2 * i) / count + Math.random() * 0.6;
          const d = 50 + Math.random() * 55;
          fx.push({
            id: Date.now() + i, x: 50, y: 50,
            sx: Math.cos(a) * d, sy: Math.sin(a) * d,
            emoji: emojis[Math.floor(Math.random() * emojis.length)],
          });
        }
        setSparkles(fx);
        setTimeout(() => setSparkles([]), 720);
      }
    }
  }, []);

  const doMove = useCallback((dir: Dir) => {
    if (lockRef.current || status === "lost") return;
    if (status === "won" && !keepGoing) return;

    const result = move(tiles, dir);
    if (!result.moved) return;

    lockRef.current = true;
    setHistory((h) => [...h.slice(-9), { tiles, score }]);

    triggerEffects(dir, result.mergedValues, result.mergeCount);

    let newCombo = combo;
    if (result.mergeCount > 0) {
      newCombo = combo + result.mergeCount;
      setCombo(newCombo);
      if (comboTimerRef.current) clearTimeout(comboTimerRef.current);
      comboTimerRef.current = setTimeout(() => setCombo(0), 3500);
    }

    const comboBonus = newCombo >= 4 ? Math.round(result.scoreGain * (newCombo / 10)) : 0;
    const totalGain = result.scoreGain + comboBonus;

    setTiles(result.tiles);

    if (totalGain > 0) {
      setScore((s) => {
        const ns = s + totalGain;
        setBest((b) => Math.max(b, ns));
        return ns;
      });
      setScorePop(totalGain);
      setTimeout(() => setScorePop(null), 800);

      result.tiles.filter((t) => t.merged).forEach((t, i) => {
        const fid = Date.now() + i;
        const x = cellPos(t.col) + CELL / 2;
        const y = cellPos(t.row) + CELL / 2;
        setFloatPts((p) => [...p, { id: fid, x, y, text: `+${t.value}` }]);
        setTimeout(() => setFloatPts((p) => p.filter((f) => f.id !== fid)), 850);
      });
    }

    const maxVal = Math.max(...result.tiles.map((t) => t.value));
    if (maxVal > reachedMax && maxVal >= 128) {
      setReachedMax(maxVal);
      setMilestone(`${maxVal} karosu! 🎊`);
      setTimeout(() => setMilestone(null), 2200);
    } else if (maxVal > reachedMax) {
      setReachedMax(maxVal);
    }

    setTimeout(() => {
      setTiles((prev) => {
        const next = spawnTile(prev);
        if (!canMove(next)) setStatus((st) => (st === "won" && keepGoing ? st : "lost"));
        return next;
      });
      lockRef.current = false;
    }, 125);

    if (!keepGoing && result.tiles.some((t) => t.value >= 2048)) setStatus("won");
  }, [tiles, status, keepGoing, triggerEffects, combo, score, reachedMax]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const map: Record<string, Dir> = {
        ArrowUp: "up", ArrowDown: "down", ArrowLeft: "left", ArrowRight: "right",
        w: "up", s: "down", a: "left", d: "right", W: "up", S: "down", A: "left", D: "right",
      };
      if (e.key === "z" || e.key === "Z") { e.preventDefault(); undo(); return; }
      const dir = map[e.key];
      if (dir) { e.preventDefault(); doMove(dir); }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [doMove, undo]);

  const onTouchStart = (e: React.TouchEvent) => {
    const t = e.touches[0];
    touchStart.current = { x: t.clientX, y: t.clientY };
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    if (!touchStart.current) return;
    const t = e.changedTouches[0];
    const dx = t.clientX - touchStart.current.x;
    const dy = t.clientY - touchStart.current.y;
    touchStart.current = null;
    if (Math.max(Math.abs(dx), Math.abs(dy)) < 24) return;
    if (Math.abs(dx) > Math.abs(dy)) doMove(dx > 0 ? "right" : "left");
    else doMove(dy > 0 ? "down" : "up");
  };
  const onTouchCancel = () => { touchStart.current = null; };

  const rippleStyle = (dir: Dir): React.CSSProperties => {
    const b: React.CSSProperties = { width: "46%", height: "46%" };
    if (dir === "left") return { ...b, left: "-12%", top: "27%" };
    if (dir === "right") return { ...b, right: "-12%", top: "27%" };
    if (dir === "up") return { ...b, top: "-12%", left: "27%" };
    return { ...b, bottom: "-12%", left: "27%" };
  };

  const comboPct = Math.min(100, (combo / 13) * 100);

  return (
    <>
      <style>{STYLES}</style>
      {milestone && <div className="milestone">🎉 {milestone}</div>}

      <div className="g2-app">
        <div className="g2-orb" style={{ top: "-8%", left: "3%", width: 340, height: 340, background: "#f7c4dc" }} />
        <div className="g2-orb" style={{ bottom: "-12%", right: "-3%", width: 380, height: 380, background: "#c4d2f7" }} />
        <div className="g2-orb" style={{ top: "42%", left: "62%", width: 240, height: 240, background: "#dcc4f7" }} />

        <div className="g2-content">
          <div className="g2-header">
            <div>
              <div className="g2-title">2048</div>
              <div className="g2-subtitle">Aynı sayıları birleştir</div>
            </div>
            <div className="g2-scores">
              <div className="score-box">
                <div className="score-label">Puan</div>
                <div className="score-value">{score.toLocaleString("tr-TR")}</div>
                {scorePop != null && <div className="score-pop">+{scorePop}</div>}
              </div>
              <div className="score-box best">
                <div className="score-label">En İyi</div>
                <div className="score-value">{best.toLocaleString("tr-TR")}</div>
              </div>
            </div>
          </div>

          <div className="combo-strip">
            <div className="combo-label" style={{ color: tier.color }}>
              {combo >= 2 ? `${tier.label} ×${combo}` : "Kombo"}
            </div>
            <div className="combo-track">
              <div className="combo-fill" style={{ width: `${comboPct}%`, background: tier.color }} />
            </div>
          </div>

          <div className="g2-controls">
            <button className="g2-btn ghost" onClick={undo} disabled={!history.length}>↶ Geri Al</button>
            <button className="g2-btn primary" onClick={restart}>⟳ Yeni Oyun</button>
          </div>

          <div className={`board-shell${bump ? ` bump-${bump}` : ""}`}>
            <div className="grid-bg">
              {Array.from({ length: SIZE * SIZE }).map((_, i) => {
                const r = Math.floor(i / SIZE), c = i % SIZE;
                return (
                  <div key={i} className="grid-cell" style={{
                    left: `${cellPos(c)}%`, top: `${cellPos(r)}%`,
                    width: `${CELL}%`, height: `${CELL}%`,
                  }} />
                );
              })}
            </div>

            <div className="tiles-layer">
              {ripples.map((r) => <div key={r.id} className="ripple" style={rippleStyle(r.dir)} />)}

              {tiles.map((t) => {
                const th = themeFor(t.value);
                let cls = "tile";
                if (t.isNew) cls += " spawn";
                if (t.merged) cls += " merged";
                return (
                  <div key={t.id} className={cls} style={{
                    left: `${cellPos(t.col)}%`, top: `${cellPos(t.row)}%`,
                    width: `${CELL}%`, height: `${CELL}%`,
                    transition: "left 0.13s cubic-bezier(0.34,1.1,0.5,1), top 0.13s cubic-bezier(0.34,1.1,0.5,1)",
                    zIndex: t.merged ? 10 : Math.min(t.value, 9),
                  }}>
                    <div className="tile-inner" style={{
                      background: th.bg, color: th.color, fontSize: fontFor(t.value),
                      boxShadow: `0 3px 10px ${th.shadow}, inset 0 2px 4px rgba(255,255,255,0.4)`,
                    }}>
                      {t.value}
                    </div>
                  </div>
                );
              })}

              {sparkles.map((s) => (
                <span key={s.id} className="sparkle" style={{
                  left: `${s.x}%`, top: `${s.y}%`, fontSize: 17,
                  ["--sx" as string]: `${s.sx}px`, ["--sy" as string]: `${s.sy}px`,
                }}>{s.emoji}</span>
              ))}

              {floatPts.map((f) => (
                <span key={f.id} className="float-pts" style={{ left: `${f.x}%`, top: `${f.y}%` }}>{f.text}</span>
              ))}
            </div>

            {status === "won" && !keepGoing && (
              <div className="g2-overlay win">
                <div className="overlay-emoji">🎉</div>
                <div className="overlay-title">2048!</div>
                <div className="overlay-sub">Başardın! Daha büyük karolar için devam et.</div>
                <div className="overlay-btns">
                  <button className="overlay-btn primary" onClick={() => setKeepGoing(true)}>Devam Et</button>
                  <button className="overlay-btn ghost" onClick={restart}>Yeni Oyun</button>
                </div>
              </div>
            )}

            {status === "lost" && (
              <div className="g2-overlay lose">
                <div className="overlay-emoji">🍃</div>
                <div className="overlay-title">Oyun Bitti</div>
                <div className="overlay-sub">Hamle kalmadı — {score.toLocaleString("tr-TR")} puan topladın!</div>
                <div className="overlay-btns">
                  <button className="overlay-btn primary" onClick={restart}>Tekrar Oyna</button>
                  {history.length > 0 && (
                    <button className="overlay-btn ghost" onClick={undo}>↶ Geri Al</button>
                  )}
                </div>
              </div>
            )}

            <div style={{ position: "absolute", inset: 0, zIndex: 5 }} onTouchStart={onTouchStart} onTouchEnd={onTouchEnd} onTouchCancel={onTouchCancel} />
          </div>

          <div className="g2-hint">
            <span className="key-cap">↑</span><span className="key-cap">↓</span>
            <span className="key-cap">←</span><span className="key-cap">→</span>
            {" "}/ <span className="key-cap">WASD</span> ile oyna · <span className="key-cap">Z</span> geri al · mobilde kaydır
          </div>
        </div>
      </div>
    </>
  );
}

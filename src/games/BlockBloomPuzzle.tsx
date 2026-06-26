import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";

type Cell = {
  filled: boolean;
  color?: string;
  shine?: boolean;
};

type Point = { x: number; y: number };

type Shape = {
  id: string;
  name: string;
  cells: Point[];
  color: string;
  accent: string;
  rarity: "soft" | "bright" | "rare" | "legend";
};

type Piece = Shape & {
  uid: string;
};

type ThemeKey = "aurora" | "sunset" | "midnight" | "garden";
type ModeKey = "classic" | "zen" | "rush";
type Screen = "menu" | "play" | "settings" | "stats" | "how";

type Settings = {
  theme: ThemeKey;
  music: boolean;
  sfx: boolean;
  haptics: boolean;
  reducedMotion: boolean;
};

type Stats = {
  games: number;
  best: number;
  totalScore: number;
  totalClears: number;
  biggestCombo: number;
  dailyStreak: number;
  lastDaily?: string;
};

type GameSnapshot = {
  board: Cell[][];
  pieces: (Piece | null)[];
  score: number;
  combo: number;
  moves: number;
  tools: Tools;
  mode: ModeKey;
  seed: number;
  seconds: number;
};

type Tools = {
  hammer: number;
  shuffle: number;
  undo: number;
};

const BOARD_SIZE = 10;
const CELL_GAP = 6;
const STORAGE_SETTINGS = "block-bloom-settings-v1";
const STORAGE_STATS = "block-bloom-stats-v1";
const STORAGE_SAVE = "block-bloom-save-v1";

const DEFAULT_SETTINGS: Settings = {
  theme: "aurora",
  music: true,
  sfx: true,
  haptics: true,
  reducedMotion: false,
};

const DEFAULT_STATS: Stats = {
  games: 0,
  best: 0,
  totalScore: 0,
  totalClears: 0,
  biggestCombo: 0,
  dailyStreak: 0,
};

const THEMES: Record<ThemeKey, {
  title: string;
  subtitle: string;
  bg: string;
  panel: string;
  panelStrong: string;
  text: string;
  muted: string;
  grid: string;
  board: string;
  glow: string;
  button: string;
  danger: string;
}> = {
  aurora: {
    title: "Aurora Glass",
    subtitle: "Derin mavi, mor ışıklar ve cam bloklar",
    bg: "radial-gradient(circle at 18% 18%, rgba(125, 92, 255, .35), transparent 26%), radial-gradient(circle at 83% 14%, rgba(78, 211, 255, .28), transparent 26%), linear-gradient(145deg, #0b1022 0%, #101a31 46%, #061221 100%)",
    panel: "rgba(14, 23, 43, .74)",
    panelStrong: "rgba(16, 27, 54, .92)",
    text: "#f5f8ff",
    muted: "#aab6d7",
    grid: "rgba(255,255,255,.065)",
    board: "rgba(4, 9, 22, .55)",
    glow: "rgba(112, 194, 255, .38)",
    button: "linear-gradient(135deg, #7c5cff, #30d5ff)",
    danger: "#ff6a8b",
  },
  sunset: {
    title: "Coral Sunset",
    subtitle: "Sıcak, neşeli ve mobil casual hissi",
    bg: "radial-gradient(circle at 18% 22%, rgba(255, 178, 92, .45), transparent 28%), radial-gradient(circle at 78% 18%, rgba(255, 94, 146, .3), transparent 28%), linear-gradient(145deg, #22111b 0%, #3a1c2b 48%, #201728 100%)",
    panel: "rgba(50, 24, 39, .74)",
    panelStrong: "rgba(60, 27, 44, .92)",
    text: "#fff7f4",
    muted: "#f0bdc4",
    grid: "rgba(255,237,223,.08)",
    board: "rgba(32, 13, 24, .58)",
    glow: "rgba(255, 159, 98, .38)",
    button: "linear-gradient(135deg, #ff8d55, #ff4f9a)",
    danger: "#ffdb70",
  },
  midnight: {
    title: "Midnight Neon",
    subtitle: "Koyu arcade, neon çizgiler ve yüksek kontrast",
    bg: "radial-gradient(circle at 20% 15%, rgba(0, 255, 205, .2), transparent 30%), radial-gradient(circle at 80% 20%, rgba(149, 0, 255, .28), transparent 30%), linear-gradient(145deg, #05050c 0%, #0f1020 50%, #030817 100%)",
    panel: "rgba(6, 10, 24, .78)",
    panelStrong: "rgba(8, 12, 29, .94)",
    text: "#f9fbff",
    muted: "#98a4c2",
    grid: "rgba(0,255,213,.075)",
    board: "rgba(0,0,0,.52)",
    glow: "rgba(0, 255, 213, .28)",
    button: "linear-gradient(135deg, #00f0ca, #7b5cff)",
    danger: "#ff477e",
  },
  garden: {
    title: "Zen Garden",
    subtitle: "Yeşil, krem, doğal ve rahatlatıcı",
    bg: "radial-gradient(circle at 20% 20%, rgba(168, 222, 132, .32), transparent 28%), radial-gradient(circle at 80% 10%, rgba(255, 218, 149, .25), transparent 30%), linear-gradient(145deg, #0d1d19 0%, #163328 50%, #10211c 100%)",
    panel: "rgba(18, 42, 34, .74)",
    panelStrong: "rgba(18, 48, 38, .92)",
    text: "#f4fff5",
    muted: "#b5d5c3",
    grid: "rgba(245,255,235,.075)",
    board: "rgba(9, 23, 18, .58)",
    glow: "rgba(169, 229, 142, .34)",
    button: "linear-gradient(135deg, #8fdc69, #21b7a8)",
    danger: "#ffd36c",
  },
};

const PALETTE = [
  ["#70d6ff", "#2a90ff"],
  ["#ff70a6", "#ff377d"],
  ["#ffd670", "#ff9f1c"],
  ["#95f985", "#23c96b"],
  ["#c77dff", "#7b2cff"],
  ["#ff9671", "#ff5d47"],
  ["#64dfdf", "#00a7b5"],
  ["#f2f7a1", "#c4d31f"],
];

const BASE_SHAPES: Omit<Shape, "color" | "accent" | "rarity">[] = [
  { id: "single", name: "Spark", cells: [{ x: 0, y: 0 }] },
  { id: "duo-h", name: "Duo", cells: [{ x: 0, y: 0 }, { x: 1, y: 0 }] },
  { id: "duo-v", name: "Duo", cells: [{ x: 0, y: 0 }, { x: 0, y: 1 }] },
  { id: "tri-h", name: "Line", cells: [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 2, y: 0 }] },
  { id: "tri-v", name: "Line", cells: [{ x: 0, y: 0 }, { x: 0, y: 1 }, { x: 0, y: 2 }] },
  { id: "quad-h", name: "Beam", cells: [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 2, y: 0 }, { x: 3, y: 0 }] },
  { id: "quad-v", name: "Beam", cells: [{ x: 0, y: 0 }, { x: 0, y: 1 }, { x: 0, y: 2 }, { x: 0, y: 3 }] },
  { id: "five-h", name: "Ray", cells: [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 2, y: 0 }, { x: 3, y: 0 }, { x: 4, y: 0 }] },
  { id: "five-v", name: "Ray", cells: [{ x: 0, y: 0 }, { x: 0, y: 1 }, { x: 0, y: 2 }, { x: 0, y: 3 }, { x: 0, y: 4 }] },
  { id: "sq2", name: "Bloom", cells: [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 0, y: 1 }, { x: 1, y: 1 }] },
  { id: "l3-a", name: "Corner", cells: [{ x: 0, y: 0 }, { x: 0, y: 1 }, { x: 1, y: 1 }] },
  { id: "l3-b", name: "Corner", cells: [{ x: 1, y: 0 }, { x: 1, y: 1 }, { x: 0, y: 1 }] },
  { id: "l3-c", name: "Corner", cells: [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 0, y: 1 }] },
  { id: "l3-d", name: "Corner", cells: [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 1, y: 1 }] },
  { id: "l4-a", name: "Hook", cells: [{ x: 0, y: 0 }, { x: 0, y: 1 }, { x: 0, y: 2 }, { x: 1, y: 2 }] },
  { id: "l4-b", name: "Hook", cells: [{ x: 1, y: 0 }, { x: 1, y: 1 }, { x: 1, y: 2 }, { x: 0, y: 2 }] },
  { id: "l4-c", name: "Hook", cells: [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 2, y: 0 }, { x: 0, y: 1 }] },
  { id: "l4-d", name: "Hook", cells: [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 2, y: 0 }, { x: 2, y: 1 }] },
  { id: "t4", name: "Crown", cells: [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 2, y: 0 }, { x: 1, y: 1 }] },
  { id: "t4b", name: "Crown", cells: [{ x: 1, y: 0 }, { x: 0, y: 1 }, { x: 1, y: 1 }, { x: 2, y: 1 }] },
  { id: "t4c", name: "Crown", cells: [{ x: 0, y: 0 }, { x: 0, y: 1 }, { x: 0, y: 2 }, { x: 1, y: 1 }] },
  { id: "t4d", name: "Crown", cells: [{ x: 1, y: 0 }, { x: 1, y: 1 }, { x: 1, y: 2 }, { x: 0, y: 1 }] },
  { id: "z4", name: "Ribbon", cells: [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 1, y: 1 }, { x: 2, y: 1 }] },
  { id: "s4", name: "Ribbon", cells: [{ x: 1, y: 0 }, { x: 2, y: 0 }, { x: 0, y: 1 }, { x: 1, y: 1 }] },
  { id: "plus", name: "Star", cells: [{ x: 1, y: 0 }, { x: 0, y: 1 }, { x: 1, y: 1 }, { x: 2, y: 1 }, { x: 1, y: 2 }] },
  { id: "big-l", name: "Monolith", cells: [{ x: 0, y: 0 }, { x: 0, y: 1 }, { x: 0, y: 2 }, { x: 0, y: 3 }, { x: 1, y: 3 }] },
  { id: "step", name: "Steps", cells: [{ x: 0, y: 0 }, { x: 0, y: 1 }, { x: 1, y: 1 }, { x: 1, y: 2 }, { x: 2, y: 2 }] },
  { id: "u", name: "Cup", cells: [{ x: 0, y: 0 }, { x: 2, y: 0 }, { x: 0, y: 1 }, { x: 1, y: 1 }, { x: 2, y: 1 }] },
  { id: "dot-square", name: "Frame", cells: [{ x: 0, y: 0 }, { x: 2, y: 0 }, { x: 0, y: 2 }, { x: 2, y: 2 }] },
];

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a += 0x6D2B79F5;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function todayKey() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function hashString(input: string) {
  let h = 2166136261;
  for (let i = 0; i < input.length; i += 1) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function emptyBoard(): Cell[][] {
  return Array.from({ length: BOARD_SIZE }, () =>
    Array.from({ length: BOARD_SIZE }, () => ({ filled: false }))
  );
}

function cloneBoard(board: Cell[][]): Cell[][] {
  return board.map((row) => row.map((cell) => ({ ...cell })));
}

function shapeBounds(cells: Point[]) {
  const maxX = Math.max(...cells.map((c) => c.x));
  const maxY = Math.max(...cells.map((c) => c.y));
  const minX = Math.min(...cells.map((c) => c.x));
  const minY = Math.min(...cells.map((c) => c.y));
  return { width: maxX - minX + 1, height: maxY - minY + 1, minX, minY };
}

function normalizeCells(cells: Point[]) {
  const minX = Math.min(...cells.map((c) => c.x));
  const minY = Math.min(...cells.map((c) => c.y));
  return cells.map((c) => ({ x: c.x - minX, y: c.y - minY })).sort((a, b) => a.y - b.y || a.x - b.x);
}

function rotatePiece(piece: Piece): Piece {
  const rotated = piece.cells.map((c) => ({ x: c.y, y: -c.x }));
  return { ...piece, uid: `${piece.uid}-r`, cells: normalizeCells(rotated) };
}

function randomPiece(seedRand: () => number, difficulty = 0): Piece {
  const weightedPool = BASE_SHAPES.flatMap((shape) => {
    const size = shape.cells.length;
    let weight = 1;
    if (size <= 2) weight = 7;
    if (size === 3) weight = 8;
    if (size === 4) weight = 7 + Math.floor(difficulty / 6);
    if (size >= 5) weight = 3 + Math.floor(difficulty / 4);
    if (["plus", "big-l", "step", "u"].includes(shape.id)) weight += Math.floor(difficulty / 5);
    return Array.from({ length: weight }, () => shape);
  });
  const base = weightedPool[Math.floor(seedRand() * weightedPool.length)];
  const [color, accent] = PALETTE[Math.floor(seedRand() * PALETTE.length)];
  const size = base.cells.length;
  const rarity = size <= 2 ? "soft" : size === 3 ? "bright" : size === 4 ? "rare" : "legend";
  return {
    ...base,
    cells: normalizeCells(base.cells),
    color,
    accent,
    rarity,
    uid: `${base.id}-${Date.now().toString(36)}-${Math.floor(seedRand() * 999999).toString(36)}`,
  };
}

function canPlace(board: Cell[][], piece: Piece, row: number, col: number) {
  return piece.cells.every(({ x, y }) => {
    const r = row + y;
    const c = col + x;
    return r >= 0 && r < BOARD_SIZE && c >= 0 && c < BOARD_SIZE && !board[r][c].filled;
  });
}

function hasMove(board: Cell[][], piece: Piece | null) {
  if (!piece) return false;
  for (let r = 0; r < BOARD_SIZE; r += 1) {
    for (let c = 0; c < BOARD_SIZE; c += 1) {
      if (canPlace(board, piece, r, c)) return true;
    }
  }
  return false;
}

function anyMove(board: Cell[][], pieces: (Piece | null)[]) {
  return pieces.some((piece) => hasMove(board, piece));
}

function placePiece(board: Cell[][], piece: Piece, row: number, col: number) {
  const next = cloneBoard(board);
  piece.cells.forEach(({ x, y }) => {
    next[row + y][col + x] = {
      filled: true,
      color: piece.color,
      shine: piece.rarity === "rare" || piece.rarity === "legend",
    };
  });
  return next;
}

function clearLines(board: Cell[][]) {
  const rows: number[] = [];
  const cols: number[] = [];

  for (let r = 0; r < BOARD_SIZE; r += 1) {
    if (board[r].every((cell) => cell.filled)) rows.push(r);
  }
  for (let c = 0; c < BOARD_SIZE; c += 1) {
    let full = true;
    for (let r = 0; r < BOARD_SIZE; r += 1) {
      if (!board[r][c].filled) {
        full = false;
        break;
      }
    }
    if (full) cols.push(c);
  }

  if (!rows.length && !cols.length) {
    return { board, rows, cols, cleared: 0 };
  }

  const next = cloneBoard(board);
  rows.forEach((r) => {
    for (let c = 0; c < BOARD_SIZE; c += 1) next[r][c] = { filled: false };
  });
  cols.forEach((c) => {
    for (let r = 0; r < BOARD_SIZE; r += 1) next[r][c] = { filled: false };
  });

  const clearedSet = new Set<string>();
  rows.forEach((r) => {
    for (let c = 0; c < BOARD_SIZE; c += 1) clearedSet.add(`${r},${c}`);
  });
  cols.forEach((c) => {
    for (let r = 0; r < BOARD_SIZE; r += 1) clearedSet.add(`${r},${c}`);
  });

  return { board: next, rows, cols, cleared: clearedSet.size };
}

function loadJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return { ...fallback, ...JSON.parse(raw) } as T;
  } catch {
    return fallback;
  }
}

function saveJson(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // ignored intentionally
  }
}

function formatTime(total: number) {
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

function createAudio() {
  const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  if (!Ctx) return null;
  const ctx = new Ctx();
  const master = ctx.createGain();
  master.gain.value = 0.045;
  master.connect(ctx.destination);
  let interval: number | undefined;

  const playTone = (freq: number, duration = 0.18, gain = 0.08, type: OscillatorType = "sine") => {
    const osc = ctx.createOscillator();
    const vol = ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    vol.gain.value = 0;
    osc.connect(vol);
    vol.connect(master);
    const t = ctx.currentTime;
    vol.gain.linearRampToValueAtTime(gain, t + 0.018);
    vol.gain.exponentialRampToValueAtTime(0.001, t + duration);
    osc.start(t);
    osc.stop(t + duration + 0.03);
  };

  const startAmbient = () => {
    if (interval) return;
    const notes = [261.63, 329.63, 392.0, 493.88, 587.33, 659.25];
    let i = 0;
    interval = window.setInterval(() => {
      const note = notes[i % notes.length] * (i % 3 === 0 ? 0.5 : 1);
      playTone(note, 1.35, 0.035, "sine");
      if (i % 4 === 0) playTone(note * 1.5, 1.1, 0.018, "triangle");
      i += 1;
    }, 1450);
  };

  const stopAmbient = () => {
    if (interval) window.clearInterval(interval);
    interval = undefined;
  };

  return { ctx, playTone, startAmbient, stopAmbient, master };
}

function MiniPiece({ piece, tiny = false, disabled = false }: { piece: Piece; tiny?: boolean; disabled?: boolean }) {
  const bounds = shapeBounds(piece.cells);
  const size = tiny ? 10 : 18;
  return (
    <div
      className="bb-mini-piece"
      style={{
        width: bounds.width * size + (bounds.width - 1) * 3,
        height: bounds.height * size + (bounds.height - 1) * 3,
        opacity: disabled ? 0.45 : 1,
      }}
    >
      {piece.cells.map((cell, index) => (
        <span
          key={`${cell.x}-${cell.y}-${index}`}
          style={{
            width: size,
            height: size,
            left: cell.x * (size + 3),
            top: cell.y * (size + 3),
            background: `linear-gradient(145deg, ${piece.color}, ${piece.accent})`,
            boxShadow: `0 6px 14px ${piece.accent}44, inset 0 1px 0 rgba(255,255,255,.55)`,
          }}
        />
      ))}
    </div>
  );
}

export default function BlockBloomPuzzle() {
  const [settings, setSettings] = useState<Settings>(() => loadJson(STORAGE_SETTINGS, DEFAULT_SETTINGS));
  const [stats, setStats] = useState<Stats>(() => loadJson(STORAGE_STATS, DEFAULT_STATS));
  const [screen, setScreen] = useState<Screen>("menu");
  const [mode, setMode] = useState<ModeKey>("classic");
  const [board, setBoard] = useState<Cell[][]>(() => emptyBoard());
  const [pieces, setPieces] = useState<(Piece | null)[]>([null, null, null]);
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [moves, setMoves] = useState(0);
  const [seconds, setSeconds] = useState(0);
  const [paused, setPaused] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [selected, setSelected] = useState<number | null>(null);
  const [hoverCell, setHoverCell] = useState<{ row: number; col: number } | null>(null);
  const [clearing, setClearing] = useState<Set<string>>(new Set());
  const [shake, setShake] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [tools, setTools] = useState<Tools>({ hammer: 1, shuffle: 1, undo: 2 });
  const [hammerMode, setHammerMode] = useState(false);
  const [hint, setHint] = useState<{ row: number; col: number; index: number } | null>(null);
  const [history, setHistory] = useState<GameSnapshot[]>([]);
  const [seed, setSeed] = useState(() => Math.floor(Math.random() * 900000) + 1000);
  const [dailyClaimed, setDailyClaimed] = useState(false);
  const boardRef = useRef<HTMLDivElement | null>(null);
  const audioRef = useRef<ReturnType<typeof createAudio> | null>(null);
  const rngRef = useRef<() => number>(mulberry32(seed));
  const theme = THEMES[settings.theme];

  const running = screen === "play" && !paused && !gameOver;
  const rushLeft = mode === "rush" ? Math.max(0, 180 - seconds) : null;
  const scoreTarget = mode === "rush" ? 2500 : mode === "zen" ? 1200 : 1800;
  const progress = clamp((score / scoreTarget) * 100, 0, 100);

  const cssVars = useMemo(() => ({
    "--bb-bg": theme.bg,
    "--bb-panel": theme.panel,
    "--bb-panel-strong": theme.panelStrong,
    "--bb-text": theme.text,
    "--bb-muted": theme.muted,
    "--bb-grid": theme.grid,
    "--bb-board": theme.board,
    "--bb-glow": theme.glow,
    "--bb-button": theme.button,
    "--bb-danger": theme.danger,
  } as React.CSSProperties), [theme]);

  const showToast = useCallback((message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(null), 1700);
  }, []);

  const vibrate = useCallback((pattern: number | number[] = 20) => {
    if (settings.haptics && navigator.vibrate) navigator.vibrate(pattern);
  }, [settings.haptics]);

  const playSfx = useCallback((kind: "tap" | "place" | "clear" | "bad" | "win") => {
    if (!settings.sfx) return;
    if (!audioRef.current) audioRef.current = createAudio();
    const audio = audioRef.current;
    if (!audio) return;
    if (audio.ctx.state === "suspended") audio.ctx.resume();
    if (kind === "tap") audio.playTone(520, 0.08, 0.035, "triangle");
    if (kind === "place") audio.playTone(392, 0.12, 0.05, "sine");
    if (kind === "clear") {
      audio.playTone(659, 0.16, 0.06, "triangle");
      window.setTimeout(() => audio.playTone(880, 0.2, 0.05, "sine"), 80);
    }
    if (kind === "bad") audio.playTone(130, 0.16, 0.06, "sawtooth");
    if (kind === "win") {
      [523, 659, 784, 1046].forEach((n, i) => window.setTimeout(() => audio.playTone(n, 0.18, 0.055, "triangle"), i * 90));
    }
  }, [settings.sfx]);

  const generatePieces = useCallback((difficulty = Math.floor(score / 850)): Piece[] => {
    const rand = rngRef.current;
    return [randomPiece(rand, difficulty), randomPiece(rand, difficulty), randomPiece(rand, difficulty)];
  }, [score]);

  const startNewGame = useCallback((nextMode: ModeKey = mode, daily = false) => {
    const nextSeed = daily ? hashString(`block-bloom-${todayKey()}`) : Math.floor(Math.random() * 900000000);
    rngRef.current = mulberry32(nextSeed);
    const initialPieces = [randomPiece(rngRef.current, 0), randomPiece(rngRef.current, 0), randomPiece(rngRef.current, 0)];
    setSeed(nextSeed);
    setMode(nextMode);
    setBoard(emptyBoard());
    setPieces(initialPieces);
    setScore(0);
    setCombo(0);
    setMoves(0);
    setSeconds(0);
    setPaused(false);
    setGameOver(false);
    setSelected(null);
    setHoverCell(null);
    setClearing(new Set());
    setTools({ hammer: nextMode === "zen" ? 3 : 1, shuffle: nextMode === "zen" ? 2 : 1, undo: nextMode === "rush" ? 1 : 2 });
    setHammerMode(false);
    setHint(null);
    setHistory([]);
    setDailyClaimed(daily);
    setScreen("play");
    playSfx("tap");
    vibrate(15);
  }, [mode, playSfx, vibrate]);

  useEffect(() => {
    saveJson(STORAGE_SETTINGS, settings);
  }, [settings]);

  useEffect(() => {
    saveJson(STORAGE_STATS, stats);
  }, [stats]);

  useEffect(() => {
    if (!running) return;
    const id = window.setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => window.clearInterval(id);
  }, [running]);

  useEffect(() => {
    if (mode === "rush" && rushLeft === 0 && screen === "play" && !gameOver) {
      endGame(true);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rushLeft, mode, screen, gameOver]);

  useEffect(() => {
    if (!settings.music || screen !== "play" || paused || gameOver) {
      audioRef.current?.stopAmbient();
      return;
    }
    if (!audioRef.current) audioRef.current = createAudio();
    const audio = audioRef.current;
    if (!audio) return;
    if (audio.ctx.state === "suspended") return;
    audio.startAmbient();
    return () => audio.stopAmbient();
  }, [settings.music, screen, paused, gameOver]);

  useEffect(() => {
    if (screen !== "play" || gameOver) return;
    const snapshot: GameSnapshot = { board, pieces, score, combo, moves, tools, mode, seed, seconds };
    saveJson(STORAGE_SAVE, snapshot);
  }, [board, pieces, score, combo, moves, tools, mode, seed, seconds, screen, gameOver]);

  useEffect(() => {
    if (pieces.some(Boolean) && !anyMove(board, pieces) && !hammerMode && !gameOver) {
      const id = window.setTimeout(() => endGame(false), 450);
      return () => window.clearTimeout(id);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [board, pieces, hammerMode, gameOver]);

  const endGame = useCallback((timeUp = false) => {
    setGameOver(true);
    playSfx(score > stats.best ? "win" : "bad");
    vibrate(score > stats.best ? [30, 40, 30] : 35);
    setStats((old) => {
      const key = todayKey();
      let streak = old.dailyStreak;
      if (dailyClaimed && old.lastDaily !== key) streak += 1;
      return {
        ...old,
        games: old.games + 1,
        best: Math.max(old.best, score),
        totalScore: old.totalScore + score,
        biggestCombo: Math.max(old.biggestCombo, combo),
        dailyStreak: streak,
        lastDaily: dailyClaimed ? key : old.lastDaily,
      };
    });
    showToast(timeUp ? "Süre doldu" : "Hamle kalmadı");
  }, [combo, dailyClaimed, playSfx, score, showToast, stats.best, vibrate]);

  const pushHistory = useCallback(() => {
    setHistory((old) => [
      { board: cloneBoard(board), pieces: pieces.map((p) => p ? { ...p, cells: [...p.cells] } : null), score, combo, moves, tools, mode, seed, seconds },
      ...old,
    ].slice(0, 8));
  }, [board, combo, mode, moves, pieces, score, seconds, seed, tools]);

  const calculatePlacementScore = useCallback((piece: Piece, cleared: number, lines: number, currentCombo: number) => {
    const base = piece.cells.length * 12;
    const lineBonus = cleared > 0 ? cleared * 7 + lines * lines * 70 : 0;
    const comboBonus = currentCombo > 1 ? currentCombo * 45 : 0;
    const modeBonus = mode === "rush" ? Math.floor((base + lineBonus) * 0.18) : 0;
    return base + lineBonus + comboBonus + modeBonus;
  }, [mode]);

  const commitPlacement = useCallback((pieceIndex: number, row: number, col: number) => {
    const piece = pieces[pieceIndex];
    if (!piece || !canPlace(board, piece, row, col) || gameOver || paused) {
      setShake(true);
      window.setTimeout(() => setShake(false), 280);
      playSfx("bad");
      vibrate(30);
      return;
    }
    pushHistory();
    const afterPlace = placePiece(board, piece, row, col);
    const clear = clearLines(afterPlace);
    const lines = clear.rows.length + clear.cols.length;
    const nextCombo = lines > 0 ? combo + 1 : 0;
    const gained = calculatePlacementScore(piece, clear.cleared, lines, nextCombo);
    const nextPieces = pieces.slice();
    nextPieces[pieceIndex] = null;
    const refilled = nextPieces.every((p) => p === null) ? generatePieces(Math.floor((score + gained) / 850)) : nextPieces;

    setBoard(clear.board);
    setPieces(refilled);
    setScore((s) => s + gained);
    setCombo(nextCombo);
    setMoves((m) => m + 1);
    setSelected(null);
    setHoverCell(null);
    setHint(null);
    setHammerMode(false);
    playSfx(lines > 0 ? "clear" : "place");
    vibrate(lines > 0 ? [15, 25, 15] : 12);

    if (clear.cleared) {
      const clearKeys = new Set<string>();
      clear.rows.forEach((r) => Array.from({ length: BOARD_SIZE }, (_, c) => clearKeys.add(`${r},${c}`)));
      clear.cols.forEach((c) => Array.from({ length: BOARD_SIZE }, (_, r) => clearKeys.add(`${r},${c}`)));
      setClearing(clearKeys);
      window.setTimeout(() => setClearing(new Set()), settings.reducedMotion ? 80 : 420);
      setStats((old) => ({ ...old, totalClears: old.totalClears + clear.cleared, biggestCombo: Math.max(old.biggestCombo, nextCombo) }));
      if (lines >= 3) showToast(`Harika! ${lines} çizgi temizlendi`);
      else if (nextCombo >= 3) showToast(`${nextCombo}x kombo`);
    }

    if ((score + gained) > 0 && Math.floor((score + gained) / 1400) > Math.floor(score / 1400)) {
      setTools((old) => ({ ...old, hammer: old.hammer + 1 }));
      showToast("Yeni çekiç kazandın");
    }
  }, [board, calculatePlacementScore, combo, gameOver, generatePieces, paused, pieces, playSfx, pushHistory, score, settings.reducedMotion, showToast, vibrate]);

  const cellFromEvent = useCallback((clientX: number, clientY: number, piece?: Piece | null) => {
    const el = boardRef.current;
    if (!el) return null;
    const rect = el.getBoundingClientRect();
    const cellSize = (rect.width - CELL_GAP * (BOARD_SIZE - 1)) / BOARD_SIZE;
    const offsetX = clientX - rect.left;
    const offsetY = clientY - rect.top;
    const col = Math.floor(offsetX / (cellSize + CELL_GAP));
    const row = Math.floor(offsetY / (cellSize + CELL_GAP));
    if (row < 0 || row >= BOARD_SIZE || col < 0 || col >= BOARD_SIZE) return null;
    if (!piece) return { row, col };
    const bounds = shapeBounds(piece.cells);
    return {
      row: clamp(row - Math.floor(bounds.height / 2), 0, BOARD_SIZE - bounds.height),
      col: clamp(col - Math.floor(bounds.width / 2), 0, BOARD_SIZE - bounds.width),
    };
  }, []);

  const onBoardPointerMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (selected === null || !pieces[selected]) return;
    const cell = cellFromEvent(e.clientX, e.clientY, pieces[selected]);
    setHoverCell(cell);
  }, [cellFromEvent, pieces, selected]);

  const onBoardPointerUp = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (hammerMode) {
      const cell = cellFromEvent(e.clientX, e.clientY);
      if (!cell) return;
      if (!board[cell.row][cell.col].filled) {
        playSfx("bad");
        showToast("Çekiç dolu hücrede kullanılır");
        return;
      }
      if (tools.hammer <= 0) return;
      pushHistory();
      const next = cloneBoard(board);
      next[cell.row][cell.col] = { filled: false };
      setBoard(next);
      setTools((old) => ({ ...old, hammer: old.hammer - 1 }));
      setHammerMode(false);
      setScore((s) => Math.max(0, s - 25));
      playSfx("clear");
      vibrate([15, 25]);
      return;
    }
    if (selected === null || !pieces[selected]) return;
    const cell = cellFromEvent(e.clientX, e.clientY, pieces[selected]);
    if (!cell) return;
    commitPlacement(selected, cell.row, cell.col);
  }, [board, cellFromEvent, commitPlacement, hammerMode, pieces, playSfx, pushHistory, selected, showToast, tools.hammer, vibrate]);

  const onPiecePointerDown = useCallback((index: number, e: React.PointerEvent<HTMLButtonElement>) => {
    e.currentTarget.setPointerCapture?.(e.pointerId);
    if (!pieces[index]) return;
    setHammerMode(false);
    setSelected(index);
    setHint(null);
    playSfx("tap");
    vibrate(8);
  }, [pieces, playSfx, vibrate]);

  const onPiecePointerMove = useCallback((index: number, e: React.PointerEvent<HTMLButtonElement>) => {
    if (selected !== index || !pieces[index]) return;
    const cell = cellFromEvent(e.clientX, e.clientY, pieces[index]);
    setHoverCell(cell);
  }, [cellFromEvent, pieces, selected]);

  const onPiecePointerUp = useCallback((index: number, e: React.PointerEvent<HTMLButtonElement>) => {
    if (selected !== index || !pieces[index]) return;
    const cell = cellFromEvent(e.clientX, e.clientY, pieces[index]);
    if (cell) commitPlacement(index, cell.row, cell.col);
  }, [cellFromEvent, commitPlacement, pieces, selected]);

  const selectPiece = useCallback((index: number) => {
    if (!pieces[index]) return;
    setSelected((old) => old === index ? null : index);
    setHammerMode(false);
    setHint(null);
    playSfx("tap");
  }, [pieces, playSfx]);

  const boardPreview = useMemo(() => {
    if (selected === null || !hoverCell || !pieces[selected]) return new Set<string>();
    const piece = pieces[selected];
    return new Set(piece.cells.map(({ x, y }) => `${hoverCell.row + y},${hoverCell.col + x}`));
  }, [hoverCell, pieces, selected]);

  const isPreviewValid = useMemo(() => {
    if (selected === null || !hoverCell || !pieces[selected]) return false;
    return canPlace(board, pieces[selected]!, hoverCell.row, hoverCell.col);
  }, [board, hoverCell, pieces, selected]);

  const useHint = useCallback(() => {
    for (let i = 0; i < pieces.length; i += 1) {
      const piece = pieces[i];
      if (!piece) continue;
      for (let r = 0; r < BOARD_SIZE; r += 1) {
        for (let c = 0; c < BOARD_SIZE; c += 1) {
          if (canPlace(board, piece, r, c)) {
            setHint({ row: r, col: c, index: i });
            setSelected(i);
            showToast(`${piece.name} için uygun yer gösterildi`);
            playSfx("tap");
            return;
          }
        }
      }
    }
    showToast("Uygun hamle yok");
    playSfx("bad");
  }, [board, pieces, playSfx, showToast]);

  const shufflePieces = useCallback(() => {
    if (tools.shuffle <= 0) return;
    pushHistory();
    setPieces(generatePieces(Math.floor(score / 850)));
    setTools((old) => ({ ...old, shuffle: old.shuffle - 1 }));
    setSelected(null);
    setHint(null);
    playSfx("clear");
    vibrate([10, 20, 10]);
  }, [generatePieces, playSfx, pushHistory, score, tools.shuffle, vibrate]);

  const undo = useCallback(() => {
    if (tools.undo <= 0 || history.length === 0) return;
    const [last, ...rest] = history;
    setBoard(last.board);
    setPieces(last.pieces);
    setScore(last.score);
    setCombo(last.combo);
    setMoves(last.moves);
    setMode(last.mode);
    setSeed(last.seed);
    setSeconds(last.seconds);
    setTools((old) => ({ ...last.tools, undo: Math.max(0, old.undo - 1) }));
    setHistory(rest);
    setSelected(null);
    setHint(null);
    setHammerMode(false);
    playSfx("tap");
  }, [history, playSfx, tools.undo]);

  const rotateSelected = useCallback(() => {
    if (selected === null || !pieces[selected]) return;
    pushHistory();
    setPieces((old) => old.map((p, i) => i === selected && p ? rotatePiece(p) : p));
    playSfx("tap");
  }, [pieces, playSfx, pushHistory, selected]);

  const resumeSaved = useCallback(() => {
    try {
      const raw = localStorage.getItem(STORAGE_SAVE);
      if (!raw) return false;
      const save = JSON.parse(raw) as GameSnapshot;
      setBoard(save.board);
      setPieces(save.pieces);
      setScore(save.score);
      setCombo(save.combo);
      setMoves(save.moves);
      setMode(save.mode);
      setSeed(save.seed);
      rngRef.current = mulberry32(save.seed + save.moves + save.score);
      setSeconds(save.seconds);
      setTools(save.tools);
      setPaused(false);
      setGameOver(false);
      setScreen("play");
      setSelected(null);
      setHint(null);
      return true;
    } catch {
      return false;
    }
  }, []);

  const clearProgress = useCallback(() => {
    localStorage.removeItem(STORAGE_SAVE);
    setStats(DEFAULT_STATS);
    saveJson(STORAGE_STATS, DEFAULT_STATS);
    showToast("İstatistikler sıfırlandı");
  }, [showToast]);

  const averageScore = stats.games ? Math.round(stats.totalScore / stats.games) : 0;
  const activePiece = selected !== null ? pieces[selected] : null;

  return (
    <div className={`bb-root ${settings.reducedMotion ? "bb-reduced" : ""}`} style={cssVars}>
      <style>{CSS}</style>
      <div className="bb-orb bb-orb-a" />
      <div className="bb-orb bb-orb-b" />
      <div className="bb-noise" />

      {toast && <div className="bb-toast">{toast}</div>}

      <main className="bb-shell">
        <header className="bb-topbar">
          <button className="bb-brand" onClick={() => setScreen("menu")} aria-label="Ana menü">
            <span className="bb-logo-mark"><i /><i /><i /></span>
            <span>
              <strong>Block Bloom</strong>
              <small>Endless Puzzle</small>
            </span>
          </button>
          <div className="bb-top-actions">
            <button className="bb-icon-btn" onClick={() => setScreen("how")}>Nasıl?</button>
            <button className="bb-icon-btn" onClick={() => setScreen("stats")}>Skorlar</button>
            <button className="bb-icon-btn" onClick={() => setScreen("settings")}>Ayarlar</button>
          </div>
        </header>

        {screen === "menu" && (
          <section className="bb-menu-grid">
            <div className="bb-hero bb-card">
              <span className="bb-kicker">Endless casual puzzle</span>
              <h1>Blokları yerleştir, çizgileri patlat, komboyu büyüt.</h1>
              <p>
                10x10 cam tahta, üçlü parça havuzu, akıllı ipucu, güçlendiriciler, günlük seed ve mobil dokunmatik kontrol.
              </p>
              <div className="bb-mode-row">
                {([
                  ["classic", "Klasik", "Rahat ama stratejik endless skor modu."],
                  ["zen", "Zen", "Daha fazla yardımcı hak, baskısız oyun."],
                  ["rush", "Rush", "3 dakikada maksimum skor."],
                ] as [ModeKey, string, string][]).map(([key, label, desc]) => (
                  <button key={key} className={`bb-mode ${mode === key ? "active" : ""}`} onClick={() => setMode(key)}>
                    <b>{label}</b>
                    <small>{desc}</small>
                  </button>
                ))}
              </div>
              <div className="bb-hero-actions">
                <button className="bb-primary" onClick={() => startNewGame(mode)}>Yeni Oyun</button>
                <button className="bb-secondary" onClick={resumeSaved}>Devam Et</button>
                <button className="bb-secondary" onClick={() => startNewGame("classic", true)}>Günlük Seed</button>
              </div>
            </div>

            <aside className="bb-card bb-side-preview">
              <div className="bb-preview-board">
                {Array.from({ length: 36 }, (_, i) => (
                  <span key={i} className={i % 5 === 0 || [2, 9, 14, 17, 21, 28].includes(i) ? "filled" : ""} />
                ))}
              </div>
              <h3>Bugünkü hedef</h3>
              <p>Kombo zincirleri kur, özel araçları doğru zamanda kullan ve tahtayı kilitlemeden açık alan bırak.</p>
              <div className="bb-stat-mini"><span>En iyi skor</span><b>{stats.best.toLocaleString("tr-TR")}</b></div>
              <div className="bb-stat-mini"><span>Ortalama</span><b>{averageScore.toLocaleString("tr-TR")}</b></div>
            </aside>
          </section>
        )}

        {screen === "settings" && (
          <section className="bb-card bb-settings">
            <div className="bb-section-head">
              <span className="bb-kicker">Kontrol paneli</span>
              <h2>Ayarlar</h2>
            </div>
            <div className="bb-theme-grid">
              {(Object.keys(THEMES) as ThemeKey[]).map((key) => (
                <button key={key} className={`bb-theme ${settings.theme === key ? "active" : ""}`} onClick={() => setSettings((s) => ({ ...s, theme: key }))}>
                  <span style={{ background: THEMES[key].bg }} />
                  <b>{THEMES[key].title}</b>
                  <small>{THEMES[key].subtitle}</small>
                </button>
              ))}
            </div>
            <div className="bb-toggle-grid">
              {([
                ["music", "Rahatlatıcı müzik", "Web Audio ile üretilir, dış dosya kullanmaz."],
                ["sfx", "Ses efektleri", "Yerleştirme, kombo ve hata sesleri."],
                ["haptics", "Titreşim", "Mobilde hafif dokunsal geri bildirim."],
                ["reducedMotion", "Az animasyon", "Daha sade ve performans dostu görünüm."],
              ] as [keyof Settings, string, string][]).map(([key, label, desc]) => (
                <button key={key} className={`bb-toggle ${settings[key] ? "active" : ""}`} onClick={() => setSettings((s) => ({ ...s, [key]: !s[key] }))}>
                  <span>{settings[key] ? "Açık" : "Kapalı"}</span>
                  <b>{label}</b>
                  <small>{desc}</small>
                </button>
              ))}
            </div>
            <button className="bb-danger" onClick={clearProgress}>İstatistikleri Sıfırla</button>
          </section>
        )}

        {screen === "stats" && (
          <section className="bb-card bb-stats-page">
            <div className="bb-section-head">
              <span className="bb-kicker">Profil</span>
              <h2>İstatistikler</h2>
            </div>
            <div className="bb-stats-grid">
              <div><span>En iyi skor</span><b>{stats.best.toLocaleString("tr-TR")}</b></div>
              <div><span>Oyun</span><b>{stats.games}</b></div>
              <div><span>Ortalama skor</span><b>{averageScore.toLocaleString("tr-TR")}</b></div>
              <div><span>Temizlenen hücre</span><b>{stats.totalClears.toLocaleString("tr-TR")}</b></div>
              <div><span>En büyük kombo</span><b>{stats.biggestCombo}x</b></div>
              <div><span>Günlük seri</span><b>{stats.dailyStreak}</b></div>
            </div>
          </section>
        )}

        {screen === "how" && (
          <section className="bb-card bb-how">
            <div className="bb-section-head">
              <span className="bb-kicker">Oynanış</span>
              <h2>Nasıl oynanır?</h2>
            </div>
            <div className="bb-how-grid">
              <article><b>1</b><h3>Parça seç</h3><p>Alttaki üç parçadan birini sürükle veya dokunarak seç.</p></article>
              <article><b>2</b><h3>Tahtaya yerleştir</h3><p>10x10 alanda boş yere bırak. Satır veya sütun dolarsa temizlenir.</p></article>
              <article><b>3</b><h3>Alanı açık tut</h3><p>Yeni parçalar üçlü set bittiğinde gelir. Hamle kalmazsa oyun biter.</p></article>
              <article><b>4</b><h3>Güçleri kullan</h3><p>Çekiç hücre siler, karıştır yeni parçalar verir, geri al son hamleyi kurtarır.</p></article>
            </div>
          </section>
        )}

        {screen === "play" && (
          <section className="bb-game-layout">
            <aside className="bb-card bb-left-panel">
              <div className="bb-score-card">
                <span>Skor</span>
                <strong>{score.toLocaleString("tr-TR")}</strong>
                <div className="bb-progress"><i style={{ width: `${progress}%` }} /></div>
                <small>Hedef barı: {scoreTarget.toLocaleString("tr-TR")}</small>
              </div>
              <div className="bb-info-list">
                <div><span>En iyi</span><b>{Math.max(stats.best, score).toLocaleString("tr-TR")}</b></div>
                <div><span>Kombo</span><b>{combo ? `${combo}x` : "-"}</b></div>
                <div><span>Hamle</span><b>{moves}</b></div>
                <div><span>Süre</span><b>{mode === "rush" ? formatTime(rushLeft ?? 0) : formatTime(seconds)}</b></div>
              </div>
              <div className="bb-tool-grid">
                <button onClick={() => { setHammerMode((v) => !v); setSelected(null); }} disabled={tools.hammer <= 0} className={hammerMode ? "active" : ""}>🔨<span>{tools.hammer}</span><small>Çekiç</small></button>
                <button onClick={shufflePieces} disabled={tools.shuffle <= 0}>🔀<span>{tools.shuffle}</span><small>Karıştır</small></button>
                <button onClick={undo} disabled={tools.undo <= 0 || history.length === 0}>↩<span>{tools.undo}</span><small>Geri al</small></button>
                <button onClick={useHint}>✨<span>∞</span><small>İpucu</small></button>
              </div>
              <button className="bb-secondary full" onClick={() => setPaused(true)}>Duraklat</button>
            </aside>

            <div className="bb-board-wrap">
              <div className={`bb-board ${shake ? "shake" : ""} ${hammerMode ? "hammer" : ""}`}
                ref={boardRef}
                onPointerMove={onBoardPointerMove}
                onPointerUp={onBoardPointerUp}
                onPointerLeave={() => setHoverCell(null)}
              >
                {board.map((row, r) => row.map((cell, c) => {
                  const key = `${r},${c}`;
                  const preview = boardPreview.has(key);
                  const hinted = hint && pieces[hint.index]?.cells.some(({ x, y }) => hint.row + y === r && hint.col + x === c);
                  return (
                    <button
                      key={key}
                      className={`bb-cell ${cell.filled ? "filled" : ""} ${cell.shine ? "shine" : ""} ${preview ? (isPreviewValid ? "preview good" : "preview bad") : ""} ${clearing.has(key) ? "clearing" : ""} ${hinted ? "hint" : ""}`}
                      onPointerDown={(e) => {
                        if (selected !== null && pieces[selected]) {
                          const target = cellFromEvent(e.clientX, e.clientY, pieces[selected]);
                          if (target) commitPlacement(selected, target.row, target.col);
                        } else if (hammerMode) {
                          const target = cellFromEvent(e.clientX, e.clientY);
                          if (target) onBoardPointerUp(e as unknown as React.PointerEvent<HTMLDivElement>);
                        }
                      }}
                      style={cell.filled ? { background: `linear-gradient(145deg, ${cell.color}, ${cell.color}cc)`, boxShadow: `0 8px 20px ${cell.color}33, inset 0 1px 0 rgba(255,255,255,.55)` } : undefined}
                      aria-label={`Hücre ${r + 1}, ${c + 1}`}
                    />
                  );
                }))}
              </div>
              <div className="bb-piece-tray">
                {pieces.map((piece, index) => (
                  <button
                    key={piece?.uid ?? `empty-${index}`}
                    className={`bb-piece-slot ${selected === index ? "selected" : ""} ${piece && !hasMove(board, piece) ? "blocked" : ""}`}
                    disabled={!piece || paused || gameOver}
                    onClick={() => selectPiece(index)}
                    onPointerDown={(e) => onPiecePointerDown(index, e)}
                    onPointerMove={(e) => onPiecePointerMove(index, e)}
                    onPointerUp={(e) => onPiecePointerUp(index, e)}
                    aria-label={piece ? `${piece.name} parçası` : "Boş parça alanı"}
                  >
                    {piece ? <MiniPiece piece={piece} disabled={!hasMove(board, piece)} /> : <span className="bb-empty-piece">✓</span>}
                    {piece && <em>{piece.name}</em>}
                  </button>
                ))}
              </div>
              <div className="bb-mobile-actions">
                <button onClick={rotateSelected} disabled={!activePiece}>Döndür</button>
                <button onClick={useHint}>İpucu</button>
                <button onClick={() => setPaused(true)}>Duraklat</button>
              </div>
            </div>

            <aside className="bb-card bb-right-panel">
              <h3>Strateji notu</h3>
              <p>Uzun çizgileri kenarlarda tut, orta alanı küçük parçalar için açık bırak. Tekli parça kombo kurtarıcıdır.</p>
              <div className="bb-next-mini">
                <span>Seçili parça</span>
                {activePiece ? <MiniPiece piece={activePiece} tiny /> : <b>Yok</b>}
              </div>
              <button className="bb-secondary full" onClick={rotateSelected} disabled={!activePiece}>Seçili Parçayı Döndür</button>
              <button className="bb-danger full" onClick={() => startNewGame(mode)}>Yeniden Başlat</button>
            </aside>

            {(paused || gameOver) && (
              <div className="bb-overlay">
                <div className="bb-card bb-modal">
                  <span className="bb-kicker">{gameOver ? "Oyun bitti" : "Duraklatıldı"}</span>
                  <h2>{gameOver ? (score >= stats.best ? "Yeni rekor olabilir!" : "Güzel deneme") : "Nefes al"}</h2>
                  <p>{gameOver ? `Skorun ${score.toLocaleString("tr-TR")}. ${mode === "rush" ? "Rush modunda süre bitti veya hamle kalmadı." : "Tahtada kullanılabilir hamle kalmadı."}` : "Oyun beklemede. Devam ettiğinde süre kaldığı yerden akar."}</p>
                  <div className="bb-modal-actions">
                    {!gameOver && <button className="bb-primary" onClick={() => setPaused(false)}>Devam Et</button>}
                    <button className="bb-secondary" onClick={() => startNewGame(mode)}>Yeni Oyun</button>
                    <button className="bb-secondary" onClick={() => setScreen("menu")}>Ana Menü</button>
                  </div>
                </div>
              </div>
            )}
          </section>
        )}
      </main>
    </div>
  );
}

const CSS = `
* { box-sizing: border-box; }
:root { color-scheme: dark; }
.bb-root {
  min-height: 100dvh;
  width: 100%;
  position: relative;
  overflow-x: hidden;
  background: var(--bb-bg);
  color: var(--bb-text);
  font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  isolation: isolate;
}
.bb-root button { font-family: inherit; -webkit-tap-highlight-color: transparent; }
.bb-noise {
  position: fixed; inset: 0; pointer-events: none; opacity: .18; mix-blend-mode: soft-light; z-index: -1;
  background-image: radial-gradient(rgba(255,255,255,.18) 1px, transparent 1px);
  background-size: 4px 4px;
}
.bb-orb { position: fixed; width: 460px; height: 460px; border-radius: 50%; filter: blur(28px); opacity: .18; z-index: -2; pointer-events: none; }
.bb-orb-a { left: -160px; top: -120px; background: #8a7dff; animation: bb-float 9s ease-in-out infinite; }
.bb-orb-b { right: -160px; bottom: -140px; background: #23e3bc; animation: bb-float 11s ease-in-out infinite reverse; }
@keyframes bb-float { 0%,100% { transform: translate3d(0,0,0) scale(1); } 50% { transform: translate3d(30px,18px,0) scale(1.06); } }
.bb-shell { width: min(1480px, calc(100% - 28px)); margin: 0 auto; padding: 20px 0 34px; }
.bb-topbar { display:flex; justify-content:space-between; align-items:center; gap:16px; margin-bottom:20px; }
.bb-brand { border:0; background:transparent; color:var(--bb-text); display:flex; align-items:center; gap:12px; cursor:pointer; text-align:left; }
.bb-brand strong { display:block; font-size:18px; letter-spacing:.2px; }
.bb-brand small { color:var(--bb-muted); font-weight:700; font-size:11px; text-transform:uppercase; letter-spacing:.15em; }
.bb-logo-mark { width:46px; height:46px; border-radius:16px; display:grid; grid-template-columns:1fr 1fr; gap:4px; padding:8px; background:var(--bb-button); box-shadow: 0 16px 42px var(--bb-glow); transform:rotate(-6deg); }
.bb-logo-mark i { display:block; border-radius:6px; background:rgba(255,255,255,.78); box-shadow: inset 0 1px 0 rgba(255,255,255,.8); }
.bb-logo-mark i:first-child { grid-row: span 2; }
.bb-top-actions { display:flex; gap:10px; flex-wrap:wrap; justify-content:flex-end; }
.bb-icon-btn, .bb-secondary, .bb-danger, .bb-mobile-actions button {
  border:1px solid rgba(255,255,255,.12); background:rgba(255,255,255,.07); color:var(--bb-text); border-radius:16px; padding:11px 14px; font-weight:800; cursor:pointer; backdrop-filter: blur(16px); box-shadow: inset 0 1px 0 rgba(255,255,255,.1); transition:.18s ease;
}
.bb-icon-btn:hover, .bb-secondary:hover, .bb-mobile-actions button:hover { transform: translateY(-1px); background:rgba(255,255,255,.12); }
.bb-primary { border:0; background:var(--bb-button); color:#fff; border-radius:18px; padding:14px 18px; font-weight:950; cursor:pointer; box-shadow:0 18px 42px var(--bb-glow), inset 0 1px 0 rgba(255,255,255,.28); transition:.18s ease; }
.bb-primary:hover { transform: translateY(-2px) scale(1.01); }
.bb-danger { border-color: rgba(255,255,255,.1); background: color-mix(in srgb, var(--bb-danger) 22%, transparent); }
.bb-danger:hover { background: color-mix(in srgb, var(--bb-danger) 32%, transparent); }
.bb-card { background:var(--bb-panel); border:1px solid rgba(255,255,255,.12); border-radius:30px; box-shadow:0 30px 90px rgba(0,0,0,.28), inset 0 1px 0 rgba(255,255,255,.08); backdrop-filter: blur(24px); }
.bb-menu-grid { display:grid; grid-template-columns:minmax(0, 1fr) 380px; gap:20px; align-items:stretch; }
.bb-hero { padding:38px; min-height:560px; display:flex; flex-direction:column; justify-content:center; position:relative; overflow:hidden; }
.bb-hero:before { content:""; position:absolute; width:520px; height:520px; right:-180px; top:-140px; background:radial-gradient(circle, var(--bb-glow), transparent 58%); opacity:.8; }
.bb-kicker { display:inline-flex; width:max-content; border:1px solid rgba(255,255,255,.13); border-radius:999px; padding:7px 11px; color:var(--bb-muted); font-size:11px; font-weight:900; text-transform:uppercase; letter-spacing:.16em; background:rgba(255,255,255,.06); }
.bb-hero h1 { max-width:780px; margin:18px 0 14px; font-size:clamp(42px, 7vw, 92px); line-height:.9; letter-spacing:-.065em; }
.bb-hero p { max-width:720px; color:var(--bb-muted); font-size:18px; line-height:1.7; margin:0 0 28px; }
.bb-mode-row { display:grid; grid-template-columns:repeat(3, minmax(0, 1fr)); gap:12px; max-width:840px; }
.bb-mode, .bb-theme, .bb-toggle { text-align:left; color:var(--bb-text); border:1px solid rgba(255,255,255,.1); background:rgba(255,255,255,.065); border-radius:22px; padding:16px; cursor:pointer; transition:.18s ease; min-height:112px; }
.bb-mode:hover, .bb-theme:hover, .bb-toggle:hover { transform:translateY(-2px); background:rgba(255,255,255,.1); }
.bb-mode.active, .bb-theme.active, .bb-toggle.active { border-color:rgba(255,255,255,.32); box-shadow:0 18px 50px var(--bb-glow), inset 0 1px 0 rgba(255,255,255,.18); }
.bb-mode b, .bb-theme b, .bb-toggle b { display:block; font-size:16px; margin-bottom:8px; }
.bb-mode small, .bb-theme small, .bb-toggle small { color:var(--bb-muted); line-height:1.45; }
.bb-hero-actions { display:flex; flex-wrap:wrap; gap:12px; margin-top:24px; }
.bb-side-preview { padding:24px; display:flex; flex-direction:column; justify-content:center; }
.bb-preview-board { display:grid; grid-template-columns:repeat(6, 1fr); gap:7px; padding:16px; border-radius:24px; background:var(--bb-board); margin-bottom:20px; aspect-ratio:1; }
.bb-preview-board span { border-radius:9px; background:var(--bb-grid); }
.bb-preview-board span.filled { background:var(--bb-button); box-shadow:0 10px 26px var(--bb-glow); }
.bb-side-preview h3 { margin:6px 0 8px; font-size:25px; }
.bb-side-preview p { color:var(--bb-muted); line-height:1.65; margin:0 0 18px; }
.bb-stat-mini { display:flex; justify-content:space-between; align-items:center; border-top:1px solid rgba(255,255,255,.08); padding:14px 0; }
.bb-stat-mini span { color:var(--bb-muted); } .bb-stat-mini b { font-size:24px; }
.bb-settings, .bb-stats-page, .bb-how { padding:30px; }
.bb-section-head h2 { margin:12px 0 22px; font-size:40px; letter-spacing:-.04em; }
.bb-theme-grid { display:grid; grid-template-columns:repeat(4, minmax(0, 1fr)); gap:14px; margin-bottom:18px; }
.bb-theme span { display:block; height:110px; border-radius:18px; margin-bottom:14px; box-shadow:inset 0 1px 0 rgba(255,255,255,.18); }
.bb-toggle-grid { display:grid; grid-template-columns:repeat(4, minmax(0, 1fr)); gap:14px; margin:18px 0; }
.bb-toggle span { display:inline-flex; padding:6px 9px; border-radius:999px; background:rgba(255,255,255,.1); color:var(--bb-muted); font-size:12px; font-weight:900; margin-bottom:14px; }
.bb-stats-grid { display:grid; grid-template-columns:repeat(3, minmax(0, 1fr)); gap:14px; }
.bb-stats-grid div { padding:22px; border-radius:24px; background:rgba(255,255,255,.065); border:1px solid rgba(255,255,255,.1); }
.bb-stats-grid span { display:block; color:var(--bb-muted); font-weight:800; margin-bottom:9px; }
.bb-stats-grid b { font-size:34px; }
.bb-how-grid { display:grid; grid-template-columns:repeat(4, minmax(0, 1fr)); gap:14px; }
.bb-how-grid article { padding:22px; border-radius:24px; background:rgba(255,255,255,.065); border:1px solid rgba(255,255,255,.1); }
.bb-how-grid b { display:grid; place-items:center; width:34px; height:34px; border-radius:13px; background:var(--bb-button); box-shadow:0 10px 28px var(--bb-glow); }
.bb-how-grid h3 { margin:16px 0 8px; } .bb-how-grid p { color:var(--bb-muted); line-height:1.6; }
.bb-game-layout { display:grid; grid-template-columns:260px minmax(420px, 1fr) 270px; gap:18px; align-items:start; }
.bb-left-panel, .bb-right-panel { padding:18px; position:sticky; top:16px; }
.bb-score-card { padding:18px; border-radius:24px; background:rgba(255,255,255,.07); border:1px solid rgba(255,255,255,.1); }
.bb-score-card span { color:var(--bb-muted); font-weight:900; } .bb-score-card strong { display:block; font-size:44px; letter-spacing:-.04em; margin:6px 0; }
.bb-score-card small { color:var(--bb-muted); }
.bb-progress { height:9px; background:rgba(255,255,255,.1); border-radius:999px; overflow:hidden; margin:12px 0 8px; }
.bb-progress i { display:block; height:100%; background:var(--bb-button); border-radius:999px; box-shadow:0 0 24px var(--bb-glow); }
.bb-info-list { display:grid; gap:9px; margin:14px 0; }
.bb-info-list div { display:flex; justify-content:space-between; padding:12px 13px; border-radius:16px; background:rgba(255,255,255,.055); }
.bb-info-list span { color:var(--bb-muted); font-weight:800; }
.bb-tool-grid { display:grid; grid-template-columns:1fr 1fr; gap:10px; }
.bb-tool-grid button { min-height:82px; border:1px solid rgba(255,255,255,.1); background:rgba(255,255,255,.07); color:var(--bb-text); border-radius:20px; cursor:pointer; font-weight:900; font-size:21px; position:relative; transition:.16s ease; }
.bb-tool-grid button small { display:block; font-size:11px; color:var(--bb-muted); margin-top:4px; }
.bb-tool-grid button span { position:absolute; top:8px; right:10px; min-width:23px; height:23px; border-radius:999px; background:rgba(255,255,255,.13); font-size:12px; display:grid; place-items:center; }
.bb-tool-grid button.active { outline:2px solid var(--bb-danger); box-shadow:0 0 0 6px color-mix(in srgb, var(--bb-danger) 16%, transparent); }
.bb-tool-grid button:disabled, .bb-secondary:disabled, .bb-mobile-actions button:disabled { opacity:.42; cursor:not-allowed; transform:none; }
.full { width:100%; margin-top:12px; }
.bb-right-panel h3 { margin:4px 0 8px; font-size:23px; } .bb-right-panel p { color:var(--bb-muted); line-height:1.6; }
.bb-next-mini { display:flex; justify-content:space-between; align-items:center; min-height:76px; padding:14px; border-radius:20px; background:rgba(255,255,255,.055); margin:14px 0; }
.bb-next-mini span { color:var(--bb-muted); font-weight:800; }
.bb-board-wrap { display:flex; flex-direction:column; gap:16px; align-items:center; min-width:0; }
.bb-board {
  width:min(78vh, 100%); max-width:680px; min-width:420px; aspect-ratio:1; display:grid; grid-template-columns:repeat(10, 1fr); gap:6px; padding:12px; border-radius:34px;
  background:var(--bb-board); border:1px solid rgba(255,255,255,.13); box-shadow:0 34px 100px rgba(0,0,0,.34), inset 0 1px 0 rgba(255,255,255,.1); touch-action:none; position:relative;
}
.bb-board:before { content:""; position:absolute; inset:10px; border-radius:26px; border:1px solid rgba(255,255,255,.05); pointer-events:none; }
.bb-board.shake { animation:bb-shake .28s ease; }
.bb-board.hammer { cursor:crosshair; box-shadow:0 34px 100px rgba(0,0,0,.34), 0 0 0 5px color-mix(in srgb, var(--bb-danger) 18%, transparent); }
@keyframes bb-shake { 0%,100% { transform:translateX(0); } 25% { transform:translateX(-5px); } 75% { transform:translateX(5px); } }
.bb-cell { border:0; border-radius:13px; background:var(--bb-grid); position:relative; cursor:pointer; box-shadow:inset 0 1px 0 rgba(255,255,255,.055); transition:transform .14s ease, opacity .14s ease, background .14s ease, box-shadow .14s ease; min-width:0; }
.bb-cell.filled { transform:translateY(-1px); }
.bb-cell.filled:after { content:""; position:absolute; inset:12% 16% auto 16%; height:22%; border-radius:999px; background:rgba(255,255,255,.22); filter:blur(.5px); }
.bb-cell.shine:before { content:""; position:absolute; inset:0; border-radius:inherit; background:linear-gradient(120deg, transparent, rgba(255,255,255,.28), transparent); opacity:.7; }
.bb-cell.preview { outline:2px solid rgba(255,255,255,.24); transform:scale(.96); }
.bb-cell.preview.good { background:linear-gradient(145deg, rgba(255,255,255,.34), rgba(255,255,255,.18)); box-shadow:0 0 24px var(--bb-glow); }
.bb-cell.preview.bad { background:color-mix(in srgb, var(--bb-danger) 40%, rgba(255,255,255,.08)); }
.bb-cell.clearing { animation:bb-pop .42s ease both; }
.bb-cell.hint { animation:bb-pulse 1s ease-in-out infinite; outline:2px solid rgba(255,255,255,.6); }
@keyframes bb-pop { 0% { transform:scale(1); opacity:1; } 45% { transform:scale(1.22); opacity:1; } 100% { transform:scale(.2); opacity:0; } }
@keyframes bb-pulse { 0%,100% { box-shadow:0 0 0 0 var(--bb-glow); } 50% { box-shadow:0 0 0 8px transparent, 0 0 30px var(--bb-glow); } }
.bb-piece-tray { width:min(100%, 760px); display:grid; grid-template-columns:repeat(3, minmax(0, 1fr)); gap:13px; }
.bb-piece-slot { min-height:142px; border:1px solid rgba(255,255,255,.12); background:var(--bb-panel); color:var(--bb-text); border-radius:28px; cursor:grab; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:10px; position:relative; touch-action:none; box-shadow:0 18px 50px rgba(0,0,0,.18), inset 0 1px 0 rgba(255,255,255,.08); transition:.16s ease; }
.bb-piece-slot:hover { transform:translateY(-2px); background:var(--bb-panel-strong); }
.bb-piece-slot.selected { outline:2px solid rgba(255,255,255,.35); box-shadow:0 18px 55px var(--bb-glow); transform:translateY(-4px); }
.bb-piece-slot.blocked { filter:saturate(.55); }
.bb-piece-slot em { font-style:normal; color:var(--bb-muted); font-size:12px; font-weight:900; text-transform:uppercase; letter-spacing:.12em; }
.bb-empty-piece { display:grid; place-items:center; width:48px; height:48px; border-radius:18px; background:rgba(255,255,255,.08); color:var(--bb-muted); font-weight:950; }
.bb-mini-piece { position:relative; flex-shrink:0; }
.bb-mini-piece span { position:absolute; border-radius:7px; }
.bb-mobile-actions { display:none; grid-template-columns:repeat(3, 1fr); gap:10px; width:min(100%, 760px); }
.bb-overlay { position:fixed; inset:0; z-index:20; background:rgba(0,0,0,.46); backdrop-filter:blur(10px); display:grid; place-items:center; padding:18px; }
.bb-modal { width:min(520px, 100%); padding:28px; text-align:center; }
.bb-modal h2 { margin:14px 0 10px; font-size:42px; letter-spacing:-.04em; }
.bb-modal p { color:var(--bb-muted); line-height:1.65; }
.bb-modal-actions { display:flex; justify-content:center; flex-wrap:wrap; gap:10px; margin-top:18px; }
.bb-toast { position:fixed; left:50%; top:20px; transform:translateX(-50%); z-index:30; padding:12px 16px; border-radius:999px; color:var(--bb-text); background:var(--bb-panel-strong); border:1px solid rgba(255,255,255,.14); box-shadow:0 18px 50px rgba(0,0,0,.32); font-weight:900; animation:bb-toast .25s ease both; }
@keyframes bb-toast { from { opacity:0; transform:translate(-50%, -12px); } to { opacity:1; transform:translate(-50%, 0); } }
@media (max-width: 1180px) { .bb-game-layout { grid-template-columns:220px minmax(380px, 1fr); } .bb-right-panel { display:none; } .bb-menu-grid { grid-template-columns:1fr; } .bb-side-preview { display:none; } }
@media (max-width: 820px) {
  .bb-shell { width:min(100% - 18px, 720px); padding-top:12px; }
  .bb-topbar { align-items:flex-start; }
  .bb-top-actions { gap:7px; }
  .bb-icon-btn { padding:9px 10px; border-radius:13px; font-size:12px; }
  .bb-brand strong { font-size:16px; } .bb-brand small { font-size:9px; }
  .bb-logo-mark { width:40px; height:40px; border-radius:14px; }
  .bb-hero { padding:24px; min-height:auto; } .bb-hero h1 { font-size:48px; } .bb-hero p { font-size:15px; }
  .bb-mode-row, .bb-theme-grid, .bb-toggle-grid, .bb-stats-grid, .bb-how-grid { grid-template-columns:1fr; }
  .bb-game-layout { display:flex; flex-direction:column; }
  .bb-left-panel { position:relative; top:auto; width:100%; order:2; }
  .bb-board-wrap { width:100%; order:1; }
  .bb-board { min-width:0; width:100%; border-radius:24px; gap:4px; padding:8px; }
  .bb-cell { border-radius:9px; }
  .bb-piece-tray { gap:8px; }
  .bb-piece-slot { min-height:118px; border-radius:22px; }
  .bb-mobile-actions { display:grid; }
  .bb-tool-grid { grid-template-columns:repeat(4, 1fr); }
  .bb-tool-grid button { min-height:68px; font-size:18px; }
  .bb-tool-grid button small { display:none; }
  .bb-info-list { grid-template-columns:repeat(2, 1fr); }
  .bb-score-card strong { font-size:36px; }
}
@media (max-width: 480px) {
  .bb-topbar { flex-direction:column; }
  .bb-top-actions { width:100%; justify-content:space-between; }
  .bb-icon-btn { flex:1; }
  .bb-hero h1 { font-size:40px; }
  .bb-hero-actions { flex-direction:column; } .bb-hero-actions button { width:100%; }
  .bb-piece-slot { min-height:104px; }
  .bb-mini-piece span { border-radius:5px; }
  .bb-settings, .bb-stats-page, .bb-how { padding:18px; border-radius:22px; }
  .bb-section-head h2 { font-size:32px; }
}
.bb-reduced *, .bb-reduced *:before, .bb-reduced *:after { animation:none !important; transition:none !important; }
`;

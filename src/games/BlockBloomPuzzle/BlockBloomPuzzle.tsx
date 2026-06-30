import "./BlockBloomPuzzle.scss";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties, PointerEvent } from "react";

type Cell = {
  filled: boolean;
  color?: string;
  accent?: string;
};

type Point = { x: number; y: number };

type Shape = {
  id: string;
  name: string;
  cells: Point[];
  weight: number;
};

type Piece = Shape & {
  uid: string;
  color: string;
  accent: string;
};

type ThemeKey = "navy" | "coral" | "forest" | "graphite";
type ModeKey = "classic" | "calm" | "rush";
type Screen = "menu" | "play" | "settings" | "stats" | "how";
type EndReason = "blocked" | "time";

type Settings = {
  theme: ThemeKey;
  darkMode: boolean;
  sound: boolean;
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

type Tools = {
  hammer: number;
  shuffle: number;
  undo: number;
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
  dailyGame: boolean;
};

type Theme = {
  title: string;
  subtitle: string;
  bg: string;
  panel: string;
  panelStrong: string;
  text: string;
  muted: string;
  grid: string;
  board: string;
  accent: string;
  accentDark: string;
  danger: string;
};

const BOARD_SIZE = 10;
const STORAGE_SETTINGS = "block-bloom-settings-v2";
const STORAGE_STATS = "block-bloom-stats-v1";
const STORAGE_SAVE = "block-bloom-save-v2";
const BEST_SCORE_KEY = "blockbloom_best_score";

// 15 score-based accent colors cycling as score climbs
const SCORE_LEVELS = [
  { accent: "#ff5ea3", accentDark: "#b52668" },  // L0  Pembe
  { accent: "#ff6b35", accentDark: "#c23d10" },  // L1  Turuncu
  { accent: "#fbbf24", accentDark: "#cc8c00" },  // L2  Altın
  { accent: "#84cc16", accentDark: "#4a8c05" },  // L3  Limon
  { accent: "#34d399", accentDark: "#0a9e66" },  // L4  Nane
  { accent: "#22d3ee", accentDark: "#0696b4" },  // L5  Camgöbeği
  { accent: "#3b82f6", accentDark: "#1d4ed8" },  // L6  Mavi
  { accent: "#8b5cf6", accentDark: "#4a2fd6" },  // L7  Mor
  { accent: "#d946ef", accentDark: "#a21caf" },  // L8  Magenta
  { accent: "#f43f5e", accentDark: "#b5102a" },  // L9  Kırmızı
  { accent: "#fb923c", accentDark: "#c25010" },  // L10 Amber
  { accent: "#a3e635", accentDark: "#65a30d" },  // L11 Sarı-yeşil
  { accent: "#2dd4bf", accentDark: "#0d9488" },  // L12 Teal
  { accent: "#60a5fa", accentDark: "#2563eb" },  // L13 Açık mavi
  { accent: "#c084fc", accentDark: "#7e22ce" },  // L14 Lavanta
];

const LEVEL_THRESHOLDS = [0, 400, 900, 1500, 2200, 3000, 4000, 5200, 6600, 8300, 10200, 12500, 15100, 18200, 21800];

const DEFAULT_SETTINGS: Settings = {
  theme: "navy",
  darkMode: false,
  sound: true,
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

const THEMES: Record<ThemeKey, Theme> = {
  navy: {
    title: "Peri",
    subtitle: "Mor uzay teması",
    bg: "#0a0818",
    panel: "#13103a",
    panelStrong: "#1c1848",
    text: "#edeaff",
    muted: "#7a6faa",
    grid: "rgba(255,255,255,0.04)",
    board: "#05030f",
    accent: "#ff5ea3",
    accentDark: "#b52668",
    danger: "#f43f5e",
  },
  coral: {
    title: "Magma",
    subtitle: "Kor ateş teması",
    bg: "#110805",
    panel: "#2a1008",
    panelStrong: "#38160a",
    text: "#fff0e0",
    muted: "#c47a55",
    grid: "rgba(255,255,255,0.04)",
    board: "#070402",
    accent: "#ff6b35",
    accentDark: "#c23d10",
    danger: "#fbbf24",
  },
  forest: {
    title: "Orman",
    subtitle: "Derin orman teması",
    bg: "#050f0a",
    panel: "#0b241a",
    panelStrong: "#0e2e22",
    text: "#e0fff0",
    muted: "#4d9e72",
    grid: "rgba(255,255,255,0.04)",
    board: "#020a05",
    accent: "#34d399",
    accentDark: "#0a9e66",
    danger: "#fbbf24",
  },
  graphite: {
    title: "Krom",
    subtitle: "Metal gri teması",
    bg: "#08080f",
    panel: "#10101e",
    panelStrong: "#18182c",
    text: "#dde0f5",
    muted: "#5e5e88",
    grid: "rgba(255,255,255,0.04)",
    board: "#04040a",
    accent: "#818cf8",
    accentDark: "#4a50cc",
    danger: "#f43f5e",
  },
};

const PIECE_COLORS = [
  { color: "#ff5ea3", accent: "#b52668" },
  { color: "#8b5cf6", accent: "#4a2fd6" },
  { color: "#fbbf24", accent: "#cc8c00" },
  { color: "#34d399", accent: "#0a9e66" },
  { color: "#22d3ee", accent: "#0696b4" },
  { color: "#fb923c", accent: "#c25010" },
  { color: "#84cc16", accent: "#4a8c05" },
  { color: "#f43f5e", accent: "#b5102a" },
];

const SHAPES: Shape[] = [
  { id: "one", name: "Tekli", weight: 7, cells: [{ x: 0, y: 0 }] },
  { id: "two-h", name: "İkili", weight: 8, cells: [{ x: 0, y: 0 }, { x: 1, y: 0 }] },
  { id: "two-v", name: "İkili", weight: 8, cells: [{ x: 0, y: 0 }, { x: 0, y: 1 }] },
  { id: "three-h", name: "Üçlü", weight: 8, cells: [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 2, y: 0 }] },
  { id: "three-v", name: "Üçlü", weight: 8, cells: [{ x: 0, y: 0 }, { x: 0, y: 1 }, { x: 0, y: 2 }] },
  { id: "four-h", name: "Dörtlü", weight: 6, cells: [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 2, y: 0 }, { x: 3, y: 0 }] },
  { id: "four-v", name: "Dörtlü", weight: 6, cells: [{ x: 0, y: 0 }, { x: 0, y: 1 }, { x: 0, y: 2 }, { x: 0, y: 3 }] },
  { id: "five-h", name: "Uzun", weight: 3, cells: [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 2, y: 0 }, { x: 3, y: 0 }, { x: 4, y: 0 }] },
  { id: "five-v", name: "Uzun", weight: 3, cells: [{ x: 0, y: 0 }, { x: 0, y: 1 }, { x: 0, y: 2 }, { x: 0, y: 3 }, { x: 0, y: 4 }] },
  { id: "square", name: "Kare", weight: 7, cells: [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 0, y: 1 }, { x: 1, y: 1 }] },
  { id: "corner-a", name: "Köşe", weight: 7, cells: [{ x: 0, y: 0 }, { x: 0, y: 1 }, { x: 1, y: 1 }] },
  { id: "corner-b", name: "Köşe", weight: 7, cells: [{ x: 1, y: 0 }, { x: 1, y: 1 }, { x: 0, y: 1 }] },
  { id: "corner-c", name: "Köşe", weight: 7, cells: [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 0, y: 1 }] },
  { id: "corner-d", name: "Köşe", weight: 7, cells: [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 1, y: 1 }] },
  { id: "hook-a", name: "L Parça", weight: 5, cells: [{ x: 0, y: 0 }, { x: 0, y: 1 }, { x: 0, y: 2 }, { x: 1, y: 2 }] },
  { id: "hook-b", name: "L Parça", weight: 5, cells: [{ x: 1, y: 0 }, { x: 1, y: 1 }, { x: 1, y: 2 }, { x: 0, y: 2 }] },
  { id: "hook-c", name: "L Parça", weight: 5, cells: [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 2, y: 0 }, { x: 0, y: 1 }] },
  { id: "hook-d", name: "L Parça", weight: 5, cells: [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 2, y: 0 }, { x: 2, y: 1 }] },
  { id: "t-a", name: "T Parça", weight: 5, cells: [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 2, y: 0 }, { x: 1, y: 1 }] },
  { id: "t-b", name: "T Parça", weight: 5, cells: [{ x: 1, y: 0 }, { x: 0, y: 1 }, { x: 1, y: 1 }, { x: 2, y: 1 }] },
  { id: "t-c", name: "T Parça", weight: 5, cells: [{ x: 0, y: 0 }, { x: 0, y: 1 }, { x: 0, y: 2 }, { x: 1, y: 1 }] },
  { id: "t-d", name: "T Parça", weight: 5, cells: [{ x: 1, y: 0 }, { x: 1, y: 1 }, { x: 1, y: 2 }, { x: 0, y: 1 }] },
  { id: "z-a", name: "Z Parça", weight: 4, cells: [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 1, y: 1 }, { x: 2, y: 1 }] },
  { id: "z-b", name: "Z Parça", weight: 4, cells: [{ x: 1, y: 0 }, { x: 2, y: 0 }, { x: 0, y: 1 }, { x: 1, y: 1 }] },
  { id: "plus", name: "Artı", weight: 3, cells: [{ x: 1, y: 0 }, { x: 0, y: 1 }, { x: 1, y: 1 }, { x: 2, y: 1 }, { x: 1, y: 2 }] },
  { id: "step", name: "Basamak", weight: 3, cells: [{ x: 0, y: 0 }, { x: 0, y: 1 }, { x: 1, y: 1 }, { x: 1, y: 2 }, { x: 2, y: 2 }] },
  { id: "u", name: "U Parça", weight: 3, cells: [{ x: 0, y: 0 }, { x: 2, y: 0 }, { x: 0, y: 1 }, { x: 1, y: 1 }, { x: 2, y: 1 }] },
];

const MODE_OPTIONS: Array<{ id: ModeKey; title: string; desc: string }> = [
  { id: "classic", title: "Klasik", desc: "Dengeli parça havuzu." },
  { id: "calm", title: "Sakin", desc: "Daha fazla yardımcı hak." },
  { id: "rush", title: "Süreli", desc: "3 dakikada en yüksek skor." },
];

const SETTING_TOGGLES: Array<{ key: keyof Omit<Settings, "theme" | "darkMode">; title: string; desc: string }> = [
  { key: "sound", title: "Ses", desc: "Yerleştirme ve temizleme sesleri." },
  { key: "haptics", title: "Titreşim", desc: "Mobilde hafif dokunsal geri bildirim." },
  { key: "reducedMotion", title: "Az Hareket", desc: "Animasyonları sadeleştirir." },
];

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

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
    Array.from({ length: BOARD_SIZE }, () => ({ filled: false })),
  );
}

function cloneBoard(board: Cell[][]): Cell[][] {
  return board.map((row) => row.map((cell) => ({ ...cell })));
}

function clonePiece(piece: Piece | null): Piece | null {
  return piece ? { ...piece, cells: piece.cells.map((cell) => ({ ...cell })) } : null;
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
  return cells
    .map((c) => ({ x: c.x - minX, y: c.y - minY }))
    .sort((a, b) => a.y - b.y || a.x - b.x);
}

function rotatePiece(piece: Piece): Piece {
  const rotated = piece.cells.map((c) => ({ x: c.y, y: -c.x }));
  return { ...piece, uid: `${piece.uid}-r`, cells: normalizeCells(rotated) };
}

function randomPiece(rand: () => number, difficulty = 0): Piece {
  const pool = SHAPES.flatMap((shape) => {
    const extra = shape.cells.length >= 5 ? Math.floor(difficulty / 5) : 0;
    return Array.from({ length: shape.weight + extra }, () => shape);
  });
  const shape = pool[Math.floor(rand() * pool.length)];
  const colors = PIECE_COLORS[Math.floor(rand() * PIECE_COLORS.length)];
  return {
    ...shape,
    cells: normalizeCells(shape.cells),
    color: colors.color,
    accent: colors.accent,
    uid: `${shape.id}-${Date.now().toString(36)}-${Math.floor(rand() * 999999).toString(36)}`,
  };
}

function createPieceSet(board: Cell[][], rand: () => number, difficulty = 0): Piece[] {
  let fallback = [randomPiece(rand, difficulty), randomPiece(rand, difficulty), randomPiece(rand, difficulty)];
  for (let attempt = 0; attempt < 30; attempt += 1) {
    const next = [randomPiece(rand, difficulty), randomPiece(rand, difficulty), randomPiece(rand, difficulty)];
    if (anyMove(board, next)) return next;
    fallback = next;
  }
  return fallback;
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
    next[row + y][col + x] = { filled: true, color: piece.color, accent: piece.accent };
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
      if (!board[r][c].filled) { full = false; break; }
    }
    if (full) cols.push(c);
  }
  if (!rows.length && !cols.length) return { board, rows, cols, cleared: 0 };
  const cleared = new Set<string>();
  rows.forEach((r) => { for (let c = 0; c < BOARD_SIZE; c += 1) cleared.add(`${r},${c}`); });
  cols.forEach((c) => { for (let r = 0; r < BOARD_SIZE; r += 1) cleared.add(`${r},${c}`); });
  const next = cloneBoard(board);
  cleared.forEach((key) => {
    const [r, c] = key.split(",").map(Number);
    next[r][c] = { filled: false };
  });
  return { board: next, rows, cols, cleared: cleared.size };
}

function loadJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return { ...fallback, ...JSON.parse(raw) } as T;
  } catch { return fallback; }
}

function saveJson(key: string, value: unknown) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch { return; }
}

function loadSettings() {
  const saved = loadJson<Partial<Settings>>(STORAGE_SETTINGS, DEFAULT_SETTINGS);
  return {
    theme: (saved.theme && saved.theme in THEMES ? saved.theme : DEFAULT_SETTINGS.theme) as ThemeKey,
    darkMode: typeof saved.darkMode === "boolean" ? saved.darkMode : DEFAULT_SETTINGS.darkMode,
    sound: typeof saved.sound === "boolean" ? saved.sound : DEFAULT_SETTINGS.sound,
    haptics: typeof saved.haptics === "boolean" ? saved.haptics : DEFAULT_SETTINGS.haptics,
    reducedMotion: typeof saved.reducedMotion === "boolean" ? saved.reducedMotion : DEFAULT_SETTINGS.reducedMotion,
  };
}

function loadStats() {
  const stats = loadJson(STORAGE_STATS, DEFAULT_STATS);
  const best = parseInt(localStorage.getItem(BEST_SCORE_KEY) || "0", 10) || 0;
  return { ...stats, best: Math.max(stats.best, best) };
}

function formatTime(total: number) {
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

function createAudio() {
  const AudioCtor =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AudioCtor) return null;
  const ctx = new AudioCtor();
  const master = ctx.createGain();
  master.gain.value = 0.045;
  master.connect(ctx.destination);
  const playTone = (freq: number, duration = 0.16, gain = 0.055, type: OscillatorType = "sine") => {
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
  return { ctx, playTone };
}

function MiniPiece({ piece, small = false, dim = false }: { piece: Piece; small?: boolean; dim?: boolean }) {
  const bounds = shapeBounds(piece.cells);
  const size = small ? 10 : 20;
  const gap = small ? 2 : 3;
  return (
    <div
      className="bb-mini-piece"
      style={{
        width: bounds.width * size + (bounds.width - 1) * gap,
        height: bounds.height * size + (bounds.height - 1) * gap,
        opacity: dim ? 0.38 : 1,
      }}
    >
      {piece.cells.map((cell, index) => (
        <span
          key={`${cell.x}-${cell.y}-${index}`}
          style={
            {
              width: size,
              height: size,
              left: cell.x * (size + gap),
              top: cell.y * (size + gap),
              "--piece-color": piece.color,
              "--piece-accent": piece.accent,
            } as CSSProperties
          }
        />
      ))}
    </div>
  );
}

const SPARKLE_POSITIONS = [
  { top: "7%",  left: "8%",  delay: "0s",    dur: "3.2s", size: "lg" },
  { top: "12%", right: "6%", delay: "0.8s",  dur: "2.6s", size: "sm" },
  { top: "28%", left: "4%",  delay: "1.4s",  dur: "4s",   size: "sm" },
  { top: "18%", left: "42%", delay: "0.3s",  dur: "3.6s", size: "md" },
  { bottom: "30%", right: "9%", delay: "1s", dur: "2.8s", size: "md" },
  { bottom: "20%", left: "12%", delay: "1.8s", dur: "3.4s", size: "sm" },
  { top: "55%", right: "5%", delay: "0.5s",  dur: "3s",   size: "lg" },
  { bottom: "12%", left: "38%", delay: "2s", dur: "2.4s", size: "sm" },
  { top: "38%", left: "2%",  delay: "2.4s",  dur: "3.8s", size: "md" },
  { top: "8%",  right: "28%", delay: "1.2s", dur: "2.9s", size: "sm" },
];

function PixelSparkles() {
  return (
    <div className="bb-sparkles" aria-hidden="true">
      {SPARKLE_POSITIONS.map((pos, i) => (
        <span
          key={i}
          className={`bb-sparkle bb-sp-${pos.size}`}
          style={
            {
              ...pos,
              animationDelay: pos.delay,
              animationDuration: pos.dur,
            } as CSSProperties
          }
        >
          ✦
        </span>
      ))}
    </div>
  );
}

export default function BlockBloomPuzzle() {
  const [settings, setSettings] = useState<Settings>(loadSettings);
  const [stats, setStats] = useState<Stats>(loadStats);
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
  const [dailyGame, setDailyGame] = useState(false);
  const [landingCells, setLandingCells] = useState<Set<string>>(new Set());
  const [scoreBumpKey, setScoreBumpKey] = useState(0);
  const [comboFlash, setComboFlash] = useState<{ value: number; id: number } | null>(null);
  const boardRef = useRef<HTMLDivElement | null>(null);
  const audioRef = useRef<ReturnType<typeof createAudio> | null>(null);
  const rngRef = useRef<() => number>(mulberry32(seed));
  const toastTimer = useRef<number | null>(null);
  const clearTimer = useRef<number | null>(null);
  const shakeTimer = useRef<number | null>(null);
  const landingTimer = useRef<number | null>(null);
  const comboFlashTimer = useRef<number | null>(null);
  const comboFlashId = useRef(0);

  const running = screen === "play" && !paused && !gameOver;
  const rushLeft = mode === "rush" ? Math.max(0, 180 - seconds) : null;
  const scoreTarget = mode === "rush" ? 2400 : mode === "calm" ? 1300 : 1800;
  const progress = clamp((score / scoreTarget) * 100, 0, 100);
  const averageScore = stats.games ? Math.round(stats.totalScore / stats.games) : 0;
  const activePiece = selected !== null ? pieces[selected] : null;

  const scoreLevel = Math.min(SCORE_LEVELS.length - 1, LEVEL_THRESHOLDS.filter((t) => score >= t).length - 1);
  const levelColor = SCORE_LEVELS[scoreLevel];

  const cssVars = useMemo(
    () =>
      ({
        "--bb-accent": levelColor.accent,
        "--bb-accent-dark": levelColor.accentDark,
      }) as CSSProperties,
    [levelColor.accent, levelColor.accentDark],
  );

  const showToast = useCallback((message: string) => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast(message);
    toastTimer.current = window.setTimeout(() => setToast(null), 1700);
  }, []);

  const vibrate = useCallback(
    (pattern: number | number[] = 20) => {
      if (settings.haptics && navigator.vibrate) navigator.vibrate(pattern);
    },
    [settings.haptics],
  );

  const playSfx = useCallback(
    (kind: "tap" | "place" | "clear" | "bad" | "win") => {
      if (!settings.sound) return;
      if (!audioRef.current) audioRef.current = createAudio();
      const audio = audioRef.current;
      if (!audio) return;
      if (audio.ctx.state === "suspended") void audio.ctx.resume();
      if (kind === "tap") audio.playTone(520, 0.08, 0.032, "triangle");
      if (kind === "place") audio.playTone(392, 0.12, 0.045, "sine");
      if (kind === "bad") audio.playTone(130, 0.14, 0.052, "sawtooth");
      if (kind === "clear") {
        audio.playTone(659, 0.16, 0.055, "triangle");
        window.setTimeout(() => audio.playTone(880, 0.18, 0.045, "sine"), 80);
      }
      if (kind === "win") {
        [523, 659, 784, 1046].forEach((n, i) =>
          window.setTimeout(() => audio.playTone(n, 0.16, 0.052, "triangle"), i * 80),
        );
      }
    },
    [settings.sound],
  );

  const makePieces = useCallback(
    (nextBoard: Cell[][], difficulty = Math.floor(score / 850)) =>
      createPieceSet(nextBoard, rngRef.current, difficulty),
    [score],
  );

  const finishGame = useCallback(
    (reason: EndReason) => {
      setGameOver(true);
      setSelected(null);
      setHoverCell(null);
      setHammerMode(false);
      playSfx(reason === "blocked" ? "bad" : "win");
      vibrate(reason === "blocked" ? 35 : [30, 40, 30]);
      setStats((old) => {
        const key = todayKey();
        const dailyStreak =
          dailyGame && old.lastDaily !== key ? old.dailyStreak + 1 : old.dailyStreak;
        return {
          ...old,
          games: old.games + 1,
          best: Math.max(old.best, score),
          totalScore: old.totalScore + score,
          biggestCombo: Math.max(old.biggestCombo, combo),
          dailyStreak,
          lastDaily: dailyGame ? key : old.lastDaily,
        };
      });
      showToast(reason === "time" ? "Süre doldu" : "Hamle kalmadı");
    },
    [combo, dailyGame, playSfx, score, showToast, vibrate],
  );

  const startNewGame = useCallback(
    (nextMode: ModeKey = mode, daily = false) => {
      const nextSeed = daily
        ? hashString(`block-bloom-${todayKey()}`)
        : Math.floor(Math.random() * 900000000);
      const nextBoard = emptyBoard();
      rngRef.current = mulberry32(nextSeed);
      setSeed(nextSeed);
      setMode(nextMode);
      setBoard(nextBoard);
      setPieces(createPieceSet(nextBoard, rngRef.current, 0));
      setScore(0);
      setCombo(0);
      setMoves(0);
      setSeconds(0);
      setPaused(false);
      setGameOver(false);
      setSelected(null);
      setHoverCell(null);
      setClearing(new Set());
      setTools({
        hammer: nextMode === "calm" ? 3 : 1,
        shuffle: nextMode === "calm" ? 2 : 1,
        undo: nextMode === "rush" ? 1 : 2,
      });
      setHammerMode(false);
      setHint(null);
      setHistory([]);
      setDailyGame(daily);
      setScreen("play");
      playSfx("tap");
      vibrate(12);
    },
    [mode, playSfx, vibrate],
  );

  useEffect(() => { saveJson(STORAGE_SETTINGS, settings); }, [settings]);

  useEffect(() => {
    saveJson(STORAGE_STATS, stats);
    localStorage.setItem(BEST_SCORE_KEY, String(stats.best));
  }, [stats]);

  useEffect(() => {
    if (!running) return;
    const id = window.setInterval(() => setSeconds((v) => v + 1), 1000);
    return () => window.clearInterval(id);
  }, [running]);

  useEffect(() => {
    if (mode !== "rush" || rushLeft !== 0 || screen !== "play" || gameOver) return;
    const id = window.setTimeout(() => finishGame("time"), 0);
    return () => window.clearTimeout(id);
  }, [finishGame, gameOver, mode, rushLeft, screen]);

  useEffect(() => {
    if (screen !== "play" || gameOver || hammerMode || !pieces.some(Boolean)) return;
    if (anyMove(board, pieces)) return;
    const id = window.setTimeout(() => finishGame("blocked"), 450);
    return () => window.clearTimeout(id);
  }, [board, finishGame, gameOver, hammerMode, pieces, screen]);

  useEffect(() => {
    if (screen !== "play" || gameOver) return;
    const snapshot: GameSnapshot = { board, pieces, score, combo, moves, tools, mode, seed, seconds, dailyGame };
    saveJson(STORAGE_SAVE, snapshot);
  }, [board, combo, dailyGame, gameOver, mode, moves, pieces, score, screen, seconds, seed, tools]);

  useEffect(
    () => () => {
      if (toastTimer.current) clearTimeout(toastTimer.current);
      if (clearTimer.current) clearTimeout(clearTimer.current);
      if (shakeTimer.current) clearTimeout(shakeTimer.current);
      if (landingTimer.current) clearTimeout(landingTimer.current);
      if (comboFlashTimer.current) clearTimeout(comboFlashTimer.current);
    },
    [],
  );

  const pushHistory = useCallback(() => {
    setHistory((old) =>
      [{ board: cloneBoard(board), pieces: pieces.map(clonePiece), score, combo, moves, tools, mode, seed, seconds, dailyGame }, ...old].slice(0, 8),
    );
  }, [board, combo, dailyGame, mode, moves, pieces, score, seconds, seed, tools]);

  const calculatePlacementScore = useCallback(
    (piece: Piece, cleared: number, lines: number, currentCombo: number) => {
      const base = piece.cells.length * 12;
      const lineBonus = cleared > 0 ? cleared * 7 + lines * lines * 68 : 0;
      const comboBonus = currentCombo > 1 ? currentCombo * 42 : 0;
      const modeBonus = mode === "rush" ? Math.floor((base + lineBonus) * 0.16) : 0;
      return base + lineBonus + comboBonus + modeBonus;
    },
    [mode],
  );

  const shakeBoard = useCallback(() => {
    setShake(true);
    if (shakeTimer.current) clearTimeout(shakeTimer.current);
    shakeTimer.current = window.setTimeout(() => setShake(false), 280);
  }, []);

  const commitPlacement = useCallback(
    (pieceIndex: number, row: number, col: number) => {
      const piece = pieces[pieceIndex];
      if (!piece || !canPlace(board, piece, row, col) || gameOver || paused) {
        shakeBoard(); playSfx("bad"); vibrate(30); return;
      }
      pushHistory();
      const afterPlace = placePiece(board, piece, row, col);
      const clear = clearLines(afterPlace);
      const lines = clear.rows.length + clear.cols.length;
      const nextCombo = lines > 0 ? combo + 1 : 0;
      const gained = calculatePlacementScore(piece, clear.cleared, lines, nextCombo);
      const nextScore = score + gained;
      const nextPieces = pieces.slice();
      nextPieces[pieceIndex] = null;
      const refilled = nextPieces.every((p) => p === null)
        ? makePieces(clear.board, Math.floor(nextScore / 850))
        : nextPieces;
      setBoard(clear.board);
      setPieces(refilled);
      setScore(nextScore);
      setCombo(nextCombo);
      setMoves((v) => v + 1);
      setSelected(null);
      setHoverCell(null);
      setHint(null);
      setHammerMode(false);
      playSfx(lines > 0 ? "clear" : "place");
      vibrate(lines > 0 ? [15, 25, 15] : 12);

      // Landing bounce effect on placed cells
      const newLanding = new Set<string>();
      piece.cells.forEach(({ x, y }) => newLanding.add(`${row + y},${col + x}`));
      setLandingCells(newLanding);
      if (landingTimer.current) clearTimeout(landingTimer.current);
      landingTimer.current = window.setTimeout(() => setLandingCells(new Set()), settings.reducedMotion ? 0 : 450);

      // Score bump animation
      setScoreBumpKey((k) => k + 1);

      // Combo flash badge
      if (nextCombo >= 2) {
        comboFlashId.current += 1;
        setComboFlash({ value: nextCombo, id: comboFlashId.current });
        if (comboFlashTimer.current) clearTimeout(comboFlashTimer.current);
        comboFlashTimer.current = window.setTimeout(() => setComboFlash(null), 1400);
      }
      if (clear.cleared) {
        const clearKeys = new Set<string>();
        clear.rows.forEach((r) => { for (let c = 0; c < BOARD_SIZE; c += 1) clearKeys.add(`${r},${c}`); });
        clear.cols.forEach((c) => { for (let r = 0; r < BOARD_SIZE; r += 1) clearKeys.add(`${r},${c}`); });
        setClearing(clearKeys);
        if (clearTimer.current) clearTimeout(clearTimer.current);
        clearTimer.current = window.setTimeout(() => setClearing(new Set()), settings.reducedMotion ? 80 : 360);
        setStats((old) => ({ ...old, totalClears: old.totalClears + clear.cleared, biggestCombo: Math.max(old.biggestCombo, nextCombo) }));
        if (lines >= 3) showToast(`${lines} çizgi temizlendi`);
        else if (nextCombo >= 3) showToast(`${nextCombo}x kombo`);
      }
      if (nextScore > 0 && Math.floor(nextScore / 1400) > Math.floor(score / 1400)) {
        setTools((old) => ({ ...old, hammer: old.hammer + 1 }));
        showToast("Bir çekiç kazandın");
      }
    },
    [board, calculatePlacementScore, combo, gameOver, makePieces, paused, pieces, playSfx, pushHistory, score, settings.reducedMotion, shakeBoard, showToast, vibrate],
  );

  const cellFromEvent = useCallback((clientX: number, clientY: number, piece?: Piece | null) => {
    const el = boardRef.current;
    if (!el) return null;
    const rect = el.getBoundingClientRect();
    const style = window.getComputedStyle(el);
    const gap = parseFloat(style.gap || "3") || 3;
    const cellSize = (rect.width - gap * (BOARD_SIZE - 1)) / BOARD_SIZE;
    const offsetX = clientX - rect.left;
    const offsetY = clientY - rect.top;
    const col = Math.floor(offsetX / (cellSize + gap));
    const row = Math.floor(offsetY / (cellSize + gap));
    if (row < 0 || row >= BOARD_SIZE || col < 0 || col >= BOARD_SIZE) return null;
    if (!piece) return { row, col };
    const bounds = shapeBounds(piece.cells);
    const isTouch = typeof window !== "undefined" && window.matchMedia("(pointer: coarse)").matches;
    const rowOffset = isTouch ? 2 : 0;
    return {
      row: clamp(row - Math.floor(bounds.height / 2) - rowOffset, 0, BOARD_SIZE - bounds.height),
      col: clamp(col - Math.floor(bounds.width / 2), 0, BOARD_SIZE - bounds.width),
    };
  }, []);

  const onBoardPointerMove = useCallback(
    (e: PointerEvent<HTMLDivElement>) => {
      if (selected === null || !pieces[selected]) return;
      setHoverCell(cellFromEvent(e.clientX, e.clientY, pieces[selected]));
    },
    [cellFromEvent, pieces, selected],
  );

  const onBoardPointerUp = useCallback(
    (e: PointerEvent<HTMLDivElement>) => {
      if (hammerMode) {
        const cell = cellFromEvent(e.clientX, e.clientY);
        if (!cell || tools.hammer <= 0) return;
        if (!board[cell.row][cell.col].filled) { playSfx("bad"); showToast("Çekiç dolu hücrede kullanılır"); return; }
        pushHistory();
        const next = cloneBoard(board);
        next[cell.row][cell.col] = { filled: false };
        setBoard(next);
        setTools((old) => ({ ...old, hammer: old.hammer - 1 }));
        setHammerMode(false);
        setScore((v) => Math.max(0, v - 25));
        playSfx("clear");
        vibrate([15, 25]);
        return;
      }
      if (selected === null || !pieces[selected]) return;
      const cell = cellFromEvent(e.clientX, e.clientY, pieces[selected]);
      if (cell) commitPlacement(selected, cell.row, cell.col);
    },
    [board, cellFromEvent, commitPlacement, hammerMode, pieces, playSfx, pushHistory, selected, showToast, tools.hammer, vibrate],
  );

  const onPiecePointerDown = useCallback(
    (index: number, e: PointerEvent<HTMLButtonElement>) => {
      e.currentTarget.setPointerCapture?.(e.pointerId);
      if (!pieces[index]) return;
      setHammerMode(false);
      setSelected(index);
      setHint(null);
      playSfx("tap");
      vibrate(8);
    },
    [pieces, playSfx, vibrate],
  );

  const onPiecePointerMove = useCallback(
    (index: number, e: PointerEvent<HTMLButtonElement>) => {
      if (selected !== index || !pieces[index]) return;
      setHoverCell(cellFromEvent(e.clientX, e.clientY, pieces[index]));
    },
    [cellFromEvent, pieces, selected],
  );

  const onPiecePointerUp = useCallback(
    (index: number, e: PointerEvent<HTMLButtonElement>) => {
      if (selected !== index || !pieces[index]) return;
      const cell = cellFromEvent(e.clientX, e.clientY, pieces[index]);
      if (cell) commitPlacement(index, cell.row, cell.col);
    },
    [cellFromEvent, commitPlacement, pieces, selected],
  );

  const selectPiece = useCallback(
    (index: number) => {
      if (!pieces[index]) return;
      setSelected((old) => (old === index ? null : index));
      setHammerMode(false);
      setHint(null);
      playSfx("tap");
    },
    [pieces, playSfx],
  );

  const boardPreview = useMemo(() => {
    if (selected === null || !hoverCell || !pieces[selected]) return new Set<string>();
    return new Set(pieces[selected].cells.map(({ x, y }) => `${hoverCell.row + y},${hoverCell.col + x}`));
  }, [hoverCell, pieces, selected]);

  const isPreviewValid = useMemo(() => {
    if (selected === null || !hoverCell || !pieces[selected]) return false;
    return canPlace(board, pieces[selected], hoverCell.row, hoverCell.col);
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
            setHammerMode(false);
            showToast(`${piece.name} için yer gösterildi`);
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
    setPieces(makePieces(board, Math.floor(score / 850)));
    setTools((old) => ({ ...old, shuffle: old.shuffle - 1 }));
    setSelected(null);
    setHint(null);
    setHammerMode(false);
    playSfx("clear");
    vibrate([10, 20, 10]);
  }, [board, makePieces, playSfx, pushHistory, score, tools.shuffle, vibrate]);

  const undo = useCallback(() => {
    if (tools.undo <= 0 || history.length === 0) return;
    const [last, ...rest] = history;
    setBoard(last.board);
    setPieces(last.pieces.map(clonePiece));
    setScore(last.score);
    setCombo(last.combo);
    setMoves(last.moves);
    setMode(last.mode);
    setSeed(last.seed);
    setSeconds(last.seconds);
    setDailyGame(last.dailyGame);
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
    setPieces((old) => old.map((piece, index) => (index === selected && piece ? rotatePiece(piece) : piece)));
    setHint(null);
    playSfx("tap");
  }, [pieces, playSfx, pushHistory, selected]);

  const resumeSaved = useCallback(() => {
    try {
      const raw = localStorage.getItem(STORAGE_SAVE);
      if (!raw) { showToast("Kayıtlı oyun yok"); return false; }
      const save = JSON.parse(raw) as GameSnapshot;
      if (!Array.isArray(save.board) || !Array.isArray(save.pieces)) { showToast("Kayıt okunamadı"); return false; }
      setBoard(save.board);
      setPieces(save.pieces.map(clonePiece));
      setScore(save.score || 0);
      setCombo(save.combo || 0);
      setMoves(save.moves || 0);
      setMode(save.mode || "classic");
      setSeed(save.seed || 1);
      rngRef.current = mulberry32((save.seed || 1) + (save.moves || 0) + (save.score || 0));
      setSeconds(save.seconds || 0);
      setTools(save.tools || { hammer: 1, shuffle: 1, undo: 2 });
      setDailyGame(Boolean(save.dailyGame));
      setPaused(false);
      setGameOver(false);
      setScreen("play");
      setSelected(null);
      setHint(null);
      setHammerMode(false);
      return true;
    } catch { showToast("Kayıt okunamadı"); return false; }
  }, [showToast]);

  const clearProgress = useCallback(() => {
    localStorage.removeItem(STORAGE_SAVE);
    localStorage.removeItem(BEST_SCORE_KEY);
    setStats(DEFAULT_STATS);
    saveJson(STORAGE_STATS, DEFAULT_STATS);
    showToast("İstatistikler sıfırlandı");
  }, [showToast]);

  return (
    <div className={cx("bb-root", settings.darkMode && "bb-dark", settings.reducedMotion && "bb-reduced")} style={cssVars}>
      {toast && <div className="bb-toast">{toast}</div>}

      {/* ── MENU SCREEN ── */}
      {screen === "menu" && (
        <div className="bb-screen bb-menu-screen">
          <PixelSparkles />

          <div className="bb-menu-hero">
            <div className="bb-px-logomark" aria-hidden="true">
              {Array.from({ length: 9 }, (_, i) => <span key={i} className={`lm-${i}`} />)}
            </div>
            <h1 className="bb-px-title">
              <span>BLOCK</span>
              <span>BLAST</span>
            </h1>
            <div className="bb-px-subtitle">✦ PİXEL BULMACA ✦</div>
          </div>

          <div className="bb-mode-picker">
            {MODE_OPTIONS.map((m) => (
              <button
                key={m.id}
                className={cx("bb-mode-chip", mode === m.id && "active")}
                onClick={() => setMode(m.id)}
              >
                <strong>{m.title.toUpperCase()}</strong>
                <small>{m.desc}</small>
              </button>
            ))}
          </div>

          <div className="bb-menu-cta">
            <button className="bb-btn-play" onClick={() => startNewGame(mode)}>
              ▶ YENİ OYUN
            </button>
            <div className="bb-menu-row">
              <button className="bb-btn-ghost" onClick={resumeSaved}>DEVAM ET</button>
              <button className="bb-btn-ghost" onClick={() => startNewGame("classic", true)}>GÜNLÜK</button>
            </div>
          </div>

          <div className="bb-menu-stats-bar">
            <div className="bb-mstat">
              <span>EN İYİ</span>
              <strong>{stats.best.toLocaleString("tr-TR")}</strong>
            </div>
            <div className="bb-mstat">
              <span>OYUN</span>
              <strong>{stats.games}</strong>
            </div>
            <div className="bb-mstat">
              <span>ORTALAMA</span>
              <strong>{averageScore.toLocaleString("tr-TR")}</strong>
            </div>
          </div>

          <nav className="bb-menu-nav">
            <button onClick={() => setScreen("stats")}>SKORLAR</button>
            <button onClick={() => setScreen("how")}>NASIL?</button>
            <button onClick={() => setScreen("settings")}>AYARLAR</button>
          </nav>
        </div>
      )}

      {/* ── GAME SCREEN ── */}
      {screen === "play" && (
        <div className="bb-screen bb-game-screen">
          <header className="bb-game-header">
            <button className="bb-gh-btn" onClick={() => setScreen("menu")} aria-label="Menü">◀</button>
            <div className="bb-gh-scores">
              <div className="bb-ghs">
                <span>SKOR</span>
                <strong key={scoreBumpKey} className="bb-score-anim">{score.toLocaleString("tr-TR")}</strong>
              </div>
              {mode === "rush" && (
                <div className={cx("bb-ghs", rushLeft !== null && rushLeft < 30 && "danger")}>
                  <span>SÜRE</span>
                  <strong>{formatTime(rushLeft ?? 0)}</strong>
                </div>
              )}
              {combo > 1 && (
                <div className="bb-ghs bb-combo">
                  <span>KOMBO</span>
                  <strong>{combo}x</strong>
                </div>
              )}
              <div className="bb-ghs">
                <span>EN İYİ</span>
                <strong>{Math.max(stats.best, score).toLocaleString("tr-TR")}</strong>
              </div>
            </div>
            <button className="bb-gh-btn" onClick={() => setPaused(true)} aria-label="Duraklat">⏸</button>
          </header>

          {comboFlash && (
            <div key={comboFlash.id} className="bb-combo-badge" aria-live="assertive" aria-atomic="true">
              ×{comboFlash.value}
            </div>
          )}

          <div className="bb-px-progress" role="progressbar" aria-valuenow={progress}>
            <div className="bb-px-progress-fill" style={{ width: `${progress}%` }} />
          </div>

          <div className="bb-board-container">
            <div
              className={cx("bb-board", shake && "shake", hammerMode && "hammer")}
              ref={boardRef}
              onPointerMove={onBoardPointerMove}
              onPointerUp={onBoardPointerUp}
              onPointerLeave={() => setHoverCell(null)}
            >
              {board.map((row, r) =>
                row.map((cell, c) => {
                  const key = `${r},${c}`;
                  const preview = boardPreview.has(key);
                  const hinted = hint != null && pieces[hint.index]?.cells.some(
                    ({ x, y }) => hint.row + y === r && hint.col + x === c,
                  );
                  return (
                    <button
                      key={key}
                      className={cx(
                        "bb-cell",
                        cell.filled && "filled",
                        preview && (isPreviewValid ? "preview good" : "preview bad"),
                        clearing.has(key) && "clearing",
                        hinted && "hint",
                        landingCells.has(key) && "landing",
                      )}
                      style={
                        cell.filled
                          ? ({ "--cell-color": cell.color, "--cell-accent": cell.accent } as CSSProperties)
                          : undefined
                      }
                      onPointerDown={(e) => {
                        if (selected !== null && pieces[selected]) {
                          const target = cellFromEvent(e.clientX, e.clientY, pieces[selected]);
                          if (target) commitPlacement(selected, target.row, target.col);
                        } else if (hammerMode) {
                          const target = cellFromEvent(e.clientX, e.clientY);
                          if (target) onBoardPointerUp(e as unknown as PointerEvent<HTMLDivElement>);
                        }
                      }}
                      aria-label={`Hücre ${r + 1}, ${c + 1}`}
                    />
                  );
                }),
              )}
            </div>
          </div>

          <div className="bb-piece-tray">
            {pieces.map((piece, index) => (
              <button
                key={piece?.uid ?? `empty-${index}`}
                className={cx(
                  "bb-piece-slot",
                  selected === index && "selected",
                  piece && !hasMove(board, piece) && "blocked",
                )}
                disabled={!piece || paused || gameOver}
                onClick={() => selectPiece(index)}
                onPointerDown={(e) => onPiecePointerDown(index, e)}
                onPointerMove={(e) => onPiecePointerMove(index, e)}
                onPointerUp={(e) => onPiecePointerUp(index, e)}
                aria-label={piece ? `${piece.name} parçası` : "Boş parça alanı"}
              >
                {piece ? (
                  <MiniPiece piece={piece} dim={!hasMove(board, piece)} />
                ) : (
                  <span className="bb-slot-used">✓</span>
                )}
              </button>
            ))}
          </div>

          <div className="bb-toolbar">
            <button
              className={cx("bb-tool-btn", hammerMode && "active")}
              onClick={() => { setHammerMode((v) => !v); setSelected(null); }}
              disabled={tools.hammer <= 0}
              title="Çekiç - Hücre sil"
            >
              <span className="bb-tb-icon">🔨</span>
              <span className="bb-tb-label">ÇEKİÇ</span>
              <span className="bb-tb-count">{tools.hammer}</span>
            </button>
            <button
              className="bb-tool-btn"
              onClick={shufflePieces}
              disabled={tools.shuffle <= 0}
              title="Karıştır"
            >
              <span className="bb-tb-icon">🔀</span>
              <span className="bb-tb-label">KARIŞTIR</span>
              <span className="bb-tb-count">{tools.shuffle}</span>
            </button>
            <button
              className="bb-tool-btn"
              onClick={undo}
              disabled={tools.undo <= 0 || history.length === 0}
              title="Geri Al"
            >
              <span className="bb-tb-icon">↩</span>
              <span className="bb-tb-label">GERİ AL</span>
              <span className="bb-tb-count">{tools.undo}</span>
            </button>
            <button className="bb-tool-btn" onClick={useHint} title="İpucu">
              <span className="bb-tb-icon">💡</span>
              <span className="bb-tb-label">İPUCU</span>
            </button>
            <button
              className="bb-tool-btn"
              onClick={rotateSelected}
              disabled={!activePiece}
              title="Döndür"
            >
              <span className="bb-tb-icon">↻</span>
              <span className="bb-tb-label">DÖNDÜR</span>
            </button>
          </div>

          {(paused || gameOver) && (
            <div className="bb-overlay">
              <div className="bb-modal">
                {gameOver && score >= stats.best && score > 0 && (
                  <div className="bb-modal-crown">✦ YENİ REKOR ✦</div>
                )}
                <div className="bb-modal-badge">
                  {gameOver ? "— OYUN BİTTİ —" : "— DURAKLADI —"}
                </div>
                <div className="bb-modal-score">{score.toLocaleString("tr-TR")}</div>
                <div className="bb-modal-sub">
                  {gameOver
                    ? (mode === "rush" ? "Süre bitti." : "Hamle kalmadı.")
                    : "Oyun beklemede."}
                </div>
                <div className="bb-modal-actions">
                  {!gameOver && (
                    <button className="bb-btn-play" onClick={() => setPaused(false)}>▶ DEVAM</button>
                  )}
                  <button className="bb-btn-ghost" onClick={() => startNewGame(mode)}>YENİ OYUN</button>
                  <button className="bb-btn-ghost" onClick={() => setScreen("menu")}>ANA MENÜ</button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── SETTINGS SCREEN ── */}
      {screen === "settings" && (
        <div className="bb-screen bb-sub-screen">
          <div className="bb-sub-header">
            <button className="bb-back-link" onClick={() => setScreen("menu")}>◀ GERİ</button>
            <h2>AYARLAR</h2>
          </div>

          <div className="bb-setting-group">
            <div className="bb-sg-label">GÖRÜNÜM</div>
            <div className="bb-display-row">
              <button
                className={cx("bb-display-btn", !settings.darkMode && "active")}
                onClick={() => setSettings((v) => ({ ...v, darkMode: false }))}
              >
                <div className="bb-dp-preview bb-dp-light" />
                <strong>AYDINLIK</strong>
              </button>
              <button
                className={cx("bb-display-btn", settings.darkMode && "active")}
                onClick={() => setSettings((v) => ({ ...v, darkMode: true }))}
              >
                <div className="bb-dp-preview bb-dp-dark" />
                <strong>KARANLIK</strong>
              </button>
            </div>
          </div>

          <div className="bb-setting-group">
            <div className="bb-sg-label">OPSİYONLAR</div>
            <div className="bb-toggles">
              {SETTING_TOGGLES.map((item) => (
                <button
                  key={item.key}
                  className={cx("bb-toggle-btn", settings[item.key] && "active")}
                  onClick={() => setSettings((v) => ({ ...v, [item.key]: !v[item.key] }))}
                >
                  <span className="bb-tgl-state">{settings[item.key] ? "AÇIK" : "KAPALI"}</span>
                  <strong>{item.title.toUpperCase()}</strong>
                  <small>{item.desc}</small>
                </button>
              ))}
            </div>
          </div>

          <button className="bb-danger-btn" onClick={clearProgress}>
            İSTATİSTİKLERİ SIFIRLA
          </button>
        </div>
      )}

      {/* ── STATS SCREEN ── */}
      {screen === "stats" && (
        <div className="bb-screen bb-sub-screen">
          <div className="bb-sub-header">
            <button className="bb-back-link" onClick={() => setScreen("menu")}>◀ GERİ</button>
            <h2>İSTATİSTİKLER</h2>
          </div>
          <div className="bb-stats-grid">
            {[
              { label: "EN İYİ SKOR", value: stats.best.toLocaleString("tr-TR") },
              { label: "TOPLAM OYUN", value: String(stats.games) },
              { label: "ORTALAMA SKOR", value: averageScore.toLocaleString("tr-TR") },
              { label: "TEMİZLENEN HÜCRE", value: stats.totalClears.toLocaleString("tr-TR") },
              { label: "EN BÜYÜK KOMBO", value: `${stats.biggestCombo}x` },
              { label: "GÜNLÜK SERİ", value: String(stats.dailyStreak) },
            ].map((s) => (
              <div key={s.label} className="bb-stat-card">
                <span>{s.label}</span>
                <strong>{s.value}</strong>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── HOW TO PLAY SCREEN ── */}
      {screen === "how" && (
        <div className="bb-screen bb-sub-screen">
          <div className="bb-sub-header">
            <button className="bb-back-link" onClick={() => setScreen("menu")}>◀ GERİ</button>
            <h2>NASIL OYNANIR?</h2>
          </div>
          <div className="bb-how-list">
            {[
              { num: "01", title: "PARÇA SEÇ", desc: "Alttaki üç parçadan birini sürükle veya dokunarak seç." },
              { num: "02", title: "TAHTAYA YERLEŞTİR", desc: "10×10 alanda boş bir yere bırak. Satır veya sütun dolarsa temizlenir." },
              { num: "03", title: "ALANI AÇIK TUT", desc: "Üç parça bitince yeni set gelir. Hiçbir parça sığmazsa oyun biter." },
              { num: "04", title: "HAKLARI KULLAN", desc: "Çekiç hücre siler, karıştır yeni parçalar verir, geri al son hamleyi kurtarır." },
            ].map((step) => (
              <div key={step.num} className="bb-how-step">
                <div className="bb-step-num">{step.num}</div>
                <div className="bb-step-content">
                  <strong>{step.title}</strong>
                  <p>{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

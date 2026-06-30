import "./MahjongSanctuary.scss";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties } from "react";
import {
  Coins,
  Home,
  Lightbulb,
  Palette,
  Pause,
  Play,
  RotateCcw,
  Settings,
  ShoppingBag,
  Sparkles,
  X,
} from "lucide-react";

type Screen = "start" | "rules" | "playing" | "result";
type Status = "idle" | "playing" | "paused" | "won" | "lost";
type Panel = "mode" | "market" | null;
type ModeId = "calm" | "classic" | "rush";
type LayoutId = "compact" | "turtle" | "quick" | "diamond" | "bridge" | "fortress";
type TileKind = "dot" | "bamboo" | "character" | "wind" | "dragon" | "season";

interface ModeDef {
  id: ModeId;
  title: string;
  subtitle: string;
  layouts: LayoutId[];
  timeLimit: number | null;
}

interface ThemeDef {
  id: string;
  title: string;
  subtitle: string;
  price: number;
}

interface Face {
  id: string;
  kind: TileKind;
  rank?: number;
  mark: string;
  title: string;
  tone: string;
}

interface Slot {
  c: number;
  r: number;
  z: number;
}

interface Tile extends Slot, Face {
  uid: string;
  removed: boolean;
}

interface Result {
  won: boolean;
  reason: "cleared" | "locked" | "timeout";
  score: number;
  moves: number;
  elapsed: number;
  earned: number;
  mode: ModeDef;
}

interface BoardBox {
  width: number;
  height: number;
  tileW: number;
  tileH: number;
  stepX: number;
  stepY: number;
  lift: number;
  pad: number;
  minC: number;
  minR: number;
}

const BEST_KEY = "mahjong_best_score";
const COINS_KEY = "mahjong_coins";
const TILE_THEME_KEY = "mahjong_tile_theme";
const TABLE_THEME_KEY = "mahjong_table_theme";
const OWNED_TILE_THEMES_KEY = "mahjong_owned_tile_themes";
const OWNED_TABLE_THEMES_KEY = "mahjong_owned_table_themes";

const MODES: ModeDef[] = [
  {
    id: "calm",
    title: "Sakin",
    subtitle: "Kısa tahta, rahat tempo",
    layouts: ["compact", "diamond"],
    timeLimit: null,
  },
  {
    id: "classic",
    title: "Klasik",
    subtitle: "Turtle düzeni, tam oyun",
    layouts: ["turtle", "fortress", "bridge"],
    timeLimit: null,
  },
  {
    id: "rush",
    title: "Süreli",
    subtitle: "Kısa tahta, 4 dakika",
    layouts: ["quick", "diamond", "bridge"],
    timeLimit: 240,
  },
];

const TILE_THEMES: ThemeDef[] = [
  {
    id: "ivory",
    title: "Fildişi",
    subtitle: "Klasik salon taşı",
    price: 0,
  },
  {
    id: "jade",
    title: "Yeşim",
    subtitle: "Daha parlak ve temiz yüzey",
    price: 180,
  },
  {
    id: "ink",
    title: "Mürekkep",
    subtitle: "Koyu kenar, yüksek kontrast",
    price: 260,
  },
];

const TABLE_THEMES: ThemeDef[] = [
  {
    id: "walnut",
    title: "Salon Masası",
    subtitle: "Düz ahşap, yeşil oyun yüzeyi",
    price: 0,
  },
  {
    id: "stone",
    title: "Taş Bahçe",
    subtitle: "Sade zemin, serin masa ışığı",
    price: 220,
  },
  {
    id: "garden",
    title: "Hareketli Bahçe",
    subtitle: "Hafif yaprak efekti, doğal fon",
    price: 320,
  },
];

const BASE_FACES: Face[] = [
  ...Array.from({ length: 9 }, (_, i) => ({
    id: `dot-${i + 1}`,
    kind: "dot" as const,
    rank: i + 1,
    mark: `${i + 1}`,
    title: `${i + 1} Nokta`,
    tone: "#c83e47",
  })),
  ...Array.from({ length: 9 }, (_, i) => ({
    id: `bamboo-${i + 1}`,
    kind: "bamboo" as const,
    rank: i + 1,
    mark: `${i + 1}`,
    title: `${i + 1} Bambu`,
    tone: "#1f8c61",
  })),
  ...Array.from({ length: 9 }, (_, i) => ({
    id: `character-${i + 1}`,
    kind: "character" as const,
    rank: i + 1,
    mark: "萬",
    title: `${i + 1} Karakter`,
    tone: "#2c3f73",
  })),
  { id: "wind-east", kind: "wind", mark: "東", title: "Doğu", tone: "#233d76" },
  { id: "wind-south", kind: "wind", mark: "南", title: "Güney", tone: "#233d76" },
  { id: "wind-west", kind: "wind", mark: "西", title: "Batı", tone: "#233d76" },
  { id: "wind-north", kind: "wind", mark: "北", title: "Kuzey", tone: "#233d76" },
  { id: "dragon-red", kind: "dragon", mark: "中", title: "Kırmızı Ejder", tone: "#bd2f3a" },
  { id: "dragon-green", kind: "dragon", mark: "發", title: "Yeşil Ejder", tone: "#168957" },
  { id: "dragon-white", kind: "dragon", mark: "白", title: "Beyaz Ejder", tone: "#6d5aa8" },
  { id: "season-spring", kind: "season", mark: "春", title: "İlkbahar", tone: "#d45d82" },
  { id: "season-summer", kind: "season", mark: "夏", title: "Yaz", tone: "#c57b2e" },
  { id: "season-autumn", kind: "season", mark: "秋", title: "Güz", tone: "#b66536" },
  { id: "season-winter", kind: "season", mark: "冬", title: "Kış", tone: "#3f82a5" },
];

function formatTime(total: number) {
  const minutes = Math.floor(total / 60);
  const seconds = total % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

function shuffle<T>(items: T[]) {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function readNumber(key: string) {
  const raw = localStorage.getItem(key);
  return raw ? parseInt(raw, 10) || 0 : 0;
}

function readList(key: string, fallback: string[]) {
  const raw = localStorage.getItem(key);
  if (!raw) return fallback;
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((item) => typeof item === "string") : fallback;
  } catch {
    return fallback;
  }
}

function readTheme(key: string, themes: ThemeDef[]) {
  const raw = localStorage.getItem(key);
  return themes.some((theme) => theme.id === raw) ? raw ?? themes[0].id : themes[0].id;
}

function saveList(key: string, value: Set<string>) {
  localStorage.setItem(key, JSON.stringify([...value]));
}

function addRows(slots: Slot[], widths: number[], startR: number, z: number, center = 8) {
  widths.forEach((width, index) => {
    const startC = center - width / 2;
    for (let c = 0; c < width; c += 1) {
      slots.push({ c: startC + c, r: startR + index, z });
    }
  });
}

function buildSlots(layout: LayoutId) {
  const slots: Slot[] = [];

  if (layout === "turtle") {
    addRows(slots, [8, 12, 14, 16, 16, 14, 12, 8], 0, 0);
    addRows(slots, [8, 10, 10, 8], 1.2, 1);
    addRows(slots, [4, 4], 2.8, 2);
    return slots;
  }

  if (layout === "compact") {
    addRows(slots, [6, 8, 10, 10, 8, 6], 0, 0);
    addRows(slots, [4, 6, 8, 6, 4], 0.8, 1);
    addRows(slots, [2, 4, 4, 2], 1.8, 2);
    return slots;
  }

  if (layout === "diamond") {
    addRows(slots, [2, 4, 6, 8, 10, 8, 6, 4, 2], 0, 0);
    addRows(slots, [2, 4, 6, 4, 2], 1.6, 1);
    addRows(slots, [2, 2], 3.3, 2);
    return slots;
  }

  if (layout === "bridge") {
    addRows(slots, [4, 6, 8, 10, 10, 8, 6, 4], 0, 0);
    addRows(slots, [2, 4, 6, 6, 4, 2], 1, 1);
    addRows(slots, [2, 2], 2.8, 2);
    return slots;
  }

  if (layout === "fortress") {
    addRows(slots, [6, 8, 10, 12, 12, 10, 8, 6], 0, 0);
    addRows(slots, [4, 6, 8, 8, 6, 4], 1, 1);
    addRows(slots, [4, 4], 2.7, 2);
    addRows(slots, [2], 3.7, 3);
    return slots;
  }

  addRows(slots, [6, 8, 10, 10, 8, 6], 0, 0);
  addRows(slots, [4, 6, 6, 4], 1, 1);
  addRows(slots, [2, 2], 2.3, 2);
  return slots;
}

function makeDeck(pairCount: number) {
  const pairs = Array.from({ length: pairCount }, (_, index) => BASE_FACES[index % BASE_FACES.length]);
  return shuffle(pairs.flatMap((face) => [face, face]));
}

function pickLayout(mode: ModeDef) {
  return mode.layouts[Math.floor(Math.random() * mode.layouts.length)] ?? mode.layouts[0];
}

function dealTiles(mode: ModeDef, layout: LayoutId) {
  const slots = buildSlots(layout);
  const deck = makeDeck(slots.length / 2);
  return slots.map((slot, index) => ({
    ...slot,
    ...deck[index],
    uid: `${mode.id}-${layout}-${index}-${slot.c}-${slot.r}-${slot.z}`,
    removed: false,
  }));
}

function buildTiles(mode: ModeDef, layout: LayoutId) {
  let fallback = dealTiles(mode, layout);
  for (let attempt = 0; attempt < 40; attempt += 1) {
    const tiles = dealTiles(mode, layout);
    if (findPair(tiles)) return tiles;
    fallback = tiles;
  }
  return fallback;
}

function buildTilesForMode(mode: ModeDef) {
  return buildTiles(mode, pickLayout(mode));
}

function close(a: number, b: number) {
  return Math.abs(a - b) < 0.08;
}

const SIDE_FOOTPRINT_H = 0.82;
const COVER_FOOTPRINT_W = 1.18;
const COVER_FOOTPRINT_H = 2.05;
const COVER_LIFT_C = 0.15;
const COVER_LIFT_R = 0.22;
const COVER_TOLERANCE = 0.02;

function rowsOverlap(a: Tile, b: Tile) {
  return a.r < b.r + SIDE_FOOTPRINT_H && a.r + SIDE_FOOTPRINT_H > b.r;
}

function coverageBox(tile: Tile) {
  const left = tile.c + tile.z * COVER_LIFT_C;
  const top = tile.r - tile.z * COVER_LIFT_R;
  return {
    left,
    right: left + COVER_FOOTPRINT_W,
    top,
    bottom: top + COVER_FOOTPRINT_H,
  };
}

function footprintsOverlap(a: Tile, b: Tile) {
  const first = coverageBox(a);
  const second = coverageBox(b);
  return (
    first.left < second.right - COVER_TOLERANCE &&
    first.right > second.left + COVER_TOLERANCE &&
    first.top < second.bottom - COVER_TOLERANCE &&
    first.bottom > second.top + COVER_TOLERANCE
  );
}

function isOpen(tile: Tile, tiles: Tile[]) {
  if (tile.removed) return false;
  const covered = tiles.some(
    (other) =>
      !other.removed &&
      other.uid !== tile.uid &&
      other.z > tile.z &&
      footprintsOverlap(tile, other),
  );
  if (covered) return false;
  const leftBlocked = tiles.some(
    (other) =>
      !other.removed &&
      other.uid !== tile.uid &&
      other.z === tile.z &&
      rowsOverlap(tile, other) &&
      close(other.c + 1, tile.c),
  );
  const rightBlocked = tiles.some(
    (other) =>
      !other.removed &&
      other.uid !== tile.uid &&
      other.z === tile.z &&
      rowsOverlap(tile, other) &&
      close(other.c, tile.c + 1),
  );
  return !leftBlocked || !rightBlocked;
}

function canMatch(a: Tile, b: Tile) {
  if (a.kind === "season" && b.kind === "season") return true;
  return a.id === b.id;
}

function findPair(tiles: Tile[]) {
  const open = tiles.filter((tile) => isOpen(tile, tiles));
  for (let i = 0; i < open.length; i += 1) {
    for (let j = i + 1; j < open.length; j += 1) {
      if (canMatch(open[i], open[j])) return [open[i].uid, open[j].uid];
    }
  }
  return null;
}

function boardMetrics(tiles: Tile[], viewWidth: number): BoardBox {
  const minC = Math.min(...tiles.map((tile) => tile.c), 0);
  const maxC = Math.max(...tiles.map((tile) => tile.c), 12);
  const minR = Math.min(...tiles.map((tile) => tile.r), 0);
  const maxR = Math.max(...tiles.map((tile) => tile.r), 7);
  const maxZ = Math.max(...tiles.map((tile) => tile.z), 0);
  const cols = maxC - minC + 1;
  const minTarget = viewWidth < 520 ? 300 : 560;
  const availableWidth = viewWidth < 520 ? viewWidth - 64 : viewWidth - 34;
  const targetWidth = Math.min(Math.max(availableWidth, minTarget), 900);
  const stepX = targetWidth / (cols + 2.6);
  const tileW = stepX * 0.94;
  const tileH = tileW * 1.32;
  const stepY = tileH * 0.55;
  const lift = tileW * 0.16;
  const pad = tileW * 0.7;
  const width = pad * 2 + cols * stepX + tileW + maxZ * lift;
  const height = pad * 2 + (maxR - minR + 1) * stepY + tileH + maxZ * lift;
  return { width, height, tileW, tileH, stepX, stepY, lift, pad, minC, minR };
}

function initialMode() {
  return typeof window !== "undefined" && window.innerWidth < 520 ? MODES[0] : MODES[1];
}

function createAudio() {
  const AudioCtor =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AudioCtor) return null;
  const ctx = new AudioCtor();
  const master = ctx.createGain();
  master.gain.value = 0.055;
  master.connect(ctx.destination);

  const tone = (
    freq: number,
    duration = 0.12,
    gain = 0.055,
    type: OscillatorType = "sine",
    delay = 0,
  ) => {
    const osc = ctx.createOscillator();
    const vol = ctx.createGain();
    const t = ctx.currentTime + delay;
    osc.type = type;
    osc.frequency.value = freq;
    vol.gain.value = 0;
    osc.connect(vol);
    vol.connect(master);
    vol.gain.linearRampToValueAtTime(gain, t + 0.012);
    vol.gain.exponentialRampToValueAtTime(0.001, t + duration);
    osc.start(t);
    osc.stop(t + duration + 0.04);
  };

  return { ctx, tone };
}

function TileFace({ face }: { face: Face }) {
  if (face.kind === "dot" || face.kind === "bamboo") {
    return (
      <span className={`mj-face mj-face--${face.kind}`}>
        {Array.from({ length: face.rank ?? 1 }, (_, index) => (
          <i key={index} />
        ))}
      </span>
    );
  }

  if (face.kind === "character") {
    return (
      <span className="mj-face mj-face--character">
        <b>{face.rank}</b>
        <i>{face.mark}</i>
      </span>
    );
  }

  return (
    <span className={`mj-face mj-face--${face.kind}`}>
      <i>{face.mark}</i>
    </span>
  );
}

export default function MahjongSanctuary() {
  const [mode, setMode] = useState<ModeDef>(() => initialMode());
  const [screen, setScreen] = useState<Screen>("start");
  const [status, setStatus] = useState<Status>("idle");
  const [panel, setPanel] = useState<Panel>(null);
  const [tiles, setTiles] = useState<Tile[]>(() => buildTilesForMode(initialMode()));
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [hintIds, setHintIds] = useState<string[]>([]);
  const [matchedIds, setMatchedIds] = useState<string[]>([]);
  const [blockedId, setBlockedId] = useState<string | null>(null);
  const [wrongIds, setWrongIds] = useState<string[]>([]);
  const [score, setScore] = useState(0);
  const [best, setBest] = useState(() => readNumber(BEST_KEY));
  const [coins, setCoins] = useState(() => readNumber(COINS_KEY));
  const [roundCoins, setRoundCoins] = useState(0);
  const [moves, setMoves] = useState(0);
  const [combo, setCombo] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [result, setResult] = useState<Result | null>(null);
  const [tileTheme, setTileTheme] = useState(() => readTheme(TILE_THEME_KEY, TILE_THEMES));
  const [tableTheme, setTableTheme] = useState(() => readTheme(TABLE_THEME_KEY, TABLE_THEMES));
  const [ownedTileThemes, setOwnedTileThemes] = useState<Set<string>>(
    () => new Set(readList(OWNED_TILE_THEMES_KEY, ["ivory"])),
  );
  const [ownedTableThemes, setOwnedTableThemes] = useState<Set<string>>(
    () => new Set(readList(OWNED_TABLE_THEMES_KEY, ["walnut"])),
  );
  const [notice, setNotice] = useState("");
  const [scoreBurst, setScoreBurst] = useState<{ id: number; amount: number; speed: boolean } | null>(null);
  const [coinBurst, setCoinBurst] = useState<{ id: number; amount: number } | null>(null);
  const [streakKey, setStreakKey] = useState(0);
  const [boardRound, setBoardRound] = useState(0);
  const [viewWidth, setViewWidth] = useState(() =>
    typeof window === "undefined" ? 760 : window.innerWidth,
  );
  const hintTimer = useRef<number | null>(null);
  const blockedTimer = useRef<number | null>(null);
  const matchTimer = useRef<number | null>(null);
  const wrongTimer = useRef<number | null>(null);
  const noticeTimer = useRef<number | null>(null);
  const audioRef = useRef<ReturnType<typeof createAudio> | null>(null);
  const burstId = useRef(0);
  const lastMatchAt = useRef<number | null>(null);

  const openIds = useMemo(
    () => new Set(tiles.filter((tile) => isOpen(tile, tiles)).map((tile) => tile.uid)),
    [tiles],
  );
  const availablePair = useMemo(() => findPair(tiles), [tiles]);
  const box = useMemo(() => boardMetrics(tiles, viewWidth), [tiles, viewWidth]);
  const timeLeft =
    mode.timeLimit == null ? null : Math.max(0, mode.timeLimit - elapsed);

  function playSfx(kind: "select" | "match" | "bad" | "hint" | "coin") {
    if (!audioRef.current) audioRef.current = createAudio();
    const audio = audioRef.current;
    if (!audio) return;
    if (audio.ctx.state === "suspended") void audio.ctx.resume();
    if (kind === "select") audio.tone(440, 0.055, 0.026, "triangle");
    if (kind === "hint") audio.tone(660, 0.08, 0.032, "sine");
    if (kind === "coin") {
      audio.tone(820, 0.08, 0.032, "triangle");
      audio.tone(1040, 0.09, 0.026, "sine", 0.055);
    }
    if (kind === "bad") {
      audio.tone(170, 0.09, 0.05, "sawtooth");
      audio.tone(118, 0.12, 0.04, "triangle", 0.055);
    }
    if (kind === "match") {
      audio.tone(520, 0.08, 0.04, "triangle");
      audio.tone(760, 0.11, 0.036, "sine", 0.07);
      audio.tone(980, 0.08, 0.026, "sine", 0.13);
    }
  }

  const awardCoins = useCallback((amount: number) => {
    if (amount <= 0) return;
    setCoins((value) => {
      const next = value + amount;
      localStorage.setItem(COINS_KEY, String(next));
      return next;
    });
    burstId.current += 1;
    setCoinBurst({ id: burstId.current, amount });
  }, []);

  const finish = useCallback(
    (
      won: boolean,
      finalScore: number,
      finalMoves = moves,
      earnedSoFar = roundCoins,
      reason: Result["reason"] = won ? "cleared" : "timeout",
    ) => {
      const nextScore = Math.max(0, finalScore);
      const bestScore = Math.max(best, nextScore);
      const bonusCoins = won
        ? Math.max(25, Math.round(nextScore / 120))
        : Math.max(4, Math.round(earnedSoFar * 0.15));
      const finalEarned = earnedSoFar + bonusCoins;
      setBest(bestScore);
      localStorage.setItem(BEST_KEY, String(bestScore));
      awardCoins(bonusCoins);
      setRoundCoins(finalEarned);
      setResult({
        won,
        reason,
        score: nextScore,
        moves: finalMoves,
        elapsed,
        earned: finalEarned,
        mode,
      });
      setStatus(won ? "won" : "lost");
      setScreen("result");
    },
    [awardCoins, best, elapsed, mode, moves, roundCoins],
  );

  useEffect(() => {
    const onResize = () => setViewWidth(window.innerWidth);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => {
    if (status !== "playing") return;
    const timer = window.setInterval(() => setElapsed((value) => value + 1), 1000);
    return () => window.clearInterval(timer);
  }, [status]);

  useEffect(() => {
    if (status !== "playing" || mode.timeLimit == null) return;
    if (elapsed < mode.timeLimit) return;
    const timeout = window.setTimeout(() => finish(false, score), 0);
    return () => window.clearTimeout(timeout);
  }, [elapsed, finish, mode.timeLimit, score, status]);

  useEffect(
    () => () => {
      if (hintTimer.current) clearTimeout(hintTimer.current);
      if (blockedTimer.current) clearTimeout(blockedTimer.current);
      if (matchTimer.current) clearTimeout(matchTimer.current);
      if (wrongTimer.current) clearTimeout(wrongTimer.current);
      if (noticeTimer.current) clearTimeout(noticeTimer.current);
    },
    [],
  );

  function setMarketNotice(text: string) {
    setNotice(text);
    if (noticeTimer.current) clearTimeout(noticeTimer.current);
    noticeTimer.current = window.setTimeout(() => setNotice(""), 1800);
  }

  function bumpScore(amount: number, speed: boolean) {
    burstId.current += 1;
    setScoreBurst({ id: burstId.current, amount, speed });
  }

  function start(nextMode = mode) {
    setMode(nextMode);
    setPanel(null);
    setTiles(buildTilesForMode(nextMode));
    setSelectedId(null);
    setHintIds([]);
    setMatchedIds([]);
    setBlockedId(null);
    setWrongIds([]);
    setScore(0);
    setRoundCoins(0);
    setMoves(0);
    setCombo(0);
    setElapsed(0);
    setStreakKey(0);
    setBoardRound((value) => value + 1);
    setResult(null);
    setStatus("playing");
    setScreen("playing");
    lastMatchAt.current = null;
  }

  function returnToMenu() {
    setStatus("idle");
    setScreen("start");
    setPanel(null);
    setSelectedId(null);
    setHintIds([]);
    setWrongIds([]);
    setMatchedIds([]);
  }

  function pauseGame() {
    if (status !== "playing") return;
    setStatus("paused");
  }

  function resumeGame() {
    if (status !== "paused") return;
    setStatus("playing");
  }

  function flashBlocked(uid: string) {
    setBlockedId(uid);
    playSfx("bad");
    if (blockedTimer.current) clearTimeout(blockedTimer.current);
    blockedTimer.current = window.setTimeout(() => setBlockedId(null), 420);
  }

  function flashWrong(ids: string[]) {
    setWrongIds(ids);
    setSelectedId(null);
    setCombo(0);
    setStreakKey((value) => value + 1);
    playSfx("bad");
    if (wrongTimer.current) clearTimeout(wrongTimer.current);
    wrongTimer.current = window.setTimeout(() => setWrongIds([]), 460);
  }

  function handleTile(tile: Tile, eventTime: number) {
    if (status !== "playing" || tile.removed) return;
    if (!openIds.has(tile.uid)) {
      flashBlocked(tile.uid);
      return;
    }
    if (!selectedId) {
      setSelectedId(tile.uid);
      playSfx("select");
      return;
    }
    if (selectedId === tile.uid) {
      setSelectedId(null);
      return;
    }
    const first = tiles.find((item) => item.uid === selectedId);
    if (!first) {
      setSelectedId(tile.uid);
      return;
    }
    if (!canMatch(first, tile)) {
      setMoves((value) => value + 1);
      flashWrong([first.uid, tile.uid]);
      return;
    }

    const now = eventTime;
    const gap = lastMatchAt.current == null ? null : now - lastMatchAt.current;
    const speedBonus = gap != null && gap <= 5500 ? Math.max(10, Math.round((5500 - gap) / 85)) : 0;
    lastMatchAt.current = now;

    const finalMoves = moves + 1;
    const nextCombo = combo + 1;
    const pairScore =
      110 + nextCombo * 26 + speedBonus + (mode.id === "rush" ? 34 : mode.id === "calm" ? 10 : 18);
    const matchCoins = Math.max(2, 2 + Math.floor(nextCombo / 2) + (speedBonus > 0 ? 2 : 0));
    const nextScore = score + pairScore;
    const earnedAfterMatch = roundCoins + matchCoins;
    const removedIds = [first.uid, tile.uid];
    const nextTiles = tiles.map((item) =>
      removedIds.includes(item.uid) ? { ...item, removed: true } : item,
    );

    setTiles(nextTiles);
    setSelectedId(null);
    setHintIds([]);
    setMatchedIds(removedIds);
    setMoves(finalMoves);
    setCombo(nextCombo);
    setScore(nextScore);
    setRoundCoins(earnedAfterMatch);
    if (nextCombo >= 2) setStreakKey((value) => value + 1);
    bumpScore(pairScore, speedBonus > 0);
    awardCoins(matchCoins);
    playSfx("match");
    if (matchTimer.current) clearTimeout(matchTimer.current);
    matchTimer.current = window.setTimeout(() => setMatchedIds([]), 520);

    const nextRemaining = nextTiles.filter((item) => !item.removed).length;
    if (nextRemaining === 0) {
      const timeBonus =
        mode.timeLimit == null
          ? Math.max(0, 260 - elapsed)
          : Math.max(0, mode.timeLimit - elapsed) * 3;
      finish(true, nextScore + timeBonus, finalMoves, earnedAfterMatch, "cleared");
      return;
    }
    if (!findPair(nextTiles)) {
      finish(false, nextScore, finalMoves, earnedAfterMatch, "locked");
    }
  }

  function showHint() {
    if (status !== "playing") return;
    const pair = availablePair;
    if (!pair) {
      playSfx("bad");
      return;
    }
    setHintIds([pair[0], pair[1]]);
    setSelectedId(null);
    setScore((value) => Math.max(0, value - 30));
    setCombo(0);
    playSfx("hint");
    if (hintTimer.current) clearTimeout(hintTimer.current);
    hintTimer.current = window.setTimeout(() => setHintIds([]), 1500);
  }

  function chooseTileTheme(theme: ThemeDef) {
    if (ownedTileThemes.has(theme.id)) {
      setTileTheme(theme.id);
      localStorage.setItem(TILE_THEME_KEY, theme.id);
      playSfx("select");
      return;
    }
    if (coins < theme.price) {
      setMarketNotice("Bu taş için biraz daha para lazım.");
      playSfx("bad");
      return;
    }
    const nextOwned = new Set(ownedTileThemes).add(theme.id);
    setOwnedTileThemes(nextOwned);
    saveList(OWNED_TILE_THEMES_KEY, nextOwned);
    setCoins((value) => {
      const next = value - theme.price;
      localStorage.setItem(COINS_KEY, String(next));
      return next;
    });
    setTileTheme(theme.id);
    localStorage.setItem(TILE_THEME_KEY, theme.id);
    setMarketNotice(`${theme.title} açıldı.`);
    playSfx("coin");
  }

  function chooseTableTheme(theme: ThemeDef) {
    if (ownedTableThemes.has(theme.id)) {
      setTableTheme(theme.id);
      localStorage.setItem(TABLE_THEME_KEY, theme.id);
      playSfx("select");
      return;
    }
    if (coins < theme.price) {
      setMarketNotice("Bu masa için biraz daha para lazım.");
      playSfx("bad");
      return;
    }
    const nextOwned = new Set(ownedTableThemes).add(theme.id);
    setOwnedTableThemes(nextOwned);
    saveList(OWNED_TABLE_THEMES_KEY, nextOwned);
    setCoins((value) => {
      const next = value - theme.price;
      localStorage.setItem(COINS_KEY, String(next));
      return next;
    });
    setTableTheme(theme.id);
    localStorage.setItem(TABLE_THEME_KEY, theme.id);
    setMarketNotice(`${theme.title} açıldı.`);
    playSfx("coin");
  }

  const appClass = [
    "mj-app",
    `mj-bg-${tableTheme}`,
    `mj-tiles-${tileTheme}`,
    status === "paused" ? "is-paused" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={appClass}>
      <div className="mj-ambient" aria-hidden="true">
        {Array.from({ length: 8 }, (_, index) => (
          <span key={index} style={{ "--i": index } as CSSProperties} />
        ))}
      </div>
      <div className="mj-shell">
        <header className="mj-top">
          <div>
            <span className="mj-kicker">TENET Oyunlar</span>
            <h1>Mahjong</h1>
          </div>
          <div className="mj-top-stats">
            <div className="mj-wallet">
              <Coins size={17} />
              <strong>{coins.toLocaleString("tr-TR")}</strong>
              {coinBurst && (
                <em key={coinBurst.id}>+{coinBurst.amount}</em>
              )}
            </div>
            <div className="mj-best">
              <span>En iyi</span>
              <strong>{best.toLocaleString("tr-TR")}</strong>
            </div>
          </div>
        </header>

        {screen === "start" && (
          <main className="mj-start">
            <section className="mj-hero">
              <button
                className="mj-corner-icon"
                type="button"
                onClick={() => setPanel("mode")}
                aria-label="Mod seç"
                title="Mod seç"
              >
                <Settings size={21} />
              </button>
              <div className="mj-hero-ornaments" aria-hidden="true">
                {BASE_FACES.slice(0, 14).map((face, index) => (
                  <span
                    key={`ornament-${face.id}`}
                    className="mj-ornament-tile"
                    style={
                      {
                        "--i": index,
                        "--tone": face.tone,
                      } as CSSProperties
                    }
                  >
                    <TileFace face={face} />
                  </span>
                ))}
              </div>
              <div className="mj-preview" aria-hidden="true">
                {BASE_FACES.slice(27, 34).map((face, index) => (
                  <span
                    key={face.id}
                    className="mj-sample-tile"
                    style={
                      {
                        "--i": index,
                        "--row": index % 2,
                        "--tone": face.tone,
                      } as CSSProperties
                    }
                  >
                    <TileFace face={face} />
                  </span>
                ))}
              </div>
              <div className="mj-hero-copy">
                <h2>Mahjong</h2>
                <p>Taşları eşleştir, yüksek puana ulaş.</p>
              </div>
              <div className="mj-menu-actions">
                <button className="mj-start-btn" type="button" onClick={() => setScreen("rules")}>
                  <Play size={22} fill="currentColor" />
                  Başlat
                </button>
                <button className="mj-market-btn" type="button" onClick={() => setPanel("market")}>
                  <ShoppingBag size={20} />
                  Market
                </button>
              </div>
            </section>
          </main>
        )}

        {screen === "rules" && (
          <main className="mj-rules">
            <section className="mj-rules-card">
              <div className="mj-preview mj-preview--rules" aria-hidden="true">
                {BASE_FACES.slice(18, 24).map((face, index) => (
                  <span
                    key={face.id}
                    className="mj-sample-tile"
                    style={
                      {
                        "--i": index,
                        "--row": index % 2,
                        "--tone": face.tone,
                      } as CSSProperties
                    }
                  >
                    <TileFace face={face} />
                  </span>
                ))}
              </div>
              <h2>Taşları eşleştir, yüksek puana ulaş.</h2>
              <p>
                Üstü kapanmış taşlar oynanmaz. Sol veya sağ kenarı açık olan aynı taşları
                eşleştirerek masayı temizle.
              </p>
              <div className="mj-rules-actions">
                <button className="mj-start-btn" type="button" onClick={() => start()}>
                  <Play size={22} fill="currentColor" />
                  Başla
                </button>
                <button className="mj-quiet-btn" type="button" onClick={returnToMenu}>
                  <Home size={18} />
                  Menü
                </button>
              </div>
            </section>
          </main>
        )}

        {screen === "playing" && (
          <main className="mj-game">
            <section className="mj-scorebar">
              {timeLeft != null && (
                <span className={`mj-clock${timeLeft <= 20 ? " is-hot" : ""}`}>
                  {formatTime(timeLeft)}
                </span>
              )}
              <div
                key={scoreBurst?.id ?? "score"}
                className={`mj-score-core${scoreBurst ? " is-bumped" : ""}`}
              >
                <span>Puan</span>
                <strong>{score.toLocaleString("tr-TR")}</strong>
                {scoreBurst && (
                  <em className={scoreBurst.speed ? "is-speed" : ""}>
                    +{scoreBurst.amount}
                  </em>
                )}
              </div>
              {combo >= 2 && (
                <div className="mj-streak" key={`streak-${streakKey}`}>
                  <strong>x{combo}</strong>
                  <span>
                    <i />
                  </span>
                </div>
              )}
              <button
                className="mj-icon-btn mj-pause-btn"
                type="button"
                onClick={pauseGame}
                aria-label="Durdur"
                title="Durdur"
              >
                <Pause size={19} fill="currentColor" />
              </button>
            </section>

            <section className="mj-table">
              <div className="mj-table-head">
                <div className="mj-table-tools">
                  <button
                    className="mj-icon-btn"
                    type="button"
                    onClick={showHint}
                    aria-label="İpucu"
                    title="İpucu"
                  >
                    <Lightbulb size={18} />
                  </button>
                  <button
                    className="mj-icon-btn"
                    type="button"
                    onClick={() => start(mode)}
                    aria-label="Yeni oyun"
                    title="Yeni oyun"
                  >
                    <RotateCcw size={18} />
                  </button>
                </div>
              </div>

              <div className="mj-board-scroll">
                <div
                  key={boardRound}
                  className="mj-board"
                  style={{ width: box.width, height: box.height }}
                >
                  {tiles.map((tile, index) => {
                    const isMatched = matchedIds.includes(tile.uid);
                    if (tile.removed && !isMatched) return null;
                    const isTileOpen = openIds.has(tile.uid);
                    const x = box.pad + (tile.c - box.minC) * box.stepX + tile.z * box.lift;
                    const y = box.pad + (tile.r - box.minR) * box.stepY - tile.z * box.lift;
                    return (
                      <button
                        key={tile.uid}
                        type="button"
                        disabled={!isTileOpen}
                        className={[
                          "mj-tile",
                          `mj-tile--${tile.kind}`,
                          isTileOpen ? "is-open" : "is-closed",
                          selectedId === tile.uid ? "is-selected" : "",
                          hintIds.includes(tile.uid) ? "is-hint" : "",
                          isMatched ? "is-matched" : "",
                          blockedId === tile.uid ? "is-blocked" : "",
                          wrongIds.includes(tile.uid) ? "is-wrong" : "",
                        ]
                          .filter(Boolean)
                          .join(" ")}
                        style={
                          {
                            width: box.tileW,
                            height: box.tileH,
                            left: x,
                            top: y,
                            zIndex: 10 + tile.z * 100 + Math.round(tile.r * 6 + tile.c),
                            "--tone": tile.tone,
                            "--deal": index,
                          } as CSSProperties
                        }
                        onClick={(event) => handleTile(tile, event.timeStamp)}
                        aria-label={tile.title}
                      >
                        <TileFace face={tile} />
                        <span className="mj-tile__caption">{tile.title}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </section>
          </main>
        )}

        {screen === "result" && result && (
          <main className={`mj-result${result.won ? " is-win" : " is-lose"}`}>
            <span className="mj-kicker">{result.mode.title}</span>
            <h2>
              {result.reason === "cleared"
                ? "Masa temizlendi"
                : result.reason === "locked"
                  ? "Hamle kalmadı"
                  : "Süre doldu"}
            </h2>
            <div className="mj-result-score">
              {result.score.toLocaleString("tr-TR")}
            </div>
            <div className="mj-result-grid">
              <div>
                <span>Hamle</span>
                <strong>{result.moves}</strong>
              </div>
              <div>
                <span>Süre</span>
                <strong>{formatTime(result.elapsed)}</strong>
              </div>
              <div>
                <span>Altın</span>
                <strong>+{result.earned}</strong>
              </div>
            </div>
            <div className="mj-result-actions">
              <button type="button" onClick={() => start(result.mode)}>
                <RotateCcw size={18} />
                Tekrar
              </button>
              <button type="button" onClick={returnToMenu}>
                <Home size={18} />
                Menü
              </button>
              <button type="button" onClick={() => setPanel("market")}>
                <ShoppingBag size={18} />
                Market
              </button>
            </div>
          </main>
        )}
      </div>

      {status === "paused" && (
        <div className="mj-overlay" role="dialog" aria-modal="true" aria-label="Oyun durduruldu">
          <section className="mj-pause-card">
            <span className="mj-kicker">Oyun durdu</span>
            <h2>Devam hazır.</h2>
            <div className="mj-pause-actions">
              <button type="button" onClick={resumeGame}>
                <Play size={18} fill="currentColor" />
                Devam
              </button>
              <button type="button" onClick={() => start(mode)}>
                <RotateCcw size={18} />
                Yeniden Başlat
              </button>
              <button type="button" onClick={returnToMenu}>
                <Home size={18} />
                Ana Menü
              </button>
            </div>
          </section>
        </div>
      )}

      {panel && status !== "paused" && (
        <div className="mj-overlay" role="dialog" aria-modal="true" aria-label="Mahjong ayarları">
          <section className="mj-sheet">
            <button className="mj-close" type="button" onClick={() => setPanel(null)} aria-label="Kapat">
              <X size={20} />
            </button>
            <div className="mj-sheet-head">
              <span className="mj-kicker">Oyun Ayarları</span>
              <h2>{panel === "mode" ? "Mod seç" : "Market"}</h2>
            </div>
            <div className="mj-tabs">
              <button
                type="button"
                className={panel === "mode" ? "is-active" : ""}
                onClick={() => setPanel("mode")}
              >
                <Settings size={17} />
                Modlar
              </button>
              <button
                type="button"
                className={panel === "market" ? "is-active" : ""}
                onClick={() => setPanel("market")}
              >
                <ShoppingBag size={17} />
                Market
              </button>
            </div>

            {panel === "mode" && (
              <div className="mj-mode-grid">
                {MODES.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    className={`mj-mode${mode.id === item.id ? " is-active" : ""}`}
                    onClick={() => {
                      setMode(item);
                      playSfx("select");
                    }}
                  >
                    <span>{item.title}</span>
                    <small>{item.subtitle}</small>
                    {mode.id === item.id && <b>Aktif</b>}
                  </button>
                ))}
              </div>
            )}

            {panel === "market" && (
              <div className="mj-market">
                <div className="mj-market-balance">
                  <Coins size={18} />
                  <strong>{coins.toLocaleString("tr-TR")}</strong>
                  <span>altın</span>
                </div>
                {notice && <p className="mj-market-notice">{notice}</p>}

                <div className="mj-shop-section">
                  <h3>
                    <Palette size={18} />
                    Taş Temaları
                  </h3>
                  <div className="mj-shop-grid">
                    {TILE_THEMES.map((item) => {
                      const owned = ownedTileThemes.has(item.id);
                      const active = tileTheme === item.id;
                      return (
                        <button
                          key={item.id}
                          type="button"
                          className={`mj-shop-card mj-shop-card--tile-${item.id}${active ? " is-active" : ""}`}
                          onClick={() => chooseTileTheme(item)}
                        >
                          <span className="mj-shop-preview">
                            <i />
                            <i />
                            <i />
                          </span>
                          <strong>{item.title}</strong>
                          <small>{item.subtitle}</small>
                          <b>{active ? "Aktif" : owned ? "Seç" : `${item.price} altın`}</b>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="mj-shop-section">
                  <h3>
                    <Sparkles size={18} />
                    Masa Arka Planları
                  </h3>
                  <div className="mj-shop-grid">
                    {TABLE_THEMES.map((item) => {
                      const owned = ownedTableThemes.has(item.id);
                      const active = tableTheme === item.id;
                      return (
                        <button
                          key={item.id}
                          type="button"
                          className={`mj-shop-card mj-shop-card--table-${item.id}${active ? " is-active" : ""}`}
                          onClick={() => chooseTableTheme(item)}
                        >
                          <span className="mj-shop-preview">
                            <i />
                            <i />
                            <i />
                          </span>
                          <strong>{item.title}</strong>
                          <small>{item.subtitle}</small>
                          <b>{active ? "Aktif" : owned ? "Seç" : `${item.price} altın`}</b>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  );
}

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";

type Screen = "menu" | "levels" | "settings" | "game" | "result";
type ModeId = "classic" | "zen" | "rush";
type ThemeId = "jade" | "midnight" | "dawn" | "paper" | "nebula";
type MusicId = "lotus" | "bamboo" | "tide";
type LayoutId =
  | "turtle"
  | "pagoda"
  | "river"
  | "lotus"
  | "dragon"
  | "lantern"
  | "garden"
  | "cloud"
  | "tower"
  | "moon"
  | "harbor"
  | "summit"
  | "temple"
  | "storm"
  | "finale";

type Tile = {
  id: string;
  face: string;
  family: string;
  c: number;
  r: number;
  z: number;
  removed: boolean;
};

type Slot = Pick<Tile, "c" | "r" | "z">;

type Settings = {
  music: boolean;
  soundFx: boolean;
  haptics: boolean;
  assistOpenTiles: boolean;
  reducedMotion: boolean;
  volume: number;
  theme: ThemeId;
  musicTrack: MusicId;
};

type SaveFile = {
  stars: Record<string, number>;
  bestScore: Record<string, number>;
  settings: Settings;
};

type Level = {
  id: number;
  name: string;
  subtitle: string;
  layout: LayoutId;
  pairs: number;
  targetTime: number;
  palette: ThemeId;
};

type Result = {
  levelIndex: number;
  score: number;
  stars: number;
  elapsed: number;
  moves: number;
  shuffles: number;
  hints: number;
};

type BoardMetrics = {
  cols: number;
  rows: number;
  maxZ: number;
};

type CssVars = React.CSSProperties & Record<string, string | number>;

const STORAGE_KEY = "single-file-mahjong-sanctuary-v1";

const DEFAULT_SETTINGS: Settings = {
  music: true,
  soundFx: true,
  haptics: true,
  assistOpenTiles: true,
  reducedMotion: false,
  volume: 0.42,
  theme: "jade",
  musicTrack: "lotus",
};

const LEVELS: Level[] = [
  { id: 1, name: "Sessiz Kapı", subtitle: "Temel eşleşmeler", layout: "turtle", pairs: 18, targetTime: 210, palette: "jade" },
  { id: 2, name: "Bambu Yolu", subtitle: "Yan açıklıkları oku", layout: "river", pairs: 22, targetTime: 240, palette: "paper" },
  { id: 3, name: "Lotus Avlusu", subtitle: "Yumuşak katmanlar", layout: "lotus", pairs: 24, targetTime: 260, palette: "dawn" },
  { id: 4, name: "Ay Bahçesi", subtitle: "Daha sıkışık dizilim", layout: "moon", pairs: 28, targetTime: 300, palette: "midnight" },
  { id: 5, name: "Fener Sokağı", subtitle: "Dar koridorlar", layout: "lantern", pairs: 30, targetTime: 315, palette: "dawn" },
  { id: 6, name: "Bulut Terası", subtitle: "Dağınık yığınlar", layout: "cloud", pairs: 32, targetTime: 330, palette: "nebula" },
  { id: 7, name: "Yeşim Kule", subtitle: "Yüksek katmanlar", layout: "tower", pairs: 34, targetTime: 360, palette: "jade" },
  { id: 8, name: "Ejder Kıvrımı", subtitle: "Uzun form", layout: "dragon", pairs: 36, targetTime: 390, palette: "midnight" },
  { id: 9, name: "Liman Esintisi", subtitle: "Geniş masa", layout: "harbor", pairs: 38, targetTime: 410, palette: "paper" },
  { id: 10, name: "Tapınak Basamağı", subtitle: "Simetrik kilitler", layout: "temple", pairs: 40, targetTime: 430, palette: "dawn" },
  { id: 11, name: "Pagoda Gölgesi", subtitle: "Katman okuma", layout: "pagoda", pairs: 42, targetTime: 460, palette: "jade" },
  { id: 12, name: "Fırtına Taşları", subtitle: "Karma desende hamle avı", layout: "storm", pairs: 44, targetTime: 480, palette: "nebula" },
  { id: 13, name: "Zirve Sessizliği", subtitle: "Sıkı merkez", layout: "summit", pairs: 46, targetTime: 510, palette: "midnight" },
  { id: 14, name: "Gizli Bahçe", subtitle: "Usta hamleleri", layout: "garden", pairs: 50, targetTime: 540, palette: "paper" },
  { id: 15, name: "Sonsuz Mabed", subtitle: "Final panosu", layout: "finale", pairs: 56, targetTime: 620, palette: "nebula" },
];

const MODES: Array<{ id: ModeId; title: string; description: string; badge: string }> = [
  { id: "classic", title: "Klasik", description: "Standart puan, kombo ve yıldız sistemi.", badge: "Dengeli" },
  { id: "zen", title: "Zen", description: "Süre baskısı yok, ceza düşük, rahat oynanış.", badge: "Rahat" },
  { id: "rush", title: "Zamana Karşı", description: "Daha yüksek puan, daha sert hata ve süre bonusu.", badge: "Hızlı" },
];

const THEMES: Array<{ id: ThemeId; title: string; description: string }> = [
  { id: "jade", title: "Yeşim", description: "Derin yeşil, sıcak altın ışık." },
  { id: "midnight", title: "Gece", description: "Lacivert, ay ışığı ve serin taş." },
  { id: "dawn", title: "Şafak", description: "Mercan, krem ve yumuşak gün doğumu." },
  { id: "paper", title: "Pirinç Kağıdı", description: "Minimal, açık ve sakin." },
  { id: "nebula", title: "Nebula", description: "Mor, mavi ve sinematik kontrast." },
];

const MUSIC_TRACKS: Array<{ id: MusicId; title: string; description: string }> = [
  { id: "lotus", title: "Lotus Pulse", description: "Yavaş pentatonik arpej." },
  { id: "bamboo", title: "Bamboo Night", description: "Daha koyu, düşük frekanslı atmosfer." },
  { id: "tide", title: "Tide Garden", description: "Dalga gibi yükselen sakin notalar." },
];

const TILE_FACES: Array<{ face: string; family: string }> = [
  { face: "🀀", family: "Rüzgar" },
  { face: "🀁", family: "Rüzgar" },
  { face: "🀂", family: "Rüzgar" },
  { face: "🀃", family: "Rüzgar" },
  { face: "🀄", family: "Ejder" },
  { face: "🀅", family: "Ejder" },
  { face: "🀆", family: "Ejder" },
  { face: "🀇", family: "Karakter" },
  { face: "🀈", family: "Karakter" },
  { face: "🀉", family: "Karakter" },
  { face: "🀊", family: "Karakter" },
  { face: "🀋", family: "Karakter" },
  { face: "🀌", family: "Karakter" },
  { face: "🀍", family: "Karakter" },
  { face: "🀎", family: "Karakter" },
  { face: "🀏", family: "Karakter" },
  { face: "🀐", family: "Bambu" },
  { face: "🀑", family: "Bambu" },
  { face: "🀒", family: "Bambu" },
  { face: "🀓", family: "Bambu" },
  { face: "🀔", family: "Bambu" },
  { face: "🀕", family: "Bambu" },
  { face: "🀖", family: "Bambu" },
  { face: "🀗", family: "Bambu" },
  { face: "🀘", family: "Bambu" },
  { face: "🀙", family: "Nokta" },
  { face: "🀚", family: "Nokta" },
  { face: "🀛", family: "Nokta" },
  { face: "🀜", family: "Nokta" },
  { face: "🀝", family: "Nokta" },
  { face: "🀞", family: "Nokta" },
  { face: "🀟", family: "Nokta" },
  { face: "🀠", family: "Nokta" },
  { face: "🀡", family: "Nokta" },
  { face: "🀢", family: "Mevsim" },
  { face: "🀣", family: "Mevsim" },
  { face: "🀤", family: "Mevsim" },
  { face: "🀥", family: "Mevsim" },
  { face: "🀦", family: "Çiçek" },
  { face: "🀧", family: "Çiçek" },
  { face: "🀨", family: "Çiçek" },
  { face: "🀩", family: "Çiçek" },
  { face: "🀪", family: "Bonus" },
  { face: "🀫", family: "Bonus" },
];

function loadSave(): SaveFile {
  if (typeof window === "undefined") {
    return { stars: {}, bestScore: {}, settings: DEFAULT_SETTINGS };
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return { stars: {}, bestScore: {}, settings: DEFAULT_SETTINGS };
    const parsed = JSON.parse(raw) as Partial<SaveFile>;
    return {
      stars: parsed.stars ?? {},
      bestScore: parsed.bestScore ?? {},
      settings: { ...DEFAULT_SETTINGS, ...(parsed.settings ?? {}) },
    };
  } catch {
    return { stars: {}, bestScore: {}, settings: DEFAULT_SETTINGS };
  }
}

function formatTime(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
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

function uniqueSlots(slots: Slot[]) {
  const map = new Map<string, Slot>();
  for (const slot of slots) {
    map.set(`${slot.c.toFixed(2)}:${slot.r.toFixed(2)}:${slot.z}`, slot);
  }
  return [...map.values()];
}

function add(slots: Slot[], c: number, r: number, z: number) {
  slots.push({ c, r, z });
}

function addRect(slots: Slot[], c0: number, r0: number, cols: number, rows: number, z: number) {
  for (let r = 0; r < rows; r += 1) {
    for (let c = 0; c < cols; c += 1) {
      add(slots, c0 + c, r0 + r, z);
    }
  }
}

function addCenteredRows(slots: Slot[], widths: number[], startR: number, z: number, center = 8) {
  widths.forEach((width, index) => {
    const c0 = center - width / 2;
    for (let c = 0; c < width; c += 1) add(slots, c0 + c, startR + index, z);
  });
}

function buildRawSlots(layout: LayoutId): Slot[] {
  const slots: Slot[] = [];

  switch (layout) {
    case "turtle": {
      addCenteredRows(slots, [6, 8, 10, 12, 14, 12, 10, 8, 6], 0, 0, 8);
      addCenteredRows(slots, [4, 6, 8, 8, 6, 4], 1.5, 1, 8);
      addCenteredRows(slots, [3, 5, 5, 3], 2.5, 2, 8);
      addCenteredRows(slots, [2, 2], 3.5, 3, 8);
      break;
    }
    case "pagoda": {
      addCenteredRows(slots, [12, 12, 12, 12, 12, 12], 1, 0, 8);
      addCenteredRows(slots, [10, 8, 8, 10], 2, 1, 8);
      addCenteredRows(slots, [6, 6, 6], 2.5, 2, 8);
      addCenteredRows(slots, [4, 2], 3.2, 3, 8);
      addRect(slots, 2, 0, 2, 2, 0);
      addRect(slots, 12, 0, 2, 2, 0);
      break;
    }
    case "river": {
      for (let r = 0; r < 8; r += 1) {
        const offset = r % 2 === 0 ? 0 : 1;
        for (let c = 0; c < 13; c += 1) {
          if ((c + r) % 5 !== 0) add(slots, 1 + c + offset, r, 0);
        }
      }
      addCenteredRows(slots, [6, 8, 6], 2.2, 1, 8);
      addCenteredRows(slots, [4, 4], 3.1, 2, 8);
      break;
    }
    case "lotus": {
      const centerC = 8;
      const centerR = 4;
      for (let r = 0; r < 9; r += 1) {
        for (let c = 0; c < 16; c += 1) {
          const dx = (c - centerC) / 7.5;
          const dy = (r - centerR) / 4.2;
          if (dx * dx + dy * dy < 1.03) add(slots, c, r, 0);
        }
      }
      addCenteredRows(slots, [4, 8, 8, 4], 2.4, 1, 8);
      addCenteredRows(slots, [3, 5, 3], 3, 2, 8);
      add(slots, 7.5, 4, 3);
      add(slots, 8.5, 4, 3);
      break;
    }
    case "dragon": {
      for (let r = 0; r < 8; r += 1) {
        for (let c = 0; c < 17; c += 1) {
          const wave = Math.round(2 * Math.sin((c + r) * 0.68));
          if (Math.abs(r - 3.5 - wave) <= 2.2) add(slots, c, r, 0);
        }
      }
      for (let c = 2; c < 15; c += 1) {
        if (c % 3 !== 1) add(slots, c, 3 + (c % 2) * 0.5, 1);
      }
      addCenteredRows(slots, [5, 7, 5], 2.7, 2, 8);
      add(slots, 15, 1, 1);
      add(slots, 16, 1, 1);
      break;
    }
    case "lantern": {
      addRect(slots, 1, 1, 14, 7, 0);
      addRect(slots, 3, 2, 10, 5, 1);
      addRect(slots, 5, 3, 6, 3, 2);
      addRect(slots, 7, 4, 2, 1, 3);
      for (let r = 0; r < 9; r += 1) {
        if (r !== 4) {
          add(slots, 0, r, 0);
          add(slots, 15, r, 0);
        }
      }
      break;
    }
    case "garden": {
      addCenteredRows(slots, [8, 12, 14, 14, 14, 12, 8], 1, 0, 8);
      addRect(slots, 3, 2, 4, 4, 1);
      addRect(slots, 9, 2, 4, 4, 1);
      addCenteredRows(slots, [8, 6, 8], 2.5, 2, 8);
      addCenteredRows(slots, [4, 4], 3.2, 3, 8);
      break;
    }
    case "cloud": {
      for (let r = 0; r < 8; r += 1) {
        for (let c = 0; c < 16; c += 1) {
          const puffA = Math.hypot((c - 5) / 5, (r - 3) / 3) < 1;
          const puffB = Math.hypot((c - 10) / 5, (r - 4) / 3) < 1;
          const puffC = Math.hypot((c - 8) / 6, (r - 2) / 2.4) < 1;
          if (puffA || puffB || puffC) add(slots, c, r, 0);
        }
      }
      addCenteredRows(slots, [5, 7, 7, 5], 2, 1, 8);
      addCenteredRows(slots, [4, 4], 3, 2, 8);
      break;
    }
    case "tower": {
      addRect(slots, 2, 0, 12, 9, 0);
      addRect(slots, 4, 1, 8, 7, 1);
      addRect(slots, 6, 2, 4, 5, 2);
      addRect(slots, 7, 3, 2, 3, 3);
      break;
    }
    case "moon": {
      for (let r = 0; r < 9; r += 1) {
        for (let c = 0; c < 16; c += 1) {
          const outer = Math.hypot((c - 8) / 7, (r - 4) / 4) < 1.02;
          const bite = Math.hypot((c - 11) / 4, (r - 3.5) / 3.2) < 0.8;
          if (outer && !bite) add(slots, c, r, 0);
        }
      }
      addCenteredRows(slots, [5, 7, 5], 2.2, 1, 7);
      addCenteredRows(slots, [3, 3], 3.1, 2, 7);
      break;
    }
    case "harbor": {
      addRect(slots, 0, 2, 16, 5, 0);
      addRect(slots, 2, 1, 4, 7, 0);
      addRect(slots, 10, 1, 4, 7, 0);
      addCenteredRows(slots, [10, 8, 10], 2.5, 1, 8);
      addCenteredRows(slots, [6, 6], 3.3, 2, 8);
      add(slots, 2, 0, 1);
      add(slots, 13, 0, 1);
      break;
    }
    case "summit": {
      addCenteredRows(slots, [4, 8, 12, 16, 16, 12, 8, 4], 0, 0, 8);
      addCenteredRows(slots, [6, 8, 8, 6], 2, 1, 8);
      addCenteredRows(slots, [4, 6, 4], 2.7, 2, 8);
      addCenteredRows(slots, [2, 2], 3.5, 3, 8);
      add(slots, 8, 4.1, 4);
      break;
    }
    case "temple": {
      addRect(slots, 1, 2, 14, 5, 0);
      addRect(slots, 2, 1, 12, 1, 0);
      addRect(slots, 2, 7, 12, 1, 0);
      addRect(slots, 4, 2, 8, 5, 1);
      addRect(slots, 5, 3, 6, 3, 2);
      addRect(slots, 7, 4, 2, 1, 3);
      break;
    }
    case "storm": {
      for (let r = 0; r < 9; r += 1) {
        for (let c = 0; c < 17; c += 1) {
          const diagonal = Math.abs(c - r * 1.6 - 2) < 4.6;
          const reverse = Math.abs(16 - c - r * 1.25) < 4.2;
          if (diagonal || reverse) add(slots, c, r, 0);
        }
      }
      addCenteredRows(slots, [8, 10, 8], 2.4, 1, 8);
      addCenteredRows(slots, [6, 4, 6], 3, 2, 8);
      addCenteredRows(slots, [2, 2], 3.6, 3, 8);
      break;
    }
    case "finale": {
      addCenteredRows(slots, [8, 12, 14, 16, 16, 16, 14, 12, 8], 0, 0, 8);
      addCenteredRows(slots, [8, 10, 10, 10, 8], 2, 1, 8);
      addCenteredRows(slots, [6, 8, 8, 6], 2.7, 2, 8);
      addCenteredRows(slots, [4, 4, 4], 3.2, 3, 8);
      addCenteredRows(slots, [2], 4, 4, 8);
      add(slots, 1, 4, 1);
      add(slots, 14, 4, 1);
      break;
    }
    default:
      addCenteredRows(slots, [6, 8, 10, 8, 6], 1, 0, 8);
      addCenteredRows(slots, [4, 6, 4], 2, 1, 8);
  }

  return uniqueSlots(slots);
}

function selectSlotsForLevel(allSlots: Slot[], target: number) {
  const slots = uniqueSlots(allSlots);
  if (slots.length <= target) return slots;

  const maxC = Math.max(...slots.map((slot) => slot.c));
  const maxR = Math.max(...slots.map((slot) => slot.r));
  const centerC = maxC / 2;
  const centerR = maxR / 2;
  const groups = new Map<number, Slot[]>();

  for (const slot of slots) {
    const group = groups.get(slot.z) ?? [];
    group.push(slot);
    groups.set(slot.z, group);
  }

  const sortByCenter = (items: Slot[]) =>
    [...items].sort((a, b) => {
      const da = Math.hypot(a.c - centerC, a.r - centerR) - a.z * 0.85;
      const db = Math.hypot(b.c - centerC, b.r - centerR) - b.z * 0.85;
      return da - db;
    });

  const layerRatios: Record<number, number> = { 0: 0.56, 1: 0.27, 2: 0.12, 3: 0.04, 4: 0.01 };
  const selected: Slot[] = [];

  [...groups.entries()].forEach(([z, items]) => {
    const wanted = Math.max(z === 0 ? 12 : 2, Math.round(target * (layerRatios[z] ?? 0.02)));
    selected.push(...sortByCenter(items).slice(0, Math.min(wanted, items.length)));
  });

  if (selected.length < target) {
    const seen = new Set(selected.map((slot) => `${slot.c}:${slot.r}:${slot.z}`));
    const remaining = sortByCenter(slots).filter((slot) => !seen.has(`${slot.c}:${slot.r}:${slot.z}`));
    selected.push(...remaining.slice(0, target - selected.length));
  }

  return selected
    .slice(0, target)
    .sort((a, b) => a.z - b.z || a.r - b.r || a.c - b.c);
}

function buildLevelSlots(level: Level) {
  return selectSlotsForLevel(buildRawSlots(level.layout), level.pairs * 2);
}

function buildTiles(level: Level, levelIndex: number): Tile[] {
  const slots = buildLevelSlots(level);
  const faces: Array<{ face: string; family: string }> = [];

  for (let i = 0; i < Math.floor(slots.length / 2); i += 1) {
    const item = TILE_FACES[(i * 3 + levelIndex * 5) % TILE_FACES.length];
    faces.push(item, item);
  }

  const deck = shuffle(faces);
  return slots.map((slot, index) => ({
    ...slot,
    id: `${level.id}-${index}-${slot.c}-${slot.r}-${slot.z}`,
    face: deck[index].face,
    family: deck[index].family,
    removed: false,
  }));
}

function getMetrics(tiles: Tile[]): BoardMetrics {
  const visible = tiles.length ? tiles : [{ c: 0, r: 0, z: 0 } as Tile];
  return {
    cols: Math.ceil(Math.max(...visible.map((tile) => tile.c)) + 2),
    rows: Math.ceil(Math.max(...visible.map((tile) => tile.r)) + 2),
    maxZ: Math.max(...visible.map((tile) => tile.z)),
  };
}

function rectsOverlap(a: Tile, b: Tile) {
  const width = 1;
  const height = 1;
  return a.c < b.c + width && a.c + width > b.c && a.r < b.r + height && a.r + height > b.r;
}

function verticalOverlap(a: Tile, b: Tile) {
  return a.r < b.r + 0.92 && a.r + 0.92 > b.r;
}

function close(a: number, b: number) {
  return Math.abs(a - b) < 0.04;
}

function isTileOpen(tile: Tile, tiles: Tile[]) {
  if (tile.removed) return false;

  const covered = tiles.some((other) => !other.removed && other.id !== tile.id && other.z > tile.z && rectsOverlap(tile, other));
  if (covered) return false;

  const leftBlocked = tiles.some(
    (other) => !other.removed && other.id !== tile.id && other.z === tile.z && verticalOverlap(tile, other) && close(other.c + 1, tile.c),
  );
  const rightBlocked = tiles.some(
    (other) => !other.removed && other.id !== tile.id && other.z === tile.z && verticalOverlap(tile, other) && close(other.c, tile.c + 1),
  );

  return !leftBlocked || !rightBlocked;
}

function findAvailableMove(tiles: Tile[]) {
  const openTiles = tiles.filter((tile) => isTileOpen(tile, tiles));
  for (let i = 0; i < openTiles.length; i += 1) {
    for (let j = i + 1; j < openTiles.length; j += 1) {
      if (openTiles[i].face === openTiles[j].face) return [openTiles[i].id, openTiles[j].id] as const;
    }
  }
  return null;
}

function calculateStars(level: Level, mode: ModeId, score: number, elapsed: number, moves: number, shuffles: number, hints: number) {
  if (mode === "zen") {
    if (shuffles === 0 && hints <= 2) return 3;
    if (shuffles <= 2) return 2;
    return 1;
  }

  const timeTarget = mode === "rush" ? Math.round(level.targetTime * 0.82) : level.targetTime;
  const excellent = elapsed <= timeTarget && shuffles === 0 && hints <= 1 && moves <= level.pairs + 8;
  const good = elapsed <= Math.round(timeTarget * 1.38) && shuffles <= 1 && score > level.pairs * 58;
  if (excellent) return 3;
  if (good) return 2;
  return 1;
}

function useViewport() {
  const [size, setSize] = useState(() => ({
    width: typeof window === "undefined" ? 1180 : window.innerWidth,
    height: typeof window === "undefined" ? 780 : window.innerHeight,
  }));

  useEffect(() => {
    const onResize = () => setSize({ width: window.innerWidth, height: window.innerHeight });
    onResize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  return size;
}

function makeTileGeometry(width: number) {
  const tileWidth = width < 460 ? 52 : width < 760 ? 58 : width < 1100 ? 64 : 72;
  const tileHeight = Math.round(tileWidth * 1.28);
  return {
    tileWidth,
    tileHeight,
    stepX: Math.round(tileWidth * 0.7),
    stepY: Math.round(tileHeight * 0.45),
    zLift: Math.round(tileWidth * 0.11),
    marginX: width < 760 ? 24 : 42,
    marginY: width < 760 ? 34 : 48,
  };
}

export default function MahjongSanctuary() {
  const initialSave = useMemo(() => loadSave(), []);
  const [screen, setScreen] = useState<Screen>("menu");
  const [settings, setSettings] = useState<Settings>(initialSave.settings);
  const [stars, setStars] = useState<Record<string, number>>(initialSave.stars);
  const [bestScore, setBestScore] = useState<Record<string, number>>(initialSave.bestScore);
  const [mode, setMode] = useState<ModeId>("classic");
  const [levelIndex, setLevelIndex] = useState(0);
  const [tiles, setTiles] = useState<Tile[]>(() => buildTiles(LEVELS[0], 0));
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(1);
  const [moves, setMoves] = useState(0);
  const [hints, setHints] = useState(0);
  const [shuffles, setShuffles] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [paused, setPaused] = useState(false);
  const [hintIds, setHintIds] = useState<string[]>([]);
  const [matchedIds, setMatchedIds] = useState<string[]>([]);
  const [blockedId, setBlockedId] = useState<string | null>(null);
  const [message, setMessage] = useState("Taşların açık kenarlarını takip et.");
  const [result, setResult] = useState<Result | null>(null);
  const hasWonRef = useRef(false);
  const musicTimerRef = useRef<number | null>(null);
  const audioRef = useRef<AudioContext | null>(null);
  const viewport = useViewport();
  const geometry = useMemo(() => makeTileGeometry(viewport.width), [viewport.width]);
  const level = LEVELS[levelIndex];
  const metrics = useMemo(() => getMetrics(tiles), [tiles]);
  const openIds = useMemo(() => new Set(tiles.filter((tile) => isTileOpen(tile, tiles)).map((tile) => tile.id)), [tiles]);
  const availableMove = useMemo(() => findAvailableMove(tiles), [tiles]);
  const remainingTiles = useMemo(() => tiles.filter((tile) => !tile.removed).length, [tiles]);
  const highestUnlocked = useMemo(() => {
    let highest = 0;
    for (let index = 0; index < LEVELS.length; index += 1) {
      if ((stars[String(index)] ?? 0) > 0) highest = index + 1;
    }
    return Math.min(highest, LEVELS.length - 1);
  }, [stars]);

  const appTheme = settings.theme;
  const progressPercent = Math.round(((tiles.length - remainingTiles) / Math.max(tiles.length, 1)) * 100);
  const boardWidth = Math.max(
    viewport.width < 760 ? viewport.width - 20 : 760,
    Math.round((metrics.cols + 1.2) * geometry.stepX + geometry.tileWidth + geometry.marginX * 2 + metrics.maxZ * geometry.zLift),
  );
  const boardHeight = Math.max(
    viewport.width < 760 ? 460 : 560,
    Math.round((metrics.rows + 1.4) * geometry.stepY + geometry.tileHeight + geometry.marginY * 2 + metrics.maxZ * geometry.zLift),
  );

  const saveGame = useCallback(
    (nextStars = stars, nextBestScore = bestScore, nextSettings = settings) => {
      if (typeof window === "undefined") return;
      const payload: SaveFile = { stars: nextStars, bestScore: nextBestScore, settings: nextSettings };
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    },
    [bestScore, settings, stars],
  );

  useEffect(() => {
    saveGame(stars, bestScore, settings);
  }, [stars, bestScore, settings, saveGame]);

  const resumeAudio = useCallback(() => {
    if (typeof window === "undefined") return null;
    const AudioCtor = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtor) return null;
    if (!audioRef.current) audioRef.current = new AudioCtor();
    if (audioRef.current.state === "suspended") void audioRef.current.resume();
    return audioRef.current;
  }, []);

  const playTone = useCallback(
    (frequency: number, duration = 0.12, type: OscillatorType = "sine", gainScale = 1) => {
      if (!settings.soundFx && gainScale > 0.65) return;
      if (!settings.music && gainScale <= 0.65) return;
      const ctx = resumeAudio();
      if (!ctx) return;

      const oscillator = ctx.createOscillator();
      const gain = ctx.createGain();
      oscillator.type = type;
      oscillator.frequency.value = frequency;
      gain.gain.setValueAtTime(0.0001, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(Math.max(0.0001, settings.volume * 0.12 * gainScale), ctx.currentTime + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);
      oscillator.connect(gain);
      gain.connect(ctx.destination);
      oscillator.start(ctx.currentTime);
      oscillator.stop(ctx.currentTime + duration + 0.04);
    },
    [resumeAudio, settings.music, settings.soundFx, settings.volume],
  );

  const stopMusic = useCallback(() => {
    if (musicTimerRef.current !== null) {
      window.clearInterval(musicTimerRef.current);
      musicTimerRef.current = null;
    }
  }, []);

  const startMusic = useCallback(() => {
    if (!settings.music || musicTimerRef.current !== null) return;
    const sequences: Record<MusicId, number[]> = {
      lotus: [392, 440, 523.25, 587.33, 523.25, 440, 349.23, 392],
      bamboo: [261.63, 329.63, 392, 329.63, 293.66, 349.23, 392, 493.88],
      tide: [329.63, 392, 440, 493.88, 440, 392, 329.63, 293.66],
    };
    let index = 0;
    musicTimerRef.current = window.setInterval(() => {
      const seq = sequences[settings.musicTrack];
      const note = seq[index % seq.length];
      playTone(note, 0.7, "sine", 0.34);
      if (index % 4 === 0) playTone(note / 2, 0.9, "triangle", 0.18);
      index += 1;
    }, 760);
  }, [playTone, settings.music, settings.musicTrack]);

  useEffect(() => {
    if (screen === "game" && !paused && settings.music) startMusic();
    else stopMusic();
    return stopMusic;
  }, [screen, paused, settings.music, settings.musicTrack, startMusic, stopMusic]);

  useEffect(() => {
    if (screen !== "game" || paused || hasWonRef.current) return;
    const timer = window.setInterval(() => setElapsed((current) => current + 1), 1000);
    return () => window.clearInterval(timer);
  }, [screen, paused, levelIndex]);

  useEffect(() => {
    if (screen !== "game" || hasWonRef.current || tiles.length === 0) return;
    if (remainingTiles !== 0) return;

    hasWonRef.current = true;
    stopMusic();
    playTone(523.25, 0.18, "triangle", 1.1);
    window.setTimeout(() => playTone(659.25, 0.2, "triangle", 1.1), 140);
    window.setTimeout(() => playTone(783.99, 0.28, "triangle", 1.1), 280);

    const timeBonus = mode === "zen" ? 0 : Math.max(0, (level.targetTime - elapsed) * (mode === "rush" ? 9 : 5));
    const finalScore = Math.max(0, score + timeBonus + level.pairs * 20);
    const earnedStars = calculateStars(level, mode, finalScore, elapsed, moves, shuffles, hints);
    const resultPayload: Result = { levelIndex, score: finalScore, stars: earnedStars, elapsed, moves, shuffles, hints };

    setResult(resultPayload);
    setScore(finalScore);
    setStars((current) => {
      const next = { ...current, [String(levelIndex)]: Math.max(current[String(levelIndex)] ?? 0, earnedStars) };
      saveGame(next, bestScore, settings);
      return next;
    });
    setBestScore((current) => {
      const next = { ...current, [String(levelIndex)]: Math.max(current[String(levelIndex)] ?? 0, finalScore) };
      saveGame(stars, next, settings);
      return next;
    });
    window.setTimeout(() => setScreen("result"), settings.reducedMotion ? 100 : 650);
  }, [bestScore, elapsed, hints, level, levelIndex, mode, moves, playTone, remainingTiles, saveGame, score, screen, settings, shuffles, stars, stopMusic, tiles.length]);

  useEffect(() => {
    if (screen !== "game" || remainingTiles === 0) return;
    if (!availableMove) setMessage("Hamle görünmüyor. Taşları karıştırabilir veya ipucu alabilirsin.");
  }, [availableMove, remainingTiles, screen]);

  const resetLevel = useCallback(
    (index = levelIndex, nextMode = mode) => {
      const nextLevel = LEVELS[index];
      setLevelIndex(index);
      setMode(nextMode);
      setTiles(buildTiles(nextLevel, index));
      setSelectedId(null);
      setScore(0);
      setCombo(1);
      setMoves(0);
      setHints(0);
      setShuffles(0);
      setElapsed(0);
      setPaused(false);
      setHintIds([]);
      setMatchedIds([]);
      setBlockedId(null);
      setResult(null);
      setMessage(nextMode === "rush" ? "Hızlı başla, kombo zincirini kaybetme." : "Açık iki aynı taşı eşleştir.");
      hasWonRef.current = false;
      resumeAudio();
      setScreen("game");
    },
    [levelIndex, mode, resumeAudio],
  );

  const quickStart = useCallback(() => {
    const index = Math.min(highestUnlocked, LEVELS.length - 1);
    resetLevel(index, mode);
  }, [highestUnlocked, mode, resetLevel]);

  const vibrate = useCallback(
    (pattern: number | number[]) => {
      if (!settings.haptics || typeof navigator === "undefined" || !navigator.vibrate) return;
      navigator.vibrate(pattern);
    },
    [settings.haptics],
  );

  const changeSettings = useCallback((patch: Partial<Settings>) => {
    setSettings((current) => ({ ...current, ...patch }));
  }, []);

  const handleTileClick = useCallback(
    (tile: Tile) => {
      if (paused || tile.removed || screen !== "game") return;
      resumeAudio();
      setHintIds([]);

      if (!openIds.has(tile.id)) {
        setBlockedId(tile.id);
        setMessage("Bu taş kapalı: üstünde taş var veya iki yanı da sıkışık.");
        setCombo(1);
        playTone(174.61, 0.08, "sawtooth", 0.9);
        vibrate(18);
        window.setTimeout(() => setBlockedId(null), 360);
        return;
      }

      if (!selectedId) {
        setSelectedId(tile.id);
        setMessage(`${tile.family} deseninden bir eş daha ara.`);
        playTone(440, 0.06, "triangle", 0.65);
        return;
      }

      if (selectedId === tile.id) {
        setSelectedId(null);
        setMessage("Seçim kaldırıldı.");
        return;
      }

      const selectedTile = tiles.find((item) => item.id === selectedId);
      if (!selectedTile) {
        setSelectedId(tile.id);
        return;
      }

      setMoves((current) => current + 1);

      if (selectedTile.face === tile.face) {
        const gained = Math.round((mode === "rush" ? 145 : mode === "zen" ? 75 : 100) * combo);
        setMatchedIds([selectedTile.id, tile.id]);
        setScore((current) => current + gained);
        setCombo((current) => Math.min(current + 0.35, 5));
        setSelectedId(null);
        setMessage(`+${gained} puan. Kombo x${Math.min(combo + 0.35, 5).toFixed(2)}`);
        playTone(587.33, 0.09, "triangle", 0.95);
        window.setTimeout(() => playTone(783.99, 0.11, "sine", 0.75), 80);
        vibrate([10, 25, 10]);
        window.setTimeout(
          () => {
            setTiles((current) =>
              current.map((item) =>
                item.id === selectedTile.id || item.id === tile.id ? { ...item, removed: true } : item,
              ),
            );
            setMatchedIds([]);
          },
          settings.reducedMotion ? 40 : 210,
        );
      } else {
        const penalty = mode === "rush" ? 25 : mode === "zen" ? 0 : 10;
        setScore((current) => Math.max(0, current - penalty));
        setCombo(1);
        setSelectedId(tile.id);
        setMessage(penalty ? `Desenler farklı. -${penalty} puan.` : "Desenler farklı, sorun değil; Zen modda ceza yok.");
        playTone(220, 0.07, "square", 0.65);
      }
    },
    [combo, mode, openIds, paused, playTone, resumeAudio, screen, selectedId, settings.reducedMotion, tiles, vibrate],
  );

  const showHint = useCallback(() => {
    resumeAudio();
    const move = findAvailableMove(tiles);
    if (!move) {
      setMessage("Uygun hamle yok. Karıştırma kullanabilirsin.");
      playTone(196, 0.12, "sine", 0.75);
      return;
    }
    setHints((current) => current + 1);
    setHintIds([move[0], move[1]]);
    setSelectedId(null);
    setScore((current) => Math.max(0, current - (mode === "zen" ? 5 : 35)));
    setCombo(1);
    setMessage("İpucu taşları kısa süre parlatıldı.");
    playTone(659.25, 0.14, "sine", 0.85);
    window.setTimeout(() => setHintIds([]), settings.reducedMotion ? 900 : 1800);
  }, [mode, playTone, resumeAudio, settings.reducedMotion, tiles]);

  const shuffleRemaining = useCallback(() => {
    resumeAudio();
    const active = tiles.filter((tile) => !tile.removed);
    if (active.length < 4) return;
    const shuffledFaces = shuffle(active.map((tile) => ({ face: tile.face, family: tile.family })));
    let pointer = 0;
    setTiles((current) =>
      current.map((tile) => {
        if (tile.removed) return tile;
        const next = shuffledFaces[pointer];
        pointer += 1;
        return { ...tile, face: next.face, family: next.family };
      }),
    );
    setSelectedId(null);
    setHintIds([]);
    setShuffles((current) => current + 1);
    setCombo(1);
    setScore((current) => Math.max(0, current - (mode === "rush" ? 140 : mode === "zen" ? 25 : 80)));
    setMessage("Kalan taşların desenleri yeniden dağıtıldı.");
    playTone(329.63, 0.12, "triangle", 0.85);
  }, [mode, playTone, resumeAudio, tiles]);

  const clearProgress = useCallback(() => {
    const ok = window.confirm("Tüm bölüm yıldızları ve skorlar sıfırlansın mı?");
    if (!ok) return;
    setStars({});
    setBestScore({});
    saveGame({}, {}, settings);
  }, [saveGame, settings]);

  const boardStyle: CssVars = {
    width: `${boardWidth}px`,
    height: `${boardHeight}px`,
  };

  const renderStars = (count: number, faded = false) => (
    <span className={`stars ${faded ? "stars--faded" : ""}`} aria-label={`${count} yıldız`}>
      {Array.from({ length: 3 }, (_, index) => (
        <span key={index}>{index < count ? "★" : "☆"}</span>
      ))}
    </span>
  );

  return (
    <div className={`mahjong-app theme-${appTheme} ${settings.assistOpenTiles ? "assist-open" : ""} ${settings.reducedMotion ? "reduced-motion" : ""}`}>
      <style>{styles}</style>

      <div className="ambient ambient--one" />
      <div className="ambient ambient--two" />
      <div className="shell">
        <header className="topbar">
          <button className="brand" type="button" onClick={() => setScreen("menu")} aria-label="Ana menü">
            <span className="brand-mark">悠</span>
            <span>
              <strong>Mahjong Sanctuary</strong>
              <small>single TSX • assetsiz</small>
            </span>
          </button>

          <nav className="top-actions" aria-label="Üst menü">
            <button type="button" className="ghost-btn" onClick={() => setScreen("levels")}>
              Bölümler
            </button>
            <button type="button" className="ghost-btn" onClick={() => setScreen("settings")}>
              Ayarlar
            </button>
            {screen === "game" && (
              <button type="button" className="primary-btn primary-btn--small" onClick={() => setPaused((current) => !current)}>
                {paused ? "Devam" : "Duraklat"}
              </button>
            )}
          </nav>
        </header>

        {screen === "menu" && (
          <main className="menu-grid">
            <section className="hero-card glass-card">
              <div className="eyebrow">Rahatlatıcı Mahjong Solitaire</div>
              <h1>Taşları çöz, katmanları aç, mabede ilerle.</h1>
              <p>
                Tek dosyada çalışan bu oyun; 15 bölüm, üç oyun modu, ayarlanabilir arka planlar, Web Audio ile üretilen sakin müzikler,
                puan/kombo/yıldız sistemi ve dokunmatik destekli oynanış içerir.
              </p>
              <div className="hero-actions">
                <button type="button" className="primary-btn" onClick={quickStart}>
                  Hızlı Başla
                </button>
                <button type="button" className="secondary-btn" onClick={() => setScreen("levels")}>
                  Bölüm Seç
                </button>
              </div>
              <div className="hero-metrics" aria-label="Oyun özellikleri">
                <span>15 bölüm</span>
                <span>{Object.values(stars).reduce((sum, item) => sum + item, 0)} yıldız</span>
                <span>{MODES.length} mod</span>
              </div>
            </section>

            <aside className="glass-card mode-panel">
              <div className="section-heading">
                <span>Oyun modu</span>
                <strong>{MODES.find((item) => item.id === mode)?.title}</strong>
              </div>
              <div className="mode-list">
                {MODES.map((item) => (
                  <button
                    type="button"
                    key={item.id}
                    className={`mode-card ${mode === item.id ? "is-active" : ""}`}
                    onClick={() => {
                      setMode(item.id);
                      resumeAudio();
                      playTone(392, 0.08, "triangle", 0.65);
                    }}
                  >
                    <span>{item.badge}</span>
                    <strong>{item.title}</strong>
                    <small>{item.description}</small>
                  </button>
                ))}
              </div>
            </aside>

            <section className="glass-card preview-card">
              <div className="mini-board" aria-hidden="true">
                {TILE_FACES.slice(4, 16).map((tile, index) => (
                  <span key={`${tile.face}-${index}`} style={{ transform: `translate(${(index % 4) * 12}px, ${Math.floor(index / 4) * 11}px)` }}>
                    {tile.face}
                  </span>
                ))}
              </div>
              <h2>Görsel sistem</h2>
              <p>Taş yüzeyleri CSS ile çizilir; gölgeler, katman derinliği, desen parıltısı ve masa dokusu dış görsel kullanmadan üretilir.</p>
            </section>
          </main>
        )}

        {screen === "levels" && (
          <main className="levels-screen">
            <div className="screen-title">
              <span className="eyebrow">Bölüm seçimi</span>
              <h1>15 aşamalı mabed yolu</h1>
              <p>Bir bölümü tamamladıkça sıradaki bölüm açılır. Zen modda da ilerleme kaydedilir.</p>
            </div>
            <div className="level-grid">
              {LEVELS.map((item, index) => {
                const levelStars = stars[String(index)] ?? 0;
                const locked = index > highestUnlocked;
                return (
                  <button
                    type="button"
                    key={item.id}
                    className={`level-card ${locked ? "is-locked" : ""}`}
                    onClick={() => !locked && resetLevel(index, mode)}
                    disabled={locked}
                  >
                    <span className="level-number">{item.id.toString().padStart(2, "0")}</span>
                    <strong>{item.name}</strong>
                    <small>{item.subtitle}</small>
                    <span className="level-meta">
                      {item.pairs} çift • {formatTime(item.targetTime)} hedef
                    </span>
                    <span className="level-footer">
                      {locked ? "Kilitli" : renderStars(levelStars, levelStars === 0)}
                      <span>{bestScore[String(index)] ? `${bestScore[String(index)]}p` : item.layout}</span>
                    </span>
                  </button>
                );
              })}
            </div>
          </main>
        )}

        {screen === "settings" && (
          <main className="settings-screen glass-card">
            <div className="screen-title screen-title--compact">
              <span className="eyebrow">Ayarlar</span>
              <h1>Oynanış ve atmosfer</h1>
              <p>Her ayar localStorage üzerinde saklanır. Müzik dış dosya değil, tarayıcı içinde üretilen basit sentezdir.</p>
            </div>

            <div className="settings-grid">
              <section className="setting-group">
                <h2>Arka plan</h2>
                <div className="swatches">
                  {THEMES.map((item) => (
                    <button
                      type="button"
                      key={item.id}
                      className={`swatch theme-${item.id} ${settings.theme === item.id ? "is-active" : ""}`}
                      onClick={() => changeSettings({ theme: item.id })}
                    >
                      <span>{item.title}</span>
                      <small>{item.description}</small>
                    </button>
                  ))}
                </div>
              </section>

              <section className="setting-group">
                <h2>Ses</h2>
                <label className="switch-row">
                  <span>
                    <strong>Müzik</strong>
                    <small>Web Audio ile üretilen rahatlatıcı loop.</small>
                  </span>
                  <input type="checkbox" checked={settings.music} onChange={(event) => changeSettings({ music: event.target.checked })} />
                </label>
                <label className="switch-row">
                  <span>
                    <strong>Efektler</strong>
                    <small>Eşleşme, hata ve ipucu sesleri.</small>
                  </span>
                  <input type="checkbox" checked={settings.soundFx} onChange={(event) => changeSettings({ soundFx: event.target.checked })} />
                </label>
                <label className="range-row">
                  <span>Ses seviyesi</span>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={settings.volume}
                    onChange={(event) => changeSettings({ volume: Number(event.target.value) })}
                  />
                </label>
                <div className="track-list">
                  {MUSIC_TRACKS.map((item) => (
                    <button
                      type="button"
                      key={item.id}
                      className={`track-card ${settings.musicTrack === item.id ? "is-active" : ""}`}
                      onClick={() => {
                        changeSettings({ musicTrack: item.id });
                        resumeAudio();
                        playTone(item.id === "lotus" ? 523.25 : item.id === "bamboo" ? 329.63 : 440, 0.18, "sine", 0.6);
                      }}
                    >
                      <strong>{item.title}</strong>
                      <small>{item.description}</small>
                    </button>
                  ))}
                </div>
              </section>

              <section className="setting-group">
                <h2>Oynanış</h2>
                <label className="switch-row">
                  <span>
                    <strong>Açık taşları belirt</strong>
                    <small>Oynanabilir taşlara ince ışık verir.</small>
                  </span>
                  <input
                    type="checkbox"
                    checked={settings.assistOpenTiles}
                    onChange={(event) => changeSettings({ assistOpenTiles: event.target.checked })}
                  />
                </label>
                <label className="switch-row">
                  <span>
                    <strong>Dokunsal titreşim</strong>
                    <small>Mobil cihazlarda kısa geri bildirim.</small>
                  </span>
                  <input type="checkbox" checked={settings.haptics} onChange={(event) => changeSettings({ haptics: event.target.checked })} />
                </label>
                <label className="switch-row">
                  <span>
                    <strong>Azaltılmış hareket</strong>
                    <small>Animasyonları kısaltır.</small>
                  </span>
                  <input
                    type="checkbox"
                    checked={settings.reducedMotion}
                    onChange={(event) => changeSettings({ reducedMotion: event.target.checked })}
                  />
                </label>
                <button type="button" className="danger-btn" onClick={clearProgress}>
                  İlerlemeyi Sıfırla
                </button>
              </section>
            </div>
          </main>
        )}

        {screen === "game" && (
          <main className="game-screen">
            <section className="hud glass-card">
              <div>
                <span className="eyebrow">Bölüm {level.id}</span>
                <h1>{level.name}</h1>
                <p>{level.subtitle}</p>
              </div>
              <div className="stats-grid">
                <div>
                  <small>Puan</small>
                  <strong>{score}</strong>
                </div>
                <div>
                  <small>Süre</small>
                  <strong>{formatTime(elapsed)}</strong>
                </div>
                <div>
                  <small>Kombo</small>
                  <strong>x{combo.toFixed(2)}</strong>
                </div>
                <div>
                  <small>Kalan</small>
                  <strong>{remainingTiles}</strong>
                </div>
              </div>
              <div className="hud-actions">
                <button type="button" className="secondary-btn" onClick={showHint}>
                  İpucu
                </button>
                <button type="button" className="secondary-btn" onClick={shuffleRemaining}>
                  Karıştır
                </button>
                <button type="button" className="ghost-btn" onClick={() => resetLevel(levelIndex, mode)}>
                  Yenile
                </button>
              </div>
            </section>

            <section className="board-card glass-card">
              <div className="board-topline">
                <span>{message}</span>
                <span>{progressPercent}% temizlendi</span>
              </div>
              <div className="progress-track" aria-hidden="true">
                <span style={{ width: `${progressPercent}%` }} />
              </div>

              <div className="board-scroll" aria-label="Mahjong oyun tahtası">
                <div className="board" style={boardStyle}>
                  <div className="board-rings" />
                  {tiles.map((tile) => {
                    if (tile.removed) return null;
                    const left = geometry.marginX + tile.c * geometry.stepX + tile.z * geometry.zLift;
                    const top = geometry.marginY + tile.r * geometry.stepY - tile.z * geometry.zLift;
                    const isOpen = openIds.has(tile.id);
                    const isSelected = selectedId === tile.id;
                    const isHint = hintIds.includes(tile.id);
                    const isMatched = matchedIds.includes(tile.id);
                    const isBlocked = blockedId === tile.id;
                    const tileStyle: React.CSSProperties = {
                      width: geometry.tileWidth,
                      height: geometry.tileHeight,
                      left,
                      top,
                      zIndex: 10 + tile.z * 100 + Math.round(tile.r * 4 + tile.c),
                    };
                    return (
                      <button
                        type="button"
                        key={tile.id}
                        className={`tile ${isOpen ? "is-open" : "is-closed"} ${isSelected ? "is-selected" : ""} ${isHint ? "is-hint" : ""} ${isMatched ? "is-matched" : ""} ${isBlocked ? "is-blocked" : ""}`}
                        style={tileStyle}
                        onClick={() => handleTileClick(tile)}
                        onTouchStart={() => undefined}
                        aria-label={`${tile.family} taşı ${tile.face}${isOpen ? ", açık" : ", kapalı"}`}
                      >
                        <span className="tile-face">{tile.face}</span>
                        <span className="tile-family">{tile.family}</span>
                      </button>
                    );
                  })}

                  {paused && (
                    <div className="pause-panel">
                      <div className="glass-card pause-card">
                        <span className="eyebrow">Duraklatıldı</span>
                        <h2>{level.name}</h2>
                        <p>Tahta durdu. Hazır olduğunda devam edebilirsin.</p>
                        <button type="button" className="primary-btn" onClick={() => setPaused(false)}>
                          Devam Et
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="board-footer">
                <span>Hamle: {moves}</span>
                <span>İpucu: {hints}</span>
                <span>Karıştırma: {shuffles}</span>
                <span>{availableMove ? "Hamle var" : "Hamle yok"}</span>
              </div>
            </section>
          </main>
        )}

        {screen === "result" && result && (
          <main className="result-screen glass-card">
            <span className="eyebrow">Bölüm tamamlandı</span>
            <h1>{LEVELS[result.levelIndex].name}</h1>
            <div className="result-stars">{renderStars(result.stars)}</div>
            <div className="result-grid">
              <div>
                <small>Final puanı</small>
                <strong>{result.score}</strong>
              </div>
              <div>
                <small>Süre</small>
                <strong>{formatTime(result.elapsed)}</strong>
              </div>
              <div>
                <small>Hamle</small>
                <strong>{result.moves}</strong>
              </div>
              <div>
                <small>Yardım</small>
                <strong>{result.hints + result.shuffles}</strong>
              </div>
            </div>
            <div className="hero-actions result-actions">
              {result.levelIndex < LEVELS.length - 1 && (
                <button type="button" className="primary-btn" onClick={() => resetLevel(result.levelIndex + 1, mode)}>
                  Sonraki Bölüm
                </button>
              )}
              <button type="button" className="secondary-btn" onClick={() => resetLevel(result.levelIndex, mode)}>
                Tekrar Oyna
              </button>
              <button type="button" className="ghost-btn" onClick={() => setScreen("levels")}>
                Bölümlere Dön
              </button>
            </div>
          </main>
        )}
      </div>
    </div>
  );
}

const styles = `
  :root {
    color-scheme: dark;
    font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  }

  * {
    box-sizing: border-box;
  }

  button, input {
    font: inherit;
  }

  button {
    -webkit-tap-highlight-color: transparent;
  }

  .mahjong-app {
    --bg-a: #0d201a;
    --bg-b: #102e2a;
    --bg-c: #d4b26f;
    --ink: #fff8e8;
    --muted: rgba(255, 248, 232, 0.68);
    --panel: rgba(13, 26, 25, 0.64);
    --panel-strong: rgba(13, 26, 25, 0.84);
    --line: rgba(255, 255, 255, 0.14);
    --accent: #e9c46a;
    --accent-2: #69d2b0;
    --tile: #fff4d7;
    --tile-edge: #b99055;
    --tile-ink: #27332f;
    min-height: 100vh;
    position: relative;
    overflow-x: hidden;
    color: var(--ink);
    background:
      radial-gradient(circle at top left, color-mix(in srgb, var(--accent) 30%, transparent), transparent 34rem),
      radial-gradient(circle at bottom right, color-mix(in srgb, var(--accent-2) 30%, transparent), transparent 36rem),
      linear-gradient(135deg, var(--bg-a), var(--bg-b));
  }

  .theme-jade {
    --bg-a: #071d17;
    --bg-b: #123d34;
    --bg-c: #e6bd72;
    --accent: #e4c16d;
    --accent-2: #6ed6b3;
    --tile: #fff2d5;
    --tile-edge: #b8894f;
    --tile-ink: #27342c;
  }

  .theme-midnight {
    --bg-a: #071226;
    --bg-b: #152f55;
    --bg-c: #95b8ff;
    --accent: #9db8ff;
    --accent-2: #7de3ff;
    --tile: #edf3ff;
    --tile-edge: #7187b9;
    --tile-ink: #1d2a46;
  }

  .theme-dawn {
    --bg-a: #321323;
    --bg-b: #8b3f4d;
    --bg-c: #ffd08a;
    --accent: #ffd08a;
    --accent-2: #ff9f8f;
    --tile: #fff1df;
    --tile-edge: #c37b65;
    --tile-ink: #432626;
  }

  .theme-paper {
    --bg-a: #242016;
    --bg-b: #6b5b3e;
    --bg-c: #f4d9a5;
    --accent: #f2d18d;
    --accent-2: #c6e2b4;
    --tile: #fff7e8;
    --tile-edge: #a8895b;
    --tile-ink: #3b3122;
  }

  .theme-nebula {
    --bg-a: #140a24;
    --bg-b: #32245f;
    --bg-c: #9d7cff;
    --accent: #b89cff;
    --accent-2: #7ce7d7;
    --tile: #f8efff;
    --tile-edge: #8e72bd;
    --tile-ink: #2e224a;
  }

  .ambient {
    position: fixed;
    pointer-events: none;
    filter: blur(20px);
    opacity: 0.45;
    mix-blend-mode: screen;
    z-index: 0;
  }

  .ambient--one {
    width: 24rem;
    height: 24rem;
    top: 7%;
    right: -8rem;
    background: radial-gradient(circle, var(--accent), transparent 65%);
    animation: floaty 11s ease-in-out infinite;
  }

  .ambient--two {
    width: 20rem;
    height: 20rem;
    bottom: 5%;
    left: -7rem;
    background: radial-gradient(circle, var(--accent-2), transparent 65%);
    animation: floaty 13s ease-in-out infinite reverse;
  }

  .shell {
    width: min(1240px, calc(100% - 28px));
    margin: 0 auto;
    position: relative;
    z-index: 1;
    padding: 18px 0 32px;
  }

  .topbar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 14px;
    margin-bottom: 18px;
  }

  .brand {
    appearance: none;
    border: 0;
    color: var(--ink);
    background: transparent;
    display: inline-flex;
    align-items: center;
    gap: 12px;
    text-align: left;
    cursor: pointer;
  }

  .brand-mark {
    width: 46px;
    height: 46px;
    border-radius: 16px;
    display: grid;
    place-items: center;
    color: #1c241c;
    background: linear-gradient(145deg, var(--tile), var(--accent));
    box-shadow: 0 16px 34px rgba(0, 0, 0, 0.28), inset -5px -7px 0 rgba(77, 56, 22, 0.16);
    font-weight: 900;
  }

  .brand strong,
  .brand small {
    display: block;
  }

  .brand strong {
    letter-spacing: -0.03em;
    font-size: 1.02rem;
  }

  .brand small,
  .eyebrow,
  small {
    color: var(--muted);
  }

  .top-actions,
  .hero-actions,
  .hud-actions,
  .result-actions {
    display: flex;
    align-items: center;
    gap: 10px;
    flex-wrap: wrap;
  }

  .glass-card {
    background: linear-gradient(145deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.035)), var(--panel);
    border: 1px solid var(--line);
    box-shadow: 0 24px 80px rgba(0, 0, 0, 0.25);
    backdrop-filter: blur(24px);
    border-radius: 30px;
  }

  .primary-btn,
  .secondary-btn,
  .ghost-btn,
  .danger-btn {
    border: 1px solid transparent;
    border-radius: 999px;
    padding: 12px 18px;
    min-height: 44px;
    cursor: pointer;
    transition: transform 160ms ease, border-color 160ms ease, background 160ms ease, box-shadow 160ms ease;
  }

  .primary-btn:hover,
  .secondary-btn:hover,
  .ghost-btn:hover,
  .danger-btn:hover,
  .mode-card:hover,
  .level-card:hover,
  .track-card:hover,
  .swatch:hover {
    transform: translateY(-2px);
  }

  .primary-btn {
    background: linear-gradient(135deg, var(--accent), color-mix(in srgb, var(--accent-2) 45%, var(--accent)));
    color: #18221d;
    font-weight: 850;
    box-shadow: 0 18px 36px color-mix(in srgb, var(--accent) 28%, transparent);
  }

  .primary-btn--small {
    padding: 10px 14px;
    min-height: 38px;
  }

  .secondary-btn {
    color: var(--ink);
    background: rgba(255, 255, 255, 0.12);
    border-color: var(--line);
  }

  .ghost-btn {
    color: var(--ink);
    background: transparent;
    border-color: rgba(255, 255, 255, 0.1);
  }

  .danger-btn {
    width: fit-content;
    background: rgba(255, 91, 91, 0.14);
    border-color: rgba(255, 91, 91, 0.28);
    color: #ffd6d6;
  }

  .menu-grid {
    display: grid;
    grid-template-columns: minmax(0, 1.25fr) minmax(320px, 0.75fr);
    gap: 18px;
    align-items: stretch;
  }

  .hero-card {
    min-height: 500px;
    padding: clamp(28px, 6vw, 62px);
    display: flex;
    flex-direction: column;
    justify-content: center;
    position: relative;
    overflow: hidden;
  }

  .hero-card::before,
  .preview-card::before,
  .board::before {
    content: "";
    position: absolute;
    inset: 0;
    pointer-events: none;
    background-image:
      linear-gradient(rgba(255,255,255,0.045) 1px, transparent 1px),
      linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px);
    background-size: 34px 34px;
    mask-image: radial-gradient(circle at center, black, transparent 78%);
  }

  .eyebrow {
    text-transform: uppercase;
    letter-spacing: 0.16em;
    font-size: 0.74rem;
    font-weight: 850;
  }

  h1,
  h2,
  p {
    margin-top: 0;
  }

  h1 {
    font-size: clamp(2.2rem, 6vw, 5.6rem);
    line-height: 0.94;
    letter-spacing: -0.08em;
    margin-bottom: 20px;
  }

  h2 {
    letter-spacing: -0.04em;
  }

  p {
    color: var(--muted);
    line-height: 1.7;
  }

  .hero-card p {
    max-width: 68ch;
    font-size: 1.04rem;
  }

  .hero-metrics {
    display: flex;
    gap: 10px;
    flex-wrap: wrap;
    margin-top: 28px;
  }

  .hero-metrics span,
  .level-meta,
  .board-footer span {
    border: 1px solid var(--line);
    background: rgba(255, 255, 255, 0.08);
    border-radius: 999px;
    padding: 8px 12px;
    color: var(--muted);
    font-size: 0.86rem;
  }

  .mode-panel,
  .preview-card {
    padding: 24px;
  }

  .mode-panel {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .section-heading {
    display: flex;
    justify-content: space-between;
    gap: 12px;
    align-items: center;
  }

  .mode-list,
  .track-list,
  .swatches {
    display: grid;
    gap: 10px;
  }

  .mode-card,
  .track-card,
  .swatch,
  .level-card {
    cursor: pointer;
    text-align: left;
    border: 1px solid var(--line);
    color: var(--ink);
    background: rgba(255, 255, 255, 0.08);
    border-radius: 22px;
    padding: 16px;
    transition: 160ms ease;
  }

  .mode-card span {
    float: right;
    color: var(--accent);
    font-size: 0.78rem;
    font-weight: 800;
  }

  .mode-card strong,
  .mode-card small,
  .track-card strong,
  .track-card small,
  .swatch span,
  .swatch small,
  .level-card strong,
  .level-card small {
    display: block;
  }

  .mode-card.is-active,
  .track-card.is-active,
  .swatch.is-active {
    border-color: color-mix(in srgb, var(--accent) 72%, white 0%);
    background: color-mix(in srgb, var(--accent) 18%, rgba(255,255,255,0.08));
  }

  .preview-card {
    grid-column: 2;
    min-height: 210px;
    overflow: hidden;
    position: relative;
  }

  .mini-board {
    height: 132px;
    position: relative;
    margin-bottom: 18px;
  }

  .mini-board span {
    position: absolute;
    width: 52px;
    height: 66px;
    display: grid;
    place-items: center;
    border-radius: 13px;
    color: var(--tile-ink);
    background: linear-gradient(145deg, var(--tile), color-mix(in srgb, var(--tile-edge) 16%, var(--tile)));
    box-shadow: 0 14px 26px rgba(0,0,0,0.22), inset -5px -7px 0 rgba(82, 49, 19, 0.13);
    font-size: 1.6rem;
  }

  .screen-title {
    margin: 14px 0 22px;
  }

  .screen-title h1 {
    margin-bottom: 12px;
  }

  .screen-title--compact h1 {
    font-size: clamp(2rem, 4vw, 3.8rem);
  }

  .level-grid {
    display: grid;
    grid-template-columns: repeat(5, minmax(0, 1fr));
    gap: 14px;
  }

  .level-card {
    min-height: 190px;
    display: flex;
    flex-direction: column;
    gap: 8px;
    position: relative;
  }

  .level-card:disabled {
    cursor: not-allowed;
  }

  .level-card.is-locked {
    opacity: 0.45;
    filter: grayscale(0.5);
  }

  .level-number {
    width: 40px;
    height: 40px;
    border-radius: 14px;
    display: grid;
    place-items: center;
    color: #17211d;
    background: var(--accent);
    font-weight: 900;
  }

  .level-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 8px;
    margin-top: auto;
    color: var(--muted);
    font-size: 0.85rem;
  }

  .stars {
    color: var(--accent);
    letter-spacing: 0.08em;
    white-space: nowrap;
  }

  .stars--faded {
    opacity: 0.5;
  }

  .settings-screen {
    padding: clamp(20px, 4vw, 34px);
  }

  .settings-grid {
    display: grid;
    grid-template-columns: 1fr 1fr 1fr;
    gap: 18px;
  }

  .setting-group {
    border: 1px solid var(--line);
    border-radius: 24px;
    padding: 18px;
    background: rgba(255, 255, 255, 0.055);
  }

  .setting-group h2 {
    margin-bottom: 16px;
  }

  .switch-row,
  .range-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 16px;
    border: 1px solid var(--line);
    border-radius: 18px;
    padding: 14px;
    margin-bottom: 10px;
    background: rgba(0, 0, 0, 0.1);
  }

  .switch-row span,
  .switch-row strong,
  .switch-row small,
  .range-row span {
    display: block;
  }

  input[type="checkbox"] {
    width: 48px;
    height: 28px;
    accent-color: var(--accent);
  }

  input[type="range"] {
    width: 52%;
    accent-color: var(--accent);
  }

  .swatch {
    min-height: 84px;
    position: relative;
    overflow: hidden;
  }

  .swatch::after {
    content: "";
    position: absolute;
    width: 76px;
    height: 76px;
    right: -14px;
    top: -14px;
    border-radius: 50%;
    background: radial-gradient(circle, var(--accent), transparent 70%);
    opacity: 0.7;
  }

  .game-screen {
    display: grid;
    gap: 16px;
  }

  .hud {
    display: grid;
    grid-template-columns: minmax(220px, 1fr) minmax(360px, 1.3fr) auto;
    gap: 18px;
    align-items: center;
    padding: 18px;
  }

  .hud h1 {
    font-size: clamp(1.6rem, 3vw, 2.8rem);
    margin-bottom: 4px;
  }

  .hud p {
    margin: 0;
  }

  .stats-grid,
  .result-grid {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 10px;
  }

  .stats-grid div,
  .result-grid div {
    padding: 12px;
    border-radius: 18px;
    background: rgba(255, 255, 255, 0.08);
    border: 1px solid var(--line);
  }

  .stats-grid small,
  .stats-grid strong,
  .result-grid small,
  .result-grid strong {
    display: block;
  }

  .stats-grid strong,
  .result-grid strong {
    font-size: 1.28rem;
  }

  .board-card {
    padding: 16px;
    overflow: hidden;
  }

  .board-topline,
  .board-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 10px;
    color: var(--muted);
    font-size: 0.95rem;
  }

  .board-topline span:first-child {
    color: var(--ink);
  }

  .progress-track {
    height: 8px;
    border-radius: 999px;
    background: rgba(255, 255, 255, 0.1);
    overflow: hidden;
    margin: 12px 0 14px;
  }

  .progress-track span {
    display: block;
    height: 100%;
    border-radius: inherit;
    background: linear-gradient(90deg, var(--accent), var(--accent-2));
    transition: width 260ms ease;
  }

  .board-scroll {
    width: 100%;
    overflow: auto;
    overscroll-behavior: contain;
    border-radius: 24px;
    border: 1px solid rgba(255,255,255,0.1);
    background:
      radial-gradient(circle at 50% 20%, rgba(255,255,255,0.11), transparent 35%),
      rgba(0,0,0,0.16);
    touch-action: pan-x pan-y;
  }

  .board {
    position: relative;
    min-width: 100%;
    border-radius: 24px;
    overflow: hidden;
    background:
      linear-gradient(135deg, rgba(255,255,255,0.08), rgba(255,255,255,0.02)),
      radial-gradient(circle at center, color-mix(in srgb, var(--bg-c) 13%, transparent), transparent 42%),
      linear-gradient(135deg, rgba(0,0,0,0.12), rgba(0,0,0,0.28));
  }

  .board-rings {
    position: absolute;
    inset: 36px;
    border-radius: 44px;
    border: 1px solid rgba(255, 255, 255, 0.08);
    box-shadow: inset 0 0 0 1px rgba(255,255,255,0.04), inset 0 0 90px rgba(0,0,0,0.18);
    pointer-events: none;
  }

  .tile {
    position: absolute;
    appearance: none;
    border: 0;
    border-radius: 16px;
    cursor: pointer;
    color: var(--tile-ink);
    background:
      radial-gradient(circle at 28% 18%, rgba(255,255,255,0.95), transparent 24%),
      linear-gradient(145deg, var(--tile), color-mix(in srgb, var(--tile-edge) 19%, var(--tile)) 68%, var(--tile-edge));
    box-shadow:
      0 15px 0 color-mix(in srgb, var(--tile-edge) 88%, #4d321e 12%),
      0 22px 30px rgba(0,0,0,0.34),
      inset -7px -9px 0 rgba(111, 72, 36, 0.12),
      inset 0 0 0 1px rgba(255,255,255,0.76);
    transform: translate3d(0, 0, 0);
    transition: transform 180ms ease, filter 180ms ease, opacity 180ms ease, box-shadow 180ms ease;
    touch-action: manipulation;
    user-select: none;
  }

  .tile::before,
  .tile::after {
    content: "";
    position: absolute;
    pointer-events: none;
    border-radius: inherit;
  }

  .tile::before {
    inset: 7px;
    border: 1px solid rgba(61, 42, 25, 0.18);
    background:
      linear-gradient(90deg, transparent 48%, rgba(73, 45, 20, 0.08) 50%, transparent 52%),
      linear-gradient(0deg, transparent 48%, rgba(73, 45, 20, 0.055) 50%, transparent 52%);
  }

  .tile::after {
    inset: 0;
    background: linear-gradient(135deg, rgba(255,255,255,0.42), transparent 34%, rgba(0,0,0,0.07) 82%);
    opacity: 0.75;
  }

  .tile-face {
    position: relative;
    z-index: 1;
    display: block;
    font-size: clamp(1.65rem, 4.5vw, 2.55rem);
    line-height: 1;
    filter: drop-shadow(0 2px 0 rgba(255,255,255,0.4));
  }

  .tile-family {
    position: relative;
    z-index: 1;
    display: block;
    margin-top: 5px;
    font-size: 0.56rem;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: rgba(39, 31, 25, 0.56);
    font-weight: 900;
  }

  .tile.is-closed {
    filter: saturate(0.72) brightness(0.82);
  }

  .tile.is-open:hover,
  .tile.is-selected,
  .tile.is-hint {
    transform: translateY(-8px) scale(1.03);
  }

  .tile.is-open:hover {
    box-shadow:
      0 16px 0 color-mix(in srgb, var(--tile-edge) 88%, #4d321e 12%),
      0 26px 34px rgba(0,0,0,0.38),
      0 0 0 2px color-mix(in srgb, var(--accent) 48%, transparent),
      inset -7px -9px 0 rgba(111, 72, 36, 0.12),
      inset 0 0 0 1px rgba(255,255,255,0.76);
  }

  .tile.is-open:not(.is-selected):not(.is-hint) {
    outline: var(--open-outline, 0) solid transparent;
  }

  .tile.is-selected {
    box-shadow:
      0 16px 0 color-mix(in srgb, var(--accent) 55%, var(--tile-edge)),
      0 28px 42px rgba(0,0,0,0.38),
      0 0 0 3px var(--accent),
      0 0 42px color-mix(in srgb, var(--accent) 42%, transparent),
      inset -7px -9px 0 rgba(111, 72, 36, 0.12);
  }

  .tile.is-hint {
    animation: hintPulse 900ms ease-in-out infinite;
    box-shadow:
      0 16px 0 color-mix(in srgb, var(--accent-2) 55%, var(--tile-edge)),
      0 0 0 3px var(--accent-2),
      0 0 52px color-mix(in srgb, var(--accent-2) 48%, transparent),
      inset -7px -9px 0 rgba(111, 72, 36, 0.12);
  }

  .tile.is-matched {
    transform: translateY(-20px) scale(0.82) rotate(-2deg);
    opacity: 0;
  }

  .tile.is-blocked {
    animation: shake 260ms ease-in-out;
  }

  .board-footer {
    margin-top: 14px;
    flex-wrap: wrap;
  }

  .pause-panel {
    position: absolute;
    inset: 0;
    z-index: 2000;
    display: grid;
    place-items: center;
    background: rgba(0,0,0,0.34);
    backdrop-filter: blur(8px);
  }

  .pause-card {
    width: min(420px, calc(100% - 30px));
    padding: 28px;
    text-align: center;
  }

  .result-screen {
    width: min(760px, 100%);
    margin: 40px auto 0;
    padding: clamp(26px, 5vw, 48px);
    text-align: center;
  }

  .result-screen h1 {
    font-size: clamp(2.4rem, 6vw, 4.7rem);
    margin-bottom: 10px;
  }

  .result-stars {
    font-size: 2.4rem;
    margin-bottom: 20px;
  }

  .result-grid {
    margin: 20px 0 24px;
  }

  @keyframes floaty {
    0%, 100% { transform: translate3d(0, 0, 0) scale(1); }
    50% { transform: translate3d(-18px, 22px, 0) scale(1.08); }
  }

  @keyframes hintPulse {
    0%, 100% { filter: brightness(1); }
    50% { filter: brightness(1.16); }
  }

  @keyframes shake {
    0%, 100% { transform: translateX(0); }
    25% { transform: translateX(-4px); }
    75% { transform: translateX(4px); }
  }

  .reduced-motion *,
  .reduced-motion *::before,
  .reduced-motion *::after {
    animation-duration: 1ms !important;
    transition-duration: 1ms !important;
  }

  .assist-open .tile.is-open:not(.is-selected):not(.is-hint):not(.is-matched) {
    box-shadow:
      0 15px 0 color-mix(in srgb, var(--tile-edge) 88%, #4d321e 12%),
      0 22px 30px rgba(0,0,0,0.34),
      0 0 0 1px color-mix(in srgb, var(--accent) 34%, transparent),
      0 0 22px color-mix(in srgb, var(--accent) 18%, transparent),
      inset -7px -9px 0 rgba(111, 72, 36, 0.12),
      inset 0 0 0 1px rgba(255,255,255,0.76);
  }

  .mahjong-app:not(.reduced-motion) .tile.is-open::after {
    transition: opacity 180ms ease;
  }

  @media (max-width: 1040px) {
    .menu-grid,
    .settings-grid,
    .hud {
      grid-template-columns: 1fr;
    }

    .preview-card {
      grid-column: auto;
    }

    .level-grid {
      grid-template-columns: repeat(3, minmax(0, 1fr));
    }
  }

  @media (max-width: 700px) {
    .shell {
      width: min(100% - 16px, 1240px);
      padding-top: 10px;
    }

    .topbar {
      align-items: flex-start;
      flex-direction: column;
    }

    .top-actions {
      width: 100%;
      justify-content: space-between;
    }

    .top-actions .ghost-btn,
    .top-actions .primary-btn {
      flex: 1;
      padding-inline: 10px;
    }

    .hero-card {
      min-height: auto;
      padding: 26px;
    }

    h1 {
      font-size: clamp(2.1rem, 13vw, 3.8rem);
    }

    .level-grid {
      grid-template-columns: 1fr;
    }

    .level-card {
      min-height: 160px;
    }

    .stats-grid,
    .result-grid {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }

    .hud-actions .secondary-btn,
    .hud-actions .ghost-btn {
      flex: 1;
    }

    .board-card {
      padding: 10px;
      border-radius: 22px;
    }

    .board-topline {
      align-items: flex-start;
      flex-direction: column;
    }

    .tile-family {
      display: none;
    }
  }
`;

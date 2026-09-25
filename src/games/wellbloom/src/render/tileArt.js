import { TILE } from '../config.js';
import { E, N, S, W } from '../puzzle/directions.js';
import { GOLDEN, PALETTE, RUNE_COLORS, WATER } from './palette.js';
import { bakeSprite, cachedSprite, context2d, createCanvas, ditherPass } from './pixels.js';
import { FLOWERS, OBSTACLES, POT, RUNES, SPROUT, STEM_LETTERS } from './sprites.js';
import { THEMES } from './themes.js';

// channel geometry inside a 16px tile
const BED_FROM = 6;
const BED_TO = 9;
const REACH = 2;
const SPAN = TILE + REACH * 2;

function isBed(mask, x, y) {
  const inBand = (v) => v >= BED_FROM && v <= BED_TO;
  if (inBand(x) && inBand(y)) return true;
  if (mask & N && inBand(x) && y <= BED_TO) return true;
  if (mask & S && inBand(x) && y >= BED_FROM) return true;
  if (mask & W && inBand(y) && x <= BED_TO) return true;
  if (mask & E && inBand(y) && x >= BED_FROM) return true;
  return false;
}

// chebyshev distance to the bed for every pixel
function distanceMap(mask) {
  const map = new Uint8Array(SPAN * SPAN).fill(3);
  for (let y = -REACH; y < TILE + REACH; y++) {
    for (let x = -REACH; x < TILE + REACH; x++) {
      let best = 3;
      for (let dy = -2; dy <= 2 && best > 0; dy++) {
        for (let dx = -2; dx <= 2; dx++) {
          if (isBed(mask, x + dx, y + dy)) best = Math.min(best, Math.max(Math.abs(dx), Math.abs(dy)));
        }
      }
      map[(y + REACH) * SPAN + (x + REACH)] = best;
    }
  }
  return (x, y) => (x < -REACH || y < -REACH || x >= TILE + REACH || y >= TILE + REACH ? 3 : map[(y + REACH) * SPAN + (x + REACH)]);
}

const DISTANCE = Array.from({ length: 16 }, (_, mask) => distanceMap(mask));

function rimColors(theme, stone) {
  return stone
    ? { light: theme.stone.light, base: theme.stone.base, dark: theme.stone.rim }
    : theme.rim;
}

const channelCache = new Map();

// a channel tile
export function channel(themeId, stone, mask, waterColor, wetStep, frame) {
  const key = `${themeId}|${stone}|${mask}|${waterColor}|${wetStep}|${waterColor ? frame : 0}`;
  let canvas = channelCache.get(key);
  if (canvas) return canvas;

  const theme = THEMES[themeId];
  const rim = rimColors(theme, stone);
  const water = waterColor ? WATER[waterColor] : null;
  const at = DISTANCE[mask];

  canvas = createCanvas(TILE, TILE);
  const ctx = context2d(canvas);
  for (let y = 0; y < TILE; y++) {
    for (let x = 0; x < TILE; x++) {
      const d = at(x, y);
      if (d >= 3) continue;
      let color;
      if (d === 2) {
        color = rim.dark;
      } else if (d === 1) {
        color = at(x, y - 1) === 0 || at(x - 1, y) === 0 ? rim.light : rim.base;
      } else {
        const shaded = at(x, y - 1) > 0;
        if (water && ditherPass(x, y, wetStep / 4)) {
          color = shaded ? water.deep : water.base;
          if (!shaded && (x + y + frame * 2) % 8 === 0) color = water.light;
          if (!shaded && (x * 5 + y * 3 + frame * 7) % 29 === 0) color = water.foam;
        } else {
          color = shaded ? theme.bed.dark : (x * 7 + y * 13) % 11 === 0 ? theme.bed.speck : theme.bed.base;
        }
      }
      ctx.fillStyle = color;
      ctx.fillRect(x, y, 1, 1);
    }
  }
  channelCache.set(key, canvas);
  return canvas;
}

export const SPRING_FRAMES = 8;
const springCache = new Map();

// round stone basin with rippling water, drawn over the centre of a spring tile
export function spring(themeId, waterColor, frame) {
  const key = `${themeId}|${waterColor}|${frame}`;
  let canvas = springCache.get(key);
  if (canvas) return canvas;

  const theme = THEMES[themeId];
  const water = WATER[waterColor];
  const ripple = (frame / SPRING_FRAMES) * 3.8;
  canvas = createCanvas(TILE, TILE);
  const ctx = context2d(canvas);
  for (let y = 0; y < TILE; y++) {
    for (let x = 0; x < TILE; x++) {
      const dx = x - 7.5;
      const dy = y - 7.5;
      const r = Math.hypot(dx, dy);
      let color = null;
      if (r <= 3.7) {
        color = Math.abs(r - ripple) < 0.6 ? water.light : r > 3 && dy > 0 ? water.base : water.base;
        if (r > 2.9 && dy < -1) color = water.deep;
        if (r < 1 && frame % 4 < 2) color = water.foam;
      } else if (r <= 5.2) {
        color = dx + dy < -2 ? theme.rim.light : dx + dy > 2.5 ? theme.rim.dark : theme.rim.base;
      } else if (r <= 6.2) {
        color = PALETTE.k;
      }
      if (!color) continue;
      ctx.fillStyle = color;
      ctx.fillRect(x, y, 1, 1);
    }
  }
  springCache.set(key, canvas);
  return canvas;
}

export function pot(needColor) {
  const band = needColor ? WATER[needColor].base : PALETTE.n;
  return cachedSprite(`pot|${needColor}`, POT, { colors: { x: band } });
}

// board sprites get a dark outline so they read clearly on top of water
const BOARD_OUTLINE = '#1f1a2e';

export function sprout() {
  return cachedSprite('sprout', SPROUT, { outline: BOARD_OUTLINE });
}

function goldenColors(rows) {
  const colors = {};
  new Set(rows.join('')).forEach((letter) => {
    if (letter === '.' || STEM_LETTERS.has(letter)) return;
    const hex = PALETTE[letter];
    const value = parseInt(hex.slice(1), 16);
    const lightness = ((value >> 16) & 255) * 0.3 + ((value >> 8) & 255) * 0.59 + (value & 255) * 0.11;
    colors[letter] = lightness > 190 ? GOLDEN.light : lightness > 120 ? GOLDEN.mid : GOLDEN.dark;
  });
  return colors;
}

// flower sprite, 7x10 plain or 9x12 with `outlined`
export function flower(species, { golden = false, silhouette = false, outlined = false } = {}) {
  const rows = FLOWERS[species] ?? FLOWERS.daisy;
  let colors = golden ? goldenColors(rows) : {};
  if (silhouette) colors = Object.fromEntries([...new Set(rows.join(''))].map((l) => [l, '#2d2640']));
  const outline = outlined ? BOARD_OUTLINE : null;
  return cachedSprite(`flower|${species}|${golden}|${silhouette}|${outlined}`, rows, { colors, outline });
}

export function obstacle(themeId) {
  return cachedSprite(`obstacle|${themeId}`, OBSTACLES[themeId] ?? OBSTACLES.meadow);
}

export function rune(group) {
  const color = RUNE_COLORS[group % RUNE_COLORS.length];
  return cachedSprite(`rune|${group}`, RUNES[group % RUNES.length], { colors: { x: color } });
}

export function runeColor(group) {
  return RUNE_COLORS[group % RUNE_COLORS.length];
}

// big flower-in-pot portrait for the herbarium and pop-ups
export function portrait(species, { golden = false, silhouette = false } = {}) {
  const canvas = createCanvas(9, 16);
  const ctx = context2d(canvas);
  ctx.drawImage(flower(species, { golden, silhouette }), 1, 0);
  const potSprite = silhouette
    ? bakeSprite(POT, { colors: Object.fromEntries(['k', 'n', 'N', 'x'].map((l) => [l, '#2d2640'])) })
    : pot(null);
  ctx.drawImage(potSprite, 1, 10);
  return canvas;
}

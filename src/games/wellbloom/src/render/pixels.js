import { PALETTE } from './palette.js';

export function createCanvas(width, height) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  return canvas;
}

export function context2d(canvas) {
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = false;
  return ctx;
}

// turns sprite rows into a canvas
export function bakeSprite(rows, { colors = {}, outline = null, scale = 1 } = {}) {
  const height = rows.length;
  const width = rows[0].length;
  const pad = outline ? 1 : 0;
  const canvas = createCanvas((width + pad * 2) * scale, (height + pad * 2) * scale);
  const ctx = context2d(canvas);
  const solid = (x, y) => x >= 0 && y >= 0 && x < width && y < height && rows[y][x] !== '.';

  if (outline) {
    ctx.fillStyle = outline;
    for (let y = -1; y <= height; y++) {
      for (let x = -1; x <= width; x++) {
        if (solid(x, y)) continue;
        if (solid(x - 1, y) || solid(x + 1, y) || solid(x, y - 1) || solid(x, y + 1)) {
          ctx.fillRect((x + pad) * scale, (y + pad) * scale, scale, scale);
        }
      }
    }
  }

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const letter = rows[y][x];
      if (letter === '.') continue;
      ctx.fillStyle = colors[letter] ?? PALETTE[letter] ?? '#ff00ff';
      ctx.fillRect((x + pad) * scale, (y + pad) * scale, scale, scale);
    }
  }
  return canvas;
}

const cache = new Map();

// bakes once per key and reuses the canvas afterwards
export function cachedSprite(key, rows, options) {
  if (!cache.has(key)) cache.set(key, bakeSprite(rows, options));
  return cache.get(key);
}

export function spriteUrl(rows, options) {
  return bakeSprite(rows, options).toDataURL('image/png');
}

// 4x4 ordered-dither thresholds, used for pixel-art fades
export const BAYER = [
  [0, 8, 2, 10],
  [12, 4, 14, 6],
  [3, 11, 1, 9],
  [15, 7, 13, 5],
];

export function ditherPass(x, y, amount) {
  return (BAYER[y & 3][x & 3] + 0.5) / 16 < amount;
}

// cheap deterministic per-pixel noise in [0, 1)
export function pixelNoise(x, y, seed = 0) {
  let h = (x * 374761393 + y * 668265263 + seed * 2147483647) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

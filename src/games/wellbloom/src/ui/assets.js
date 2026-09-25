import { PALETTE } from '../render/palette.js';
import { bakeSprite } from '../render/pixels.js';
import { DEWDROP, FLAME, FLOWERS, HAND, ICONS, LEAF, LOCK, MASCOT, MASCOT_BLINK, STAR, SUN } from '../render/sprites.js';

const INK = PALETTE.k;

const SOURCES = {
  ...Object.fromEntries(Object.entries(ICONS).map(([name, rows]) => [name, { rows, colors: { x: INK } }])),
  star: { rows: STAR, outline: INK },
  starEmpty: { rows: STAR, outline: INK, colors: { y: '#716887', Y: '#524a66', w: '#8e86a3' } },
  dewdrop: { rows: DEWDROP, outline: INK },
  lock: { rows: LOCK },
  flame: { rows: FLAME, outline: INK },
  sun: { rows: SUN },
  leaf: { rows: LEAF },
  flower: { rows: FLOWERS.tulip },
  mascot: { rows: MASCOT },
  mascotBlink: { rows: MASCOT_BLINK },
  hand: { rows: HAND },
};

const baked = new Map();

function bake(name) {
  if (!baked.has(name)) {
    const source = SOURCES[name];
    if (!source) throw new Error(`Unknown sprite "${name}"`);
    const canvas = bakeSprite(source.rows, { colors: source.colors, outline: source.outline });
    baked.set(name, { url: canvas.toDataURL('image/png'), width: canvas.width, height: canvas.height });
  }
  return baked.get(name);
}

export function spriteUrl(name) {
  return bake(name).url;
}

// paints a sprite onto an element's background and records its pixel size
export function applyIcon(element, name) {
  const { url, width, height } = bake(name);
  element.style.backgroundImage = `url(${url})`;
  element.style.setProperty('--w', width);
  element.style.setProperty('--h', height);
}

export function createIcon(name, className = 'icon') {
  const element = document.createElement('span');
  element.className = className;
  element.setAttribute('aria-hidden', 'true');
  applyIcon(element, name);
  return element;
}

// fills every [data-icon] and img[data-sprite] under `root`
export function hydrateAssets(root = document) {
  root.querySelectorAll('[data-icon]').forEach((element) => applyIcon(element, element.dataset.icon));
  root.querySelectorAll('img[data-sprite]').forEach((img) => {
    img.src = spriteUrl(img.dataset.sprite);
  });
  const style = document.documentElement.style;
  style.setProperty('--star-full', `url(${spriteUrl('star')})`);
  style.setProperty('--star-empty', `url(${spriteUrl('starEmpty')})`);
}

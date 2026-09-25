import { GAME } from '../config.js';
import { Rng, hashString } from '../core/rng.js';
import { generateLevel } from './generator.js';
import { buildTutorialLevel } from './tutorials.js';

// story mode
export const WORLDS = [
  {
    id: 'meadow',
    branching: 0.3,
    species: ['daisy', 'tulip', 'poppy'],
    levels: [
      { tutorial: 'basics' },
      { cols: 3, rows: 3, tip: 'hint' },
      { cols: 3, rows: 4, tip: 'goal' },
      { cols: 4, rows: 4, tip: 'undo' },
      { cols: 4, rows: 4, rocks: 1 },
      { cols: 4, rows: 5, rocks: 1 },
      { cols: 5, rows: 5, rocks: 2 },
      { cols: 5, rows: 5, rocks: 1 },
      { cols: 5, rows: 6, rocks: 2 },
      { cols: 5, rows: 6, rocks: 3 },
      { cols: 6, rows: 6, rocks: 3 },
      { cols: 6, rows: 7, rocks: 3 },
    ],
  },
  {
    id: 'canyon',
    branching: 0.35,
    species: ['sunflower', 'marigold'],
    levels: [
      { cols: 4, rows: 5, rocks: 2, fixed: 0.3, tip: 'stone' },
      { cols: 5, rows: 5, rocks: 3, fixed: 0.25 },
      { cols: 5, rows: 6, rocks: 3, fixed: 0.25 },
      { cols: 5, rows: 6, rocks: 4, fixed: 0.2 },
      { cols: 6, rows: 6, rocks: 4, fixed: 0.2 },
      { cols: 6, rows: 6, rocks: 5, fixed: 0.18 },
      { cols: 6, rows: 7, rocks: 4, fixed: 0.18 },
      { cols: 6, rows: 7, rocks: 5, fixed: 0.15 },
      { cols: 6, rows: 8, rocks: 5, fixed: 0.15 },
      { cols: 7, rows: 7, rocks: 5, fixed: 0.12 },
      { cols: 7, rows: 8, rocks: 6, fixed: 0.12 },
      { cols: 7, rows: 8, rocks: 7, fixed: 0.1 },
    ],
  },
  {
    id: 'frost',
    branching: 0.4,
    species: ['snowdrop', 'bluebell', 'edelweiss'],
    levels: [
      { cols: 4, rows: 4, linked: 1, tip: 'rune' },
      { cols: 4, rows: 5, linked: 1 },
      { cols: 5, rows: 5, linked: 2, rocks: 1 },
      { cols: 5, rows: 5, linked: 2, rocks: 2 },
      { cols: 5, rows: 6, linked: 2, rocks: 2, fixed: 0.1 },
      { cols: 5, rows: 6, linked: 3, rocks: 2, fixed: 0.1 },
      { cols: 6, rows: 6, linked: 3, rocks: 3, fixed: 0.1 },
      { cols: 6, rows: 7, linked: 3, rocks: 3, fixed: 0.08 },
      { cols: 6, rows: 7, linked: 4, rocks: 3, fixed: 0.08 },
      { cols: 6, rows: 8, linked: 4, rocks: 4, fixed: 0.08 },
      { cols: 7, rows: 8, linked: 4, rocks: 4, fixed: 0.06 },
      { cols: 7, rows: 8, linked: 5, rocks: 5, fixed: 0.06 },
    ],
  },
  {
    id: 'twilight',
    branching: 0.4,
    species: ['lavender', 'moonbloom'],
    goldSpecies: ['sunflower', 'marigold'],
    levels: [
      { cols: 4, rows: 5, springs: 2, tip: 'springs' },
      { cols: 5, rows: 5, springs: 2 },
      { cols: 5, rows: 6, springs: 2, rocks: 2 },
      { cols: 5, rows: 6, springs: 2, rocks: 2, fixed: 0.1 },
      { cols: 6, rows: 6, springs: 2, rocks: 3, fixed: 0.1 },
      { cols: 6, rows: 7, springs: 2, rocks: 3, linked: 1, fixed: 0.1 },
      { cols: 6, rows: 7, springs: 2, rocks: 4, linked: 2, fixed: 0.08 },
      { cols: 6, rows: 8, springs: 2, rocks: 4, linked: 2, fixed: 0.08 },
      { cols: 7, rows: 7, springs: 2, rocks: 4, linked: 2, fixed: 0.08 },
      { cols: 7, rows: 8, springs: 2, rocks: 5, linked: 3, fixed: 0.06 },
      { cols: 7, rows: 8, springs: 2, rocks: 5, linked: 3, fixed: 0.06 },
      { cols: 7, rows: 9, springs: 2, rocks: 6, linked: 3, fixed: 0.05 },
    ],
  },
  {
    id: 'sky',
    branching: 0.45,
    species: ['rose', 'iris'],
    goldSpecies: ['sunflower', 'marigold'],
    levels: [
      { cols: 6, rows: 7, rocks: 3, linked: 2, fixed: 0.1, tip: 'sky' },
      { cols: 6, rows: 8, springs: 2, rocks: 4, linked: 2, fixed: 0.08 },
      { cols: 7, rows: 7, rocks: 4, linked: 3, fixed: 0.08 },
      { cols: 7, rows: 8, springs: 2, rocks: 4, linked: 3, fixed: 0.06 },
      { cols: 7, rows: 8, rocks: 5, linked: 4, fixed: 0.06 },
      { cols: 7, rows: 9, springs: 2, rocks: 5, linked: 3, fixed: 0.05 },
      { cols: 8, rows: 8, rocks: 6, linked: 4, fixed: 0.05 },
      { cols: 8, rows: 9, springs: 2, rocks: 6, linked: 4, fixed: 0.05 },
      { cols: 8, rows: 9, rocks: 6, linked: 5, fixed: 0.04 },
      { cols: 8, rows: 10, springs: 2, rocks: 7, linked: 4, fixed: 0.04 },
      { cols: 8, rows: 10, rocks: 7, linked: 5, fixed: 0.03 },
      { cols: 8, rows: 10, springs: 2, rocks: 8, linked: 5, fixed: 0.03 },
    ],
  },
];

export const LEVELS_PER_WORLD = 12;

export const ALL_SPECIES = [...new Set(WORLDS.flatMap((world) => [...world.species, ...(world.goldSpecies ?? [])]))];

// the world in which a species first appears
export function homeWorldOf(species) {
  return WORLDS.findIndex((world) => world.species.includes(species));
}

export function getStoryLevel(worldIndex, levelIndex) {
  const world = WORLDS[worldIndex];
  const entry = world.levels[levelIndex];
  const meta = { mode: 'story', worldIndex, levelIndex, theme: world.id, tip: entry.tip ?? null };

  if (entry.tutorial) {
    return { ...buildTutorialLevel(entry.tutorial), ...meta, tutorial: entry.tutorial };
  }

  const level = generateLevel({
    ...entry,
    seed: hashString(`${GAME.seed}/${world.id}/${levelIndex}`),
    species: world.species,
    goldSpecies: world.goldSpecies,
    branching: world.branching,
  });
  return { ...level, ...meta };
}

const DAILY_SHAPES = [
  { cols: 6, rows: 6, rocks: 3, fixed: 0.12 },
  { cols: 6, rows: 7, rocks: 4, linked: 2, fixed: 0.08 },
  { cols: 6, rows: 7, springs: 2, rocks: 3, fixed: 0.1 },
  { cols: 7, rows: 7, rocks: 4, linked: 3, fixed: 0.06 },
  { cols: 6, rows: 8, springs: 2, rocks: 4, linked: 2, fixed: 0.08 },
];

// the same garden for every player on a given calendar day
export function getDailyLevel(dateKey) {
  const seed = hashString(`${GAME.seed}/daily/${dateKey}`);
  const rng = new Rng(seed);
  const world = rng.pick(WORLDS);
  const shape = rng.pick(DAILY_SHAPES);
  const level = generateLevel({
    ...shape,
    seed,
    species: world.species,
    goldSpecies: world.goldSpecies ?? WORLDS[1].species,
    branching: world.branching,
  });
  return { ...level, mode: 'daily', dateKey, theme: world.id, tip: null };
}

export const ZEN_SIZES = {
  small: { cols: 5, rows: 5, rocks: 2 },
  medium: { cols: 6, rows: 7, rocks: 3 },
  large: { cols: 8, rows: 9, rocks: 6 },
};

// endless mode: a fresh garden each time, using only ideas the player has met
export function getZenLevel(size, seed, worldsUnlocked) {
  const rng = new Rng(seed);
  const world = WORLDS[rng.int(0, Math.max(0, worldsUnlocked - 1))];
  const base = ZEN_SIZES[size] ?? ZEN_SIZES.medium;
  const mechanics = {
    fixed: worldsUnlocked >= 2 && rng.chance(0.6) ? 0.1 : 0,
    linked: worldsUnlocked >= 3 && rng.chance(0.6) ? rng.int(1, 3) : 0,
    springs: worldsUnlocked >= 4 && rng.chance(0.5) ? 2 : 1,
  };
  const level = generateLevel({
    ...base,
    ...mechanics,
    seed,
    species: world.species,
    goldSpecies: world.goldSpecies ?? WORLDS[1].species,
    branching: world.branching,
  });
  return { ...level, mode: 'zen', size, theme: world.id, tip: null };
}

export function todayKey(date = new Date()) {
  const pad = (n) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

import { Rng } from '../core/rng.js';
import { Board, CellKind } from './board.js';
import { DIRECTIONS, countOpenings, neighborIndex, rotateMask } from './directions.js';

const MAX_ATTEMPTS = 400;
const WATER_COLORS = ['blue', 'gold'];

// builds a puzzle from a seed
export function generateLevel(spec) {
  const settings = { springs: 1, rocks: 0, fixed: 0, linked: 0, branching: 0.35, ...spec };
  const rng = new Rng(settings.seed);
  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    const network = growNetwork(rng, settings);
    if (!network) continue;
    const level = dressLevel(rng, settings, network);
    if (level) return level;
  }
  throw new Error(`No valid layout for seed ${settings.seed}`);
}

function growNetwork(rng, { cols, rows, springs, rocks, branching }) {
  const total = cols * rows;
  const blocked = placeRocks(rng, cols, rows, rocks);
  if (!blocked) return null;
  const sources = placeSprings(rng, cols, rows, blocked, springs);
  if (!sources) return null;

  const owner = new Int8Array(total).fill(-1);
  const masks = new Uint8Array(total);
  const frontiers = sources.map(() => []);
  const sizes = sources.map(() => 1);
  let unclaimed = total - blocked.filter(Boolean).length - sources.length;

  const extendFrontier = (tree, index) => {
    for (const dir of rng.shuffle([...DIRECTIONS])) {
      const next = neighborIndex(cols, rows, index, dir);
      if (next >= 0 && !blocked[next] && owner[next] === -1) {
        frontiers[tree].push({ from: index, to: next, dir });
      }
    }
  };

  sources.forEach((index, tree) => (owner[index] = tree));
  sources.forEach((index, tree) => extendFrontier(tree, index));

  let guard = total * 50;
  while (unclaimed > 0 && guard-- > 0) {
    frontiers.forEach((list, tree) => (frontiers[tree] = list.filter((edge) => owner[edge.to] === -1)));
    const tree = smallestGrowingTree(rng, frontiers, sizes);
    if (tree < 0) return null;

    const frontier = frontiers[tree];
    const pick = rng.chance(branching) ? rng.int(0, frontier.length - 1) : frontier.length - 1;
    const [edge] = frontier.splice(pick, 1);

    // four-way crossings make trivial tiles, so busy junctions are postponed
    if (countOpenings(masks[edge.from]) >= 3 && frontier.length > 0 && rng.chance(0.85)) {
      frontier.unshift(edge);
      continue;
    }

    masks[edge.from] |= edge.dir.bit;
    masks[edge.to] |= edge.dir.opposite;
    owner[edge.to] = tree;
    sizes[tree]++;
    unclaimed--;
    extendFrontier(tree, edge.to);
  }

  if (unclaimed > 0) return null;
  if (sizes.some((size) => size < 3)) return null;
  return { blocked, sources, owner, masks };
}

function smallestGrowingTree(rng, frontiers, sizes) {
  let best = -1;
  frontiers.forEach((frontier, tree) => {
    if (frontier.length === 0) return;
    if (best < 0 || sizes[tree] < sizes[best] || (sizes[tree] === sizes[best] && rng.chance(0.5))) {
      best = tree;
    }
  });
  return best;
}

function placeRocks(rng, cols, rows, count) {
  const total = cols * rows;
  const blocked = new Array(total).fill(false);
  const cells = rng.shuffle([...Array(total).keys()]);
  for (let i = 0; i < count && i < cells.length; i++) blocked[cells[i]] = true;
  return isOpenAreaConnected(cols, rows, blocked) ? blocked : null;
}

function isOpenAreaConnected(cols, rows, blocked) {
  const start = blocked.indexOf(false);
  if (start < 0) return false;
  const seen = new Set([start]);
  const queue = [start];
  for (let head = 0; head < queue.length; head++) {
    for (const dir of DIRECTIONS) {
      const next = neighborIndex(cols, rows, queue[head], dir);
      if (next >= 0 && !blocked[next] && !seen.has(next)) {
        seen.add(next);
        queue.push(next);
      }
    }
  }
  return seen.size === blocked.filter((b) => !b).length;
}

function placeSprings(rng, cols, rows, blocked, count) {
  const open = [...Array(cols * rows).keys()].filter((i) => !blocked[i]);
  const interior = open.filter((i) => {
    const x = i % cols;
    const y = Math.floor(i / cols);
    return x > 0 && y > 0 && x < cols - 1 && y < rows - 1;
  });

  if (count === 1) {
    return [rng.pick(interior.length > 0 ? interior : open)];
  }

  const first = rng.pick(open);
  const minDistance = Math.max(2, Math.floor((cols + rows) / 2));
  const far = open.filter((i) => manhattan(cols, i, first) >= minDistance);
  return far.length > 0 ? [first, rng.pick(far)] : null;
}

function manhattan(cols, a, b) {
  return Math.abs((a % cols) - (b % cols)) + Math.abs(Math.floor(a / cols) - Math.floor(b / cols));
}

function dressLevel(rng, settings, { blocked, sources, owner, masks }) {
  const { cols, rows } = settings;
  const cells = Array.from(masks, (mask, index) => {
    const base = { mask, solution: mask, fixed: false, group: -1, color: null, species: null, decor: rng.int(0, 4095) };
    if (blocked[index]) return { ...base, kind: CellKind.ROCK, fixed: true };
    const color = WATER_COLORS[owner[index]];
    if (sources.includes(index)) return { ...base, kind: CellKind.SPRING, fixed: true, color };
    if (countOpenings(mask) === 1) {
      const pool = color === 'gold' && settings.goldSpecies ? settings.goldSpecies : settings.species;
      return { ...base, kind: CellKind.POT, color, species: rng.pick(pool) };
    }
    return { ...base, kind: CellKind.PIPE };
  });

  const pots = cells.filter((cell) => cell.kind === CellKind.POT).length;
  const open = cells.filter((cell) => cell.kind !== CellKind.ROCK).length;
  if (open >= 9 && pots < 2) return null;

  markFixedChannels(rng, cells, settings.fixed);
  if (!formRuneGroups(rng, cells, settings.linked)) return null;
  if (!scramble(rng, cells, cols, rows)) return null;

  return {
    seed: settings.seed,
    cols,
    rows,
    springs: sources.length,
    cells,
    par: parFor(cells),
  };
}

function markFixedChannels(rng, cells, share) {
  if (share <= 0) return;
  const candidates = cells
    .map((cell, index) => ({ cell, index }))
    .filter(({ cell }) => cell.kind === CellKind.PIPE && cell.mask !== 15);
  const count = Math.round(candidates.length * share);
  rng.shuffle(candidates).slice(0, count).forEach(({ cell }) => (cell.fixed = true));
}

function formRuneGroups(rng, cells, groupCount) {
  if (groupCount <= 0) return true;
  const candidates = rng.shuffle(
    cells
      .map((cell, index) => ({ cell, index }))
      .filter(({ cell }) => (cell.kind === CellKind.PIPE || cell.kind === CellKind.POT) && !cell.fixed && cell.mask !== 15),
  );
  for (let group = 0; group < groupCount; group++) {
    const size = Math.min(rng.int(2, 3), candidates.length);
    if (size < 2) return false;
    candidates.splice(0, size).forEach(({ cell }) => (cell.group = group));
  }
  return true;
}

function turnUnits(cells) {
  const units = [];
  const groups = new Map();
  cells.forEach((cell, index) => {
    const turnable = (cell.kind === CellKind.PIPE || cell.kind === CellKind.POT) && !cell.fixed;
    if (!turnable) return;
    if (cell.group < 0) {
      units.push([index]);
    } else {
      if (!groups.has(cell.group)) {
        groups.set(cell.group, []);
        units.push(groups.get(cell.group));
      }
      groups.get(cell.group).push(index);
    }
  });
  return units;
}

function scramble(rng, cells, cols, rows) {
  const units = turnUnits(cells);
  for (let attempt = 0; attempt < 20; attempt++) {
    for (const unit of units) {
      const options = [1, 2, 3].filter((turns) =>
        unit.some((i) => rotateMask(cells[i].solution, turns) !== cells[i].solution),
      );
      const turns = options.length > 0 ? rng.pick(options) : 0;
      unit.forEach((i) => (cells[i].mask = rotateMask(cells[i].solution, turns)));
    }
    if (!new Board({ cols, rows, cells }).solved) return true;
  }
  return false;
}

// clockwise taps needed to restore the intended solution
export function parFor(cells) {
  return turnUnits(cells).reduce((sum, unit) => {
    for (let turns = 0; turns < 4; turns++) {
      if (unit.every((i) => rotateMask(cells[i].mask, turns) === cells[i].solution)) return sum + turns;
    }
    return sum;
  }, 0);
}

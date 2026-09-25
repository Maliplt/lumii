import { DIRECTIONS, neighborIndex, rotateMask, turnsToMatch } from './directions.js';

export const CellKind = Object.freeze({
  PIPE: 'pipe',
  SPRING: 'spring',
  POT: 'pot',
  ROCK: 'rock',
});

export const MIXED_WATER = 'mix';

// live puzzle state
export class Board {
  constructor(level) {
    this.level = level;
    this.cols = level.cols;
    this.rows = level.rows;
    this.cells = level.cells.map((cell) => ({ ...cell, locked: false }));
    this.groups = new Map();
    this.cells.forEach((cell, index) => {
      if (cell.group < 0) return;
      if (!this.groups.has(cell.group)) this.groups.set(cell.group, []);
      this.groups.get(cell.group).push(index);
    });
    this.moves = 0;
    this.history = [];
    this.flow = this.computeFlow();
  }

  get solved() {
    return this.flow.solved;
  }

  canRotate(index) {
    const cell = this.cells[index];
    if (!cell || cell.fixed || cell.locked) return false;
    return cell.kind === CellKind.PIPE || cell.kind === CellKind.POT;
  }

  // all tiles that turn together with `index` (its rune group, or just itself)
  unitOf(index) {
    const group = this.cells[index].group;
    return group >= 0 ? this.groups.get(group) : [index];
  }

  rotate(index, turns = 1) {
    if (!this.canRotate(index)) return null;
    const unit = this.unitOf(index);
    this.turnUnit(unit, turns);
    this.moves += 1;
    this.history.push({ unit, turns });
    this.flow = this.computeFlow();
    return unit;
  }

  undo() {
    const last = this.history.pop();
    if (!last) return null;
    this.turnUnit(last.unit, -last.turns);
    this.flow = this.computeFlow();
    return last;
  }

  reset() {
    this.cells.forEach((cell, index) => {
      if (!cell.locked) cell.mask = this.level.cells[index].mask;
    });
    this.moves = 0;
    this.history = [];
    this.flow = this.computeFlow();
  }

  // next misplaced tile along the intended water route, or -1 when none is left
  findHint() {
    for (const index of this.solutionOrder()) {
      if (this.canRotate(index) && this.unitTurnsToSolve(this.unitOf(index)) > 0) return index;
    }
    return -1;
  }

  // turns the hinted unit into place and pins it so it cannot be knocked loose
  applyHint(index) {
    const unit = this.unitOf(index);
    const turns = this.unitTurnsToSolve(unit);
    this.turnUnit(unit, turns);
    unit.forEach((i) => (this.cells[i].locked = true));
    this.history = [];
    this.flow = this.computeFlow();
    return { unit, turns };
  }

  unitTurnsToSolve(unit) {
    return turnsToMatch(
      unit.map((i) => this.cells[i].mask),
      unit.map((i) => this.cells[i].solution),
    );
  }

  turnUnit(unit, turns) {
    unit.forEach((i) => (this.cells[i].mask = rotateMask(this.cells[i].mask, turns)));
  }

  // index of the tile that `index` is joined to in direction `dir`, or -1
  linkedNeighbor(index, dir, masks = null) {
    const maskOf = (i) => (masks ? masks[i] : this.cells[i].mask);
    if (!(maskOf(index) & dir.bit)) return -1;
    const next = neighborIndex(this.cols, this.rows, index, dir);
    if (next < 0 || this.cells[next].kind === CellKind.ROCK) return -1;
    return maskOf(next) & dir.opposite ? next : -1;
  }

  solutionOrder() {
    const masks = this.cells.map((cell) => cell.solution);
    const springs = this.cells.flatMap((cell, i) => (cell.kind === CellKind.SPRING ? [i] : []));
    const seen = new Set(springs);
    const order = [...springs];
    for (let head = 0; head < order.length; head++) {
      for (const dir of DIRECTIONS) {
        const next = this.linkedNeighbor(order[head], dir, masks);
        if (next >= 0 && !seen.has(next)) {
          seen.add(next);
          order.push(next);
        }
      }
    }
    return order;
  }

  computeFlow() {
    const total = this.cells.length;
    const water = new Array(total).fill(null);
    const depth = new Array(total).fill(Infinity);

    this.cells.forEach((spring, start) => {
      if (spring.kind !== CellKind.SPRING) return;
      const seen = new Set([start]);
      const queue = [start];
      const distance = new Map([[start, 0]]);
      for (let head = 0; head < queue.length; head++) {
        const index = queue[head];
        const current = water[index];
        water[index] = current && current !== spring.color ? MIXED_WATER : spring.color;
        depth[index] = Math.min(depth[index], distance.get(index));
        for (const dir of DIRECTIONS) {
          const next = this.linkedNeighbor(index, dir);
          if (next < 0 || seen.has(next)) continue;
          seen.add(next);
          distance.set(next, distance.get(index) + 1);
          queue.push(next);
        }
      }
    });

    const leaks = [];
    water.forEach((color, index) => {
      if (!color) return;
      for (const dir of DIRECTIONS) {
        if (this.cells[index].mask & dir.bit && this.linkedNeighbor(index, dir) < 0) {
          leaks.push({ index, dir });
        }
      }
    });

    let potsTotal = 0;
    let potsWatered = 0;
    this.cells.forEach((cell, index) => {
      if (cell.kind !== CellKind.POT) return;
      potsTotal++;
      if (water[index] === cell.color) potsWatered++;
    });

    const mixed = water.includes(MIXED_WATER);
    return {
      water,
      depth,
      leaks,
      mixed,
      potsTotal,
      potsWatered,
      solved: leaks.length === 0 && !mixed && potsWatered === potsTotal,
    };
  }
}

// star rating for a finished level
export function starsFor(moves, par) {
  if (moves <= par) return 3;
  if (moves <= par + Math.max(2, Math.ceil(par * 0.5))) return 2;
  return 1;
}

export function starThresholds(par) {
  return { three: par, two: par + Math.max(2, Math.ceil(par * 0.5)) };
}

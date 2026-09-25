// a tile's openings are stored as a 4-bit mask, clockwise from north
export const N = 1;
export const E = 2;
export const S = 4;
export const W = 8;

export const DIRECTIONS = [
  { bit: N, dx: 0, dy: -1, opposite: S },
  { bit: E, dx: 1, dy: 0, opposite: W },
  { bit: S, dx: 0, dy: 1, opposite: N },
  { bit: W, dx: -1, dy: 0, opposite: E },
];

// rotates a mask clockwise by `turns` quarter turns (negative turns go counter-clockwise)
export function rotateMask(mask, turns = 1) {
  const steps = ((turns % 4) + 4) % 4;
  let result = mask;
  for (let i = 0; i < steps; i++) result = ((result << 1) | (result >> 3)) & 15;
  return result;
}

export function countOpenings(mask) {
  let count = 0;
  for (const dir of DIRECTIONS) if (mask & dir.bit) count++;
  return count;
}

// fewest clockwise turns that bring every `from` mask onto its `to` mask, or -1
export function turnsToMatch(fromMasks, toMasks) {
  for (let turns = 0; turns < 4; turns++) {
    if (fromMasks.every((mask, i) => rotateMask(mask, turns) === toMasks[i])) return turns;
  }
  return -1;
}

export function neighborIndex(cols, rows, index, dir) {
  const x = (index % cols) + dir.dx;
  const y = Math.floor(index / cols) + dir.dy;
  if (x < 0 || y < 0 || x >= cols || y >= rows) return -1;
  return y * cols + x;
}

import { CellKind } from './board.js';
import { E, N, S, W, rotateMask } from './directions.js';
import { parFor } from './generator.js';

// hand-built teaching levels
const LAYOUTS = {
  basics: {
    cols: 3,
    rows: 3,
    tiles: {
      '0,1': { kind: CellKind.SPRING, mask: E, color: 'blue' },
      '1,1': { kind: CellKind.PIPE, mask: E | W, turns: 1 },
      '2,1': { kind: CellKind.PIPE, mask: S | W, turns: 1 },
      '2,2': { kind: CellKind.POT, mask: N, turns: 1, color: 'blue', species: 'daisy' },
    },
    steps: ['1,1', '2,1', '2,2'],
  },
};

export function buildTutorialLevel(name) {
  const layout = LAYOUTS[name];
  if (!layout) throw new Error(`Unknown tutorial "${name}"`);
  const { cols, rows, tiles, steps } = layout;

  const cells = [];
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      const tile = tiles[`${x},${y}`];
      const decor = (x * 97 + y * 389) % 4096;
      if (!tile) {
        cells.push({ kind: CellKind.ROCK, mask: 0, solution: 0, fixed: true, group: -1, color: null, species: null, decor });
        continue;
      }
      cells.push({
        kind: tile.kind,
        mask: rotateMask(tile.mask, -(tile.turns ?? 0)),
        solution: tile.mask,
        fixed: tile.kind === CellKind.SPRING,
        group: -1,
        color: tile.color ?? null,
        species: tile.species ?? null,
        decor,
      });
    }
  }

  const toIndex = (key) => {
    const [x, y] = key.split(',').map(Number);
    return y * cols + x;
  };

  return {
    seed: `tutorial/${name}`,
    cols,
    rows,
    springs: 1,
    cells,
    par: parFor(cells),
    tutorialSteps: steps.map(toIndex),
  };
}

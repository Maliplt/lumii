"use strict";
// the board, 8×8 unless a level asks for less
(function (B) {
  const SIZE = 8;

  class Grid {
    constructor(size = SIZE, cells = null) {
      this.size = size;
      this.cells = cells ? cells.map((c) => (c ? { ...c } : null)) : new Array(size * size).fill(null);
    }

    clone() {
      return new Grid(this.size, this.cells);
    }

    at(x, y) {
      return this.cells[y * this.size + x];
    }

    set(x, y, cell) {
      this.cells[y * this.size + x] = cell;
    }

    fits(shape, x, y) {
      if (x < 0 || y < 0 || x + shape.w > this.size || y + shape.h > this.size) return false;
      for (const [cx, cy] of shape.cells) if (this.cells[(y + cy) * this.size + x + cx]) return false;
      return true;
    }

    spots(shape) {
      const out = [];
      for (let y = 0; y <= this.size - shape.h; y++) for (let x = 0; x <= this.size - shape.w; x++) if (this.fits(shape, x, y)) out.push([x, y]);
      return out;
    }

    anyFit(shape) {
      for (let y = 0; y <= this.size - shape.h; y++) for (let x = 0; x <= this.size - shape.w; x++) if (this.fits(shape, x, y)) return true;
      return false;
    }

    // gems, perks: { cellIndexInShape: name }
    place(shape, x, y, color, gems = {}, perks = {}) {
      const placed = [];
      shape.cells.forEach(([cx, cy], i) => {
        const cell = { kind: "block", color };
        if (gems[i]) cell.gem = gems[i];
        if (perks[i]) cell.perk = perks[i];
        this.set(x + cx, y + cy, cell);
        placed.push([x + cx, y + cy]);
      });
      return placed;
    }

    // rows and columns with no empty cell
    fullLines() {
      const rows = [];
      const cols = [];
      for (let i = 0; i < this.size; i++) {
        let row = true;
        let col = true;
        for (let j = 0; j < this.size; j++) {
          if (!this.at(j, i)) row = false;
          if (!this.at(i, j)) col = false;
        }
        if (row) rows.push(i);
        if (col) cols.push(i);
      }
      return { rows, cols, count: rows.length + cols.length };
    }

    // clears the given lines and reports what happened to every cell in them
    clear({ rows, cols }) {
      const touched = new Set();
      for (const y of rows) for (let x = 0; x < this.size; x++) touched.add(y * this.size + x);
      for (const x of cols) for (let y = 0; y < this.size; y++) touched.add(y * this.size + x);
      return this.hit(touched);
    }

    // knocks out the 3×3 square around (x, y), as a bomb does
    blast(x, y) {
      const touched = new Set();
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          const nx = x + dx;
          const ny = y + dy;
          if (nx >= 0 && ny >= 0 && nx < this.size && ny < this.size) touched.add(ny * this.size + nx);
        }
      }
      return this.hit(touched);
    }

    // one hit on every listed cell
    hit(touched) {
      const result = { removed: [], cracked: [], gems: {}, crates: 0, ice: 0 };
      for (const index of touched) {
        const cell = this.cells[index];
        const x = index % this.size;
        const y = Math.floor(index / this.size);
        if (!cell || cell.kind === "stone") continue;
        if (cell.kind === "ice" && cell.hp > 1) {
          cell.hp--;
          result.cracked.push({ x, y, cell: { ...cell } });
          continue;
        }
        if (cell.kind === "crate") result.crates++;
        if (cell.kind === "ice") result.ice++;
        if (cell.gem) result.gems[cell.gem] = (result.gems[cell.gem] || 0) + 1;
        result.removed.push({ x, y, cell });
        this.cells[index] = null;
      }
      return result;
    }

    count(kind) {
      return this.cells.filter((c) => c && c.kind === kind).length;
    }

    gems() {
      const out = {};
      for (const c of this.cells) if (c?.gem) out[c.gem] = (out[c.gem] || 0) + 1;
      return out;
    }

    // true when only stones remain
    spotless() {
      return this.cells.every((c) => !c || c.kind === "stone");
    }

    // empty cells walled in on all four sides: the ones that are hard to fill
    holes() {
      let n = 0;
      for (let y = 0; y < this.size; y++) {
        for (let x = 0; x < this.size; x++) {
          if (this.at(x, y)) continue;
          const shut = (dx, dy) => {
            const nx = x + dx;
            const ny = y + dy;
            return nx < 0 || ny < 0 || nx >= this.size || ny >= this.size || this.at(nx, ny);
          };
          if (shut(1, 0) && shut(-1, 0) && shut(0, 1) && shut(0, -1)) n++;
        }
      }
      return n;
    }
  }

  B.Grid = Grid;
  B.SIZE = SIZE;
})(window.Blockhaven);

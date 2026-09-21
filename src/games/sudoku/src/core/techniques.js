"use strict";
const SudokuTechniques = (() => {
  const ALL = 0x3fe;
  const digits = (mask) =>
    Array.from({ length: 9 }, (_, i) => i + 1).filter((n) => mask & (1 << n));
  const bitCount = (mask) => {
    let n = 0;
    while (mask) {
      mask &= mask - 1;
      n++;
    }
    return n;
  };
  const row = (i) => Math.floor(i / 9),
    col = (i) => i % 9;
  const unitMeta = SudokuEngine.units.map((cells, index) => ({
    cells,
    type: index < 9 ? "row" : index < 18 ? "column" : "box",
    index: index < 9 ? index : index < 18 ? index - 9 : index - 18,
  }));

  function baseMasks(board) {
    return board.map((value, i) =>
      value
        ? 0
        : SudokuEngine.candidates(board, i).reduce((m, n) => m | (1 << n), 0),
    );
  }
  function step(technique, difficulty, detail) {
    return { technique, difficulty, ...detail };
  }
  function single(board, masks) {
    for (let i = 0; i < 81; i++)
      if (!board[i] && bitCount(masks[i]) === 1) {
        const value = digits(masks[i])[0];
        return step("naked-single", 1, {
          focusCells: [i],
          supportCells: SudokuEngine.peers[i],
          placements: [{ cell: i, digit: value }],
          eliminations: [],
          units: [],
        });
      }
    for (const unit of unitMeta)
      for (let digit = 1; digit <= 9; digit++) {
        const places = unit.cells.filter(
          (i) => !board[i] && masks[i] & (1 << digit),
        );
        if (places.length === 1)
          return step("hidden-single", 2, {
            focusCells: places,
            supportCells: unit.cells.filter((i) => i !== places[0]),
            placements: [{ cell: places[0], digit }],
            eliminations: [],
            units: [unit],
          });
      }
    return null;
  }
  function nakedSubset(board, masks, size) {
    for (const unit of unitMeta) {
      const candidates = unit.cells.filter(
        (i) =>
          !board[i] && bitCount(masks[i]) >= 2 && bitCount(masks[i]) <= size,
      );
      const combinations = choose(candidates, size);
      for (const cells of combinations) {
        const union = cells.reduce((m, i) => m | masks[i], 0);
        if (bitCount(union) !== size) continue;
        const eliminations = [];
        for (const i of unit.cells)
          if (!cells.includes(i) && !board[i]) {
            for (const digit of digits(masks[i] & union))
              eliminations.push({ cell: i, digit });
          }
        if (eliminations.length)
          return step(
            size === 2 ? "naked-pair" : "naked-triple",
            size === 2 ? 3 : 5,
            {
              focusCells: cells,
              supportCells: unit.cells.filter((i) => !cells.includes(i)),
              placements: [],
              eliminations,
              units: [unit],
            },
          );
      }
    }
    return null;
  }
  function hiddenPair(board, masks) {
    for (const unit of unitMeta) {
      const positions = Array.from({ length: 10 }, () => []);
      for (let d = 1; d <= 9; d++)
        positions[d] = unit.cells.filter(
          (i) => !board[i] && masks[i] & (1 << d),
        );
      for (let a = 1; a <= 8; a++)
        for (let b = a + 1; b <= 9; b++) {
          if (
            positions[a].length !== 2 ||
            positions[b].length !== 2 ||
            positions[a][0] !== positions[b][0] ||
            positions[a][1] !== positions[b][1]
          )
            continue;
          const cells = positions[a],
            keep = (1 << a) | (1 << b),
            eliminations = [];
          for (const i of cells)
            for (const digit of digits(masks[i] & ~keep))
              eliminations.push({ cell: i, digit });
          if (eliminations.length)
            return step("hidden-pair", 4, {
              focusCells: cells,
              supportCells: unit.cells.filter((i) => !cells.includes(i)),
              placements: [],
              eliminations,
              units: [unit],
            });
        }
    }
    return null;
  }
  function hiddenTriple(board, masks) {
    for (const unit of unitMeta) {
      const positions = Array.from({ length: 10 }, () => []);
      for (let d = 1; d <= 9; d++)
        positions[d] = unit.cells.filter(
          (i) => !board[i] && masks[i] & (1 << d),
        );
      for (const ds of choose([1, 2, 3, 4, 5, 6, 7, 8, 9], 3)) {
        const cellSet = [...new Set(ds.flatMap((d) => positions[d]))];
        if (
          cellSet.length !== 3 ||
          ds.some((d) => positions[d].length < 1 || positions[d].length > 3)
        )
          continue;
        const keep = ds.reduce((m, d) => m | (1 << d), 0),
          eliminations = [];
        for (const i of cellSet)
          for (const digit of digits(masks[i] & ~keep))
            eliminations.push({ cell: i, digit });
        if (eliminations.length)
          return step("hidden-triple", 5, {
            focusCells: cellSet,
            supportCells: unit.cells.filter((i) => !cellSet.includes(i)),
            placements: [],
            eliminations,
            units: [unit],
          });
      }
    }
    return null;
  }
  function locked(board, masks) {
    for (let b = 0; b < 9; b++)
      for (let digit = 1; digit <= 9; digit++) {
        const boxUnit = unitMeta[18 + b],
          cells = boxUnit.cells.filter(
            (i) => !board[i] && masks[i] & (1 << digit),
          );
        if (cells.length < 2) continue;
        const sameRow = cells.every((i) => row(i) === row(cells[0])),
          sameCol = cells.every((i) => col(i) === col(cells[0]));
        const target = sameRow
          ? unitMeta[row(cells[0])]
          : sameCol
            ? unitMeta[9 + col(cells[0])]
            : null;
        if (!target) continue;
        const eliminations = target.cells
          .filter(
            (i) =>
              !boxUnit.cells.includes(i) &&
              !board[i] &&
              masks[i] & (1 << digit),
          )
          .map((cell) => ({ cell, digit }));
        if (eliminations.length)
          return step("locked-candidate-pointing", 4, {
            focusCells: cells,
            supportCells: boxUnit.cells.filter((i) => !cells.includes(i)),
            placements: [],
            eliminations,
            units: [boxUnit, target],
          });
      }
    for (let u = 0; u < 18; u++)
      for (let digit = 1; digit <= 9; digit++) {
        const line = unitMeta[u],
          cells = line.cells.filter(
            (i) => !board[i] && masks[i] & (1 << digit),
          );
        if (cells.length < 2) continue;
        const boxes = [
          ...new Set(
            cells.map(
              (i) => Math.floor(row(i) / 3) * 3 + Math.floor(col(i) / 3),
            ),
          ),
        ];
        if (boxes.length !== 1) continue;
        const boxUnit = unitMeta[18 + boxes[0]];
        const eliminations = boxUnit.cells
          .filter(
            (i) =>
              !line.cells.includes(i) && !board[i] && masks[i] & (1 << digit),
          )
          .map((cell) => ({ cell, digit }));
        if (eliminations.length)
          return step("locked-candidate-claiming", 4, {
            focusCells: cells,
            supportCells: line.cells.filter((i) => !cells.includes(i)),
            placements: [],
            eliminations,
            units: [line, boxUnit],
          });
      }
    return null;
  }
  function xWing(board, masks) {
    for (let digit = 1; digit <= 9; digit++) {
      const rows = Array.from({ length: 9 }, (_, r) =>
        unitMeta[r].cells.filter((i) => !board[i] && masks[i] & (1 << digit)),
      );
      for (let a = 0; a < 8; a++)
        for (let b = a + 1; b < 9; b++)
          if (
            rows[a].length === 2 &&
            rows[b].length === 2 &&
            col(rows[a][0]) === col(rows[b][0]) &&
            col(rows[a][1]) === col(rows[b][1])
          ) {
            const focus = [...rows[a], ...rows[b]],
              cols = [col(rows[a][0]), col(rows[a][1])],
              eliminations = [];
            for (const c of cols)
              for (const i of unitMeta[9 + c].cells)
                if (!focus.includes(i) && !board[i] && masks[i] & (1 << digit))
                  eliminations.push({ cell: i, digit });
            if (eliminations.length)
              return step("x-wing", 6, {
                focusCells: focus,
                supportCells: [],
                placements: [],
                eliminations,
                units: [
                  unitMeta[a],
                  unitMeta[b],
                  ...cols.map((c) => unitMeta[9 + c]),
                ],
              });
          }
    }
    return null;
  }
  function yWing(board, masks) {
    const bivalue = board
      .map((v, i) => (!v && bitCount(masks[i]) === 2 ? i : -1))
      .filter((i) => i >= 0);
    for (const pivot of bivalue) {
      const pd = digits(masks[pivot]),
        wings = bivalue.filter((i) => SudokuEngine.peers[pivot].includes(i));
      for (let a = 0; a < wings.length - 1; a++)
        for (let b = a + 1; b < wings.length; b++) {
          const wa = wings[a],
            wb = wings[b],
            ad = digits(masks[wa]),
            bd = digits(masks[wb]),
            pa = ad.filter((d) => pd.includes(d)),
            pb = bd.filter((d) => pd.includes(d));
          if (pa.length !== 1 || pb.length !== 1 || pa[0] === pb[0]) continue;
          const common = ad.find((d) => bd.includes(d) && !pd.includes(d));
          if (!common) continue;
          const eliminations = SudokuEngine.peers[wa]
            .filter(
              (i) =>
                SudokuEngine.peers[wb].includes(i) &&
                !board[i] &&
                masks[i] & (1 << common),
            )
            .map((cell) => ({ cell, digit: common }));
          if (eliminations.length)
            return step("y-wing", 7, {
              focusCells: [pivot, wa, wb],
              supportCells: [],
              placements: [],
              eliminations,
              units: [],
            });
        }
    }
    return null;
  }
  function swordfish(board, masks) {
    for (let digit = 1; digit <= 9; digit++) {
      const rows = Array.from({ length: 9 }, (_, r) =>
        unitMeta[r].cells.filter((i) => !board[i] && masks[i] & (1 << digit)),
      );
      for (const rs of choose([0, 1, 2, 3, 4, 5, 6, 7, 8], 3)) {
        if (rs.some((r) => rows[r].length < 2 || rows[r].length > 3)) continue;
        const cols = [...new Set(rs.flatMap((r) => rows[r].map(col)))];
        if (cols.length !== 3) continue;
        const focus = rs.flatMap((r) => rows[r]),
          eliminations = [];
        for (const c of cols)
          for (const i of unitMeta[9 + c].cells)
            if (!focus.includes(i) && !board[i] && masks[i] & (1 << digit))
              eliminations.push({ cell: i, digit });
        if (eliminations.length)
          return step("swordfish", 8, {
            focusCells: focus,
            supportCells: [],
            placements: [],
            eliminations,
            units: [
              ...rs.map((r) => unitMeta[r]),
              ...cols.map((c) => unitMeta[9 + c]),
            ],
          });
      }
    }
    return null;
  }
  function choose(items, size, start = 0, prefix = [], out = []) {
    if (prefix.length === size) {
      out.push(prefix);
      return out;
    }
    for (let i = start; i <= items.length - (size - prefix.length); i++)
      choose(items, size, i + 1, [...prefix, items[i]], out);
    return out;
  }
  function next(board, suppliedMasks) {
    const masks = suppliedMasks ? [...suppliedMasks] : baseMasks(board);
    return (
      single(board, masks) ||
      nakedSubset(board, masks, 2) ||
      hiddenPair(board, masks) ||
      locked(board, masks) ||
      nakedSubset(board, masks, 3) ||
      hiddenTriple(board, masks) ||
      xWing(board, masks) ||
      yWing(board, masks) ||
      swordfish(board, masks)
    );
  }
  function path(givens) {
    const board = [...givens],
      masks = baseMasks(board),
      result = [];
    let guard = 0;
    while (board.includes(0) && guard++ < 1000) {
      const found = next(board, masks);
      if (!found) return { steps: result, stuck: true, board, masks };
      result.push(found);
      for (const e of found.eliminations) masks[e.cell] &= ~(1 << e.digit);
      for (const p of found.placements) {
        board[p.cell] = p.digit;
        masks[p.cell] = 0;
        for (const peer of SudokuEngine.peers[p.cell])
          masks[peer] &= ~(1 << p.digit);
      }
    }
    return { steps: result, stuck: board.includes(0), board, masks };
  }
  function rate(givens) {
    const walked = path(givens);
    let hardest = 0,
      cost = 0;
    for (const found of walked.steps) {
      hardest = Math.max(hardest, found.difficulty);
      cost += found.difficulty + found.eliminations.length * 0.12;
    }
    if (walked.stuck)
      return {
        grade: 3,
        hardest: 9,
        cost: Math.round(cost + 80),
        steps: walked.steps.length,
        stuck: true,
      };
    const steps = walked.steps.length;
    const grade =
      hardest <= 1 && cost < 55
        ? 0
        : hardest <= 3 && cost < 85
          ? 1
          : hardest <= 5
            ? 2
            : 3;
    return { grade, hardest, cost: Math.round(cost), steps, stuck: false };
  }
  const names = {
    "naked-single": "Tek aday",
    "hidden-single": "Gizli tek",
    "naked-pair": "Çıplak çift",
    "hidden-pair": "Gizli çift",
    "locked-candidate-pointing": "Kilitli aday · işaretleme",
    "locked-candidate-claiming": "Kilitli aday · talep",
    "naked-triple": "Çıplak üçlü",
    "hidden-triple": "Gizli üçlü",
    "x-wing": "X-Wing",
    "y-wing": "Y-Wing",
    swordfish: "Swordfish",
  };
  return { baseMasks, next, path, rate, names, digits, bitCount };
})();
if (typeof module !== "undefined") module.exports = SudokuTechniques;

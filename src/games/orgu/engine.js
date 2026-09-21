"use strict";

/** Pure arithmetic model. No DOM, storage, clocks or animation dependencies. */
const WeaveEngine = (() => {
  const VERSION = "weave-1";
  const coordinates = {
    a: [0, 0],
    b: [2, 0],
    c: [4, 0],
    d: [0, 2],
    e: [0, 4],
    f: [2, 4],
    g: [4, 4],
    h: [4, 2],
    i: [6, 2],
    j: [8, 2],
    k: [8, 4],
    l: [8, 6],
    m: [4, 6],
    n: [4, 8],
    o: [0, 8],
    p: [2, 8],
    q: [0, 6],
    r: [6, 6],
  };
  function random(seed) {
    let hash = 2166136261;
    for (const char of String(seed))
      hash = Math.imul(hash ^ char.charCodeAt(0), 16777619);
    return () => {
      hash += 0x6d2b79f5;
      let value = hash;
      value = Math.imul(value ^ (value >>> 15), value | 1);
      value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
      return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
    };
  }
  function shuffle(items, rng) {
    const result = [...items];
    for (let i = result.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
  }
  const calculate = (a, op, b) =>
    op === "+" ? a + b : op === "×" ? a * b : op === "÷" ? a / b : a - b;

  /** Independent deduction pass: every removed value must be forced by an equation. */
  function deduce(puzzle, hidden) {
    const known = Object.fromEntries(
      Object.entries(puzzle.solution).filter(([id]) => !hidden.has(id)),
    );
    const steps = [];
    let changed = true;
    while (changed) {
      changed = false;
      for (const equation of puzzle.equations) {
        const {
          ids: [a, b, c],
          op,
        } = equation;
        const missing = [a, b, c].filter((id) => known[id] === undefined);
        if (missing.length !== 1) continue;
        const id = missing[0];
        const value =
          id === c
            ? calculate(known[a], op, known[b])
            : id === a
              ? op === "×"
                ? known[c] / known[b]
                : op === "÷"
                  ? known[c] * known[b]
                  : op === "+"
                    ? known[c] - known[b]
                    : known[c] + known[b]
              : op === "×"
                ? known[c] / known[a]
                : op === "÷"
                  ? known[a] / known[c]
                  : op === "+"
                    ? known[c] - known[a]
                    : known[a] - known[c];
        if (!Number.isInteger(value) || value < 1) return null;
        known[id] = value;
        steps.push({ id, value, equation: equation.id });
        changed = true;
      }
    }
    if (Object.keys(known).length !== Object.keys(puzzle.solution).length)
      return null;
    if (
      !puzzle.equations.every(
        (e) =>
          calculate(known[e.ids[0]], e.op, known[e.ids[1]]) === known[e.ids[2]],
      )
    )
      return null;
    return steps;
  }

  function legacyGenerate(seed, level = 1) {
    const rng = random(`${VERSION}:${seed}:${level}`);
    const tier = level <= 3 ? 0 : level <= 8 ? 1 : 2;
    const integer = (min, max) => min + Math.floor(rng() * (max - min + 1));
    const s = {};
    const equations = [];
    const add = (a, b, c, op = "+") =>
      equations.push({ id: equations.length, ids: [a, b, c], op });
    s.a = integer(3, 9 + tier * 3);
    s.b = integer(2, 8);
    const topOp = tier > 0 && s.a > s.b && rng() > 0.5 ? "−" : "+";
    s.c = calculate(s.a, topOp, s.b);
    add("a", "b", "c", topOp);
    s.d = integer(3, 9);
    s.e = s.a + s.d;
    add("a", "d", "e");
    s.f = integer(3, 9);
    if (tier === 0) s.f = Math.max(s.f, s.b - s.d + 1);
    s.g = s.e + s.f;
    if (s.g === s.c) {
      s.f++;
      s.g++;
    }
    add("e", "f", "g");
    s.h = Math.abs(s.g - s.c);
    add("c", "h", "g", s.g > s.c ? "+" : "−");
    s.i = integer(2, 9);
    const sideOp = tier > 0 && s.h > s.i && rng() > 0.4 ? "−" : "+";
    s.j = calculate(s.h, sideOp, s.i);
    add("h", "i", "j", sideOp);
    s.k = integer(2, 8);
    s.l = s.j + s.k;
    add("j", "k", "l");
    const lowerOp = tier > 1 && rng() > 0.4 ? "−" : "+";
    s.r = integer(1, Math.min(9, s.l - 1));
    s.m = lowerOp === "+" ? s.l - s.r : s.l + s.r;
    add("m", "r", "l", lowerOp);
    s.n = s.g + s.m;
    add("g", "m", "n");
    s.q = integer(1, Math.min(9, s.f + s.m - 1));
    s.o = s.e + s.q;
    s.p = s.n - s.o;
    add("e", "q", "o");
    add("o", "p", "n");
    const puzzle = {
      version: VERSION,
      seed: String(seed),
      level,
      tier,
      solution: s,
      equations,
      coordinates,
    };
    const hidden = new Set();
    const target = [6, 8, 10][tier];
    for (const id of shuffle(Object.keys(s), rng)) {
      if (hidden.size >= target) break;
      hidden.add(id);
      if (!deduce(puzzle, hidden)) hidden.delete(id);
    }
    puzzle.hidden = [...hidden];
    puzzle.tray = shuffle(
      puzzle.hidden.map((id) => s[id]),
      rng,
    );
    return puzzle;
  }

  // Each segment is a left-to-right or top-to-bottom equation on a number lattice.
  const patterns = [
    [
      [0, 0, 1, 0],
      [2, 0, 0, 1],
      [0, 2, 1, 0],
    ],
    [
      [0, 0, 0, 1],
      [0, 1, 1, 0],
      [2, 1, 0, 1],
      [2, 3, 1, 0],
    ],
    [
      [0, 0, 1, 0],
      [0, 0, 0, 1],
      [0, 2, 1, 0],
      [2, 0, 0, 1],
      [2, 1, 1, 0],
    ],
    [
      [0, 0, 1, 0],
      [1, 0, 0, 1],
      [0, 2, 1, 0],
      [2, 2, 0, 1],
      [0, 4, 1, 0],
    ],
    [
      [0, 0, 0, 1],
      [0, 0, 1, 0],
      [2, 0, 0, 1],
      [2, 2, 1, 0],
      [4, 2, 0, 1],
      [2, 4, 1, 0],
    ],
    [
      [0, 1, 1, 0],
      [1, 0, 0, 1],
      [0, 3, 1, 0],
      [2, 1, 0, 1],
      [2, 3, 1, 0],
      [4, 1, 0, 1],
    ],
    [
      [0, 0, 1, 0],
      [2, 0, 0, 1],
      [0, 2, 1, 0],
      [0, 2, 0, 1],
      [0, 4, 1, 0],
      [2, 2, 0, 1],
    ],
    [
      [0, 0, 0, 1],
      [0, 1, 1, 0],
      [2, 0, 0, 1],
      [2, 2, 1, 0],
      [3, 2, 0, 1],
      [1, 4, 1, 0],
    ],
  ];

  function proceduralPattern(rng, level) {
    const size = 5;
    const desired =
      level === 1 ? 4 : level < 4 ? 5 : 6 + Math.min(2, Math.floor(level / 8));
    const candidates = [];
    for (let y = 0; y < size; y++)
      for (let x = 0; x < size; x++) {
        if (x + 2 < size) candidates.push([x, y, 1, 0]);
        if (y + 2 < size) candidates.push([x, y, 0, 1]);
      }
    let best = null,
      bestScore = -Infinity;
    for (let attempt = 0; attempt < 36; attempt++) {
      const segments = [],
        numbers = new Set(),
        symbols = new Set();
      for (const segment of shuffle(candidates, rng)) {
        const [x, y, dx, dy] = segment;
        const ns = [0, 1, 2].map((i) =>
          [2 * (x + dx * i), 2 * (y + dy * i)].join(","),
        );
        const os = [1, 3].map((i) =>
          [2 * x + dx * i, 2 * y + dy * i].join(","),
        );
        const shared = ns.filter((id) => numbers.has(id)).length;
        if (segments.length && shared !== 1) continue;
        if (
          os.some((id) => symbols.has(id) || numbers.has(id)) ||
          ns.some((id) => symbols.has(id))
        )
          continue;
        // Reject incidental neighboring numbers that visually imply an absent equation.
        const future = new Set([...numbers, ...ns]);
        const strokes = new Set([...symbols, ...os]);
        let misleading = false;
        for (const id of future) {
          const [px, py] = id.split(",").map(Number);
          for (const [dx, dy] of [
            [2, 0],
            [0, 2],
          ]) {
            if (
              future.has([px + dx, py + dy].join(",")) &&
              !strokes.has([px + dx / 2, py + dy / 2].join(","))
            )
              misleading = true;
          }
        }
        if (misleading) continue;
        segments.push(segment);
        ns.forEach((id) => numbers.add(id));
        os.forEach((id) => symbols.add(id));
        if (segments.length === desired) break;
      }
      if (segments.length < 4) continue;
      const points = [...numbers].map((id) => id.split(",").map(Number));
      const minX = Math.min(...points.map((p) => p[0])) / 2,
        minY = Math.min(...points.map((p) => p[1])) / 2;
      const width = Math.max(...points.map((p) => p[0])) / 2 - minX + 1,
        height = Math.max(...points.map((p) => p[1])) / 2 - minY + 1;
      const horizontal = segments.filter((s) => s[2] === 1).length;
      if (!horizontal || horizontal === segments.length) continue;
      const score =
        segments.length * 20 -
        Math.abs(width - height) * 3 +
        Math.min(horizontal, segments.length - horizontal) * 2;
      if (score > bestScore) {
        bestScore = score;
        best = segments.map(([x, y, dx, dy]) => [x - minX, y - minY, dx, dy]);
      }
    }
    if (!best) throw new Error("No connected board found");
    return best;
  }
  function challenge(puzzle, rng, level) {
    const ids = Object.keys(puzzle.solution);
    const target = Math.min(puzzle.equations.length, level < 3 ? level + 3 : 9);
    let best = null,
      bestScore = -Infinity;
    for (let attempt = 0; attempt < 48; attempt++) {
      const hidden = new Set();
      const degree = (id) =>
        puzzle.equations.filter((e) => e.ids.includes(id)).length;
      const ordered = shuffle(ids, rng);
      if (attempt % 2 === 0) ordered.sort((a, b) => degree(b) - degree(a));
      for (const id of ordered) {
        if (hidden.size >= target) break;
        hidden.add(id);
        if (!deduce(puzzle, hidden)) hidden.delete(id);
      }
      const steps = deduce(puzzle, hidden);
      const depth = Object.fromEntries(
        ids.filter((id) => !hidden.has(id)).map((id) => [id, 0]),
      );
      for (const step of steps)
        depth[step.id] =
          1 +
          Math.max(
            ...puzzle.equations[step.equation].ids
              .filter((id) => id !== step.id)
              .map((id) => depth[id] || 0),
          );
      const maxDepth = Math.max(...Object.values(depth));
      const coverage = puzzle.equations.filter((e) =>
        e.ids.some((id) => hidden.has(id)),
      ).length;
      const ready = puzzle.equations.filter(
        (e) => e.ids.filter((id) => hidden.has(id)).length === 1,
      ).length;
      const score = hidden.size * 25 + coverage * 12 + maxDepth * 8 - ready * 3;
      if (score > bestScore) {
        bestScore = score;
        best = { hidden: [...hidden], depth: maxDepth, coverage, ready };
      }
    }
    puzzle.hidden = best.hidden;
    puzzle.challenge = {
      depth: best.depth,
      coverage: best.coverage,
      ready: best.ready,
    };
    puzzle.tray = shuffle(
      best.hidden.map((id) => puzzle.solution[id]),
      rng,
    );
  }

  function generate(seed, level = 1, layoutVersion = 3) {
    if (layoutVersion === 1) return legacyGenerate(seed, level);
    const rng = random("layouts-" + layoutVersion + ":" + seed + ":" + level);
    const pattern = (level - 1) % patterns.length;
    const transpose = Math.floor((level - 1) / patterns.length) % 2;
    const coords = {};
    const shape =
      layoutVersion === 3 ? proceduralPattern(rng, level) : patterns[pattern];
    const equations = shape.map(([x, y, dx, dy], index) => {
      const ids = [0, 1, 2].map((i) => {
        const point = transpose
          ? [y + dy * i, x + dx * i]
          : [x + dx * i, y + dy * i];
        const id = "n" + point.join("_");
        coords[id] = point.map((n) => n * 2);
        return id;
      });
      return { id: index, ids };
    });
    const allowed =
      level === 1
        ? ["+"]
        : level === 2
          ? ["+", "−"]
          : level === 3
            ? ["+", "−", "×"]
            : ["+", "−", "×", "÷"];
    const required =
      level === 1 ? "+" : level === 2 ? "−" : level === 3 ? "×" : "÷";
    let operationOrder =
      layoutVersion === 3 && level >= 5 ? shuffle(allowed, rng) : null;
    let solution;
    // Backtracking enforces shared-cell consistency, integer division and bounded values.
    function fill(index, known, budget) {
      if (index === equations.length) return known;
      if (--budget.left <= 0) return null;
      const eq = equations[index],
        [a, b, c] = eq.ids;
      const ops =
        operationOrder && index < operationOrder.length
          ? [operationOrder[index]]
          : index === 0
            ? [required]
            : shuffle(allowed, rng);
      const candidates = [];
      for (const op of ops)
        for (let av = 1; av <= 60; av++) {
          if (known[a] != null && known[a] !== av) continue;
          for (let bv = 1; bv <= 24; bv++) {
            if (known[b] != null && known[b] !== bv) continue;
            if ((op === "×" || op === "÷") && bv < 2) continue;
            const cv = calculate(av, op, bv);
            if (
              !Number.isInteger(cv) ||
              cv < 1 ||
              cv > 81 ||
              (known[c] != null && known[c] !== cv)
            )
              continue;
            if (level < 3 && (av > 20 || bv > 12 || cv > 30)) continue;
            candidates.push({ op, av, bv, cv });
          }
        }
      for (const v of shuffle(candidates, rng).slice(0, 120)) {
        eq.op = v.op;
        const result = fill(
          index + 1,
          { ...known, [a]: v.av, [b]: v.bv, [c]: v.cv },
          budget,
        );
        if (result) return result;
      }
      return null;
    }
    for (let attempt = 0; attempt < 12 && !solution; attempt++) {
      if (operationOrder) operationOrder = shuffle(allowed, rng);
      solution = fill(0, {}, { left: 1200 });
    }
    if (!solution) throw new Error("Unable to construct arithmetic pattern");
    const puzzle = {
      version: VERSION,
      layoutVersion,
      pattern,
      seed: String(seed),
      level,
      tier: level < 3 ? 0 : level < 7 ? 1 : 2,
      coordinates: coords,
      solution,
      equations,
    };
    if (layoutVersion === 3) {
      challenge(puzzle, rng, level);
      return puzzle;
    }
    const hidden = new Set();
    const target = Math.min(
      level + 2,
      9,
      Math.ceil(Object.keys(solution).length * 0.6),
    );
    for (const id of shuffle(Object.keys(solution), rng)) {
      if (hidden.size >= target) break;
      hidden.add(id);
      if (!deduce(puzzle, hidden)) hidden.delete(id);
    }
    // Ensure the newly introduced operation needs player input.
    if (!equations[0].ids.some((id) => hidden.has(id))) {
      for (const id of equations[0].ids) {
        hidden.add(id);
        if (deduce(puzzle, hidden)) break;
        hidden.delete(id);
      }
    }
    puzzle.hidden = [...hidden];
    puzzle.tray = shuffle(
      puzzle.hidden.map((id) => solution[id]),
      rng,
    );
    return puzzle;
  }

  function tutorial() {
    return {
      version: VERSION,
      seed: "tutorial",
      level: 0,
      tier: 0,
      coordinates: { a: [0, 0], b: [2, 0], c: [4, 0], d: [2, 2], e: [2, 4] },
      solution: { a: 6, b: 4, c: 10, d: 3, e: 7 },
      hidden: ["b", "d"],
      tray: [3, 4],
      equations: [
        { id: 0, ids: ["a", "b", "c"], op: "+" },
        { id: 1, ids: ["b", "d", "e"], op: "+" },
      ],
    };
  }
  const values = (puzzle, placed) => ({
    ...Object.fromEntries(
      Object.entries(puzzle.solution).filter(
        ([id]) => !puzzle.hidden.includes(id),
      ),
    ),
    ...placed,
  });
  function status(puzzle, placed) {
    const current = values(puzzle, placed);
    return puzzle.equations.map((e) => {
      const [a, b, c] = e.ids.map((id) => current[id]);
      return [a, b, c].some((v) => v == null)
        ? "open"
        : calculate(a, e.op, b) === c
          ? "valid"
          : "invalid";
    });
  }
  function remaining(puzzle, placed) {
    const used = Object.values(placed);
    return puzzle.tray.map((value) => {
      const index = used.indexOf(value);
      if (index < 0) return value;
      used.splice(index, 1);
      return null;
    });
  }
  function validPlacement(puzzle, placed) {
    if (!placed || typeof placed !== "object" || Array.isArray(placed))
      return false;
    const pool = [...puzzle.tray];
    return Object.entries(placed).every(([id, value]) => {
      const at = pool.indexOf(value);
      if (!puzzle.hidden.includes(id) || at < 0) return false;
      pool.splice(at, 1);
      return true;
    });
  }
  return {
    VERSION,
    generate,
    tutorial,
    status,
    values,
    remaining,
    validPlacement,
    deduce,
  };
})();

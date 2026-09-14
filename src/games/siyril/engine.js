"use strict";
const ArrowPuzzle = (() => {
  const vectors = [
    [0, -1],
    [1, 0],
    [0, 1],
    [-1, 0],
  ];
  function random(seed) {
    return () => {
      seed |= 0;
      seed = (seed + 0x6d2b79f5) | 0;
      let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t ^= t + Math.imul(t ^ (t >>> 7), 61 | t);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  const point = (cell, n) => [cell % n, Math.floor(cell / n)];
  function direction(path, n) {
    const [x, y] = point(path.at(-1), n),
      [a, b] = point(path.at(-2), n);
    return vectors.findIndex(([dx, dy]) => dx === x - a && dy === y - b);
  }
  function ray(path, n) {
    let [x, y] = point(path.at(-1), n);
    const [dx, dy] = vectors[direction(path, n)],
      cells = [];
    for (x += dx, y += dy; x >= 0 && y >= 0 && x < n && y < n; x += dx, y += dy)
      cells.push(y * n + x);
    return cells;
  }
  function blocker(board, remaining, id) {
    const occupied = new Map();
    remaining.forEach((key) =>
      board.paths[key].forEach((cell) => occupied.set(cell, key)),
    );
    for (const cell of ray(board.paths[id], board.n))
      if (occupied.has(cell)) return occupied.get(cell);
    return null;
  }
  const available = (board, remaining) =>
    remaining.filter((id) => blocker(board, remaining, id) === null);
  const shapes = [
    "circle",
    "heart",
    "star",
    "diamond",
    "flower",
    "cross",
    "ring",
    "butterfly",
    "hexagon",
    "moon",
    "hourglass",
    "clover",
    "shield",
    "bolt",
    "wave",
    "fish",
    "cloud",
    "arch",
    "kite",
    "crown",
  ];
  function inside(shape, x, y) {
    const ax = Math.abs(x),
      ay = Math.abs(y),
      r = Math.hypot(x, y);
    switch (shape) {
      case "circle":
        return r <= 1;
      case "heart": {
        const v = -y * 1.12 + 0.15;
        return (x * x + v * v - 0.8) ** 3 - x * x * v * v * v <= 0;
      }
      case "star":
        return (
          r <= 0.72 + 0.25 * Math.cos(5 * (Math.atan2(y, x) + Math.PI / 2))
        );
      case "diamond":
        return ax + ay <= 1.12;
      case "flower":
        return r <= 0.78 + 0.18 * Math.cos(6 * Math.atan2(y, x));
      case "cross":
        return ax < 0.38 || ay < 0.38;
      case "ring":
        return r <= 1 && r >= 0.43;
      case "butterfly":
        return (
          Math.hypot((ax - 0.5) * 1.6, y) < 0.94 && (ay < 0.78 || ax > 0.35)
        );
      case "hexagon":
        return ay < 0.86 && ax + ay * 0.55 <= 1;
      case "moon":
        return r <= 1 && Math.hypot(x - 0.52, y + 0.18) > 0.76;
      case "hourglass":
        return ax <= 0.3 + ay * 0.68;
      case "clover":
        return (
          Math.min(
            Math.hypot(x - 0.42, y),
            Math.hypot(x + 0.42, y),
            Math.hypot(x, y - 0.42),
            Math.hypot(x, y + 0.42),
          ) < 0.58
        );
      case "shield":
        return ay <= 0.95 && ax <= 0.92 - Math.max(0, y) * 0.72;
      case "bolt":
        return Math.abs(x + y * 0.65) < 0.34 || (ay < 0.23 && ax < 0.8);
      case "wave":
        return Math.abs(y - 0.35 * Math.sin(x * 4)) < 0.46;
      case "fish":
        return (
          Math.hypot((x + 0.15) * 1.15, y * 1.5) < 0.9 ||
          (x > 0.4 && ay < (x - 0.25) * 1.15)
        );
      case "cloud":
        return (
          Math.hypot(x + 0.48, y - 0.15) < 0.5 ||
          Math.hypot(x, y + 0.18) < 0.64 ||
          Math.hypot(x - 0.48, y - 0.15) < 0.5
        );
      case "arch":
        return r <= 1 && (y < 0 ? r > 0.44 : ax > 0.43);
      case "kite":
        return ax < (y < -0.2 ? (y + 1) * 0.95 : (1 - y) * 0.64);
      case "crown":
        return y > 0.05 || (ay < 0.85 && (ax > 0.7 || ax < 0.22));
      default:
        return true;
    }
  }
  function silhouette(level, n) {
    const shape = shapes[(level - 1) % shapes.length];
    const cells = Array.from({ length: n * n }, (_, i) => i).filter((cell) => {
      const [x, y] = point(cell, n);
      return inside(shape, (2 * x) / (n - 1) - 1, (2 * y) / (n - 1) - 1);
    });
    return { shape, cells };
  }
  function pacing(level) {
    const base = Math.min(31, 23 + 2 * Math.floor((level - 1) / 20));
    if (level <= 5)
      return {
        kind: "warmup",
        size: 7 + (level - 1) * 2,
        pressure: level < 3 ? 0 : 20,
        turns: 0,
      };
    if (level >= 7 && level <= 9)
      return {
        kind: "standard",
        size: 19 + (level - 7) * 2,
        pressure: 60,
        turns: 2,
      };
    if (level % 10 === 1)
      return {
        kind: "relaxed",
        size: Math.min(17, base - 10),
        pressure: 0,
        turns: 0,
      };
    if (level % 10 === 6)
      return {
        kind: "easy",
        size: Math.min(19, base - 6),
        pressure: 25,
        turns: 1,
      };
    if (level % 10 === 0)
      return {
        kind: "challenge",
        size: Math.min(31, base + 2),
        pressure: 100,
        turns: 3,
      };
    return { kind: "standard", size: base, pressure: 100, turns: 3 };
  }
  const cache = new Map();
  function generate(level) {
    if (cache.has(level)) return cache.get(level);
    let board;
    for (let attempt = 0; attempt < 16; attempt++) {
      const candidate = build(level, attempt);
      if (!board || candidate.paths.flat().length > board.paths.flat().length)
        board = candidate;
      if (board.paths.flat().length === board.cells.length) break;
    }
    if (cache.size > 40) cache.delete(cache.keys().next().value);
    cache.set(level, board);
    return board;
  }
  function build(level, variation) {
    const rhythm = pacing(level);
    const n = rhythm.size;
    const { shape, cells } = silhouette(level, n),
      allowed = new Set(cells);
    const rng = random(47219 + level * 7919 + variation * 104729),
      paths = [],
      occupied = new Set();
    const target = Math.floor(cells.length * 0.99);
    // Yeni yol eski çıkışları kapatabilir; kendi çıkışı açık kalır.
    while (occupied.size < target) {
      let best = null,
        bestScore = -Infinity;
      const openRays = paths
        .map((path) => ray(path, n))
        .filter((cells) => !cells.some((c) => occupied.has(c)));
      for (let attempt = 0; attempt < 1000; attempt++) {
        let cell = cells[Math.floor(rng() * cells.length)];
        if (occupied.has(cell)) continue;
        const path = [cell],
          length = 2 + Math.floor(rng() * 10);
        for (let k = 1; k < length; k++) {
          const [x, y] = point(cell, n);
          const options = vectors
            .map(([dx, dy]) => [x + dx, y + dy])
            .filter(([a, b]) => a >= 0 && a < n && b >= 0 && b < n)
            .map(([a, b]) => b * n + a)
            .filter(
              (v) => allowed.has(v) && !occupied.has(v) && !path.includes(v),
            );
          if (!options.length) break;
          cell = options[Math.floor(rng() * options.length)];
          path.push(cell);
        }
        if (
          path.length < 2 ||
          ray(path, n).some((v) => occupied.has(v) || path.includes(v))
        )
          continue;
        const blocked = openRays.filter((cells) =>
          cells.some((v) => path.includes(v)),
        ).length;
        const merit = blocked * rhythm.pressure + path.length * 2 + rng() * 3;
        if (merit > bestScore) {
          best = path;
          bestScore = merit;
        }
      }
      if (!best) break;
      paths.push(best);
      best.forEach((c) => occupied.add(c));
    }
    const board = { level, n, paths, shape, cells, revision: 5 };
    // Yönü değiştirmeden önce bütün çıkışları doğrula.
    function solvable() {
      const owners = new Map();
      paths.forEach((path, id) => path.forEach((c) => owners.set(c, id)));
      const dependencies = paths.map(
        (path) =>
          new Set(
            ray(path, n)
              .filter((c) => owners.has(c))
              .map((c) => owners.get(c)),
          ),
      );
      const cleared = new Set();
      for (let pass = 0; pass < paths.length; pass++) {
        let changed = false;
        dependencies.forEach((deps, id) => {
          if (!cleared.has(id) && [...deps].every((d) => cleared.has(d))) {
            cleared.add(id);
            changed = true;
          }
        });
        if (!changed) break;
      }
      return cleared.size === paths.length;
    }
    // Boş komşuları kuyruklara eklerken çözüm sırasını koru.
    let extended = true;
    while (extended) {
      extended = false;
      for (const path of paths) {
        const [x, y] = point(path[0], n);
        for (const [dx, dy] of vectors) {
          const a = x + dx,
            b = y + dy,
            cell = b * n + a;
          if (
            a < 0 ||
            a >= n ||
            b < 0 ||
            b >= n ||
            !allowed.has(cell) ||
            occupied.has(cell)
          )
            continue;
          path.unshift(cell);
          if (solvable()) {
            occupied.add(cell);
            extended = true;
            break;
          }
          path.shift();
        }
      }
    }
    let previousSize;
    do {
      previousSize = occupied.size;
      // İç boşlukları komşu yolu bölerek kapat; her adımda çözümü doğrula.
      for (const cell of cells) {
        if (occupied.has(cell)) continue;
        const [cx, cy] = point(cell, n);
        let added = false;
        for (let id = 0; id < paths.length && !added; id++) {
          const original = paths[id];
          for (let k = 0; k < original.length && !added; k++) {
            const [x, y] = point(original[k], n);
            if (Math.abs(x - cx) + Math.abs(y - cy) !== 1) continue;
            const choices = [
              [original.slice(0, k), [cell, ...original.slice(k)]],
              [[...original.slice(0, k + 1), cell], original.slice(k + 1)],
            ];
            for (const parts of choices) {
              const pieces = parts.filter((part) => part.length);
              if (pieces.some((part) => part.length < 2)) continue;
              for (let flip = 0; flip < 1 << pieces.length; flip++) {
                const oriented = pieces.map((part, j) =>
                  flip & (1 << j) ? [...part].reverse() : part,
                );
                paths[id] = oriented[0];
                if (oriented.length === 2) paths.push(oriented[1]);
                if (solvable()) {
                  occupied.add(cell);
                  added = true;
                  break;
                }
                if (oriented.length === 2) paths.pop();
                paths[id] = original;
              }
              if (added) break;
            }
          }
        }
      }
    } while (occupied.size > previousSize && occupied.size < cells.length);
    for (let pass = 0; pass < rhythm.turns; pass++) {
      const free = available(
        board,
        paths.map((_, id) => id),
      );
      for (const id of free) {
        if (
          available(
            board,
            paths.map((_, i) => i),
          ).length <= 2
        )
          break;
        paths[id].reverse();
        if (
          blocker(
            board,
            paths.map((_, i) => i),
            id,
          ) === null ||
          !solvable()
        )
          paths[id].reverse();
      }
    }

    return board;
  }
  function tutorial() {
    return {
      level: 0,
      n: 7,
      paths: [
        [22, 23, 24],
        [10, 17],
        [31, 32, 33],
        [36, 29],
      ],
    };
  }
  return {
    generate,
    tutorial,
    available,
    blocker,
    direction,
    point,
    vectors,
    shapes,
    silhouette,
    pacing,
  };
})();
if (typeof module !== "undefined") module.exports = ArrowPuzzle;

"use strict";
// Renk yolları önce çözülmüş olarak kurulur; aralarındaki boşluklar engel olur.
const DotEngine = (() => {
  const COLORS = [
    "#ff866d",
    "#74baff",
    "#f4cb65",
    "#e7a0ce",
    "#82d5c2",
    "#b5b9f2",
    "#f5ad72",
  ];
  const adjacent = (a, b, n) =>
    Math.abs(Math.floor(a / n) - Math.floor(b / n)) +
      Math.abs((a % n) - (b % n)) ===
    1;
  function random(seed) {
    return () => {
      seed |= 0;
      seed = (seed + 0x6d2b79f5) | 0;
      let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function difficulty(level) {
    const boss = level % 10 === 0;
    const base =
      level < 4 ? 5 : level < 14 ? 6 : level < 34 ? 7 : level < 70 ? 8 : 9;
    return {
      size: Math.min(10, base + (boss ? 1 : 0)),
      pairs: Math.min(7, 3 + Math.floor(level / 12) + (boss ? 1 : 0)),
      boss,
    };
  }
  function generate(level, seed = 831927, version = "dots-2") {
    const config = difficulty(level),
      n = config.size,
      rng = random(seed ^ Math.imul(level, 2654435761));
    let full = [];
    for (let r = 0; r < n; r++)
      for (let c = 0; c < n; c++) full.push(r * n + (r % 2 ? n - 1 - c : c));
    const pattern =
      version === "dots-1"
        ? "weave"
        : ["weave", "spiral", "terrace", "bands"][
            Math.floor((level - 1) / 3) % 4
          ];
    if (pattern === "spiral") {
      full = [];
      let top = 0,
        bottom = n - 1,
        left = 0,
        right = n - 1;
      while (top <= bottom && left <= right) {
        for (let c = left; c <= right; c++) full.push(top * n + c);
        top++;
        for (let r = top; r <= bottom; r++) full.push(r * n + right);
        right--;
        if (top <= bottom) {
          for (let c = right; c >= left; c--) full.push(bottom * n + c);
          bottom--;
        }
        if (left <= right) {
          for (let r = bottom; r >= top; r--) full.push(r * n + left);
          left++;
        }
      }
    }
    // Uçtan yapılan dönüşüm, tüm hücrelerden bir kez geçen yolu korur.
    for (
      let k = 0;
      k < n * n * (pattern === "bands" ? 0 : pattern === "spiral" ? 1 : 24);
      k++
    ) {
      if (rng() < 0.5) full.reverse();
      const choices = [];
      for (let j = 2; j < full.length; j++)
        if (adjacent(full[0], full[j], n)) choices.push(j);
      if (choices.length) {
        const j = choices[Math.floor(rng() * choices.length)];
        full = [...full.slice(0, j).reverse(), ...full.slice(j)];
      }
    }
    const walls = [],
      routes = [];
    if (version !== "dots-1") {
      // Uçları kırpmak teras biçimi oluşturur; kalan yol hâlâ kesintisizdir.
      const trim = pattern === "terrace" ? n + 1 : pattern === "spiral" ? 2 : 0;
      walls.push(...full.splice(0, trim));
      const rotation = Math.floor(rng() * 4);
      const rotateCell = (cell) => {
        let r = Math.floor(cell / n),
          c = cell % n;
        for (let k = 0; k < rotation; k++) [r, c] = [c, n - 1 - r];
        return r * n + c;
      };
      full = full.map(rotateCell);
      for (let i = 0; i < walls.length; i++) walls[i] = rotateCell(walls[i]);
    }
    let cursor = 0;
    const gapCount =
      level < 3 ? 0 : Math.min(config.pairs - 1, 1 + Math.floor(level / 8));
    const gaps = Array(config.pairs - 1).fill(0);
    for (let i = 0; i < gapCount; i++) gaps[i] = 1; // Engel sırası aynı seed ile sabit kalır.
    for (let i = gaps.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      [gaps[i], gaps[j]] = [gaps[j], gaps[i]];
    }
    for (let color = 0; color < config.pairs; color++) {
      const remaining = config.pairs - color,
        remainingGaps = gaps.slice(color).reduce((a, b) => a + b, 0);
      const free = full.length - cursor - remainingGaps;
      const length =
        remaining === 1
          ? free
          : Math.max(
              3,
              Math.min(
                free - (remaining - 1) * 3,
                Math.round(free / remaining) + (Math.floor(rng() * 3) - 1),
              ),
            );
      const solution = full.slice(cursor, cursor + length);
      cursor += length;
      routes.push({
        color,
        start: solution[0],
        end: solution.at(-1),
        solution,
      });
      if (solution.length > 3 && (color % 2 === 0 || config.boss)) rng(); // Eski bölüm kimlikleri aynı düzeni üretmeye devam etsin.
      if (gaps[color]) walls.push(full[cursor++]);
    }
    return {
      gameId: "katman",
      generatorVersion: version,
      pattern,
      level,
      seed,
      levelId: `katman:connect:${version}:${seed}:${level}`,
      size: n,
      boss: config.boss,
      routes,
      walls,
    };
  }
  function tutorial() {
    const solutions = [
      [0, 1, 2, 3],
      [4, 8, 12, 13],
      [5, 6, 7, 11, 10, 14, 15],
    ];
    return {
      gameId: "katman",
      generatorVersion: "dots-1",
      level: 0,
      seed: 0,
      levelId: "katman:tutorial",
      size: 4,
      boss: false,
      walls: [9],
      routes: solutions.map((solution, color) => ({
        color,
        start: solution[0],
        end: solution.at(-1),
        solution,
      })),
    };
  }
  function connected(route, path) {
    return (
      path.length > 1 &&
      ((path[0] === route.start && path.at(-1) === route.end) ||
        (path[0] === route.end && path.at(-1) === route.start))
    );
  }
  function validate(board, paths) {
    if (!Array.isArray(paths) || paths.length !== board.routes.length)
      return false;
    const used = new Set();
    return paths.every(
      (path, color) =>
        Array.isArray(path) &&
        path.every((cell, i) => {
          if (
            !Number.isInteger(cell) ||
            cell < 0 ||
            cell >= board.size ** 2 ||
            board.walls.includes(cell) ||
            used.has(cell)
          )
            return false;
          const route = board.routes[color];
          if (i === 0 && cell !== route.start && cell !== route.end)
            return false;
          if (i && !adjacent(path[i - 1], cell, board.size)) return false;
          if (
            board.routes.some(
              (r, c) => c !== color && (cell === r.start || cell === r.end),
            )
          )
            return false;
          if (
            i < path.length - 1 &&
            (cell === route.start || cell === route.end) &&
            i > 0
          )
            return false;
          used.add(cell);
          return true;
        }),
    );
  }
  function stats(board, paths) {
    const filled = new Set(paths.flat()),
      pairs = board.routes.filter((r, i) => connected(r, paths[i])).length;
    const cells = filled.size,
      total = board.size ** 2 - board.walls.length;
    return {
      pairs,
      cells,
      total,
      score: pairs * 150 + cells * 5,
      won: pairs === board.routes.length && cells === total,
    };
  }
  return Object.freeze({
    COLORS,
    adjacent,
    difficulty,
    generate,
    tutorial,
    connected,
    validate,
    stats,
  });
})();
if (typeof module !== "undefined" && module.exports) module.exports = DotEngine;

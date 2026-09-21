"use strict";

const RouteEngine = (() => {
  const adjacent = (a, b, n) =>
    Math.abs(Math.floor(a / n) - Math.floor(b / n)) +
      Math.abs((a % n) - (b % n)) ===
    1;

  const random = (seed) => () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };

  function generate(level) {
    const boss = level % 10 === 0;
    const n = Math.min(
      7,
      (level < 4 ? 3 : level < 16 ? 4 : level < 41 ? 5 : 6) + (boss ? 1 : 0),
    );
    const rnd = random(Math.imul(level, 2654435761) ^ 195743);
    let path = [];
    for (let r = 0; r < n; r++) {
      for (let c = 0; c < n; c++) path.push(r * n + (r % 2 ? n - 1 - c : c));
    }
    for (let k = 0; k < n * n * 20; k++) {
      if (rnd() < 0.5) path.reverse();
      const options = [];
      for (let i = 2; i < path.length; i++) {
        if (adjacent(path[0], path[i], n)) options.push(i);
      }
      if (options.length) {
        const j = options[Math.floor(rnd() * options.length)];
        path = [...path.slice(0, j).reverse(), ...path.slice(j)];
      }
    }
    const trim = level < 4 ? 2 : boss ? 0 : 1 + Math.floor(rnd() * Math.min(n, 4));
    path = path.slice(Math.floor(trim / 2), path.length - Math.ceil(trim / 2));
    const checkpoints = [];
    const count = level < 7 ? 0 : Math.min(4, 1 + Math.floor(level / 18));
    for (let i = 1; i <= count; i++) {
      checkpoints.push(path[Math.floor((i * (path.length - 1)) / (count + 1))]);
    }
    return {
      level,
      n,
      boss,
      path,
      start: path[0],
      end: path.at(-1),
      active: path.slice(),
      checkpoints,
    };
  }

  return { adjacent, generate };
})();

if (typeof module !== "undefined") module.exports = RouteEngine;

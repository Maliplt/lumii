"use strict";

// Bitler kuzeyden başlayarak saat yönündeki bağlantıları tutar.
// Önce bağlı bir ağaç kurulur; böylece karıştırılan bölüm çözülebilir kalır.
const Circuit = (() => {
  const dirs = [
    [-1, 0],
    [0, 1],
    [1, 0],
    [0, -1],
  ];
  const rotate = (mask, turns = 1) => {
    turns = ((turns % 4) + 4) % 4;
    return ((mask << turns) | (mask >> (4 - turns))) & 15;
  };
  const rng = (seed) => () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  function hash(text) {
    let h = 2166136261;
    for (const c of String(text)) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
    return h >>> 0;
  }
  function connected(masks, n, root) {
    const lit = Array(n * n).fill(false),
      depth = Array(n * n).fill(0),
      queue = [root];
    lit[root] = true;
    for (let k = 0; k < queue.length; k++) {
      const i = queue[k],
        r = Math.floor(i / n),
        c = i % n;
      dirs.forEach(([dr, dc], d) => {
        const nr = r + dr,
          nc = c + dc,
          j = nr * n + nc;
        if (
          nr < 0 ||
          nc < 0 ||
          nr >= n ||
          nc >= n ||
          lit[j] ||
          !(masks[i] & (1 << d)) ||
          !(masks[j] & (1 << (d + 2) % 4))
        )
          return;
        lit[j] = true;
        depth[j] = depth[i] + 1;
        queue.push(j);
      });
    }
    return { lit, depth, count: queue.length };
  }
  function base(seed, level) {
    const chapter = BigInt(level),
      boss = chapter % 10n === 0n,
      n = chapter <= 3n ? 3 : chapter <= 14n ? 4 : chapter <= 39n ? 5 : 6;
    const random = rng(hash(`${seed}/${chapter}`)),
      size =
        chapter % 20n === 0n
          ? chapter >= 60n
            ? 8
            : 7
          : boss
            ? Math.min(6, n + 1)
            : n;
    const root = Math.floor(size / 2) * size + Math.floor((size - 1) / 2),
      solution = Array(size * size).fill(0),
      visited = new Set([root]),
      frontier = [root];
    while (frontier.length) {
      const at =
          random() < (boss ? 0.9 : 0.65)
            ? frontier.length - 1
            : Math.floor(random() * frontier.length),
        i = frontier[at],
        r = Math.floor(i / size),
        c = i % size;
      const choices = dirs
        .map(([dr, dc], d) => ({ r: r + dr, c: c + dc, d }))
        .filter(
          (p) =>
            p.r >= 0 &&
            p.r < size &&
            p.c >= 0 &&
            p.c < size &&
            !visited.has(p.r * size + p.c),
        );
      if (!choices.length) {
        frontier.splice(at, 1);
        continue;
      }
      const p = choices[Math.floor(random() * choices.length)],
        j = p.r * size + p.c;
      solution[i] |= 1 << p.d;
      solution[j] |= 1 << (p.d + 2) % 4;
      visited.add(j);
      frontier.push(j);
    }
    const masks = solution.map((m) => rotate(m, Math.floor(random() * 4)));
    // Karıştırma çözülmüş kalırsa bir uç parçayı döndür.
    if (connected(masks, size, root).count === masks.length) {
      const i = solution.findIndex((m) => (m & (m - 1)) === 0);
      masks[i] = rotate(masks[i]);
    }
    const crystals = solution
      .map((m, i) => ((m & (m - 1)) === 0 && i !== root ? i : -1))
      .filter((i) => i >= 0);
    const par = masks.reduce((sum, m, i) => {
      let turn = 0;
      while (rotate(m, turn) !== solution[i] && turn < 4) turn++;
      return sum + turn;
    }, 0);
    return {
      n: size,
      root,
      solution,
      masks,
      crystals,
      par,
      level: String(chapter),
      boss,
    };
  }
  function difficulty(level) {
    const k = BigInt(level),
      boss = k % 10n === 0n,
      n = k <= 3n ? 3 : k <= 14n ? 4 : k <= 39n ? 5 : 6;
    return {
      n: k % 20n === 0n ? (k >= 60n ? 8 : 7) : boss ? Math.min(6, n + 1) : n,
      boss,
      tier: k < 15n ? 0 : k < 40n ? 1 : k < 100n ? 2 : 3,
    };
  }
  function complexity(b) {
    const net = connected(b.solution, b.n, b.root);
    const branches = b.solution.filter((m) =>
      [7, 11, 13, 14, 15].includes(m),
    ).length;
    return Math.max(...net.depth) * 2 + branches * 3 + b.par;
  }
  function generate(seed, level) {
    const profile = difficulty(level),
      k = BigInt(level),
      within = Number((k - 1n) % 10n),
      samples = profile.boss ? 12 : 2 + Math.floor(within / 3) + profile.tier;
    let best = null;
    for (let a = 0; a < samples; a++) {
      const b = base(hash(`${seed}:v2:${a}`), level);
      if (!best || complexity(b) > complexity(best)) best = b;
    }
    best.fixed = [];
    if (k >= 8n) {
      const count = Math.max(
        1,
        Math.floor(best.n * (profile.boss ? 0.7 : 0.4)),
      );
      const order = best.solution
        .map((_, i) => i)
        .filter((i) => i !== best.root)
        .sort(
          (a, b) =>
            hash(`${seed}:${level}:pin:${a}`) -
            hash(`${seed}:${level}:pin:${b}`),
        );
      best.fixed = order.slice(0, count);
      for (const i of best.fixed) best.masks[i] = best.solution[i];
    }
    if (connected(best.masks, best.n, best.root).count === best.masks.length) {
      const i = best.masks.findIndex(
        (m, i) => !best.fixed.includes(i) && m !== 15,
      );
      best.masks[i] = rotate(best.masks[i]);
    }
    best.par = best.masks.reduce((sum, m, i) => {
      let r = 0;
      while (rotate(m, r) !== best.solution[i] && r < 4) r++;
      return sum + r;
    }, 0);
    best.difficulty = profile.tier;
    return best;
  }
  return { rotate, connected, generate, hash, difficulty, complexity };
})();
if (typeof module !== "undefined" && module.exports) module.exports = Circuit;

"use strict";
// one path of 120 levels, built in six runs of twenty
(function (B) {
  const LEVELS = 20;
  const GEMS = ["ruby", "sapphire", "emerald"];

  const WORLDS = [
    { id: "meadow", teach: "gems", teachAt: 3 },
    { id: "beach", teach: "crates" },
    { id: "canyon", teach: "ice" },
    { id: "peaks", teach: "stone" },
    { id: "volcano", teach: null },
    { id: "aurora", teach: null },
  ];

  const lerp = (a, b, t) => a + (b - a) * t;

  // the first three levels are lessons on a small board
  const LESSONS = [
    {
      size: 5,
      fill: [".....", ".....", ".....", "..###", "#...#"],
      steps: [
        { tray: [null, "i3h", null], hints: [null, { x: 1, y: 4 }, null], tip: "tutorial.row" },
        { tray: [null, "i2h", null], hints: [null, { x: 0, y: 3 }, null], tip: "tutorial.again" },
      ],
      lines: 2,
    },
    {
      size: 5,
      fill: ["#...#", "....#", "....#", "#....", "#...."],
      steps: [
        { tray: [null, "i2v", null], hints: [null, { x: 0, y: 1 }, null], tip: "tutorial.column" },
        { tray: [null, "i2v", null], hints: [null, { x: 4, y: 3 }, null], tip: "tutorial.again" },
      ],
      lines: 2,
    },
    {
      size: 6,
      fill: ["#.....", "#.....", "#.....", "......", "##..##", "##..##"],
      steps: [
        { tray: [null, "o2", null], hints: [null, { x: 2, y: 4 }, null], tip: "tutorial.double" },
        { tray: [null, "i3v", null], hints: [null, { x: 0, y: 3 }, null], tip: "tutorial.combo" },
      ],
      lines: 3,
    },
  ];

  function lesson(i, base) {
    const L = LESSONS[i];
    const cells = L.fill.flatMap((row, y) => [...row].map((ch, x) => (ch === "#" ? { kind: "block", color: B.Pieces.COLORS[(x * 3 + y * 5 + i) % 8] } : null)));
    return {
      mode: "story",
      world: 0,
      level: i,
      seed: base,
      size: L.size,
      cells,
      goals: [{ type: "lines", need: L.lines }],
      moves: null,
      lesson: true,
      script: L.steps,
      gemRate: 0,
      gemTypes: [],
      hardness: () => 0,
      guarantee: () => 1,
      rescues: 1,
    };
  }

  // special blocks turn up once the player has met them on level 7
  const PERKS_FROM = 6;

  // levels 8, 18, 28… are just for fun
  const isFun = (n) => n >= 7 && n % 10 === 7;

  function funLevel(world, level, base) {
    const rng = new B.Random(`${base}#fun`);
    const grid = new B.Grid();
    const colors = B.Pieces.COLORS;
    const filled = [];
    for (let y = 4; y < B.SIZE; y++) {
      const gap = rng.int(0, B.SIZE - 1);
      for (let x = 0; x < B.SIZE; x++) {
        if (x === gap) continue;
        grid.set(x, y, { kind: "block", color: rng.pick(colors) });
        filled.push([x, y]);
      }
    }
    rng.shuffle(filled);
    for (let i = 0; i < 6; i++) grid.at(...filled[i]).perk = rng.pick(B.Scoring.PERKS);
    const draft = {
      mode: "story",
      world,
      level,
      seed: base,
      cells: grid.cells,
      goals: [],
      moves: 25,
      fun: true,
      gemRate: 0,
      gemTypes: [],
      hardness: () => 0.12,
      guarantee: () => 1,
      rescues: 1,
      perkRate: 0.35,
    };
    // the target sits well under what a steady player scores in the moves
    const scores = [0, 1, 2].map((i) => B.Bot.play({ ...draft, seed: `${base}/bot${i}` }, 25).score).sort((a, b) => a - b);
    const need = Math.max(600, Math.round((scores[0] * 0.55) / 50) * 50);
    return { ...draft, goals: [{ type: "score", need }] };
  }

  // what an island puts on the board and asks for, at a point t (0..1) along it
  function recipe(world, level, rng) {
    const t = level / (LEVELS - 1);
    // every fifth level is a little harder, the next one a breather
    const wave = level % 5 === 4 ? 0.12 : level % 5 === 0 && level ? -0.08 : 0;
    const k = Math.max(0, Math.min(1, t + wave));
    const r = { blocks: 0, gemBlocks: 0, crates: 0, ice: 0, stone: 0, gemGoals: 0, extraGems: 0, score: 0 };
    switch (world) {
      case 0:
        if (level < 3) r.score = [300, 500, 700][level];
        else {
          r.blocks = lerp(0.04, 0.16, k);
          r.gemBlocks = lerp(0.3, 0.5, k);
          r.gemGoals = level < 10 ? 1 : 2;
          r.extraGems = Math.round(lerp(2, 6, k));
        }
        break;
      case 1:
        r.crates = lerp(0.07, 0.19, k);
        if (level % 3 === 2) Object.assign(r, { gemGoals: 1, extraGems: 3, blocks: 0.05, gemBlocks: 0.5 });
        break;
      case 2:
        r.ice = lerp(0.07, 0.16, k);
        if (level >= 8 && level % 2) r.crates = 0.06;
        break;
      case 3:
        r.stone = lerp(0.06, 0.13, k);
        if (level % 2) r.crates = lerp(0.07, 0.14, k);
        else Object.assign(r, { gemGoals: 1 + (level > 10 ? 1 : 0), extraGems: Math.round(lerp(3, 6, k)), blocks: 0.06, gemBlocks: 0.5 });
        break;
      case 4:
        r.stone = lerp(0.03, 0.08, k);
        r.crates = lerp(0.05, 0.09, k);
        r.ice = lerp(0.04, 0.09, k);
        if (level % 3 === 0) Object.assign(r, { gemGoals: 1, extraGems: 4, blocks: 0.05, gemBlocks: 0.5 });
        break;
      default:
        r.stone = lerp(0.05, 0.11, k);
        r.crates = lerp(0.05, 0.11, k);
        r.ice = lerp(0.05, 0.11, k);
        if (level % 2) Object.assign(r, { gemGoals: 1 + (level > 8 ? 1 : 0), extraGems: Math.round(lerp(3, 6, k)), blocks: 0.05, gemBlocks: 0.6 });
    }
    return r;
  }

  // a mirrored layout: fills the left half, copies it to the right
  function layout(rng, r) {
    const grid = new B.Grid();
    const half = B.SIZE / 2;
    const kinds = [];
    const add = (kind, share) => {
      const n = Math.round(share * B.SIZE * half);
      for (let i = 0; i < n; i++) kinds.push(kind);
    };
    add("stone", r.stone);
    add("crate", r.crates);
    add("ice", r.ice);
    add("block", r.blocks);
    const spots = [];
    for (let y = 0; y < B.SIZE; y++) for (let x = 0; x < half; x++) spots.push([x, y]);
    rng.shuffle(spots);
    const colors = B.Pieces.COLORS;
    kinds.forEach((kind, i) => {
      const [x, y] = spots[i];
      let cell;
      if (kind === "block") {
        cell = { kind, color: rng.pick(colors) };
        if (rng.next() < r.gemBlocks) cell.gem = GEMS[i % Math.max(1, r.gemGoals)];
      } else if (kind === "ice") cell = { kind, hp: 2 };
      else cell = { kind };
      grid.set(x, y, cell);
      grid.set(B.SIZE - 1 - x, y, cell.gem || kind === "block" ? { ...cell, color: rng.pick(colors) } : { ...cell });
    });
    // nothing starts as a finished line
    let lines = grid.fullLines();
    while (lines.count) {
      const y = lines.rows[0] ?? rng.int(0, B.SIZE - 1);
      const x = lines.cols[0] ?? rng.int(0, half - 1);
      grid.set(x, y, null);
      grid.set(B.SIZE - 1 - x, y, null);
      lines = grid.fullLines();
    }
    return grid;
  }

  function goalsFor(grid, r) {
    const goals = [];
    if (r.score) goals.push({ type: "score", need: r.score });
    const placed = grid.gems();
    for (let i = 0; i < r.gemGoals; i++) goals.push({ type: "gems", gem: GEMS[i], need: (placed[GEMS[i]] || 0) + Math.max(1, Math.round(r.extraGems / r.gemGoals)) });
    if (grid.count("crate")) goals.push({ type: "crates", need: grid.count("crate") });
    if (grid.count("ice")) goals.push({ type: "ice", need: grid.count("ice") });
    return goals;
  }

  const cache = new Map();

  function build(world, level) {
    const key = `${world}/${level}`;
    if (cache.has(key)) return cache.get(key);
    const base = `${B.SEED}/${WORLDS[world].id}/${level}`;
    if (world === 0 && level < LESSONS.length) {
      const made = lesson(level, base);
      cache.set(key, made);
      return made;
    }
    const n = world * LEVELS + level;
    if (isFun(n)) {
      const made = funLevel(world, level, base);
      cache.set(key, made);
      return made;
    }
    const t = level / (LEVELS - 1);
    let made = null;
    for (let attempt = 0; attempt < 10 && !made; attempt++) {
      const rng = new B.Random(`${base}#${attempt}`);
      const r = recipe(world, level, rng);
      if (attempt > 2) for (const k of ["stone", "crates", "ice", "blocks"]) r[k] *= 1 - attempt * 0.07;
      const grid = layout(rng, r);
      const goals = goalsFor(grid, r);
      if (!goals.length) continue;
      const draft = {
        mode: "story",
        world,
        level,
        seed: base,
        cells: grid.cells,
        goals,
        moves: null,
        gemRate: r.gemGoals ? lerp(0.35, 0.28, t) : 0,
        gemTypes: GEMS.slice(0, r.gemGoals),
        hardness: () => lerp(0.1, 0.38, t) + world * 0.03,
        guarantee: () => 1,
        rescues: 1,
        perkRate: n >= PERKS_FROM ? 0.1 : 0,
      };
      // five steady runs with different trays
      const runs = [0, 1, 2, 3, 4].map((i) => B.Bot.play({ ...draft, seed: `${base}/bot${i}` }, 90));
      const wins = runs.filter((s) => s.won).map((s) => s.moves).sort((a, b) => a - b);
      if (wins.length < 4 || wins[wins.length - 2] > 60) continue;
      const need = wins[wins.length - 2];
      const slack = lerp(1.7, 1.45, t);
      made = { ...draft, moves: Math.max(8, Math.ceil(need * slack) + 3) };
    }
    if (!made) {
      // a plain fallback that is always winnable
      made = { mode: "story", world, level, seed: base, cells: null, goals: [{ type: "score", need: 600 + level * 60 }], moves: 30, gemRate: 0, gemTypes: [], hardness: () => 0.3, guarantee: () => 1 };
    }
    cache.set(key, made);
    return made;
  }

  // stars from the moves still left at the end
  function stars(level, movesLeft) {
    if (!level.moves) return 3;
    const share = movesLeft / level.moves;
    return share >= 0.3 ? 3 : share >= 0.12 ? 2 : 1;
  }

  function endless(seed) {
    return {
      mode: "endless",
      seed,
      cells: null,
      goals: [],
      moves: null,
      hardness: (score) => Math.min(0.9, 0.12 + score / 9000),
      guarantee: (score) => Math.max(0.55, 1 - score / 12000),
      perkRate: 0.13,
    };
  }

  function daily(day) {
    const rng = new B.Random(`${B.SEED}/daily/${day}`);
    const world = rng.int(1, 5);
    const level = rng.int(10, 18);
    const base = build(world, level);
    return { ...base, mode: "daily", day, world, seed: `${base.seed}/daily/${day}` };
  }

  const TOTAL = WORLDS.length * LEVELS;
  const locate = (n) => ({ world: Math.floor(n / LEVELS), level: n % LEVELS });

  // level n (0-based) on the path
  function story(n) {
    const { world, level } = locate(n);
    return { ...build(world, level), n };
  }

  // the new thing level n introduces, if any
  function teaches(n) {
    if (n === PERKS_FROM) return "perks";
    const { world, level } = locate(n);
    const w = WORLDS[world];
    return w.teach && level === (w.teachAt || 0) ? w.teach : null;
  }

  // every fifth level is a harder one
  const hard = (n) => n % 5 === 4;

  const isLesson = (n) => n < LESSONS.length;
  const LESSON_COUNT = LESSONS.length;

  B.Levels = { LEVELS, WORLDS, GEMS, TOTAL, LESSON_COUNT, build, story, locate, teaches, hard, isFun, isLesson, stars, endless, daily, recipe };
})(window.Blockhaven);

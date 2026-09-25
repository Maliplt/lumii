"use strict";
// colours for the boxes and the cats
(function (V) {
  const INK = "#2b2140";

  // [wall, floor inside, shadow]
  const BOXES = {
    kraft: ["#f2bf7c", "#d99a56", "#b8773a"],
    pink: ["#ffb3d4", "#f07fb0", "#d25b92"],
    mint: ["#9ff0cf", "#5fd1a6", "#3aae84"],
    sky: ["#a9d8ff", "#6db6f5", "#4893d6"],
    lemon: ["#ffe58a", "#f6c847", "#d9a624"],
    lilac: ["#d3c2ff", "#a88cf5", "#8666dc"],
  };
  const WRONG = ["#ff9d9d", "#f06464", "#cc4242"];

  // fur, stripes/patches, belly, inner ear
  const CATS = [
    { fur: "#ffa24c", mark: "#e07722", light: "#ffe0bd", ear: "#ffb3c1", pattern: "stripes" },
    { fur: "#aeb8cc", mark: "#7f8aa3", light: "#eef1f7", ear: "#ffb3c1", pattern: "stripes" },
    { fur: "#3d3552", mark: "#2b2140", light: "#6b6388", ear: "#ff9fb3", pattern: "plain" },
    { fur: "#ffffff", mark: "#ffa24c", light: "#ffffff", ear: "#ffb3c1", pattern: "patch" },
    { fur: "#fff1dc", mark: "#6b4a3a", light: "#fffaf2", ear: "#c98f7a", pattern: "mask" },
    { fur: "#ffffff", mark: "#3d3552", light: "#ffffff", ear: "#ffb3c1", pattern: "calico" },
  ];

  const WEIGHTS = { kraft: 5, pink: 1.4, mint: 1.4, sky: 1.4, lemon: 1.4, lilac: 1.2 };

  // a box colour and a cat look for every clue
  function colorize(puzzle) {
    const names = Object.keys(WEIGHTS);
    const rects = puzzle.solution;
    const owner = new Int16Array(puzzle.w * puzzle.h);
    rects.forEach((rect, i) => V.Rules.cellsOf(rect, puzzle.w).forEach((c) => (owner[c] = i)));
    const touching = rects.map(() => new Set());
    const link = (a, b) => {
      if (a === b) return;
      touching[a].add(b);
      touching[b].add(a);
    };
    for (let y = 0; y < puzzle.h; y++) {
      for (let x = 0; x < puzzle.w; x++) {
        const a = owner[y * puzzle.w + x];
        if (x + 1 < puzzle.w) link(a, owner[y * puzzle.w + x + 1]);
        if (y + 1 < puzzle.h) link(a, owner[(y + 1) * puzzle.w + x]);
      }
    }
    const rng = new V.Random(`${puzzle.seed}/colors`);
    const boxes = new Array(rects.length);
    rects.forEach((rect, i) => {
      const near = [...touching[i]].map((j) => boxes[j]).filter(Boolean);
      const pool = names.filter((name) => !near.includes(name));
      const list = pool.length ? pool : names;
      let roll = rng.next() * list.reduce((sum, name) => sum + WEIGHTS[name], 0);
      boxes[i] = list.find((name) => (roll -= WEIGHTS[name]) <= 0) || list[0];
    });
    const result = new Array(puzzle.clues.length);
    rects.forEach((rect, i) => (result[rect.clue] = { box: boxes[i], cat: rng.int(0, CATS.length - 1) }));
    return result;
  }

  V.Palette = { INK, BOXES, WRONG, CATS, colorize };
})(window.Purrfit);

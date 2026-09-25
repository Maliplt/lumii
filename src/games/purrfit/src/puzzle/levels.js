"use strict";
// six areas of twenty levels each
(function (V) {
  const LEVELS = 20;

  // boards growing from `first` to `last` over the area
  function ramp([w0, h0], [w1, h1]) {
    return Array.from({ length: LEVELS }, (_, i) => {
      const t = i / (LEVELS - 1);
      const w = Math.round(w0 + (w1 - w0) * t);
      const h = Math.max(w, Math.min(h1, Math.round(h0 + (h1 - h0) * t) + (i % 5 === 4 ? 1 : 0)));
      return [w, h];
    });
  }

  const CHAPTERS = [
    {
      id: "dawn",
      sizes: ramp([4, 4], [7, 8]),
      mean: 4, spread: 2, maxArea: 8, mix: {}, par: 1.7, hard: [0, 2],
    },
    {
      id: "rose",
      sizes: ramp([6, 6], [8, 9]),
      mean: 5, spread: 2.5, maxArea: 10, mix: {}, par: 1.9, hard: [1, 6],
    },
    {
      id: "emerald",
      sizes: ramp([6, 6], [9, 10]),
      mean: 6, spread: 2.5, maxArea: 12, squares: 3, mix: { square: 0.8 }, par: 2.0, hard: [2, 8], introduces: "square",
    },
    {
      id: "sapphire",
      sizes: ramp([7, 7], [9, 11]),
      mean: 6, spread: 3, maxArea: 12, mix: { square: 0.3, shape: 0.4 }, par: 2.2, hard: [3, 11], introduces: "shape",
    },
    {
      id: "amethyst",
      sizes: ramp([7, 7], [10, 11]),
      mean: 5.5, spread: 3, maxArea: 12, mix: { square: 0.2, shape: 0.25, any: 0.3 }, par: 2.4, hard: [4, 14], introduces: "any",
    },
    {
      id: "gold",
      sizes: ramp([8, 8], [10, 12]),
      mean: 6, spread: 3.5, maxArea: 14, mix: { square: 0.25, shape: 0.35, any: 0.25 }, par: 2.6, hard: [6, 18],
    },
  ];

  function spec(chapter, [w, h], extra = {}) {
    return { w, h, mean: chapter.mean, spread: chapter.spread, maxArea: chapter.maxArea, maxSide: 7, squares: chapter.squares || 0.4, mix: chapter.mix, ...extra };
  }

  // seconds for the third star
  function parFor(puzzle, factor) {
    return Math.round((puzzle.w * puzzle.h * factor + 15) / 5) * 5;
  }

  const cache = new Map();

  function story(chapterIndex, levelIndex) {
    const key = `${chapterIndex}/${levelIndex}`;
    if (!cache.has(key)) {
      const chapter = CHAPTERS[chapterIndex];
      const wave = levelIndex % 5 === 4 ? 2 : levelIndex % 5 === 0 && levelIndex > 0 ? -1 : 0;
      const target = Math.max(chapter.hard[0], Math.round(chapter.hard[0] + ((chapter.hard[1] - chapter.hard[0]) * levelIndex) / (LEVELS - 1)) + wave);
      const puzzle = V.Generator.generate(`${V.SEED}/${chapter.id}/${levelIndex}`, spec(chapter, chapter.sizes[levelIndex], { target }));
      cache.set(key, { ...puzzle, mode: "story", chapter: chapterIndex, level: levelIndex, par: parFor(puzzle, chapter.par) });
    }
    return cache.get(key);
  }

  // the same window for everyone on a given day; bigger at the weekend
  function daily(day) {
    const weekend = [0, 6].includes(new Date(`${day}T12:00:00`).getDay());
    const chapter = CHAPTERS[5];
    const puzzle = V.Generator.generate(`${V.SEED}/daily/${day}`, spec(chapter, weekend ? [9, 11] : [8, 9], { mix: { square: 0.2, shape: 0.25, any: 0.15 }, target: weekend ? 14 : 9 }));
    return { ...puzzle, mode: "daily", day, par: parFor(puzzle, 2.3) };
  }

  const FREE_SIZES = { small: [6, 7], medium: [8, 9], large: [10, 12] };

  // free play: a fresh window of a chosen size with every clue the player has met
  function free(size, seed, reached) {
    const chapter = CHAPTERS[Math.min(reached, CHAPTERS.length - 1)];
    const puzzle = V.Generator.generate(`${V.SEED}/free/${seed}`, spec(chapter, FREE_SIZES[size], { maxArea: size === "small" ? 9 : chapter.maxArea, target: { small: 2, medium: 7, large: 12 }[size] }));
    return { ...puzzle, mode: "free", size, par: parFor(puzzle, chapter.par) };
  }

  V.Levels = { LEVELS, CHAPTERS, FREE_SIZES, story, daily, free };
})(window.Purrfit);

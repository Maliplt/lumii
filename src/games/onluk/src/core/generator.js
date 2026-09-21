"use strict";
/** Build puzzles backwards. Each added bent chain can be removed to restore
 * the previous board exactly, so generation carries a constructive solution. */
const TenGenerator = (() => {
  function build(state, random) {
    const { columns, rows, rules, level } = state;
    const target = columns * rows;
    const min = level < 3 ? 2 : Math.max(3, rules.min);
    const maxValue = level < 3 ? 7 : 4;
    const failed = new Set();
    function paths(heights, remaining) {
      const results = [];
      function walk(path, next) {
        const length = path.length;
        if (
          length >= min &&
          (remaining === length || remaining - length >= min)
        ) {
          const occupied = next.filter(Boolean).length;
          if (next.slice(0, occupied).every(Boolean)) {
            const bent =
              new Set(path.map((id) => id % 5)).size > 1 &&
              new Set(path.map((id) => Math.floor(id / 5))).size > 1;
            results.push({
              path: [...path],
              heights: [...next],
              priority:
                random(state) + (bent ? 2 : 0) + (length >= 3 ? 0.5 : 0),
            });
          }
        }
        if (length >= Math.min(5, remaining)) return;
        const previous = path.at(-1);
        for (let c = 0; c < columns; c++) {
          if (next[c] >= rows) continue;
          const id = (5 - next[c]) * 5 + c;
          if (
            previous !== undefined &&
            Math.abs(Math.floor(id / 5) - Math.floor(previous / 5)) +
              Math.abs(c - (previous % 5)) !==
              1
          )
            continue;
          next[c]++;
          path.push(id);
          walk(path, next);
          path.pop();
          next[c]--;
        }
      }
      walk([], [...heights]);
      return results.sort((a, b) => b.priority - a.priority);
    }
    function plan(heights, count) {
      if (count === target) return [];
      const key = heights.join(",");
      if (failed.has(key)) return null;
      for (const option of paths(heights, target - count)) {
        const tail = plan(option.heights, count + option.path.length);
        if (tail) return [option.path, ...tail];
      }
      failed.add(key);
      return null;
    }
    const groups = plan(Array(columns).fill(0), 0);
    if (!groups)
      throw new Error("No constructive puzzle for this configuration");
    const board = Array(30).fill(0);
    for (const path of groups) {
      let total = 10;
      path.forEach((id, index) => {
        const left = path.length - index - 1;
        const low = Math.max(1, total - left * maxValue),
          high = Math.min(maxValue, total - left);
        const value = low + Math.floor(random(state) * (high - low + 1));
        board[id] = value;
        total -= value;
      });
    }
    const mirror = (id) => (5 - Math.floor(id / 5)) * 5 + (id % 5);
    const upward = rules.gravity === "up";
    return {
      board: upward ? board.map((_, id) => board[mirror(id)]) : board,
      solution: groups
        .reverse()
        .map((group) => group.map((id) => (upward ? mirror(id) : id))),
    };
  }
  return { build };
})();

"use strict";
// Bir hamle saf veri döndürür; animasyon oyunun hesabına karışmaz.
const Game2048 = (() => {
  function move(board, direction) {
    const next = Array(16).fill(0),
      motions = [],
      merges = [];
    let score = 0;
    for (let line = 0; line < 4; line++) {
      const indices = Array.from({ length: 4 }, (_, k) =>
        direction === "left"
          ? line * 4 + k
          : direction === "right"
            ? line * 4 + 3 - k
            : direction === "up"
              ? k * 4 + line
              : (3 - k) * 4 + line,
      );
      const values = indices
        .filter((i) => board[i])
        .map((i) => ({ from: i, value: board[i] }));
      let target = 0;
      for (let i = 0; i < values.length; i++) {
        const a = values[i],
          b = values[i + 1],
          to = indices[target++];
        if (b && a.value === b.value) {
          next[to] = a.value * 2;
          score += next[to];
          merges.push(to);
          motions.push({ from: a.from, to }, { from: b.from, to });
          i++;
        } else {
          next[to] = a.value;
          motions.push({ from: a.from, to });
        }
      }
    }
    return {
      board: next,
      motions,
      merges,
      score,
      changed: next.some((v, i) => v !== board[i]),
    };
  }
  function spawn(board, random = Math.random) {
    const free = board.map((v, i) => (v === 0 ? i : -1)).filter((i) => i >= 0);
    if (!free.length) return -1;
    const index =
      free[Math.min(free.length - 1, Math.floor(random() * free.length))];
    board[index] = random() < 0.9 ? 2 : 4;
    return index;
  }
  function over(board) {
    return ["left", "right", "up", "down"].every(
      (d) => !move(board, d).changed,
    );
  }
  function valid(board) {
    return (
      Array.isArray(board) &&
      board.length === 16 &&
      board.every(
        (v) =>
          Number.isSafeInteger(v) &&
          v >= 0 &&
          (v === 0 || (v >= 2 && Number.isInteger(Math.log2(v)))),
      )
    );
  }
  return { move, spawn, over, valid };
})();
if (typeof module !== "undefined") module.exports = Game2048;

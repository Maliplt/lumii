"use strict";
/** Selection reducer shared by drag, tap, keyboard and regression tests. */
const TenSelection = {
  extend(chain, id, board, minimum = 2) {
    if (!Number.isInteger(id) || !board[id]) return chain;
    if (chain.at(-1) === id) return chain;
    const visited = chain.indexOf(id);
    if (visited >= 0) return chain.slice(0, visited + 1);
    const last = chain.at(-1);
    if (last !== undefined && !TenEngine.neighbors(last).includes(id))
      return chain;
    const total = chain.reduce((sum, cell) => sum + board[cell], 0) + board[id];
    if (total > 10 || (total === 10 && chain.length + 1 < minimum))
      return chain;
    return [...chain, id];
  },
};

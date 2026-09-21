"use strict";
// Isolated attract mode. Never reads or writes player saves, score or RNG.
function createFusionDemo(host) {
  let state,
    stages = [],
    elapsed = 0,
    seed = 70;
  const small = matchMedia("(max-width: 700px), (max-height: 500px)");
  const reduced = matchMedia("(prefers-reduced-motion: reduce)");
  function paint(board, highlight = []) {
    const fragment = document.createDocumentFragment();
    FusionEngine.geometry(state).cells.forEach((cell, id) => {
      const slot = document.createElement("span");
      slot.className =
        "hero-cell" + (highlight.includes(id) ? " demo-merge" : "");
      slot.style.setProperty("--x", cell.x + "%");
      slot.style.setProperty("--y", cell.y + "%");
      if (board[id]) {
        const tile = document.createElement("span");
        tile.className = "core";
        tile.dataset.value = ((board[id] - 1) % 6) + 1;
        tile.textContent = FusionEngine.number(board[id]);
        slot.append(tile);
      }
      fragment.append(slot);
    });
    host.replaceChildren(fragment);
  }
  function reset() {
    state = FusionEngine.tutorial();
    state.rng = seed++;
    stages = [];
    paint(state.board);
  }
  function turn() {
    if (stages.length) {
      const frame = stages.shift();
      paint(frame.board, frame.highlight);
      return;
    }
    if (!state.board.includes(0) || state.moves >= 16) {
      reset();
      return;
    }
    let best = -1,
      priority = -Infinity;
    state.board.forEach((value, id) => {
      if (value) return;
      const forecast = FusionEngine.preview(state, id, 0);
      const pairs = FusionEngine.geometry(state).neighbors[id].filter(
        (n) => state.board[n] === state.hand[0],
      ).length;
      const merit = forecast.score + pairs * 8 - Math.abs(id - 9) * 0.1;
      if (merit > priority) {
        priority = merit;
        best = id;
      }
    });
    const result = FusionEngine.place(state, best, 0);
    paint(result.placed, [best]);
    result.frames.forEach((frame) => {
      stages.push({ board: frame.before, highlight: frame.ids });
      stages.push({ board: frame.after, highlight: [frame.origin] });
    });
  }
  reset();
  return {
    tick(dt, enabled) {
      if (!enabled || small.matches || reduced.matches) return;
      elapsed += dt;
      if (elapsed >= (stages.length ? 500 : 1100)) {
        elapsed = 0;
        turn();
      }
    },
  };
}

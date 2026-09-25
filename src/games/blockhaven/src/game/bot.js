"use strict";
// a steady player used to size move budgets
(function (B) {
  function evaluate(session, slot, x, y) {
    const piece = session.tray[slot];
    const grid = session.grid.clone();
    grid.place(piece.shape, x, y, piece.color, piece.gems);
    const lines = grid.fullLines();
    let value = 0;
    if (lines.count) {
      const result = grid.clear(lines);
      value += lines.count * 120;
      for (const [gem, n] of Object.entries(result.gems)) if (session.goalFor("gems", gem)) value += n * 90;
      if (session.goalFor("crates")) value += result.crates * 90;
      if (session.goalFor("ice")) value += (result.ice + result.cracked.length * 0.6) * 90;
    }
    // hug walls and other blocks; avoid walled-in holes
    let contact = 0;
    for (const [cx, cy] of piece.shape.cells) {
      for (const [dx, dy] of [
        [1, 0],
        [-1, 0],
        [0, 1],
        [0, -1],
      ]) {
        const nx = x + cx + dx;
        const ny = y + cy + dy;
        if (nx < 0 || ny < 0 || nx >= grid.size || ny >= grid.size || grid.at(nx, ny)) contact++;
      }
    }
    // lines that are nearly full count for something, more
    const wanted = (cell) => cell && ((cell.kind === "crate" && session.goalFor("crates")) || (cell.kind === "ice" && session.goalFor("ice")) || (cell.gem && session.goalFor("gems", cell.gem)));
    let lean = 0;
    for (let i = 0; i < grid.size; i++) {
      let rowFill = 0;
      let colFill = 0;
      let rowGoal = 0;
      let colGoal = 0;
      for (let j = 0; j < grid.size; j++) {
        const r = grid.at(j, i);
        const c = grid.at(i, j);
        if (r) rowFill++;
        if (c) colFill++;
        if (wanted(r)) rowGoal++;
        if (wanted(c)) colGoal++;
      }
      lean += (rowFill / grid.size) ** 3 * (1 + rowGoal) * 14 + (colFill / grid.size) ** 3 * (1 + colGoal) * 14;
    }
    return value + lean + contact * 3 - grid.holes() * 30 + piece.shape.size * 2;
  }

  function choose(session) {
    let best = null;
    session.tray.forEach((piece, slot) => {
      if (!piece) return;
      for (const [x, y] of session.grid.spots(piece.shape)) {
        const value = evaluate(session, slot, x, y);
        if (!best || value > best.value) best = { slot, x, y, value };
      }
    });
    return best;
  }

  // plays until the game ends or `limit` moves pass; returns the session
  function play(level, limit = 400) {
    const session = new B.Session(level);
    while (!session.over && session.moves < limit) {
      const move = choose(session);
      if (!move) break;
      session.place(move.slot, move.x, move.y);
    }
    return session;
  }

  B.Bot = { choose, play, evaluate };
})(window.Blockhaven);

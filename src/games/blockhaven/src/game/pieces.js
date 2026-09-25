"use strict";
// every piece that can land in the tray
(function (B) {
  const COLORS = ["coral", "tangerine", "sun", "lime", "sky", "ocean", "grape", "bubble"];

  const grid = (rows) =>
    rows.flatMap((row, y) =>
      [...row].map((c, x) => (c === "#" ? [x, y] : null)).filter(Boolean),
    );

  // [id, rows, colour, weight when easy, weight when hard]
  const TABLE = [
    ["dot", ["#"], "bubble", 3, 1],
    ["i2h", ["##"], "bubble", 5, 2],
    ["i2v", ["#", "#"], "bubble", 5, 2],
    ["i3h", ["###"], "sky", 5, 3],
    ["i3v", ["#", "#", "#"], "sky", 5, 3],
    ["i4h", ["####"], "sky", 3, 4],
    ["i4v", ["#", "#", "#", "#"], "sky", 3, 4],
    ["i5h", ["#####"], "ocean", 1, 3],
    ["i5v", ["#", "#", "#", "#", "#"], "ocean", 1, 3],
    ["o2", ["##", "##"], "sun", 6, 4],
    ["o3", ["###", "###", "###"], "sun", 0.5, 2.5],
    ["r23", ["##", "##", "##"], "tangerine", 1.5, 3],
    ["r32", ["###", "###"], "tangerine", 1.5, 3],
    ["c3a", ["#.", "##"], "lime", 4, 2],
    ["c3b", [".#", "##"], "lime", 4, 2],
    ["c3c", ["##", "#."], "lime", 4, 2],
    ["c3d", ["##", ".#"], "lime", 4, 2],
    ["t4a", ["###", ".#."], "grape", 2, 3],
    ["t4b", [".#.", "###"], "grape", 2, 3],
    ["t4c", ["#.", "##", "#."], "grape", 2, 3],
    ["t4d", [".#", "##", ".#"], "grape", 2, 3],
    ["l4a", ["#.", "#.", "##"], "ocean", 2, 3],
    ["l4b", ["###", "#.."], "ocean", 2, 3],
    ["l4c", ["##", ".#", ".#"], "ocean", 2, 3],
    ["l4d", ["..#", "###"], "ocean", 2, 3],
    ["j4a", [".#", ".#", "##"], "ocean", 2, 3],
    ["j4b", ["#..", "###"], "ocean", 2, 3],
    ["j4c", ["##", "#.", "#."], "ocean", 2, 3],
    ["j4d", ["###", "..#"], "ocean", 2, 3],
    ["s4h", [".##", "##."], "coral", 1.5, 3],
    ["s4v", ["#.", "##", ".#"], "coral", 1.5, 3],
    ["z4h", ["##.", ".##"], "coral", 1.5, 3],
    ["z4v", [".#", "##", "#."], "coral", 1.5, 3],
    ["c5a", ["#..", "#..", "###"], "lime", 0.8, 2.5],
    ["c5b", ["###", "#..", "#.."], "lime", 0.8, 2.5],
    ["c5c", ["###", "..#", "..#"], "lime", 0.8, 2.5],
    ["c5d", ["..#", "..#", "###"], "lime", 0.8, 2.5],
  ];

  const SHAPES = TABLE.map(([id, rows, color, easy, hard]) => {
    const cells = grid(rows);
    return { id, cells, color, easy, hard, w: rows[0].length, h: rows.length, size: cells.length };
  });
  const byId = Object.fromEntries(SHAPES.map((shape) => [shape.id, shape]));

  // picks a shape; `hard` (0..1) shifts the odds toward big ones
  function pick(rng, hard = 0) {
    let total = 0;
    const weights = SHAPES.map((shape) => {
      const w = shape.easy + (shape.hard - shape.easy) * hard;
      total += w;
      return w;
    });
    let roll = rng.next() * total;
    for (let i = 0; i < SHAPES.length; i++) {
      roll -= weights[i];
      if (roll <= 0) return SHAPES[i];
    }
    return SHAPES[SHAPES.length - 1];
  }

  B.Pieces = { COLORS, SHAPES, byId, pick };
})(window.Blockhaven);

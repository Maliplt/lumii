"use strict";
// the pictures hidden in the puzzles
(function (K) {
  const round = (fn, steps) => Array.from({ length: steps }, (_, i) => fn((i / steps) * Math.PI * 2)).map(([x, y]) => [x, y]);

  const heart = round((t) => [50 + 2.6 * 16 * Math.sin(t) ** 3, 46 - 2.6 * (13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t))], 40);
  const star = Array.from({ length: 10 }, (_, i) => {
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    const r = i % 2 ? 19 : 46;
    return [50 + r * Math.cos(a), 54 + r * Math.sin(a)];
  });
  const flower = round((t) => {
    const r = 34 + 12 * Math.cos(5 * t);
    return [50 + r * Math.cos(t), 50 + r * Math.sin(t)];
  }, 60);
  const drop = round((t) => [50 + 38 * Math.sin(t) * Math.abs(Math.sin(t / 2)) ** 1.2, 52 - 44 * Math.cos(t)], 40);
  const leaf = (() => {
    const left = [];
    const right = [];
    for (let i = 0; i <= 16; i++) {
      const t = i / 16;
      const w = 34 * Math.sin(Math.PI * t) ** 0.85;
      const y = 6 + 88 * t;
      const lean = 10 * (t - 0.5);
      left.push([50 - w + lean, y]);
      right.push([50 + w * 0.9 + lean, y]);
    }
    return [...right, ...left.reverse().slice(1, -1)];
  })();

  // order matters: the first pictures are the simplest, for the first lessons
  const MOTIFS = [
    { id: "gem", color: "#b58cff", points: [[30, 14], [70, 14], [92, 38], [50, 92], [8, 38]] },
    { id: "house", color: "#ff8a7a", points: [[50, 8], [90, 44], [80, 44], [80, 92], [20, 92], [20, 44], [10, 44]] },
    { id: "heart", color: "#ff6f91", points: heart },
    { id: "star", color: "#ffc94d", points: star },
    { id: "crown", color: "#ffb347", points: [[10, 82], [10, 28], [30, 52], [50, 16], [70, 52], [90, 28], [90, 82]] },
    { id: "fish", color: "#4fd1c5", points: [[8, 50], [22, 34], [40, 26], [58, 28], [72, 38], [82, 24], [95, 18], [90, 50], [95, 82], [82, 76], [72, 62], [58, 72], [40, 74], [22, 66]] },
    { id: "moon", color: "#8fb8ff", points: [[62, 6], [44, 9], [28, 19], [16, 35], [12, 54], [19, 72], [33, 86], [52, 93], [71, 90], [86, 81], [72, 79], [57, 73], [45, 61], [40, 47], [42, 31], [50, 17]] },
    { id: "leaf", color: "#7ad97a", points: leaf },
    { id: "tree", color: "#3fcf8e", points: [[50, 4], [74, 32], [63, 32], [84, 58], [69, 58], [92, 84], [57, 84], [57, 96], [43, 96], [43, 84], [8, 84], [31, 58], [16, 58], [37, 32], [26, 32]] },
    { id: "cat", color: "#ffa65c", points: [[16, 14], [36, 32], [50, 30], [64, 32], [84, 14], [86, 46], [81, 67], [68, 82], [50, 88], [32, 82], [19, 67], [14, 46]] },
    { id: "boat", color: "#6cb6ff", points: [[50, 6], [84, 56], [55, 56], [55, 64], [94, 64], [80, 86], [22, 86], [8, 64], [50, 64]] },
    { id: "flower", color: "#ff8cc6", points: flower },
    { id: "bell", color: "#ffd35c", points: [[50, 8], [63, 13], [69, 29], [71, 55], [86, 75], [86, 84], [14, 84], [14, 75], [29, 55], [31, 29], [37, 13]] },
    { id: "mushroom", color: "#ff7a6b", points: [[50, 10], [70, 13], [86, 25], [95, 44], [88, 51], [64, 51], [66, 84], [59, 93], [41, 93], [34, 84], [36, 51], [12, 51], [5, 44], [14, 25], [30, 13]] },
    { id: "bird", color: "#6cc4ff", points: [[6, 54], [24, 42], [40, 40], [50, 26], [62, 15], [75, 16], [85, 25], [97, 30], [86, 36], [82, 50], [73, 64], [57, 74], [39, 75], [24, 71], [12, 63]] },
    { id: "drop", color: "#5cc8ff", points: drop },
    { id: "apple", color: "#ff6b6b", points: [[50, 26], [60, 17], [75, 17], [87, 28], [93, 46], [89, 66], [78, 84], [64, 93], [50, 88], [36, 93], [22, 84], [11, 66], [7, 46], [13, 28], [25, 17], [40, 17]] },
    { id: "cloud", color: "#a9d4ff", points: [[14, 72], [6, 58], [13, 44], [28, 40], [34, 25], [50, 18], [66, 25], [73, 36], [87, 38], [95, 53], [90, 67], [77, 73]] },
    { id: "bolt", color: "#ffd84d", points: [[58, 3], [14, 57], [43, 57], [31, 97], [88, 37], [58, 37], [76, 3]] },
    { id: "butterfly", color: "#c18cff", points: [[50, 30], [62, 13], [82, 7], [95, 20], [88, 42], [70, 50], [87, 62], [89, 83], [72, 93], [56, 79], [50, 66], [44, 79], [28, 93], [11, 83], [13, 62], [30, 50], [12, 42], [5, 20], [18, 7], [38, 13]] },
    { id: "cup", color: "#e0a87a", points: [[12, 22], [70, 22], [70, 32], [84, 32], [94, 44], [90, 60], [72, 66], [66, 84], [18, 84]] },
    { id: "rabbit", color: "#d8c4ff", points: [[30, 4], [44, 6], [47, 36], [53, 36], [56, 6], [70, 4], [72, 16], [66, 44], [77, 58], [77, 75], [65, 90], [35, 90], [23, 75], [23, 58], [34, 44], [28, 16]] },
    { id: "shield", color: "#7c9cff", points: [[50, 5], [89, 17], [85, 56], [50, 95], [15, 56], [11, 17]] },
    { id: "whale", color: "#5fa8ff", points: [[6, 56], [12, 38], [28, 28], [50, 26], [70, 32], [82, 44], [88, 30], [97, 20], [96, 40], [90, 56], [80, 70], [60, 78], [34, 78], [16, 70]] },
  ];

  // the outline in board units, centred and fitted onto the page
  function outline(motif, radius = 0.62) {
    const pts = motif.points.map(([x, y]) => ({ x, y }));
    const minX = Math.min(...pts.map((p) => p.x));
    const maxX = Math.max(...pts.map((p) => p.x));
    const minY = Math.min(...pts.map((p) => p.y));
    const maxY = Math.max(...pts.map((p) => p.y));
    const cx = (minX + maxX) / 2;
    const cy = (minY + maxY) / 2;
    const reach = Math.max(...pts.map((p) => Math.hypot(p.x - cx, p.y - cy)));
    return pts.map((p) => ({ x: ((p.x - cx) / reach) * radius, y: ((p.y - cy) / reach) * radius }));
  }

  K.MOTIFS = MOTIFS;
  K.Motifs = { list: MOTIFS, outline, byId: (id) => MOTIFS.find((m) => m.id === id) };
})(window.Knotwise);

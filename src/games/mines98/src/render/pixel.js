"use strict";
// pixel art drawn from little maps of characters
(function (M) {
  const GREY = "#c0c0c0";
  const LIGHT = "#ffffff";
  const SHADE = "#808080";
  const DARK = "#000000";

  const NUMBER_COLORS = ["", "#0000ff", "#008000", "#ff0000", "#000080", "#800000", "#008080", "#000000", "#808080"];

  const DIGITS = {
    1: ["...##..", "..###..", ".####..", "...##..", "...##..", "...##..", "...##..", ".######"],
    2: [".#####.", "##...##", ".....##", "...###.", ".###...", "##.....", "##.....", "#######"],
    3: [".#####.", "##...##", ".....##", "..####.", ".....##", ".....##", "##...##", ".#####."],
    4: ["....##.", "...###.", "..####.", ".##.##.", "##..##.", "#######", "....##.", "....##."],
    5: ["#######", "##.....", "##.....", "######.", ".....##", ".....##", "##...##", ".#####."],
    6: [".#####.", "##...##", "##.....", "######.", "##...##", "##...##", "##...##", ".#####."],
    7: ["#######", ".....##", "....##.", "...##..", "..##...", "..##...", "..##...", "..##..."],
    8: [".#####.", "##...##", "##...##", ".#####.", "##...##", "##...##", "##...##", ".#####."],
  };

  const SPRITES = {
    mine: [
      "......k......",
      "......k......",
      "..k.kkkkk.k..",
      "...kkkkkkk...",
      "..kkwwkkkkk..",
      "..kkwwkkkkk..",
      "kkkkkkkkkkkkk",
      "..kkkkkkkkk..",
      "..kkkkkkkkk..",
      "...kkkkkkk...",
      "..k.kkkkk.k..",
      "......k......",
      "......k......",
    ],
    flag: [
      "....rrr.....",
      "..rrrrr.....",
      "rrrrrrr.....",
      "..rrrrr.....",
      "....rrr.....",
      "......k.....",
      "......k.....",
      "......k.....",
      "....kkkkk...",
      "..kkkkkkkkk.",
    ],
    mark: [
      "..kkkk..",
      ".kk..kk.",
      ".....kk.",
      "....kk..",
      "...kk...",
      "...kk...",
      "........",
      "...kk...",
    ],
    cross: [
      "rr.......rr",
      ".rr.....rr.",
      "..rr...rr..",
      "...rr.rr...",
      "....rrr....",
      "...rr.rr...",
      "..rr...rr..",
      ".rr.....rr.",
      "rr.......rr",
    ],
  };
  const PALETTE = { k: DARK, w: LIGHT, r: "#ff0000", y: "#ffff00", g: SHADE, b: "#000080" };

  // draws a character map with each character a `p`-sized square
  function sprite(ctx, rows, x, y, p, colors = PALETTE) {
    for (let r = 0; r < rows.length; r++) {
      const row = rows[r];
      for (let c = 0; c < row.length; c++) {
        const ch = row[c];
        if (ch === "." || ch === " ") continue;
        ctx.fillStyle = colors[ch] || ch;
        ctx.fillRect(Math.round(x + c * p), Math.round(y + r * p), Math.ceil(p), Math.ceil(p));
      }
    }
  }

  // draws a map centred in a square of size `s`
  function centred(ctx, rows, x, y, s, share = 0.75, colors) {
    const w = rows[0].length;
    const h = rows.length;
    const p = Math.max(1, Math.round((s * share) / Math.max(w, h)));
    sprite(ctx, rows, x + Math.floor((s - w * p) / 2), y + Math.floor((s - h * p) / 2), p, colors);
  }

  // a raised grey box with a two-pixel bevel (thinner on small sizes)
  function raised(ctx, x, y, w, h, t = 2, fill = GREY) {
    ctx.fillStyle = fill;
    ctx.fillRect(x, y, w, h);
    ctx.fillStyle = LIGHT;
    ctx.fillRect(x, y, w - t, t);
    ctx.fillRect(x, y, t, h - t);
    ctx.fillStyle = SHADE;
    ctx.fillRect(x + t, y + h - t, w - t, t);
    ctx.fillRect(x + w - t, y + t, t, h - t);
    for (let k = 1; k < t; k++) {
      ctx.fillRect(x + w - t + k - 1, y + t - k, 1, 1);
      ctx.fillRect(x + t - k, y + h - t + k - 1, 1, 1);
    }
  }

  function number(ctx, n, x, y, s) {
    centred(ctx, DIGITS[n], x, y, s, 0.62, { "#": NUMBER_COLORS[n] });
  }

  // seven segments: a, b, c, d, e, f, g
  const SEGMENTS = { 0: "abcdef", 1: "bc", 2: "abdeg", 3: "abcdg", 4: "bcfg", 5: "acdfg", 6: "acdefg", 7: "abc", 8: "abcdefg", 9: "abcdfg", "-": "g" };

  function segment(ctx, id, x, y, w, h, t) {
    const hh = h / 2;
    const paths = {
      a: [[x + t, y], [x + w - t, y], [x + w - t * 2, y + t], [x + t * 2, y + t]],
      d: [[x + t * 2, y + h - t], [x + w - t * 2, y + h - t], [x + w - t, y + h], [x + t, y + h]],
      g: [[x + t, y + hh], [x + t * 1.8, y + hh - t / 2], [x + w - t * 1.8, y + hh - t / 2], [x + w - t, y + hh], [x + w - t * 1.8, y + hh + t / 2], [x + t * 1.8, y + hh + t / 2]],
      f: [[x, y + t], [x + t, y + t * 2], [x + t, y + hh - t / 2], [x, y + hh - t / 4]],
      e: [[x, y + hh + t / 4], [x + t, y + hh + t / 2], [x + t, y + h - t * 2], [x, y + h - t]],
      b: [[x + w, y + t], [x + w - t, y + t * 2], [x + w - t, y + hh - t / 2], [x + w, y + hh - t / 4]],
      c: [[x + w, y + hh + t / 4], [x + w - t, y + hh + t / 2], [x + w - t, y + h - t * 2], [x + w, y + h - t]],
    };
    const pts = paths[id];
    ctx.beginPath();
    pts.forEach(([px, py], k) => (k ? ctx.lineTo(px, py) : ctx.moveTo(px, py)));
    ctx.closePath();
    ctx.fill();
  }

  // a three-digit red counter on black, with unlit segments showing faintly
  function counter(canvas, value, { height = 26 } = {}) {
    const dpr = Math.min(3, window.devicePixelRatio || 1);
    const dw = Math.round(height * 0.52);
    const gap = Math.round(height * 0.1);
    const pad = Math.round(height * 0.1);
    const width = pad * 2 + dw * 3 + gap * 2;
    if (canvas.width !== width * dpr || canvas.height !== height * dpr) {
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
    }
    const ctx = canvas.getContext("2d");
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = DARK;
    ctx.fillRect(0, 0, width, height);
    const v = Math.max(-99, Math.min(999, Math.round(value)));
    const text = v < 0 ? `-${String(-v).padStart(2, "0")}` : String(v).padStart(3, "0");
    const t = Math.max(2, height * 0.1);
    [...text].forEach((ch, k) => {
      const x = pad + k * (dw + gap);
      const on = SEGMENTS[ch] || "";
      for (const s of "abcdefg") {
        ctx.fillStyle = on.includes(s) ? "#ff1a1a" : "#2a0000";
        segment(ctx, s, x, pad * 0.7, dw, height - pad * 1.4, t);
      }
    });
  }

  // the round face on the button above the board
  function face(ctx, x, y, s, mood) {
    const n = 17;
    const p = s / n;
    const c = (n - 1) / 2;
    for (let r = 0; r < n; r++) {
      for (let q = 0; q < n; q++) {
        const d = Math.hypot(q - c, r - c);
        if (d > 8.2) continue;
        ctx.fillStyle = d > 7.2 ? DARK : "#ffff00";
        ctx.fillRect(Math.round(x + q * p), Math.round(y + r * p), Math.ceil(p), Math.ceil(p));
      }
    }
    const px = (q, r, color = DARK) => {
      ctx.fillStyle = color;
      ctx.fillRect(Math.round(x + q * p), Math.round(y + r * p), Math.ceil(p), Math.ceil(p));
    };
    if (mood === "dead") {
      for (const ex of [5, 11]) {
        px(ex - 1, 5);
        px(ex + 1, 5);
        px(ex, 6);
        px(ex - 1, 7);
        px(ex + 1, 7);
      }
      for (let q = 6; q <= 10; q++) px(q, 12);
      px(5, 13);
      px(11, 13);
    } else if (mood === "cool") {
      for (let q = 3; q <= 13; q++) px(q, 6);
      for (const [a, b] of [
        [3, 7],
        [7, 7],
        [9, 7],
        [13, 7],
      ])
        for (let q = a; q <= b; q++) px(q, 7);
      for (let q = 4; q <= 6; q++) px(q, 8);
      for (let q = 10; q <= 12; q++) px(q, 8);
      px(5, 7, "#4040ff");
      px(11, 7, "#4040ff");
      px(5, 11);
      px(11, 11);
      for (let q = 6; q <= 10; q++) px(q, 12);
    } else {
      px(6, 6);
      px(6, 7);
      px(10, 6);
      px(10, 7);
      if (mood === "wow") {
        for (let q = 7; q <= 9; q++) {
          px(q, 10);
          px(q, 14);
        }
        for (let r = 11; r <= 13; r++) {
          px(6, r);
          px(10, r);
        }
      } else {
        px(5, 10);
        px(11, 10);
        px(6, 11);
        px(10, 11);
        for (let q = 7; q <= 9; q++) px(q, 12);
      }
    }
  }

  M.Pixel = { GREY, LIGHT, SHADE, DARK, NUMBER_COLORS, SPRITES, sprite, centred, raised, number, counter, face };
})(window.Mines98);

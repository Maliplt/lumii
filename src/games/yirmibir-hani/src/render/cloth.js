"use strict";
// table cloths for the deck side of the table
(function (YB) {
  const { canvas, context, cached, box } = YB.Pixels;
  const P = () => YB.PALETTE;

  const draw = {
    felt(ctx, set) {
      for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) set(x, y, YB.Pixels.dither(x, y, 0.12) ? "#3c8a43" : "#2f7a3a");
      set(3, 3, "#55a85a");
    },
    indigo(ctx, set) {
      for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) set(x, y, "#2c3f7a");
      for (const [x, y] of [[4, 2], [3, 3], [5, 3], [4, 4], [4, 3]]) set(x, y, y === 3 && x === 4 ? "#fff3da" : "#a8e2ff");
      set(0, 7, "#3d55a0");
    },
    gingham(ctx, set) {
      for (let y = 0; y < 8; y++) {
        for (let x = 0; x < 8; x++) {
          const a = x < 4;
          const b = y < 4;
          set(x, y, a && b ? "#d8323f" : a || b ? "#f2a0a5" : "#fff3da");
        }
      }
    },
    kilim(ctx, set) {
      // a lozenge with an eye in the middle, over a woven red ground
      for (let y = 0; y < 13; y++) {
        for (let x = 0; x < 12; x++) {
          const d = Math.abs(x - 6) + Math.abs(y - 7);
          let color = (x + y) % 4 === 0 ? "#c0303c" : "#a3263a";
          if (y === 0) color = "#ffd84a";
          else if (y === 1) color = "#231726";
          else if (d === 5) color = "#231726";
          else if (d === 4) color = "#ffd84a";
          else if (d === 3) color = "#e8424f";
          else if (d === 2) color = "#2c5fa8";
          else if (d === 1) color = "#fff3da";
          else if (d === 0) color = "#231726";
          set(x, y, color);
        }
      }
    },
    brocade(ctx, set) {
      for (let y = 0; y < 10; y++) for (let x = 0; x < 10; x++) set(x, y, "#c98a1e");
      for (const [x, y] of [[5, 2], [4, 3], [6, 3], [3, 4], [7, 4], [4, 5], [6, 5], [5, 6]]) set(x, y, "#ffd84a");
      set(5, 4, "#fff39e");
      for (const [x, y] of [[0, 0], [9, 9], [0, 9], [9, 0]]) set(x, y, "#8a5a10");
    },
  };

  const SIZE = { felt: [8, 8], indigo: [8, 8], gingham: [8, 8], kilim: [12, 13], brocade: [10, 10] };

  function tile(id) {
    return cached(`cloth|${id}`, () => {
      const [w, h] = SIZE[id];
      const el = canvas(w, h);
      const ctx = context(el);
      draw[id](ctx, (x, y, color) => {
        ctx.fillStyle = color;
        ctx.fillRect(x, y, 1, 1);
      });
      return el;
    });
  }

  const patterns = new WeakMap();

  // fills a rectangle with a cloth, lined up with the table's pixels
  function fill(ctx, id, theme, x, y, w, h) {
    if (!draw[id]) {
      ctx.fillStyle = theme.cloth;
      ctx.fillRect(x, y, w, h);
      return;
    }
    let byId = patterns.get(ctx);
    if (!byId) patterns.set(ctx, (byId = {}));
    if (!byId[id]) byId[id] = ctx.createPattern(tile(id), "repeat");
    ctx.save();
    ctx.translate(x, y);
    ctx.fillStyle = byId[id];
    ctx.fillRect(0, 0, w, h);
    ctx.restore();
  }

  // a folded corner of cloth for the market shelf
  function swatch(id) {
    return cached(`swatch|${id}`, () => {
      const W = 38;
      const H = 30;
      const el = canvas(W, H);
      const ctx = context(el);
      box(ctx, 0, 0, W, H, "#000", { ink: P().k, notch: 2 });
      ctx.save();
      ctx.beginPath();
      ctx.rect(1, 1, W - 2, H - 2);
      ctx.clip();
      fill(ctx, id, YB.THEMES.village, 1, 1, W - 2, H - 2);
      ctx.restore();
      ctx.fillStyle = "rgba(255,255,255,0.35)";
      ctx.fillRect(2, 1, W - 4, 1);
      ctx.fillStyle = "rgba(0,0,0,0.25)";
      ctx.fillRect(2, H - 2, W - 4, 1);
      ctx.fillStyle = "rgba(255,243,218,0.6)";
      for (let x = 4; x < W - 4; x += 3) ctx.fillRect(x, 3, 1, 1);
      for (let x = 4; x < W - 4; x += 3) ctx.fillRect(x, H - 4, 1, 1);
      return el;
    });
  }

  YB.Cloth = { IDS: Object.keys(YB.Shop.CLOTHS), fill, swatch };
})(window.YirmibirHani);

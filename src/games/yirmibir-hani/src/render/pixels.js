"use strict";
(function (YB) {
  const P = () => YB.PALETTE;

  function canvas(width, height) {
    const el = document.createElement("canvas");
    el.width = Math.max(1, Math.ceil(width));
    el.height = Math.max(1, Math.ceil(height));
    return el;
  }

  function context(el) {
    const ctx = el.getContext("2d");
    ctx.imageSmoothingEnabled = false;
    return ctx;
  }

  // turns sprite rows into a canvas, optionally ringed by a 1px outline
  function bake(rows, { colors = {}, outline = null, flip = false } = {}) {
    const height = rows.length;
    const width = Math.max(...rows.map((row) => row.length));
    const pad = outline ? 1 : 0;
    const el = canvas(width + pad * 2, height + pad * 2);
    const ctx = context(el);
    const at = (x, y) => {
      const row = rows[y];
      if (!row) return ".";
      const ch = row[flip ? width - 1 - x : x];
      return ch === undefined ? "." : ch;
    };
    const solid = (x, y) => x >= 0 && y >= 0 && x < width && y < height && at(x, y) !== ".";
    if (outline) {
      ctx.fillStyle = P()[outline] || outline;
      for (let y = -1; y <= height; y++) {
        for (let x = -1; x <= width; x++) {
          if (solid(x, y)) continue;
          if (solid(x - 1, y) || solid(x + 1, y) || solid(x, y - 1) || solid(x, y + 1)) ctx.fillRect(x + pad, y + pad, 1, 1);
        }
      }
    }
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const ch = at(x, y);
        if (ch === ".") continue;
        ctx.fillStyle = colors[ch] || P()[ch] || "#ff00ff";
        ctx.fillRect(x + pad, y + pad, 1, 1);
      }
    }
    return el;
  }

  const cache = new Map();

  function cached(key, make) {
    if (!cache.has(key)) cache.set(key, make());
    return cache.get(key);
  }

  // a rectangle with notched corners, the basic shape of every panel
  function shape(ctx, x, y, w, h, notch) {
    if (notch >= 2) {
      ctx.fillRect(x + 2, y, w - 4, h);
      ctx.fillRect(x + 1, y + 1, w - 2, h - 2);
      ctx.fillRect(x, y + 2, w, h - 4);
    } else if (notch === 1) {
      ctx.fillRect(x + 1, y, w - 2, h);
      ctx.fillRect(x, y + 1, w, h - 2);
    } else {
      ctx.fillRect(x, y, w, h);
    }
  }

  function box(ctx, x, y, w, h, fill, { ink = P().k, light = null, dark = null, notch = 1 } = {}) {
    x = Math.round(x);
    y = Math.round(y);
    w = Math.round(w);
    h = Math.round(h);
    if (ink) {
      ctx.fillStyle = ink;
      shape(ctx, x, y, w, h, notch);
      x += 1;
      y += 1;
      w -= 2;
      h -= 2;
    }
    ctx.fillStyle = fill;
    shape(ctx, x, y, w, h, notch - 1);
    const edge = Math.max(0, notch - 1);
    if (light) {
      ctx.fillStyle = light;
      ctx.fillRect(x + edge, y, w - edge * 2, 1);
    }
    if (dark) {
      ctx.fillStyle = dark;
      ctx.fillRect(x + edge, y + h - 1, w - edge * 2, 1);
    }
  }

  // ordered dither, for pixel-art fades and soft light
  const BAYER = [
    [0, 8, 2, 10],
    [12, 4, 14, 6],
    [3, 11, 1, 9],
    [15, 7, 13, 5],
  ];
  const dither = (x, y, amount) => (BAYER[y & 3][x & 3] + 0.5) / 16 < amount;

  function noise(x, y, seed = 0) {
    let h = (x * 374761393 + y * 668265263 + seed * 2147483647) | 0;
    h = Math.imul(h ^ (h >>> 13), 1274126177);
    return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
  }

  // recolours every opaque pixel of a canvas, keeping its shape
  function tint(source, color) {
    const el = canvas(source.width, source.height);
    const ctx = context(el);
    ctx.drawImage(source, 0, 0);
    ctx.globalCompositeOperation = "source-in";
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, el.width, el.height);
    return el;
  }

  // draws text in the pixel typeface and snaps it to whole pixels
  function text(content, { size = 8, color = "#fff3da", ink = "#231726", shade = null, family = "\"YB Digits\", \"Pixelify Sans\"", weight = 600 } = {}) {
    const key = `text|${content}|${size}|${color}|${ink}|${shade}|${family}|${weight}`;
    return cached(key, () => {
      const probe = context(canvas(1, 1));
      probe.font = `${weight} ${size}px ${family}`;
      const width = Math.ceil(probe.measureText(content).width) + 4;
      const height = Math.ceil(size * 1.4) + 4;
      const raw = canvas(width, height);
      const rctx = context(raw);
      rctx.font = probe.font;
      rctx.textBaseline = "top";
      rctx.fillStyle = "#000";
      rctx.fillText(content, 2, 2 + Math.round(size * 0.12));
      const data = rctx.getImageData(0, 0, width, height);
      let minX = width, maxX = 0, minY = height, maxY = 0;
      const on = new Uint8Array(width * height);
      for (let i = 0; i < on.length; i++) {
        if (data.data[i * 4 + 3] > 110) {
          on[i] = 1;
          const x = i % width, y = (i / width) | 0;
          minX = Math.min(minX, x); maxX = Math.max(maxX, x);
          minY = Math.min(minY, y); maxY = Math.max(maxY, y);
        }
      }
      if (maxX < minX) return canvas(1, 1);
      const pad = ink ? 1 : 0;
      const depth = shade ? 1 : 0;
      const w = maxX - minX + 1 + pad * 2;
      const h = maxY - minY + 1 + pad * 2 + depth;
      const out = canvas(w, h);
      const ctx = context(out);
      const lit = (x, y) => x >= minX && x <= maxX && y >= minY && y <= maxY && on[y * width + x];
      if (ink) {
        ctx.fillStyle = ink;
        for (let y = minY - 1; y <= maxY + 1 + depth; y++) {
          for (let x = minX - 1; x <= maxX + 1; x++) {
            if (lit(x, y) || lit(x - 1, y) || lit(x + 1, y) || lit(x, y - 1) || lit(x, y + 1) || (depth && lit(x, y - 1 - depth))) {
              ctx.fillRect(x - minX + pad, y - minY + pad, 1, 1);
            }
          }
        }
      }
      for (let y = minY; y <= maxY; y++) {
        for (let x = minX; x <= maxX; x++) {
          if (!lit(x, y)) continue;
          if (shade) {
            ctx.fillStyle = shade;
            ctx.fillRect(x - minX + pad, y - minY + pad + depth, 1, 1);
          }
        }
      }
      for (let y = minY; y <= maxY; y++) {
        for (let x = minX; x <= maxX; x++) {
          if (!lit(x, y)) continue;
          ctx.fillStyle = color;
          ctx.fillRect(x - minX + pad, y - minY + pad, 1, 1);
        }
      }
      return out;
    });
  }

  function url(el) {
    return el.toDataURL("image/png");
  }

  YB.Pixels = { canvas, context, bake, cached, box, dither, noise, tint, text, url };
})(window.YirmibirHani);

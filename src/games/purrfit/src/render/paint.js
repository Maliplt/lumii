"use strict";
// cartoon drawing: cats with moods, cardboard boxes, number tags and puffs
(function (V) {
  const FONT = '"Baloo Bhaijaan 2", "Arial Rounded MT Bold", "Segoe UI", sans-serif';
  const INK = V.Palette.INK;

  function rounded(ctx, x, y, w, h, r) {
    r = Math.max(0, Math.min(r, w / 2, h / 2));
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  // a cardboard box seen from above: walls, the floor inside and a flap line
  function box(ctx, b, colors, { cell, pop = 1, line = 3 } = {}) {
    const [wall, floor, shade] = colors;
    let { x, y, w, h } = b;
    if (pop !== 1) {
      x += (w * (1 - pop)) / 2;
      y += (h * (1 - pop)) / 2;
      w *= pop;
      h *= pop;
    }
    const r = cell * 0.2;
    ctx.save();
    // drop shadow
    ctx.fillStyle = "rgba(43,33,64,0.22)";
    rounded(ctx, x + line, y + line * 1.6, w, h, r);
    ctx.fill();
    // walls
    rounded(ctx, x, y, w, h, r);
    ctx.fillStyle = wall;
    ctx.fill();
    ctx.lineWidth = line;
    ctx.strokeStyle = INK;
    ctx.stroke();
    // floor inside
    const inset = Math.min(cell * 0.16, w / 4, h / 4);
    rounded(ctx, x + inset, y + inset, w - inset * 2, h - inset * 2, r * 0.6);
    ctx.fillStyle = floor;
    ctx.fill();
    // the shadow the top wall throws inside
    ctx.save();
    ctx.clip();
    ctx.fillStyle = shade;
    ctx.fillRect(x + inset, y + inset, w - inset * 2, Math.max(2, cell * 0.08));
    ctx.restore();
    ctx.lineWidth = Math.max(1.5, line * 0.6);
    ctx.stroke();
    // corner creases
    ctx.beginPath();
    ctx.moveTo(x + line, y + line);
    ctx.lineTo(x + inset, y + inset);
    ctx.moveTo(x + w - line, y + line);
    ctx.lineTo(x + w - inset, y + inset);
    ctx.moveTo(x + line, y + h - line);
    ctx.lineTo(x + inset, y + h - inset);
    ctx.moveTo(x + w - line, y + h - line);
    ctx.lineTo(x + w - inset, y + h - inset);
    ctx.stroke();
    ctx.restore();
  }

  function ellipse(ctx, x, y, rx, ry, fill, stroke = null, width = 0) {
    ctx.beginPath();
    ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
    if (fill) {
      ctx.fillStyle = fill;
      ctx.fill();
    }
    if (stroke) {
      ctx.lineWidth = width;
      ctx.strokeStyle = stroke;
      ctx.stroke();
    }
  }

  // a cat's head
  function cat(ctx, cx, cy, s, look, mood = "idle", { bob = 0 } = {}) {
    const c = V.Palette.CATS[look % V.Palette.CATS.length];
    const line = Math.max(1.5, s * 0.045);
    cy -= bob;
    const hw = s * 0.34;
    const hh = s * 0.28;
    const hy = cy + s * 0.05;
    ctx.save();
    ctx.lineJoin = "round";
    ctx.lineCap = "round";

    // ears: flat and back when angry
    const earUp = mood === "angry" ? 0.55 : 1;
    for (const side of [-1, 1]) {
      const bx = cx + side * hw * 0.62;
      ctx.beginPath();
      ctx.moveTo(bx - side * hw * 0.42, hy - hh * 0.55);
      ctx.quadraticCurveTo(bx + side * hw * 0.2, hy - hh * (0.9 + 0.75 * earUp), bx + side * hw * 0.42, hy - hh * (0.5 + 0.9 * earUp));
      ctx.quadraticCurveTo(bx + side * hw * 0.45, hy - hh * 0.2, bx + side * hw * 0.2, hy - hh * 0.25);
      ctx.closePath();
      ctx.fillStyle = c.pattern === "mask" || (c.pattern === "calico" && side < 0) ? c.mark : c.fur;
      ctx.fill();
      ctx.lineWidth = line;
      ctx.strokeStyle = INK;
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(bx - side * hw * 0.2, hy - hh * 0.55);
      ctx.quadraticCurveTo(bx + side * hw * 0.15, hy - hh * (0.8 + 0.55 * earUp), bx + side * hw * 0.3, hy - hh * (0.55 + 0.65 * earUp));
      ctx.quadraticCurveTo(bx + side * hw * 0.25, hy - hh * 0.4, bx, hy - hh * 0.45);
      ctx.closePath();
      ctx.fillStyle = c.ear;
      ctx.fill();
    }

    // head
    ctx.beginPath();
    ctx.ellipse(cx, hy, hw, hh, 0, 0, Math.PI * 2);
    ctx.fillStyle = mood === "angry" ? mixRed(c.fur) : c.fur;
    ctx.fill();
    ctx.save();
    ctx.clip();
    if (c.pattern === "stripes") {
      ctx.fillStyle = c.mark;
      for (const dx of [-0.18, 0, 0.18]) {
        rounded(ctx, cx + dx * s - s * 0.025, hy - hh, s * 0.05, hh * 0.55, s * 0.025);
        ctx.fill();
      }
    } else if (c.pattern === "patch") {
      ellipse(ctx, cx + hw * 0.55, hy - hh * 0.35, hw * 0.55, hh * 0.6, c.mark);
    } else if (c.pattern === "calico") {
      ellipse(ctx, cx - hw * 0.6, hy - hh * 0.4, hw * 0.55, hh * 0.6, c.mark);
      ellipse(ctx, cx + hw * 0.7, hy - hh * 0.2, hw * 0.45, hh * 0.55, "#ffa24c");
    } else if (c.pattern === "mask") {
      ellipse(ctx, cx, hy + hh * 0.15, hw * 0.5, hh * 0.55, "rgba(107,74,58,0.55)");
    }
    ellipse(ctx, cx, hy + hh * 0.45, hw * 0.55, hh * 0.45, c.light);
    ctx.restore();
    ctx.beginPath();
    ctx.ellipse(cx, hy, hw, hh, 0, 0, Math.PI * 2);
    ctx.lineWidth = line;
    ctx.strokeStyle = INK;
    ctx.stroke();

    // cheeks
    if (mood === "happy" || mood === "sleep") {
      ellipse(ctx, cx - hw * 0.58, hy + hh * 0.25, hw * 0.16, hh * 0.1, "rgba(255,110,150,0.55)");
      ellipse(ctx, cx + hw * 0.58, hy + hh * 0.25, hw * 0.16, hh * 0.1, "rgba(255,110,150,0.55)");
    }

    // eyes
    const ex = hw * 0.4;
    const ey = hy - hh * 0.08;
    ctx.strokeStyle = INK;
    ctx.fillStyle = INK;
    ctx.lineWidth = line;
    for (const side of [-1, 1]) {
      const x = cx + side * ex;
      if (mood === "happy") {
        ctx.beginPath();
        ctx.arc(x, ey + hh * 0.08, hw * 0.13, Math.PI * 1.1, Math.PI * 1.9);
        ctx.stroke();
      } else if (mood === "sleep" || mood === "blink") {
        ctx.beginPath();
        ctx.arc(x, ey - hh * 0.02, hw * 0.13, Math.PI * 0.15, Math.PI * 0.85);
        ctx.stroke();
      } else if (mood === "angry") {
        ellipse(ctx, x, ey + hh * 0.05, hw * 0.08, hh * 0.09, INK);
        ctx.beginPath();
        ctx.moveTo(x - side * hw * 0.2, ey - hh * 0.28);
        ctx.lineTo(x + side * hw * 0.12, ey - hh * 0.1);
        ctx.stroke();
      } else {
        const big = mood === "curious" ? 1.25 : 1;
        ellipse(ctx, x, ey, hw * 0.13 * big, hh * 0.19 * big, INK);
        ellipse(ctx, x - hw * 0.04, ey - hh * 0.07, hw * 0.05 * big, hh * 0.06 * big, "#ffffff");
      }
    }

    // nose and mouth
    const ny = hy + hh * 0.2;
    ctx.beginPath();
    ctx.moveTo(cx - hw * 0.09, ny - hh * 0.05);
    ctx.lineTo(cx + hw * 0.09, ny - hh * 0.05);
    ctx.lineTo(cx, ny + hh * 0.06);
    ctx.closePath();
    ctx.fillStyle = "#ff7d9c";
    ctx.fill();
    ctx.lineWidth = line * 0.7;
    ctx.stroke();
    ctx.beginPath();
    if (mood === "angry") {
      ctx.moveTo(cx - hw * 0.18, ny + hh * 0.32);
      ctx.quadraticCurveTo(cx, ny + hh * 0.12, cx + hw * 0.18, ny + hh * 0.32);
    } else if (mood === "curious") {
      ctx.ellipse(cx, ny + hh * 0.25, hw * 0.07, hh * 0.1, 0, 0, Math.PI * 2);
    } else {
      ctx.moveTo(cx - hw * 0.2, ny + hh * 0.14);
      ctx.quadraticCurveTo(cx - hw * 0.1, ny + hh * 0.3, cx, ny + hh * 0.08);
      ctx.quadraticCurveTo(cx + hw * 0.1, ny + hh * 0.3, cx + hw * 0.2, ny + hh * 0.14);
    }
    ctx.stroke();

    // whiskers
    ctx.lineWidth = Math.max(1, line * 0.45);
    for (const side of [-1, 1]) {
      for (const k of [-1, 0, 1]) {
        ctx.beginPath();
        ctx.moveTo(cx + side * hw * 0.55, ny + k * hh * 0.1);
        ctx.lineTo(cx + side * hw * 1.1, ny + k * hh * 0.18 - hh * 0.05);
        ctx.stroke();
      }
    }
    ctx.restore();
  }

  function mixRed(hex) {
    const n = parseInt(hex.slice(1), 16);
    const r = Math.round(((n >> 16) & 255) * 0.6 + 255 * 0.4);
    const g = Math.round(((n >> 8) & 255) * 0.6 + 110 * 0.4);
    const b = Math.round((n & 255) * 0.6 + 110 * 0.4);
    return `rgb(${r},${g},${b})`;
  }

  // the number tag in a cell's corner
  function tag(ctx, cx, cy, s, clue, { fill = "#ffffff", color = INK, scale = 1 } = {}) {
    const label = clue.kind === "any" ? "?" : String(clue.value);
    const size = s * 0.3 * scale;
    let w = Math.max(size * 1.35, size * 0.62 * label.length + size * 0.7);
    let h = size * 1.35;
    let r = h / 2;
    if (clue.kind === "square") r = h * 0.18;
    if (clue.kind === "wide") w = Math.max(w, h * 1.9);
    if (clue.kind === "tall") {
      h = Math.max(h * 1.55, w * 1.5);
      r = w / 2;
    }
    const x = cx - w / 2;
    const y = cy - h / 2;
    ctx.save();
    rounded(ctx, x, y + size * 0.1, w, h, r);
    ctx.fillStyle = INK;
    ctx.fill();
    rounded(ctx, x, y, w, h, r);
    ctx.fillStyle = fill;
    ctx.fill();
    ctx.lineWidth = Math.max(1.5, s * 0.04);
    ctx.strokeStyle = INK;
    ctx.stroke();
    ctx.fillStyle = color;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = `800 ${size}px ${FONT}`;
    ctx.fillText(label, cx, cy + size * 0.08);
    ctx.restore();
  }

  // draws a cat in a cell with its tag in the top corner
  function resident(ctx, x, y, s, clue, look, mood, { bob = 0, tagFill = "#ffffff", tagScale = 1 } = {}) {
    cat(ctx, x + s * 0.47, y + s * 0.56, s * 0.95, look, mood, { bob });
    tag(ctx, x + s * 0.76, y + s * 0.24, s, clue, { fill: tagFill, scale: tagScale });
  }

  V.Paint = { FONT, rounded, box, cat, tag, resident, ellipse };
})(window.Purrfit);

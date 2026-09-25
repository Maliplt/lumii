"use strict";
// drawing kit: bevelled blocks with their perks
(function (B) {
  const TAU = Math.PI * 2;

  // block colours: [top bevel, face, side bevel, base]
  const BLOCK = {
    coral: ["#ff8f95", "#ff3b4e", "#d91f36", "#9c0f26"],
    tangerine: ["#ffbc70", "#ff8616", "#e0660a", "#a14603"],
    sun: ["#fff08a", "#ffd000", "#e0a800", "#9e7400"],
    lime: ["#8df7ab", "#22d65b", "#15ad45", "#0a7430"],
    sky: ["#93f1ff", "#10cfff", "#00a3d6", "#006a92"],
    ocean: ["#93b5ff", "#2f6bff", "#1d4fe0", "#11319c"],
    grape: ["#d9aaff", "#a347ff", "#8129e6", "#5415a1"],
    bubble: ["#ffa6d8", "#ff3ea5", "#e0208a", "#9c0f5c"],
    ghost: ["#aab4dc", "#7d89bd", "#6a76a8", "#4a557f"],
  };

  const GEM = {
    ruby: ["#ff2e63", "#ff9db4", "#b3123f"],
    sapphire: ["#2e7bff", "#a8ccff", "#1747b8"],
    emerald: ["#12c27a", "#9ff2cc", "#0a7d4e"],
  };

  function shade(hex, amount) {
    const n = parseInt(hex.slice(1), 16);
    const f = (c) => Math.round(amount < 0 ? c * (1 + amount) : c + (255 - c) * amount);
    return `#${((1 << 24) | (f((n >> 16) & 255) << 16) | (f((n >> 8) & 255) << 8) | f(n & 255)).toString(16).slice(1)}`;
  }

  function rgba(hex, a) {
    const n = parseInt(hex.slice(1), 16);
    return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
  }

  function rr(ctx, x, y, w, h, r) {
    const q = Math.max(0, Math.min(r, w / 2, h / 2));
    ctx.beginPath();
    ctx.moveTo(x + q, y);
    ctx.arcTo(x + w, y, x + w, y + h, q);
    ctx.arcTo(x + w, y + h, x, y + h, q);
    ctx.arcTo(x, y + h, x, y, q);
    ctx.arcTo(x, y, x + w, y, q);
    ctx.closePath();
  }

  function poly(ctx, points, fill) {
    ctx.beginPath();
    points.forEach(([px, py], i) => (i ? ctx.lineTo(px, py) : ctx.moveTo(px, py)));
    ctx.closePath();
    ctx.fillStyle = fill;
    ctx.fill();
  }

  // a block in a cell of size s at x, y
  function block(ctx, x, y, s, color, { alpha = 1, glow = 0, scale = 1, gem = null, perk = null, time = 0 } = {}) {
    const c = BLOCK[color] || BLOCK.ghost;
    const pad = s * 0.04;
    const w = (s - pad * 2) * scale;
    if (w <= 0) return;
    const bx = x + s / 2 - w / 2;
    const by = y + s / 2 - w / 2;
    const r = s * 0.1 * scale;
    const b = w * 0.13;
    ctx.save();
    ctx.globalAlpha *= alpha;
    rr(ctx, bx, by, w, w, r);
    ctx.fillStyle = c[3];
    ctx.fill();
    ctx.clip();
    poly(ctx, [[bx, by], [bx + w, by], [bx + w - b, by + b], [bx + b, by + b]], c[0]);
    poly(ctx, [[bx, by], [bx + b, by + b], [bx + b, by + w - b], [bx, by + w]], shade(c[1], 0.2));
    poly(ctx, [[bx + w, by], [bx + w, by + w], [bx + w - b, by + w - b], [bx + w - b, by + b]], c[2]);
    const face = ctx.createLinearGradient(0, by + b, 0, by + w - b);
    face.addColorStop(0, shade(c[1], 0.1));
    face.addColorStop(1, c[1]);
    ctx.fillStyle = face;
    ctx.fillRect(bx + b, by + b, w - b * 2, w - b * 2);
    const gloss = ctx.createLinearGradient(0, by + b, 0, by + w * 0.55);
    gloss.addColorStop(0, "rgba(255,255,255,0.28)");
    gloss.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = gloss;
    ctx.fillRect(bx + b, by + b, w - b * 2, w * 0.42);
    if (glow > 0) {
      ctx.fillStyle = `rgba(255,255,255,${0.6 * glow})`;
      ctx.fillRect(bx, by, w, w);
    }
    ctx.restore();
    if (gem) gemIcon(ctx, x + s / 2, y + s / 2, s * 0.25 * scale, gem, alpha);
    else if (perk) perkIcon(ctx, x + s / 2, y + s / 2, s * 0.3 * scale, perk, { alpha, time });
  }

  // the mark a perk leaves on its block: a star, ×2 or a bomb
  function perkIcon(ctx, cx, cy, r, perk, { alpha = 1, time = 0 } = {}) {
    ctx.save();
    ctx.globalAlpha *= alpha;
    ctx.translate(cx, cy);
    if (perk === "star") {
      const pulse = 1 + Math.sin(time * 4) * 0.06;
      ctx.scale(pulse, pulse);
      ctx.beginPath();
      for (let i = 0; i < 10; i++) {
        const a = -Math.PI / 2 + (i * Math.PI) / 5;
        const d = i % 2 ? r * 0.45 : r;
        ctx.lineTo(Math.cos(a) * d, Math.sin(a) * d);
      }
      ctx.closePath();
      ctx.fillStyle = "#ffffff";
      ctx.shadowColor = "rgba(0,0,0,0.35)";
      ctx.shadowOffsetY = r * 0.12;
      ctx.fill();
      ctx.shadowColor = "transparent";
      ctx.fillStyle = "#ffcf2e";
      ctx.scale(0.6, 0.6);
      ctx.fill();
    } else if (perk === "double") {
      const w = r * 1.9;
      const h = r * 1.3;
      ctx.fillStyle = "#ffffff";
      ctx.shadowColor = "rgba(0,0,0,0.35)";
      ctx.shadowOffsetY = r * 0.12;
      rr(ctx, -w / 2, -h / 2, w, h, h * 0.3);
      ctx.fill();
      ctx.shadowColor = "transparent";
      ctx.fillStyle = "#141821";
      ctx.font = `900 ${Math.round(r * 1.05)}px Rubik, sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("×2", 0, r * 0.06);
    } else if (perk === "bomb") {
      ctx.fillStyle = "#141821";
      ctx.shadowColor = "rgba(0,0,0,0.35)";
      ctx.shadowOffsetY = r * 0.12;
      ctx.beginPath();
      ctx.arc(0, r * 0.12, r * 0.78, 0, TAU);
      ctx.fill();
      ctx.shadowColor = "transparent";
      ctx.fillStyle = "rgba(255,255,255,0.35)";
      ctx.beginPath();
      ctx.arc(-r * 0.28, -r * 0.14, r * 0.2, 0, TAU);
      ctx.fill();
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = Math.max(1.2, r * 0.16);
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(r * 0.35, -r * 0.5);
      ctx.quadraticCurveTo(r * 0.55, -r * 0.95, r * 0.85, -r * 0.8);
      ctx.stroke();
      const spark = 0.6 + Math.sin(time * 14) * 0.4;
      ctx.fillStyle = `rgba(255,${Math.round(190 + spark * 60)},60,1)`;
      ctx.beginPath();
      ctx.arc(r * 0.88, -r * 0.82, r * (0.16 + spark * 0.1), 0, TAU);
      ctx.fill();
    }
    ctx.restore();
  }

  // a cut gem: a rhombus with facets
  function gemIcon(ctx, cx, cy, r, gem, alpha = 1) {
    const [base, light, dark] = GEM[gem];
    ctx.save();
    ctx.globalAlpha *= alpha;
    ctx.translate(cx, cy);
    ctx.fillStyle = "rgba(0,0,0,0.25)";
    ctx.beginPath();
    ctx.ellipse(0, r * 1.05, r * 0.8, r * 0.22, 0, 0, TAU);
    ctx.fill();
    const pts = [
      [0, -r],
      [r * 0.9, -r * 0.25],
      [0, r],
      [-r * 0.9, -r * 0.25],
    ];
    ctx.beginPath();
    pts.forEach(([px, py], i) => (i ? ctx.lineTo(px, py) : ctx.moveTo(px, py)));
    ctx.closePath();
    ctx.fillStyle = base;
    ctx.fill();
    ctx.lineWidth = Math.max(1.5, r * 0.18);
    ctx.strokeStyle = "#ffffff";
    ctx.lineJoin = "round";
    ctx.stroke();
    ctx.fillStyle = light;
    ctx.beginPath();
    ctx.moveTo(0, -r);
    ctx.lineTo(r * 0.9, -r * 0.25);
    ctx.lineTo(0, -r * 0.05);
    ctx.lineTo(-r * 0.9, -r * 0.25);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = dark;
    ctx.beginPath();
    ctx.moveTo(0, -r * 0.05);
    ctx.lineTo(r * 0.9, -r * 0.25);
    ctx.lineTo(0, r);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  function crate(ctx, x, y, s, { scale = 1, alpha = 1 } = {}) {
    const pad = s * 0.05;
    const w = (s - pad * 2) * scale;
    const bx = x + s / 2 - w / 2;
    const by = y + s / 2 - w / 2;
    const r = s * 0.08;
    ctx.save();
    ctx.globalAlpha *= alpha;
    ctx.fillStyle = "#6b3f1c";
    rr(ctx, bx, by, w, w, r);
    ctx.fill();
    const top = ctx.createLinearGradient(bx, by, bx, by + w);
    top.addColorStop(0, "#e8ad6a");
    top.addColorStop(1, "#c37d3e");
    ctx.fillStyle = top;
    rr(ctx, bx, by, w, w * 0.9, r);
    ctx.fill();
    ctx.strokeStyle = "#8e5528";
    ctx.lineWidth = Math.max(1, s * 0.04);
    const inset = w * 0.13;
    rr(ctx, bx + inset, by + inset, w - inset * 2, w * 0.9 - inset * 2, s * 0.03);
    ctx.stroke();
    ctx.lineWidth = Math.max(2, s * 0.08);
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(bx + inset * 1.3, by + w * 0.9 - inset * 1.3);
    ctx.lineTo(bx + w - inset * 1.3, by + inset * 1.3);
    ctx.stroke();
    ctx.restore();
  }

  function ice(ctx, x, y, s, hp, { scale = 1, alpha = 1, time = 0 } = {}) {
    const pad = s * 0.04;
    const w = (s - pad * 2) * scale;
    const bx = x + s / 2 - w / 2;
    const by = y + s / 2 - w / 2;
    const r = s * 0.1;
    ctx.save();
    ctx.globalAlpha *= alpha;
    ctx.fillStyle = "#3f8fc9";
    rr(ctx, bx, by, w, w, r);
    ctx.fill();
    const top = ctx.createLinearGradient(bx, by, bx + w, by + w);
    top.addColorStop(0, "#f2fbff");
    top.addColorStop(0.5, "#b6e4ff");
    top.addColorStop(1, "#7fc4f0");
    ctx.fillStyle = top;
    rr(ctx, bx, by, w, w * 0.9, r);
    ctx.fill();
    ctx.strokeStyle = "rgba(255,255,255,0.9)";
    ctx.lineWidth = Math.max(1, s * 0.03);
    ctx.beginPath();
    ctx.moveTo(bx + w * 0.2, by + w * 0.62);
    ctx.lineTo(bx + w * 0.45, by + w * 0.2);
    ctx.moveTo(bx + w * 0.55, by + w * 0.7);
    ctx.lineTo(bx + w * 0.8, by + w * 0.28);
    ctx.stroke();
    const glint = (Math.sin(time * 2 + x * 0.05) + 1) / 2;
    ctx.fillStyle = `rgba(255,255,255,${0.35 + glint * 0.4})`;
    ctx.beginPath();
    ctx.ellipse(bx + w * 0.26, by + w * 0.22, w * 0.08, w * 0.05, -0.6, 0, TAU);
    ctx.fill();
    if (hp < 2) {
      ctx.strokeStyle = "#1f6fae";
      ctx.lineWidth = Math.max(1.4, s * 0.035);
      ctx.lineJoin = "round";
      ctx.beginPath();
      ctx.moveTo(bx + w * 0.5, by + w * 0.05);
      ctx.lineTo(bx + w * 0.42, by + w * 0.3);
      ctx.lineTo(bx + w * 0.58, by + w * 0.42);
      ctx.lineTo(bx + w * 0.44, by + w * 0.7);
      ctx.moveTo(bx + w * 0.58, by + w * 0.42);
      ctx.lineTo(bx + w * 0.85, by + w * 0.5);
      ctx.moveTo(bx + w * 0.42, by + w * 0.3);
      ctx.lineTo(bx + w * 0.15, by + w * 0.36);
      ctx.stroke();
    }
    ctx.restore();
  }

  function stone(ctx, x, y, s, { alpha = 1, seed = 1 } = {}) {
    const pad = s * 0.035;
    const w = s - pad * 2;
    const bx = x + pad;
    const by = y + pad;
    const r = s * 0.14;
    ctx.save();
    ctx.globalAlpha *= alpha;
    ctx.fillStyle = "#3e434d";
    rr(ctx, bx, by, w, w, r);
    ctx.fill();
    const top = ctx.createLinearGradient(bx, by, bx, by + w);
    top.addColorStop(0, "#a9afbb");
    top.addColorStop(1, "#747b88");
    ctx.fillStyle = top;
    rr(ctx, bx, by, w, w * 0.88, r);
    ctx.fill();
    ctx.fillStyle = "rgba(40,44,52,0.35)";
    for (let i = 0; i < 5; i++) {
      const a = Math.sin(seed * 7.1 + i * 3.3) * 0.5 + 0.5;
      const b = Math.cos(seed * 3.7 + i * 5.1) * 0.5 + 0.5;
      ctx.beginPath();
      ctx.ellipse(bx + w * (0.2 + a * 0.6), by + w * 0.88 * (0.25 + b * 0.55), s * 0.05, s * 0.035, a * 3, 0, TAU);
      ctx.fill();
    }
    ctx.restore();
  }

  // draws whatever a grid cell holds
  function cell(ctx, x, y, s, c, options = {}) {
    if (!c) return;
    if (c.kind === "block") block(ctx, x, y, s, c.color, { ...options, gem: c.gem, perk: c.perk });
    else if (c.kind === "crate") crate(ctx, x, y, s, options);
    else if (c.kind === "ice") ice(ctx, x, y, s, c.hp, options);
    else if (c.kind === "stone") stone(ctx, x, y, s, { ...options, seed: x * 0.13 + y * 0.29 });
  }

  const INK = "#0c1b4d";

  // the board: a navy tray with a thick ink outline and a sunken slot for every cell
  function board(ctx, x, y, cell, n) {
    const size = cell * n;
    const m = cell * 0.24;
    const r = cell * 0.34;
    const line = Math.max(2.5, cell * 0.07);
    ctx.save();
    ctx.fillStyle = INK;
    rr(ctx, x - m - line, y - m - line, size + (m + line) * 2, size + (m + line) * 2 + cell * 0.14, r + line);
    ctx.fill();
    ctx.fillStyle = "#1a2a86";
    rr(ctx, x - m, y - m, size + m * 2, size + m * 2, r);
    ctx.fill();
    ctx.fillStyle = "rgba(255,255,255,0.08)";
    rr(ctx, x - m, y - m, size + m * 2, m * 0.6, r);
    ctx.fill();
    const p = cell * 0.045;
    for (let gy = 0; gy < n; gy++) {
      for (let gx = 0; gx < n; gx++) {
        const cx = x + gx * cell + p;
        const cy = y + gy * cell + p;
        const s = cell - p * 2;
        ctx.fillStyle = "#101d63";
        rr(ctx, cx, cy, s, s, cell * 0.12);
        ctx.fill();
        ctx.fillStyle = "#23359c";
        rr(ctx, cx, cy + s * 0.08, s, s * 0.92, cell * 0.12);
        ctx.fill();
      }
    }
    ctx.restore();
  }

  // the shelf for the tray under the board
  function tray(ctx, x, y, w, h, r) {
    ctx.save();
    ctx.fillStyle = "rgba(12,27,77,0.28)";
    rr(ctx, x, y, w, h, r);
    ctx.fill();
    ctx.restore();
  }
  // four-point twinkle
  function sparkle(ctx, x, y, r, color = "#ffffff", alpha = 1) {
    ctx.save();
    ctx.globalAlpha *= alpha;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(x, y - r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.quadraticCurveTo(x, y, x, y + r);
    ctx.quadraticCurveTo(x, y, x - r, y);
    ctx.quadraticCurveTo(x, y, x, y - r);
    ctx.fill();
    ctx.restore();
  }

  // big outlined game text, used for combos and scores on the board
  function shout(ctx, text, x, y, size, { fill = "#ffffff", stroke = "#0c1b4d", alpha = 1, rainbow = false, scale = 1, angle = 0, bounds = null } = {}) {
    if (scale <= 0) return;
    ctx.save();
    ctx.font = `900 ${Math.round(size)}px Rubik, sans-serif`;
    ctx.direction = "ltr";
    if (bounds) {
      const room = bounds[1] - bounds[0];
      const width = (ctx.measureText(text).width + size * 0.3) * (1 + Math.abs(angle));
      scale *= Math.min(1, room / width / Math.max(1, scale));
      const half = Math.min(room, width * scale) / 2;
      x = Math.max(bounds[0] + half, Math.min(bounds[1] - half, x));
    }
    ctx.globalAlpha *= alpha;
    ctx.translate(x, y);
    ctx.rotate(angle);
    ctx.scale(scale, scale);
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.lineJoin = "round";
    ctx.lineWidth = size * 0.2;
    ctx.strokeStyle = stroke;
    ctx.strokeText(text, 0, size * 0.06);
    if (rainbow) {
      const g = ctx.createLinearGradient(-size * 2, 0, size * 2, 0);
      ["#ff3b4e", "#ffd000", "#22d65b", "#10cfff", "#2f6bff"].forEach((c, i) => g.addColorStop(i / 4, c));
      ctx.fillStyle = g;
    } else {
      const g = ctx.createLinearGradient(0, -size * 0.5, 0, size * 0.5);
      g.addColorStop(0, shade(fill, 0.35));
      g.addColorStop(1, fill);
      ctx.fillStyle = g;
    }
    ctx.fillText(text, 0, 0);
    ctx.restore();
  }

  B.Art = { BLOCK, GEM, shade, rgba, rr, block, perkIcon, gemIcon, crate, ice, stone, cell, board, tray, sparkle, shout };
})(window.Blockhaven);

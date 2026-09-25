"use strict";
// everything drawn on canvas, in a hand-made paper style
(function (K) {
  const TAU = Math.PI * 2;

  const INK = "#2d2a4a";
  const PAPER = "#fffaf0";
  const TANGLE = "#ff4d5e";
  const STRING = "#4a4570";
  const STRINGS = ["#ff5d73", "#2fa3f0", "#f0a000"];
  const BEADS = ["#ff9e8f", "#ffd166", "#7ee0b8", "#7cc8ff", "#c3a3ff", "#ff9fd0", "#ffb870", "#9be36f"];
  const CONFETTI = ["#ff8a7a", "#ffd166", "#5fd6a8", "#6cc4ff", "#b58cff", "#ff8cc6"];

  function parse(hex) {
    const n = parseInt(hex.slice(1), 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }
  const hex = (r, g, b) => `#${((1 << 24) | (Math.round(r) << 16) | (Math.round(g) << 8) | Math.round(b)).toString(16).slice(1)}`;

  function shade(color, amount) {
    const [r, g, b] = parse(color);
    const f = (c) => (amount < 0 ? c * (1 + amount) : c + (255 - c) * amount);
    return hex(f(r), f(g), f(b));
  }

  function mix(a, b, t) {
    const pa = parse(a);
    const pb = parse(b);
    return hex(...pa.map((v, i) => v + (pb[i] - v) * t));
  }

  function rgba(color, alpha) {
    const [r, g, b] = parse(color);
    return `rgba(${r},${g},${b},${alpha})`;
  }

  // stable pseudo-noise in -1..1 for hand-drawn wobble
  const noise = (seed, k) => {
    const v = Math.sin(seed * 12.9898 + k * 78.233) * 43758.5453;
    return (v - Math.floor(v)) * 2 - 1;
  };

  function roughCircle(ctx, x, y, r, seed = 1, amount = 0.05) {
    const steps = 14;
    ctx.beginPath();
    for (let i = 0; i <= steps + 1; i++) {
      const a = (i / steps) * TAU + seed;
      const rr = r * (1 + noise(seed, i % steps) * amount);
      const px = x + Math.cos(a) * rr;
      const py = y + Math.sin(a) * rr;
      if (i === 0) ctx.moveTo(px, py);
      else {
        const pa = ((i - 0.5) / steps) * TAU + seed;
        const pr = r * (1 + noise(seed, (i + 30) % steps) * amount * 0.6) * 1.012;
        ctx.quadraticCurveTo(x + Math.cos(pa) * pr, y + Math.sin(pa) * pr, px, py);
      }
    }
    ctx.closePath();
  }

  function roughPoly(ctx, pts, seed = 1, amount = 1.4) {
    ctx.beginPath();
    pts.forEach((p, i) => {
      const x = p.x + noise(seed, i) * amount;
      const y = p.y + noise(seed, i + 50) * amount;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.closePath();
  }

  function roundedRect(ctx, x, y, w, h, r, seed = 0, amount = 0) {
    const pts = [];
    const corner = (cx, cy, from) => {
      for (let k = 0; k <= 4; k++) {
        const a = from + (k / 4) * (Math.PI / 2);
        pts.push({ x: cx + Math.cos(a) * r, y: cy + Math.sin(a) * r });
      }
    };
    corner(x + w - r, y + r, -Math.PI / 2);
    corner(x + w - r, y + h - r, 0);
    corner(x + r, y + h - r, Math.PI / 2);
    corner(x + r, y + r, Math.PI);
    if (!amount) {
      ctx.beginPath();
      pts.forEach((p, i) => (i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)));
      ctx.closePath();
      return;
    }
    // add a few points along each long side so the edge can wobble
    const out = [];
    for (let i = 0; i < pts.length; i++) {
      const a = pts[i];
      const b = pts[(i + 1) % pts.length];
      out.push(a);
      const len = Math.hypot(b.x - a.x, b.y - a.y);
      const parts = Math.floor(len / 40);
      for (let k = 1; k < parts; k++) out.push({ x: a.x + ((b.x - a.x) * k) / parts, y: a.y + ((b.y - a.y) * k) / parts });
    }
    roughPoly(ctx, out, seed, amount);
  }

  const cache = new Map();
  function dots(size) {
    const key = `dots:${size}`;
    if (cache.has(key)) return cache.get(key);
    const c = document.createElement("canvas");
    c.width = c.height = Math.max(4, Math.round(size));
    const g = c.getContext("2d");
    g.fillStyle = "rgba(90, 80, 140, 0.16)";
    g.beginPath();
    g.arc(c.width / 2, c.height / 2, Math.max(0.8, size * 0.05), 0, TAU);
    g.fill();
    cache.set(key, c);
    return c;
  }

  // a strip of washi tape, centred at x,y and turned by `angle`
  function tape(ctx, x, y, w, h, angle, color) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);
    ctx.fillStyle = rgba(color, 0.78);
    ctx.beginPath();
    ctx.moveTo(-w / 2, -h / 2);
    for (let i = 0; i <= 6; i++) ctx.lineTo(-w / 2 + (w * i) / 6, -h / 2 + (i % 2 ? 1.5 : 0));
    ctx.lineTo(w / 2, h / 2);
    for (let i = 6; i >= 0; i--) ctx.lineTo(-w / 2 + (w * i) / 6, h / 2 - (i % 2 ? 1.5 : 0));
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = "rgba(255,255,255,0.45)";
    ctx.lineWidth = 2;
    for (let k = -w / 2 + 6; k < w / 2; k += 9) {
      ctx.beginPath();
      ctx.moveTo(k, -h / 2 + 2);
      ctx.lineTo(k + 5, h / 2 - 2);
      ctx.stroke();
    }
    ctx.restore();
  }

  // a sheet of dotted paper with a hard shadow and two bits of tape
  function sheet(ctx, x, y, w, h, { seed = 3, accent = "#ff8a7a", grid = 26, glow = 0 } = {}) {
    ctx.save();
    ctx.fillStyle = rgba(shade(accent, -0.35), 0.35);
    roundedRect(ctx, x + 7, y + 9, w, h, 22, seed + 1, 2);
    ctx.fill();
    roundedRect(ctx, x, y, w, h, 22, seed, 2);
    ctx.fillStyle = PAPER;
    ctx.fill();
    ctx.save();
    ctx.clip();
    const pattern = ctx.createPattern(dots(grid), "repeat");
    ctx.fillStyle = pattern;
    ctx.translate(x + w / 2 - (Math.floor(w / 2 / grid) + 0.5) * grid, y + h / 2 - (Math.floor(h / 2 / grid) + 0.5) * grid);
    ctx.fillRect(-grid, -grid, w + grid * 2, h + grid * 2);
    ctx.restore();
    if (glow > 0) {
      ctx.save();
      roundedRect(ctx, x, y, w, h, 22, seed, 2);
      ctx.clip();
      const g = ctx.createRadialGradient(x + w / 2, y + h / 2, 0, x + w / 2, y + h / 2, Math.max(w, h) * 0.6);
      g.addColorStop(0, rgba(accent, 0.35 * glow));
      g.addColorStop(1, rgba(accent, 0));
      ctx.fillStyle = g;
      ctx.fillRect(x, y, w, h);
      ctx.restore();
    }
    roundedRect(ctx, x, y, w, h, 22, seed, 2);
    ctx.strokeStyle = INK;
    ctx.lineWidth = 2.5;
    ctx.stroke();
    const tw = Math.min(90, w * 0.22);
    tape(ctx, x + tw * 0.4, y + 6, tw, 24, -0.6, accent);
    tape(ctx, x + w - tw * 0.4, y + 6, tw, 24, 0.6, shade(accent, 0.25));
    ctx.restore();
  }

  // a hand-drawn string between two points
  function string(ctx, a, b, width, color, { seed = 1, alpha = 1, tangled = 0, time = 0, highlight = false } = {}) {
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const len = Math.hypot(dx, dy) || 1;
    const nx = -dy / len;
    const ny = dx / len;
    const bend = noise(seed, 3) * Math.min(3, len * 0.02) + (tangled ? Math.sin(time * 18 + seed) * 1.6 * tangled : 0);
    const mx = (a.x + b.x) / 2 + nx * bend;
    const my = (a.y + b.y) / 2 + ny * bend;
    const tone = tangled ? mix(color, TANGLE, 0.85 * tangled) : color;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.lineCap = "round";
    if (highlight) {
      ctx.strokeStyle = rgba(tone, 0.2);
      ctx.lineWidth = width * 3.2;
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.quadraticCurveTo(mx, my, b.x, b.y);
      ctx.stroke();
    }
    ctx.strokeStyle = tone;
    ctx.lineWidth = width;
    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.quadraticCurveTo(mx, my, b.x, b.y);
    ctx.stroke();
    // a second, lighter pass a hair off the first, like a pencil line
    ctx.globalAlpha = alpha * 0.35;
    ctx.lineWidth = width * 0.55;
    ctx.beginPath();
    ctx.moveTo(a.x + nx * 1.2, a.y + ny * 1.2);
    ctx.quadraticCurveTo(mx - nx * 1.5, my - ny * 1.5, b.x + nx * 0.8, b.y + ny * 0.8);
    ctx.stroke();
    ctx.restore();
  }

  // a rubber band: a flat loop that thins and reddens when pulled too far
  function band(ctx, a, b, width, color, { strain = 0, time = 0, alpha = 1 } = {}) {
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const len = Math.hypot(dx, dy) || 1;
    const nx = -dy / len;
    const ny = dx / len;
    const spread = width * (1.25 - strain * 0.6);
    const shake = strain ? Math.sin(time * 55) * width * 0.5 * strain : 0;
    const tone = mix(color, TANGLE, strain);
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.lineCap = "round";
    ctx.strokeStyle = tone;
    ctx.lineWidth = width * (0.8 - strain * 0.3);
    for (const s of [-1, 1]) {
      ctx.beginPath();
      ctx.moveTo(a.x + nx * spread * s * 0.5, a.y + ny * spread * s * 0.5);
      ctx.quadraticCurveTo((a.x + b.x) / 2 + nx * (spread * s + shake), (a.y + b.y) / 2 + ny * (spread * s + shake), b.x + nx * spread * s * 0.5, b.y + ny * spread * s * 0.5);
      ctx.stroke();
    }
    ctx.restore();
  }

  // a little red scribble where two strings cross
  function tangle(ctx, x, y, s, time = 0, seed = 0) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(time * 1.5 + seed);
    ctx.strokeStyle = TANGLE;
    ctx.lineWidth = Math.max(1.6, s * 0.28);
    ctx.lineCap = "round";
    ctx.beginPath();
    for (let i = 0; i <= 26; i++) {
      const a = (i / 26) * TAU * 2.2;
      const r = s * (0.45 + 0.55 * Math.abs(Math.sin(i * 0.7 + seed)));
      const px = Math.cos(a) * r;
      const py = Math.sin(a) * r * 0.8;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.stroke();
    ctx.restore();
  }

  // a push pin stuck through the top of a bead
  function pin(ctx, x, y, r, color = "#ff5d73", press = 1) {
    const hx = x + r * 0.35;
    const hy = y - r * (0.55 + (1 - press) * 1.2);
    ctx.save();
    ctx.globalAlpha = Math.min(1, press * 1.5);
    ctx.fillStyle = "rgba(45,42,74,0.25)";
    ctx.beginPath();
    ctx.ellipse(hx + r * 0.18, hy + r * 0.38, r * 0.42, r * 0.22, 0, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = "#8a8aa3";
    ctx.lineWidth = Math.max(1.2, r * 0.1);
    ctx.beginPath();
    ctx.moveTo(hx, hy);
    ctx.lineTo(hx - r * 0.1, hy + r * 0.45);
    ctx.stroke();
    const g = ctx.createRadialGradient(hx - r * 0.12, hy - r * 0.14, r * 0.04, hx, hy, r * 0.42);
    g.addColorStop(0, shade(color, 0.55));
    g.addColorStop(1, color);
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(hx, hy, r * 0.4, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = INK;
    ctx.lineWidth = Math.max(1.4, r * 0.1);
    ctx.stroke();
    ctx.restore();
  }

  // a bead with a face
  function bead(ctx, x, y, r, color, { mood = "calm", look = null, blink = false, lift = 0, squash = 0, seed = 1, alert = 0, pinned = false, pinPress = 1 } = {}) {
    const s = r * (1 + lift * 0.14);
    ctx.save();
    ctx.fillStyle = `rgba(45,42,74,${0.18 + lift * 0.1})`;
    ctx.beginPath();
    ctx.ellipse(x + s * 0.12, y + s * (0.35 + lift * 0.5), s * 0.95, s * 0.7, 0, 0, TAU);
    ctx.fill();
    ctx.translate(x, y - lift * s * 0.25);
    ctx.scale(1 + squash * 0.18, 1 - squash * 0.18);
    if (alert > 0) {
      ctx.strokeStyle = rgba(TANGLE, 0.7 * alert);
      ctx.lineWidth = Math.max(2, s * 0.14);
      ctx.setLineDash([s * 0.28, s * 0.22]);
      roughCircle(ctx, 0, 0, s * 1.32, seed + 3, 0.04);
      ctx.stroke();
      ctx.setLineDash([]);
    }
    roughCircle(ctx, 0, 0, s, seed, 0.045);
    const g = ctx.createRadialGradient(-s * 0.35, -s * 0.4, s * 0.1, 0, 0, s * 1.05);
    g.addColorStop(0, shade(color, 0.35));
    g.addColorStop(1, color);
    ctx.fillStyle = g;
    ctx.fill();
    ctx.strokeStyle = INK;
    ctx.lineWidth = Math.max(1.8, s * 0.12);
    ctx.lineJoin = "round";
    ctx.stroke();
    ctx.fillStyle = "rgba(255,255,255,0.7)";
    ctx.beginPath();
    ctx.ellipse(-s * 0.42, -s * 0.46, s * 0.17, s * 0.1, -0.7, 0, TAU);
    ctx.fill();
    face(ctx, s, mood, look, blink);
    ctx.restore();
    if (pinned) pin(ctx, x, y - lift * s * 0.25, s, "#ff5d73", pinPress);
  }

  function face(ctx, s, mood, look, blink) {
    const lx = look ? look.x * s * 0.07 : 0;
    const ly = look ? look.y * s * 0.07 : 0;
    const ex = s * 0.3;
    const ey = -s * 0.08;
    ctx.strokeStyle = INK;
    ctx.fillStyle = INK;
    ctx.lineCap = "round";
    ctx.lineWidth = Math.max(1.4, s * 0.1);
    if (mood === "joy") {
      for (const side of [-1, 1]) {
        ctx.beginPath();
        ctx.arc(side * ex, ey + s * 0.05, s * 0.12, Math.PI * 1.1, Math.PI * 1.9);
        ctx.stroke();
      }
    } else if (blink) {
      for (const side of [-1, 1]) {
        ctx.beginPath();
        ctx.moveTo(side * ex - s * 0.1, ey);
        ctx.lineTo(side * ex + s * 0.1, ey);
        ctx.stroke();
      }
    } else {
      const big = mood === "wow" ? 1.2 : 1;
      for (const side of [-1, 1]) {
        ctx.beginPath();
        ctx.ellipse(side * ex + lx, ey + ly, s * 0.1 * big, s * 0.13 * big, 0, 0, TAU);
        ctx.fill();
        ctx.fillStyle = "#fff";
        ctx.beginPath();
        ctx.arc(side * ex + lx - s * 0.03, ey + ly - s * 0.045, s * 0.035, 0, TAU);
        ctx.fill();
        ctx.fillStyle = INK;
      }
    }
    if (mood === "worried") {
      ctx.lineWidth = Math.max(1.2, s * 0.08);
      for (const side of [-1, 1]) {
        ctx.beginPath();
        ctx.moveTo(side * (ex + s * 0.12), ey - s * 0.2);
        ctx.lineTo(side * (ex - s * 0.1), ey - s * 0.27);
        ctx.stroke();
      }
      ctx.beginPath();
      ctx.moveTo(-s * 0.18, s * 0.34);
      ctx.quadraticCurveTo(-s * 0.09, s * 0.24, 0, s * 0.33);
      ctx.quadraticCurveTo(s * 0.09, s * 0.42, s * 0.18, s * 0.32);
      ctx.stroke();
    } else if (mood === "wow") {
      ctx.beginPath();
      ctx.ellipse(0, s * 0.33, s * 0.1, s * 0.13, 0, 0, TAU);
      ctx.fill();
    } else {
      const wide = mood === "joy" ? 0.26 : mood === "happy" ? 0.2 : 0.12;
      ctx.beginPath();
      ctx.arc(0, s * 0.16, s * wide, Math.PI * 0.2, Math.PI * 0.8);
      if (mood === "joy") {
        ctx.fillStyle = "#ff6f7f";
        ctx.fill();
      }
      ctx.stroke();
      if (mood === "happy" || mood === "joy") {
        ctx.fillStyle = "rgba(255,110,130,0.45)";
        for (const side of [-1, 1]) {
          ctx.beginPath();
          ctx.ellipse(side * s * 0.55, s * 0.18, s * 0.13, s * 0.08, 0, 0, TAU);
          ctx.fill();
        }
      }
    }
  }

  function centroid(poly) {
    let x = 0;
    let y = 0;
    for (const p of poly) {
      x += p.x;
      y += p.y;
    }
    return { x: x / poly.length, y: y / poly.length };
  }

  // the finished picture, cut from layered paper
  function cutout(ctx, poly, color, { progress = 1, seed = 5, line = 2.5 } = {}) {
    if (progress <= 0) return;
    const c = centroid(poly);
    const k = progress < 1 ? K.util.easeBack(progress) : 1;
    const at = (p, s = 1) => ({ x: c.x + (p.x - c.x) * k * s, y: c.y + (p.y - c.y) * k * s });
    const outer = poly.map((p) => at(p));
    const inner = poly.map((p) => at(p, 0.8));
    ctx.save();
    ctx.globalAlpha = Math.min(1, progress * 3);
    ctx.fillStyle = rgba(shade(color, -0.45), 0.35);
    ctx.save();
    ctx.translate(5, 7);
    roughPoly(ctx, outer, seed + 2, 1.2);
    ctx.fill();
    ctx.restore();
    roughPoly(ctx, outer, seed, 1.2);
    ctx.fillStyle = color;
    ctx.fill();
    roughPoly(ctx, inner, seed + 7, 1.2);
    ctx.fillStyle = shade(color, 0.3);
    ctx.fill();
    roughPoly(ctx, outer, seed, 1.2);
    ctx.strokeStyle = INK;
    ctx.lineWidth = line;
    ctx.lineJoin = "round";
    ctx.stroke();
    ctx.setLineDash([line * 2, line * 2.2]);
    ctx.strokeStyle = "rgba(255,255,255,0.7)";
    ctx.lineWidth = line * 0.7;
    roughPoly(ctx, poly.map((p) => at(p, 0.9)), seed + 3, 0.6);
    ctx.stroke();
    ctx.restore();
  }

  // a small tile showing a picture, for page lists and the result card
  function mini(canvas, motif, { size, dpr = Math.min(3, window.devicePixelRatio || 1) } = {}) {
    canvas.width = Math.round(size * dpr);
    canvas.height = Math.round(size * dpr);
    canvas.style.width = `${size}px`;
    canvas.style.height = `${size}px`;
    const ctx = canvas.getContext("2d");
    ctx.scale(dpr, dpr);
    const poly = K.Motifs.outline(motif, 0.78).map((p) => ({ x: size / 2 + p.x * size * 0.5, y: size / 2 + p.y * size * 0.5 }));
    cutout(ctx, poly, motif.color, { line: Math.max(1.6, size * 0.022), seed: motif.id.length });
    return canvas;
  }

  function confetti(ctx, x, y, size, spin, hue, flip) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(spin);
    ctx.scale(1, Math.abs(Math.cos(flip)) * 0.9 + 0.1);
    ctx.fillStyle = CONFETTI[hue % CONFETTI.length];
    ctx.strokeStyle = INK;
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    if (hue % 3 === 0) ctx.rect(-size, -size * 0.55, size * 2, size * 1.1);
    else if (hue % 3 === 1) ctx.arc(0, 0, size * 0.8, 0, TAU);
    else {
      ctx.moveTo(0, -size);
      ctx.lineTo(size, size * 0.8);
      ctx.lineTo(-size, size * 0.8);
      ctx.closePath();
    }
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }

  K.Paper = { INK, PAPER, TANGLE, STRING, STRINGS, BEADS, CONFETTI, shade, mix, rgba, noise, roughCircle, roughPoly, roundedRect, tape, sheet, string, band, tangle, pin, bead, cutout, mini, confetti, centroid };
})(window.Knotwise);

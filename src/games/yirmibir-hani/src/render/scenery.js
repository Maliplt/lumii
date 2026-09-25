"use strict";
// the inn behind the table
(function (YB) {
  const { canvas, context, bake, dither, noise, box } = YB.Pixels;
  const P = () => YB.PALETTE;

  const LANTERN = ["..k..", ".kkk.", "kyzyk", "kzzzk", "kyzyk", ".kkk.", "..k.."];
  const BOTTLES = [
    [".q.", ".l.", "lll", "lLl", "lLl", "lll"],
    [".q.", ".r.", ".r.", "rrr", "rRr", "rrr"],
    [".q..", "bbbb", "bBbb", "bBbb", "bbbb"],
    ["..q..", ".ooo.", "ooOoo", "ooOoo", ".ooo."],
    ["vvv", "vVv", "vVv", "vvv"],
  ];
  const JUG = [".TTT..", "TtttT.", "TttttT", "TttttT", "TtttT.", ".TTT.."];
  const PLATE = [".ggg.", "gmmmg", "gmMmg", "gmmmg", ".ggg."];
  const MUG = ["sssss..", "tttttt.", "tTttt.t", "tTttt.t", "tTtttt.", "ttttt.."];
  const CANDLE = ["sss", "sss", "sSs", "sSs", "sSs", "qqq"];
  const DICE = ["wwwww.wwwww", "wkwwg.wwwkw", "wwkww.wwkww", "wwwkw.wkwww", "gggggg.gggg"];
  const COINS = [".yyyy.", "yyyyyY", "YYYYYY", ".yyyy.", "yyyyyY", "YYYYYY", "yyyyyY", "YYYYYY"];

  let serial = 0;

  class Scenery {
    constructor() {
      this.theme = "village";
      this.mode = "menu";
      this.width = 0;
      this.height = 0;
      this.layer = null;
      this.time = 0;
      this.motes = [];
      this.fires = [];
      this.lights = [];
    }

    set(theme, mode) {
      if (theme === this.theme && mode === this.mode) return;
      this.theme = theme;
      this.mode = mode;
      this.layer = null;
    }

    resize(width, height) {
      if (width === this.width && height === this.height) return;
      this.width = width;
      this.height = height;
      this.layer = null;
      this.motes = Array.from({ length: Math.round((width * height) / 1800) }, () => this.mote(true));
    }

    mote(anywhere) {
      return {
        x: Math.random() * this.width,
        y: anywhere ? Math.random() * this.height : this.height + 2,
        speed: 3 + Math.random() * 6,
        drift: Math.random() * 6.28,
        life: Math.random(),
      };
    }

    paint() {
      const W = this.width;
      const H = this.height;
      const theme = YB.THEMES[this.theme];
      const el = canvas(W, H);
      const ctx = context(el);
      const seed = ++serial;
      this.fires = [];
      this.lights = [];
      this.flames = [];

      const floorTop = Math.round(H * (this.mode === "menu" ? 0.84 : 0.88));
      this.wall(ctx, theme, W, floorTop);
      this.floor(ctx, theme, W, H, floorTop);

      const beam = 10;
      ctx.fillStyle = theme.trim;
      ctx.fillRect(0, beam, W, 6);
      ctx.fillStyle = "rgba(255,255,255,0.18)";
      ctx.fillRect(0, beam, W, 1);
      ctx.fillStyle = P().k;
      ctx.fillRect(0, beam + 6, W, 1);
      for (let x = 6; x < W; x += 24) {
        ctx.fillStyle = P().G;
        ctx.fillRect(x, beam + 2, 1, 1);
      }

      const wide = W >= 300;
      const windows = wide ? [Math.round(W * 0.16), Math.round(W * 0.84)] : [Math.round(W * 0.78)];
      for (const cx of windows) this.window(ctx, theme, cx - 21, 30);

      const shelfY = 78;
      if (wide && H > 180) {
        this.shelf(ctx, Math.round(W * 0.34), shelfY, 64, seed);
        this.shelf(ctx, Math.round(W * 0.56), shelfY + 10, 60, seed + 3);
      }

      const lanternCount = Math.max(2, Math.round(W / 90));
      for (let i = 0; i < lanternCount; i++) {
        const x = Math.round(((i + 0.5) / lanternCount) * W);
        this.lantern(ctx, x, beam + 7);
      }
      this.bunting(ctx, theme, W, beam + 7);

      if (this.mode === "menu") {
        const size = wide ? [60, 52] : [32, 32];
        if (H > 120) this.hearth(ctx, wide ? 10 : 3, floorTop - 14 - size[1], size[0], size[1]);
      } else if (wide && H > 200) this.hearth(ctx, 10, floorTop - 52);
      if (this.mode === "menu") this.counter(ctx, theme, W, H, floorTop);
      this.layer = el;
    }

    wall(ctx, theme, W, bottom) {
      const [a, b, c] = theme.wall;
      if (this.theme === "pass" || this.theme === "abbey") {
        for (let row = 0; row * 9 < bottom; row++) {
          const offset = row % 2 ? 9 : 0;
          for (let x = -offset; x < W; x += 18) {
            const n = noise(x, row, 7);
            ctx.fillStyle = n < 0.3 ? c : n < 0.75 ? b : a;
            ctx.fillRect(x, row * 9, 18, 9);
            ctx.fillStyle = theme.trim;
            ctx.fillRect(x, row * 9, 18, 1);
            ctx.fillRect(x, row * 9, 1, 9);
            ctx.fillStyle = "rgba(255,255,255,0.12)";
            ctx.fillRect(x + 1, row * 9 + 1, 16, 1);
          }
        }
      } else if (this.theme === "court") {
        ctx.fillStyle = a;
        ctx.fillRect(0, 0, W, bottom);
        for (let y = 0; y < bottom; y++) {
          for (let x = 0; x < W; x++) if ((x + y * 3) % 11 === 0 && dither(x, y, 0.5)) ctx.fillRect(x, y, 1, 1);
        }
        ctx.fillStyle = b;
        for (let y = 0; y < bottom; y += 2) for (let x = (y / 2) % 2 ? 0 : 5; x < W; x += 10) ctx.fillRect(x, y, 1, 1);
        const wainscot = Math.round(bottom * 0.7);
        ctx.fillStyle = "#6b3a2a";
        ctx.fillRect(0, wainscot, W, bottom - wainscot);
        ctx.fillStyle = "#ffd84a";
        ctx.fillRect(0, wainscot, W, 1);
        ctx.fillStyle = "#4a2821";
        for (let x = 4; x < W; x += 22) ctx.fillRect(x, wainscot + 4, 16, bottom - wainscot - 8);
        for (let x = Math.round(W * 0.3); x < W; x += Math.max(120, Math.round(W * 0.4))) this.tapestry(ctx, x, 20);
      } else {
        for (let x = 0; x < W; x += 13) {
          const n = noise(x, 3, 11);
          ctx.fillStyle = n < 0.33 ? a : n < 0.66 ? b : c;
          ctx.fillRect(x, 0, 13, bottom);
          ctx.fillStyle = theme.trim;
          ctx.fillRect(x, 0, 1, bottom);
          ctx.fillStyle = "rgba(255,255,255,0.1)";
          ctx.fillRect(x + 1, 0, 1, bottom);
          for (let y = 12; y < bottom; y += 23) {
            if (noise(x, y, 5) < 0.35) {
              ctx.fillStyle = "rgba(0,0,0,0.18)";
              ctx.fillRect(x + 5, y, 3, 2);
              ctx.fillRect(x + 6, y - 1, 1, 4);
            }
          }
        }
      }
    }

    tapestry(ctx, x, y) {
      const w = 26;
      const h = 44;
      box(ctx, x, y, w, h, "#a3263a", { ink: P().k, notch: 0 });
      ctx.fillStyle = "#ffd84a";
      ctx.fillRect(x + 2, y + 2, w - 4, 1);
      ctx.fillRect(x + 2, y + h - 6, w - 4, 1);
      for (let i = 0; i < w - 2; i += 4) {
        ctx.fillStyle = "#a3263a";
        ctx.fillRect(x + 1 + i, y + h, 2, 3);
        ctx.fillStyle = P().k;
        ctx.fillRect(x + 1 + i, y + h + 3, 2, 1);
      }
      const crown = bake(["y.y.y", "yyyyy", "yrybr", "yyyyy"], { outline: "k" });
      ctx.drawImage(crown, x + Math.round((w - crown.width) / 2), y + 16);
    }

    floor(ctx, theme, W, H, top) {
      const [a, b] = theme.floor;
      for (let y = top; y < H; y += 6) {
        ctx.fillStyle = (y - top) % 12 ? b : a;
        ctx.fillRect(0, y, W, 6);
        ctx.fillStyle = "rgba(0,0,0,0.25)";
        ctx.fillRect(0, y, W, 1);
        for (let x = ((y - top) / 6) % 2 ? 10 : 30; x < W; x += 40) ctx.fillRect(x, y, 1, 6);
      }
      ctx.fillStyle = P().k;
      ctx.fillRect(0, top, W, 1);
    }

    window(ctx, theme, x, y) {
      const w = 42;
      const h = 34;
      box(ctx, x - 2, y - 2, w + 4, h + 4, "#6b3a2a", { ink: P().k, notch: 1 });
      const view = context(canvas(w, h));
      const sky = {
        day: ["#8fd3ff", "#bfe8ff"],
        sea: ["#1d3f73", "#2c5fa8"],
        peaks: ["#f7872a", "#ffc24a"],
        stars: ["#1a1633", "#2b2450"],
        castle: ["#643a95", "#cf5d8a"],
      }[theme.window];
      for (let py = 0; py < h; py++) {
        view.fillStyle = dither(0, py, py / h) ? sky[1] : sky[0];
        for (let px = 0; px < w; px++) {
          view.fillStyle = dither(px, py, py / h) ? sky[1] : sky[0];
          view.fillRect(px, py, 1, 1);
        }
      }
      if (theme.window === "day") {
        view.fillStyle = "#fff";
        view.fillRect(6, 7, 9, 2);
        view.fillRect(8, 6, 5, 1);
        view.fillRect(24, 12, 11, 2);
        view.fillRect(27, 11, 5, 1);
        view.fillStyle = "#6cc24a";
        for (let px = 0; px < w; px++) view.fillRect(px, 24 + Math.round(Math.sin(px * 0.15) * 2), 1, 12);
        view.fillStyle = "#3c8a43";
        for (let px = 0; px < w; px++) view.fillRect(px, 28 + Math.round(Math.sin(px * 0.22 + 2) * 2), 1, 12);
      } else if (theme.window === "sea") {
        view.fillStyle = "#fff39e";
        view.fillRect(29, 5, 5, 5);
        view.fillRect(28, 6, 7, 3);
        view.fillStyle = "#4a9be8";
        view.fillRect(0, 21, w, 13);
        view.fillStyle = "#a8e2ff";
        for (let px = 0; px < w; px += 6) view.fillRect(px + ((px / 6) % 2) * 3, 24 + ((px / 6) % 3) * 3, 3, 1);
        view.fillStyle = "#fff39e";
        view.fillRect(31, 22, 1, 6);
      } else if (theme.window === "peaks") {
        view.fillStyle = "#ffe38a";
        view.fillRect(8, 16, 7, 7);
        view.fillStyle = "#62555a";
        for (let px = 0; px < w; px++) {
          const top = 14 + Math.abs(((px + 6) % 22) - 11);
          view.fillRect(px, top, 1, h - top);
        }
        view.fillStyle = "#fff";
        for (let px = 0; px < w; px++) {
          const top = 14 + Math.abs(((px + 6) % 22) - 11);
          if (top < 18) view.fillRect(px, top, 1, 2);
        }
      } else if (theme.window === "stars") {
        view.fillStyle = "#fff39e";
        for (let i = 0; i < 14; i++) view.fillRect(Math.floor(noise(i, 1, 3) * w), Math.floor(noise(i, 2, 3) * (h - 8)), 1, 1);
        view.fillRect(8, 6, 5, 5);
        view.fillStyle = sky[0];
        view.fillRect(10, 5, 4, 4);
      } else if (theme.window === "castle") {
        view.fillStyle = "#43256a";
        view.fillRect(8, 16, 26, 18);
        for (let px = 8; px < 34; px += 4) view.fillRect(px, 14, 2, 2);
        view.fillRect(18, 8, 6, 26);
        view.fillRect(17, 6, 2, 2);
        view.fillRect(23, 6, 2, 2);
        view.fillStyle = "#ffd84a";
        view.fillRect(20, 12, 2, 3);
        view.fillRect(12, 22, 2, 3);
        view.fillRect(28, 22, 2, 3);
      }
      ctx.drawImage(view.canvas, x, y);
      ctx.fillStyle = "#6b3a2a";
      ctx.fillRect(x + w / 2 - 1, y, 2, h);
      ctx.fillRect(x, y + h / 2 - 1, w, 2);
      ctx.fillStyle = "rgba(255,255,255,0.35)";
      ctx.fillRect(x + 2, y + 2, 1, 6);
      ctx.fillRect(x + 3, y + 2, 1, 3);
      ctx.fillStyle = "#4a2821";
      ctx.fillRect(x - 4, y + h + 2, w + 8, 3);
      ctx.fillStyle = P().k;
      ctx.fillRect(x - 4, y + h + 5, w + 8, 1);
    }

    shelf(ctx, x, y, width, seed) {
      ctx.fillStyle = "#6b3a2a";
      ctx.fillRect(x, y, width, 3);
      ctx.fillStyle = P().k;
      ctx.fillRect(x, y + 3, width, 1);
      ctx.fillStyle = "#4a2821";
      ctx.fillRect(x + 3, y + 4, 2, 4);
      ctx.fillRect(x + width - 5, y + 4, 2, 4);
      let cx = x + 2;
      let i = 0;
      while (cx < x + width - 8) {
        const pick = Math.floor(noise(i, seed, 9) * 7);
        const rows = pick < 5 ? BOTTLES[pick] : pick === 5 ? JUG : PLATE;
        const sprite = bake(rows, { outline: "k" });
        ctx.drawImage(sprite, cx, y - sprite.height + 1);
        cx += sprite.width + 1;
        i++;
      }
    }

    lantern(ctx, x, y) {
      ctx.fillStyle = P().k;
      ctx.fillRect(x, y, 1, 5);
      const sprite = bake(LANTERN, { colors: { k: "#3f2b40" } });
      ctx.drawImage(sprite, x - 2, y + 5);
      this.lights.push({ x, y: y + 8, radius: 18 });
    }

    bunting(ctx, theme, W, top) {
      const span = 60;
      for (let start = -10; start < W; start += span) {
        for (let i = 0; i <= span; i++) {
          const t = i / span;
          const sag = Math.round(Math.sin(t * Math.PI) * 7);
          ctx.fillStyle = P().k;
          ctx.fillRect(start + i, top + sag, 1, 1);
          if (i % 8 === 4 && i > 2 && i < span - 2) {
            const color = P()[theme.bunting[(Math.floor((start + i) / 8) & 3)]];
            for (let fy = 0; fy < 6; fy++) {
              const half = Math.max(0, 2 - Math.floor(fy / 2));
              ctx.fillStyle = color;
              ctx.fillRect(start + i - half, top + sag + 1 + fy, half * 2 + 1, 1);
            }
            ctx.fillStyle = "rgba(0,0,0,0.25)";
            ctx.fillRect(start + i + 1, top + sag + 1, 1, 4);
          }
        }
      }
    }

    hearth(ctx, x, y, w = 60, h = 52) {
      for (let row = 0; row < h; row += 6) {
        for (let col = row % 12 ? -5 : 0; col < w; col += 10) {
          ctx.fillStyle = noise(col, row, 4) < 0.5 ? "#9a8f99" : "#877a85";
          ctx.fillRect(x + Math.max(0, col), y + row, Math.min(10, w - Math.max(0, col)), 6);
          ctx.fillStyle = "#5e5361";
          ctx.fillRect(x + Math.max(0, col), y + row, Math.min(10, w - Math.max(0, col)), 1);
          ctx.fillRect(x + Math.max(0, col), y + row, 1, 6);
        }
      }
      ctx.fillStyle = "#4a2821";
      ctx.fillRect(x - 3, y - 4, w + 6, 5);
      ctx.fillStyle = P().k;
      ctx.fillRect(x - 3, y + 1, w + 6, 1);
      const ox = x + Math.round(w * 0.2);
      const oy = y + Math.round(h * 0.3);
      const ow = w - Math.round(w * 0.4);
      const oh = h - Math.round(h * 0.3);
      ctx.fillStyle = "#1a1116";
      ctx.fillRect(ox, oy + 4, ow, oh - 4);
      ctx.fillRect(ox + 2, oy + 2, ow - 4, 2);
      ctx.fillRect(ox + 5, oy, ow - 10, 2);
      ctx.fillStyle = "#744029";
      ctx.fillRect(ox + 4, y + h - 5, ow - 8, 3);
      ctx.fillStyle = "#4a2821";
      ctx.fillRect(ox + 8, y + h - 7, ow - 16, 3);
      this.fires.push({ x: ox + ow / 2, y: y + h - 6, width: ow - 8, tall: Math.round(h * 0.27) });
      this.lights.push({ x: ox + ow / 2, y: y + h - 14, radius: Math.round(w * 0.63) });
      if (w < 50) return;
      const mug = bake(MUG, { outline: "k" });
      ctx.drawImage(mug, x + 4, y - 4 - mug.height);
      const candle = bake(CANDLE, { outline: "k" });
      ctx.drawImage(candle, x + w - 12, y - 4 - candle.height);
    }

    counter(ctx, theme, W, H, floorTop) {
      const top = floorTop - 14;
      const [light, mid, dark] = theme.table;
      ctx.fillStyle = mid;
      ctx.fillRect(0, top, W, H - top);
      for (let x = 0; x < W; x += 18) {
        ctx.fillStyle = dark;
        ctx.fillRect(x, top + 8, 1, H - top);
        ctx.fillStyle = "rgba(255,255,255,0.08)";
        ctx.fillRect(x + 1, top + 8, 1, H - top);
      }
      ctx.fillStyle = light;
      ctx.fillRect(0, top, W, 7);
      ctx.fillStyle = "rgba(255,255,255,0.3)";
      ctx.fillRect(0, top, W, 1);
      ctx.fillStyle = dark;
      ctx.fillRect(0, top + 7, W, 1);
      ctx.fillStyle = P().k;
      ctx.fillRect(0, top - 1, W, 1);
      ctx.fillRect(0, top + 8, W, 1);
      this.counterTop = top;
      const items = [
        [MUG, 0.1],
        [CANDLE, 0.22],
        [DICE, 0.68],
        [COINS, 0.8],
        [MUG, 0.9],
      ];
      for (const [rows, at] of items) {
        const sprite = bake(rows, { outline: "k" });
        const x = Math.round(W * at - sprite.width / 2);
        if (x < (W >= 300 ? 76 : 38)) continue;
        ctx.fillStyle = "rgba(35,23,38,0.25)";
        ctx.fillRect(x + 1, top + 1, sprite.width - 1, 2);
        ctx.drawImage(sprite, x, top - sprite.height + 2);
        if (rows === CANDLE) this.flames.push({ x: x + Math.floor(sprite.width / 2), y: top - sprite.height + 1 });
      }    }

    glow(radius) {
      this.glows = this.glows || new Map();
      if (!this.glows.has(radius)) {
        const el = canvas(radius * 2 + 1, radius * 2 + 1);
        const g = context(el);
        const bands = ["rgba(255,200,110,0.07)", "rgba(255,205,120,0.12)", "rgba(255,215,140,0.18)"];
        for (let y = -radius; y <= radius; y++) {
          for (let x = -radius; x <= radius; x++) {
            const d = Math.hypot(x, y) / radius;
            if (d >= 1) continue;
            g.fillStyle = bands[d < 0.4 ? 2 : d < 0.7 ? 1 : 0];
            g.fillRect(x + radius, y + radius, 1, 1);
          }
        }
        this.glows.set(radius, el);
      }
      return this.glows.get(radius);
    }

    update(dt) {
      this.time += dt;
      for (const m of this.motes) {
        m.y -= m.speed * dt;
        m.drift += dt;
        m.x += Math.sin(m.drift) * 3 * dt;
        m.life += dt * 0.2;
        if (m.y < -2) Object.assign(m, this.mote(false));
      }
    }

    draw(ctx, calm) {
      if (!this.layer) this.paint();
      ctx.drawImage(this.layer, 0, 0);
      const flicker = calm ? 1 : 0.9 + Math.sin(this.time * 9) * 0.05 + Math.sin(this.time * 23) * 0.05;
      ctx.globalAlpha = Math.min(1, flicker);
      for (const light of this.lights) ctx.drawImage(this.glow(light.radius), light.x - light.radius, light.y - light.radius);
      ctx.globalAlpha = 1;
      for (const fire of this.fires) this.fire(ctx, fire, calm);
      for (const flame of this.flames) {
        const lean = calm ? 0 : Math.round(Math.sin(this.time * 7 + flame.x) * 0.8);
        ctx.fillStyle = "#f7872a";
        ctx.fillRect(flame.x - 1, flame.y - 2, 3, 2);
        ctx.fillStyle = "#ffd84a";
        ctx.fillRect(flame.x + lean, flame.y - 4, 1, 3);
        ctx.fillStyle = "#fff39e";
        ctx.fillRect(flame.x, flame.y - 2, 1, 1);
      }
      if (!calm) {
        for (const m of this.motes) {
          const a = 0.35 + 0.35 * Math.sin(m.life * 6.28);
          ctx.fillStyle = `rgba(255,226,160,${a.toFixed(2)})`;
          ctx.fillRect(Math.round(m.x), Math.round(m.y), 1, 1);
        }
      }
    }

    fire(ctx, fire, calm) {
      const t = calm ? 0 : this.time;
      const colors = ["#e8424f", "#f7872a", "#ffd84a", "#fff39e"];
      for (let i = 0; i < fire.width; i++) {
        const x = Math.round(fire.x - fire.width / 2 + i);
        const edge = 1 - Math.abs(i - fire.width / 2) / (fire.width / 2);
        const height = Math.max(1, Math.round(edge * (fire.tall || 14) + Math.sin(t * 11 + i * 1.7) * 2.5 + Math.sin(t * 7 + i * 0.6) * 2));
        for (let y = 0; y < height; y++) {
          const level = Math.min(3, Math.floor((1 - y / height) * 4 * edge + 0.3));
          ctx.fillStyle = colors[level];
          ctx.fillRect(x, fire.y - y, 1, 1);
        }
      }
    }
  }

  YB.Scenery = Scenery;
})(window.YirmibirHani);

"use strict";
(function (YB) {
  const COIN = () => YB.Pixels.cached("coin", () => YB.Pixels.bake(YB.Sprites.COIN, { outline: "k" }));

  // pixel particles: sparks, puffs of dust, confetti and flying coins
  class Particles {
    constructor() {
      this.items = [];
    }

    burst(x, y, { kind = "spark", count = 10, colors = ["#ffd84a"], speed = 60, spread = Math.PI * 2, angle = -Math.PI / 2, gravity = 120, life = 0.7, size = 1 } = {}) {
      for (let i = 0; i < count; i++) {
        const a = angle + (Math.random() - 0.5) * spread;
        const v = speed * (0.4 + Math.random() * 0.8);
        this.items.push({
          kind,
          x,
          y,
          vx: Math.cos(a) * v,
          vy: Math.sin(a) * v,
          gravity,
          life: life * (0.6 + Math.random() * 0.6),
          age: 0,
          color: colors[Math.floor(Math.random() * colors.length)],
          size,
          spin: Math.random() * 6,
        });
      }
    }

    // coins that pop out of a lane and then home in on a target
    coins(x, y, target, count) {
      for (let i = 0; i < count; i++) {
        const a = -Math.PI / 2 + (Math.random() - 0.5) * 2.2;
        const v = 50 + Math.random() * 50;
        this.items.push({ kind: "coin", x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, gravity: 90, life: 1.4, age: -i * 0.03, target, homing: 0.45 + Math.random() * 0.2 });
      }
    }

    update(dt) {
      for (const p of this.items) {
        p.age += dt;
        if (p.age < 0) continue;
        if (p.kind === "coin" && p.age > p.homing) {
          const k = Math.min(1, (p.age - p.homing) * 5);
          p.x += (p.target.x - p.x) * k * 0.35;
          p.y += (p.target.y - p.y) * k * 0.35;
          if (Math.hypot(p.target.x - p.x, p.target.y - p.y) < 3) {
            p.age = p.life;
            p.arrived = true;
          }
          continue;
        }
        p.vy += p.gravity * dt;
        if (p.kind === "confetti") {
          p.vx *= 0.96;
          p.vy = Math.min(p.vy, 30);
        }
        if (p.kind === "puff") {
          p.vx *= 0.9;
          p.vy *= 0.9;
        }
        p.x += p.vx * dt;
        p.y += p.vy * dt;
      }
      const arrived = this.items.filter((p) => p.arrived).length;
      this.items = this.items.filter((p) => p.age < p.life);
      return arrived;
    }

    draw(ctx) {
      for (const p of this.items) {
        if (p.age < 0) continue;
        const x = Math.round(p.x);
        const y = Math.round(p.y);
        const fade = 1 - p.age / p.life;
        if (p.kind === "coin") {
          const coin = COIN();
          ctx.drawImage(coin, x - 3, y - 3);
        } else if (p.kind === "puff") {
          ctx.globalAlpha = Math.max(0, fade * 0.8);
          ctx.fillStyle = p.color;
          const s = p.size + Math.floor(p.age * 6);
          ctx.fillRect(x - (s >> 1), y - (s >> 1), s, s);
          ctx.globalAlpha = 1;
        } else if (p.kind === "confetti") {
          ctx.fillStyle = p.color;
          const wide = Math.sin(p.age * 12 + p.spin) > 0;
          ctx.fillRect(x, y, wide ? 2 : 1, wide ? 1 : 2);
        } else {
          if (fade < 0.3 && (Math.floor(p.age * 30) & 1)) continue;
          ctx.fillStyle = p.color;
          ctx.fillRect(x, y, p.size, p.size);
        }
      }
    }

    clear() {
      this.items = [];
    }
  }

  YB.Particles = Particles;
})(window.YirmibirHani);

// tiny particle system working in art pixels
export class Particles {
  constructor(limit = 600) {
    this.items = [];
    this.limit = limit;
  }

  spawn(particle) {
    if (this.items.length >= this.limit) this.items.shift();
    this.items.push({ vx: 0, vy: 0, ay: 0, drag: 0, size: 1, kind: 'dot', age: 0, ttl: 0.6, ...particle });
  }

  burst(x, y, count, make) {
    for (let i = 0; i < count; i++) this.spawn({ x, y, ...make(i) });
  }

  clear() {
    this.items.length = 0;
  }

  update(dt) {
    for (const p of this.items) {
      p.age += dt;
      p.vy += p.ay * dt;
      if (p.drag) {
        const keep = Math.max(0, 1 - p.drag * dt);
        p.vx *= keep;
        p.vy *= keep;
      }
      p.x += p.vx * dt;
      p.y += p.vy * dt;
    }
    this.items = this.items.filter((p) => p.age < p.ttl);
  }

  draw(ctx) {
    for (const p of this.items) {
      const x = Math.round(p.x);
      const y = Math.round(p.y);
      const t = p.age / p.ttl;
      ctx.fillStyle = p.color;
      if (p.kind === 'spark') {
        const big = t < 0.6 && Math.floor(p.age * 12) % 2 === 0;
        ctx.fillRect(x, y, 1, 1);
        if (big) {
          ctx.fillRect(x - 1, y, 3, 1);
          ctx.fillRect(x, y - 1, 1, 3);
        }
      } else if (p.kind === 'petal') {
        const flip = Math.floor(p.age * 8 + p.x) % 2 === 0;
        ctx.fillRect(x, y, flip ? 2 : 1, flip ? 1 : 2);
      } else {
        const size = t > 0.7 && p.size > 1 ? p.size - 1 : p.size;
        ctx.fillRect(x, y, size, size);
      }
    }
  }
}

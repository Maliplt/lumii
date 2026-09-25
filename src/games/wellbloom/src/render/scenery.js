import { Rng } from '../core/rng.js';
import { context2d, createCanvas, ditherPass } from './pixels.js';
import { THEMES } from './themes.js';

const ART_HEIGHT = 180;

const HILL_SHAPES = {
  meadow: 'rolling',
  canyon: 'mesa',
  frost: 'peaks',
  twilight: 'forest',
  sky: 'puffy',
};

const CLOUD_COLORS = {
  meadow: ['#ffffff', '#dcecf6'],
  canyon: ['#fff3df', '#f3cfa6'],
  frost: ['#ffffff', '#d7e7f4'],
  twilight: ['#5b4a8f', '#46387a'],
  sky: ['#ffffff', '#f3dcf2'],
};

// the animated landscape behind every screen
export class Scenery {
  constructor(canvas) {
    this.canvas = canvas;
    this.themeId = null;
    this.reducedMotion = false;
    this.clouds = [];
    this.motes = [];
    window.addEventListener('resize', () => this.themeId && this.resize());
  }

  setTheme(themeId) {
    if (themeId === this.themeId) return;
    this.themeId = themeId;
    this.theme = THEMES[themeId];
    this.resize();
  }

  resize() {
    const scale = Math.max(2, Math.round(window.innerHeight / ART_HEIGHT));
    this.width = Math.ceil(window.innerWidth / scale);
    this.height = Math.ceil(window.innerHeight / scale);
    this.canvas.width = this.width;
    this.canvas.height = this.height;
    this.ctx = context2d(this.canvas);
    this.rng = new Rng(`scenery/${this.themeId}`);
    this.backdrop = this.paintBackdrop();
    this.clouds = this.makeClouds();
    this.motes = Array.from({ length: Math.round((this.width * this.height) / 900) }, () => this.makeMote(true));
  }

  // static backdrop

  paintBackdrop() {
    const canvas = createCanvas(this.width, this.height);
    const ctx = context2d(canvas);
    this.paintSky(ctx);
    this.paintSun(ctx);
    const layers = [0.56, 0.68, 0.8];
    layers.forEach((base, i) => this.paintHills(ctx, i, Math.round(this.height * base)));
    return canvas;
  }

  paintSky(ctx) {
    const [top, middle, bottom] = this.theme.sky;
    const horizon = this.height * 0.75;
    for (let y = 0; y < this.height; y++) {
      const t = Math.min(1, y / horizon) * 2;
      const band = Math.min(1, Math.floor(t));
      const blend = t - band;
      const from = band === 0 ? top : middle;
      const to = band === 0 ? middle : bottom;
      for (let x = 0; x < this.width; x++) {
        ctx.fillStyle = t >= 2 ? bottom : ditherPass(x, y, blend) ? to : from;
        ctx.fillRect(x, y, 1, 1);
      }
    }
    if (this.themeId === 'twilight') {
      for (let i = 0; i < (this.width * this.height) / 160; i++) {
        ctx.fillStyle = this.rng.chance(0.3) ? '#fff6c8' : '#b9a8e8';
        ctx.fillRect(this.rng.int(0, this.width), this.rng.int(0, Math.round(this.height * 0.55)), 1, 1);
      }
    }
  }

  paintSun(ctx) {
    const cx = Math.round(this.width * 0.8);
    const cy = Math.round(this.height * 0.17);
    const radius = Math.max(7, Math.round(this.height * 0.055));
    const moon = this.themeId === 'twilight';
    for (let y = -radius * 2; y <= radius * 2; y++) {
      for (let x = -radius * 2; x <= radius * 2; x++) {
        const d = Math.hypot(x, y);
        const px = cx + x;
        const py = cy + y;
        if (d <= radius) {
          if (moon && Math.hypot(x - radius * 0.45, y - radius * 0.3) < radius * 0.8) continue;
          ctx.fillStyle = this.theme.sun;
          ctx.fillRect(px, py, 1, 1);
        } else if (!moon && d <= radius + 3 && ditherPass(px, py, 0.5)) {
          ctx.fillStyle = 'rgba(255, 250, 220, 0.55)';
          ctx.fillRect(px, py, 1, 1);
        }
      }
    }
  }

  hillProfile(layer, x) {
    const phase = layer * 1.7 + this.themeId.length;
    const amplitude = [14, 10, 7][layer];
    const rolling = Math.sin(x * 0.028 + phase) * amplitude + Math.sin(x * 0.067 + phase * 2) * amplitude * 0.45;
    switch (HILL_SHAPES[this.themeId]) {
      case 'mesa':
        return Math.round(rolling / 7) * 7 - 3;
      case 'peaks': {
        const wave = ((x * 0.025 + phase) % 2 + 2) % 2;
        return (Math.abs(wave - 1) * 2 - 1) * amplitude * 1.3 + Math.sin(x * 0.11) * 2;
      }
      case 'puffy':
        return -Math.abs(Math.sin(x * 0.05 + phase)) * amplitude * 1.2 + amplitude * 0.3;
      default:
        return rolling;
    }
  }

  paintHills(ctx, layer, base) {
    const color = this.theme.hills[layer];
    const shape = HILL_SHAPES[this.themeId];
    for (let x = 0; x < this.width; x++) {
      const top = Math.round(base - this.hillProfile(layer, x));
      ctx.fillStyle = color;
      ctx.fillRect(x, top, 1, this.height - top);
      ctx.fillStyle = shape === 'peaks' && top < base - 8 ? '#ffffff' : 'rgba(255, 255, 255, 0.28)';
      ctx.fillRect(x, top, 1, shape === 'peaks' && top < base - 8 ? 3 : 1);
      if (shape === 'forest' && layer === 2 && x % 9 === 0) this.paintPine(ctx, x, top, color);
      if (shape === 'rolling' && layer === 2 && this.rng.chance(0.05)) {
        ctx.fillStyle = this.rng.pick(['#fff6a0', '#ffffff', '#ffb3d1']);
        ctx.fillRect(x, top + 2 + this.rng.int(0, 6), 1, 1);
      }
    }
  }

  paintPine(ctx, x, top, color) {
    const height = 8 + (x % 5);
    ctx.fillStyle = color;
    for (let row = 0; row < height; row++) {
      const half = Math.floor(row / 2);
      ctx.fillRect(x - half, top - height + row, half * 2 + 1, 1);
    }
  }

  // moving parts

  makeClouds() {
    if (this.themeId === 'twilight') return [];
    const count = Math.max(3, Math.round(this.width / 70));
    return Array.from({ length: count }, (_, i) => ({
      x: this.rng.next() * this.width,
      y: 6 + this.rng.next() * this.height * 0.35,
      speed: 1.5 + this.rng.next() * 2.5,
      sprite: this.bakeCloud(18 + this.rng.int(0, 22), 7 + this.rng.int(0, 5), i),
    }));
  }

  bakeCloud(width, height, seed) {
    const [light, shade] = CLOUD_COLORS[this.themeId];
    const canvas = createCanvas(width, height);
    const ctx = context2d(canvas);
    const rng = new Rng(`cloud/${this.themeId}/${seed}`);
    const puffs = Array.from({ length: 4 }, () => ({
      x: rng.int(Math.round(height / 2), width - Math.round(height / 2)),
      y: rng.int(Math.round(height / 2), height - 2),
      r: rng.int(Math.round(height / 3), Math.round(height / 1.6)),
    }));
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const inside = puffs.some((p) => Math.hypot(x - p.x, (y - p.y) * 1.3) <= p.r) || (y >= height - 3 && x > 2 && x < width - 3);
        if (!inside) continue;
        ctx.fillStyle = y >= height - 2 ? shade : light;
        ctx.fillRect(x, y, 1, 1);
      }
    }
    return canvas;
  }

  makeMote(anywhere = false) {
    const kind = this.theme.ambient;
    const mote = {
      x: Math.random() * this.width,
      y: anywhere ? Math.random() * this.height : kind === 'snow' ? -2 : this.height + 2,
      phase: Math.random() * Math.PI * 2,
      life: 0,
    };
    switch (kind) {
      case 'snow':
        return { ...mote, vx: 0, vy: 6 + Math.random() * 8, color: '#ffffff' };
      case 'dust':
        return { ...mote, y: Math.random() * this.height, x: anywhere ? mote.x : -2, vx: 10 + Math.random() * 14, vy: 0, color: '#f7dcae' };
      case 'fireflies':
        return { ...mote, y: this.height * (0.45 + Math.random() * 0.55), vx: 0, vy: 0, color: '#e8ff8a' };
      case 'sparkle':
        return { ...mote, y: Math.random() * this.height, vx: 0, vy: -2, color: '#ffffff', ttl: 2 + Math.random() * 3 };
      default:
        return { ...mote, vx: 3 + Math.random() * 5, vy: -(2 + Math.random() * 4), color: Math.random() < 0.5 ? '#fff6b0' : '#ffffff' };
    }
  }

  update(dt) {
    if (!this.ctx || this.reducedMotion) return;
    for (const cloud of this.clouds) {
      cloud.x += cloud.speed * dt;
      if (cloud.x > this.width + 4) cloud.x = -cloud.sprite.width - 4;
    }
    const kind = this.theme.ambient;
    this.motes = this.motes.map((mote) => {
      mote.life += dt;
      mote.phase += dt;
      if (kind === 'fireflies') {
        mote.x += Math.cos(mote.phase * 0.7) * 6 * dt;
        mote.y += Math.sin(mote.phase * 1.1) * 4 * dt;
      } else {
        mote.x += (mote.vx + Math.sin(mote.phase * 1.5) * 3) * dt;
        mote.y += mote.vy * dt;
      }
      const gone = mote.x < -4 || mote.x > this.width + 4 || mote.y < -4 || mote.y > this.height + 4 || (mote.ttl && mote.life > mote.ttl);
      return gone ? this.makeMote(kind === 'sparkle' || kind === 'fireflies') : mote;
    });
  }

  draw(now) {
    if (!this.ctx) return;
    const ctx = this.ctx;
    ctx.drawImage(this.backdrop, 0, 0);
    for (const cloud of this.clouds) ctx.drawImage(cloud.sprite, Math.round(cloud.x), Math.round(cloud.y));

    const kind = this.theme.ambient;
    for (const mote of this.motes) {
      const x = Math.round(mote.x);
      const y = Math.round(mote.y);
      if (kind === 'fireflies' && Math.sin(mote.phase * 2.3) < -0.2) continue;
      ctx.fillStyle = mote.color;
      if (kind === 'sparkle') {
        const on = Math.sin(mote.life * 4 + mote.phase) > 0.3;
        if (!on) continue;
        ctx.fillRect(x, y, 1, 1);
        if (Math.sin(mote.life * 4 + mote.phase) > 0.85) {
          ctx.fillRect(x - 1, y, 3, 1);
          ctx.fillRect(x, y - 1, 1, 3);
        }
      } else {
        ctx.fillRect(x, y, 1, 1);
      }
    }

    if (this.themeId === 'twilight') {
      const blink = Math.floor(now / 400);
      for (let i = 0; i < 6; i++) {
        const sx = (blink * 37 + i * 91) % this.width;
        const sy = (blink * 13 + i * 53) % Math.round(this.height * 0.5);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(sx, sy, 1, 1);
      }
    }
  }
}

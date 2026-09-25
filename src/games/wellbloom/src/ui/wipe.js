import { context2d } from '../render/pixels.js';

const DURATION = 280;
const INK = '#1f1a2e';

// full-screen pixel transition
export class Wipe {
  constructor(canvas) {
    this.canvas = canvas;
    this.instant = false;
    this.order = [];
  }

  prepare() {
    const size = Math.max(window.innerWidth, window.innerHeight) / 16;
    const cols = Math.ceil(window.innerWidth / size);
    const rows = Math.ceil(window.innerHeight / size);
    this.canvas.width = cols;
    this.canvas.height = rows;
    this.ctx = context2d(this.canvas);
    const maxDistance = Math.hypot(cols / 2, rows / 2);
    this.order = [];
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        const distance = Math.hypot(x + 0.5 - cols / 2, y + 0.5 - rows / 2) / maxDistance;
        this.order.push({ x, y, at: distance * 0.75 + Math.random() * 0.25 });
      }
    }
  }

  cover() {
    this.prepare();
    return this.animate((cell, t) => cell.at <= t);
  }

  reveal() {
    return this.animate((cell, t) => cell.at > t).then(() => this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height));
  }

  animate(isFilled) {
    return new Promise((resolve) => {
      const start = performance.now();
      const frame = (now) => {
        const t = this.instant ? 1 : Math.min(1, (now - start) / DURATION);
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.fillStyle = INK;
        for (const cell of this.order) if (isFilled(cell, t)) this.ctx.fillRect(cell.x, cell.y, 1, 1);
        if (t < 1) requestAnimationFrame(frame);
        else resolve();
      };
      requestAnimationFrame(frame);
    });
  }
}

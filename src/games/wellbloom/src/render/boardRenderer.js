import { BOARD_FRAME, TILE } from '../config.js';
import { CellKind } from '../puzzle/board.js';
import { WATER } from './palette.js';
import { Particles } from './particles.js';
import { context2d, createCanvas, pixelNoise } from './pixels.js';
import * as tileArt from './tileArt.js';
import { THEMES } from './themes.js';

const ROTATE_MS = 170;
const FILL_MS = 120;
const DRAIN_MS = 140;
const FLOW_STEP_MS = 60;
const BLOOM_MS = 320;
const WILT_MS = 180;
const BUMP_MS = 160;
const SHAKE_MS = 260;

const PETAL_COLORS = {
  daisy: '#ffffff',
  tulip: '#e5484d',
  poppy: '#e5484d',
  sunflower: '#ffd447',
  marigold: '#f28c38',
  snowdrop: '#ffffff',
  bluebell: '#3f9be0',
  edelweiss: '#ffffff',
  lavender: '#a57aed',
  moonbloom: '#7ef0dc',
  rose: '#f78fc0',
  iris: '#a57aed',
};

const easeOutBack =(t) => 1 + 2.2 * Math.pow(t - 1, 3) + 1.2 * Math.pow(t - 1, 2);

// draws a Board at pixel-art resolution and scales it up by a whole number
export class BoardRenderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = context2d(canvas);
    this.particles = new Particles();
    this.board = null;
    this.scale = 1;
    this.hover = -1;
    this.cursor = -1;
    this.spotlight = -1;
    this.reducedMotion = false;
    this.onFill = null;
    this.onBloom = null;
    this.shakeUntil = 0;
    this.celebrateAt = 0;
  }

  setBoard(board, themeId) {
    this.board = board;
    this.themeId = themeId;
    this.theme = THEMES[themeId];
    this.artWidth = board.cols * TILE + BOARD_FRAME * 2;
    this.artHeight = board.rows * TILE + BOARD_FRAME * 2;
    this.art = createCanvas(this.artWidth, this.artHeight);
    this.artCtx = context2d(this.art);
    this.staticLayer = this.paintStaticLayer();
    this.tiles = board.cells.map(() => ({
      turn: 0,
      turnFrom: 0,
      turnStart: 0,
      wet: 0,
      color: null,
      target: null,
      fillAt: 0,
      announced: false,
      bloom: 0,
      bumpAt: -Infinity,
      shakeAt: -Infinity,
      sparkled: false,
    }));
    this.particles.clear();
    this.celebrateAt = 0;
    this.leakClock = 0;
    this.hover = -1;
    this.cursor = -1;
    this.spotlight = -1;
    this.syncFlow(performance.now(), 400);
  }

  // sizes the canvas to the available CSS box
  layout(maxWidth, maxHeight) {
    if (!this.board) return;
    const dpr = window.devicePixelRatio || 1;
    const fit = Math.min((maxWidth * dpr) / this.artWidth, (maxHeight * dpr) / this.artHeight);
    this.scale = dpr >= 2 ? Math.max(1, fit) : Math.max(1, Math.floor(fit));
    this.canvas.width = Math.round(this.artWidth * this.scale);
    this.canvas.height = Math.round(this.artHeight * this.scale);
    this.canvas.style.width = `${this.canvas.width / dpr}px`;
    this.canvas.style.height = `${this.canvas.height / dpr}px`;
    this.ctx = context2d(this.canvas);
  }

  tileOrigin(index) {
    return {
      x: BOARD_FRAME + (index % this.board.cols) * TILE,
      y: BOARD_FRAME + Math.floor(index / this.board.cols) * TILE,
    };
  }

  tileAt(clientX, clientY) {
    if (!this.board) return -1;
    const rect = this.canvas.getBoundingClientRect();
    const ax = ((clientX - rect.left) / rect.width) * this.artWidth - BOARD_FRAME;
    const ay = ((clientY - rect.top) / rect.height) * this.artHeight - BOARD_FRAME;
    const col = Math.floor(ax / TILE);
    const row = Math.floor(ay / TILE);
    if (col < 0 || row < 0 || col >= this.board.cols || row >= this.board.rows) return -1;
    return row * this.board.cols + col;
  }

  // centre of a tile in page coordinates, used to place the coach's hand
  tileCenterOnScreen(index) {
    const rect = this.canvas.getBoundingClientRect();
    const { x, y } = this.tileOrigin(index);
    return {
      x: rect.left + ((x + TILE / 2) / this.artWidth) * rect.width,
      y: rect.top + ((y + TILE / 2) / this.artHeight) * rect.height,
      size: (TILE / this.artWidth) * rect.width,
    };
  }

  // reactions to game events

  // starts water moving through newly connected tiles, nearest first
  syncFlow(now, delay = 0) {
    const { water, depth } = this.board.flow;
    const reached = [];
    water.forEach((color, index) => {
      const tile = this.tiles[index];
      if (!color) {
        tile.target = null;
      } else if (!tile.target) {
        reached.push(index);
      } else if (tile.target !== color) {
        tile.target = color;
        tile.color = color;
      }
    });
    if (reached.length === 0) return;

    const nearest = Math.min(...reached.map((i) => depth[i]));
    reached.forEach((index) => {
      const tile = this.tiles[index];
      tile.target = water[index];
      if (tile.wet === 0) tile.color = water[index];
      tile.fillAt = now + delay + (depth[index] - nearest) * FLOW_STEP_MS;
    });
  }

  turned(unit, turns, now) {
    unit.forEach((index) => {
      const tile = this.tiles[index];
      const current = this.currentTurn(tile, now);
      tile.turnFrom = current - turns;
      tile.turnStart = now;
      tile.bumpAt = now;
    });
    const { x, y } = this.tileOrigin(unit[0]);
    this.particles.burst(x + TILE / 2, y + TILE - 2, 3, () => ({
      vx: (Math.random() - 0.5) * 30,
      vy: -10 - Math.random() * 10,
      ay: 50,
      ttl: 0.35,
      color: this.theme.ground.dark,
    }));
  }

  refused(index, now) {
    this.tiles[index].shakeAt = now;
  }

  hinted(unit, now) {
    unit.forEach((index) => {
      const { x, y } = this.tileOrigin(index);
      this.tiles[index].bumpAt = now;
      this.particles.burst(x + TILE / 2, y + TILE / 2, 14, () => {
        const angle = Math.random() * Math.PI * 2;
        const speed = 15 + Math.random() * 30;
        return {
          kind: 'spark',
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          drag: 3,
          ttl: 0.7 + Math.random() * 0.3,
          color: Math.random() < 0.5 ? '#fff6c0' : '#9ee0ff',
        };
      });
    });
  }

  celebrate(now) {
    this.celebrateAt = now;
    this.shakeUntil = this.reducedMotion ? 0 : now + 280;
  }

  currentTurn(tile, now) {
    if (!tile.turnStart) return 0;
    const t = (now - tile.turnStart) / ROTATE_MS;
    if (t >= 1) return 0;
    return tile.turnFrom * (1 - easeOutBack(t));
  }

  // true once water has finished moving and every flower has reacted
  isSettled() {
    return this.tiles.every((tile, index) => {
      const cell = this.board.cells[index];
      if (tile.target ? tile.wet < 1 : tile.wet > 0) return false;
      if (cell.kind === CellKind.POT) {
        const happy = tile.target === cell.color;
        return happy ? tile.bloom >= 1 : tile.bloom <= 0;
      }
      return true;
    });
  }

  // frame loop

  update(dt, now) {
    if (!this.board) return;
    const { depth } = this.board.flow;

    this.tiles.forEach((tile, index) => {
      const cell = this.board.cells[index];
      if (tile.target && now >= tile.fillAt) {
        if (!tile.announced) {
          tile.announced = true;
          this.onFill?.(index, depth[index]);
        }
        tile.color = tile.target;
        tile.wet = Math.min(1, tile.wet + (dt * 1000) / FILL_MS);
      } else if (!tile.target) {
        tile.wet = Math.max(0, tile.wet - (dt * 1000) / DRAIN_MS);
        tile.announced = false;
      }

      if (cell.kind !== CellKind.POT) return;
      const happy = tile.target === cell.color && tile.wet >= 1;
      if (happy && tile.bloom < 1) {
        tile.bloom = Math.min(1, tile.bloom + (dt * 1000) / BLOOM_MS);
        if (tile.bloom >= 1) this.bloomed(index);
      } else if (!happy && tile.target !== cell.color && tile.bloom > 0) {
        tile.bloom = Math.max(0, tile.bloom - (dt * 1000) / WILT_MS);
      }
    });

    this.leakClock += dt;
    if (this.leakClock > 0.07) {
      this.leakClock = 0;
      this.board.flow.leaks.slice(0, 16).forEach((leak) => this.spill(leak));
    }

    if (this.celebrateAt) this.celebrationWave(now);
    this.particles.update(dt);
  }

  bloomed(index) {
    const cell = this.board.cells[index];
    const { x, y } = this.tileOrigin(index);
    const petalColor = PETAL_COLORS[cell.species] ?? '#ffffff';
    this.particles.burst(x + 7, y + 4, this.reducedMotion ? 4 : 10, () => {
      const angle = -Math.PI / 2 + (Math.random() - 0.5) * 2.4;
      const speed = 20 + Math.random() * 25;
      return {
        kind: 'petal',
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        ay: 35,
        drag: 2.5,
        ttl: 0.8 + Math.random() * 0.4,
        color: Math.random() < 0.7 ? petalColor : '#fff6c0',
      };
    });
    this.onBloom?.(index);
  }

  spill({ index, dir }) {
    const tile = this.tiles[index];
    if (tile.wet < 1) return;
    const water = WATER[tile.color] ?? WATER.blue;
    const { x, y } = this.tileOrigin(index);
    const edgeX = x + TILE / 2 + dir.dx * (TILE / 2) - (dir.dx === 0 ? 0.5 : 0);
    const edgeY = y + TILE / 2 + dir.dy * (TILE / 2) - (dir.dy === 0 ? 0.5 : 0);
    const spread = (Math.random() - 0.5) * 24;
    this.particles.spawn({
      x: edgeX + (dir.dx === 0 ? (Math.random() - 0.5) * 3 : 0),
      y: edgeY + (dir.dy === 0 ? (Math.random() - 0.5) * 3 : 0),
      vx: dir.dx * (18 + Math.random() * 16) + (dir.dx === 0 ? spread : 0),
      vy: dir.dy * (18 + Math.random() * 16) + (dir.dy === 0 ? spread : 0) - 8,
      ay: 70,
      ttl: 0.45,
      color: Math.random() < 0.6 ? water.light : water.base,
    });
  }

  celebrationWave(now) {
    const { depth } = this.board.flow;
    this.tiles.forEach((tile, index) => {
      if (tile.sparkled || !Number.isFinite(depth[index])) return;
      if (now < this.celebrateAt + depth[index] * 70) return;
      tile.sparkled = true;
      const { x, y } = this.tileOrigin(index);
      this.particles.burst(x + TILE / 2, y + TILE / 2, this.reducedMotion ? 1 : 3, () => ({
        kind: 'spark',
        x: x + 2 + Math.random() * (TILE - 4),
        y: y + 2 + Math.random() * (TILE - 4),
        vy: -8 - Math.random() * 10,
        ttl: 0.6 + Math.random() * 0.4,
        color: Math.random() < 0.5 ? '#ffffff' : '#fff1a0',
      }));
    });
  }

  draw(now) {
    if (!this.board) return;
    const ctx = this.artCtx;
    ctx.clearRect(0, 0, this.artWidth, this.artHeight);
    ctx.drawImage(this.staticLayer, 0, 0);

    this.board.cells.forEach((cell, index) => {
      if (cell.kind !== CellKind.ROCK) this.drawChannel(ctx, index, now);
    });
    this.board.cells.forEach((cell, index) => {
      if (cell.kind === CellKind.SPRING) this.drawSpring(ctx, index, now);
      if (cell.kind === CellKind.POT) this.drawPot(ctx, index, now);
      if (cell.locked) this.drawPin(ctx, index, now);
    });

    this.drawGroupHighlight(ctx, now);
    this.drawSpotlight(ctx, now);
    this.drawSelection(ctx, this.cursor, now, true);
    if (this.hover !== this.cursor) this.drawSelection(ctx, this.hover, now, false);
    this.particles.draw(ctx);

    const out = this.ctx;
    out.clearRect(0, 0, this.canvas.width, this.canvas.height);
    let offsetX = 0;
    let offsetY = 0;
    if (now < this.shakeUntil) {
      offsetX = Math.round((Math.random() - 0.5) * 2);
      offsetY = Math.round((Math.random() - 0.5) * 2);
    }
    out.drawImage(this.art, offsetX * this.scale, offsetY * this.scale, this.canvas.width, this.canvas.height);
  }

  drawChannel(ctx, index, now) {
    const cell = this.board.cells[index];
    const tile = this.tiles[index];
    const { x, y } = this.tileOrigin(index);
    const wetStep = Math.round(tile.wet * 4);
    const frame = Math.floor(now / 170) % 4;
    const sprite = tileArt.channel(this.themeId, cell.fixed && cell.kind === CellKind.PIPE, cell.mask, wetStep > 0 ? tile.color : null, wetStep, frame);

    const turn = this.currentTurn(tile, now);
    const sinceBump = now - tile.bumpAt;
    const bump = sinceBump < BUMP_MS ? 1 + 0.14 * Math.sin((Math.PI * sinceBump) / BUMP_MS) : 1;
    const sinceShake = now - tile.shakeAt;
    const shake = sinceShake < SHAKE_MS ? Math.round(Math.sin((sinceShake / SHAKE_MS) * Math.PI * 6) * 1.5) : 0;

    if (turn === 0 && bump === 1) {
      ctx.drawImage(sprite, x + shake, y);
      return;
    }
    ctx.save();
    ctx.translate(x + TILE / 2 + shake, y + TILE / 2);
    ctx.rotate((turn * Math.PI) / 2);
    ctx.scale(bump, bump);
    ctx.drawImage(sprite, -TILE / 2, -TILE / 2);
    ctx.restore();
  }

  drawSpring(ctx, index, now) {
    const cell = this.board.cells[index];
    const { x, y } = this.tileOrigin(index);
    const frame = Math.floor(now / 120) % tileArt.SPRING_FRAMES;
    ctx.drawImage(tileArt.spring(this.themeId, cell.color, frame), x, y);
  }

  drawPot(ctx, index, now) {
    const cell = this.board.cells[index];
    const tile = this.tiles[index];
    const { x, y } = this.tileOrigin(index);
    const twoColours = this.board.level.springs > 1;
    const potSprite = tileArt.pot(twoColours ? cell.color : null);
    // the pot sits where the channel ends
    const potX = x + 4;
    const potY = y + 6;

    if (tile.bloom <= 0) {
      const sprout = tileArt.sprout();
      ctx.drawImage(sprout, potX, potY - sprout.height + 1);
    } else {
      // outlined sprites are one pixel larger on every side
      const sprite = tileArt.flower(cell.species, { outlined: true });
      let sway = 0;
      let hop = 0;
      if (!this.reducedMotion) {
        sway = Math.round(Math.sin(now / 700 + cell.decor) * 0.6);
        if (this.celebrateAt) hop = -Math.round(Math.abs(Math.sin((now - this.celebrateAt) / 160 + index * 0.7)) * 2);
      }
      const height = sprite.height;
      const shown = Math.max(1, Math.ceil(tile.bloom * height));
      const top = potY + 1 - height;
      ctx.drawImage(sprite, 0, height - shown, sprite.width, shown, potX - 1 + sway, top + height - shown + hop, sprite.width, shown);
    }
    ctx.drawImage(potSprite, potX, potY);
  }

  drawPin(ctx, index, now) {
    const { x, y } = this.tileOrigin(index);
    const glint = Math.floor(now / 300 + index) % 6 === 0;
    ctx.fillStyle = '#1f1a2e';
    ctx.fillRect(x + 12, y + 1, 3, 3);
    ctx.fillStyle = glint ? '#ffffff' : '#ffd447';
    ctx.fillRect(x + 13, y + 2, 1, 1);
  }

  drawGroupHighlight(ctx, now) {
    const focus = this.hover >= 0 ? this.hover : this.cursor;
    if (focus < 0) return;
    const group = this.board.cells[focus].group;
    if (group < 0) return;
    const pulse = Math.floor(now / 200) % 2 === 0;
    ctx.fillStyle = tileArt.runeColor(group);
    this.board.groups.get(group).forEach((index) => {
      const { x, y } = this.tileOrigin(index);
      const inset = pulse ? 0 : 1;
      strokeRect(ctx, x + inset, y + inset, TILE - inset * 2, TILE - inset * 2);
    });
  }

  drawSpotlight(ctx, now) {
    if (this.spotlight < 0) return;
    const { x, y } = this.tileOrigin(this.spotlight);
    ctx.fillStyle = 'rgba(20, 14, 34, 0.55)';
    ctx.fillRect(0, 0, this.artWidth, y);
    ctx.fillRect(0, y + TILE, this.artWidth, this.artHeight - y - TILE);
    ctx.fillRect(0, y, x, TILE);
    ctx.fillRect(x + TILE, y, this.artWidth - x - TILE, TILE);
    const grow = Math.floor(now / 250) % 2;
    ctx.fillStyle = '#fff4dc';
    strokeRect(ctx, x - 1 - grow, y - 1 - grow, TILE + 2 + grow * 2, TILE + 2 + grow * 2);
  }

  drawSelection(ctx, index, now, strong) {
    if (index < 0 || !this.board) return;
    const { x, y } = this.tileOrigin(index);
    const out = strong && Math.floor(now / 300) % 2 === 0 ? 1 : 0;
    const left = x - out;
    const top = y - out;
    const right = x + TILE - 1 + out;
    const bottom = y + TILE - 1 + out;
    ctx.fillStyle = strong ? '#fff4dc' : 'rgba(255, 244, 220, 0.75)';
    for (const [cx, cy, sx, sy] of [[left, top, 1, 1], [right, top, -1, 1], [left, bottom, 1, -1], [right, bottom, -1, -1]]) {
      ctx.fillRect(Math.min(cx, cx + sx * 3), cy, 4, 1);
      ctx.fillRect(cx, Math.min(cy, cy + sy * 3), 1, 4);
    }
  }

  // static layer: frame, ground plates, obstacles and markings that never move

  paintStaticLayer() {
    const canvas = createCanvas(this.artWidth, this.artHeight);
    const ctx = context2d(canvas);
    this.paintFrame(ctx);
    this.board.cells.forEach((cell, index) => {
      const { x, y } = this.tileOrigin(index);
      if (cell.kind === CellKind.ROCK) {
        this.paintGround(ctx, x, y, cell.decor, false);
        this.paintObstacle(ctx, x, y);
      } else if (cell.fixed && cell.kind === CellKind.PIPE) {
        this.paintStoneSlab(ctx, x, y);
      } else {
        this.paintGround(ctx, x, y, cell.decor, true);
      }
      if (cell.group >= 0) this.paintRuneMarks(ctx, x, y, cell.group);
    });
    return canvas;
  }

  paintFrame(ctx) {
    const { frame } = this.theme;
    const w = this.artWidth;
    const h = this.artHeight;
    const f = BOARD_FRAME;
    ctx.fillStyle = '#1f1a2e';
    ctx.fillRect(1, 0, w - 2, h);
    ctx.fillRect(0, 1, w, h - 2);
    ctx.fillStyle = frame.base;
    ctx.fillRect(1, 1, w - 2, h - 2);
    ctx.fillStyle = frame.light;
    ctx.fillRect(2, 1, w - 4, 1);
    ctx.fillRect(1, 2, 1, h - 4);
    ctx.fillStyle = frame.dark;
    ctx.fillRect(2, h - 2, w - 4, 1);
    ctx.fillRect(w - 2, 2, 1, h - 4);
    // wood grain / stone seams along the frame
    for (let i = 4; i < w - 4; i += 7) {
      ctx.fillRect(i, 2 + (i % 2), 2, 1);
      ctx.fillRect(i + 3, h - 4 + (i % 2), 2, 1);
    }
    ctx.fillStyle = '#1f1a2e';
    ctx.fillRect(f - 1, f - 1, w - (f - 1) * 2, h - (f - 1) * 2);
    for (const [bx, by] of [[2, 2], [w - 4, 2], [2, h - 4], [w - 4, h - 4]]) {
      ctx.fillStyle = frame.dark;
      ctx.fillRect(bx, by, 2, 2);
      ctx.fillStyle = frame.light;
      ctx.fillRect(bx, by, 1, 1);
    }
  }

  paintGround(ctx, x, y, decor, raised) {
    const { ground } = this.theme;
    ctx.fillStyle = raised ? ground.base : ground.dark;
    ctx.fillRect(x, y, TILE, TILE);
    if (raised) {
      ctx.fillStyle = ground.light;
      ctx.fillRect(x, y, TILE, 1);
      ctx.fillRect(x, y, 1, TILE);
      ctx.fillStyle = ground.dark;
      ctx.fillRect(x, y + TILE - 1, TILE, 1);
      ctx.fillRect(x + TILE - 1, y, 1, TILE);
    }
    const tufts = 3 + (decor % 4);
    for (let i = 0; i < tufts; i++) {
      const px = 1 + Math.floor(pixelNoise(i, decor, 1) * (TILE - 3));
      const py = 1 + Math.floor(pixelNoise(decor, i, 2) * (TILE - 4));
      ctx.fillStyle = raised ? ground.speck : ground.base;
      ctx.fillRect(x + px, y + py, 1, 2);
    }
    if (pixelNoise(decor, 7, 3) < 0.35) {
      const px = 1 + Math.floor(pixelNoise(decor, 8, 4) * (TILE - 3));
      const py = 1 + Math.floor(pixelNoise(decor, 9, 5) * (TILE - 3));
      ctx.fillStyle = ground.accents[decor % ground.accents.length];
      ctx.fillRect(x + px, y + py, 1, 1);
    }
  }

  paintStoneSlab(ctx, x, y) {
    const { stone } = this.theme;
    ctx.fillStyle = stone.base;
    ctx.fillRect(x, y, TILE, TILE);
    ctx.fillStyle = stone.light;
    ctx.fillRect(x, y, TILE, 1);
    ctx.fillRect(x, y, 1, TILE);
    ctx.fillStyle = stone.dark;
    ctx.fillRect(x, y + TILE - 1, TILE, 1);
    ctx.fillRect(x + TILE - 1, y, 1, TILE);
    for (const [bx, by] of [[1, 1], [TILE - 3, 1], [1, TILE - 3], [TILE - 3, TILE - 3]]) {
      ctx.fillStyle = stone.rim;
      ctx.fillRect(x + bx, y + by, 2, 2);
      ctx.fillStyle = stone.light;
      ctx.fillRect(x + bx, y + by, 1, 1);
    }
  }

  paintObstacle(ctx, x, y) {
    const sprite = tileArt.obstacle(this.themeId);
    const ox = x + Math.floor((TILE - sprite.width) / 2);
    const oy = y + TILE - sprite.height - 1;
    ctx.fillStyle = 'rgba(20, 14, 34, 0.25)';
    ctx.fillRect(ox + 2, y + TILE - 2, sprite.width - 4, 1);
    ctx.drawImage(sprite, ox, oy);
  }

  paintRuneMarks(ctx, x, y, group) {
    ctx.fillStyle = tileArt.runeColor(group);
    strokeRect(ctx, x + 1, y + 1, TILE - 2, TILE - 2);
    ctx.fillStyle = '#1f1a2e';
    ctx.fillRect(x + 1, y + 1, 5, 5);
    ctx.drawImage(tileArt.rune(group), x + 2, y + 2);
  }
}

function strokeRect(ctx, x, y, w, h) {
  ctx.fillRect(x, y, w, 1);
  ctx.fillRect(x, y + h - 1, w, 1);
  ctx.fillRect(x, y, 1, h);
  ctx.fillRect(x + w - 1, y, 1, h);
}

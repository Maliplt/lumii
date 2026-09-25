import { audio } from '../../audio/audio.js';
import { Rng } from '../../core/rng.js';
import { t } from '../../i18n/i18n.js';
import { LEVELS_PER_WORLD, WORLDS } from '../../puzzle/levels.js';
import { WATER } from '../../render/palette.js';
import { context2d, pixelNoise } from '../../render/pixels.js';
import * as tileArt from '../../render/tileArt.js';
import { THEMES } from '../../render/themes.js';
import { progress } from '../../state/progress.js';
import { createIcon, spriteUrl } from '../assets.js';
import { h, replay, slot, starRow } from '../dom.js';

const ART_WIDTH = 90;
const ART_HEIGHT = 120;
const FRAME = 3;

// level spots in art pixels, winding from the bottom of the garden to the top
const SPOTS = [
  [22, 100], [45, 100], [68, 100],
  [68, 74], [45, 74], [22, 74],
  [22, 48], [45, 48], [68, 48],
  [68, 22], [45, 22], [22, 22],
];
const SPRING = [8, 112];

export class MapScreen {
  constructor(app, root) {
    this.app = app;
    this.root = root;
    this.worldIndex = 0;
    this.board = slot(root, 'map-board');
    this.canvas = slot(root, 'map-canvas');
    this.nodes = slot(root, 'map-nodes');
    this.clock = 0;
    this.frame = 0;

    root.addEventListener('click', (event) => {
      const target = event.target.closest('[data-action]');
      if (!target) return;
      const action = target.dataset.action;
      if (action === 'back') this.app.go('menu');
      if (action === 'prev-world') this.showWorld(this.worldIndex - 1);
      if (action === 'next-world') this.showWorld(this.worldIndex + 1);
    });
    this.bindSwipe();
    new ResizeObserver(() => this.layout()).observe(slot(root, 'map-board').parentElement);
  }

  bindSwipe() {
    const stage = this.board.parentElement;
    let startX = null;
    stage.addEventListener('pointerdown', (event) => (startX = event.clientX));
    stage.addEventListener('pointerup', (event) => {
      if (startX === null) return;
      const dx = event.clientX - startX;
      startX = null;
      if (Math.abs(dx) < 60) return;
      const forward = document.documentElement.dir === 'rtl' ? dx > 0 : dx < 0;
      this.showWorld(this.worldIndex + (forward ? 1 : -1));
    });
  }

  enter({ worldIndex = progress.nextLevel().worldIndex, celebrate = false } = {}) {
    this.worldIndex = worldIndex;
    this.render();
    if (celebrate) setTimeout(() => audio.play('unlock'), 250);
  }

  refresh() {
    if (!this.root.hidden) this.render();
  }

  showWorld(index) {
    if (index < 0 || index >= WORLDS.length || index === this.worldIndex) return;
    this.worldIndex = index;
    audio.play('swish');
    this.render();
  }

  render() {
    const world = WORLDS[this.worldIndex];
    const unlocked = progress.isWorldUnlocked(this.worldIndex);
    this.app.scenery.setTheme(world.id);
    audio.music(world.id);

    slot(this.root, 'world-name').textContent = t(`worlds.${world.id}`);
    slot(this.root, 'world-info').textContent = t(`worldInfo.${world.id}`);
    slot(this.root, 'world-stars').textContent = `${progress.worldStars(this.worldIndex)}/${LEVELS_PER_WORLD * 3}`;
    this.root.querySelector('[data-action="prev-world"]').disabled = this.worldIndex === 0;
    this.root.querySelector('[data-action="next-world"]').disabled = this.worldIndex === WORLDS.length - 1;

    const lock = slot(this.root, 'map-lock');
    lock.hidden = unlocked;
    if (!unlocked) {
      slot(this.root, 'map-lock-text').textContent = t('map.locked', { world: t(`worlds.${WORLDS[this.worldIndex - 1].id}`) });
    }

    this.renderDots();
    this.renderNodes(unlocked);
    this.layout();
    this.draw();
  }

  renderDots() {
    const dots = slot(this.root, 'world-dots');
    dots.replaceChildren(
      ...WORLDS.map((world, i) =>
        h('button', {
          className: i === this.worldIndex ? 'map-dot is-active' : 'map-dot',
          'aria-label': t(`worlds.${world.id}`),
          onclick: () => this.showWorld(i),
        }),
      ),
    );
  }

  renderNodes(unlocked) {
    const next = progress.nextLevel();
    this.nodes.replaceChildren();
    if (!unlocked) return;

    let mascotAt = null;
    SPOTS.forEach(([x, y], levelIndex) => {
      const record = progress.record(this.worldIndex, levelIndex);
      const open = progress.isLevelUnlocked(this.worldIndex, levelIndex);
      const current = next.worldIndex === this.worldIndex && next.levelIndex === levelIndex && !record;
      const classes = ['btn', 'map-node', record && 'is-done', current && 'is-current', !open && 'is-locked'].filter(Boolean);
      const node = h(
        'button',
        {
          className: classes.join(' '),
          style: { left: `${(x / ART_WIDTH) * 100}%`, top: `${(y / ART_HEIGHT) * 100}%` },
          'aria-label': `${t('map.level', { n: levelIndex + 1 })}${open ? '' : `, ${t('common.locked')}`}`,
          onclick: () => this.openLevel(levelIndex, node),
        },
        open ? String(levelIndex + 1) : createIcon('lock'),
        record ? starRow(record.stars) : null,
      );
      this.nodes.append(node);
      if (current) mascotAt = node;
    });
    // the mascot goes last so no later node is drawn over it
    if (mascotAt) {
      const mascot = h('img', { className: 'map-node-mascot', src: spriteUrl('mascot'), alt: '' });
      mascot.style.left = mascotAt.style.left;
      mascot.style.top = mascotAt.style.top;
      this.nodes.append(mascot);
    }
  }

  openLevel(levelIndex, node) {
    if (!progress.isLevelUnlocked(this.worldIndex, levelIndex)) {
      replay(node, 'is-shaking');
      audio.play('refuse');
      return;
    }
    this.app.go('game', { mode: 'story', worldIndex: this.worldIndex, levelIndex });
  }

  // sizes the board to a whole-number multiple of its art so pixels stay square
  layout() {
    if (this.root.hidden) return;
    const stage = this.board.parentElement;
    const dpr = window.devicePixelRatio || 1;
    const scale = Math.max(1, Math.floor(Math.min((stage.clientWidth * dpr) / ART_WIDTH, (stage.clientHeight * dpr) / ART_HEIGHT)));
    const width = (ART_WIDTH * scale) / dpr;
    this.board.style.width = `${width}px`;
    this.board.style.height = `${(ART_HEIGHT * scale) / dpr}px`;
    this.board.style.setProperty('--node', `${Math.round(width * 0.155)}px`);
    this.canvas.width = ART_WIDTH;
    this.canvas.height = ART_HEIGHT;
  }

  update(dt) {
    this.clock += dt;
    if (this.clock > 0.17) {
      this.clock = 0;
      this.frame = (this.frame + 1) % 4;
      this.draw();
    }
  }

  draw() {
    const world = WORLDS[this.worldIndex];
    const theme = THEMES[world.id];
    const ctx = context2d(this.canvas);
    const unlocked = progress.isWorldUnlocked(this.worldIndex);

    this.drawGround(ctx, theme);
    this.drawDecor(ctx, world.id);
    if (!unlocked) {
      ctx.fillStyle = 'rgba(20, 14, 34, 0.45)';
      ctx.fillRect(FRAME, FRAME, ART_WIDTH - FRAME * 2, ART_HEIGHT - FRAME * 2);
      return;
    }

    const points = [SPRING, ...SPOTS];
    for (let i = 0; i < points.length - 1; i++) {
      const watered = i === 0 || progress.record(this.worldIndex, i - 1) !== null;
      this.drawChannel(ctx, theme, points[i], points[i + 1], watered);
    }
    for (let i = 1; i < points.length - 1; i++) {
      if (progress.record(this.worldIndex, i - 1) && progress.record(this.worldIndex, i)) {
        this.drawBloom(ctx, world, points[i], points[i + 1], i);
      }
    }
    ctx.drawImage(tileArt.spring(world.id, 'blue', this.frame * 2), SPRING[0] - 8, SPRING[1] - 8);
  }

  drawGround(ctx, theme) {
    const { ground, frame } = theme;
    ctx.fillStyle = '#1f1a2e';
    ctx.fillRect(0, 0, ART_WIDTH, ART_HEIGHT);
    ctx.fillStyle = frame.base;
    ctx.fillRect(1, 1, ART_WIDTH - 2, ART_HEIGHT - 2);
    ctx.fillStyle = frame.light;
    ctx.fillRect(1, 1, ART_WIDTH - 2, 1);
    ctx.fillStyle = '#1f1a2e';
    ctx.fillRect(FRAME - 1, FRAME - 1, ART_WIDTH - (FRAME - 1) * 2, ART_HEIGHT - (FRAME - 1) * 2);
    ctx.fillStyle = ground.base;
    ctx.fillRect(FRAME, FRAME, ART_WIDTH - FRAME * 2, ART_HEIGHT - FRAME * 2);
    for (let y = FRAME; y < ART_HEIGHT - FRAME; y++) {
      for (let x = FRAME; x < ART_WIDTH - FRAME; x++) {
        const n = pixelNoise(x, y, this.worldIndex);
        if (n < 0.05) {
          ctx.fillStyle = ground.speck;
          ctx.fillRect(x, y, 1, 2);
        } else if (n > 0.996) {
          ctx.fillStyle = ground.accents[Math.floor(n * 1000) % ground.accents.length];
          ctx.fillRect(x, y, 1, 1);
        }
      }
    }
  }

  // a hedge of the world's obstacles along the top edge, clear of the level spots
  drawDecor(ctx, themeId) {
    const rng = new Rng(`map/${themeId}`);
    const sprite = tileArt.obstacle(themeId);
    for (const x of [4, 20, 38, 56, 72]) {
      if (rng.chance(0.75)) ctx.drawImage(sprite, x + rng.int(-2, 2), FRAME);
    }
  }

  drawChannel(ctx, theme, [x1, y1], [x2, y2], watered) {
    const water = WATER.blue;
    const corner = [x2, y1];
    const segments = [[[x1, y1], corner], [corner, [x2, y2]]];
    const stamp = (size, color) => {
      ctx.fillStyle = color;
      for (const [[ax, ay], [bx, by]] of segments) {
        const left = Math.min(ax, bx) - Math.floor(size / 2);
        const top = Math.min(ay, by) - Math.floor(size / 2);
        ctx.fillRect(left, top, Math.abs(bx - ax) + size, Math.abs(by - ay) + size);
      }
    };
    stamp(8, theme.rim.dark);
    stamp(6, theme.rim.base);
    stamp(4, watered ? water.base : theme.bed.base);
    if (!watered) return;
    ctx.fillStyle = water.light;
    for (const [[ax, ay], [bx, by]] of segments) {
      const length = Math.abs(bx - ax) + Math.abs(by - ay);
      for (let s = 0; s <= length; s++) {
        if ((s + this.frame * 2) % 7 !== 0) continue;
        const x = ax + Math.sign(bx - ax) * Math.min(s, Math.abs(bx - ax));
        const y = ay + Math.sign(by - ay) * Math.min(s, Math.abs(by - ay));
        ctx.fillRect(x - 1 + (s % 2), y - 1, 1, 1);
      }
    }
  }

  drawBloom(ctx, world, [x1, y1], [x2, y2], i) {
    const species = world.species[i % world.species.length];
    const sprite = tileArt.flower(species);
    const midX = Math.round((x1 + x2) / 2);
    const aboveY = y1 === y2 ? y1 - 15 : Math.round((y1 + y2) / 2) - 5;
    const sideX = y1 === y2 ? midX - 3 : x1 + (x1 < ART_WIDTH / 2 ? -12 : 5);
    ctx.drawImage(sprite, sideX, aboveY);
  }
}

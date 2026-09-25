import { audio } from '../../audio/audio.js';
import { hashString } from '../../core/rng.js';
import { t } from '../../i18n/i18n.js';
import { Board, CellKind, starThresholds, starsFor } from '../../puzzle/board.js';
import { LEVELS_PER_WORLD, WORLDS, getDailyLevel, getStoryLevel, getZenLevel, todayKey } from '../../puzzle/levels.js';
import { BoardRenderer } from '../../render/boardRenderer.js';
import * as tileArt from '../../render/tileArt.js';
import { progress } from '../../state/progress.js';
import { openComplete } from '../dialogs/completeDialog.js';
import { openPause } from '../dialogs/pauseDialog.js';
import { h, replay, slot, vibrate } from '../dom.js';

const BANNER_MS = 2300;
const TUTORIAL_TEXT = ['coach.tap', 'coach.keepGoing', 'coach.flower'];
const CELEBRATION_MS = 1300;
const LEAK_TIP_AFTER_MOVES = 4;

function buildLevel(descriptor) {
  switch (descriptor.mode) {
    case 'daily':
      return getDailyLevel(descriptor.dateKey);
    case 'zen':
      return getZenLevel(descriptor.size, descriptor.seed, progress.worldsUnlocked());
    default:
      return getStoryLevel(descriptor.worldIndex, descriptor.levelIndex);
  }
}

// the puzzle itself
export class GameScreen {
  constructor(app, root) {
    this.app = app;
    this.root = root;
    this.state = 'idle';
    this.timers = [];
    this.wrap = slot(root, 'board-wrap');
    this.canvas = slot(root, 'board');
    this.buttons = {
      hint: root.querySelector('[data-action="hint"]'),
      undo: root.querySelector('[data-action="undo"]'),
      restart: root.querySelector('[data-action="restart"]'),
    };
    this.renderer = new BoardRenderer(this.canvas);
    this.renderer.onFill = () => this.onFill();
    this.renderer.onBloom = (index) => this.onBloom(index);

    this.bindPointer();
    window.addEventListener('keydown', (event) => this.onKey(event));
    root.addEventListener('click', (event) => {
      const action = event.target.closest('[data-action]')?.dataset.action;
      if (action === 'pause') this.pause();
      if (action === 'undo') this.undo();
      if (action === 'hint') this.hint();
      if (action === 'restart') this.restart();
    });
    new ResizeObserver(() => this.layout()).observe(this.wrap);
    progress.on('change', () => this.state !== 'idle' && this.updateDewdrops());
  }

  // lifecycle

  enter(descriptor) {
    const resolved = { ...descriptor };
    if (resolved.mode === 'daily') {
      resolved.dateKey = todayKey();
      if (progress.dailyStatus(resolved.dateKey).doneToday) this.app.toasts.show(t('daily.done'), 'sun');
    }
    if (resolved.mode === 'zen' && resolved.seed == null) resolved.seed = hashString(`zen/${Date.now()}/${Math.random()}`);
    this.load(resolved);
  }

  exit() {
    this.state = 'idle';
    this.clearTimers();
    this.app.coach.hide();
  }

  load(descriptor) {
    this.clearTimers();
    this.descriptor = descriptor;
    this.level = buildLevel(descriptor);
    this.board = new Board(this.level);
    this.newSpecies = [];
    this.fillStep = 0;
    this.lastFillSound = 0;
    this.renderer.setBoard(this.board, this.level.theme);
    this.renderer.cursor = -1;
    this.layout();
    this.app.scenery.setTheme(this.level.theme);
    audio.music(this.level.theme);

    this.tutorial = this.level.tutorialSteps ? { steps: this.level.tutorialSteps, index: 0 } : null;
    this.root.querySelector('.toolbar').classList.toggle('is-hidden', Boolean(this.tutorial));
    this.root.classList.toggle('is-zen', this.level.mode === 'zen');
    this.state = 'playing';
    this.refresh();
    this.showBanner();
    this.later(BANNER_MS - 200, () => (this.tutorial ? this.showTutorialStep() : this.showLevelTip()));
  }

  refresh() {
    if (this.state === 'idle') return;
    slot(this.root, 'level-title').textContent = this.title();
    this.updateHud(false);
  }

  title() {
    if (this.level.mode === 'daily') return t('game.daily');
    if (this.level.mode === 'zen') return t('game.zen');
    return t('game.title', { world: t(`worlds.${WORLDS[this.level.worldIndex].id}`), n: this.level.levelIndex + 1 });
  }

  layout() {
    if (!this.board || this.root.hidden) return;
    const rect = this.wrap.getBoundingClientRect();
    this.renderer.layout(rect.width - 8, rect.height - 8);
  }

  update(dt, now) {
    if (this.state === 'idle') return;
    this.renderer.update(dt, now);
    this.renderer.draw(now);
  }

  onHidden() {
    if (this.state === 'playing' && !this.tutorial) this.pause();
  }

  later(ms, callback) {
    this.timers.push(setTimeout(callback, ms));
  }

  clearTimers() {
    this.timers.forEach(clearTimeout);
    this.timers = [];
  }

  // input

  bindPointer() {
    this.canvas.addEventListener('pointerdown', (event) => {
      if (event.pointerType === 'mouse' && event.button !== 0 && event.button !== 2) return;
      const index = this.renderer.tileAt(event.clientX, event.clientY);
      if (index < 0) return;
      event.preventDefault();
      this.renderer.cursor = -1;
      this.touching = event.pointerType === 'touch';
      this.tap(index, event.button === 2 ? -1 : 1);
    });
    this.canvas.addEventListener('contextmenu', (event) => event.preventDefault());
    this.canvas.addEventListener('pointermove', (event) => {
      if (event.pointerType === 'mouse') this.renderer.hover = this.renderer.tileAt(event.clientX, event.clientY);
    });
    this.canvas.addEventListener('pointerleave', () => (this.renderer.hover = -1));
  }

  onKey(event) {
    if (this.state === 'idle' || this.app.modals.isOpen || this.app.changing) return;
    const key = event.key.toLowerCase();
    if (key === 'escape' || key === 'p') {
      this.pause();
      return;
    }
    if (this.state !== 'playing') return;

    const arrows = { arrowup: [0, -1], arrowdown: [0, 1], arrowleft: [-1, 0], arrowright: [1, 0] };
    this.touching = false;
    if (arrows[key]) {
      event.preventDefault();
      this.moveCursor(...arrows[key]);
      return;
    }
    const onButton = document.activeElement?.tagName === 'BUTTON';
    if ((key === 'enter' || key === ' ' || key === 'e') && !onButton && this.renderer.cursor >= 0) {
      event.preventDefault();
      this.tap(this.renderer.cursor, 1);
    } else if (key === 'q' && this.renderer.cursor >= 0) {
      this.tap(this.renderer.cursor, -1);
    } else if (key === 'z' || key === 'backspace') {
      this.undo();
    } else if (key === 'h') {
      this.hint();
    } else if (key === 'r') {
      this.restart();
    }
  }

  moveCursor(dx, dy) {
    const { cols, rows } = this.board;
    let cursor = this.renderer.cursor;
    if (cursor < 0) {
      cursor = this.board.cells.findIndex((_, i) => this.board.canRotate(i));
    } else {
      const x = Math.min(cols - 1, Math.max(0, (cursor % cols) + dx));
      const y = Math.min(rows - 1, Math.max(0, Math.floor(cursor / cols) + dy));
      cursor = y * cols + x;
    }
    this.renderer.cursor = cursor;
  }

  // actions

  tap(index, turns) {
    if (this.state !== 'playing') return;
    const now = performance.now();
    const expected = this.tutorial?.steps[this.tutorial.index];
    if ((this.tutorial && index !== expected) || !this.board.canRotate(index)) {
      this.renderer.refused(index, now);
      audio.play('refuse');
      this.buzz(18);
      return;
    }
    if (this.app.coach.visible && !this.tutorial) this.app.coach.dismiss();

    const unit = this.board.rotate(index, turns);
    this.renderer.turned(unit, turns, now);
    audio.play('tap');
    this.buzz(6);
    this.afterChange(now);
  }

  undo() {
    if (this.state !== 'playing' || this.tutorial) return;
    const last = this.board.undo();
    if (!last) {
      replay(this.buttons.undo, 'is-shaking');
      audio.play('refuse');
      return;
    }
    const now = performance.now();
    this.renderer.turned(last.unit, -last.turns, now);
    audio.play('undo');
    this.afterChange(now);
  }

  hint() {
    if (this.state !== 'playing' || this.tutorial) return;
    const index = this.board.findHint();
    if (index < 0) {
      this.app.toasts.show(t('game.noHint'), 'check');
      return;
    }
    if (!progress.spendDewdrop()) {
      replay(this.buttons.hint, 'is-shaking');
      audio.play('refuse');
      this.app.toasts.show(t('game.noDewdrops'), 'dewdrop');
      return;
    }
    if (this.app.coach.visible) this.app.coach.dismiss();
    const now = performance.now();
    const { unit, turns } = this.board.applyHint(index);
    this.renderer.turned(unit, turns, now);
    this.renderer.hinted(unit, now);
    audio.play('hint');
    this.afterChange(now);
  }

  restart() {
    if (this.state !== 'playing') return;
    this.board.reset();
    this.renderer.setBoard(this.board, this.level.theme);
    this.layout();
    audio.play('swish');
    this.fillStep = 0;
    if (this.tutorial) {
      this.tutorial.index = 0;
      this.showTutorialStep();
    }
    this.updateHud(true);
  }

  pause() {
    if (this.state !== 'playing') return;
    this.state = 'paused';
    const story = this.level.mode === 'story';
    openPause(this.app, {
      leaveTo: story ? 'map' : 'menu',
      onResume: () => {
        if (this.state === 'paused') this.state = 'playing';
      },
      onRestart: () => {
        this.state = 'playing';
        this.restart();
      },
      onLeave: () => this.leave(),
    });
  }

  leave() {
    if (this.level.mode === 'story') this.app.go('map', { worldIndex: this.level.worldIndex });
    else this.app.go('menu');
  }

  afterChange(now) {
    this.fillStep = 0;
    this.renderer.syncFlow(now);
    this.updateHud(true);
    if (this.tutorial) this.advanceTutorial();
    else this.maybeShowLeakTip();
    if (this.board.solved) this.win();
  }

  // board events

  onFill() {
    const now = performance.now();
    if (now - this.lastFillSound < 45) return;
    this.lastFillSound = now;
    audio.play('fill', this.fillStep++);
  }

  onBloom(index) {
    audio.play('bloom');
    const species = this.board.cells[index].species;
    if (species && progress.discover(species)) {
      this.newSpecies.push(species);
      const portrait = tileArt.portrait(species);
      portrait.className = 'toast-portrait';
      this.app.toasts.show(t('toast.discovered', { name: t(`flowers.${species}`) }), portrait);
    }
    this.updateHud(true);
  }

  // HUD

  updateHud(animate) {
    const { flow, moves, level } = this.board;
    this.setCounter('moves', String(moves), animate);
    this.setCounter('flowers', `${flow.potsWatered}/${flow.potsTotal}`, animate);
    this.updateDewdrops();

    const meter = slot(this.root, 'star-meter');
    if (level.mode === 'zen') {
      meter.replaceChildren();
      return;
    }
    const earned = starsFor(moves, level.par);
    const { three } = starThresholds(level.par);
    meter.title = t('game.starGoal', { n: three });
    meter.setAttribute('aria-label', meter.title);
    meter.replaceChildren(
      ...[0, 1, 2].map((i) => h('span', { className: i < earned ? 'star is-lit' : 'star' })),
      h('span', {}, `≤${three}`),
    );
  }

  setCounter(name, value, animate) {
    const element = slot(this.root, name);
    if (element.textContent === value) return;
    element.textContent = value;
    if (animate) replay(element, 'is-bumped');
  }

  updateDewdrops() {
    const badge = slot(this.root, 'dewdrops');
    badge.textContent = progress.dewdrops;
    badge.classList.toggle('is-empty', progress.dewdrops === 0);
  }

  showBanner() {
    const banner = slot(this.root, 'banner');
    slot(this.root, 'banner-title').textContent = this.title();
    slot(this.root, 'banner-goal').textContent = t('game.goal');
    banner.hidden = false;
    replay(banner, 'level-banner');
    this.later(BANNER_MS, () => (banner.hidden = true));
  }

  // tutorial and tips

  tilePoint(index) {
    return () => this.renderer.tileCenterOnScreen(index);
  }

  boardRect() {
    return this.canvas.getBoundingClientRect();
  }

  elementPoint(element) {
    return () => {
      const rect = element.getBoundingClientRect();
      return { x: rect.left + rect.width / 2, y: rect.top + rect.height * 0.35 };
    };
  }

  showTutorialStep() {
    if (!this.tutorial || this.state !== 'playing') return;
    const index = this.tutorial.steps[this.tutorial.index];
    this.renderer.spotlight = index;
    this.app.coach.show({
      text: TUTORIAL_TEXT[this.tutorial.index] ?? 'coach.keepGoing',
      target: this.tilePoint(index),
      avoid: () => this.boardRect(),
    });
  }

  advanceTutorial() {
    const { steps } = this.tutorial;
    const index = steps[this.tutorial.index];
    if (this.board.cells[index].mask !== this.board.cells[index].solution) return;
    this.tutorial.index++;
    this.renderer.spotlight = -1;
    this.app.coach.hide();
    if (this.tutorial.index < steps.length) this.later(500, () => this.showTutorialStep());
  }

  showLevelTip() {
    const tip = this.level.tip;
    if (!tip || progress.hasSeenTip(tip) || this.state !== 'playing') return;
    const cells = this.board.cells;
    const first = (test) => cells.findIndex(test);
    const targets = {
      hint: () => this.elementPoint(this.buttons.hint),
      undo: () => this.elementPoint(this.buttons.undo),
      goal: () => this.tilePoint(first((c) => c.kind === CellKind.POT)),
      stone: () => this.tilePoint(first((c) => c.fixed && c.kind === CellKind.PIPE)),
      rune: () => this.tilePoint(first((c) => c.group >= 0)),
      springs: () => this.tilePoint(first((c) => c.kind === CellKind.SPRING && c.color === 'gold')),
      sky: () => null,
    };
    if (tip === 'hint' && progress.dewdrops === 0) progress.addDewdrops(1);
    progress.markTipSeen(tip);
    const onBoard = !['hint', 'undo', 'sky'].includes(tip);
    this.app.coach.show({
      text: `coach.${tip}`,
      target: targets[tip]?.() ?? null,
      button: true,
      avoid: onBoard ? () => this.boardRect() : null,
    });
  }

  maybeShowLeakTip() {
    if (progress.hasSeenTip('leak') || this.level.mode !== 'story' || this.app.coach.visible) return;
    const { leaks } = this.board.flow;
    if (this.board.moves < LEAK_TIP_AFTER_MOVES || leaks.length === 0) return;
    const { index, dir } = leaks[0];
    progress.markTipSeen('leak');
    this.app.coach.show({
      text: 'coach.leak',
      button: true,
      avoid: () => this.boardRect(),
      target: () => {
        const center = this.renderer.tileCenterOnScreen(index);
        return { x: center.x + (dir.dx * center.size) / 2, y: center.y + (dir.dy * center.size) / 2 };
      },
    });
  }

  // winning

  win() {
    this.state = 'winning';
    this.renderer.spotlight = -1;
    this.renderer.hover = -1;
    this.renderer.cursor = -1;
    this.app.coach.hide();

    const waitForWater = () => {
      if (this.state !== 'winning') return;
      if (!this.renderer.isSettled()) {
        this.later(80, waitForWater);
        return;
      }
      this.renderer.celebrate(performance.now());
      audio.play('win');
      this.buzz([12, 50, 24]);
      const result = this.record();
      this.later(CELEBRATION_MS, () => this.showResult(result));
    };
    waitForWater();
  }

  record() {
    const { moves } = this.board;
    const { par, mode } = this.level;
    const stars = starsFor(moves, par);
    const base = { mode, moves, stars, reward: 0, news: [], newSpecies: this.newSpecies };

    if (mode === 'daily') {
      const outcome = progress.completeDaily(this.level.dateKey);
      const { best } = progress.dailyStatus(this.level.dateKey);
      return { ...base, streak: outcome.streak, bestStreak: best, reward: outcome.reward };
    }
    if (mode === 'zen') {
      progress.addZenSolved();
      return { ...base, tended: progress.zenSolved };
    }

    const { worldIndex, levelIndex } = this.level;
    const outcome = progress.completeLevel(worldIndex, levelIndex, stars, moves);
    const worldName = t(`worlds.${WORLDS[worldIndex].id}`);
    const news = [];
    if (outcome.worldCompleted) {
      news.push(t('complete.worldDone', { world: worldName }));
      if (WORLDS[worldIndex + 1]) news.push(t('complete.nextWorld', { world: t(`worlds.${WORLDS[worldIndex + 1].id}`) }));
    }
    if (outcome.worldPerfected) news.push(t('complete.golden', { world: worldName }));
    return {
      ...base,
      reward: outcome.dewdropsEarned,
      best: progress.record(worldIndex, levelIndex).moves,
      news,
      worldCompleted: outcome.worldCompleted,
    };
  }

  showResult(result) {
    if (this.state !== 'winning') return;
    this.state = 'done';
    openComplete(this.app, result, {
      onNext: () => this.next(result),
      onReplay: () => this.app.go('game', { ...this.descriptor }),
      onMap: () => this.app.go('map', { worldIndex: this.level.worldIndex }),
      onMenu: () => this.app.go('menu'),
    });
  }

  next(result) {
    if (this.level.mode === 'zen') {
      this.app.go('game', { mode: 'zen', size: this.descriptor.size });
      return;
    }
    const { worldIndex, levelIndex } = this.level;
    if (levelIndex + 1 < LEVELS_PER_WORLD) {
      this.app.go('game', { mode: 'story', worldIndex, levelIndex: levelIndex + 1 });
    } else if (worldIndex + 1 < WORLDS.length) {
      this.app.go('map', { worldIndex: worldIndex + 1, celebrate: result.worldCompleted });
    } else {
      this.app.go('map', { worldIndex });
    }
  }

  // haptics only make sense for touch play
  buzz(pattern) {
    if (this.touching && progress.settings.vibration) vibrate(pattern);
  }
}

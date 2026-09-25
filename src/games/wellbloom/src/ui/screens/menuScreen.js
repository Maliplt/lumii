import { audio } from '../../audio/audio.js';
import { GAME } from '../../config.js';
import { i18n, t } from '../../i18n/i18n.js';
import { ALL_SPECIES, LEVELS_PER_WORLD, WORLDS } from '../../puzzle/levels.js';
import { context2d } from '../../render/pixels.js';
import * as tileArt from '../../render/tileArt.js';
import { THEMES } from '../../render/themes.js';
import { progress } from '../../state/progress.js';
import { spriteUrl } from '../assets.js';
import { openZenDialog } from '../dialogs/zenDialog.js';
import { replay, slot } from '../dom.js';

// the logo is drawn in two colours: water for "Well", blossom for "bloom"
const LOGO_SPLIT = 4;
const LOGO_WATER = ['#9ee0ff', '#2a6db5'];
const LOGO_BLOSSOM = ['#ffb3d1', '#c9508c'];

export class MenuScreen {
  constructor(app, root) {
    this.app = app;
    this.root = root;
    this.mascot = root.querySelector('.mascot');
    this.garden = slot(root, 'garden');
    this.gardenClock = 0;
    this.blinkAt = 0;
    this.buildLogo();
    root.addEventListener('click', (event) => {
      const action = event.target.closest('[data-action]')?.dataset.action;
      if (action) this.act(action, event.target.closest('[data-action]'));
    });
    progress.on('change', () => !root.hidden && this.refresh());
  }

  buildLogo() {
    const holder = this.root.querySelector('.logo-letters');
    [...GAME.title].forEach((letter, i) => {
      const [color, shade] = i < LOGO_SPLIT ? LOGO_WATER : LOGO_BLOSSOM;
      const span = document.createElement('span');
      span.textContent = letter;
      span.style.setProperty('--i', i);
      span.style.setProperty('--letter', color);
      span.style.setProperty('--shade', shade);
      holder.append(span);
    });
  }

  enter() {
    this.app.scenery.setTheme('meadow');
    audio.music('menu');
    this.refresh();
  }

  refresh() {
    const started = Object.keys(progress.data.levels).length > 0;
    const next = progress.nextLevel();
    slot(this.root, 'play-label').textContent = t(started ? 'menu.continue' : 'menu.play');
    slot(this.root, 'play-sub').textContent = started
      ? t('game.title', { world: t(`worlds.${WORLDS[next.worldIndex].id}`), n: next.levelIndex + 1 })
      : '';

    const daily = progress.dailyStatus();
    slot(this.root, 'daily-sub').textContent = daily.streak > 0 ? i18n.tp('daily.streak', daily.streak) : '';
    slot(this.root, 'daily-badge').hidden = daily.doneToday;

    const zenButton = this.root.querySelector('[data-action="zen"]');
    const zenOpen = progress.isWorldComplete(0);
    zenButton.classList.toggle('is-locked', !zenOpen);
    slot(this.root, 'zen-sub').textContent = zenOpen
      ? progress.zenSolved > 0 ? i18n.tp('zen.tended', progress.zenSolved) : ''
      : t('menu.zenLocked');

    slot(this.root, 'stars').textContent = `${progress.totalStars()}/${WORLDS.length * LEVELS_PER_WORLD * 3}`;
    slot(this.root, 'dewdrops').textContent = progress.dewdrops;
    this.drawGarden(performance.now());
  }

  act(action, button) {
    switch (action) {
      case 'play': {
        const started = Object.keys(progress.data.levels).length > 0;
        if (started) this.app.go('map', { worldIndex: progress.nextLevel().worldIndex });
        else this.app.go('game', { mode: 'story', worldIndex: 0, levelIndex: 0 });
        break;
      }
      case 'daily':
        this.app.go('game', { mode: 'daily' });
        break;
      case 'zen':
        if (progress.isWorldComplete(0)) {
          openZenDialog(this.app);
        } else {
          replay(button, 'is-shaking');
          audio.play('refuse');
          this.app.toasts.show(t('menu.zenLocked'), 'lock');
        }
        break;
      case 'herbarium':
        this.app.go('herbarium');
        break;
      case 'settings':
        this.app.openSettings();
        break;
    }
  }

  update(dt, now) {
    if (now > this.blinkAt) {
      const blinking = this.mascot.dataset.sprite === 'mascotBlink';
      this.mascot.dataset.sprite = blinking ? 'mascot' : 'mascotBlink';
      this.mascot.src = spriteUrl(this.mascot.dataset.sprite);
      this.blinkAt = now + (blinking ? 2200 + Math.random() * 2500 : 140);
    }
    this.gardenClock += dt;
    if (this.gardenClock > 0.12) {
      this.gardenClock = 0;
      this.drawGarden(now);
    }
  }

  // a strip of pots along the bottom that fills up as flowers are discovered
  drawGarden(now) {
    const px = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--px')) || 3;
    const width = Math.ceil(this.garden.clientWidth / px);
    const height = 30;
    if (width <= 0) return;
    if (this.garden.width !== width) {
      this.garden.width = width;
      this.garden.height = height;
    }
    const ctx = context2d(this.garden);
    const ground = THEMES.meadow.ground;
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = '#1f1a2e';
    ctx.fillRect(0, height - 9, width, 9);
    ctx.fillStyle = ground.base;
    ctx.fillRect(0, height - 8, width, 8);
    ctx.fillStyle = ground.light;
    ctx.fillRect(0, height - 8, width, 1);
    for (let x = 3; x < width; x += 5) {
      ctx.fillStyle = ground.speck;
      ctx.fillRect(x, height - 6 + (x % 3), 1, 2);
    }

    const discovered = ALL_SPECIES.filter((species) => progress.isDiscovered(species));
    const spacing = 16;
    const count = Math.floor((width - 8) / spacing);
    const offset = Math.floor((width - count * spacing) / 2);
    for (let i = 0; i < count; i++) {
      const x = offset + i * spacing + 4;
      const species = discovered.length > 0 ? discovered[i % discovered.length] : null;
      ctx.drawImage(tileArt.pot(null), x, height - 14);
      if (species) {
        const sway = Math.round(Math.sin(now / 650 + i * 1.3) * 0.6);
        ctx.drawImage(tileArt.flower(species), x + sway, height - 24);
      } else {
        ctx.drawImage(tileArt.sprout(), x, height - 18);
      }
    }
  }
}

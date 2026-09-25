import { audio } from '../audio/audio.js';
import { i18n } from '../i18n/i18n.js';
import { Scenery } from '../render/scenery.js';
import { progress } from '../state/progress.js';
import { hydrateAssets } from './assets.js';
import { Coach } from './coach.js';
import { openSettings } from './dialogs/settingsDialog.js';
import { Modals } from './modal.js';
import { GameScreen } from './screens/gameScreen.js';
import { HerbariumScreen } from './screens/herbariumScreen.js';
import { MapScreen } from './screens/mapScreen.js';
import { MenuScreen } from './screens/menuScreen.js';
import { Toasts } from './toasts.js';
import { Wipe } from './wipe.js';

// owns the shared services (scenery, dialogs, toasts, coach) and moves between screens
export class App {
  constructor() {
    this.scenery = new Scenery(document.getElementById('scenery'));
    this.wipe = new Wipe(document.getElementById('wipe'));
    this.modals = new Modals(document.getElementById('modal-root'));
    this.toasts = new Toasts(document.getElementById('toasts'));
    this.coach = new Coach(document.getElementById('coach'));
    this.screens = {
      menu: new MenuScreen(this, document.getElementById('screen-menu')),
      map: new MapScreen(this, document.getElementById('screen-map')),
      game: new GameScreen(this, document.getElementById('screen-game')),
      herbarium: new HerbariumScreen(this, document.getElementById('screen-herbarium')),
    };
    this.current = null;
    this.changing = false;
  }

  start() {
    hydrateAssets();
    this.applySettings(progress.settings);
    progress.on('settings', (settings) => this.applySettings(settings));
    i18n.on('change', () => {
      this.coach.refreshText();
      Object.values(this.screens).forEach((screen) => screen.refresh?.());
    });

    // browsers only allow audio after a user gesture
    document.addEventListener('pointerdown', () => audio.unlock(), { capture: true });
    document.addEventListener('keydown', () => audio.unlock(), { capture: true });
    document.addEventListener('click', (event) => {
      const button = event.target.closest('.btn');
      if (button && !button.closest('[data-own-sounds]')) audio.play('button');
    });
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) this.current?.onHidden?.();
    });

    this.show('menu');
    let last = performance.now();
    const frame = (now) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      this.scenery.update(dt);
      this.scenery.draw(now);
      this.current?.update?.(dt, now);
      requestAnimationFrame(frame);
    };
    requestAnimationFrame(frame);
  }

  show(name, params = {}) {
    this.coach.hide();
    this.modals.closeAll();
    if (this.current) {
      this.current.exit?.();
      this.current.root.hidden = true;
    }
    this.current = this.screens[name];
    this.current.root.hidden = false;
    this.current.enter?.(params);
  }

  // switches screens behind the pixel wipe
  async go(name, params = {}) {
    if (this.changing) return;
    this.changing = true;
    audio.play('swish');
    await this.wipe.cover();
    this.show(name, params);
    await this.wipe.reveal();
    this.changing = false;
  }

  openSettings() {
    openSettings(this);
  }

  applySettings(settings) {
    if (settings.language && settings.language !== i18n.language) i18n.setLanguage(settings.language);
    audio.setVolumes({ music: settings.music, sfx: settings.sfx });
    const reduced = settings.reducedMotion;
    document.body.classList.toggle('reduced-motion', reduced);
    this.scenery.reducedMotion = reduced;
    this.wipe.instant = reduced;
    this.screens.game.renderer.reducedMotion = reduced;
  }
}

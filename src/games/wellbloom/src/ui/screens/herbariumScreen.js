import { audio } from '../../audio/audio.js';
import { t } from '../../i18n/i18n.js';
import { ALL_SPECIES, WORLDS, homeWorldOf } from '../../puzzle/levels.js';
import * as tileArt from '../../render/tileArt.js';
import { progress } from '../../state/progress.js';
import { h, slot } from '../dom.js';

// collection of every flower the player has bloomed
export class HerbariumScreen {
  constructor(app, root) {
    this.app = app;
    this.root = root;
    root.querySelector('[data-action="back"]').addEventListener('click', () => this.app.go('menu'));
  }

  enter() {
    this.app.scenery.setTheme('meadow');
    audio.music('menu');
    this.render();
  }

  refresh() {
    if (!this.root.hidden) this.render();
  }

  render() {
    const found = ALL_SPECIES.filter((species) => progress.isDiscovered(species)).length;
    slot(this.root, 'found').textContent = t('herbarium.found', { n: found, total: ALL_SPECIES.length });
    slot(this.root, 'grid').replaceChildren(...ALL_SPECIES.map((species, i) => this.card(species, i)));
  }

  card(species, i) {
    const known = progress.isDiscovered(species);
    const home = homeWorldOf(species);
    const golden = known && progress.isWorldPerfect(home);
    const portrait = tileArt.portrait(species, { golden, silhouette: !known });
    const classes = ['flower-card', 'panel', !known && 'is-unknown', golden && 'is-golden'].filter(Boolean);
    const card = h(
      'article',
      { className: classes.join(' ') },
      portrait,
      h('strong', {}, known ? t(`flowers.${species}`) : '???'),
      h('small', {}, known ? (golden ? t('herbarium.golden') : t('herbarium.grows', { world: t(`worlds.${WORLDS[home].id}`) })) : t('herbarium.unknown')),
    );
    card.style.setProperty('--i', i);
    return card;
  }
}

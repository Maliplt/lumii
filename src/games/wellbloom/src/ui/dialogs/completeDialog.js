import { audio } from '../../audio/audio.js';
import { i18n, t } from '../../i18n/i18n.js';
import * as tileArt from '../../render/tileArt.js';
import { createIcon } from '../assets.js';
import { h } from '../dom.js';

const STAR_START_MS = 380;
const STAR_STEP_MS = 300;

// celebration after a solved garden
export function openComplete(app, result, handlers) {
  const body = [];
  const showStars = result.mode !== 'zen';
  let starRow = null;

  if (showStars) {
    starRow = h('div', { className: 'complete-stars' }, [0, 1, 2].map(() => h('span', { className: 'star' })));
    body.push(starRow);
  }

  body.push(stats(result));

  if (result.reward > 0) {
    body.push(h('div', { className: 'reward' }, createIcon('dewdrop'), h('span', {}, `+${result.reward}`)));
  }

  if (result.newSpecies.length > 0) {
    body.push(
      h(
        'div',
        { className: 'news news-flowers', dataset: { label: t('complete.newFlowers') } },
        result.newSpecies.map((species) =>
          h('figure', {}, tileArt.portrait(species), h('figcaption', {}, t(`flowers.${species}`))),
        ),
      ),
    );
  }
  for (const line of result.news) body.push(h('div', { className: 'news' }, line));

  const dialog = app.modals.open({
    title: i18n.pick('complete.titles'),
    className: 'complete',
    dismissible: false,
    body,
    actions: actionsFor(result.mode, handlers),
  });

  if (starRow) {
    [...starRow.children].forEach((star, i) => {
      if (i >= result.stars) return;
      setTimeout(() => {
        star.classList.add('is-lit', 'is-popping');
        audio.play('star', i);
      }, STAR_START_MS + i * STAR_STEP_MS);
    });
  }
  if (result.reward > 0) setTimeout(() => audio.play('dewdrop'), STAR_START_MS + 3 * STAR_STEP_MS + 100);
  if (result.newSpecies.length > 0) setTimeout(() => audio.play('discover'), STAR_START_MS + 4 * STAR_STEP_MS + 200);

  return dialog;
}

function stats(result) {
  const box = (labelText, value) => h('div', { className: 'stat-box' }, h('span', {}, labelText), h('strong', {}, value));
  if (result.mode === 'story') {
    return h('div', { className: 'complete-stats' }, box(t('complete.moves'), result.moves), box(t('complete.best'), result.best));
  }
  if (result.mode === 'daily') {
    return h(
      'div',
      { className: 'complete-daily' },
      h('div', { className: 'streak' }, createIcon('flame', 'icon icon-large'), h('strong', {}, i18n.tp('daily.streak', result.streak))),
      h('p', { className: 'section-label' }, t('daily.best', { n: result.bestStreak })),
    );
  }
  return h('p', {}, i18n.tp('zen.tended', result.tended));
}

function actionsFor(mode, { onNext, onReplay, onMap, onMenu }) {
  if (mode === 'story') {
    return [
      { icon: 'grid', ariaLabel: t('complete.map'), onClick: onMap },
      { icon: 'restart', ariaLabel: t('complete.replay'), onClick: onReplay },
      { label: t('complete.next'), icon: 'next', variant: 'primary', onClick: onNext },
    ];
  }
  if (mode === 'daily') {
    return [{ label: t('complete.menu'), icon: 'home', variant: 'primary', onClick: onMenu }];
  }
  return [
    { icon: 'home', ariaLabel: t('complete.menu'), onClick: onMenu },
    { label: t('complete.another'), icon: 'leaf', variant: 'primary', onClick: onNext },
  ];
}

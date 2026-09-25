import { audio } from '../../audio/audio.js';
import { GAME } from '../../config.js';
import { i18n, t } from '../../i18n/i18n.js';
import { progress } from '../../state/progress.js';
import { createIcon } from '../assets.js';
import { h, vibrate } from '../dom.js';

// text node that follows language changes
const label = (key, tag = 'span', props = {}) => h(tag, { ...props, dataset: { i18n: key } }, t(key));

function slider(key, labelKey) {
  return h('input', {
    type: 'range',
    className: 'slider',
    min: 0,
    max: 100,
    step: 5,
    value: Math.round(progress.settings[key] * 100),
    dataset: { i18nLabel: labelKey },
    'aria-label': t(labelKey),
    oninput: (event) => progress.setSetting(key, Number(event.target.value) / 100),
    onchange: () => audio.play(key === 'music' ? 'bloom' : 'tap'),
  });
}

function toggle(key, labelKey) {
  const control = h('button', {
    type: 'button',
    className: 'toggle',
    role: 'switch',
    'aria-checked': String(progress.settings[key]),
    dataset: { i18nLabel: labelKey },
    'aria-label': t(labelKey),
  });
  control.addEventListener('click', () => {
    const value = !progress.settings[key];
    progress.setSetting(key, value);
    control.setAttribute('aria-checked', String(value));
    if (key === 'vibration' && value) vibrate(25);
  });
  return control;
}

function row(labelKey, control) {
  return h('div', { className: 'setting-row' }, label(labelKey), control);
}

function textButton(key, { icon, variant = '', onClick }) {
  return h(
    'button',
    { type: 'button', className: `btn btn-small ${variant ? `btn-${variant}` : ''}`, onclick: onClick },
    icon ? createIcon(icon) : null,
    label(key),
  );
}

export function openSettings(app) {
  const languages = i18n.languages.map(({ code, name }) => {
    const option = h('button', { type: 'button', className: 'btn btn-small', lang: code, 'aria-pressed': String(code === i18n.language) }, name);
    option.addEventListener('click', () => {
      progress.setSetting('language', code);
      languageGrid.querySelectorAll('.btn').forEach((b) => b.setAttribute('aria-pressed', String(b.lang === code)));
    });
    return option;
  });
  const languageGrid = h('div', { className: 'language-grid' }, languages);

  app.modals.open({
    titleKey: 'settings.title',
    className: 'settings',
    body: [
      label('settings.language', 'p', { className: 'section-label' }),
      languageGrid,
      row('settings.music', slider('music', 'settings.music')),
      row('settings.sound', slider('sfx', 'settings.sound')),
      row('settings.vibration', toggle('vibration', 'settings.vibration')),
      row('settings.reducedMotion', toggle('reducedMotion', 'settings.reducedMotion')),
      h(
        'div',
        { className: 'modal-actions' },
        textButton('settings.credits', { icon: 'book', onClick: () => openCredits(app) }),
      ),
    ],
  });
}

function openCredits(app) {
  app.modals.open({
    titleKey: 'credits.title',
    className: 'credits',
    body: [
      h('p', {}, t('credits.made')),
      h('p', {}, t('credits.fonts')),
      h('p', {}, h('strong', {}, t('credits.thanks'))),
      h('p', { className: 'section-label' }, `${GAME.title} ${GAME.version}`),
    ],
  });
}

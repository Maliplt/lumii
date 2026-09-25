import { i18n, t } from '../../i18n/i18n.js';
import { ZEN_SIZES } from '../../puzzle/levels.js';
import { progress } from '../../state/progress.js';
import { button } from '../modal.js';
import { h } from '../dom.js';

export function openZenDialog(app) {
  const dialog = app.modals.open({
    titleKey: 'menu.zen',
    body: [
      h('p', {}, t('zen.subtitle')),
      h(
        'div',
        { className: 'zen-sizes' },
        Object.keys(ZEN_SIZES).map((size) =>
          button({
            label: t(`zen.${size}`),
            icon: 'leaf',
            variant: size === 'medium' ? 'primary' : '',
            onClick: () => {
              dialog.close();
              app.go('game', { mode: 'zen', size });
            },
          }),
        ),
      ),
      progress.zenSolved > 0 ? h('p', { className: 'section-label' }, i18n.tp('zen.tended', progress.zenSolved)) : null,
    ],
  });
}

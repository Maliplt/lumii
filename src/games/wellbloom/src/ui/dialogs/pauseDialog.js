import { t } from '../../i18n/i18n.js';

export function openPause(app, { onResume, onRestart, onLeave, leaveTo }) {
  return app.modals.open({
    titleKey: 'pause.title',
    className: 'pause',
    onClose: (reason) => reason === 'dismiss' && onResume(),
    actions: [
      { label: t('pause.resume'), icon: 'play', variant: 'primary', onClick: onResume },
      { label: t('pause.restart'), icon: 'restart', onClick: onRestart },
      { label: t('menu.settings'), icon: 'gear', keepOpen: true, onClick: () => app.openSettings() },
      { label: t(leaveTo === 'map' ? 'pause.map' : 'pause.menu'), icon: leaveTo === 'map' ? 'grid' : 'home', onClick: onLeave },
    ],
  });
}

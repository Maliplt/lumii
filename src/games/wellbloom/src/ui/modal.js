import { createIcon } from './assets.js';
import { h } from './dom.js';
import { t } from '../i18n/i18n.js';

let nextId = 0;

// pixel-styled button
export function button({ label, icon, variant = '', small = false, onClick, ariaLabel }) {
  const classes = ['btn', variant && `btn-${variant}`, small && 'btn-small', !label && 'btn-square'].filter(Boolean);
  return h(
    'button',
    { className: classes.join(' '), type: 'button', onclick: onClick, 'aria-label': ariaLabel, title: ariaLabel },
    icon ? createIcon(icon) : null,
    label ? h('span', {}, label) : null,
  );
}

// dialog stack
export class Modals {
  constructor(root) {
    this.root = root;
    this.stack = [];
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && this.top?.dismissible) {
        event.stopPropagation();
        this.top.close('dismiss');
      }
    });
  }

  get top() {
    return this.stack[this.stack.length - 1] ?? null;
  }

  get isOpen() {
    return this.stack.length > 0;
  }

  open({ title, titleKey, body, actions = [], dismissible = true, onClose, className = '' }) {
    const previousFocus = document.activeElement;
    const backdrop = h('div', { className: 'modal-backdrop' });
    const panel = h('div', { className: `modal panel ${className}`, role: 'dialog', 'aria-modal': 'true' });
    backdrop.append(panel);

    const dialog = {
      panel,
      dismissible,
      closed: false,
      close: (reason = 'action') => {
        if (dialog.closed) return;
        dialog.closed = true;
        this.stack = this.stack.filter((entry) => entry !== dialog);
        backdrop.classList.add('is-closing');
        setTimeout(() => backdrop.remove(), 150);
        if (previousFocus instanceof HTMLElement) previousFocus.focus({ preventScroll: true });
        onClose?.(reason);
      },
    };

    if (title || titleKey) {
      const id = `modal-title-${nextId++}`;
      const heading = h('h2', { className: 'modal-title', id }, title ?? t(titleKey));
      if (titleKey) heading.dataset.i18n = titleKey;
      panel.append(heading);
      panel.setAttribute('aria-labelledby', id);
    }
    if (body) panel.append(h('div', { className: 'modal-body' }, body));
    if (actions.length > 0) {
      panel.append(
        h(
          'div',
          { className: 'modal-actions' },
          actions.map((action) =>
            button({
              ...action,
              onClick: () => {
                action.onClick?.(dialog);
                if (!action.keepOpen) dialog.close('action');
              },
            }),
          ),
        ),
      );
    }
    if (dismissible) {
      const close = button({ icon: 'close', small: true, ariaLabel: t('common.close'), onClick: () => dialog.close('dismiss') });
      close.classList.add('modal-close');
      panel.append(close);
      backdrop.addEventListener('pointerdown', (event) => {
        if (event.target === backdrop) dialog.close('dismiss');
      });
    }

    this.root.append(backdrop);
    this.stack.push(dialog);
    const focusTarget = panel.querySelector('.modal-actions .btn-primary') ?? panel.querySelector('.btn');
    focusTarget?.focus({ preventScroll: true });
    return dialog;
  }

  closeAll() {
    [...this.stack].forEach((dialog) => dialog.close('replaced'));
  }
}

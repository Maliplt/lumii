import { createIcon } from './assets.js';
import { h } from './dom.js';

const VISIBLE_MS = 2400;
const MAX_TOASTS = 3;

export class Toasts {
  constructor(root) {
    this.root = root;
  }

  // `icon` is a sprite name or a ready-made element
  show(text, icon = null) {
    while (this.root.children.length >= MAX_TOASTS) this.root.firstElementChild.remove();
    const iconNode = typeof icon === 'string' ? createIcon(icon) : icon;
    const toast = h('div', { className: 'toast panel' }, iconNode, h('span', {}, text));
    this.root.append(toast);
    setTimeout(() => {
      toast.classList.add('is-leaving');
      toast.addEventListener('animationend', () => toast.remove(), { once: true });
      setTimeout(() => toast.remove(), 400);
    }, VISIBLE_MS);
  }
}

import { i18n } from '../i18n/i18n.js';

const MARGIN = 12;

// the pointing hand and speech bubble used by the tutorial and one-time tips
export class Coach {
  constructor(root) {
    this.root = root;
    this.hand = root.querySelector('.coach-hand');
    this.ripple = root.querySelector('.coach-ripple');
    this.bubble = root.querySelector('.coach-bubble');
    this.text = root.querySelector('.coach-text');
    this.ok = root.querySelector('.coach-ok');
    this.target = null;
    this.onDismiss = null;
    this.frame = 0;
    this.ok.addEventListener('click', () => this.dismiss());
  }

  get visible() {
    return !this.root.hidden;
  }

  show({ text, target = null, button = false, onDismiss = null, avoid = null }) {
    this.textKey = text;
    this.text.textContent = i18n.t(text);
    this.target = target;
    this.avoid = avoid;
    this.onDismiss = onDismiss;
    this.ok.hidden = !button;
    this.root.classList.toggle('no-hand', !target);
    this.root.hidden = false;
    this.bubble.style.animation = 'none';
    void this.bubble.offsetWidth;
    this.bubble.style.animation = '';
    cancelAnimationFrame(this.frame);
    const follow = () => {
      this.position();
      this.frame = requestAnimationFrame(follow);
    };
    follow();
  }

  refreshText() {
    if (this.visible) this.text.textContent = i18n.t(this.textKey);
  }

  hide() {
    cancelAnimationFrame(this.frame);
    this.root.hidden = true;
    this.target = null;
    this.onDismiss = null;
  }

  dismiss() {
    const callback = this.onDismiss;
    this.hide();
    callback?.();
  }

  position() {
    const width = window.innerWidth;
    const height = window.innerHeight;
    const bubble = this.bubble.getBoundingClientRect();
    const point = this.target?.();

    if (!point) {
      this.place(this.bubble, (width - bubble.width) / 2, height * 0.3 - bubble.height / 2);
      return;
    }

    const hand = this.hand.getBoundingClientRect();
    this.place(this.hand, point.x - hand.width * 0.375, point.y - hand.height * 0.04);
    this.place(this.ripple, point.x, point.y);

    const gap = hand.height * 0.4;
    const above = point.y > height * 0.55;
    let top = above ? point.y - gap - bubble.height : point.y + hand.height + gap * 0.3;
    const avoid = this.avoid?.();
    if (avoid) {
      if (height - avoid.bottom >= bubble.height + MARGIN * 2) top = avoid.bottom + MARGIN;
      else if (avoid.top >= bubble.height + MARGIN * 2) top = avoid.top - bubble.height - MARGIN;
    }
    const left = Math.min(Math.max(MARGIN, point.x - bubble.width / 2), width - bubble.width - MARGIN);
    this.place(this.bubble, left, Math.min(Math.max(MARGIN, top), height - bubble.height - MARGIN));
  }

  place(element, x, y) {
    element.style.left = `${Math.round(x)}px`;
    element.style.top = `${Math.round(y)}px`;
  }
}

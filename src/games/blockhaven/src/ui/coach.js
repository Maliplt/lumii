"use strict";
// a small note that explains the next step
(function (B) {
  const { h } = B.dom;

  class Coach {
    constructor(root) {
      this.root = root;
      this.text = h("p", { class: "coach__text" });
      this.button = h("button", { type: "button", class: "btn btn--primary coach__ok", onclick: () => this.dismiss() });
      this.note = h("div", { class: "coach__note", role: "status" }, this.text, this.button);
      this.finger = h("div", { class: "coach__finger" });
      root.append(this.note, this.finger);
      this.hide();
    }

    get visible() {
      return !this.root.hidden;
    }

    // path: () => [{x, y}, {x, y}] in page pixels, replayed as a drag
    show({ text, path = null, button = true, onDismiss = null }) {
      this.key = text;
      this.text.textContent = B.t(text);
      this.button.textContent = B.t("common.ok");
      this.button.hidden = !button;
      this.onDismiss = onDismiss;
      this.path = path;
      this.root.hidden = false;
      B.dom.replay(this.note, "is-new");
      this.finger.hidden = !path;
      this.animate();
    }

    animate() {
      this.motion?.cancel();
      if (!this.path || B.dom.calm()) {
        if (this.path) {
          const [a] = this.path();
          Object.assign(this.finger.style, { left: `${a.x}px`, top: `${a.y}px` });
        }
        return;
      }
      const [a, b] = this.path();
      this.finger.style.left = "0px";
      this.finger.style.top = "0px";
      this.motion = this.finger.animate(
        [
          { transform: `translate(${a.x}px, ${a.y}px) scale(1.2)`, opacity: 0 },
          { transform: `translate(${a.x}px, ${a.y}px) scale(1)`, opacity: 1, offset: 0.15 },
          { transform: `translate(${b.x}px, ${b.y}px) scale(1)`, opacity: 1, offset: 0.7 },
          { transform: `translate(${b.x}px, ${b.y}px) scale(1.2)`, opacity: 0 },
        ],
        { duration: 2200, iterations: Infinity, easing: "ease-in-out" },
      );
    }

    reflow() {
      if (this.visible && this.path) this.animate();
    }

    // sets the note under a point on the page, its arrow pointing up at it
    place(top) {
      this.note.classList.toggle("is-below", top != null);
      this.note.style.top = top == null ? "" : `${Math.round(top)}px`;
    }

    hide() {
      this.motion?.cancel();
      this.root.hidden = true;
      this.onDismiss = null;
    }

    dismiss() {
      const callback = this.onDismiss;
      this.hide();
      callback?.();
    }

    refresh() {
      if (!this.visible) return;
      this.text.textContent = B.t(this.key);
      this.button.textContent = B.t("common.ok");
    }
  }

  B.Coach = Coach;
})(window.Blockhaven);

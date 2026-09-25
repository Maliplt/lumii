"use strict";
// the innkeeper explains things in a speech bubble
(function (YB) {
  const { h, sprite } = YB.dom;

  class Coach {
    constructor(root, stage) {
      this.root = root;
      this.stage = stage;
      this.hand = h("div", { class: "coach__hand" });
      this.hand.style.backgroundImage = `url(${YB.dom.spriteUrl("hand", () => YB.Pixels.bake(YB.Sprites.HAND)).url})`;
      this.text = h("p", { class: "coach__text" });
      this.button = h("button", { type: "button", class: "btn btn-small btn-primary coach__ok", onclick: () => this.dismiss() });
      this.face = sprite("host|idle", () => YB.Pixels.bake(YB.Sprites.host("idle"), { outline: "k" }), { className: "coach__face" });
      this.bubble = h("div", { class: "panel coach__bubble", role: "status" }, this.face, this.text, this.button);
      root.append(this.hand, this.bubble);
      this.frame = 0;
    }

    get visible() {
      return !this.root.hidden;
    }

    // text: translation key
    show({ text, point = null, button = true, place = "bottom", onDismiss = null }) {
      this.key = text;
      this.text.textContent = YB.t(text);
      this.button.textContent = YB.t("coach.ok");
      this.button.hidden = !button;
      this.point = point;
      this.onDismiss = onDismiss;
      this.bubble.style.top = place === "top" ? "calc(var(--safe-top) + var(--px) * 30)" : "auto";
      this.bubble.style.bottom = place === "bottom" ? "calc(var(--safe-bottom) + var(--px) * 6)" : "auto";
      this.root.hidden = false;
      YB.dom.replay(this.bubble, "is-new");
      cancelAnimationFrame(this.frame);
      const follow = () => {
        this.position();
        this.frame = requestAnimationFrame(follow);
      };
      follow();
      YB.Audio.play("swish");
    }

    position() {
      const at = this.point?.();
      this.hand.hidden = !at;
      if (!at) return;
      const css = this.stage.toCss(at.x, at.y);
      this.hand.style.left = `${Math.round(css.x - 4)}px`;
      this.hand.style.top = `${Math.round(css.y)}px`;
    }

    hide() {
      cancelAnimationFrame(this.frame);
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
      this.text.textContent = YB.t(this.key);
      this.button.textContent = YB.t("coach.ok");
    }
  }

  YB.Coach = Coach;
})(window.YirmibirHani);

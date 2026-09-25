"use strict";
// the backdrop behind every screen
(function (B) {
  const Backdrop = {
    canvas: null,
    ctx: null,
    drawn: "",

    init(canvas) {
      this.canvas = canvas;
      this.ctx = canvas.getContext("2d");
    },

    update() {},

    draw() {
      const { canvas, ctx } = this;
      if (!canvas) return;
      const w = window.innerWidth;
      const h = window.innerHeight;
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      const key = `${w}x${h}@${dpr}`;
      if (key === this.drawn) return;
      this.drawn = key;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const base = ctx.createLinearGradient(0, 0, 0, h);
      base.addColorStop(0, "#4b95ff");
      base.addColorStop(0.55, "#3469f0");
      base.addColorStop(1, "#2447cf");
      ctx.fillStyle = base;
      ctx.fillRect(0, 0, w, h);
      // rays fanning down from above the top edge
      const cx = w / 2;
      const cy = -h * 0.15;
      const reach = Math.hypot(w, h) * 1.2;
      const rays = 18;
      ctx.save();
      const fade = ctx.createRadialGradient(cx, cy, 0, cx, cy, reach * 0.7);
      fade.addColorStop(0, "rgba(255,255,255,0.09)");
      fade.addColorStop(1, "rgba(255,255,255,0)");
      ctx.fillStyle = fade;
      for (let i = 0; i < rays; i++) {
        const a0 = (i / rays) * Math.PI * 2;
        const a1 = a0 + (Math.PI / rays) * 0.9;
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(cx + Math.cos(a0) * reach, cy + Math.sin(a0) * reach);
        ctx.lineTo(cx + Math.cos(a1) * reach, cy + Math.sin(a1) * reach);
        ctx.closePath();
        ctx.fill();
      }
      ctx.restore();
      // pale blocks, kept to the sides so the middle stays calm
      const rng = new B.Random("backdrop");
      const unit = Math.max(46, Math.min(90, Math.max(w, h) / 14));
      const count = Math.round((w * h) / 60000) + 6;
      for (let i = 0; i < count; i++) {
        const side = i % 2 ? rng.next() * 0.22 : 0.78 + rng.next() * 0.22;
        const x = side * w;
        const y = rng.next() * h;
        const s = unit * (0.5 + rng.next() * 0.8);
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate((rng.next() - 0.5) * 0.9);
        ctx.fillStyle = `rgba(255,255,255,${0.05 + rng.next() * 0.05})`;
        B.Art.rr(ctx, -s / 2, -s / 2, s, s, s * 0.18);
        ctx.fill();
        ctx.fillStyle = "rgba(255,255,255,0.05)";
        B.Art.rr(ctx, -s / 2 + s * 0.14, -s / 2 + s * 0.14, s * 0.72, s * 0.72, s * 0.12);
        ctx.fill();
        ctx.restore();
      }
      const shade = ctx.createLinearGradient(0, h * 0.7, 0, h);
      shade.addColorStop(0, "rgba(12,27,77,0)");
      shade.addColorStop(1, "rgba(12,27,77,0.3)");
      ctx.fillStyle = shade;
      ctx.fillRect(0, 0, w, h);
    },
  };

  B.Backdrop = Backdrop;
})(window.Blockhaven);

"use strict";
const SortPalette = [
  "#f85b70",
  "#387df0",
  "#f8c637",
  "#13b6a6",
  "#ff913a",
  "#d95098",
];
class TubeView {
  static serial = 0;
  constructor(container, onTap, label) {
    this.container = container;
    this.onTap = onTap;
    this.label = label;
    this.prefix = `glass-${++TubeView.serial}`;
  }
  markup(tube, index, volume = tube.length) {
    const clip = `${this.prefix}-${index}`;
    const layers = tube
      .map((color, i) => {
        const height = Math.max(0, Math.min(1, volume - i)) * 42;
        if (!height) return "";
        const y = 214 - i * 42 - height;
        return `<g><rect x="16" y="${y}" width="52" height="${height + 0.5}" fill="${SortPalette[color]}"/>${tube[i + 1] !== color || volume <= i + 1 ? `<ellipse cx="42" cy="${y + 2}" rx="27" ry="3.5" fill="#ffffff" opacity=".32"/>` : ""}<path d="M25 ${y + 13}h5" stroke="#ffffff" stroke-width="2" stroke-linecap="round" opacity=".4"/></g>`;
      })
      .join("");
    return `<svg class="tube-art" viewBox="0 0 84 242" aria-hidden="true">
      <defs><clipPath id="${clip}"><path d="M16 25H68V190a26 26 0 0 1-52 0Z"/></clipPath><linearGradient id="${clip}-shine"><stop offset="0" stop-color="#fff" stop-opacity=".35"/><stop offset=".25" stop-color="#fff" stop-opacity=".04"/><stop offset=".65" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#163c46" stop-opacity=".2"/></linearGradient></defs>
      <path class="glass-body" d="M11 19H73V190a31 31 0 0 1-62 0Z"/>
      <g clip-path="url(#${clip})">${layers}<rect x="16" y="25" width="52" height="194" fill="url(#${clip}-shine)"/></g>
      <path class="glass-edge" d="M11 19V190a31 31 0 0 0 62 0V19"/>
      <path d="M19 35V183" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity=".55"/>
      <path d="M63 55v124" stroke="#fff" stroke-width="2" stroke-linecap="round" opacity=".16"/>
      <rect class="glass-rim" x="7" y="14" width="70" height="9" rx="4.5"/>
    </svg>`;
  }
  draw(tubes) {
    this.tubes = tubes;
    this.container.dataset.count = tubes.length;
    this.container.replaceChildren();
    tubes.forEach((tube, index) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "tube" + (ColorSort.complete(tube) ? " finished" : "");
      button.dataset.tube = index;
      button.style.setProperty(
        "--liquid",
        SortPalette[ColorSort.top(tube)] || "#78b7b6",
      );
      button.setAttribute("aria-label", this.label(tube, index));
      button.setAttribute("aria-pressed", "false");
      button.innerHTML =
        this.markup(tube, index) +
        `<span class="tube-seal" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="m6 12 4 4 8-9"/></svg></span>`;
      button.onclick = () => this.onTap(index);
      this.container.append(button);
    });
  }
  select(index, hint = -1) {
    this.container.querySelectorAll(".tube").forEach((button, i) => {
      if (
        i === index &&
        !button.classList.contains("selected") &&
        !matchMedia("(prefers-reduced-motion:reduce)").matches
      ) {
        button
          .querySelector(".tube-art")
          .animate(
            [
              { transform: "scale(1) rotate(0)" },
              { transform: "scale(1.06,.97) rotate(-3deg)", offset: 0.4 },
              { transform: "scale(.99,1.03) rotate(2deg)", offset: 0.7 },
              { transform: "scale(1) rotate(0)" },
            ],
            { duration: 430, easing: "ease-out" },
          );
      }
      button.classList.toggle("selected", i === index);
      button.classList.toggle("suggested", i === hint);
      button.setAttribute("aria-pressed", String(i === index));
    });
  }
  reject(index) {
    const tube = this.container.children[index];
    if (matchMedia("(prefers-reduced-motion:reduce)").matches) return;
    tube.animate(
      [
        { transform: "translateX(0)" },
        { transform: "translateX(-5px)" },
        { transform: "translateX(5px)" },
        { transform: "translateX(0)" },
      ],
      { duration: 240 },
    );
  }
  async transfer(before, move, reduced) {
    if (reduced) {
      this.draw(move.tubes);
      return;
    }
    const source = this.container.children[move.from];
    const target = this.container.children[move.to];
    const sourceRect = source.querySelector("svg").getBoundingClientRect();
    const targetRect = target.querySelector("svg").getBoundingClientRect();
    const ghost = document.createElement("div");
    ghost.className = "pouring-tube";
    ghost.style.cssText = `left:${sourceRect.left}px;top:${sourceRect.top}px;width:${sourceRect.width}px;height:${sourceRect.height}px;transform-origin:50% ${(sourceRect.height * 18) / 242}px`;
    const ghostView = new TubeView(
      ghost,
      () => {},
      () => "",
    );
    ghost.innerHTML = ghostView.markup(before[move.from], 0);
    document.body.append(ghost);
    source.style.visibility = "hidden";
    const mouthX = targetRect.left + targetRect.width / 2;
    const mouthY = targetRect.top - Math.min(45, targetRect.height * 0.22);
    const dx = mouthX - (sourceRect.left + sourceRect.width / 2);
    const dy = mouthY - (sourceRect.top + (sourceRect.height * 18) / 242);
    const angle = dx >= 0 ? 72 : -72;
    const pose = `translate(${dx}px,${dy}px) rotate(${angle}deg)`;
    const flow = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    flow.classList.add("pour-stream");
    flow.setAttribute("viewBox", `0 0 ${innerWidth} ${innerHeight}`);
    flow.innerHTML = `<path fill="none" stroke="${SortPalette[move.color]}" stroke-width="${Math.max(5, targetRect.width * 0.08)}" stroke-linecap="round"/>`;
    let interrupted = false;
    const animations = [];
    const travel = (frames, options) => {
      const animation = ghost.animate(frames, options);
      animations.push(animation);
      return animation;
    };
    this.cancelTransfer = () => {
      interrupted = true;
      animations.forEach((animation) => animation.cancel());
      ghost.remove();
      flow.remove();
    };
    try {
      await travel([{ transform: "none" }, { transform: pose }], {
        duration: 260,
        fill: "forwards",
        easing: "cubic-bezier(.25,.7,.3,1)",
      }).finished;
      if (interrupted) return;
      document.body.append(flow);
      const duration = 260 + move.count * 95;
      const start = performance.now();
      await new Promise((resolve) => {
        function tick(now) {
          if (interrupted) {
            resolve();
            return;
          }
          const progress = Math.min(1, (now - start) / duration);
          ghost.innerHTML = ghostView.markup(
            before[move.from],
            0,
            before[move.from].length - move.count * progress,
          );
          target.querySelector(".tube-art").outerHTML = this.markup(
            move.tubes[move.to],
            move.to,
            before[move.to].length + move.count * progress,
          );
          const fillY =
            targetRect.top +
            (targetRect.height *
              (214 - (before[move.to].length + move.count * progress) * 42)) /
              242;
          flow.firstChild.setAttribute(
            "d",
            `M${mouthX} ${mouthY}Q${mouthX + Math.sin(progress * 22) * 1.4} ${(mouthY + fillY) / 2} ${mouthX} ${fillY}`,
          );
          if (progress < 1) requestAnimationFrame(tick.bind(this));
          else resolve();
        }
        requestAnimationFrame(tick.bind(this));
      });
      flow.remove();
      if (interrupted) return;
      await travel([{ transform: pose }, { transform: "none" }], {
        duration: 240,
        fill: "forwards",
        easing: "ease-in-out",
      }).finished;
    } catch (error) {
      if (!interrupted) throw error;
    } finally {
      this.cancelTransfer = null;
      ghost.remove();
      flow.remove();
      source.style.visibility = "";
      this.draw(move.tubes);
    }
  }
  async victory(reduced, sound) {
    if (reduced) return;
    this.container.classList.add("celebrating");
    const tubes = [...this.container.querySelectorAll(".tube.finished")];
    const animations = tubes.map((tube, index) => {
      this.celebrate(Number(tube.dataset.tube), false);
      tube.querySelector(".tube-seal").animate(
        [
          { scale: "1", opacity: 1 },
          { scale: "1.7", opacity: 1 },
          { scale: "1", opacity: 1 },
        ],
        { duration: 600, delay: index * 110 },
      );
      return tube.animate(
        [
          { transform: "translateY(0) rotate(0)" },
          { transform: "translateY(-23px) rotate(-5deg)", offset: 0.32 },
          { transform: "translateY(-12px) rotate(4deg)", offset: 0.6 },
          { transform: "translateY(0) rotate(0)" },
        ],
        {
          duration: 1100,
          delay: index * 130,
          easing: "cubic-bezier(.2,.7,.25,1)",
        },
      ).finished;
    });
    try {
      await Promise.all(animations);
    } finally {
      this.container.classList.remove("celebrating");
    }
  }
  celebrate(index, reduced) {
    const tube = this.container.children[index];
    if (reduced || !tube) return;
    tube.animate(
      [
        { transform: "scale(1)" },
        { transform: "translateY(-9px) scale(1.06)" },
        { transform: "scale(1)" },
      ],
      { duration: 500, easing: "ease-out" },
    );
    const rect = tube.getBoundingClientRect();
    for (let i = 0; i < 10; i++) {
      const dot = document.createElement("i");
      dot.className = "color-spark";
      dot.style.cssText = `left:${rect.left + rect.width / 2}px;top:${rect.top + 20}px;background:${SortPalette[i % SortPalette.length]}`;
      document.body.append(dot);
      const angle = (i / 10) * Math.PI * 2;
      const animation = dot.animate(
        [
          { opacity: 1, transform: "scale(.4)" },
          {
            opacity: 0,
            transform: `translate(${Math.cos(angle) * 65}px,${Math.sin(angle) * 50}px) scale(1)`,
          },
        ],
        { duration: 650, easing: "ease-out" },
      );
      animation.onfinish = () => dot.remove();
    }
  }
}

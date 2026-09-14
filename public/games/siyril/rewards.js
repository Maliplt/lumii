"use strict";
function createArrowRewards(root, language, sound) {
  let frame = 0;
  let layer;
  const timers = new Set();
  const animations = new Set();

  function stop() {
    cancelAnimationFrame(frame);
    timers.forEach(clearTimeout);
    timers.clear();
    animations.forEach((animation) => animation.cancel());
    animations.clear();
    layer?.remove();
    layer = null;
  }
  function animate(element, keyframes, options) {
    const animation = element.animate(keyframes, options);
    animations.add(animation);
    animation.onfinish = () => animations.delete(animation);
  }
  function later(callback, delay) {
    const timer = setTimeout(() => {
      timers.delete(timer);
      callback();
    }, delay);
    timers.add(timer);
  }
  function play(score, stars) {
    stop();
    const counter = root.querySelector("#final-score");
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) {
      counter.textContent = score.toLocaleString(language());
      return;
    }
    animate(
      root.querySelector(".result-mark"),
      [
        { transform: "rotate(-24deg) scale(.5)", opacity: 0 },
        { transform: "rotate(5deg) scale(1.13)", opacity: 1, offset: 0.65 },
        { transform: "rotate(-7deg) scale(1)", opacity: 1 },
      ],
      { duration: 650, easing: "cubic-bezier(.18,.75,.25,1)" },
    );
    root.querySelectorAll("#stars span").forEach((star, index) => {
      if (index >= stars) return;
      animate(
        star,
        [
          {
            transform: "translateY(16px) scale(.2) rotate(-25deg)",
            opacity: 0,
          },
          {
            transform: "translateY(-5px) scale(1.35) rotate(8deg)",
            opacity: 1,
            offset: 0.6,
          },
          { transform: "translateY(0) scale(1) rotate(0)", opacity: 1 },
        ],
        {
          duration: 550,
          delay: 220 + index * 240,
          fill: "backwards",
          easing: "ease-out",
        },
      );
      later(() => sound("star", index + 1), 400 + index * 240);
    });
    const start = performance.now();
    function count(now) {
      const progress = Math.min(1, (now - start) / 1250);
      counter.textContent = Math.round(
        score * (1 - (1 - progress) ** 3),
      ).toLocaleString(language());
      if (progress < 1) frame = requestAnimationFrame(count);
      else
        animate(
          counter,
          [
            { transform: "scale(1)" },
            { transform: "scale(1.15)" },
            { transform: "scale(1)" },
          ],
          { duration: 320 },
        );
    }
    frame = requestAnimationFrame(count);
    layer = document.createElement("div");
    layer.className = "reward-particles";
    layer.setAttribute("aria-hidden", "true");
    root.append(layer);
    const rect = root.querySelector("#stars").getBoundingClientRect();
    for (let i = 0; i < 42; i++) {
      const particle = document.createElement("i");
      particle.style.left = `${rect.left + rect.width / 2}px`;
      particle.style.top = `${rect.top + rect.height / 2}px`;
      layer.append(particle);
      const angle = (i / 42) * Math.PI * 2;
      const spread = Math.min(innerWidth * 0.42, 290) * (0.55 + (i % 7) / 14);
      const x = Math.cos(angle) * spread;
      const y = Math.sin(angle) * spread * 0.75 - 60;
      animate(
        particle,
        [
          { transform: "translate(-50%,-50%) scale(0)", opacity: 0 },
          {
            transform: `translate(${x}px,${y}px) rotate(${i * 47}deg) scale(1)`,
            opacity: 1,
            offset: 0.4,
          },
          {
            transform: `translate(${x * 1.3}px,${y + 170}px) rotate(${i * 93}deg) scale(.6)`,
            opacity: 0,
          },
        ],
        {
          duration: 1500 + (i % 5) * 90,
          delay: 320,
          fill: "both",
          easing: "ease-out",
        },
      );
    }
    later(() => {
      layer?.remove();
      layer = null;
    }, 2400);
  }
  return { play, stop };
}

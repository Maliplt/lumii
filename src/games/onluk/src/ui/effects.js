"use strict";
/** Short-lived action effects. The canvas is idle between player actions. */
const TenEffects = (() => {
  const canvas = document.getElementById("atmosphere"),
    ctx = canvas.getContext("2d");
  const reduced = matchMedia("(prefers-reduced-motion: reduce)");
  const counters = new WeakMap();
  let width = 0,
    height = 0,
    particles = [],
    rings = [],
    flights = [],
    raf = 0,
    last = 0;
  function colors() {
    return document.body.dataset.theme === "dark"
      ? ["#ffd52e", "#ffae28", "#fff0a1", "#ffffff"]
      : ["#487eff", "#f64d8f", "#9a60f4", "#ffbd3a", "#ffffff"];
  }
  function resize() {
    width = innerWidth;
    height = innerHeight;
    const dpr = Math.min(devicePixelRatio || 1, 2);
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx?.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  function start() {
    if (ctx && !raf && !document.hidden && !reduced.matches) {
      last = performance.now();
      raf = requestAnimationFrame(frame);
    }
  }
  function frame(now) {
    raf = 0;
    const dt = Math.min((now - last) / 1000, 0.035);
    last = now;
    ctx.clearRect(0, 0, width, height);
    particles = particles.filter((p) => p.life > 0);
    for (const p of particles) {
      p.life -= dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += p.gravity * dt;
      ctx.globalAlpha = Math.max(0, p.life / p.duration);
      ctx.fillStyle = p.color;
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.life * 5);
      ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
      ctx.restore();
    }
    rings = rings.filter((r) => r.life > 0);
    for (const r of rings) {
      r.life -= dt;
      const t = 1 - r.life / r.duration;
      ctx.globalAlpha = Math.max(0, 1 - t);
      ctx.strokeStyle = r.color;
      ctx.lineWidth = 4 * (1 - t) + 1;
      ctx.beginPath();
      ctx.arc(r.x, r.y, r.radius * (0.35 + t), 0, Math.PI * 2);
      ctx.stroke();
    }
    flights = flights.filter((f) => f.life > 0);
    for (const f of flights) {
      f.life -= dt;
      const t = Math.min(1, Math.max(0, 1 - f.life / f.duration)),
        q = t * t * (3 - 2 * t);
      const x = f.x + (f.toX - f.x) * q + Math.sin(t * Math.PI) * f.curve,
        y = f.y + (f.toY - f.y) * q - Math.sin(t * Math.PI) * 70;
      ctx.globalAlpha = Math.sin(Math.PI * t);
      ctx.fillStyle = f.color;
      ctx.beginPath();
      ctx.arc(x, y, 5 - 2 * t, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    if (particles.length || rings.length || flights.length)
      raf = requestAnimationFrame(frame);
    else ctx.clearRect(0, 0, width, height);
  }
  function burst(cells, target, combo) {
    if (reduced.matches || !cells.length) return;
    const palette = colors();
    cells.forEach((r, index) => {
      const x = r.left + r.width / 2,
        y = r.top + r.height / 2,
        color = palette[index % palette.length];
      rings.push({
        x,
        y,
        color,
        radius: r.width * 0.85,
        life: 0.38,
        duration: 0.38,
      });
      for (let n = 0; n < 12; n++) {
        const angle = (n * Math.PI) / 6,
          velocity = 70 + Math.random() * 140,
          duration = 0.4 + Math.random() * 0.35;
        particles.push({
          x,
          y,
          color: palette[n % palette.length],
          vx: Math.cos(angle) * velocity,
          vy: Math.sin(angle) * velocity - 50,
          gravity: 300,
          life: duration,
          duration,
          size: 3 + Math.random() * 5,
        });
      }
      flights.push({
        x,
        y,
        toX: target.left + target.width / 2,
        toY: target.top + target.height / 2,
        curve: (index % 2 ? 1 : -1) * 65,
        color,
        duration: 0.6 + index * 0.045,
        life: 0.6 + index * 0.045,
      });
    });
    if (combo >= 3) {
      const r = cells[Math.floor(cells.length / 2)];
      rings.push({
        x: r.left + r.width / 2,
        y: r.top + r.height / 2,
        color: palette[0],
        radius: 120,
        life: 0.5,
        duration: 0.5,
      });
    }
    particles = particles.slice(-240);
    rings = rings.slice(-20);
    flights = flights.slice(-20);
    start();
  }
  function celebrate() {
    if (reduced.matches) return;
    const palette = colors();
    for (let i = 0; i < 110; i++) {
      const duration = 1.1 + Math.random();
      particles.push({
        x: width / 2,
        y: height * 0.4,
        color: palette[i % palette.length],
        vx: (Math.random() - 0.5) * 650,
        vy: -100 - Math.random() * 350,
        gravity: 280,
        life: duration,
        duration,
        size: 3 + Math.random() * 6,
      });
    }
    start();
  }
  function bump(element, scale = 1.2) {
    if (!reduced.matches)
      element.animate(
        [
          { transform: "scale(1)" },
          { transform: `scale(${scale})`, offset: 0.35 },
          { transform: "scale(1)" },
        ],
        { duration: 420, easing: "cubic-bezier(.2,.8,.3,1)" },
      );
  }
  function setScore(element, value, language) {
    const old = counters.get(element);
    if (old) cancelAnimationFrame(old);
    counters.delete(element);
    element.textContent = value.toLocaleString(language);
  }
  function score(element, from, to, language) {
    setScore(element, from, language);
    if (reduced.matches) {
      setScore(element, to, language);
      return;
    }
    bump(element, 1.25);
    const start = performance.now();
    function tick(now) {
      const t = Math.min(1, (now - start) / 600);
      element.textContent = Math.round(
        from + (to - from) * (1 - Math.pow(1 - t, 3)),
      ).toLocaleString(language);
      if (t < 1) counters.set(element, requestAnimationFrame(tick));
      else counters.delete(element);
    }
    counters.set(element, requestAnimationFrame(tick));
  }
  function reset() {
    cancelAnimationFrame(raf);
    raf = 0;
    particles = [];
    rings = [];
    flights = [];
    ctx?.clearRect(0, 0, width, height);
  }
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) reset();
  });
  reduced.addEventListener("change", () => {
    if (reduced.matches) reset();
  });
  window.addEventListener("resize", resize);
  resize();
  return { burst, celebrate, bump, score, setScore, reset };
})();

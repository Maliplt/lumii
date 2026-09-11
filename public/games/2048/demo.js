"use strict";
(() => {
  const container = document.getElementById("demo-tiles");
  let board = [],
    step = 0,
    timer;
  const moves = ["left", "down", "right"];
  function paint(merged = []) {
    container.replaceChildren();
    board.forEach((value, i) => {
      if (!value) return;
      const tile = document.createElement("span");
      tile.className = "demo-tile" + (merged.includes(i) ? " merged" : "");
      tile.dataset.index = i;
      tile.dataset.value = value;
      tile.textContent = value;
      tile.style.setProperty("--x", i % 4);
      tile.style.setProperty("--y", Math.floor(i / 4));
      container.append(tile);
    });
  }
  function reset() {
    board = [32, 32, 64, 0, 0, 0, 0, 0, 64, 64, 0, 0, 0, 0, 0, 0];
    step = 0;
    paint();
  }
  function tick() {
    if (
      document.hidden ||
      document.getElementById("menu").hidden ||
      matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      timer = setTimeout(tick, 1000);
      return;
    }
    if (step === moves.length) {
      const outgoing = container.cloneNode(true);
      outgoing.removeAttribute("id");
      outgoing.classList.add("demo-outgoing");
      outgoing.setAttribute("aria-hidden", "true");
      outgoing.style.pointerEvents = "none";
      container.after(outgoing);
      reset();
      container.animate(
        [
          { opacity: 0, transform: "translateY(12px)" },
          { opacity: 1, transform: "translateY(0)" },
        ],
        { duration: 850, easing: "cubic-bezier(.22,1,.36,1)" },
      );
      const fade = outgoing.animate(
        [{ opacity: 1 }, { opacity: 0, transform: "translateY(-12px)" }],
        { duration: 650, easing: "ease-in-out", fill: "forwards" },
      );
      fade.onfinish = () => outgoing.remove();
      timer = setTimeout(tick, 1600);
      return;
    }
    const result = Game2048.move(board, moves[step++]);
    result.motions.forEach(({ from, to }) => {
      const tile = container.querySelector(`[data-index="${from}"]`);
      tile.style.setProperty("--x", to % 4);
      tile.style.setProperty("--y", Math.floor(to / 4));
    });
    timer = setTimeout(() => {
      board = result.board;
      paint(result.merges);
      timer = setTimeout(tick, 1100);
    }, 420);
  }
  reset();
  timer = setTimeout(tick, 1200);
  window.addEventListener("pagehide", () => clearTimeout(timer));
  window.addEventListener("pageshow", (event) => {
    if (event.persisted) timer = setTimeout(tick, 1200);
  });
})();

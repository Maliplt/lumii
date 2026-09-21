(function () {
  const reduced = matchMedia("(prefers-reduced-motion: reduce)");
  let generation = 0;
  function positions(board) {
    const result = new Map();
    document.querySelectorAll("[data-cell], [data-tile]").forEach((el) => {
      const id = el.hasAttribute("data-tile")
        ? Number(el.dataset.tile)
        : board[Number(el.dataset.cell)];
      if (id !== null) result.set(id, el.getBoundingClientRect());
    });
    return result;
  }
  function move(before, board, dragged) {
    if (reduced.matches) return;
    document.querySelectorAll("[data-cell], [data-tile]").forEach((el) => {
      const id = el.hasAttribute("data-tile")
        ? Number(el.dataset.tile)
        : board[Number(el.dataset.cell)];
      const old = id === dragged?.id ? dragged.rect : before.get(id);
      const face = el.querySelector(".die");
      if (!old || !face) return;
      const next = el.getBoundingClientRect();
      const dx = old.x - next.x,
        dy = old.y - next.y;
      if (Math.abs(dx) + Math.abs(dy) < 1) return;
      el.style.zIndex = "5";
      face
        .animate(
          [
            {
              transform: `translate(${dx}px,${dy}px) scale(${old.width / next.width})`,
            },
            { transform: "translate(0,0) scale(1)" },
          ],
          { duration: 240, easing: "cubic-bezier(.2,.7,.2,1)" },
        )
        .finished.catch(() => {})
        .finally(() => {
          el.style.zIndex = "";
        });
    });
  }
  async function celebrate(level, board, callback) {
    const current = ++generation;
    if (!reduced.matches) {
      const animations = board.map((id, i) => {
        const el = document.querySelector(`[data-cell="${i}"] .die`);
        return el
          ?.animate(
            [
              { transform: "scale(1)", filter: "brightness(1)" },
              {
                transform: "scale(.91)",
                filter: "brightness(1.4)",
                offset: 0.4,
              },
              { transform: "scale(1)", filter: "brightness(1)" },
            ],
            {
              duration: 470,
              delay: level.tiles[id].value * 65,
              easing: "ease-in-out",
            },
          )
          .finished.catch(() => {});
      });
      await Promise.all(animations);
    }
    if (current === generation) callback();
  }
  window.ZarMotion = {
    positions,
    move,
    celebrate,
    cancel: () => {
      generation++;
    },
  };
})();

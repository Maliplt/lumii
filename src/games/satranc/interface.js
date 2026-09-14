"use strict";
(() => {
  const carousel = document.getElementById("mode-carousel");
  let drag = null,
    suppress = false;
  carousel.addEventListener("pointerdown", (event) => {
    if (event.button !== 0 || event.pointerType === "touch") return;
    drag = {
      id: event.pointerId,
      x: event.clientX,
      left: carousel.scrollLeft,
      moved: false,
    };
    suppress = false;
  });
  carousel.addEventListener("pointermove", (event) => {
    if (!drag || drag.id !== event.pointerId) return;
    const delta = event.clientX - drag.x;
    if (!drag.moved && Math.abs(delta) < 6) return;
    if (!drag.moved) {
      drag.moved = true;
      carousel.setPointerCapture(event.pointerId);
      carousel.classList.add("dragging");
    }
    carousel.scrollLeft = drag.left - delta;
    event.preventDefault();
  });
  function release() {
    if (!drag) return;
    suppress = drag.moved;
    drag = null;
    carousel.classList.remove("dragging");
    setTimeout(() => {
      suppress = false;
    }, 0);
  }
  carousel.addEventListener("pointerup", release);
  carousel.addEventListener("pointercancel", release);
  window.addEventListener("pointerup", release);
  carousel.addEventListener(
    "click",
    (event) => {
      if (suppress) {
        event.preventDefault();
        event.stopImmediatePropagation();
      }
    },
    true,
  );
  const main = document.querySelector("main"),
    game = document.getElementById("game");
  let frame = 0;
  function schedule() {
    cancelAnimationFrame(frame);
    frame = requestAnimationFrame(fit);
  }
  function outerHeight(el) {
    if (!el || el.hidden) return 0;
    const css = getComputedStyle(el);
    return (
      el.getBoundingClientRect().height +
      parseFloat(css.marginTop) +
      parseFloat(css.marginBottom)
    );
  }
  function fit() {
    if (!document.getElementById("puzzle-map").hidden) drawRoutes();
    if (game.hidden) return;
    const layout = game.querySelector(".game-layout"),
      column = game.querySelector(".board-column");
    const aside = game.querySelector(".game-aside"),
      mobile = innerWidth <= 700;
    const rows = [...column.querySelectorAll(".player-row")].reduce(
      (n, el) => n + outerHeight(el),
      0,
    );
    const gap = parseFloat(getComputedStyle(layout).gap) || 0;
    const available =
      main.clientHeight -
      outerHeight(game.querySelector(".game-toolbar")) -
      rows -
      18 -
      (mobile ? outerHeight(aside) + gap : 0);
    const width = mobile
      ? layout.clientWidth
      : layout.clientWidth - aside.offsetWidth - gap;
    const size = Math.floor(Math.max(120, Math.min(width, available)));
    if (column.style.width !== size + "px") column.style.width = size + "px";
  }
  new ResizeObserver(schedule).observe(main);
  new MutationObserver(schedule).observe(
    document.getElementById("puzzle-map"),
    {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["hidden"],
    },
  );
  new MutationObserver(schedule).observe(game, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ["hidden"],
  });
  window.addEventListener("resize", schedule);
  function drawRoutes() {
    for (const container of document.querySelectorAll(".chapter-path")) {
      let svg = container.querySelector(".chapter-route");
      if (!svg) {
        svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        svg.classList.add("chapter-route");
        svg.setAttribute("aria-hidden", "true");
        svg.append(document.createElementNS(svg.namespaceURI, "path"));
        container.prepend(svg);
      }
      const points = [...container.querySelectorAll(".puzzle-node")].map(
        (node) => [
          node.offsetLeft + node.offsetWidth / 2,
          node.offsetTop + node.offsetHeight / 2,
        ],
      );
      const route = points
        .map(([x, y], i) =>
          i
            ? `C${points[i - 1][0]} ${(points[i - 1][1] + y) / 2},${x} ${(points[i - 1][1] + y) / 2},${x} ${y}`
            : `M${x} ${y}`,
        )
        .join(" ");
      svg.setAttribute(
        "viewBox",
        `0 0 ${container.clientWidth} ${container.clientHeight}`,
      );
      svg.firstChild.setAttribute("d", route);
    }
  }
})();

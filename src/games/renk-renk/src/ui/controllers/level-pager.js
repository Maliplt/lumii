"use strict";
function createLevelPager(element, change) {
  let pointer = null,
    suppressClick = false,
    animation;
  const rtl = () => (document.documentElement.dir === "rtl" ? -1 : 1);
  function go(direction) {
    animation?.cancel();
    if (!change(direction)) {
      element.style.transform = "";
      return;
    }
    element.style.transform = "";
    if (matchMedia("(prefers-reduced-motion:reduce)").matches) return;
    animation = element.animate(
      [
        { transform: `translateX(${direction * rtl() * 55}px)`, opacity: 0.25 },
        { transform: "translateX(0)", opacity: 1 },
      ],
      { duration: 280, easing: "cubic-bezier(.2,.7,.2,1)" },
    );
  }
  element.addEventListener("pointerdown", (event) => {
    if (!event.isPrimary || event.button !== 0) return;
    animation?.cancel();
    suppressClick = false;
    pointer = {
      id: event.pointerId,
      x: event.clientX,
      y: event.clientY,
      time: performance.now(),
      dx: 0,
      dragging: false,
    };
  });
  element.addEventListener("pointermove", (event) => {
    if (!pointer || pointer.id !== event.pointerId) return;
    const dx = event.clientX - pointer.x,
      dy = event.clientY - pointer.y;
    if (!pointer.dragging && Math.abs(dx) > 9 && Math.abs(dx) > Math.abs(dy)) {
      pointer.dragging = true;
      element.setPointerCapture(event.pointerId);
    }
    if (pointer.dragging) {
      pointer.dx = dx;
      element.style.transform = `translateX(${dx * 0.35}px)`;
      event.preventDefault();
    }
  });
  function release(event) {
    if (!pointer || pointer.id !== event.pointerId) return;
    const state = pointer;
    pointer = null;
    element.style.transform = "";
    if (!state.dragging) return;
    suppressClick = true;
    if (element.hasPointerCapture(event.pointerId))
      element.releasePointerCapture(event.pointerId);
    if (
      event.type !== "pointercancel" &&
      (Math.abs(state.dx) > 40 ||
        Math.abs(state.dx) / (performance.now() - state.time) > 0.4)
    )
      go((state.dx < 0 ? 1 : -1) * rtl());
  }
  element.addEventListener("pointerup", release);
  element.addEventListener("pointercancel", release);
  element.addEventListener(
    "click",
    (event) => {
      if (!suppressClick) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      suppressClick = false;
    },
    true,
  );
  element.addEventListener("keydown", (event) => {
    if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
      event.preventDefault();
      go((event.key === "ArrowRight" ? 1 : -1) * rtl());
    }
  });
  return { go };
}

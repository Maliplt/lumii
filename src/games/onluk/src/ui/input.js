"use strict";
/** One captured pointer, one owner. No synthetic mouse click participates in a drag. */
function createBoardInput({
  board,
  enabled,
  begin,
  visit,
  finish,
  cancel,
  tap,
}) {
  let pointer = null;
  let geometry = [];
  function readGeometry() {
    const rect = board.getBoundingClientRect();
    geometry = Array.from(board.children)
      .filter((cell) => !cell.hidden && !cell.disabled)
      .map((cell) => {
        const visual = cell.getBoundingClientRect();
        // Layout coordinates ignore selection scale and falling animations.
        const left = rect.left + (cell.offsetLeft ?? visual.left - rect.left);
        const top = rect.top + (cell.offsetTop ?? visual.top - rect.top);
        return {
          id: Number(cell.dataset.id),
          left: left - 3,
          top: top - 3,
          right: left + (cell.offsetWidth ?? visual.right - visual.left) + 3,
          bottom: top + (cell.offsetHeight ?? visual.bottom - visual.top) + 3,
        };
      });
  }
  function cancelGesture() {
    if (!pointer) return;
    const id = pointer.id;
    pointer = null;
    if (board.hasPointerCapture(id)) board.releasePointerCapture(id);
    cancel();
  }
  function cellAt(x, y) {
    const rect = board.getBoundingClientRect();
    if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom)
      return null;
    // Full cell rectangles are hit targets, including their rounded visual corners.
    for (const r of geometry) {
      if (x >= r.left && x <= r.right && y >= r.top && y <= r.bottom)
        return r.id;
    }
    return null;
  }
  function move(event) {
    if (!pointer || event.pointerId !== pointer.id) return;
    if (!enabled()) {
      cancelGesture();
      return;
    }
    const samples = Math.max(
      1,
      Math.ceil(
        Math.hypot(event.clientX - pointer.x, event.clientY - pointer.y) / 8,
      ),
    );
    for (let i = 1; i <= samples; i++) {
      const id = cellAt(
        pointer.x + ((event.clientX - pointer.x) * i) / samples,
        pointer.y + ((event.clientY - pointer.y) * i) / samples,
      );
      if (id !== null) visit(id);
    }
    pointer.x = event.clientX;
    pointer.y = event.clientY;
  }
  board.addEventListener("pointerdown", (event) => {
    if (!enabled() || pointer || !event.isPrimary || event.button !== 0) return;
    readGeometry();
    const id = cellAt(event.clientX, event.clientY);
    if (id === null) return;
    event.preventDefault();
    pointer = { id: event.pointerId, x: event.clientX, y: event.clientY };
    board.setPointerCapture(event.pointerId);
    begin(id);
  });
  board.addEventListener("pointermove", move);
  board.addEventListener("pointerup", (event) => {
    if (!pointer || event.pointerId !== pointer.id) return;
    move(event);
    if (!pointer) return;
    const id = pointer.id;
    pointer = null;
    if (board.hasPointerCapture(id)) board.releasePointerCapture(id);
    finish();
  });
  board.addEventListener("pointercancel", (event) => {
    if (event.pointerId === pointer?.id) cancelGesture();
  });
  board.addEventListener("lostpointercapture", (event) => {
    if (event.pointerId === pointer?.id) cancelGesture();
  });
  window.addEventListener("blur", cancelGesture);
  window.addEventListener("resize", cancelGesture);
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) cancelGesture();
  });
  // detail=0 is keyboard/assistive activation. Pointer clicks are already handled.
  board.addEventListener("click", (event) => {
    if (event.detail !== 0 || !enabled()) return;
    const cell = event.target.closest("[data-id]");
    if (cell && !cell.disabled) tap(Number(cell.dataset.id));
  });
  return { cancel: cancelGesture };
}

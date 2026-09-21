"use strict";
function createSudokuBoard(element, handlers = {}) {
  if (typeof handlers === "function") handlers = { onSelect: handlers };
  element.setAttribute("role", "grid");
  element.setAttribute("aria-rowcount", "9");
  element.setAttribute("aria-colcount", "9");
  let dragging = false,
    last = -1;
  const cells = Array.from({ length: 81 }, (_, i) => {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "cell";
    b.dataset.index = i;
    b.setAttribute("role", "gridcell");
    b.setAttribute("aria-rowindex", Math.floor(i / 9) + 1);
    b.setAttribute("aria-colindex", (i % 9) + 1);
    b.style.setProperty("--i", i);
    if (i % 9 === 2 || i % 9 === 5) b.classList.add("box-right");
    if (Math.floor(i / 9) === 2 || Math.floor(i / 9) === 5)
      b.classList.add("box-bottom");
    b.addEventListener("pointerdown", (e) => {
      dragging = true;
      last = i;
      b.setPointerCapture?.(e.pointerId);
      handlers.onSelect?.(i, e);
    });
    b.addEventListener("pointerenter", (e) => {
      if (dragging && i !== last) {
        last = i;
        handlers.onDrag?.(i, e);
      }
    });
    b.addEventListener("pointerup", () => (dragging = false));
    b.addEventListener("pointercancel", () => (dragging = false));
    b.addEventListener("focus", (e) => {
      if (!dragging && e.detail !== 0) handlers.onSelect?.(i, e);
    });
    element.append(b);
    return b;
  });
  document.addEventListener("pointerup", () => (dragging = false));
  function render(session, settings, overlay = null, focus = false) {
    const selected = session.selected,
      digit = session.board[selected] || session.selectedDigit,
      conflicts = SudokuEngine.conflicts(session.board),
      selectedSet = new Set(session.selectedCells || [selected]);
    const focusSet = new Set(overlay?.focusCells || []),
      supportSet = new Set(overlay?.supportCells || []),
      elimSet = new Set((overlay?.eliminations || []).map((e) => e.cell)),
      resultSet = new Set((overlay?.placements || []).map((e) => e.cell));
    cells.forEach((cell, i) => {
      const value = session.board[i],
        notes = session.notes[i];
      const html = value
        ? '<span class="digit">' + value + "</span>"
        : notes
          ? '<span class="pencil-grid">' +
            Array.from(
              { length: 9 },
              (_, n) =>
                '<span class="' +
                (overlay?.eliminations?.some(
                  (e) => e.cell === i && e.digit === n + 1,
                )
                  ? "candidate-cut"
                  : "") +
                '">' +
                (notes & (1 << (n + 1)) ? n + 1 : "") +
                "</span>",
            ).join("") +
            "</span>"
          : "";
      if (cell.innerHTML !== html) cell.innerHTML = html;
      const states = {
        given: !!session.givens[i],
        selected: i === selected,
        "selected-multi": selectedSet.has(i) && i !== selected,
        related:
          settings.highlight &&
          selected >= 0 &&
          SudokuEngine.peers[selected].includes(i),
        same: !!digit && value === digit,
        error:
          settings.check &&
          !!value &&
          (value !== session.solution[i] || conflicts[i]),
        "hint-focus": focusSet.has(i),
        "hint-support": supportSet.has(i),
        "hint-eliminate": elimSet.has(i),
        "hint-result": resultSet.has(i),
      };
      for (const [k, v] of Object.entries(states)) cell.classList.toggle(k, v);
      cell.dataset.mark = session.marks?.[i] || "";
      const noteText = notes ? SudokuTechniques.digits(notes).join(", ") : "";
      cell.setAttribute(
        "aria-label",
        SudokuText.t("hintCell", { r: Math.floor(i / 9) + 1, c: (i % 9) + 1 }) +
          (value
            ? ", " + value
            : noteText
              ? ", " + SudokuText.t("notes") + " " + noteText
              : ""),
      );
      cell.setAttribute("aria-selected", String(selectedSet.has(i)));
      cell.tabIndex = i === selected ? 0 : -1;
    });
    if (focus && selected >= 0) cells[selected].focus({ preventScroll: true });
  }
  function pulse(indices, type = "placed") {
    for (const i of indices) {
      cells[i].classList.remove(type);
      void cells[i].offsetWidth;
      cells[i].classList.add(type);
      setTimeout(() => cells[i].classList.remove(type), 700);
    }
  }
  function clearEffects() {
    for (const c of cells) c.classList.remove("placed", "shake", "unit");
  }
  return { render, pulse, clearEffects, cells };
}

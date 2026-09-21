"use strict";
const SudokuSession = (() => {
  const cloneState = (s) => ({
    board: [...s.board],
    notes: [...s.notes],
    marks: [...(s.marks || Array(81).fill(""))],
    mistakes: s.mistakes,
    hints: s.hints,
    hintLevels: { ...s.hintLevels },
    completed: s.completed,
    selected: s.selected,
  });
  function create(puzzle, options = {}) {
    const selected = puzzle.givens.indexOf(0);
    return {
      ...options,
      givens: [...puzzle.givens],
      solution: [...puzzle.solution],
      board: [...puzzle.givens],
      notes: options.lessonNotes ? [...options.lessonNotes] : Array(81).fill(0),
      marks: Array(81).fill(""),
      history: [],
      future: [],
      elapsed: 0,
      mistakes: 0,
      hints: 0,
      hintLevels: { direction: 0, logic: 0, apply: 0 },
      selected,
      selectedCells: [selected],
      selectedDigit: 0,
      inputMode: "cell",
      completed: false,
      startedAt: Date.now(),
    };
  }
  function ensure(s) {
    s.history ||= [];
    s.future ||= [];
    s.hintLevels ||= { direction: 0, logic: 0, apply: s.hints || 0 };
    s.selectedCells ||= [s.selected];
    s.selectedDigit ||= 0;
    s.inputMode ||= "cell";
    s.marks ||= Array(81).fill("");
  }
  function commit(s, before, type, meta = {}) {
    ensure(s);
    s.history.push({ type, before, after: cloneState(s), meta });
    if (s.history.length > 200) s.history.shift();
    s.future = [];
  }
  function input(
    s,
    value,
    pencil = false,
    index = s.selected,
    refreshNotes = false,
  ) {
    ensure(s);
    if (index < 0 || s.givens[index] || s.completed) return null;
    const before = cloneState(s);
    if (pencil && value) {
      if (s.board[index]) return null;
      s.notes[index] ^= 1 << value;
      commit(s, before, "note", { index, value });
      return { type: "note", index };
    }
    if (s.board[index] === value) value = 0;
    s.board[index] = value;
    s.notes[index] = 0;
    if (value && value !== s.solution[index]) s.mistakes++;
    if (value === s.solution[index])
      for (const peer of SudokuEngine.peers[index])
        s.notes[peer] &= ~(1 << value);
    if (refreshNotes && !pencil)
      s.notes = s.board.map((v, i) =>
        v
          ? 0
          : SudokuEngine.candidates(s.board, i).reduce(
              (m, n) => m | (1 << n),
              0,
            ),
      );
    s.completed = s.board.every((n, i) => n === s.solution[i]);
    commit(
      s,
      before,
      value && value !== s.solution[index]
        ? "error"
        : value
          ? "place"
          : "erase",
      { index, value },
    );
    return {
      type:
        value && value !== s.solution[index]
          ? "error"
          : value
            ? "place"
            : "erase",
      index,
      value,
    };
  }
  function restore(s, state) {
    for (const k of ["board", "notes", "marks"])
      s[k] = [...(state[k] || Array(81).fill(""))];
    for (const k of ["mistakes", "hints", "completed", "selected"])
      s[k] = state[k];
    s.hintLevels = { ...state.hintLevels };
    s.selectedCells = [s.selected];
  }
  function undo(s) {
    ensure(s);
    const action = s.history.pop();
    if (!action || s.completed) return false;
    restore(s, action.before);
    s.future.push(action);
    return true;
  }
  function redo(s) {
    ensure(s);
    const action = s.future.pop();
    if (!action) return false;
    restore(s, action.after);
    s.history.push(action);
    return true;
  }
  function autoNotes(s) {
    ensure(s);
    const before = cloneState(s);
    s.notes = s.board.map((v, i) =>
      v
        ? 0
        : SudokuEngine.candidates(s.board, i).reduce((m, n) => m | (1 << n), 0),
    );
    commit(s, before, "auto-notes");
  }
  function cycleMarks(s) {
    ensure(s);
    const before = cloneState(s),
      order = ["", "a", "b", "c"],
      cells = s.selectedCells?.length ? s.selectedCells : [s.selected],
      next = order[(order.indexOf(s.marks[cells[0]]) + 1) % order.length];
    for (const i of cells) if (i >= 0 && !s.givens[i]) s.marks[i] = next;
    commit(s, before, "mark", { cells: [...cells], mark: next });
    return next;
  }
  function applyHint(s, hint) {
    ensure(s);
    const before = cloneState(s);
    for (const p of hint.placements || []) {
      s.board[p.cell] = p.digit;
      s.notes[p.cell] = 0;
      s.selected = p.cell;
      for (const peer of SudokuEngine.peers[p.cell])
        s.notes[peer] &= ~(1 << p.digit);
    }
    for (const e of hint.eliminations || []) {
      if (!s.notes[e.cell])
        s.notes[e.cell] = SudokuEngine.candidates(s.board, e.cell).reduce(
          (m, n) => m | (1 << n),
          0,
        );
      s.notes[e.cell] &= ~(1 << e.digit);
    }
    s.hints++;
    s.hintLevels.apply++;
    s.completed = s.board.every((n, i) => n === s.solution[i]);
    commit(s, before, "hint", { technique: hint.technique });
  }
  function progress(s) {
    const total = s.givens.filter((v) => !v).length,
      correct = s.board.reduce(
        (n, v, i) => n + (!s.givens[i] && v === s.solution[i] ? 1 : 0),
        0,
      );
    return { correct, total, percent: total ? (correct / total) * 100 : 100 };
  }
  return {
    create,
    ensure,
    input,
    undo,
    redo,
    autoNotes,
    cycleMarks,
    applyHint,
    progress,
  };
})();
if (typeof module !== "undefined") module.exports = SudokuSession;

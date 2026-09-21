"use strict";
const SudokuFeedback = (() => {
  const listeners = new Map();
  function on(type, handler) {
    const list = listeners.get(type) || [];
    list.push(handler);
    listeners.set(type, list);
    return () =>
      listeners.set(
        type,
        list.filter((x) => x !== handler),
      );
  }
  function emit(type, detail = {}) {
    for (const handler of listeners.get(type) || []) handler(detail);
  }
  function vibrate(pattern, enabled) {
    if (enabled && navigator.vibrate) navigator.vibrate(pattern);
  }
  function install(getSettings) {
    on("digit:placed", () => {
      const s = getSettings();
      SudokuAudio.play("place", s.sound);
      vibrate(8, s.haptics);
    });
    on("note:changed", () => SudokuAudio.play("note", getSettings().sound));
    on("digit:error", () => {
      const s = getSettings();
      SudokuAudio.play("error", s.sound);
      vibrate(20, s.haptics);
    });
    on("history:undo", () => SudokuAudio.play("erase", getSettings().sound));
    on("history:redo", () => SudokuAudio.play("place", getSettings().sound));
    on("unit:completed", () => {
      const s = getSettings();
      SudokuAudio.play("unit", s.sound);
      vibrate(10, s.haptics);
    });
    on("puzzle:completed", () => {
      const s = getSettings();
      SudokuAudio.play("win", s.sound);
      vibrate([25, 45, 40], s.haptics);
    });
  }
  return { on, emit, install };
})();

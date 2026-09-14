"use strict";
const Store2048 = (() => {
  const KEY = "puzzle-suite.v1.2048";
  let writable = true,
    data = {
      schemaVersion: 1,
      gameId: "2048",
      language: "tr",
      muted: false,
      theme: "light",
      learned: false,
      best: 0,
      session: null,
    };
  try {
    const old = JSON.parse(GameSave.storage.getItem(KEY));
    if (old?.schemaVersion === 1) {
      data.language = Text2048.LANGUAGES.includes(old.language)
        ? old.language
        : "tr";
      data.muted = old.muted === true;
      data.theme = old.theme === "dark" ? "dark" : "light";
      data.learned = old.learned === true;
      data.best =
        Number.isSafeInteger(old.best) && old.best >= 0 ? old.best : 0;
      const s = old.session;
      if (
        s &&
        Game2048.valid(s.board) &&
        s.board.some(Boolean) &&
        Number.isSafeInteger(s.score) &&
        s.score >= 0 &&
        Number.isSafeInteger(s.moves) &&
        s.moves >= 0
      )
        data.session = {
          board: s.board,
          score: s.score,
          moves: s.moves,
          won: s.won === true,
        };
    }
  } catch {
    writable = false;
  }

  function save() {
    try {
      GameSave.storage.setItem(KEY, JSON.stringify(data));
    } catch {
      writable = false;
    }
    return writable;
  }
  return {
    data,
    save,
    get writable() {
      return writable;
    },
  };
})();

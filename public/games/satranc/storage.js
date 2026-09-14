"use strict";
const ChessStore = (() => {
  const data = {
    version: 1,
    language: "tr",
    theme: "light",
    muted: false,
    lessons: [],
    wins: {},
    session: null,
  };
  function validSession(session) {
    try {
      if (
        !session ||
        !["solo", "local"].includes(session.mode) ||
        !["w", "b"].includes(session.human) ||
        !Number.isInteger(session.level) ||
        session.level < 1 ||
        session.level >
          (typeof ChessOpponents === "undefined" ? 12 : ChessOpponents.length)
      )
        return false;
      if (![0, 5, 10, 15].includes(session.minutes)) return false;
      if (
        session.result &&
        (session.result.over !== true ||
          ![null, "w", "b"].includes(session.result.winner) ||
          ![
            "mate",
            "stalemate",
            "material",
            "seventyfive",
            "fivefold",
            "claimed",
            "agreed",
            "timeout",
            "resigned",
          ].includes(session.result.reason))
      )
        return false;
      if (
        !Array.isArray(session.log) ||
        session.log.length > 10000 ||
        !Array.isArray(session.clocks) ||
        session.clocks.length !== 2 ||
        session.clocks.some((t) => !Number.isFinite(t) || t < 0)
      )
        return false;
      let state = Chess.parse();
      for (const code of session.log) {
        const move = Chess.legal(state).find((m) => Chess.uci(m) === code);
        if (!move) return false;
        state = Chess.apply(state, move);
      }
      return Chess.fen(state) === session.fen;
    } catch {
      return false;
    }
  }
  try {
    const saved = JSON.parse(GameSave.storage.getItem("satranc.v1"));
    if (saved?.version === 1) {
      if (ChessText.languages.includes(saved.language))
        data.language = saved.language;
      data.theme = saved.theme === "dark" ? "dark" : "light";
      data.muted = saved.muted === true;
      data.lessons = Array.isArray(saved.lessons)
        ? [
            ...new Set(
              saved.lessons.filter(
                (n) => Number.isInteger(n) && n >= 0 && n < ChessLessons.length,
              ),
            ),
          ]
        : [];
      for (const [key, n] of Object.entries(saved.wins || {}))
        if (
          Number(key) >= 1 &&
          Number(key) <= 12 &&
          Number.isSafeInteger(n) &&
          n >= 0
        )
          data.wins[key] = n;
      if (validSession(saved.session)) data.session = saved.session;
    }
  } catch {}
  const save = () =>
    GameSave.storage.setItem("satranc.v1", JSON.stringify(data));
  return { data, save, validSession };
})();

"use strict";
const ArrowStore = (() => {
  const defaults = {
    version: 1,
    boardRevision: 5,
    language: "tr",
    theme: "light",
    muted: false,
    learned: false,
    next: 1,
    records: {},
    session: null,
  };
  let saved;
  try {
    saved = JSON.parse(GameSave.storage.getItem("siyril.v1"));
  } catch {}
  const data = { ...defaults };
  if (saved?.version === 1) {
    data.language = ["tr", "en", "es", "fr", "ar", "de"].includes(
      saved.language,
    )
      ? saved.language
      : "tr";
    data.theme = saved.theme === "dark" ? "dark" : "light";
    data.muted = saved.muted === true;
    data.learned = saved.learned === true;
    data.next =
      Number.isInteger(saved.next) && saved.next > 0 && saved.next <= 10000
        ? saved.next
        : 1;
    if (saved.records && typeof saved.records === "object")
      for (const [id, r] of Object.entries(saved.records)) {
        if (
          /^\d+$/.test(id) &&
          Number(id) > 0 &&
          r &&
          Number.isInteger(r.score) &&
          r.score >= 0 &&
          [1, 2, 3].includes(r.stars)
        )
          data.records[id] = { score: r.score, stars: r.stars };
      }
    const s = saved.session;
    if (
      s &&
      saved.boardRevision === 5 &&
      Number.isInteger(s.level) &&
      s.level > 0 &&
      s.level <= data.next &&
      Array.isArray(s.remaining) &&
      Number.isInteger(s.lives) &&
      s.lives > 0 &&
      s.lives <= 3 &&
      Number.isInteger(s.score) &&
      s.score >= 0 &&
      Number.isInteger(s.hints) &&
      s.hints >= 0 &&
      Number.isFinite(s.elapsed) &&
      s.elapsed >= 0
    ) {
      const b = ArrowPuzzle.generate(s.level);
      if (
        s.remaining.length > 0 &&
        new Set(s.remaining).size === s.remaining.length &&
        s.remaining.every(
          (i) => Number.isInteger(i) && i >= 0 && i < b.paths.length,
        )
      )
        data.session = {
          level: s.level,
          remaining: s.remaining,
          lives: s.lives,
          score: s.score,
          hints: s.hints,
          elapsed: s.elapsed,
        };
    }
  }
  function save() {
    GameSave.storage.setItem("siyril.v1", JSON.stringify(data));
  }
  return { data, save };
})();

"use strict";
const SortStore = (() => {
  const data = {
    version: 1,
    language: "tr",
    theme: "light",
    muted: false,
    learned: false,
    next: 1,
    records: {},
    session: null,
  };
  function validBoard(tubes, level) {
    const expected = ColorSort.level(level);
    if (!Array.isArray(tubes) || tubes.length !== expected.tubes.length)
      return false;
    const counts = Array(expected.colors).fill(0);
    for (const tube of tubes) {
      if (!Array.isArray(tube) || tube.length > ColorSort.capacity)
        return false;
      for (const color of tube) {
        if (!Number.isInteger(color) || color < 0 || color >= counts.length)
          return false;
        counts[color]++;
      }
    }
    return counts.every((count) => count === ColorSort.capacity);
  }
  try {
    const saved = JSON.parse(GameSave.storage.getItem("renk-renk.v1"));
    if (saved?.version === 1) {
      if (SortText.languages.includes(saved.language))
        data.language = saved.language;
      data.theme = saved.theme === "dark" ? "dark" : "light";
      data.muted = saved.muted === true;
      data.learned = saved.learned === true;
      if (Number.isInteger(saved.next) && saved.next > 0 && saved.next <= 10000)
        data.next = saved.next;
      for (const [key, record] of Object.entries(saved.records || {})) {
        if (
          /^[1-9]\d*$/.test(key) &&
          Number(key) <= 10000 &&
          Number.isInteger(record?.score) &&
          record.score >= 0 &&
          [1, 2, 3].includes(record.stars)
        )
          data.records[key] = { score: record.score, stars: record.stars };
      }
      const session = saved.session;
      if (
        session &&
        Number.isInteger(session.level) &&
        session.level > 0 &&
        session.level <= data.next &&
        Number.isInteger(session.moves) &&
        session.moves >= 0 &&
        Number.isInteger(session.hints) &&
        session.hints >= 0 &&
        validBoard(session.tubes, session.level)
      ) {
        const isScore = (value) => Number.isSafeInteger(value) && value >= 0;
        const entries = Array.isArray(session.history)
          ? session.history
              .map((tubes, index) => ({
                tubes,
                score: session.historyScores?.[index],
              }))
              .slice(-80)
              .filter((entry) => validBoard(entry.tubes, session.level))
          : [];
        data.session = {
          level: session.level,
          tubes: ColorSort.clone(session.tubes),
          moves: session.moves,
          hints: session.hints,
          score: isScore(session.score)
            ? session.score
            : session.tubes.filter(ColorSort.complete).length * 250,
          history: entries.map((entry) => ColorSort.clone(entry.tubes)),
          historyScores: entries.map((entry) =>
            isScore(entry.score)
              ? entry.score
              : entry.tubes.filter(ColorSort.complete).length * 250,
          ),
        };
      }
    }
  } catch {}
  function save() {
    GameSave.storage.setItem("renk-renk.v1", JSON.stringify(data));
  }
  return { data, save, validBoard };
})();

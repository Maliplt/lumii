"use strict";
const SudokuStore = (() => {
  const initial = () => ({
    version: 2,
    language: "tr",
    theme: "light",
    sound: true,
    haptics: true,
    motion: "full",
    check: true,
    highlight: true,
    focus: false,
    autoNotes: false,
    inputMode: "cell",
    session: null,
    records: [],
    levels: {},
    daily: {},
    days: [],
    mastery: {},
    learned: [],
    wins: 0,
    perfect: 0,
    best: {},
    weeklyChoices: ["solve5", "perfect", "technique"],
  });
  let data = initial();
  const validBoard = (b) =>
    Array.isArray(b) &&
    b.length === 81 &&
    b.every((n) => Number.isInteger(n) && n >= 0 && n <= 9);
  function validSession(s) {
    return (
      s &&
      validBoard(s.board) &&
      validBoard(s.givens) &&
      validBoard(s.solution) &&
      Array.isArray(s.notes) &&
      s.notes.length === 81 &&
      [0, 1, 2, 3].includes(s.difficulty) &&
      ["classic", "daily", "journey", "custom"].includes(s.mode) &&
      typeof s.id === "string"
    );
  }
  function sanitize(saved) {
    if (!saved || ![1, 2].includes(saved.version)) return;
    for (const k of ["sound", "haptics", "check", "highlight", "autoNotes"])
      if (typeof saved[k] === "boolean") data[k] = saved[k];
    for (const k of ["language", "theme"])
      if (typeof saved[k] === "string") data[k] = saved[k];
    if (!SudokuText.languages[data.language]) data.language = "tr";
    if (!["light", "dark"].includes(data.theme)) data.theme = "light";
    data.focus = false;
    data.inputMode = "cell";
    if (validSession(saved.session) && !saved.session.completed) {
      data.session = saved.session;
      SudokuSession.ensure(data.session);
    }
    data.records = Array.isArray(saved.records)
      ? saved.records
          .filter(
            (r) => r && typeof r.id === "string" && Number.isFinite(r.elapsed),
          )
          .slice(0, 250)
      : [];
    data.days = Array.isArray(saved.days)
      ? [
          ...new Set(saved.days.filter((d) => /^\d{4}-\d{2}-\d{2}$/.test(d))),
        ].slice(-1000)
      : [];
    data.levels =
      saved.levels && typeof saved.levels === "object" ? saved.levels : {};
    data.daily =
      saved.daily && typeof saved.daily === "object" ? saved.daily : {};
    data.mastery =
      saved.mastery && typeof saved.mastery === "object" ? saved.mastery : {};
    data.learned = Array.isArray(saved.learned)
      ? saved.learned
      : saved.learned === true
        ? ["basics"]
        : [];
    for (const k of ["wins", "perfect"])
      if (Number.isSafeInteger(saved[k]) && saved[k] >= 0) data[k] = saved[k];
    data.best = saved.best && typeof saved.best === "object" ? saved.best : {};
  }
  try {
    const read = (key) => {
        try {
          return GameSave.storage.getItem(key) ?? localStorage.getItem(key);
        } catch {
          return localStorage.getItem(key);
        }
      },
      v2 = JSON.parse(read("sudoku.v2")),
      v1 = v2 ? null : JSON.parse(read("sudoku.v1"));
    sanitize(v2 || v1);
  } catch {}
  function dateKey(date = new Date()) {
    return [
      date.getFullYear(),
      String(date.getMonth() + 1).padStart(2, "0"),
      String(date.getDate()).padStart(2, "0"),
    ].join("-");
  }
  function save() {
    data.version = 2;
    const value = JSON.stringify(data);
    try {
      GameSave.storage.setItem("sudoku.v2", value);
      return true;
    } catch {
      try {
        localStorage.setItem("sudoku.v2", value);
        return true;
      } catch {
        return false;
      }
    }
  }
  function streak() {
    let day = new Date(),
      count = 0;
    if (!data.days.includes(dateKey(day))) day.setDate(day.getDate() - 1);
    while (data.days.includes(dateKey(day))) {
      count++;
      day.setDate(day.getDate() - 1);
    }
    return count;
  }
  function techniqueFor(s) {
    return (
      s.lastTechnique ||
      [
        "naked-single",
        "hidden-single",
        "naked-pair",
        "locked-candidate-pointing",
      ][s.difficulty] ||
      "naked-single"
    );
  }
  function complete(s) {
    const today = dateKey(),
      duplicate = data.records.some((r) => r.id === s.id),
      stars =
        s.hints === 0 && s.mistakes === 0
          ? 3
          : s.hints <= 2 && s.mistakes <= 3
            ? 2
            : 1,
      best =
        !s.hints &&
        (data.best[s.difficulty] === undefined ||
          s.elapsed < data.best[s.difficulty]),
      technique = techniqueFor(s),
      record = {
        id: s.id,
        mode: s.mode,
        level: s.level || null,
        difficulty: s.difficulty,
        elapsed: Math.round(s.elapsed),
        mistakes: s.mistakes,
        hints: s.hints,
        date: s.date || today,
        stars,
        technique,
      };
    if (!duplicate) {
      data.records.unshift(record);
      data.records = data.records.slice(0, 250);
      data.wins++;
      if (!s.hints && !s.mistakes) data.perfect++;
      data.mastery[technique] =
        (data.mastery[technique] || 0) + (s.hints ? 1 : 3);
    }
    if (best) data.best[s.difficulty] = Math.round(s.elapsed);
    if (s.mode === "journey")
      data.levels[s.level] = Math.max(data.levels[s.level] || 0, stars);
    if (s.mode === "daily") {
      data.daily[s.date || today] ||= {};
      data.daily[s.date || today][s.difficulty] = stars;
    }
    if (!data.days.includes(today)) data.days.push(today);
    data.session = null;
    save();
    return { stars, best, technique };
  }
  function weekly() {
    const since = new Date();
    since.setDate(since.getDate() - 6);
    const rows = data.records.filter(
      (r) => new Date(r.date + "T12:00:00") >= since,
    );
    return {
      solved: rows.length,
      perfect: rows.filter((r) => !r.mistakes && !r.hints).length,
      techniques: new Set(rows.map((r) => r.technique)).size,
    };
  }
  return { data, save, dateKey, streak, complete, weekly };
})();

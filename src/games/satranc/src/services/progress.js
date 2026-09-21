"use strict";
const ChessProgress = (() => {
  const data = ChessStore.data;
  const defaults = {
    profile: { name: "", avatar: 0, color: 0 },
    xp: 0,
    puzzles: {},
    daily: {},
    activity: [],
    matches: [],
    totals: { played: 0, won: 0, drawn: 0, lost: 0 },
    board: "forest",
    background: "plain",
  };
  let saved = {};
  try {
    saved = JSON.parse(GameSave.storage.getItem("satranc.v1"))?.journey || {};
  } catch {}
  const journey = (data.journey = { ...defaults });
  if (
    saved.challenge &&
    Number.isInteger(saved.challenge.id) &&
    saved.challenge.id >= 1 &&
    saved.challenge.id <= 100
  )
    journey.challenge = saved.challenge;
  if (saved.profile && typeof saved.profile.name === "string")
    journey.profile = {
      name: saved.profile.name.slice(0, 24),
      avatar: Number.isInteger(saved.profile.avatar)
        ? Math.max(0, Math.min(7, saved.profile.avatar))
        : 0,
      color: Number.isInteger(saved.profile.color)
        ? Math.max(0, Math.min(5, saved.profile.color))
        : 0,
    };
  if (Number.isSafeInteger(saved.xp) && saved.xp >= 0) journey.xp = saved.xp;
  const validDay = (d) => /^\d{4}-\d{2}-\d{2}$/.test(d);
  journey.activity = Array.isArray(saved.activity)
    ? [...new Set(saved.activity.filter(validDay))].sort().slice(-800)
    : [];
  for (const [id, record] of Object.entries(saved.puzzles || {}))
    if (
      /^\d+$/.test(id) &&
      Number(id) >= 1 &&
      Number(id) <= 100 &&
      [1, 2, 3].includes(record?.stars)
    )
      journey.puzzles[id] = { stars: record.stars };
  for (const [day, value] of Object.entries(saved.daily || {}))
    if (validDay(day) && value === true) journey.daily[day] = true;
  if (["forest", "sand", "ocean", "ember", "stone"].includes(saved.board))
    journey.board = saved.board;
  if (["plain", "mountains", "arches", "stars"].includes(saved.background))
    journey.background = saved.background;
  journey.matches = Array.isArray(saved.matches)
    ? saved.matches
        .filter(
          (m) =>
            ChessStore.validSession(m) && typeof m.id === "string" && m.result,
        )
        .slice(0, 100)
    : [];
  if (saved.totals)
    for (const k of ["played", "won", "drawn", "lost"])
      if (Number.isSafeInteger(saved.totals[k]) && saved.totals[k] >= 0)
        journey.totals[k] = saved.totals[k];
  function day(date = new Date()) {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
  }
  function active() {
    const today = day();
    if (!journey.activity.includes(today)) {
      journey.activity.push(today);
      journey.activity = journey.activity.sort().slice(-800);
    }
    ChessStore.save();
  }
  function streak() {
    const dates = new Set(journey.activity),
      d = new Date();
    if (!dates.has(day(d))) d.setDate(d.getDate() - 1);
    let count = 0;
    while (dates.has(day(d))) {
      count++;
      d.setDate(d.getDate() - 1);
    }
    return count;
  }
  function dailyId() {
    let n = 0;
    for (const c of day()) n = (n * 31 + c.charCodeAt(0)) >>> 0;
    return 1 + (n % 100);
  }
  function lesson(first) {
    if (first) journey.xp += 30;
    active();
    return first ? 30 : 0;
  }
  function puzzle(id, errors, hints, daily) {
    const stars = hints ? 1 : errors ? 2 : 3,
      previous = journey.puzzles[id];
    journey.puzzles[id] = { stars: Math.max(stars, previous?.stars || 0) };
    let earned = previous ? 0 : 40 + Math.floor((id - 1) / 10) * 10;
    if (daily && validDay(daily) && !journey.daily[daily]) {
      journey.daily[daily] = true;
      earned += 50;
    }
    journey.xp += earned;
    active();
    return earned;
  }
  function match(session) {
    if (session.recorded) return 0;
    session.recorded = true;
    const record = structuredClone(session);
    record.id ??=
      String(Date.now()) + "-" + Math.random().toString(36).slice(2, 8);
    record.endedAt = new Date().toISOString();
    journey.matches.unshift(record);
    journey.matches = journey.matches.slice(0, 100);
    journey.totals.played++;
    const won = session.result.winner === session.human,
      draw = !session.result.winner;
    if (session.mode === "solo")
      journey.totals[draw ? "drawn" : won ? "won" : "lost"]++;
    const eligible =
      session.log.length >= 10 || session.result.reason === "mate";
    const reward = eligible
      ? session.mode === "solo"
        ? won
          ? typeof ChessOpponents === "undefined"
            ? session.level * 60
            : ChessOpponents[session.level - 1].reward
          : draw
            ? 20
            : 10
        : 15
      : 0;
    journey.xp += reward;
    if (eligible) active();
    ChessStore.save();
    return reward;
  }
  function applyTheme() {
    document.documentElement.dataset.board = journey.board;
    document.documentElement.dataset.scene = journey.background;
  }
  return {
    data: journey,
    day,
    active,
    streak,
    dailyId,
    lesson,
    puzzle,
    match,
    applyTheme,
  };
})();

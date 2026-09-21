"use strict";
const SudokuScreens = (() => {
  const t = (...args) => SudokuText.t(...args);
  const icon = SudokuIcons;
  const button = (action, label, glyph, className = "button", value = "") =>
    `<button class="${className}" data-action="${action}"${value !== "" ? ` data-value="${value}"` : ""} aria-label="${label}">${glyph ? icon(glyph) : ""}<span>${label}</span></button>`;
  function time(value) {
    const seconds = Math.floor(value || 0);
    return `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;
  }
  const difficulty = (value) => t(["easy", "medium", "hard", "expert"][value]);
  const titlebar = (title, extra = "") =>
    `<div class="screen-heading">${button("home", t("back"), "back", "back-button")}<h1>${title}</h1><span>${extra}</span></div>`;
  function nav(active) {
    const items = [
      ["home", "play", "grid"],
      ["journey", "journey", "trophy"],
      ["learn-screen", "learn", "book"],
    ];
    return `<nav class="app-nav" aria-label="${t("navigation")}">${items.map(([action, label, glyph]) => button(action, t(label), glyph, `nav-button ${active === action ? "active" : ""}`)).join("")}</nav>`;
  }
  function miniBoard(session) {
    const fallback =
      "530070000600195000098000060800060003400803001700020006060000280000419005000080079";
    const board = session?.board || fallback.split("").map(Number);
    const givens = session?.givens || board;
    return `<div class="mini-board" aria-hidden="true">${board.map((value, index) => `<i class="${value ? "filled" : ""} ${givens[index] ? "given" : ""}">${value || ""}</i>`).join("")}</div>`;
  }
  function dayStrip(count = 14) {
    const dates = [];
    for (let offset = count - 1; offset >= 0; offset--) {
      const date = new Date();
      date.setHours(12, 0, 0, 0);
      date.setDate(date.getDate() - offset);
      const key = SudokuStore.dateKey(date);
      const label = new Intl.DateTimeFormat(SudokuText.language, {
        weekday: "narrow",
      }).format(date);
      dates.push(
        `<span class="activity-day ${SudokuStore.data.days.includes(key) ? "active" : ""} ${offset === 0 ? "today" : ""}" title="${key}"><i></i><small>${label}</small></span>`,
      );
    }
    return dates.join("");
  }
  function home() {
    const data = SudokuStore.data;
    const session = data.session;
    const resume = Boolean(session);
    const progress = resume
      ? SudokuSession.progress(session)
      : { correct: 0, total: 81 };
    const percent = resume
      ? Math.round((progress.correct / Math.max(1, progress.total)) * 100)
      : 0;
    const today = data.daily[SudokuStore.dateKey()] || {};
    const journeyDone = Object.keys(data.levels).length;
    const learned = Object.keys(data.mastery).length;
    return `<section class="screen home-hub"><div class="hub-hero"><div class="hub-copy"><span class="eyebrow">SUDOKU · 9 × 9</span><h1>${t("welcomeBack")}</h1><p>${t(resume ? "resumeCopy" : "startFirstPuzzle")}</p></div><div class="hub-art">${miniBoard(session)}</div><button class="hub-play" data-action="${resume ? "resume" : "new"}"><span class="hub-play-icon">${icon("play")}</span><span><strong>${t(resume ? "resume" : "play")}</strong><small>${resume ? `${difficulty(session.difficulty)} · ${time(session.elapsed)} · ${percent}%` : t("chooseDifficulty")}</small></span>${icon("arrow")}</button></div><div class="hub-modes">${[
      [
        "daily-quick",
        "calendar",
        "daily",
        `${Object.keys(today).length} / 4 ${t("completedShort")}`,
      ],
      [
        "journey",
        "trophy",
        "journey",
        `${journeyDone} / 60 ${t("completedShort")}`,
      ],
      ["learn-screen", "book", "learn", `${learned} / 11 ${t("techniques")}`],
    ]
      .map(
        ([action, glyph, label, detail]) =>
          `<button class="hub-mode" data-action="${action}"><span class="hub-mode-icon">${icon(glyph)}</span><span class="hub-mode-text"><b>${t(label)}</b><small>${detail}</small></span>${icon("arrow")}</button>`,
      )
      .join("")}</div></section>`;
  }

  function setup() {
    const labels = ["difficulty1", "difficulty2", "difficulty3", "difficulty4"];
    return `<section class="screen setup-v2">${titlebar(t("newGame"))}<div class="setup-hero"><span class="setup-emblem">${icon("grid")}</span><div><span class="eyebrow">${t("classic")}</span><h2>${t("chooseDifficulty")}</h2><p>${t("difficultyGuide")}</p></div></div><div class="difficulty-grid">${[0, 1, 2, 3].map((level) => `<button class="difficulty-card-v2 d${level}" data-action="start" data-value="${level}"><span class="difficulty-symbol">${["●", "◆", "▲", "★"][level]}</span><span><h3>${difficulty(level)}</h3><small>${t(labels[level])}</small></span><span class="difficulty-action">${icon("play")}</span></button>`).join("")}</div><button class="custom-link" data-action="custom">${icon("pencil")}<span><b>${t("customPuzzle")}</b><small>${t("customPuzzleCopy")}</small></span>${icon("arrow")}</button></section>`;
  }
  function game(session, practice = false) {
    const label = practice
      ? t("practice")
      : session.mode === "daily"
        ? t("daily")
        : session.mode === "journey"
          ? `${t("journey")} ${session.level}`
          : t("classic");
    return `<section class="screen game-screen-v2"><header class="game-bar">${button("pause", t("pause"), "pause", "round-button")}<div class="game-title"><span>${label}</span><h1>${practice ? t(session.practiceTechnique) : difficulty(session.difficulty)}</h1></div><div class="game-status"><span id="clock-wrap"><small>${t("time")}</small><b id="clock">${time(session.elapsed)}</b></span><span id="mistakes-wrap"><small>${t("mistakes")}</small><b id="mistakes">${session.mistakes}</b></span></div></header><div class="play-layout-v2"><div class="board-column"><div id="board" class="board" dir="ltr" role="grid" aria-label="Sudoku"></div><div id="game-message" class="game-message" aria-live="polite"></div></div><aside class="control-panel"><div id="numpad" class="numpad" dir="ltr">${Array.from({ length: 9 }, (_, index) => `<button data-action="number" data-value="${index + 1}"><span>${index + 1}</span><small id="remaining-${index + 1}"></small></button>`).join("")}</div><div class="tools tools-simple">${button("undo", t("undo"), "undo", "tool")}${button("redo", t("redo"), "redo", "tool")}${button("erase", t("erase"), "erase", "tool")}${button("notes", t("notes"), "pencil", "tool")}${button("hint", t("hint"), "hint", "tool")}</div><div class="control-note">${t("longPressNote")}</div></aside></div></section>`;
  }
  const techniqueGroups = [
    ["singles", ["naked-single", "hidden-single"]],
    ["pairs", ["naked-pair", "hidden-pair"]],
    [
      "lockedCandidates",
      ["locked-candidate-pointing", "locked-candidate-claiming"],
    ],
    [
      "expertCopy",
      ["naked-triple", "hidden-triple", "x-wing", "y-wing", "swordfish"],
    ],
  ];
  function learn() {
    const data = SudokuStore.data;
    const mastered = Object.values(data.mastery).filter(
      (value) => value >= 12,
    ).length;
    return `<section class="screen lesson-library">${titlebar(t("learn"), `${mastered} / 11`)}<div class="library-intro"><h2>${t("learnTitle")}</h2><p>${t("learnIntro")}</p></div><div class="lesson-groups">${techniqueGroups
      .map(
        ([name, items], group) =>
          `<details class="lesson-group" ${group === 0 ? "open" : ""}><summary><span class="lesson-group-number">0${group + 1}</span><span><b>${t(name)}</b><small>${items.length} ${t("techniques")}</small></span><span class="disclosure">+</span></summary><div class="lesson-items">${items
            .map((id, index) => {
              const score = data.mastery[id] || 0;
              const level = score >= 12 ? 3 : score >= 6 ? 2 : score ? 1 : 0;
              return `<button data-action="practice-technique" data-value="${id}"><span class="lesson-index">${index + 1}</span><span><b>${t(id)}</b><small>${t(["notStarted", "starting", "confident", "fluent"][level])}</small></span><span class="lesson-play">${icon(level === 3 ? "check" : "play")}</span></button>`;
            })
            .join("")}</div></details>`,
      )
      .join("")}</div></section>`;
  }

  function journey(page = 0) {
    const data = SudokuStore.data;
    const completed = Object.keys(data.levels).length;
    const open = Math.min(
      60,
      Array.from({ length: 60 }, (_, i) => i + 1).find(
        (i) => !data.levels[i],
      ) || 60,
    );
    const pages = Array.from({ length: 5 }, (_, group) => {
      const first = group * 12 + 1,
        last = first + 11;
      const solved = Array.from(
        { length: 12 },
        (_, i) => data.levels[first + i],
      ).filter(Boolean).length;
      return `<section class="chapter-page" data-page="${group}" aria-label="${t("journey")} ${first}–${last}"><header class="chapter-page-head"><div><span>${t("journey")}</span><h2>${first}–${last}</h2></div><div class="chapter-count"><b>${solved}<span> / 12</span></b><small>${t("completedShort")}</small></div></header><div class="chapter-levels">${Array.from(
        { length: 12 },
        (_, index) => {
          const level = first + index,
            stars = data.levels[level],
            locked = level > open;
          return `<button class="chapter-level ${stars ? "finished" : ""} ${level === open ? "current" : ""}" data-action="level" data-value="${level}" ${locked ? "disabled" : ""} aria-label="${t("level")} ${level}"><b>${level}</b><span>${locked ? icon("lock") : stars ? "★".repeat(stars) : t("play")}</span></button>`;
        },
      ).join("")}</div></section>`;
    }).join("");
    return `<section class="screen chapter-browser">${titlebar(t("journey"), `${completed} / 60`)}<div class="chapter-deck" tabindex="0" aria-label="${t("journey")}" data-initial-page="${page}">${pages}</div><div class="chapter-controls"><button data-action="chapter" data-value="${page - 1}" aria-label="${t("previousGroup")}" ${page === 0 ? "disabled" : ""}>${icon("back")}</button><div class="chapter-dots">${Array.from({ length: 5 }, (_, i) => `<button data-action="chapter" data-value="${i}" aria-label="${t("journey")} ${i * 12 + 1}–${i * 12 + 12}" aria-current="${page === i ? "page" : "false"}"><span></span></button>`).join("")}</div><button data-action="chapter" data-value="${page + 1}" aria-label="${t("nextGroup")}" ${page === 4 ? "disabled" : ""}>${icon("arrow")}</button></div></section>`;
  }

  function stats() {
    const data = SudokuStore.data;
    const week = SudokuStore.weekly();
    const mastery = Object.entries(data.mastery)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6);
    const counts = [0, 1, 2, 3].map(
      (level) => data.records.filter((r) => r.difficulty === level).length,
    );
    const achievements = [
      ["check", t("firstSolve"), data.wins >= 1],
      ["spark", t("perfectSolve"), data.perfect >= 1],
      ["fire", t("sevenDayStreak"), SudokuStore.streak() >= 7],
      ["trophy", t("journeyTen"), Object.keys(data.levels).length >= 10],
    ];
    return `<section class="screen stats-screen-v2">${titlebar(t("profile"))}<div class="profile-hero"><div class="profile-mark">${data.wins || "0"}<span>${t("solved")}</span></div><div class="profile-intro"><span class="eyebrow">${t("allTime")}</span><h2>${t("yourProgress")}</h2><p>${t("profileFunctionalCopy")}</p></div><div class="profile-streak">${icon("fire")}<span><b>${SudokuStore.streak()}</b><small>${t("dayStreak")}</small></span></div></div><div class="profile-dashboard"><section class="activity-card"><div class="profile-card-title"><div><span class="eyebrow">${t("activity")}</span><h3>${t("last14Days")}</h3></div><b>${data.days.slice(-14).length}</b></div><div class="activity-calendar">${dayStrip(14)}</div><div class="activity-legend"><span><i></i>${t("noSolve")}</span><span><i class="on"></i>${t("solvedDay")}</span></div></section><section class="weekly-goals"><div class="profile-card-title"><div><span class="eyebrow">${t("thisWeek")}</span><h3>${t("weeklyTargets")}</h3></div></div>${[
      [t("solveFive"), week.solved, 5, "blue"],
      [t("perfectOne"), week.perfect, 1, "amber"],
      [t("useTechniques"), week.techniques, 2, "teal"],
    ]
      .map(
        ([label, value, target, color]) =>
          `<div class="goal-row"><div><span>${label}</span><b>${Math.min(value, target)}/${target}</b></div><i class="${color}"><em style="width:${Math.min(100, (value / target) * 100)}%"></em></i></div>`,
      )
      .join(
        "",
      )}</section></div><div class="profile-section-title"><div><span class="eyebrow">${t("performance")}</span><h2>${t("difficultyResults")}</h2></div><span>${data.wins} ${t("puzzles")}</span></div><div class="performance-grid">${[0, 1, 2, 3].map((level) => `<article class="performance-card d${level}"><span class="performance-rank">0${level + 1}</span><h3>${difficulty(level)}</h3><div><span><small>${t("best")}</small><b>${data.best[level] === undefined ? "—" : time(data.best[level])}</b></span><span><small>${t("solved")}</small><b>${counts[level]}</b></span></div></article>`).join("")}</div><div class="profile-lower"><section class="mastery-panel"><div class="profile-card-title"><div><span class="eyebrow">${t("mastery")}</span><h3>${t("strongestTechniques")}</h3></div></div><div class="mastery-list">${mastery.length ? mastery.map(([id, value]) => `<div><span>${t(id)}</span><i><b style="width:${Math.min(100, (value / 12) * 100)}%"></b></i><strong>${Math.min(3, Math.ceil(value / 4))}/3</strong></div>`).join("") : `<p>${t("noMastery")}</p>`}</div></section><section class="achievement-panel"><div class="profile-card-title"><div><span class="eyebrow">${t("milestones")}</span><h3>${t("achievements")}</h3></div></div><div class="achievement-grid">${achievements.map(([glyph, label, unlocked]) => `<div class="achievement ${unlocked ? "unlocked" : "locked"}"><span>${icon(unlocked ? glyph : "lock")}</span><b>${label}</b></div>`).join("")}</div></section></div>${nav("stats")}</section>`;
  }
  function settings(fromPause = false) {
    const data = SudokuStore.data;
    const toggle = (key, label, copy, glyph) =>
      `<button class="setting-row" data-action="setting" data-value="${key}" role="switch" aria-checked="${data[key]}"><span class="setting-glyph">${icon(glyph)}</span><span><b>${label}</b>${copy ? `<small>${copy}</small>` : ""}</span><i><em></em></i></button>`;
    const languages = Object.entries(SudokuText.languages)
      .map(
        ([key, label]) =>
          `<button data-action="language" data-value="${key}" aria-pressed="${data.language === key}"><img src="assets/flag-${key}.svg" alt="" width="28" height="20"><span>${label}</span></button>`,
      )
      .join("");
    const themes = ["light", "dark"]
      .map(
        (key) =>
          `<button data-action="theme" data-value="${key}" aria-pressed="${data.theme === key}"><span class="theme-swatch ${key}"></span>${t(key === "light" ? "lightTheme" : "darkTheme")}</button>`,
      )
      .join("");
    return `<div class="dialog-head settings-head"><h2 id="dialog-title">${t("settings")}</h2>${button(fromPause ? "settings-back" : "close", t(fromPause ? "back" : "close"), fromPause ? "back" : "close", "icon-button")}</div><div class="settings-body"><section class="settings-group"><div class="settings-label">${t("language")}</div><div class="language-choices">${languages}</div><div class="theme-choices">${themes}</div></section><section class="settings-group compact-toggles">${toggle("check", t("check"), t("checkCopy"), "check")}${toggle("highlight", t("highlight"), t("highlightCopy"), "grid")}${toggle("sound", t("sound"), "", "spark")}${toggle("haptics", t("haptics"), "", "fire")}</section></div>`;
  }
  return {
    button,
    titlebar,
    time,
    difficulty,
    home,
    setup,
    game,
    daily: home,
    learn,
    journey,
    stats,
    settings,
  };
})();

"use strict";
function createChessHub(actions) {
  const $ = (id) => document.getElementById(id),
    t = actions.t,
    j = ChessProgress.data;
  const home = $("home");
  home.className = "screen chess-hub";
  home.innerHTML = `<div class="hub-heading"><button id="profile-open" class="profile-chip"></button><button id="streak-open" class="streak-chip"></button></div><div class="hub-feature"><div class="feature-copy"><span class="eyebrow" id="hub-greeting"></span><h1 data-t="title"></h1><div class="xp-track"><span id="hub-level"></span><span id="hub-xp"></span><i><b id="xp-fill"></b></i></div><button id="resume" class="resume-inline" hidden></button></div><div class="feature-art" aria-hidden="true">${JourneyArt.landscape(0)}<div class="feature-knight">${ChessArt.piece("N")}</div><div class="feature-king">${ChessArt.piece("k")}</div></div><button id="daily-open" class="daily-card"></button></div><div class="hub-mode-heading"><h3 id="mode-heading"></h3><div><button id="carousel-prev" class="icon" aria-label="Previous">${ChessArt.icon("back")}</button><button id="carousel-next" class="icon" aria-label="Next">${ChessArt.icon("next")}</button></div></div><div class="mode-carousel" id="mode-carousel"><button id="solo" class="mode-card bot-card"></button><button id="academy" class="mode-card learn-card"></button><button id="puzzles-open" class="mode-card puzzle-card"></button><button id="local" class="mode-card local-card"></button></div><div class="hub-bottom"><div class="hub-stats" id="hub-stats"></div><button id="history-open" class="history-link"></button><button id="appearance-open" class="history-link"></button></div><div class="hub-play"><button id="hub-play" class="primary"></button><button id="quick-play" class="quick-link"></button></div>`;
  const main = document.querySelector("main");
  const settings = document.createElement("section");
  settings.id = "settings-screen";
  settings.className = "screen journey-screen";
  settings.hidden = true;
  settings.innerHTML = `<div class="section-heading"><button id="settings-back" class="back"></button><h2 data-t="settings"></h2></div><div class="settings-list"><div><strong data-t="languageLabel"></strong><div id="settings-language"></div></div><div><strong data-t="nightMode"></strong><div id="settings-theme"></div></div><div><strong data-t="sound"></strong><div id="settings-sound"></div></div><button id="settings-appearance" class="settings-appearance"></button></div>`;
  main.append(settings);
  $("settings-language").append(document.querySelector(".language-picker"));
  $("settings-theme").append($("theme"));
  $("settings-sound").append($("sound"));
  const settingsButton = document.createElement("button");
  settingsButton.id = "settings-open";
  settingsButton.className = "icon";
  settingsButton.setAttribute("aria-label", t("settings"));
  settingsButton.innerHTML =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="m9 3-1 3-3 1-2 5 2 5 3 1 1 3h6l1-3 3-1 2-5-2-5-3-1-1-3Z"/><circle cx="12" cy="12" r="3.5"/></svg>';
  document.querySelector(".header-tools").append(settingsButton);
  let settingsOrigin = "home";
  settingsButton.onclick = () => {
    if (!settings.hidden) return;
    settingsOrigin =
      document.querySelector("main > .screen:not([hidden])")?.id || "home";
    open("settings-screen");
  };
  $("settings-back").onclick = () => {
    const saved = ChessProgress.data.challenge;
    if (settingsOrigin === "challenge" && saved)
      actions.puzzle(saved.id, !!saved.dailyDate);
    else open(settingsOrigin);
  };
  $("settings-appearance").onclick = () => open("appearance-screen");
  for (const [id, html] of [
    [
      "puzzle-map",
      '<div class="section-heading"><button class="back" data-hub-back></button><h2 id="map-title"></h2><span id="map-progress"></span></div><div id="chapter-scroll" class="chapter-scroll"></div>',
    ],
    [
      "profile-screen",
      '<div class="section-heading"><button class="back" data-hub-back></button><h2 id="profile-title"></h2></div><div class="profile-layout"><form id="profile-form"><div id="profile-preview"></div><label for="profile-name" id="name-label"></label><input id="profile-name" maxlength="24" autocomplete="nickname"><h3 id="avatar-label"></h3><div id="avatar-options" class="avatar-options"></div><div id="avatar-colors" class="avatar-colors"></div><button id="profile-save" class="primary" type="submit"></button></form><div id="profile-stats"></div></div>',
    ],
    [
      "appearance-screen",
      '<div class="section-heading"><button class="back" data-hub-back></button><h2 id="appearance-title"></h2></div><h3 id="board-theme-title"></h3><div id="board-themes" class="theme-options"></div><h3 id="scene-title"></h3><div id="scene-options" class="theme-options"></div>',
    ],
    [
      "history-screen",
      '<div class="section-heading"><button class="back" data-hub-back></button><h2 id="history-title"></h2></div><div id="history-stats" class="history-stats"></div><div id="match-history"></div>',
    ],
    [
      "replay-screen",
      '<div class="section-heading"><button id="replay-back" class="back"></button><h2 id="replay-title"></h2></div><div class="replay-layout"><div class="board-column"><div class="board-rim"><div id="replay-board" class="board"></div></div></div><aside><p id="replay-players"></p><strong id="replay-position"></strong><div class="replay-buttons"><button id="replay-first">|←</button><button id="replay-prev">←</button><button id="replay-next">→</button><button id="replay-last">→|</button></div><div id="replay-list" class="move-list"></div></aside></div>',
    ],
  ]) {
    const section = document.createElement("section");
    section.id = id;
    section.hidden = true;
    section.className = "screen journey-screen";
    section.innerHTML = html;
    main.append(section);
  }
  const modal = document.createElement("dialog");
  modal.id = "hub-dialog";
  document.body.append(modal);
  let avatar = j.profile.avatar,
    color = j.profile.color,
    replay = null,
    positions = [],
    moveNames = [],
    cursor = 0;
  const replayBoard = new ChessBoard($("replay-board"), () => {});
  function esc(value) {
    const el = document.createElement("span");
    el.textContent = value;
    return el.innerHTML;
  }
  function profileName() {
    return j.profile.name || t("noName");
  }
  function open(id) {
    actions.navigate(id);
    render(id);
  }
  function modalShow(html) {
    modal.innerHTML = html;
    modal.showModal();
    modal.onclick = (e) => {
      if (
        e.target === modal &&
        (e.clientX < modal.getBoundingClientRect().left ||
          e.clientX > modal.getBoundingClientRect().right ||
          e.clientY < modal.getBoundingClientRect().top ||
          e.clientY > modal.getBoundingClientRect().bottom)
      )
        modal.close();
    };
  }
  function render(id = "home") {
    ChessProgress.applyTheme();
    settingsButton.setAttribute("aria-label", t("settings"));
    $("settings-back").innerHTML =
      ChessArt.icon("back") + "<span>" + t("back") + "</span>";
    $("settings-appearance").innerHTML =
      "<strong>" + t("appearance") + "</strong>" + ChessArt.icon("next");
    document.querySelectorAll("[data-hub-back]").forEach((el) => {
      el.innerHTML = ChessArt.icon("back") + "<span>" + t("back") + "</span>";
      el.onclick = () => open("home");
    });
    if (id === "home") renderHome();
    if (id === "puzzle-map") renderMap();
    if (id === "school") renderSchool();
    if (id === "profile-screen") renderProfile();
    if (id === "appearance-screen") renderAppearance();
    if (id === "history-screen") renderHistory();
    if (id === "replay-screen") renderReplay();
  }
  function renderHome() {
    const level = 1 + Math.floor(j.xp / 250),
      today = ChessProgress.day();
    $("profile-open").innerHTML =
      JourneyArt.avatar(j.profile.avatar, j.profile.color) +
      `<span><strong>${esc(profileName())}</strong><small>${t("profile")}</small></span>`;
    $("streak-open").innerHTML =
      `<svg viewBox="0 0 32 40" aria-hidden="true"><path d="M17 1C22 12 6 14 10 24c-5-2-5-7-5-7C-7 35 11 43 22 37c13-7 10-21 4-27 0 8-4 10-4 10C26 10 17 1 17 1Z" fill="#ff9a38"/><path d="M16 20c-8 11-5 16 1 16 7 0 8-7-1-16Z" fill="#ffe0a1"/></svg><strong>${ChessProgress.streak()}</strong><span>${t("streak")}</span>`;
    $("hub-greeting").textContent = t("level") + " " + level;
    home.querySelector("h1").textContent = t("title");
    $("hub-level").textContent = t("level") + " " + level;
    $("hub-xp").textContent = (j.xp % 250) + " / 250 XP";
    $("xp-fill").style.width = ((j.xp % 250) / 250) * 100 + "%";
    $("resume").hidden =
      !ChessStore.data.session || !!ChessStore.data.session.result;
    $("resume").innerHTML =
      ChessArt.icon("play") + "<span>" + t("resume") + "</span>";
    $("daily-open").innerHTML =
      `<div class="daily-mini">${ChessArt.piece("Q")}<span>${t(ChessPuzzles[ChessProgress.dailyId() - 1].goalKey || "mateGoal")}</span></div><div><small>${new Intl.DateTimeFormat(document.documentElement.lang, { day: "numeric", month: "short" }).format(new Date())}</small><strong>${t("daily")}</strong><span>${j.daily[today] ? "✓ " + t("completed") : "+50 XP"}</span></div>${ChessArt.icon("next")}`;
    $("mode-heading").textContent = t("chooseMode");
    $("carousel-prev").setAttribute("aria-label", t("previous"));
    $("carousel-next").setAttribute("aria-label", t("following"));
    $("solo").innerHTML =
      `<div class="mode-illustration bot-portraits">${JourneyArt.avatar(4, 3)}${JourneyArt.avatar(1, 1)}</div><strong>${t("solo")}</strong><small>★ — ★★★★★</small>`;
    $("academy").innerHTML =
      `<div class="mode-illustration">${ChessArt.piece("B")}<span class="lesson-glyph">A B C</span></div><strong>${t("academy")}</strong><small>${ChessStore.data.lessons.length} / ${ChessLessons.length}</small>`;
    $("puzzles-open").innerHTML =
      `<div class="mode-illustration">${ChessArt.piece("N")}<span class="puzzle-glyph">#</span></div><strong>${t("puzzles")}</strong><small>${Object.keys(j.puzzles).length} / 100</small>`;
    $("local").innerHTML =
      `<div class="mode-illustration">${ChessArt.piece("P")}${ChessArt.piece("p")}</div><strong>${t("local")}</strong><small>${t("sameDevice")}</small>`;
    $("hub-stats").innerHTML = stats();
    $("history-open").textContent = t("history");
    $("appearance-open").textContent = t("appearance");
    $("hub-play").innerHTML =
      "<span>" + t("play") + "</span>" + ChessArt.icon("play");
    $("quick-play").textContent = t("quick") + " · 5 " + t("minutes");
  }
  function stats() {
    return [
      [j.totals.played, "matches"],
      [j.totals.won, "victories"],
      [Object.keys(j.puzzles).length, "solved"],
    ]
      .map(
        ([n, key]) => `<div><strong>${n}</strong><span>${t(key)}</span></div>`,
      )
      .join("");
  }
  function renderMap() {
    const next = Math.min(
      100,
      Object.keys(j.puzzles).reduce((n, key) => (j.puzzles[n] ? n + 1 : n), 1),
    );
    $("map-title").textContent = t("journey");
    $("map-progress").textContent = Object.keys(j.puzzles).length + " / 100";
    $("chapter-scroll").innerHTML = Array.from({ length: 10 }, (_, reverse) => {
      const c = 9 - reverse;
      return `<article class="map-chapter" data-chapter="${c}" style="--chapter:${JourneyArt.palettes[c][0]};--chapter-light:${JourneyArt.palettes[c][1]}"><div class="chapter-art">${JourneyArt.landscape(c)}<div><small>${t("chapter")} ${c + 1}</small><h3>${t("chapterNames")[c]}</h3></div></div><div class="chapter-path">${Array.from(
        { length: 10 },
        (_, r) => {
          const id = c * 10 + 10 - r,
            record = j.puzzles[id],
            locked = id > next;
          return `<button class="puzzle-node ${locked ? "locked" : ""} ${record ? "completed-node" : ""} ${id === next ? "current" : ""}" data-puzzle="${id}" ${locked ? "disabled" : ""} style="--offset:${Math.sin(r * 1.35) * 150}px" aria-label="${t("puzzles")} ${id}${locked ? " · " + t("locked") : ""}"><span>${String(id).padStart(2, "0")}</span><small class="node-stars">${record ? "★".repeat(record.stars) + "☆".repeat(3 - record.stars) : "···"}</small></button>`;
        },
      ).join("")}</div></article>`;
    }).join("");
    $("chapter-scroll")
      .querySelectorAll("[data-puzzle]")
      .forEach(
        (el) => (el.onclick = () => actions.puzzle(Number(el.dataset.puzzle))),
      );
    requestAnimationFrame(() => {
      $("chapter-scroll")
        .querySelector(".current")
        ?.scrollIntoView({ block: "center", behavior: "instant" });
    });
  }
  function renderSchool() {
    const groups = [
      [0, 12, "foundations"],
      [12, 22, "tactics"],
      [22, ChessLessons.length, "endgames"],
    ];
    $("lesson-list").className = "learning-chapters";
    $("lesson-list").innerHTML = groups
      .map(
        ([from, to, key], chapter) =>
          `<article class="learning-chapter"><div class="learning-banner">${JourneyArt.landscape(chapter * 3)}<div><span>${t("chapter")} ${chapter + 1}</span><h3>${t(key)}</h3><small>${ChessStore.data.lessons.filter((i) => i >= from && i < to).length} / ${to - from}</small></div></div><div class="learning-steps">${ChessLessons.slice(
            from,
            to,
          )
            .map((l, offset) => {
              const i = from + offset,
                done = ChessStore.data.lessons.includes(i);
              return `<button class="learning-step" data-lesson="${i}"><span>${done ? "✓" : String(i + 1).padStart(2, "0")}</span><strong>${t(l.name)}</strong>${ChessArt.piece(l.piece)}</button>`;
            })
            .join("")}</div></article>`,
      )
      .join("");
  }
  function renderProfile() {
    avatar = j.profile.avatar;
    color = j.profile.color;
    $("profile-title").textContent = t("profile");
    $("name-label").textContent = t("name");
    $("profile-name").value = j.profile.name;
    $("avatar-label").textContent = t("avatar");
    $("profile-save").textContent = t("save");
    $("profile-stats").innerHTML =
      `<div class="history-stats">${stats()}</div>${extendedStats()}<div class="profile-xp"><strong>${j.xp} XP</strong><span>${t("level")} ${1 + Math.floor(j.xp / 250)}</span></div>`;
    renderAvatars();
  }
  function renderAvatars() {
    $("profile-preview").innerHTML = JourneyArt.avatar(avatar, color);
    $("avatar-options").innerHTML = Array.from(
      { length: 8 },
      (_, i) =>
        `<button type="button" data-avatar="${i}" aria-label="${t("avatar")} ${i + 1}" aria-pressed="${i === avatar}">${JourneyArt.avatar(i, color)}</button>`,
    ).join("");
    $("avatar-colors").innerHTML = [
      "#cc7855",
      "#639e81",
      "#6e8fa9",
      "#b9a064",
      "#976667",
      "#647267",
    ]
      .map(
        (c, i) =>
          `<button type="button" data-avatar-color="${i}" aria-label="${i + 1}" aria-pressed="${color === i}" style="background:${c}"></button>`,
      )
      .join("");
    $("avatar-options")
      .querySelectorAll("button")
      .forEach(
        (el) =>
          (el.onclick = () => {
            avatar = Number(el.dataset.avatar);
            renderAvatars();
          }),
      );
    $("avatar-colors")
      .querySelectorAll("button")
      .forEach(
        (el) =>
          (el.onclick = () => {
            color = Number(el.dataset.avatarColor);
            renderAvatars();
          }),
      );
  }
  function renderAppearance() {
    $("appearance-title").textContent = t("appearance");
    $("board-theme-title").textContent = t("boardTheme");
    $("scene-title").textContent = t("background");
    $("board-themes").innerHTML = ["forest", "sand", "ocean", "ember", "stone"]
      .map(
        (key, i) =>
          `<button data-board-theme="${key}" aria-pressed="${j.board === key}"><div class="theme-board" style="--a:${["#e4ddc5", "#edd3a3", "#d5e5e3", "#f1c1a4", "#e0ded5"][i]};--b:${["#618374", "#ae8354", "#547e91", "#a9634a", "#727b78"][i]}">${ChessArt.piece("N")}</div><strong>${t(key)}</strong></button>`,
      )
      .join("");
    $("scene-options").innerHTML = ["plain", "mountains", "arches", "stars"]
      .map(
        (key, i) =>
          `<button data-background="${key}" aria-pressed="${j.background === key}"><div class="scene-preview scene-${key}"></div><strong>${t(key)}</strong></button>`,
      )
      .join("");
    $("board-themes")
      .querySelectorAll("button")
      .forEach(
        (el) =>
          (el.onclick = () => {
            j.board = el.dataset.boardTheme;
            ChessStore.save();
            renderAppearance();
            ChessProgress.applyTheme();
          }),
      );
    $("scene-options")
      .querySelectorAll("button")
      .forEach(
        (el) =>
          (el.onclick = () => {
            j.background = el.dataset.background;
            ChessStore.save();
            renderAppearance();
            ChessProgress.applyTheme();
          }),
      );
  }
  function extendedStats() {
    const total = j.totals.won + j.totals.lost + j.totals.drawn;
    return `<div class="bot-stats"><h3>${t("botStats")}</h3><div>${[
      [j.totals.won, "victories"],
      [j.totals.lost, "losses"],
      [j.totals.drawn, "draws"],
      [(total ? Math.round((j.totals.won / total) * 100) : 0) + "%", "winRate"],
    ]
      .map(
        ([n, key]) =>
          `<span><strong>${n}</strong><small>${t(key)}</small></span>`,
      )
      .join("")}</div></div>`;
  }
  function renderHistory() {
    $("history-title").textContent = t("history");
    $("history-stats").innerHTML = stats() + extendedStats();
    $("match-history").innerHTML = j.matches.length
      ? j.matches
          .map(
            (m, i) =>
              `<button class="match-row" data-match="${i}"><span class="match-outcome">${m.result.winner ? (m.mode === "solo" && m.result.winner !== m.human ? "0" : "1") : "½"}</span><span><strong>${m.mode === "solo" ? actions.opponentName(m.level) : t("local")}</strong><small>${new Intl.DateTimeFormat(document.documentElement.lang, { dateStyle: "medium" }).format(new Date(m.endedAt || Date.now()))} · ${m.minutes || "∞"} ${t("minutes")}</small></span><span>${Math.ceil(m.log.length / 2)} ${t("moves")}</span>${ChessArt.icon("next")}</button>`,
          )
          .join("")
      : `<p class="empty-history">${t("emptyHistory")}</p>`;
    $("match-history")
      .querySelectorAll("button")
      .forEach(
        (el) =>
          (el.onclick = () => startReplay(j.matches[Number(el.dataset.match)])),
      );
  }
  function startReplay(record) {
    replay = record;
    let state = Chess.parse();
    positions = [state];
    moveNames = [];
    for (const code of record.log) {
      const m = Chess.legal(state).find((m) => Chess.uci(m) === code);
      moveNames.push(Chess.notation(state, m));
      state = Chess.apply(state, m);
      positions.push(state);
    }
    cursor = positions.length - 1;
    open("replay-screen");
  }
  function renderReplay() {
    if (!replay) return;
    $("replay-title").textContent = t("replay");
    $("replay-back").innerHTML =
      ChessArt.icon("back") + "<span>" + t("back") + "</span>";
    $("replay-players").textContent =
      replay.mode === "solo" ? actions.opponentName(replay.level) : t("local");
    $("replay-position").textContent = cursor + " / " + (positions.length - 1);
    replayBoard.render(positions[cursor], {
      lang: document.documentElement.lang,
    });
    $("replay-list").innerHTML = moveNames
      .map(
        (n, i) =>
          `<button class="replay-move ${cursor === i + 1 ? "active" : ""}" data-ply="${i + 1}">${Math.floor(i / 2) + 1}${i % 2 ? "…" : "."} ${n}</button>`,
      )
      .join("");
    $("replay-list")
      .querySelectorAll("button")
      .forEach(
        (el) =>
          (el.onclick = () => {
            cursor = Number(el.dataset.ply);
            renderReplay();
          }),
      );
    for (const [key, label] of [
      ["first", "first"],
      ["prev", "previous"],
      ["next", "following"],
      ["last", "last"],
    ]) {
      $("replay-" + key).setAttribute("aria-label", t(label));
      $("replay-" + key).disabled =
        key === "first" || key === "prev"
          ? cursor === 0
          : cursor === positions.length - 1;
    }
  }
  $("replay-first").onclick = () => {
    cursor = 0;
    renderReplay();
  };
  $("replay-prev").onclick = () => {
    cursor--;
    renderReplay();
  };
  $("replay-next").onclick = () => {
    cursor++;
    renderReplay();
  };
  $("replay-last").onclick = () => {
    cursor = positions.length - 1;
    renderReplay();
  };
  $("replay-back").onclick = () => open("history-screen");
  $("profile-form").onsubmit = (e) => {
    e.preventDefault();
    j.profile = {
      name: $("profile-name").value.trim().slice(0, 24),
      avatar,
      color,
    };
    ChessStore.save();
    open("home");
  };
  $("profile-open").onclick = () => open("profile-screen");
  $("history-open").onclick = () => open("history-screen");
  $("appearance-open").onclick = () => open("appearance-screen");
  $("puzzles-open").onclick = () => open("puzzle-map");
  $("daily-open").onclick = () => actions.puzzle(ChessProgress.dailyId(), true);
  $("streak-open").onclick = () => {
    const week = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - 6 + i);
      const done = j.activity.includes(ChessProgress.day(d));
      return `<div class="${done ? "done" : ""}"><span>${new Intl.DateTimeFormat(document.documentElement.lang, { weekday: "narrow" }).format(d)}</span><strong>${done ? "✓" : d.getDate()}</strong></div>`;
    }).join("");
    modalShow(
      `<h2>${ChessProgress.streak()} ${t("days")}</h2><div class="streak-week">${week}</div><p>${t("streakHelp")}</p><button id="streak-close" class="primary">${t("close")}</button>`,
    );
    $("streak-close").onclick = () => modal.close();
  };
  $("hub-play").onclick = () => {
    modalShow(
      `<div class="section-heading"><button id="mode-close" class="back">${ChessArt.icon("back")}<span>${t("back")}</span></button><h2>${t("chooseMode")}</h2></div><div class="play-mode-grid">${["solo", "local", "academy", "puzzles"].map((key, i) => `<button data-mode="${key}">${ChessArt.piece(["N", "P", "B", "Q"][i])}<strong>${t(key)}</strong></button>`).join("")}</div>`,
    );
    $("mode-close").onclick = () => modal.close();
    modal.querySelectorAll("[data-mode]").forEach(
      (el) =>
        (el.onclick = () => {
          modal.close();
          const mode = el.dataset.mode;
          if (mode === "puzzles") open("puzzle-map");
          else if (mode === "academy") open("school");
          else actions.setup(mode);
        }),
    );
  };
  $("quick-play").onclick = actions.quick;
  for (const [id, direction] of [
    ["carousel-prev", -1],
    ["carousel-next", 1],
  ])
    $(id).onclick = () =>
      $("mode-carousel").scrollBy({
        left:
          direction * (document.documentElement.dir === "rtl" ? -1 : 1) * 270,
        behavior: matchMedia("(prefers-reduced-motion: reduce)").matches
          ? "instant"
          : "smooth",
      });
  return { render, renderHome, renderSchool, open, profileName };
}

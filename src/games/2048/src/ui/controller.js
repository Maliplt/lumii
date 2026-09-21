"use strict";
(() => {
  const $ = (id) => document.getElementById(id),
    E = Game2048;
  const { LANGUAGES, TEXT } = Text2048;
  const data = Store2048.data;
  let board = [],
    score = 0,
    moves = 0,
    streak = 0,
    won = false,
    state = "menu",
    busy = false,
    queued = null,
    dialogKind = null;
  let tutorial = false,
    lesson = 0;
  let elapsedMs = 0, timerStarted = null, tutorialReturn = "menu";
  const dialogHistory = [];
  function elapsed() {
    return elapsedMs + (timerStarted === null ? 0 : performance.now() - timerStarted);
  }
  function paintTime() {
    const seconds = Math.floor(elapsed() / 1000);
    const parts = [Math.floor(seconds / 60) % 60, seconds % 60];
    if (seconds >= 3600) parts.unshift(Math.floor(seconds / 3600));
    $("time").textContent = parts.map((n) => String(n).padStart(2, "0")).join(":");
  }
  function syncTimer() {
    elapsedMs = elapsed();
    timerStarted = state === "playing" && !tutorial && !dialogKind && !document.hidden
      ? performance.now() : null;
    paintTime();
  }
  const LESSONS = [
    {
      direction: "left",
      board: [2, 2, 0, 0, ...Array(12).fill(0)],
      key: "lesson1",
    },
    {
      direction: "down",
      board: [4, 0, 0, 0, 4, 0, 0, 0, ...Array(8).fill(0)],
      key: "lesson2",
    },
    {
      direction: "right",
      board: [8, 8, 16, 0, ...Array(12).fill(0)],
      key: "lesson3",
    },
  ];
  function updateTutorial() {
    const current = LESSONS[Math.min(lesson, LESSONS.length - 1)];
    $("lesson-label").textContent = `${Math.min(lesson + 1, 3)} / 3`;
    $("lesson-text").textContent = tr(current.key);
    $("tutorial-guide").dataset.direction = current.direction;
    $("tutorial-guide").hidden = false;
  }
  function loadLesson() {
    board = LESSONS[lesson].board.slice();
    updateTutorial();
    paint();
    hud();
  }
  function startTutorial() {
    tutorialReturn = state;
    if (state === "playing" && !tutorial) persist();
    tutorial = true;
    lesson = 0;
    score = 0;
    moves = 0;
    streak = 0;
    won = false;
    queued = null;
    $("game").classList.add("learning");
    loadLesson();
    show("playing");
  }
  const languagePicker = createLanguagePicker((language) => {
    data.language = language;
    save();
    labels();
  });
  const tr = (k) => TEXT[k]?.[LANGUAGES.indexOf(data.language)] ?? k;
  const number = (n) => n.toLocaleString(data.language);
  const reduced = () => matchMedia("(prefers-reduced-motion: reduce)").matches;
  function save() {
    Store2048.save();
  }
  function persist() {
    if (tutorial) return;
    data.session = { board: board.slice(), score, moves, won, elapsedMs: elapsed() };
    save();
  }
  const audio = createAudio2048(data);
  const sound = (kind, level) => audio.play(kind, level);
  function labels() {
    document.documentElement.dataset.theme = data.theme;
    $("theme").innerHTML =
      data.theme === "dark"
        ? '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l2 2m10 10 2 2M5 19l2-2M17 7l2-2"/></svg>'
        : '<svg viewBox="0 0 24 24"><path d="M20 15a8 8 0 0 1-11-11 8 8 0 1 0 11 11Z"/></svg>';
    $("theme").setAttribute(
      "aria-label",
      tr(data.theme === "dark" ? "light" : "dark"),
    );
    document.querySelector('meta[name="theme-color"]').content =
      data.theme === "dark" ? "#141516" : "#f4f6f9";
    if (tutorial) updateTutorial();
    document.documentElement.lang = data.language;
    document.documentElement.dir = data.language === "ar" ? "rtl" : "ltr";
    languagePicker.update(data.language);
    document
      .querySelectorAll("[data-t]")
      .forEach((el) => (el.textContent = tr(el.dataset.t)));
    $("play").querySelector("span").textContent = tr(
      data.session ? "continue" : "play",
    );
    $("sound").classList.toggle("muted", data.muted);
    $("sound").setAttribute(
      "aria-label",
      tr(data.muted ? "soundOff" : "soundOn"),
    );
    $("help").setAttribute("aria-label", tr("how"));
    $("close").setAttribute("aria-label", tr("close"));
    $("home-button").setAttribute(
      "aria-label",
      tr(state === "playing" ? "pause" : "menu"),
    );
    $("pause").setAttribute("aria-label", tr("pause"));
    document
      .querySelectorAll("[data-dir]")
      .forEach((b) => b.setAttribute("aria-label", tr(b.dataset.dir)));
    $("menu-best").textContent = number(data.best);
    hud();
    if (dialogKind) renderDialog();
  }
  let scoreFrame = 0;
  function hud() {
    cancelAnimationFrame(scoreFrame);
    $("score").textContent = number(score);
    $("best").textContent = number(data.best);
    const largest = Math.max(0, ...board);
    $("target-fill").style.width = `${Math.min(100, largest ? Math.log2(largest) / 11 * 100 : 0)}%`;
    $("target-fill").parentElement.setAttribute("aria-valuenow", Math.min(2048, largest));
    $("combo").textContent =
      streak >= 2 ? `${number(streak)} ${tr("series")}` : "";
    $("board").classList.toggle("on-streak", streak >= 3);
  }

  const settings = document.querySelector(".settings");
  const header = document.querySelector("header");
  function syncControls() {
    const inPause = dialogKind === "pause";
    $("home-button").setAttribute(
      "aria-label",
      tr(state === "playing" ? "pause" : "menu"),
    );
    $("pause").hidden = state !== "playing";
    settings.hidden = state === "playing" && !inPause;
    if (inPause) $("dialog").insertBefore(settings, $("dialog-actions"));
    else header.insertBefore(settings, $("pause"));
    const panel = $("language-panel");
    const host = inPause ? $("dialog") : document.body;
    if (panel.parentElement !== host) {
      panel.hidden = true;
      $("language").setAttribute("aria-expanded", "false");
      host.append(panel);
    }
  }
  function leaveGame() {
    if (state === "playing") persist();
    closeDialog();
    tutorial = false;
    $("tutorial-guide").hidden = true;
    show("menu");
  }
  function show(next) {
    state = next;
    syncTimer();
    $("tutorial-back").hidden = !tutorial || next !== "playing";
    syncControls();
    $("menu").hidden = next !== "menu";
    $("game").hidden = next !== "playing";
    if (next === "menu") labels();
    else $("board").focus({ preventScroll: true });
  }
  function paint(spawn = -1, merges = []) {
    const fragment = document.createDocumentFragment();
    board.forEach((value, i) => {
      if (!value) return;
      const tile = document.createElement("div");
      tile.className =
        "tile" +
        (value >= 1024 ? " high" : "") +
        (i === spawn ? " spawn" : "") +
        (merges.includes(i) ? " merge" : "");
      tile.dataset.index = i;
      tile.dataset.value = value;
      tile.dataset.digits = String(value).length;
      tile.style.setProperty("--x", i % 4);
      tile.style.setProperty("--y", Math.floor(i / 4));
      tile.textContent = String(value);
      fragment.append(tile);
    });
    $("tiles").replaceChildren(fragment);
    $("board").setAttribute(
      "aria-label",
      board.map((v) => v || "·").join(", "),
    );
  }
  function start(fresh = false) {
    timerStarted = null;
    elapsedMs = fresh ? 0 : data.session?.elapsedMs || 0;
    tutorial = false;
    $("tutorial-guide").hidden = true;
    $("game").classList.remove("learning");
    if (fresh || !data.session) {
      board = Array(16).fill(0);
      E.spawn(board);
      E.spawn(board);
      score = 0;
      moves = 0;
      won = false;
    } else
      ({ board, score, moves, won } = {
        ...data.session,
        board: data.session.board.slice(),
      });
    streak = 0;
    queued = null;
    paint();
    hud();
    persist();
    show("playing");
    if (E.over(board)) openDialog("over");
  }
  function particles(indices, large = false) {
    if (reduced()) return;
    const width = $("board").clientWidth,
      gap = parseFloat(
        getComputedStyle(document.documentElement).getPropertyValue("--gap"),
      ),
      pitch = (width - gap) / 4;
    for (const index of indices) {
      const x = gap + (index % 4) * pitch + (pitch - gap) / 2,
        y = gap + Math.floor(index / 4) * pitch + (pitch - gap) / 2;
      for (let j = 0; j < (large ? 28 : Math.min(14, 5 + streak)); j++) {
        const el = document.createElement("i");
        el.className = "particle";
        el.style.left = x + "px";
        el.style.top = y + "px";
        el.style.background = (
          data.theme === "dark"
            ? ["#f5cf48", "#fff0b0", "#aa913c"]
            : ["#287ca8", "#83bfd8", "#c9e7f2"]
        )[j % 3];
        $("particles").append(el);
        const angle = Math.random() * Math.PI * 2,
          radius = large ? width * 0.5 : 35 + Math.min(streak, 6) * 7;
        el.animate(
          [
            { transform: "translate(0,0) scale(1)", opacity: 1 },
            {
              transform: `translate(${Math.cos(angle) * radius}px,${Math.sin(angle) * radius}px) rotate(160deg) scale(.3)`,
              opacity: 0,
            },
          ],
          { duration: large ? 1000 : 550, easing: "cubic-bezier(.15,.7,.4,1)" },
        ).finished.then(() => el.remove());
      }
    }
  }
  function gain(points) {
    const from = score - points,
      duration = reduced() ? 0 : 450;
    const scoreBox = $("score").parentElement;
    if (!reduced())
      scoreBox.animate(
        [
          { transform: "scale(1)" },
          { transform: `scale(${points >= 128 ? 1.08 : 1.04})`, offset: 0.35 },
          { transform: "scale(1)" },
        ],
        { duration: 380, easing: "ease-out" },
      );
    cancelAnimationFrame(scoreFrame);
    const started = performance.now();
    function count(now) {
      const progress = duration ? Math.min(1, (now - started) / duration) : 1;
      $("score").textContent = number(
        Math.round(from + points * (1 - (1 - progress) ** 3)),
      );
      if (progress < 1) scoreFrame = requestAnimationFrame(count);
    }
    scoreFrame = requestAnimationFrame(count);
    $("gain").textContent = "+" + number(points);
    $("gain")
      .getAnimations()
      .forEach((a) => a.cancel());
    $("gain").animate(
      [
        { opacity: 0, transform: "translateY(10px)" },
        { opacity: 1, offset: 0.2 },
        { opacity: 0, transform: "translateY(-25px)" },
      ],
      { duration: 800, fill: "forwards" },
    );
  }
  async function move(direction) {
    if (tutorial && lesson >= LESSONS.length) return;
    if (tutorial && !busy && direction !== LESSONS[lesson].direction) {
      $("tutorial-guide").animate([{ opacity: 0.4 }, { opacity: 1 }], {
        duration: 250,
      });
      return;
    }
    if (state !== "playing" || $("dialog").open) return;
    if (busy) {
      queued = direction;
      return;
    }
    const result = E.move(board, direction);
    if (!result.changed) return;
    busy = true;
    result.motions.forEach(({ from, to }) => {
      const el = $("tiles").querySelector(`[data-index="${from}"]`);
      el.style.setProperty("--x", to % 4);
      el.style.setProperty("--y", Math.floor(to / 4));
    });
    if (!reduced()) await new Promise((resolve) => setTimeout(resolve, 185));
    board = result.board;
    score += result.score;
    moves++;
    streak = result.score ? streak + 1 : 0;
    if (!tutorial) data.best = Math.max(data.best, score);
    const spawned = tutorial ? -1 : E.spawn(board);
    paint(spawned, result.merges);
    hud();
    if (result.score) {
      if (!reduced()) $("board").animate(
        [{ outlineColor: "transparent" }, { outlineColor: "var(--accent)", offset: 0.2 }, { outlineColor: "transparent" }],
        { duration: 500 },
      );
      if (!reduced())
        result.merges
          .filter((i) => board[i] >= 128)
          .forEach((i) => {
            const tile = $("tiles").querySelector(`[data-index="${i}"]`);
            tile.animate(
              [{ scale: 1 }, { scale: 1.17, offset: 0.4 }, { scale: 1 }],
              { duration: 450, easing: "ease-out" },
            );
          });
      gain(result.score);
      particles(result.merges);
      sound("merge", streak);
    } else sound("tap");
    persist();
    if (tutorial) {
      busy = true;
      particles(result.merges, true);
      await new Promise((resolve) =>
        setTimeout(resolve, reduced() ? 120 : 700),
      );
      lesson++;
      if (lesson === LESSONS.length) {
        data.learned = true;
        save();
        openDialog("learned");
      } else loadLesson();
      queued = null;
      busy = false;
      return;
    }
    const victory = !won && board.some((v) => v >= 2048);
    if (victory) {
      won = true;
      persist();
      particles(result.merges, true);
      sound("win");
      queued = null;
      if (!reduced()) await new Promise((resolve) => setTimeout(resolve, 900));
      openDialog("win");
    } else if (E.over(board)) {
      queued = null;
      sound("over");
      if (!reduced()) await new Promise((resolve) => setTimeout(resolve, 400));
      openDialog("over");
    }
    busy = false;
    const next = queued;
    queued = null;
    if (next) move(next);
  }
  function openDialog(kind) {
    if (dialogKind && dialogKind !== kind) dialogHistory.push(dialogKind);
    dialogKind = kind;
    syncTimer();
    if (state === "playing") persist();
    queued = null;
    renderDialog();
    if (!$("dialog").open) $("dialog").showModal();
  }
  function closeDialog() {
    dialogHistory.length = 0;
    dialogKind = null;
    syncTimer();
    $("dialog").close();
    syncControls();
    if (state === "playing") $("board").focus({ preventScroll: true });
  }
  function action(key, callback, primary = false) {
    const button = document.createElement("button");
    button.className = primary ? "primary" : "text-button";
    button.textContent = tr(key);
    button.onclick = () => {
      sound("tap");
      callback();
    };
    $("dialog-actions").append(button);
  }
  function renderDialog() {
    const kind = dialogKind;
    $("dialog").dataset.kind = kind;
    syncControls();
    $("dialog-actions").replaceChildren();
    if (kind === "pause") {
      $("dialog-content").innerHTML = "<h2>" + tr("paused") + "</h2>";
      action("continue", closeDialog, true);
      action("restart", () => openDialog("restart"));
      action("menu", leaveGame);
    } else if (kind === "learned") {
      $("dialog-content").innerHTML =
        `<div class="result-number">✓</div><h2>${tr("ready")}</h2><p>${tr("intro")}</p>`;
      action(
        "play",
        () => {
          closeDialog();
          start();
        },
        true,
      );
    } else if (kind === "help") {
      $("dialog-content").innerHTML =
        `<h2>${tr("how")}</h2><div class="example"><b>2</b>+<b>2</b>→<b>4</b></div><p>${tr("rules")}</p><p>${tr("seriesRule")}</p>`;
      action(
        "tutorial",
        () => {
          closeDialog();
          startTutorial();
        },
        true,
      );
      action("back", dismissDialog);
    } else if (kind === "restart") {
      $("dialog-content").innerHTML =
        `<h2>${tr("restartTitle")}</h2><p>${tr("restartBody")}</p>`;
      action(
        "restart",
        () => {
          closeDialog();
          start(true);
        },
        true,
      );
      action("back", dismissDialog);
    } else {
      $("dialog-content").innerHTML =
        `<div class="result-number">${kind === "win" ? "2048" : number(score)}</div><h2>${tr(kind)}</h2><p>${kind === "win" ? tr("winBody") : tr("best") + " · " + number(data.best)}</p>`;
      if (kind === "win")
        action(
          "continue",
          () => {
            closeDialog();
            if (E.over(board)) openDialog("over");
          },
          true,
        );
      action(
        "restart",
        () => {
          closeDialog();
          start(true);
        },
        kind === "over",
      );
      action("menu", () => {
        closeDialog();
        show("menu");
      });
    }
    $("announcement").textContent = tr(
      kind === "help" ? "how" : kind === "restart" ? "restartTitle" : kind,
    );
  }
  $("play").onclick = () => {
    sound("tap");
    if (!data.learned && !data.session) startTutorial();
    else start();
  };
  $("pause").onclick = () => {
    if (!busy) {
      persist();
      openDialog("pause");
    }
  };
  $("home-button").onclick = () => {
    if (state === "playing") $("pause").click();
    else show("menu");
  };
  $("new-game").onclick = () => {
    if (data.session) openDialog("restart");
    else start(true);
  };
  $("help").onclick = $("menu-help").onclick = () => {
    if (!busy) openDialog("help");
  };
  function dismissDialog() {
    if (dialogHistory.length) {
      dialogKind = dialogHistory.pop();
      renderDialog();
      return;
    }
    const finishedLesson = dialogKind === "learned";
    closeDialog();
    if (finishedLesson) start();
  }
  $("close").onclick = dismissDialog;
  $("tutorial-back").onclick = () => {
    if (busy) return;
    closeDialog();
    if (tutorialReturn === "playing" && data.session) {
      start();
      openDialog("pause");
    } else {
      tutorial = false;
      $("game").classList.remove("learning");
      $("tutorial-guide").hidden = true;
      show("menu");
      openDialog("help");
    }
  };
  $("dialog").addEventListener("cancel", (event) => {
    event.preventDefault();
    dismissDialog();
  });
  $("theme").onclick = () => {
    data.theme = data.theme === "dark" ? "light" : "dark";
    save();
    labels();
  };
  $("sound").onclick = () => {
    data.muted = !data.muted;
    if (data.muted) audio.mute();
    else sound("tap");
    save();
    labels();
  };
  const keys = {
    ArrowLeft: "left",
    ArrowRight: "right",
    ArrowUp: "up",
    ArrowDown: "down",
    a: "left",
    d: "right",
    w: "up",
    s: "down",
  };
  document.addEventListener("keydown", (event) => {
    if (event.target.closest("select") || $("dialog").open) return;
    if (event.key === "Escape" && state === "playing") {
      event.preventDefault();
      $("pause").click();
      return;
    }
    if (keys[event.key] && state === "playing") {
      event.preventDefault();
      move(keys[event.key]);
    }
  });
  document
    .querySelectorAll("[data-dir]")
    .forEach((b) => (b.onclick = () => move(b.dataset.dir)));
  let pointer = null;
  $("board").addEventListener("pointerdown", (event) => {
    if (pointer || event.button > 0 || busy || $("dialog").open) return;
    event.preventDefault();
    pointer = { id: event.pointerId, x: event.clientX, y: event.clientY };
    $("board").setPointerCapture(event.pointerId);
  });
  $("board").addEventListener("pointerup", (event) => {
    if (!pointer || pointer.id !== event.pointerId) return;
    const dx = event.clientX - pointer.x,
      dy = event.clientY - pointer.y;
    pointer = null;
    if (Math.max(Math.abs(dx), Math.abs(dy)) < 18) return;
    move(
      Math.abs(dx) > Math.abs(dy)
        ? dx > 0
          ? "right"
          : "left"
        : dy > 0
          ? "down"
          : "up",
    );
  });
  for (const type of ["pointercancel", "lostpointercapture"])
    $("board").addEventListener(type, () => (pointer = null));
  window.addEventListener("pagehide", () => {
    if (state === "playing" && board.length) persist();
  });
  document.addEventListener("visibilitychange", () => {
    syncTimer();
    if (state === "playing") persist();
  });
  setInterval(paintTime, 250);
  $("board").querySelector(".slots").innerHTML = "<i></i>".repeat(16);
  syncControls();
  labels();
})();

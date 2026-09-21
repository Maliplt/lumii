"use strict";
(() => {
  const $ = (id) => document.getElementById(id),
    store = SudokuStore,
    data = store.data,
    screens = SudokuScreens,
    t = (...a) => SudokuText.t(...a),
    icon = SudokuIcons,
    main = $("main"),
    dialog = $("dialog");
  let screen = "home",
    session = null,
    boardView = null,
    pencil = false,
    chapter = 0,
    pendingStart = null,
    pendingHint = null,
    hintStage = 0,
    dialogKind = "",
    settingsFromPause = false,
    lastTick = performance.now(),
    toastTimer,
    generationId = 0,
    completionTimer,
    transitioning = false,
    longPressTimer,
    suppressNumberClick = false;
  SudokuFeedback.install(() => data);
  function toast(message) {
    clearTimeout(toastTimer);
    $("toast").textContent = message;
    $("toast").classList.add("show");
    toastTimer = setTimeout(() => $("toast").classList.remove("show"), 2200);
  }
  function applyAppearance() {
    SudokuText.set(data.language);
    document.documentElement.dataset.theme = data.theme;
    document.querySelector('meta[name="theme-color"]').content =
      data.theme === "dark" ? "#000000" : "#fff1da";
    $("settings").innerHTML = icon("settings");
    $("settings").setAttribute("aria-label", t("settings"));
  }
  function persist() {
    if (screen === "game" && session && !session.completed)
      data.session = session;
    if (!store.save()) toast(t("saveError"));
  }
  function closeDialog() {
    if (dialog.open) dialog.close();
    dialogKind = "";
    lastTick = performance.now();
  }
  function modal(content, kind = "generic") {
    dialogKind = kind;
    $("dialog-content").innerHTML = content;
    if (!dialog.open) dialog.showModal();
  }
  function heading(title) {
    return (
      '<div class="dialog-head"><h2 id="dialog-title">' +
      title +
      "</h2>" +
      screens.button("close", t("close"), "close", "icon-button") +
      "</div>"
    );
  }
  function show(name) {
    if (screen === "game") persist();
    if (screen === "loading") {
      generationId++;
      SudokuPuzzles.cancel();
    }
    clearTimeout(completionTimer);
    closeDialog();
    screen = name;
    $("settings").hidden = false;
    session = null;
    boardView = null;
    pendingHint = null;
    main.innerHTML =
      name === "home"
        ? screens.home()
        : name === "setup"
          ? screens.setup()
          : name === "learn-screen"
            ? screens.learn()
            : name === "journey"
              ? screens.journey(chapter)
              : screens.stats();
    main.querySelector("h1")?.setAttribute("tabindex", "-1");
    if (name === "journey") bindChapters();
  }
  function chapterControls() {
    const controls = main.querySelector(".chapter-controls");
    if (!controls) return;
    const previous = controls.firstElementChild;
    const next = controls.lastElementChild;
    previous.dataset.value = chapter - 1;
    previous.disabled = chapter === 0;
    next.dataset.value = chapter + 1;
    next.disabled = chapter === 4;
    controls
      .querySelectorAll(".chapter-dots button")
      .forEach((button, index) => {
        button.setAttribute(
          "aria-current",
          index === chapter ? "page" : "false",
        );
      });
  }
  function goChapter(index, smooth = true) {
    chapter = Math.max(0, Math.min(4, Number(index) || 0));
    const page = main.querySelector(`.chapter-page[data-page="${chapter}"]`);
    page?.scrollIntoView({
      block: "nearest",
      inline: "start",
      behavior:
        smooth && !matchMedia("(prefers-reduced-motion: reduce)").matches
          ? "smooth"
          : "instant",
    });
    chapterControls();
  }
  function bindChapters() {
    const deck = main.querySelector(".chapter-deck");
    let drag = null,
      suppressClick = false,
      frame = 0;
    const nearest = () => {
      const center = deck.getBoundingClientRect().left + deck.clientWidth / 2;
      return [...deck.children].reduce(
        (best, page, index) => {
          const rect = page.getBoundingClientRect();
          const distance = Math.abs(rect.left + rect.width / 2 - center);
          return distance < best.distance ? { index, distance } : best;
        },
        { index: chapter, distance: Infinity },
      ).index;
    };
    requestAnimationFrame(() => goChapter(chapter, false));
    deck.addEventListener("scroll", () => {
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        chapter = nearest();
        chapterControls();
      });
    });
    deck.addEventListener("pointerdown", (event) => {
      if (event.pointerType !== "mouse" || event.button !== 0) return;
      suppressClick = false;
      drag = { x: event.clientX, scroll: deck.scrollLeft, moved: false };
    });
    deck.addEventListener("pointermove", (event) => {
      if (!drag) return;
      const delta = event.clientX - drag.x;
      if (!drag.moved && Math.abs(delta) < 6) return;
      drag.moved = true;
      deck.setPointerCapture(event.pointerId);
      deck.classList.add("dragging");
      deck.scrollLeft = drag.scroll - delta;
      event.preventDefault();
    });
    const release = () => {
      if (!drag) return;
      suppressClick = drag.moved;
      drag = null;
      deck.classList.remove("dragging");
      if (suppressClick) goChapter(nearest());
    };
    deck.addEventListener("pointerup", release);
    deck.addEventListener("pointercancel", release);
    deck.addEventListener("pointerleave", () => {
      if (drag && !drag.moved) drag = null;
    });
    deck.addEventListener(
      "click",
      (event) => {
        if (!suppressClick) return;
        event.preventDefault();
        event.stopPropagation();
        suppressClick = false;
      },
      true,
    );
    deck.addEventListener("keydown", (event) => {
      if (!["ArrowLeft", "ArrowRight"].includes(event.key)) return;
      event.preventDefault();
      const direction = document.documentElement.dir === "rtl" ? -1 : 1;
      goChapter(
        chapter + (event.key === "ArrowRight" ? direction : -direction),
      );
    });
  }
  function enterGame(s) {
    clearTimeout(completionTimer);
    closeDialog();
    screen = "game";
    $("settings").hidden = true;
    session = s;
    SudokuSession.ensure(session);
    session.inputMode = "cell";
    pencil = false;
    pendingHint = null;
    hintStage = 0;
    transitioning = false;
    main.innerHTML = screens.game(s, !!s.practiceTechnique);
    boardView = createSudokuBoard($("board"), {
      onSelect: selectCell,
      onDrag: dragCell,
    });
    bindLongPress();
    lastTick = performance.now();
    render();
    persist();
    if (s.practiceTechnique && s.lessonHint && !s.history.length) hint();
  }
  function selectCell(i) {
    if (!session || transitioning) return;
    if (
      session.inputMode === "digit" &&
      session.selectedDigit &&
      !session.givens[i]
    ) {
      session.selected = i;
      session.selectedCells = [i];
      inputValue(session.selectedDigit, pencil, i);
      return;
    }
    session.selected = i;
    session.selectedCells = [i];
    render();
  }
  function dragCell(i) {
    if (!session || session.inputMode !== "cell") return;
    session.selected = i;
    if (!session.selectedCells.includes(i)) session.selectedCells.push(i);
    render();
  }
  function render(focus = false) {
    if (!boardView || !session) return;
    boardView.render(session, data, hintStage ? pendingHint : null, focus);
    $("mistakes").textContent = session.mistakes;
    for (let n = 1; n <= 9; n++) {
      const left = Math.max(0, 9 - session.board.filter((v) => v === n).length),
        button = $("remaining-" + n)?.parentElement;
      if (!button) continue;
      $("remaining-" + n).textContent = "";
      button.classList.toggle("exhausted", left === 0);
      button.classList.toggle(
        "selected-number",
        session.inputMode === "digit" && session.selectedDigit === n,
      );
    }
    const note = main.querySelector('[data-action="notes"]'),
      undo = main.querySelector('[data-action="undo"]'),
      redo = main.querySelector('[data-action="redo"]');
    if (note) {
      note.classList.toggle("active", pencil);
      note.setAttribute("aria-pressed", String(pencil));
    }
    if (undo) undo.disabled = !session.history.length;
    if (redo) redo.disabled = !session.future.length;
    main
      .querySelector(".mode-cell")
      ?.classList.toggle("active", session.inputMode === "cell");
    main
      .querySelector(".mode-digit")
      ?.classList.toggle("active", session.inputMode === "digit");
  }
  function bindLongPress() {
    for (const button of main.querySelectorAll('[data-action="number"]')) {
      button.addEventListener("pointerdown", () => {
        clearTimeout(longPressTimer);
        longPressTimer = setTimeout(() => {
          suppressNumberClick = true;
          button.classList.add("long-press");
          inputValue(Number(button.dataset.value), true);
          setTimeout(() => button.classList.remove("long-press"), 250);
        }, 420);
      });
      for (const ev of ["pointerup", "pointercancel", "pointerleave"])
        button.addEventListener(ev, () => clearTimeout(longPressTimer));
    }
  }
  function options(mode, difficulty = 1, level = null, date = store.dateKey()) {
    const random = crypto.getRandomValues(new Uint32Array(1))[0];
    return {
      mode,
      difficulty,
      level,
      date,
      id:
        mode === "daily"
          ? "daily-v2-" + date + "-" + difficulty
          : mode === "journey"
            ? "journey-v2-" + level
            : mode === "custom"
              ? "custom-" + Date.now()
              : "classic-" + Date.now() + "-" + random,
    };
  }
  function requestStart(opts, puzzle = null) {
    if (
      data.session &&
      !data.session.completed &&
      data.session.id !== opts.id
    ) {
      pendingStart = { opts, puzzle };
      modal(
        heading(t("replace")) +
          '<p class="dialog-copy">' +
          t("replaceText") +
          '</p><div class="dialog-actions">' +
          screens.button("confirm-new", t("play"), "play", "button primary") +
          screens.button("close", t("cancel")) +
          "</div>",
        "replace",
      );
    } else if (data.session?.id === opts.id) enterGame(data.session);
    else start(opts, puzzle);
  }
  async function start(opts, puzzle = null) {
    closeDialog();
    screen = "loading";
    const ticket = ++generationId;
    main.innerHTML =
      '<section class="screen busy"><div class="busy-grid" aria-hidden="true">' +
      Array.from({ length: 9 }, (_, i) => '<i style="--i:' + i + '"></i>').join(
        "",
      ) +
      "</div><h2>" +
      t("generating") +
      "</h2></section>";
    try {
      puzzle ||= await SudokuPuzzles.generate(opts.id, opts.difficulty);
      if (ticket !== generationId) return;
      const s = SudokuSession.create(puzzle, opts);
      s.inputMode = data.inputMode;
      enterGame(s);
    } catch (error) {
      if (ticket !== generationId || error.message === "cancelled") return;
      show("setup");
      toast(t("error"));
    }
  }
  function completedUnits() {
    return SudokuEngine.units.filter((unit) =>
      unit.every((i) => session.board[i] === session.solution[i]),
    );
  }
  function inputValue(
    value,
    temporaryPencil = false,
    index = session?.selected,
  ) {
    if (
      screen !== "game" ||
      dialog.open ||
      !session ||
      session.completed ||
      transitioning
    )
      return;
    if (session.inputMode === "digit" && !temporaryPencil && value) {
      session.selectedDigit = value;
      render();
      if (session.givens[index]) return;
    }
    if (session.givens[index]) {
      toast(t("selectCell"));
      return;
    }
    if (session.practiceTechnique && pendingHint) {
      if (hintStage === 3) actions["lesson-answer"](value);
      return;
    }
    const writingNote = temporaryPencil || pencil,
      before = completedUnits(),
      change = SudokuSession.input(session, value, writingNote, index, false);
    if (!change) return;
    render();
    const event =
      change.type === "error" && data.check
        ? "digit:error"
        : change.type === "note"
          ? "note:changed"
          : "digit:placed";
    SudokuFeedback.emit(event);
    boardView.pulse(
      [change.index],
      change.type === "error" && data.check ? "shake" : "placed",
    );
    const newly = completedUnits().filter((unit) => !before.includes(unit));
    if (newly.length && !session.completed) {
      boardView.pulse([...new Set(newly.flat())], "unit");
      SudokuFeedback.emit("unit:completed");
      message(t("completedUnits"));
    }
    persist();
    if (session.completed) finish();
  }
  function message(text) {
    const el = $("game-message");
    if (!el) return;
    el.textContent = text;
    el.classList.add("show");
    setTimeout(() => el.classList.remove("show"), 1500);
  }
  function fallbackHint() {
    const old = SudokuEngine.hint(
      session.board,
      session.solution,
      session.selected,
    );
    return old
      ? {
          technique: old.type,
          difficulty: 9,
          focusCells: [old.index],
          supportCells: SudokuEngine.peers[old.index],
          placements: [{ cell: old.index, digit: old.value }],
          eliminations: [],
          units: [],
          fallback: true,
        }
      : null;
  }
  function hint() {
    if (!session || session.completed) return;
    pendingHint =
      (!session.history.length && session.lessonHint) ||
      SudokuTechniques.next(session.board) ||
      fallbackHint();
    if (!pendingHint) return;
    hintStage = 1;
    session.selected = pendingHint.focusCells[0];
    session.hintLevels.direction++;
    render();
    showHintPanel();
  }
  function hintText(h) {
    const name = t(h.technique);
    if (h.fallback) return t("noLogicalHint");
    if (h.placements?.length) {
      const p = h.placements[0];
      return (
        name +
        ": " +
        t("hintCell", { r: Math.floor(p.cell / 9) + 1, c: (p.cell % 9) + 1 }) +
        " → " +
        p.digit +
        "."
      );
    }
    const digits = [
      ...new Set((h.eliminations || []).map((e) => e.digit)),
    ].join(", ");
    return name + ": " + digits + " " + t("remaining") + ".";
  }
  function showHintPanel() {
    const panel =
      main.querySelector(".hint-panel") || document.createElement("section");
    const practice = Boolean(session.practiceTechnique);
    const target = pendingHint.placements[0] || pendingHint.eliminations[0];
    const explanation = t("explain-" + pendingHint.technique);
    const cell = target
      ? t("hintCell", {
          r: Math.floor(target.cell / 9) + 1,
          c: (target.cell % 9) + 1,
        })
      : "";
    let body = "",
      buttons = "";
    if (hintStage === 1) {
      body = `${t("observeCells")} ${cell}.`;
      buttons = screens.button(
        "hint-next",
        t("logicHint"),
        null,
        "button primary",
      );
    } else if (hintStage === 2) {
      body =
        (explanation.startsWith("explain-") ? "" : explanation + " ") +
        (practice ? "" : hintText(pendingHint));
      buttons = screens.button(
        practice ? "lesson-try" : "hint-apply",
        t(practice ? "tryIt" : "applyMove"),
        null,
        "button primary",
      );
    } else if (hintStage === 3) {
      body = `${cell} · ${t(pendingHint.placements.length ? "choosePlacement" : "chooseElimination")}`;
      const choices = [
        target.digit,
        (target.digit % 9) + 1,
        ((target.digit + 3) % 9) + 1,
      ].sort((a, b) => a - b);
      buttons = `<div class="lesson-answers">${choices.map((digit) => screens.button("lesson-answer", String(digit), null, "button", digit)).join("")}</div><p class="lesson-feedback" role="status"></p>`;
    } else {
      body = `${t("lessonCorrect")} ${hintText(pendingHint)}`;
      buttons = screens.button(
        "lesson-next",
        t("nextLesson"),
        null,
        "button primary",
      );
    }
    panel.className = "hint-panel";
    panel.setAttribute("aria-label", t(pendingHint.technique));
    panel.innerHTML = `<div class="hint-panel-head"><span><small>${practice ? `${t("learn")} · ${Math.min(hintStage, 3)} / 3` : t("hint")}</small><b>${t(pendingHint.technique)}</b></span><button data-action="hint-close" aria-label="${t("close")}">${icon("close")}</button></div><p>${body}</p><div class="hint-actions">${buttons}${screens.button(practice ? "learn-screen" : "hint-close", t(practice ? "lessonBack" : "hintClose"), null, "button secondary")}</div>`;
    main.querySelector(".game-screen-v2").classList.add("showing-hint");
    main.querySelector(".control-panel").append(panel);
  }
  function closeHint() {
    hintStage = 0;
    pendingHint = null;
    main.querySelector(".hint-panel")?.remove();
    main.querySelector(".game-screen-v2")?.classList.remove("showing-hint");
    render();
  }
  function finish() {
    const reward = store.complete(session);
    SudokuFeedback.emit("puzzle:completed");
    $("board").classList.add("won");
    transitioning = true;
    const s = session;
    completionTimer = setTimeout(() => {
      if (session !== s || screen !== "game") return;
      transitioning = false;
      const comparison =
        data.best[s.difficulty] === undefined
          ? ""
          : reward.best
            ? '<div class="result-best">' + t("personalBest") + "</div>"
            : "";
      modal(
        '<div class="result-v2"><div class="completion-mark">' +
          icon("check") +
          '</div><span class="eyebrow">' +
          (s.mode === "journey"
            ? t("level") + " " + s.level
            : s.mode === "daily"
              ? t("daily")
              : t("classic")) +
          '</span><h2 id="dialog-title">' +
          t("completed") +
          "</h2>" +
          comparison +
          '<div class="result-metrics"><div><b>' +
          screens.time(s.elapsed) +
          "</b><span>" +
          t("time") +
          "</span></div><div><b>" +
          s.mistakes +
          "</b><span>" +
          t("mistakes") +
          "</span></div><div><b>" +
          s.hints +
          "</b><span>" +
          t("hints") +
          '</span></div></div><div class="result-technique"><small>' +
          t("mastery") +
          "</small><b>" +
          (SudokuTechniques.names[reward.technique] || reward.technique) +
          '</b></div><div class="dialog-actions">' +
          screens.button(
            "next-game",
            t(
              s.mode === "journey" && s.level < 60 ? "nextLevel" : "nextPuzzle",
            ),
            "arrow",
            "button primary",
          ) +
          screens.button("share", t("share"), "share", "button") +
          screens.button(
            s.mode === "journey" ? "journey-back" : "home",
            t(s.mode === "journey" ? "journey" : "home"),
            null,
            "text-button",
          ) +
          "</div></div>",
        "result",
      );
    }, 950);
  }
  function pause() {
    if (screen !== "game" || session.completed) return;
    persist();
    modal(
      `<div class="pause-panel"><span class="eyebrow">${t("paused")}</span><h2 id="dialog-title">${session.practiceTechnique ? t(session.practiceTechnique) : screens.difficulty(session.difficulty)}</h2><p>${screens.time(session.elapsed)}</p><div class="pause-actions">${screens.button("close", t("resume"), "play", "button primary")}${screens.button("pause-settings", t("settings"), "settings", "button")}${screens.button("restart", t("restart"), "undo", "button")}${session.practiceTechnique ? screens.button("learn-screen", t("learn"), "book", "button") : session.mode === "journey" ? screens.button("journey-back", t("journey"), "grid", "button") : ""}${screens.button("home", t("home"), "grid", "button")}</div></div>`,
      "pause",
    );
  }

  function customDialog() {
    modal(
      heading(t("customPuzzle")) +
        '<p class="dialog-copy">' +
        t("customHelp") +
        '</p><textarea id="custom-grid" aria-label="Sudoku" inputmode="numeric" class="custom-grid" rows="5" maxlength="200" placeholder="000090..." spellcheck="false"></textarea><div class="dialog-actions">' +
        screens.button("custom-start", t("play"), "play", "button primary") +
        screens.button("close", t("cancel")) +
        "</div>",
      "custom",
    );
  }
  async function shareResult() {
    const s = session,
      text =
        "Sudoku · " +
        screens.difficulty(s.difficulty) +
        "\n" +
        screens.time(s.elapsed) +
        " · " +
        s.mistakes +
        " " +
        t("mistakes") +
        " · " +
        s.hints +
        " " +
        t("hints") +
        "\n" +
        (SudokuTechniques.names[s.lastTechnique] || "");
    try {
      if (navigator.share) await navigator.share({ title: "Sudoku", text });
      else {
        await navigator.clipboard.writeText(text);
        toast(t("copied"));
      }
    } catch {}
  }
  const actions = {
    home: () => show("home"),
    new: () => show("setup"),
    resume: () => data.session && enterGame(data.session),
    "daily-screen": () =>
      requestStart(options("daily", 1, null, store.dateKey())),
    "learn-screen": () => show("learn-screen"),
    stats: () => show("stats"),
    journey: () => {
      const next =
        Array.from({ length: 60 }, (_, i) => i + 1).find(
          (level) => !data.levels[level],
        ) || 60;
      chapter = Math.floor((next - 1) / 12);
      show("journey");
    },
    "journey-back": () => {
      chapter = Math.floor(
        ((session?.level || data.session?.level || 1) - 1) / 12,
      );
      show("journey");
    },
    chapter: (n) => {
      goChapter(n);
    },
    start: (n) => requestStart(options("classic", Number(n))),
    "daily-quick": () =>
      requestStart(options("daily", 1, null, store.dateKey())),
    level: (n) => {
      const level = Number(n),
        meta = SudokuJourney.meta(level),
        o = options("journey", meta.difficulty, level);
      o.lastTechnique = meta.technique;
      requestStart(o);
    },
    custom: customDialog,
    "custom-start": () => {
      try {
        const puzzle = SudokuEngine.fromString($("custom-grid").value);
        requestStart(
          options("custom", SudokuTechniques.rate(puzzle.givens).grade),
          puzzle,
        );
      } catch {
        toast(t("invalidPuzzle"));
      }
    },
    "practice-technique": (id) => {
      const puzzle = SudokuPractice.lesson(id),
        chapterIndex = SudokuJourney.chapters.findIndex((c) =>
          c.techniques.includes(id),
        ),
        difficulty = Math.min(3, Math.max(0, chapterIndex)),
        o = options("custom", difficulty);
      o.practiceTechnique = id;
      o.lessonHint = puzzle.lessonHint;
      o.lessonNotes = puzzle.lessonNotes;
      o.lastTechnique = id;
      o.id = "practice-" + id + "-" + Date.now();
      if (session?.practiceTechnique) start(o, puzzle);
      else requestStart(o, puzzle);
    },
    pause,
    "pause-settings": () => {
      settingsFromPause = true;
      modal(screens.settings(true), "settings");
    },
    "settings-back": () => {
      settingsFromPause = false;
      pause();
    },
    close: () => {
      const kind = dialogKind;
      if (kind === "settings" && settingsFromPause) {
        actions["settings-back"]();
        return;
      }
      closeDialog();
      if (kind === "result") {
        if (session?.mode === "journey") actions["journey-back"]();
        else show("home");
      }
    },
    number: (n) => {
      if (suppressNumberClick) {
        suppressNumberClick = false;
        return;
      }
      inputValue(Number(n));
    },
    erase: () => inputValue(0),
    notes: () => {
      pencil = !pencil;
      SudokuFeedback.emit("note:changed");
      render();
    },
    undo: () => {
      if (SudokuSession.undo(session)) {
        SudokuFeedback.emit("history:undo");
        render();
        persist();
      }
    },
    redo: () => {
      if (SudokuSession.redo(session)) {
        SudokuFeedback.emit("history:redo");
        render();
        persist();
      }
    },
    "auto-notes": () => {
      SudokuSession.autoNotes(session);
      render();
      persist();
      message(t("autoNotesDone"));
    },
    mark: () => {
      SudokuSession.cycleMarks(session);
      render();
      persist();
    },
    "input-mode": (mode) => {
      session.inputMode = mode;
      session.selectedDigit = 0;
      data.inputMode = mode;
      persist();
      render();
      message(t(mode === "cell" ? "inputCell" : "inputDigit"));
    },
    hint,
    "hint-next": () => {
      hintStage = 2;
      session.hintLevels.logic++;
      render();
      showHintPanel();
    },
    "lesson-try": () => {
      if (!pendingHint) return;
      hintStage = 3;
      const target = pendingHint.placements[0] || pendingHint.eliminations[0];
      session.selected = target.cell;
      render();
      showHintPanel();
    },
    "lesson-answer": (value) => {
      if (hintStage !== 3 || !pendingHint) return;
      const target = pendingHint.placements[0] || pendingHint.eliminations[0];
      const valid = [
        ...pendingHint.placements,
        ...pendingHint.eliminations,
      ].some(
        (item) => item.cell === target.cell && item.digit === Number(value),
      );
      if (!valid) {
        main.querySelector(".lesson-feedback").textContent = t("lessonRetry");
        SudokuFeedback.emit("digit:error");
        return;
      }
      SudokuSession.applyHint(session, pendingHint);
      data.mastery[session.practiceTechnique] =
        (data.mastery[session.practiceTechnique] || 0) + 4;
      hintStage = 4;
      render();
      showHintPanel();
      persist();
      boardView.pulse([target.cell], "unit");
      SudokuFeedback.emit("unit:completed");
    },
    "lesson-next": () => {
      const ids = Object.keys(SudokuTechniques.names);
      const next = ids[ids.indexOf(session.practiceTechnique) + 1];
      if (next) actions["practice-technique"](next);
      else show("learn-screen");
    },
    "hint-apply": () => {
      SudokuSession.applyHint(session, pendingHint);
      session.lastTechnique = pendingHint.technique;
      closeHint();
      SudokuFeedback.emit("digit:placed");
      persist();
      if (session.completed) finish();
    },
    "hint-close": closeHint,
    "confirm-new": () => {
      const p = pendingStart;
      pendingStart = null;
      if (p) start(p.opts, p.puzzle);
    },
    restart: () =>
      modal(
        heading(t("restart")) +
          '<p class="dialog-copy">' +
          t("restartText") +
          '</p><div class="dialog-actions">' +
          screens.button(
            "confirm-restart",
            t("restart"),
            "undo",
            "button primary",
          ) +
          screens.button("close", t("cancel")) +
          "</div>",
        "restart",
      ),
    "confirm-restart": () =>
      enterGame(
        SudokuSession.create(
          { givens: session.givens, solution: session.solution },
          {
            id: session.id,
            mode: session.mode,
            difficulty: session.difficulty,
            level: session.level,
            date: session.date,
            practiceTechnique: session.practiceTechnique,
            lessonHint: session.lessonHint,
            lessonNotes: session.lessonNotes,
            lastTechnique: session.lastTechnique,
          },
        ),
      ),
    "next-game": () => {
      const s = session;
      closeDialog();
      if (s.mode === "journey" && s.level < 60) {
        const next = s.level + 1,
          meta = SudokuJourney.meta(next),
          o = options("journey", meta.difficulty, next);
        o.lastTechnique = meta.technique;
        start(o);
      } else if (s.mode === "daily") show("home");
      else show("setup");
    },
    share: shareResult,
    language: (name) => {
      if (!SudokuText.languages[name]) return;
      data.language = name;
      applyAppearance();
      persist();
      const current = screen;
      closeDialog();
      if (current === "game") enterGame(session);
      else show(current);
      modal(screens.settings(settingsFromPause), "settings");
    },
    theme: (name) => {
      if (!["light", "dark"].includes(name)) return;
      data.theme = name;
      applyAppearance();
      persist();
      modal(screens.settings(settingsFromPause), "settings");
    },
    "theme-toggle": () => {
      data.theme = data.theme === "dark" ? "light" : "dark";
      applyAppearance();
      persist();
      modal(screens.settings(settingsFromPause), "settings");
    },
    setting: (name) => {
      if (
        !["sound", "haptics", "check", "highlight", "autoNotes"].includes(name)
      )
        return;
      data[name] = !data[name];
      applyAppearance();
      persist();
      render();
      modal(screens.settings(settingsFromPause), "settings");
    },
  };
  document.addEventListener("click", (e) => {
    const target = e.target.closest("[data-action]");
    if (!target || target.disabled) return;
    const action = actions[target.dataset.action];
    if (action) action(target.dataset.value);
  });
  document.addEventListener("change", (e) => {
    if (e.target.matches('[data-setting-select="language"]'))
      actions.language(e.target.value);
  });
  $("brand").addEventListener("click", () => show("home"));
  $("settings").addEventListener("click", () => {
    settingsFromPause = false;
    modal(screens.settings(false), "settings");
  });
  dialog.addEventListener("cancel", (e) => {
    e.preventDefault();
    actions.close();
  });
  document.addEventListener("keydown", (e) => {
    if (
      dialog.open ||
      screen !== "game" ||
      session.completed ||
      /INPUT|SELECT|TEXTAREA/.test(e.target.tagName)
    )
      return;
    if (/^[1-9]$/.test(e.key)) {
      e.preventDefault();
      inputValue(Number(e.key));
      return;
    }
    const move = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -9, ArrowDown: 9 }[
      e.key
    ];
    if (move) {
      e.preventDefault();
      session.selected = (session.selected + move + 81) % 81;
      session.selectedCells = [session.selected];
      render(true);
      return;
    }
    if (e.key === "Escape") {
      e.preventDefault();
      pause();
    }
    if (e.key.toLowerCase() === "n") {
      e.preventDefault();
      actions.notes();
    }
    if (e.key === "Delete" || e.key === "Backspace") {
      e.preventDefault();
      inputValue(0);
    }
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z") {
      e.preventDefault();
      e.shiftKey ? actions.redo() : actions.undo();
    }
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "y") {
      e.preventDefault();
      actions.redo();
    }
  });
  setInterval(() => {
    const now = performance.now(),
      delta = (now - lastTick) / 1000;
    lastTick = now;
    if (
      screen !== "game" ||
      dialog.open ||
      document.hidden ||
      session.completed
    )
      return;
    session.elapsed += Math.min(delta, 2);
    if ($("clock")) $("clock").textContent = screens.time(session.elapsed);
  }, 250);
  setInterval(() => {
    if (screen === "game" && !session.completed) persist();
  }, 5000);
  document.addEventListener("visibilitychange", () => {
    if (document.hidden && screen === "game") persist();
    lastTick = performance.now();
  });
  window.addEventListener("pagehide", persist);
  applyAppearance();
  show("home");
  $("boot").querySelector("progress").value = 100;
  document.fonts.ready.then(() =>
    requestAnimationFrame(() => {
      $("boot").style.opacity = "0";
      setTimeout(() => $("boot")?.remove(), 320);
    }),
  );
})();

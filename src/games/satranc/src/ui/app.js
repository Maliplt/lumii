"use strict";
(() => {
  window.addEventListener("load", () => {
    const boot = document.getElementById("boot-screen");
    if (!boot) return;
    boot.classList.add("is-ready");
    setTimeout(() => boot.remove(), 420);
  }, { once: true });
  const $ = (id) => document.getElementById(id),
    data = ChessStore.data;
  const opponents = ChessOpponents;
  const search = createChessSearch();
  let screen = "home",
    mode = "solo",
    level = 2,
    minutes = 10,
    human = "w",
    state = Chess.parse(),
    session = null,
    history = [],
    notation = [],
    captured = [],
    selected = -1,
    lesson = -1,
    lessonDone = false,
    lessonPly = 0,
    lessonReply = 0,
    lessonBusy = false,
    flipped = false,
    workId = 0,
    thinking = false,
    paused = false,
    lastTick = performance.now(),
    clockSave = 0,
    resultTimer = 0;
  const t = (key) => ChessText.t(key, data.language),
    board = new ChessBoard($("board"), onSquare),
    dialog = $("dialog");
  const challenges = createChallenges({
    navigate: show,
    t,
    onHome: () => show("home"),
  });
  const hub = createChessHub({
    t,
    navigate: show,
    setup,
    quick() {
      minutes = 5;
      setup("solo");
    },
    puzzle: (id, daily) => challenges.start(id, daily),
    opponentName: (n) => opponents[n - 1].name,
  });
  const screens = createChessScreens({ $, t, opponents });
  const playerPanel = createChessPlayerPanel({
    $, t, opponents,
    profileName: () => hub.profileName(),
    readState: () => ({
      session, lesson, flipped, captured, state,
      profile: ChessProgress.data.profile,
    }),
  });
  const picker = createLanguagePicker((lang) => {
    data.language = lang;
    ChessStore.save();
    localize();
    renderCurrent();
  });
  const pauseMenu = createPauseMenu({
    resume: resumePlay,
    sound() {
      $("sound").click();
      renderPause();
    },
    theme() {
      $("theme").click();
      renderPause();
    },
    new() {
      confirm(t("newAsk"), newGame);
    },
    rules() {
      $("rules")?.click();
    },
    home() {
      persist();
      show("home");
    },
  });
  function renderPause() {
    pauseMenu.render({
      t,
      name:
        session.mode === "solo"
          ? opponents[session.level - 1].name
          : t("local"),
      clocks: session.clocks.map(formatTime),
      muted: data.muted,
      dark: data.theme === "dark",
    });
  }
  function pausePlay() {
    if (screen !== "game" || lesson >= 0 || session?.result || paused) return;
    tick();
    if (session.result) return;
    paused = true;
    board.cancelDrag?.();
    stopThinking();
    persist();
    document.body.classList.add("game-paused");
    renderGame();
    renderPause();
    pauseMenu.open();
  }
  function resumePlay() {
    if (!paused) return;
    paused = false;
    pauseMenu.close();
    document.body.classList.remove("game-paused");
    lastTick = performance.now();
    renderGame();
    requestAI();
  }
  function show(next) {
    if (next !== "game") {
      clearTimeout(lessonReply);
      lessonBusy = false;
    }
    if (screen === "challenge" && next !== "challenge") challenges.stop();
    clearTimeout(resultTimer);
    stopThinking();
    tick();
    paused = false;
    pauseMenu.close();
    document.body.classList.remove("game-paused");
    screen = next;
    for (const el of document.querySelectorAll(".screen"))
      el.hidden = el.id !== next;
    lastTick = performance.now();
    document.body.classList.toggle(
      "lesson-playing",
      next === "game" && lesson >= 0,
    );
    $("game").classList.remove("victory");
    if (next === "home") renderHome();
    if (next === "school") renderSchool();
    if (next === "game") {
      renderGame();
      requestAI();
    }
    hub.render(next);
    document.body.classList.toggle("hub-visible", next === "home");
    window.scrollTo({ top: 0, behavior: "instant" });
  }
  function localize() {
    document.documentElement.lang = data.language;
    document.documentElement.dir = data.language === "ar" ? "rtl" : "ltr";
    document.documentElement.dataset.theme = data.theme;
    document.title = t("title");
    document
      .querySelectorAll("[data-t]")
      .forEach((el) => (el.textContent = t(el.dataset.t)));
    document
      .querySelectorAll("[data-icon]")
      .forEach((el) => (el.innerHTML = ChessArt.icon(el.dataset.icon)));
    $("theme").innerHTML = ChessArt.icon(
      data.theme === "dark" ? "sun" : "moon",
    );
    $("theme").setAttribute("aria-label", t("nightMode"));
    $("theme").setAttribute("aria-pressed", String(data.theme === "dark"));
    $("sound").innerHTML = ChessArt.icon(data.muted ? "mute" : "sound");
    $("sound").setAttribute("aria-label", t("sound"));
    $("sound").setAttribute("aria-pressed", String(!data.muted));
    $("brand").setAttribute("aria-label", t("menu"));
    $("flip").setAttribute("aria-label", t("flip"));
    $("board").setAttribute("aria-label", t("board"));
    picker.update(data.language);
    ChessAudio.setMuted(data.muted);
  }
  function renderHome() {
    hub.renderHome();
  }
  function renderCurrent() {
    if (screen === "home") renderHome();
    if (screen === "setup") renderSetup();
    if (screen === "school") renderSchool();
    if (screen === "game") renderGame();
    if (screen === "challenge") challenges.render();
    hub.render(screen);
  }
  function renderSetup() {
    screens.renderSetup({ mode, level, minutes, human, wins: data.wins });
  }
  function setup(nextMode) {
    lesson = -1;
    mode = nextMode;
    renderSetup();
    show("setup");
  }
  function persist() {
    if (screen === "game" && session && lesson < 0) {
      session.fen = Chess.fen(state);
      data.session = session;
      ChessStore.save();
    }
  }
  function newGame() {
    stopThinking();
    lesson = -1;
    selected = -1;
    state = Chess.parse();
    history = [Chess.key(state)];
    notation = [];
    captured = [];
    const side = human === "random" ? (Math.random() < 0.5 ? "w" : "b") : human;
    session = {
      id: String(Date.now()) + "-" + Math.random().toString(36).slice(2, 8),
      startedAt: new Date().toISOString(),
      playerName: hub.profileName(),
      mode,
      level,
      human: side,
      minutes,
      clocks: [minutes * 60000, minutes * 60000],
      fen: Chess.fen(state),
      log: [],
      result: null,
    };
    flipped = mode === "solo" && side === "b";
    data.session = session;
    ChessStore.save();
    show("game");
    ChessAudio.play("select");
  }
  function resume() {
    session = structuredClone(data.session);
    if (!session) return;
    lesson = -1;
    mode = session.mode;
    level = session.level;
    minutes = session.minutes;
    human = session.human;
    flipped = mode === "solo" && human === "b";
    state = Chess.parse();
    history = [Chess.key(state)];
    notation = [];
    captured = [];
    for (const code of session.log) {
      const m = Chess.legal(state).find((m) => Chess.uci(m) === code);
      rememberCapture(m);
      notation.push(Chess.notation(state, m));
      state = Chess.apply(state, m);
      history.push(Chess.key(state));
    }
    selected = -1;
    show("game");
    const result = Chess.status(state, history);
    if (result.over && !session.result) finish(result);
  }
  function rememberCapture(m) {
    const piece = m.ep ? (state.turn === "w" ? "p" : "P") : state.board[m.to];
    if (piece) captured.push(piece);
  }
  function lastMove() {
    const code = session?.log.at(-1);
    return code
      ? {
          from: Chess.index(code.slice(0, 2)),
          to: Chess.index(code.slice(2, 4)),
        }
      : null;
  }
  function currentLesson() {
    if (lesson < 0) return null;
    const l = ChessLessons[lesson];
    return {
      ...l,
      move: l.line?.[lessonPly] || l.move,
      text: l.steps?.[Math.floor(lessonPly / 2)] || l.text,
    };
  }
  function renderGame(animate = null) {
    board.flipped = flipped;
    const l = currentLesson();
    board.render(state, {
      selected,
      moves:
        selected < 0
          ? []
          : Chess.legal(state).filter((m) => m.from === selected),
      last: l ? null : lastMove(),
      target:
        l && lesson < 12 && !lessonDone ? Chess.index(l.move.slice(2, 4)) : -1,
      lang: data.language,
      animate,
    });
    $("normal-tools").hidden = !!l;
    $("lesson-tools").hidden = !l;
    $("flip").hidden = !!l;
    $("game-menu").innerHTML =
      ChessArt.icon(l ? "back" : session?.result ? "back" : "pause") +
      "<span>" +
      t(l ? "back" : session?.result ? "menu" : "pause") +
      "</span>";
    $("game-label").textContent = l
      ? t("lesson") + " " + String(lesson + 1).padStart(2, "0")
      : t(session?.mode === "local" ? "local" : "solo");
    playerPanel.renderPlayers();
    if (l) {
      $("lesson-number").textContent =
        String(lesson + 1).padStart(2, "0") + " / " + ChessLessons.length;
      $("lesson-title").textContent = t(l.name);
      $("lesson-text").textContent =
        l.text[ChessText.languages.indexOf(data.language)];
      $("lesson-feedback").textContent = lessonDone ? t("correct") : "";
      $("lesson-next").hidden = !lessonDone;
      $("lesson-next").querySelector("[data-t]").textContent = t(
        lesson === ChessLessons.length - 1 ? "academy" : "next",
      );
      $("lesson-hint").hidden = lessonDone;
      if (!lessonDone && lesson < 12) addHand();
      return;
    }
    const status = Chess.status(state, history);
    $("status").textContent = session?.result
      ? t(session.result.reason)
      : paused
        ? t("paused")
        : thinking
          ? t("thinking")
          : status.check
            ? t("check")
            : t("turn") + " · " + t(state.turn === "w" ? "white" : "black");
    const canClaim =
      status.claim || Chess.claimMoves(state, history).length > 0;
    $("claim").hidden = !canClaim || !!session.result || thinking;
    $("draw-offer").hidden =
      session.mode !== "local" || !!session.result || canClaim;
    $("resign").hidden = !!session.result;
    $("game-result").hidden = !session.result;
    $("move-list").innerHTML = Array.from(
      { length: Math.ceil(notation.length / 2) },
      (_, i) =>
        `<div class="move-row" dir="ltr"><span class="move-number">${i + 1}.</span> <span class="white-move">${notation[i * 2] || "—"}</span> <span class="black-move">${notation[i * 2 + 1] || "—"}</span></div>`,
    ).join("");
    $("move-list").scrollTop = $("move-list").scrollHeight;
    $("move-list").scrollLeft = $("move-list").scrollWidth;
  }
  function tick() {
    const now = performance.now(),
      elapsed = now - lastTick;
    lastTick = now;
    if (
      screen !== "game" ||
      lesson >= 0 ||
      !session ||
      session.result ||
      document.hidden ||
      paused ||
      !session.minutes
    )
      return;
    const i = state.turn === "w" ? 0 : 1;
    session.clocks[i] = Math.max(0, session.clocks[i] - elapsed);
    playerPanel.renderClocks();
    if (session.clocks[i] === 0) {
      const winner = Chess.opposite(state.turn);
      finish({
        over: true,
        reason: "timeout",
        winner: Chess.canMate(state, winner) ? winner : null,
      });
    }
    if (now - clockSave > 1000) {
      clockSave = now;
      persist();
    }
  }
  function stopThinking() {
    workId++;
    search.cancel();
    thinking = false;
  }
  function requestAI() {
    if (
      screen !== "game" ||
      lesson >= 0 ||
      !session ||
      session.result ||
      session.mode !== "solo" ||
      state.turn === session.human ||
      document.hidden ||
      dialog.open ||
      paused ||
      thinking
    )
      return;
    stopThinking();
    thinking = true;
    $("status").textContent = t("thinking");
    $("claim").hidden = true;
    const id = workId,
      position = Chess.fen(state);
    const accept = (m) => {
      if (id !== workId || screen !== "game" || Chess.fen(state) !== position)
        return;
      thinking = false;
      search.cancel();
      const legal = Chess.legal(state).find(
        (x) => Chess.uci(x) === Chess.uci(m),
      );
      if (legal) commit(legal);
    };
    search.request(state, session.level, accept);
  }

  function onSquare(i) {
    ChessAudio.unlock();
    if (lessonBusy) return;
    if (
      screen !== "game" ||
      (lessonDone && lesson >= 0) ||
      (lesson < 0 &&
        (session?.result ||
          thinking ||
          (session?.mode === "solo" && state.turn !== session.human))) ||
      dialog.open ||
      paused
    )
      return;
    tick();
    if (session?.result && lesson < 0) return;
    const moves =
      selected < 0
        ? []
        : Chess.legal(state).filter((m) => m.from === selected && m.to === i);
    if (moves.length) {
      if (moves[0].promotion) promotion(moves);
      else commit(moves[0]);
      return;
    }
    if (Chess.color(state.board[i]) === state.turn) {
      selected = selected === i ? -1 : i;
      ChessAudio.play("select");
      renderGame();
    } else {
      board.pulse(i);
      ChessAudio.play("wrong");
    }
  }
  function promotion(moves) {
    openDialog(
      `<span class="eyebrow">${t("promote")}</span><h2>${t("promote")}</h2><div class="promotion-options">${moves.map((m) => `<button data-promotion="${m.promotion}" aria-label="${t(m.promotion)}">${ChessArt.piece(state.turn === "w" ? m.promotion.toUpperCase() : m.promotion)}<span>${t(m.promotion)}</span></button>`).join("")}</div><div class="dialog-actions"><button data-cancel>${t("cancel")}</button></div>`,
    );
    dialog.querySelectorAll("[data-promotion]").forEach(
      (el) =>
        (el.onclick = () => {
          closeDialog();
          commit(moves.find((m) => m.promotion === el.dataset.promotion));
        }),
    );
  }
  function commit(m) {
    tick();
    if (lesson < 0 && session.result) return;
    if (lesson >= 0) {
      if (Chess.uci(m) !== currentLesson().move) {
        board.pulse(m.to);
        ChessAudio.play("wrong");
        $("lesson-feedback").textContent = t("tryTarget");
        return;
      }
      state = Chess.apply(state, m);
      selected = -1;
      const line = ChessLessons[lesson].line;
      if (line && lessonPly + 1 < line.length) {
        lessonBusy = true;
        renderGame(m);
        $("lesson-feedback").textContent = t("thinking");
        const reply = line[lessonPly + 1];
        lessonReply = setTimeout(() => {
          const response = Chess.legal(state).find(
            (m) => Chess.uci(m) === reply,
          );
          state = Chess.apply(state, response);
          lessonPly += 2;
          lessonBusy = false;
          renderGame(response);
          ChessAudio.play("move");
        }, 500);
        return;
      }
      lessonDone = true;
      const firstLesson = !data.lessons.includes(lesson);
      const earned = ChessProgress.lesson(firstLesson);
      if (firstLesson) {
        data.lessons.push(lesson);
        ChessStore.save();
      }
      renderGame(m);
      if (earned)
        $("lesson-feedback").textContent =
          t("correct") + " · +" + earned + " XP";
      celebrate();
      ChessAudio.play("win");
      return;
    }
    const capture = !!state.board[m.to] || m.ep;
    rememberCapture(m);
    notation.push(Chess.notation(state, m));
    state = Chess.apply(state, m);
    session.log.push(Chess.uci(m));
    history.push(Chess.key(state));
    selected = -1;
    persist();
    renderGame(m);
    const result = Chess.status(state, history);
    ChessAudio.play(result.check ? "check" : capture ? "capture" : "move");
    if (capture && result.check) ChessAudio.play("capture");
    if (result.over) finish(result);
    else requestAI();
  }
  function celebrate() {
    const el = $("board-effects");
    el.replaceChildren();
    $("game").classList.remove("victory");
    void $("game").offsetWidth;
    $("game").classList.add("victory");
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    for (let i = 0; i < 32; i++) {
      const p = document.createElement("i"),
        angle = (Math.PI * 2 * i) / 32,
        radius = 100 + Math.random() * 170;
      p.style.setProperty("--x", Math.cos(angle) * radius + "px");
      p.style.setProperty("--y", Math.sin(angle) * radius + "px");
      p.style.setProperty("--r", Math.random() * 540 + "deg");
      p.style.background =
        i % 3 === 0
          ? "var(--accent)"
          : i % 3 === 1
            ? "var(--gold)"
            : "var(--white-piece)";
      p.style.animationDelay = Math.random() * 0.15 + "s";
      p.addEventListener("animationend", () => p.remove(), { once: true });
      el.append(p);
    }
  }
  function finish(result) {
    if (session?.result) return;
    stopThinking();
    session.result = result;
    session.reward = ChessProgress.match(session);
    if (result.winner === session.human && session.mode === "solo")
      data.wins[session.level] = (data.wins[session.level] || 0) + 1;
    persist();
    renderGame();
    const won =
      result.winner &&
      (session.mode === "local" || result.winner === session.human);
    if (won) celebrate();
    ChessAudio.play(won ? "win" : "check");
    resultTimer = setTimeout(
      () => {
        if (screen === "game" && lesson < 0) resultDialog();
      },
      matchMedia("(prefers-reduced-motion: reduce)").matches ? 200 : 1200,
    );
  }
  function resultDialog() {
    openDialog(screens.resultMarkup(session, (side) => playerPanel.safeName(side)));
    dialog.querySelector("[data-menu]").onclick = () => {
      closeDialog();
      show("home");
    };
    dialog.querySelector("[data-rematch]").onclick = () => {
      closeDialog();
      newGame();
    };
  }
  function openDialog(html) {
    $("dialog-body").innerHTML = html;
    if (!dialog.open) dialog.showModal();
    dialog
      .querySelector("[data-cancel]")
      ?.addEventListener("click", closeDialog);
  }
  function closeDialog() {
    dialog.close();
  }
  dialog.addEventListener("close", () => {
    if (!dialog.open) requestAI();
  });
  document.addEventListener("keydown", (event) => {
    if (
      event.key === "Escape" &&
      !dialog.open &&
      !paused &&
      screen === "game" &&
      lesson < 0
    ) {
      event.preventDefault();
      pausePlay();
    }
  });
  function confirm(title, action) {
    openDialog(
      `<h2>${title}</h2><div class="dialog-actions"><button data-cancel>${t("cancel")}</button><button class="primary" data-confirm>${t("confirm")}</button></div>`,
    );
    dialog.querySelector("[data-confirm]").onclick = () => {
      closeDialog();
      action();
    };
  }
  function renderSchool() {
    hub.renderSchool();
  }
  function startLesson(i) {
    tick();
    persist();
    stopThinking();
    lesson = i;
    lessonPly = 0;
    lessonBusy = false;
    clearTimeout(lessonReply);
    lessonDone = false;
    selected = -1;
    state = Chess.parse(ChessLessons[i].fen);
    flipped = false;
    show("game");
  }
  function addHand() {
    const from = Chess.index(
        currentLesson().move.slice(
          selected >= 0 ? 2 : 0,
          selected >= 0 ? 4 : 2,
        ),
      ),
      cell = board.nodes.get(from),
      hand = document.createElement("div");
    hand.className = "tutorial-hand";
    hand.setAttribute("aria-hidden", "true");
    hand.innerHTML =
      '<svg viewBox="0 0 64 80"><circle class="touch-wave" cx="22" cy="13" r="10"/><g class="touch-finger"><path d="M17 43V14c0-8 11-8 11 0v23-9c0-6 10-6 10 0v9-5c0-6 10-6 10 0v8-4c0-5 9-5 9 0v17c0 8-6 15-8 21H28c-2-7-7-11-11-16L7 46c-5-6 2-12 7-7l9 10"/><path d="M29 64h20M33 40v12m10-11v11" class="hand-detail"/></g></svg>';
    cell.append(hand);
  }
  document
    .querySelectorAll("[data-home]")
    .forEach((el) => (el.onclick = () => show("home")));
  $("brand").onclick = () => {
    if (dialog.open) closeDialog();
    persist();
    show("home");
  };
  $("solo").onclick = () => setup("solo");
  $("local").onclick = () => setup("local");
  $("academy").onclick = () => show("school");
  $("resume").onclick = resume;
  $("theme").onclick = () => {
    data.theme = data.theme === "dark" ? "light" : "dark";
    ChessStore.save();
    localize();
  };
  $("sound").onclick = () => {
    data.muted = !data.muted;
    ChessStore.save();
    localize();
    if (!data.muted) ChessAudio.play("select");
  };
  $("opponents").onclick = (e) => {
    const el = e.target.closest("[data-level]");
    if (el) {
      level = Number(el.dataset.level);
      renderSetup();
      ChessAudio.play("select");
    }
  };
  $("time-options").onclick = (e) => {
    const el = e.target.closest("[data-minutes]");
    if (el) {
      minutes = Number(el.dataset.minutes);
      renderSetup();
    }
  };
  $("color-options").onclick = (e) => {
    const el = e.target.closest("[data-color]");
    if (el) {
      human = el.dataset.color;
      renderSetup();
    }
  };
  $("start").onclick = () => {
    if (data.session && !data.session.result) confirm(t("newAsk"), newGame);
    else newGame();
  };
  $("game-menu").onclick = () => {
    if (lesson < 0 && !session?.result) {
      pausePlay();
      return;
    }
    tick();
    persist();
    show(lesson >= 0 ? "school" : "home");
  };
  $("game-result").onclick = resultDialog;
  $("flip").onclick = () => {
    flipped = !flipped;
    renderGame();
  };
  $("resign").onclick = () =>
    confirm(t("resignAsk"), () =>
      finish({
        over: true,
        reason: "resigned",
        winner: Chess.opposite(
          session.mode === "solo" ? session.human : state.turn,
        ),
      }),
    );
  $("claim").onclick = () => {
    if (Chess.status(state, history).claim) {
      finish({ over: true, reason: "claimed", winner: null });
      return;
    }
    const moves = Chess.claimMoves(state, history);
    if (!moves.length) return;
    openDialog(
      `<h2>${t("claim")}</h2><div class="claim-moves">${moves.map((m, i) => `<button class="quiet" data-claim-move="${i}">${Chess.notation(state, m)}</button>`).join("")}</div><div class="dialog-actions"><button data-cancel>${t("cancel")}</button></div>`,
    );
    dialog.querySelectorAll("[data-claim-move]").forEach(
      (el) =>
        (el.onclick = () => {
          session.claimedMove = Chess.uci(moves[Number(el.dataset.claimMove)]);
          closeDialog();
          finish({ over: true, reason: "claimed", winner: null });
        }),
    );
  };
  $("draw-offer").onclick = () =>
    confirm(t("offerAsk"), () =>
      finish({ over: true, reason: "agreed", winner: null }),
    );
  $("lesson-list").onclick = (e) => {
    const el = e.target.closest("[data-lesson]");
    if (el) startLesson(Number(el.dataset.lesson));
  };
  $("lesson-hint").onclick = () => {
    if (lessonBusy) return;
    selected = Chess.index(currentLesson().move.slice(0, 2));
    renderGame();
  };
  $("lesson-retry").onclick = () => startLesson(lesson);
  $("lesson-next").onclick = () => {
    if (lesson + 1 < ChessLessons.length) startLesson(lesson + 1);
    else show("school");
  };
  const rulesButton = $("rules");
  if (rulesButton)
    rulesButton.onclick = () =>
      openDialog(
        `<h2>${t("rules")}</h2><p>${t("drawRules")}</p><p>${t("pausedNote")}</p><div class="dialog-actions"><button data-cancel>${t("close")}</button></div>`,
      );
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      pausePlay();
      persist();
      stopThinking();
    }
    lastTick = performance.now();
    if (!document.hidden) requestAI();
  });
  window.addEventListener("pagehide", persist);
  setInterval(tick, 100);

  localize();
  renderHome();
  document.body.classList.add("hub-visible");
  ChessProgress.applyTheme();
})();

"use strict";
(() => {
  const $ = (id) => document.getElementById(id),
    { data, save } = FusionStorage,
    settings = data.settings,
    audio = createFusionAudio(settings),
    machine = document.querySelector(".machine");
  const t = (key, args = {}) =>
    Object.entries(args).reduce(
      (s, [k, v]) => s.replaceAll("{" + k + "}", String(v)),
      FusionText[settings.language][key] ?? key,
    );
  let state = data.session
      ? structuredClone(data.session)
      : FusionEngine.create(65432),
    undoState = data.undo ? structuredClone(data.undo) : null;
  let phase = "menu",
    practice = false,
    selected = 0,
    hovered = null,
    focusId = 9,
    animation = null,
    modalKind = null,
    previousFocus = null,
    returnPhase = null,
    lastTime = performance.now(),
    effectsRemaining = 0,
    stageLock = 0,
    streak = 0,
    streakRemaining = 0,
    scoreVisual = 0,
    scoreTarget = 0,
    newBest = false;
  function keep() {
    if (practice) return;
    data.session = structuredClone(state);
    data.undo = undoState ? structuredClone(undoState) : null;
    if (!save()) message("saveError");
  }
  function message(key, args = {}) {
    $("status").textContent = t(key, args);
    $("status").dataset.kind = key;
  }
  function freshSeed() {
    const a = new Uint32Array(1);
    if (globalThis.crypto?.getRandomValues) {
      crypto.getRandomValues(a);
      return a[0];
    }
    return (Date.now() ^ Math.floor(Math.random() * 4294967296)) >>> 0;
  }
  function core(value) {
    const node = document.createElement("span");
    node.className = "core";
    node.dataset.value = ((value - 1) % 6) + 1;
    node.dataset.digits = String(FusionEngine.number(value)).length;
    node.textContent = FusionEngine.number(value);
    return node;
  }
  function applyText() {
    document.documentElement.lang = settings.language;
    document.documentElement.dir = settings.language === "ar" ? "rtl" : "ltr";
    document.body.dataset.theme = settings.theme;
    document.title = "Füzyon — " + t("tagline");
    document.querySelector('meta[name="description"]').content = t("tagline");
    document.querySelector('meta[name="theme-color"]').content =
      settings.theme === "dark" ? "#201d20" : "#f7f8fa";
    document
      .querySelectorAll("[data-t]")
      .forEach((n) => (n.textContent = t(n.dataset.t)));
    document
      .querySelectorAll("[data-html]")
      .forEach((n) => (n.innerHTML = t(n.dataset.html)));
    document.querySelectorAll("[data-label]").forEach((n) => {
      n.setAttribute("aria-label", t(n.dataset.label));
      n.title = t(n.dataset.label);
    });
    $("sound").setAttribute("aria-pressed", String(!settings.muted));
    $("sound").innerHTML =
      `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9h4l5-4v14l-5-4H4Z"/><path d="${settings.muted ? "m17 9 5 6m0-6-5 6" : "M17 8a6 6 0 0 1 0 8"}"/></svg>`;
    $("theme").setAttribute("aria-pressed", String(settings.theme === "light"));
    picker.update(settings.language);
    updateStreak();
    render();
    if (modalKind) openModal(modalKind, false);
  }
  const picker = createLanguagePicker((lang) => {
    settings.language = lang;
    $("language-panel").hidden = true;
    $("language").setAttribute("aria-expanded", "false");
    applyText();
    save();
    $("language").focus();
  });
  function render() {
    machine.classList.toggle("menu-state", phase === "menu");
    machine.classList.toggle("practice-state", practice);
    machine.classList.toggle("paused-state", phase === "paused");
    machine.classList.toggle("tutorial-aim", practice && phase === "playing");
    $("tutorial-win").hidden = !(practice && phase === "over");
    const count = state.board.filter((n) => !n).length;
    machine.classList.toggle("danger", count <= 3 && phase !== "menu");
    $("start-cover").hidden = phase !== "menu";
    $("play").hidden = !data.session;
    $("new-game").className = data.session ? "learn" : "start-button";
    $("play").querySelector("span").textContent = t(
      data.session ? "continue" : "play",
    );
    scoreTarget =
      phase === "menu" ? 0 : animation ? animation.score : state.score;
    $("score").textContent = Math.round(scoreVisual).toLocaleString(
      settings.language,
    );
    $("best").textContent = data.best.toLocaleString(settings.language);
    $("menu-best").textContent = data.best.toLocaleString(settings.language);
    $("space-label").textContent =
      t("space") + " " + count + "/" + state.board.length;
    $("peak").textContent = t("peak") + " " + FusionEngine.number(state.peak);
    $("move-count").textContent =
      t("moves") + " " + String(state.moves).padStart(2, "0");
    $("reactor-label").textContent = practice
      ? t("practice")
      : t("stage") + " " + state.stage;
    $("score-progress").setAttribute("aria-label", t("score"));
    const geometry = FusionEngine.geometry(state);
    $("board").style.setProperty("--cell-width", geometry.step * 0.95 + "%");
    $("board").style.setProperty("--cell-height", geometry.step * 1.25 + "%");
    $("board").dataset.radius = state.radius;
    $("pause").disabled = !["playing", "animating"].includes(phase);
    $("undo").disabled = !undoState || practice || phase !== "playing";
    $("restart").disabled = !["playing", "over"].includes(phase) || practice;
    const hand = document.createDocumentFragment();
    (animation?.hand || state.hand).forEach((n, slot) => {
      const b = document.createElement("button");
      b.append(core(n));
      b.setAttribute("aria-label", t("choose") + " " + FusionEngine.number(n));
      b.setAttribute("aria-pressed", String(selected === slot));
      b.disabled = phase !== "playing" || (practice && slot !== 0);
      b.onclick = () => {
        selected = slot;
        hovered = null;
        audio.play("tap");
        render();
      };
      hand.append(b);
    });
    $("hand").replaceChildren(hand);
    $("queue").replaceChildren(...(animation?.queue || state.queue).map(core));
    renderBoard(animation ? animation.board : state.board);
    if (practice) message("practiceCopy");
    else if (count <= 3 && phase === "playing")
      message("warning", { n: count });
    else message("select");
  }
  function renderBoard(board) {
    const preserveFocus = $("board").contains(document.activeElement);
    const fragment = document.createDocumentFragment();
    let forecast = null;
    if (phase === "playing" && hovered != null && !board[hovered])
      forecast = FusionEngine.preview(state, hovered, selected);
    const linked = new Set(forecast?.frames.flatMap((f) => f.ids) || []);
    FusionEngine.geometry(state).cells.forEach((cell, id) => {
      const b = document.createElement("button");
      b.className = "socket" + (!board[id] ? " empty" : "");
      b.style.setProperty("--x", cell.x + "%");
      b.style.setProperty("--y", cell.y + "%");
      b.dataset.cell = id;
      b.setAttribute(
        "aria-label",
        t("cell", {
          n: id + 1,
          v: board[id] ? FusionEngine.number(board[id]) : t("empty"),
        }),
      );
      b.setAttribute("aria-disabled", String(!!board[id]));
      b.tabIndex = id === focusId ? 0 : -1;
      b.disabled = phase !== "playing";
      if (practice && id === 9) b.classList.add("target");
      if (board[id]) b.append(core(board[id]));
      else if (id === hovered && phase === "playing") {
        b.append(core(state.hand[selected]));
        b.classList.add("preview");
      }
      if (linked.has(id)) b.classList.add("linked");
      b.addEventListener("click", () => place(id));
      fragment.append(b);
    });
    $("board").replaceChildren(fragment);
    if (preserveFocus && phase === "playing")
      $("board").children[focusId]?.focus({ preventScroll: true });
    if (forecast?.frames.length)
      $("status").textContent =
        "+" +
        (forecast.score + 5) +
        " / " +
        t("chain", { n: forecast.frames.length });
  }
  function begin(isPractice = false, resume = false) {
    closeModal();
    stageLock = 0;
    resetStreak();
    practice = isPractice;
    state = isPractice
      ? FusionEngine.tutorial()
      : resume && data.session
        ? structuredClone(data.session)
        : FusionEngine.create(freshSeed());
    undoState =
      !isPractice && resume && data.undo ? structuredClone(data.undo) : null;
    if (!practice) while (FusionEngine.advance(state)) {}
    selected = 0;
    focusId = Math.floor(state.board.length / 2);
    hovered = null;
    animation = null;
    newBest = false;
    phase = "playing";
    $("effects").replaceChildren();
    render();
    if (!practice) keep();
    if (!state.board.includes(0)) {
      phase = "over";
      render();
      openModal("result");
    }
  }
  function play() {
    if (data.session) begin(false, true);
    else if (!settings.learned) begin(true);
    else begin();
  }
  function place(id) {
    if (
      phase !== "playing" ||
      stageLock > 0 ||
      state.board[id] ||
      (practice && (id !== 9 || selected !== 0))
    )
      return;
    const before = structuredClone(state),
      result = FusionEngine.place(state, id, selected);
    if (!result) return;
    if (!practice && result.frames.length) {
      streak = streakRemaining > 0 ? streak + 1 : 1;
      streakRemaining = 6000;
      updateStreak();
    } else if (!practice) resetStreak();
    undoState = before;
    focusId = id;
    hovered = null;
    newBest = state.score > data.best;
    if (!practice) {
      data.best = Math.max(data.best, state.score);
      data.bestPeak = Math.max(data.bestPeak, state.peak);
      keep();
    }
    phase = "animating";
    animation = {
      result,
      hand: before.hand,
      queue: before.queue,
      score: before.score + 5,
      slot: selected,
      board: result.placed,
      index: -1,
      stage: "place",
      elapsed: 0,
    };
    audio.play("place");
    render();
    $("board").children[id].classList.add("pulse");
    if (!result.frames.length)
      effects({ origin: id, points: 5, depth: 0, burst: false });
  }
  function animateStep() {
    const a = animation;
    if (!a) return;
    if (a.stage === "settle" && a.result.spawned) {
      a.stage = "auto-tile";
      a.elapsed = 0;
      a.board = [...state.board];
      renderBoard(a.board);
      $("board").children[a.result.spawned.id].classList.add("auto-arrival");
      audio.play("place");
      return;
    }
    if (a.stage === "settle" || a.stage === "auto-tile") {
      finishAnimation();
      return;
    }
    const frames = a.result.frames;
    if (a.stage === "place" || a.stage === "evolve") {
      a.index++;
      if (a.index >= frames.length) {
        a.stage = "settle";
        a.elapsed = 0;
        return;
      }
      const f = frames[a.index];
      a.board = f.before;
      a.stage = "absorb";
      a.elapsed = 0;
      renderBoard(a.board);
      const root = $("board").getBoundingClientRect(),
        origin = FusionEngine.geometry(state).cells[f.origin];
      f.cleared.forEach((id) => {
        const b = $("board").children[id];
        if (f.burst) b.classList.add("blast");
        else if (id !== f.origin) {
          const c = FusionEngine.geometry(state).cells[id];
          b.style.setProperty(
            "--dx",
            ((origin.x - c.x) * root.width) / 100 + "px",
          );
          b.style.setProperty(
            "--dy",
            ((origin.y - c.y) * root.height) / 100 + "px",
          );
          b.classList.add("absorb");
        }
      });
      audio.play(f.burst ? "burst" : "merge", f.depth);
      message(f.burst ? "burst" : f.depth > 1 ? "chain" : "merge", {
        n: f.depth,
      });
    } else {
      const f = frames[a.index];
      a.board = f.after;
      a.stage = "evolve";
      a.score += f.points;
      scoreTarget = a.score;
      a.elapsed = 0;
      renderBoard(a.board);
      if (!f.burst) $("board").children[f.origin].classList.add("evolve");
      effects(f);
    }
  }
  function updateStreak() {
    const badge = $("streak-badge");
    badge.hidden = streak < 2;
    badge.textContent = t("streak") + " " + streak;
    badge.style.setProperty("--remaining", streakRemaining / 6000);
    machine.dataset.heat =
      streak >= 5 ? "hot" : streak >= 3 ? "warm" : "normal";
  }
  function resetStreak() {
    streak = 0;
    streakRemaining = 0;
    updateStreak();
  }
  function punchHud(depth, size) {
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const intensity = Math.min(5, Math.max(depth, streak, size > 3 ? 2 : 1));
    const kick = intensity * 1.25;
    for (const element of [$("score"), $("score-progress")]) {
      element.getAnimations().forEach((a) => a.cancel());
      const scale =
        element.id === "score" ? 1 + intensity * 0.045 : 1 + intensity * 0.012;
      element.animate(
        [
          { transform: "translateX(0) scale(1)" },
          { offset: 0.2, transform: `translateX(${-kick}px) scale(${scale})` },
          { offset: 0.36, transform: `translateX(${kick}px) scale(${scale})` },
          {
            offset: 0.52,
            transform: `translateX(${-kick * 0.65}px) scale(${scale})`,
          },
          {
            offset: 0.7,
            transform: `translateX(${kick * 0.4}px) scale(1.015)`,
          },
          { transform: "translateX(0) scale(1)" },
        ],
        { duration: 340 + intensity * 35, easing: "ease-out" },
      );
    }
    if (streak >= 2)
      $("streak-badge").animate(
        [
          { transform: "scale(.8)" },
          { transform: "scale(1.18)" },
          { transform: "scale(1)" },
        ],
        { duration: 300 },
      );
  }
  function effects(f) {
    effectsRemaining = 1100;
    if (f.depth > 0) punchHud(f.depth, f.ids?.length || 3);
    const rect = $("reactor").getBoundingClientRect();
    const cell = $("board").children[f.origin].getBoundingClientRect();
    $("effects").style.setProperty(
      "--fx",
      cell.left + cell.width / 2 - rect.left + "px",
    );
    $("effects").style.setProperty(
      "--fy",
      cell.top + cell.height / 2 - rect.top + "px",
    );
    const fragment = document.createDocumentFragment();
    const label = document.createElement("span");
    label.className = "effect-score";
    label.textContent = "+" + f.points;
    if (f.depth > 1) {
      const multiplier = document.createElement("b");
      multiplier.className = "effect-multiplier";
      multiplier.textContent = "×" + f.depth;
      fragment.append(multiplier);
    }
    $("reactor").classList.remove("reward-flash");
    void $("reactor").offsetWidth;
    $("reactor").classList.add("reward-flash");
    fragment.append(label);
    if (f.burst || f.depth > 1 || (f.ids?.length || 0) > 3 || streak >= 2) {
      const ring = document.createElement("i");
      ring.className = "effect-ring";
      fragment.append(ring);
      if (f.depth > 1 || streak >= 3) {
        const echo = ring.cloneNode();
        echo.classList.add("combo-echo");
        fragment.append(echo);
      }
      const count = Math.min(24, 8 + f.depth * 4 + Math.min(streak, 4) * 2);
      for (let i = 0; i < count; i++) {
        const spark = document.createElement("i");
        spark.className = "spark";
        spark.style.setProperty("--a", i * (360 / count) + "deg");
        spark.style.setProperty("--distance", 65 + (i % 4) * 18 + "px");
        fragment.append(spark);
      }
    }
    $("effects").replaceChildren(fragment);
  }
  function finishAnimation() {
    const queueRect = $("queue").firstElementChild?.getBoundingClientRect();
    let advanced = false;
    if (!practice) {
      while (FusionEngine.advance(state)) advanced = true;
      if (advanced) {
        focusId = Math.floor(state.board.length / 2);
        keep();
      }
    }
    animation = null;
    phase = "playing";
    render();
    const active = $("hand").querySelector(".core");
    if (
      active &&
      queueRect &&
      !matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      const rect = active.getBoundingClientRect();
      active.animate(
        [
          {
            transform: `translate(${queueRect.left - rect.left}px,${queueRect.top - rect.top}px) scale(.6)`,
            opacity: 0.6,
          },
          { transform: "translate(0,0) scale(1)", opacity: 1 },
        ],
        { duration: 380, easing: "cubic-bezier(.2,.8,.2,1)" },
      );
      $("queue").animate(
        [
          { transform: "translateX(22px)", opacity: 0.45 },
          { transform: "translateX(0)", opacity: 1 },
        ],
        { duration: 320 },
      );
    }
    if (advanced) celebrateStage();
    if (practice) {
      settings.learned = true;
      save();
      phase = "over";
      render();
      $("tutorial-play").focus({ preventScroll: true });
    } else if (!state.board.includes(0)) {
      phase = "over";
      render();
      openModal("result");
    } else $("board").children[focusId]?.focus({ preventScroll: true });
  }
  function celebrateStage() {
    const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const fragment = document.createDocumentFragment();
    const banner = document.createElement("div");
    banner.className = "stage-celebration";
    const label = document.createElement("span");
    label.textContent = t("stage");
    const number = document.createElement("strong");
    number.textContent = state.stage;
    banner.append(label, number);
    fragment.append(banner);
    if (!reduced) {
      for (let i = 0; i < 3; i++) {
        const ring = document.createElement("i");
        ring.className = "stage-wave";
        ring.style.setProperty("--wave", i);
        fragment.append(ring);
      }
      for (let i = 0; i < 24; i++) {
        const shard = document.createElement("i");
        shard.className = "stage-shard";
        const angle = (i * Math.PI) / 12;
        shard.style.setProperty(
          "--tx",
          Math.cos(angle) * (115 + (i % 3) * 38) + "px",
        );
        shard.style.setProperty(
          "--ty",
          Math.sin(angle) * (95 + (i % 4) * 25) + "px",
        );
        shard.style.setProperty("--turn", (i % 2 ? 210 : -180) + "deg");
        shard.style.setProperty("--delay", (i % 4) * 22 + "ms");
        shard.style.setProperty("--color", `var(--v${(i % 6) + 1})`);
        fragment.append(shard);
      }
      stageLock = 460;
      $("board").animate(
        [
          {
            opacity: 0.4,
            transform: "translate(-50%,-50%) rotate(-12deg) scale(.82)",
          },
          {
            offset: 0.7,
            opacity: 1,
            transform: "translate(-50%,-50%) rotate(2deg) scale(1.025)",
          },
          { opacity: 1, transform: "translate(-50%,-50%) rotate(0) scale(1)" },
        ],
        { duration: 420, easing: "cubic-bezier(.18,.8,.25,1)" },
      );
      const cells = FusionEngine.geometry(state).cells;
      [...$("board").children].forEach((tile, id) => {
        const cell = cells[id];
        const distance = Math.max(
          Math.abs(cell.q),
          Math.abs(cell.r),
          Math.abs(cell.q + cell.r),
        );
        tile.animate(
          [
            { opacity: 0.15, scale: 0.55, filter: "brightness(1.5)" },
            { offset: 0.7, opacity: 1, scale: 1.08, filter: "brightness(1.1)" },
            { opacity: 1, scale: 1, filter: "none" },
          ],
          { duration: 270, delay: distance * 32, easing: "ease-out" },
        );
      });
      audio.play("burst", 2);
    }
    $("effects").replaceChildren(fragment);
    effectsRemaining = reduced ? 850 : 1050;
  }
  function undo() {
    if (
      !undoState ||
      practice ||
      stageLock > 0 ||
      !["playing", "over"].includes(phase)
    )
      return;
    closeModal();
    resetStreak();
    state = structuredClone(undoState);
    undoState = null;
    animation = null;
    hovered = null;
    phase = "playing";
    $("effects").replaceChildren();
    audio.play("tap");
    keep();
    render();
  }
  function toMenu() {
    resetStreak();
    stageLock = 0;
    $("board")
      .getAnimations()
      .forEach((a) => a.cancel());
    if (phase === "animating") {
      animation = null;
    }
    if (!practice && phase !== "menu") keep();
    closeModal();
    practice = false;
    state = data.session
      ? structuredClone(data.session)
      : FusionEngine.create(65432);
    undoState = data.undo ? structuredClone(data.undo) : null;
    phase = "menu";
    hovered = null;
    $("effects").replaceChildren();
    render();
  }
  function closeModal() {
    modalKind = null;
    if ($("modal").open) $("modal").close();
    previousFocus?.focus?.({ preventScroll: true });
    previousFocus = null;
  }
  function resume() {
    const previous = returnPhase;
    closeModal();
    phase = previous || "playing";
    returnPhase = null;
    render();
    if (animation) restoreAnimationFrame();
  }
  function restoreAnimationFrame() {
    // Resume a interrupted visual stage without repeating a model mutation.
    if (animation.stage === "absorb") {
      animation.stage = "place";
      animation.index--;
      animation.elapsed = 1000;
    }
  }
  function pause(kind = "pause") {
    if (phase === "over" && kind !== "restart" && kind !== "help") return;
    if (modalKind) return;
    returnPhase = phase;
    if (["playing", "animating"].includes(phase)) {
      phase = "paused";
      if (!practice) keep();
    }
    render();
    openModal(kind);
  }
  function modalButton(key, action, primary = false) {
    const b = document.createElement("button");
    b.textContent = t(key);
    if (primary) b.className = "primary";
    b.onclick = action;
    $("modal-actions").append(b);
  }
  function paragraph(key) {
    const p = document.createElement("p");
    p.textContent = t(key);
    $("modal-content").append(p);
  }
  function openModal(kind, open = true) {
    if (open) previousFocus = document.activeElement;
    modalKind = kind;
    $("modal-content").replaceChildren();
    $("modal-actions").replaceChildren();
    $("modal-kicker").textContent =
      kind === "result" && newBest ? t("newBest") : "";
    $("modal-title").textContent = t(
      {
        help: "help",
        pause: "paused",
        restart: "restartTitle",
        result: "end",
        practiceDone: "ready",
      }[kind],
    );
    if (kind === "help") {
      const demo = document.createElement("div");
      demo.className = "rule-demo";
      [1, 1, 1].forEach((v) => demo.append(core(v)));
      const arrow = document.createElement("span");
      arrow.textContent = "→";
      demo.append(arrow, core(2));
      $("modal-content").append(demo);
      ["help1", "help2", "help3", "scoring", "keys"].forEach(paragraph);
      modalButton("try", () => begin(true), true);
      modalButton("close", resume);
    }
    if (kind === "pause") {
      modalButton("continue", resume, true);
      modalButton("menu", toMenu);
    }
    if (kind === "restart") {
      paragraph("restartCopy");
      modalButton("restart", () => begin(), true);
      modalButton("cancel", resume);
    }
    if (kind === "practiceDone") {
      paragraph("practiceDone");
      modalButton(
        data.session ? "continue" : "play",
        () => begin(false, !!data.session),
        true,
      );
      modalButton("menu", toMenu);
    }
    if (kind === "result") {
      const score = document.createElement("div");
      score.className = "result-score";
      score.textContent = state.score.toLocaleString(settings.language);
      $("modal-content").append(score);
      for (const [key, value] of [
        ["best", data.best],
        ["peak", FusionEngine.number(state.peak)],
        ["moves", state.moves],
      ]) {
        const row = document.createElement("div");
        row.className = "result-row";
        const label = document.createElement("span"),
          b = document.createElement("b");
        label.textContent = t(key);
        b.textContent = value;
        row.append(label, b);
        $("modal-content").append(row);
      }
      if (undoState) modalButton("undo", undo, true);
      modalButton("restart", () => begin(), !undoState);
      modalButton("menu", toMenu);
    }
    if (open && !$("modal").open) $("modal").showModal();
  }
  $("tutorial-play").onclick = () => begin(false, !!data.session);
  $("play").onclick = play;
  $("new-game").onclick = () => (data.session ? pause("restart") : play());
  $("learn").onclick = () => begin(true);
  $("menu").onclick = toMenu;
  $("pause").onclick = () => pause();
  $("help").onclick = () => pause("help");
  $("restart").onclick = () => pause("restart");
  $("undo").onclick = undo;
  $("theme").onclick = () => {
    settings.theme = settings.theme === "dark" ? "light" : "dark";
    settings.themeRevision = 2;
    applyText();
    save();
  };
  $("sound").onclick = () => {
    settings.muted = !settings.muted;
    audio.mute();
    applyText();
    save();
  };
  $("board").addEventListener("pointermove", (e) => {
    if (phase !== "playing" || stageLock > 0 || e.pointerType === "touch")
      return;
    const id = e.target.closest("[data-cell]")?.dataset.cell;
    const next = id === undefined ? null : Number(id);
    if (next === hovered) return;
    hovered = next;
    renderBoard(state.board);
  });
  $("board").addEventListener("pointerleave", () => {
    if (phase === "playing") {
      hovered = null;
      renderBoard(state.board);
      message(practice ? "practiceCopy" : "select");
    }
  });
  $("board").addEventListener("keydown", (e) => {
    if (phase !== "playing" || stageLock > 0) return;
    const vectors = {
      ArrowLeft: [-1, 0],
      ArrowRight: [1, 0],
      ArrowUp: [0, -1],
      ArrowDown: [0, 1],
    };
    if (!vectors[e.key]) return;
    e.preventDefault();
    const v = vectors[e.key],
      from = FusionEngine.geometry(state).cells[focusId];
    const candidates = FusionEngine.geometry(state)
      .neighbors[focusId].map((id) => {
        const c = FusionEngine.geometry(state).cells[id];
        return { id, dot: (c.x - from.x) * v[0] + (c.y - from.y) * v[1] };
      })
      .filter((c) => c.dot > 0)
      .sort((a, b) => b.dot - a.dot);
    if (candidates.length) {
      focusId = candidates[0].id;
      hovered = focusId;
      renderBoard(state.board);
      $("board").children[focusId].focus({ preventScroll: true });
    }
  });
  document.addEventListener("keydown", (e) => {
    if (
      modalKind ||
      phase !== "playing" ||
      !$("language-panel").hidden ||
      e.ctrlKey ||
      e.metaKey ||
      e.altKey
    )
      return;
    if (e.key.toLowerCase() === "u") {
      e.preventDefault();
      undo();
    } else if (e.key === "Escape") {
      e.preventDefault();
      pause();
    }
  });
  $("modal").addEventListener("cancel", (e) => {
    e.preventDefault();
    if (["result", "practiceDone"].includes(modalKind)) toMenu();
    else resume();
  });
  document.addEventListener("visibilitychange", () => {
    if (document.hidden && ["playing", "animating"].includes(phase)) pause();
    lastTime = performance.now();
  });
  window.addEventListener("pagehide", () => {
    if (!practice && phase !== "menu") keep();
  });
  const menuDemo = createFusionDemo(document.querySelector(".hero-board"));
  function frame(now) {
    const dt = Math.min(100, now - lastTime);
    lastTime = now;
    menuDemo.tick(dt, phase === "menu" && !document.hidden);
    // Count only decision time; merge animations, pause and hidden tabs do not spend the streak window.
    if (
      phase === "playing" &&
      !document.hidden &&
      stageLock === 0 &&
      streakRemaining > 0
    ) {
      streakRemaining = Math.max(0, streakRemaining - dt);
      if (streakRemaining === 0) resetStreak();
      else updateStreak();
    }
    if (!document.hidden && phase !== "paused") {
      stageLock = Math.max(0, stageLock - dt);
      const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
      scoreVisual = reduced
        ? scoreTarget
        : scoreVisual + (scoreTarget - scoreVisual) * (1 - Math.exp(-dt / 75));
      if (Math.abs(scoreVisual - scoreTarget) < 0.5) scoreVisual = scoreTarget;
      const progress = FusionEngine.progress(state, scoreVisual);
      $("progress-fill").style.transform = `scaleX(${progress.ratio})`;
      $("score-progress").setAttribute("aria-valuemin", progress.start);
      $("score-progress").setAttribute("aria-valuemax", progress.end);
      $("score-progress").setAttribute(
        "aria-valuenow",
        Math.max(
          progress.start,
          Math.min(progress.end, Math.round(scoreVisual)),
        ),
      );
      $("progress-caption").textContent =
        Math.round(Math.max(0, scoreVisual - progress.start)).toLocaleString(
          settings.language,
        ) +
        " / " +
        (progress.end - progress.start).toLocaleString(settings.language);
      $("score").textContent = Math.round(scoreVisual).toLocaleString(
        settings.language,
      );
    }
    if (!document.hidden && phase !== "paused" && effectsRemaining > 0) {
      effectsRemaining -= dt;
      if (effectsRemaining <= 0) $("effects").replaceChildren();
    }
    if (phase === "animating" && animation && !document.hidden) {
      animation.elapsed += dt;
      const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
      const duration = reduced
        ? 90
        : animation.stage === "absorb"
          ? 300
          : animation.stage === "auto-tile"
            ? 520
            : animation.stage === "settle"
              ? 180
              : animation.stage === "evolve"
                ? 240
                : 160;
      if (animation.elapsed >= duration) animateStep();
    }
    requestAnimationFrame(frame);
  }
  applyText();
  requestAnimationFrame(frame);
})();

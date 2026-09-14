"use strict";
(() => {
  const $ = (id) => document.getElementById(id);
  const data = SortStore.data;
  const t = (key) =>
    SortText[key]?.[SortText.languages.indexOf(data.language)] ?? key;
  const reduced = () => matchMedia("(prefers-reduced-motion:reduce)").matches;
  const sound = createSortAudio(data);
  let screen = "menu",
    level,
    tubes = [],
    history = [],
    score = 0,
    historyScores = [],
    moves = 0,
    hints = 0;
  let selected = -1,
    suggested = -1,
    busy = false,
    finishing = false,
    learning = false,
    page = 0,
    lesson = 0;
  let queued = [],
    rewardFrame = 0,
    resultScore = 0,
    starCount = 0;
  const view = new TubeView($("tubes"), tap, tubeLabel);
  const picker = createLanguagePicker((language) => {
    data.language = language;
    SortStore.save();
    labels();
    if (screen === "map") renderLevels();
    if (screen === "game" && !busy) render();
  });
  function tubeLabel(tube, index) {
    return `${t("tube")} ${index + 1}: ${tube.length ? tube.map((color) => t("colors")[color]).join(", ") : t("empty")}`;
  }
  function points() {
    return score;
  }
  function persist() {
    if (learning || !level || finishing) return;
    data.session = {
      level: level.number,
      tubes: ColorSort.clone(tubes),
      moves,
      hints,
      score,
      historyScores: [...historyScores],
      history: history.map(ColorSort.clone),
    };
    SortStore.save();
  }
  function show(next) {
    if (screen === "menu") demo.cancelTransfer?.();
    $("lesson-hand").hidden = true;
    cancelAnimationFrame(rewardFrame);
    screen = next;
    ["menu", "map", "game", "result"].forEach((id) => {
      $(id).hidden = id !== next;
    });
    if (next === "menu") labels();
  }
  function labels() {
    document.documentElement.lang = data.language;
    document.documentElement.dir = data.language === "ar" ? "rtl" : "ltr";
    document.documentElement.dataset.theme = data.theme;
    document.title = t("title");
    document.querySelector('meta[name="theme-color"]').content =
      data.theme === "dark" ? "#132329" : "#fff7e8";
    document.querySelectorAll("[data-t]").forEach((el) => {
      el.textContent = t(el.dataset.t);
    });
    document
      .querySelectorAll("[data-label]")
      .forEach((el) => el.setAttribute("aria-label", t(el.dataset.label)));
    const words = t("title").split(" "),
      middle = Math.ceil(words.length / 2);
    $("hero-title").replaceChildren();
    [words.slice(0, middle).join(" "), words.slice(middle).join(" ")].forEach(
      (word) => {
        const span = document.createElement("span");
        span.textContent = word;
        $("hero-title").append(span, " ");
      },
    );
    $("theme").innerHTML =
      data.theme === "dark"
        ? '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l2 2m10 10 2 2M5 19l2-2M17 7l2-2"/></svg>'
        : '<svg viewBox="0 0 24 24"><path d="M20 15a8 8 0 0 1-11-11 8 8 0 1 0 11 11Z"/></svg>';
    $("theme").setAttribute(
      "aria-label",
      t(data.theme === "dark" ? "light" : "dark"),
    );
    $("sound").setAttribute("aria-pressed", String(!data.muted));
    $("play").querySelector("span").textContent = t(
      data.session ? "continue" : "play",
    );
    $("total").textContent = Object.values(data.records)
      .reduce((sum, record) => sum + record.score, 0)
      .toLocaleString(data.language);
    $("completed-count").textContent = Object.keys(data.records).length;
    picker.update(data.language);
    if (level) hud();
    if (screen === "result") resultLabels();
  }
  function hud() {
    $("level-title").textContent = learning
      ? t("try")
      : `${t("level")} ${level.number}`;
    $("lesson-step").textContent = learning
      ? `${Math.min(lesson + 1, 2)} / 2`
      : "";
    $("score").textContent = points().toLocaleString(data.language);
    $("moves").textContent = moves.toLocaleString(data.language);
    $("undo").disabled = busy || !history.length;
    $("hint").disabled = busy;
    $("restart").disabled = busy;
    $("back").disabled = busy;
    $("home").disabled = busy;
  }
  function render() {
    view.draw(tubes);
    view.select(selected, suggested);
    hud();
    message();
  }
  function message() {
    $("status").textContent = learning
      ? t(selected < 0 ? (lesson ? "lesson3" : "lesson1") : "lesson2")
      : "";
    placeHand();
  }
  function placeHand() {
    const hand = $("lesson-hand");
    const target =
      learning && !busy && screen === "game"
        ? $("tubes").children[suggested]
        : null;
    hand.hidden = !target;
    if (!target) return;
    const rect = target.getBoundingClientRect();
    hand.style.left = `${rect.left + rect.width * 0.52}px`;
    hand.style.top = `${rect.top + rect.height * 0.46}px`;
  }
  window.addEventListener("resize", placeHand);
  function start(number = data.next, learn = false, fresh = false) {
    if (busy) return;
    learning = learn;
    lesson = 0;
    level = learn ? ColorSort.tutorial() : ColorSort.level(number);
    const saved =
      !learn && !fresh && data.session?.level === number ? data.session : null;
    tubes = ColorSort.clone(saved?.tubes || level.tubes);
    history = saved ? saved.history.map(ColorSort.clone) : [];
    score = saved?.score ?? tubes.filter(ColorSort.complete).length * 250;
    historyScores = saved ? [...saved.historyScores] : [];
    moves = saved?.moves || 0;
    hints = saved?.hints || 0;
    selected = -1;
    suggested = learn ? 0 : -1;
    queued = [];
    $("game").classList.toggle("lesson", learn);
    show("game");
    render();
    persist();
    if (ColorSort.solved(tubes)) finish();
  }
  async function tap(index) {
    if (screen !== "game" || $("dialog").open || finishing) return;
    if (busy) {
      if (queued.length < 4) queued.push(index);
      return;
    }
    if (learning) {
      const expected = selected < 0 ? 0 : lesson === 0 ? 1 : 2;
      if (index !== expected) {
        view.reject(index);
        return;
      }
    }
    if (selected === index) {
      selected = -1;
      suggested = learning ? 0 : -1;
      view.select(selected, suggested);
      message();
      return;
    }
    if (selected < 0) {
      if (!tubes[index].length || ColorSort.complete(tubes[index])) return;
      selected = index;
      suggested = learning ? (lesson ? 2 : 1) : -1;
      view.select(selected, suggested);
      sound("select");
      message();
      return;
    }
    const move = ColorSort.pour(tubes, selected, index);
    if (!move) {
      view.reject(index);
      sound("blocked");
      $("status").textContent = "";
      if (tubes[index].length && !ColorSort.complete(tubes[index])) {
        selected = index;
        suggested = -1;
        view.select(selected);
      }
      return;
    }
    const before = ColorSort.clone(tubes),
      priorScore = points();
    history.push(before);
    historyScores.push(score);
    if (history.length > 80) {
      history.shift();
      historyScores.shift();
    }
    tubes = move.tubes;
    score += move.count * 25 + (ColorSort.complete(tubes[index]) ? 250 : 0);
    moves++;
    selected = -1;
    suggested = -1;
    busy = true;
    $("lesson-hand").hidden = true;
    view.select(-1);
    hud();
    persist();
    sound("pour", move.count);
    try {
      await view.transfer(before, move, reduced());
    } finally {
      busy = false;
    }
    if (learning) {
      lesson++;
      suggested = lesson < 2 ? 0 : -1;
    }
    hud();
    view.select(selected, suggested);
    message();
    if (ColorSort.complete(tubes[index])) {
      sound("complete");
      view.celebrate(index, reduced());
    }
    const gain = points() - priorScore;
    if (gain > 0) {
      $("gain").textContent = `+${gain}`;
      $("gain")
        .getAnimations()
        .forEach((animation) => animation.cancel());
      $("gain").animate(
        [
          { opacity: 1, transform: "translateY(4px) scale(.85)" },
          { opacity: 1, transform: "translateY(-8px) scale(1)", offset: 0.35 },
          { opacity: 0, transform: "translateY(-28px) scale(1)" },
        ],
        { duration: reduced() ? 1 : 1000 },
      );
      if (!reduced())
        $("score").animate(
          [
            { transform: "scale(1)" },
            { transform: "scale(1.16)" },
            { transform: "scale(1)" },
          ],
          { duration: 350 },
        );
    }
    if (ColorSort.solved(tubes)) {
      queued = [];
      finish();
      return;
    }
    $("undo").classList.toggle("needed", !ColorSort.moves(tubes).length);
    while (queued.length && !busy) tap(queued.shift());
  }
  function undo() {
    if (busy || !history.length) return;
    tubes = history.pop();
    score =
      historyScores.pop() ?? tubes.filter(ColorSort.complete).length * 250;
    moves++;
    selected = -1;
    suggested = -1;
    render();
    persist();
    sound("select");
  }
  function hint() {
    if (busy || learning) return;
    let route;
    if (JSON.stringify(tubes) === JSON.stringify(level.tubes))
      route = level.solution;
    else route = ColorSort.solve(tubes, 12000);
    if (!route?.length) {
      $("undo").classList.add("needed");
      return;
    }
    selected = route[0][0];
    suggested = route[0][1];
    hints++;
    view.select(selected, suggested);
    message();
    persist();
  }
  function resultLabels() {
    $("result-level").textContent = learning
      ? t("how")
      : `${t("level")} ${level.number}`;
    $("result-title").textContent = t(learning ? "ready" : "completed");
    $("final-score").textContent = resultScore.toLocaleString(data.language);
    $("result-moves").textContent = `${moves} ${t("moves")}`;
    $("next-level").textContent = t(learning ? "play" : "next");
  }
  async function finish() {
    if (finishing) return;
    finishing = true;
    busy = true;
    queued = [];
    $("lesson-hand").hidden = true;
    hud();
    resultScore = points() + Math.max(200, 1000 - moves * 10 - hints * 70);
    starCount =
      hints === 0 && moves <= level.solution.length + 3
        ? 3
        : hints <= 2 && moves <= level.solution.length * 2 + 4
          ? 2
          : 1;
    if (learning) data.learned = true;
    else {
      const old = data.records[level.number];
      data.records[level.number] = {
        score: Math.max(old?.score || 0, resultScore),
        stars: Math.max(old?.stars || 0, starCount),
      };
      data.next = Math.max(data.next, Math.min(10000, level.number + 1));
      data.session = null;
    }
    SortStore.save();
    sound("win");
    await view.victory(reduced(), sound);
    finishing = false;
    busy = false;
    hud();
    show("result");
    resultLabels();
    $("stars").innerHTML = [0, 1, 2]
      .map((i) => `<span class="${i < starCount ? "" : "empty"}">★</span>`)
      .join("");
    $("stars").setAttribute("aria-label", `${starCount}/3`);
    if (reduced()) return;
    $("stars")
      .querySelectorAll("span")
      .forEach((star, i) =>
        star.animate(
          [
            { transform: "scale(0) rotate(-35deg)" },
            { transform: "scale(1.3) rotate(8deg)", offset: 0.65 },
            { transform: "scale(1)" },
          ],
          { duration: 650, delay: i * 180, fill: "backwards" },
        ),
      );
    $("result")
      .querySelector(".result-art")
      .animate(
        [
          { opacity: 0, translate: "0 20px" },
          { opacity: 1, translate: "0 0" },
        ],
        { duration: 500 },
      );
    const began = performance.now();
    const tick = (now) => {
      const progress = Math.min(1, (now - began) / 1100);
      $("final-score").textContent = Math.round(
        resultScore * (1 - (1 - progress) ** 3),
      ).toLocaleString(data.language);
      if (progress < 1) rewardFrame = requestAnimationFrame(tick);
    };
    rewardFrame = requestAnimationFrame(tick);
  }
  function renderLevels() {
    $("level-list").replaceChildren();
    $("range").textContent = `${page * 6 + 1} — ${page * 6 + 6}`;
    $("page-number").textContent = page + 1;
    $("previous").disabled = page === 0;
    $("next-page").disabled = (page + 1) * 6 >= 10000;
    for (let i = 1; i <= 6; i++) {
      const number = page * 6 + i,
        record = data.records[number],
        locked = number > data.next;
      const button = document.createElement("button");
      button.className = "level";
      button.disabled = locked;
      button.setAttribute(
        "aria-label",
        `${t("level")} ${number}${locked ? ` · ${t("locked")}` : ""}`,
      );
      if (number === data.next) button.setAttribute("aria-current", "step");
      button.style.setProperty(
        "--level-color",
        SortPalette[(number - 1) % SortPalette.length],
      );
      const art = locked
        ? '<path class="locked-glass" d="M21 17h42v60a21 21 0 0 1-42 0Z"/>'
        : `<path d="M21 17h42v60a21 21 0 0 1-42 0Z" fill="${SortPalette[(number - 1) % SortPalette.length]}"/><path d="M28 29v42" stroke="#fff" stroke-width="4" opacity=".55" stroke-linecap="round"/><path d="M22 54q20-10 40 0v23a20 20 0 0 1-40 0Z" fill="${SortPalette[number % SortPalette.length]}"/><path d="M18 17h48" stroke="currentColor" stroke-width="4" stroke-linecap="round"/>`;
      button.innerHTML = `<svg class="level-bottle" viewBox="0 0 84 110" aria-hidden="true">${art}</svg><strong>${String(number).padStart(2, "0")}</strong><span class="rating">${record ? "★".repeat(record.stars) : ""}</span>`;
      button.onclick = () => start(number);
      $("level-list").append(button);
    }
  }
  function map() {
    if (busy) return;
    page = Math.floor((data.next - 1) / 6);
    show("map");
    renderLevels();
  }
  function dialog(kind) {
    if (busy) return;
    $("dialog-title").textContent = t(kind === "help" ? "how" : "restart");
    $("dialog-body").replaceChildren();
    $("dialog-actions").replaceChildren();
    for (const key of kind === "help"
      ? ["rule1", "rule2", "rule3"]
      : ["confirm"]) {
      const p = document.createElement("p");
      p.textContent = t(key);
      $("dialog-body").append(p);
    }
    const action = document.createElement("button");
    action.className = "primary";
    action.textContent = t(kind === "help" ? "try" : "restart");
    action.onclick = () => {
      $("dialog").close();
      kind === "help" ? start(0, true) : start(level.number, false, true);
    };
    const cancel = document.createElement("button");
    cancel.textContent = t("cancel");
    cancel.onclick = () => $("dialog").close();
    $("dialog-actions").append(action, cancel);
    $("dialog").showModal();
  }
  $("play").onclick = () =>
    data.learned || data.session
      ? start(data.session?.level ?? data.next)
      : dialog("help");
  $("home").onclick =
    $("back").onclick =
    $("map-home").onclick =
      () => {
        if (!busy) show("menu");
      };
  $("levels").onclick = $("result-map").onclick = map;
  $("learn").onclick = $("help").onclick = () => dialog("help");
  $("restart").onclick = () => dialog("restart");
  $("undo").onclick = undo;
  $("hint").onclick = hint;
  $("next-level").onclick = () =>
    learning
      ? start(data.session?.level ?? data.next)
      : start(Math.min(10000, level.number + 1), false, true);
  const pager = createLevelPager($("level-list"), (direction) => {
    const next = Math.max(
      0,
      Math.min(Math.ceil(10000 / 6) - 1, page + direction),
    );
    if (next === page) return false;
    page = next;
    renderLevels();
    return true;
  });
  $("previous").onclick = () => pager.go(-1);
  $("next-page").onclick = () => pager.go(1);
  $("theme").onclick = () => {
    data.theme = data.theme === "dark" ? "light" : "dark";
    SortStore.save();
    labels();
  };
  $("sound").onclick = () => {
    data.muted = !data.muted;
    SortStore.save();
    labels();
    sound("select");
  };
  window.addEventListener("pagehide", () => {
    if (screen === "game") persist();
  });
  // Menü, aynı tüp çizimini kısa bir döngüyle gösterir.
  const demo = new TubeView(
    $("demo"),
    () => {},
    () => "",
  );
  const demoStates = [
    [
      [0, 0, 2, 2],
      [3, 3, 3],
      [2, 2],
      [1, 1, 1, 1],
    ],
    [
      [0, 0],
      [3, 3, 3],
      [2, 2, 2, 2],
      [1, 1, 1, 1],
    ],
  ];
  let demoStep = 0,
    demoBusy = false;
  function paintDemo() {
    demo.draw(demoStates[demoStep]);
    $("demo")
      .querySelectorAll("button")
      .forEach((button) => {
        button.tabIndex = -1;
        button.disabled = true;
      });
  }
  paintDemo();
  setInterval(async () => {
    if (screen !== "menu" || document.hidden || reduced() || demoBusy) return;
    demoBusy = true;
    if (!demoStep) {
      const move = ColorSort.pour(demoStates[0], 0, 2);
      await demo.transfer(demoStates[0], move, false);
      demoStep = 1;
      paintDemo();
    } else {
      await $("demo").animate([{ opacity: 1 }, { opacity: 0 }], {
        duration: 400,
        fill: "forwards",
      }).finished;
      demoStep = 0;
      paintDemo();
      $("demo").animate([{ opacity: 0 }, { opacity: 1 }], {
        duration: 500,
        fill: "forwards",
      });
    }
    demoBusy = false;
  }, 3600);
  labels();
})();

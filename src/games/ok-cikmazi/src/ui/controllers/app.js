"use strict";
(() => {
  const $ = (id) => document.getElementById(id),
    data = ArrowStore.data;
  const t = (key) =>
    ArrowText[key]?.[ArrowText.languages.indexOf(data.language)] ?? key;
  const reduced = () => matchMedia("(prefers-reduced-motion:reduce)").matches;
  const sound = createArrowAudio(data);
  const rewards = createArrowRewards($("result"), () => data.language, sound);
  let screen = "menu",
    board,
    remaining = [],
    lives = 3,
    score = 0,
    hints = 0,
    elapsed = 0,
    started = 0,
    busy = 0,
    learning = false,
    streak = 0,
    page = 0,
    hinted = -1,
    complete = false;
  const view = new ArrowBoard($("board"), tap, () => t("arrow"));
  const picker = createLanguagePicker((language) => {
    data.language = language;
    ArrowStore.save();
    labels();
    if (screen === "map") renderLevels();
    if (screen === "game") {
      render();
      if (learning) {
        hinted = -1;
        guide(false);
      }
    }
  });
  const clock = (ms) =>
    `${Math.floor(ms / 60000)
      .toString()
      .padStart(2, "0")}:${Math.floor((ms / 1000) % 60)
      .toString()
      .padStart(2, "0")}`;
  const milliseconds = () =>
    elapsed + (started ? performance.now() - started : 0);
  function pauseClock() {
    if (started) {
      elapsed += performance.now() - started;
      started = 0;
    }
  }
  function persist() {
    if (!learning && board && remaining.length && lives > 0) {
      data.session = {
        level: board.level,
        remaining: [...remaining],
        lives,
        score,
        hints,
        elapsed: milliseconds(),
      };
      ArrowStore.save();
    }
  }
  function show(next) {
    if (screen === "result") rewards.stop();
    if (screen === "game") {
      pauseClock();
      persist();
    }
    screen = next;
    for (const id of ["menu", "map", "game", "result"])
      $(id).hidden = id !== next;
    if (next === "game" && !document.hidden && !$("dialog").open)
      started = performance.now();
    if (next === "menu") labels();
  }
  function labels() {
    document.documentElement.lang = data.language;
    document.documentElement.dir = data.language === "ar" ? "rtl" : "ltr";
    document.documentElement.dataset.theme = data.theme;
    document.title = t("title");
    document.querySelector('meta[name="theme-color"]').content =
      data.theme === "dark" ? "#171819" : "#f7f5ef";
    document
      .querySelectorAll("[data-t]")
      .forEach((el) => (el.textContent = t(el.dataset.t)));
    document
      .querySelectorAll("[data-label]")
      .forEach((el) => el.setAttribute("aria-label", t(el.dataset.label)));
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
      .reduce((sum, r) => sum + r.score, 0)
      .toLocaleString(data.language);
    picker.update(data.language);
    if (board) hud();
    if (screen === "result") resultLabels();
  }
  function start(level = data.next, learn = false, fresh = false) {
    if (busy) return;
    learning = learn;
    $("game").classList.toggle("tutorial-mode", learn);
    $("tutorial-progress").hidden = !learn;
    board = learn ? ArrowPuzzle.tutorial() : ArrowPuzzle.generate(level);
    const s =
      !learn && !fresh && data.session?.level === level ? data.session : null;
    remaining = s ? [...s.remaining] : board.paths.map((_, i) => i);
    lives = s?.lives ?? 3;
    score = s?.score ?? 0;
    hints = s?.hints ?? 0;
    elapsed = s?.elapsed ?? 0;
    started = 0;
    streak = 0;
    hinted = -1;
    complete = false;
    show("game");
    render();
    persist();
    if (learning) guide(false);
  }
  function levelLabel(level) {
    const kind = ArrowPuzzle.pacing(level).kind;
    return kind === "standard" ? "" : t(kind);
  }
  function hud() {
    $("level-kind").textContent = learning ? t("how") : levelLabel(board.level);
    $("level-title").textContent = learning
      ? t("try")
      : `${t("level")} ${board.level}`;
    $("score").textContent = score.toLocaleString(data.language);
    $("lives").innerHTML = [0, 1, 2]
      .map(
        (i) =>
          `<svg class="${i < lives ? "" : "empty"}" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21 3 12C-4 4 7-2 12 5c5-7 16-1 9 7Z"/></svg>`,
      )
      .join("");
    $("lives").setAttribute("aria-label", `${t("lives")}: ${lives}/3`);
    if (learning) {
      const done = board.paths.length - remaining.length;
      $("tutorial-count").textContent =
        `${Math.min(done + 1, board.paths.length)} / ${board.paths.length}`;
      $("tutorial-steps").innerHTML = board.paths
        .map(
          (_, index) =>
            `<i class="${index < done ? "done" : index === done ? "active" : ""}"></i>`,
        )
        .join("");
    }
    $("hint").disabled = learning || busy;
    $("reset").disabled = learning || busy;
  }
  function render() {
    view.draw(board, remaining);
    hud();
    $("status").textContent = "";
    placeFinger();
  }
  function placeFinger() {
    const item = view.groups.get(hinted);
    $("finger").hidden = !item;
    if (!item) return;
    const [x, y] = item.points.at(-1),
      rect = $("board").getBoundingClientRect();
    $("finger").style.left = (x / view.extent) * rect.width + "px";
    $("finger").style.top = (y / view.extent) * rect.height + "px";
  }
  function guide(charge = true) {
    if (busy || !remaining.length) return;
    if (hinted >= 0 && remaining.includes(hinted)) return;
    hinted = ArrowPuzzle.available(board, remaining)[0];
    if (charge) hints++;
    view.hint(hinted);
    placeFinger();
    $("status").textContent = learning
      ? t(`lesson${board.paths.length - remaining.length + 1}`)
      : t("tagline");
    persist();
  }
  async function tap(id) {
    if (screen !== "game" || $("dialog").open || !remaining.includes(id))
      return;
    if (learning && id !== hinted) {
      view.reject(id, id);
      return;
    }
    const blocked = ArrowPuzzle.blocker(board, remaining, id);
    if (blocked !== null) {
      lives--;
      streak = 0;
      view.reject(id, blocked);
      sound("blocked");
      $("status").textContent = t("blocked");
      hud();
      persist();
      if (!lives) {
        pauseClock();
        data.session = null;
        ArrowStore.save();
        finish(false);
      }
      return;
    }
    busy++;
    streak++;
    const points = 100 + Math.min(streak - 1, 5) * 20;
    score += points;
    remaining = remaining.filter((key) => key !== id);
    hinted = -1;
    $("finger").hidden = true;
    view.hint(-1);
    hud();
    persist();
    sound("exit", streak);
    $("status").textContent = streak > 1 ? `${streak} ${t("chain")}` : "";
    $("gain").textContent = `+${points}`;
    $("gain")
      .getAnimations()
      .forEach((a) => a.cancel());
    $("gain").animate(
      [
        { opacity: 0, transform: "translateY(6px)" },
        { opacity: 1, offset: 0.2 },
        { opacity: 0, transform: "translateY(-24px)" },
      ],
      { duration: reduced() ? 1 : 750, fill: "forwards" },
    );
    const keyboardFocus = view.groups
      .get(id)
      ?.group.contains(document.activeElement);
    await view.exit(id, reduced());
    busy--;
    hud();
    if (screen !== "game") return;
    if (!remaining.length && !busy) finish(true);
    else if (learning) guide(false);
    if (keyboardFocus && remaining.length)
      view.groups
        .get(ArrowPuzzle.available(board, remaining)[0])
        ?.group.focus();
  }
  function resultLabels() {
    $("result-title").textContent = t(
      complete ? (learning ? "learned" : "done") : "lost",
    );
    $("result-level").textContent = learning
      ? t("how")
      : `${t("level")} ${board.level}`;
    $("final-score").textContent = score.toLocaleString(data.language);
    $("next-level").textContent = t(
      complete ? (learning ? "play" : "next") : "reset",
    );
  }
  function finish(won) {
    pauseClock();
    complete = won;
    const stars =
      lives === 3 && hints === 0 ? 3 : lives >= 2 && hints <= 1 ? 2 : 1;
    if (won) {
      sound("win");
      if (learning) data.learned = true;
      else {
        const old = data.records[board.level];
        data.records[board.level] = {
          score: Math.max(old?.score || 0, score),
          stars: Math.max(old?.stars || 0, stars),
        };
        data.next = Math.max(data.next, Math.min(10000, board.level + 1));
        data.session = null;
      }
      ArrowStore.save();
    }
    resultLabels();
    $("final-time").textContent = clock(milliseconds());
    $("stars").innerHTML = won
      ? [0, 1, 2]
          .map((i) => `<span class="${i < stars ? "" : "empty"}">★</span>`)
          .join("")
      : "";
    $("stars").setAttribute("aria-label", won ? `${stars}/3` : "");
    show("result");
    if (won) rewards.play(score, stars);
  }
  function renderLevels() {
    $("level-list").replaceChildren();
    $("range").textContent = `${page * 12 + 1} — ${page * 12 + 12}`;
    $("page-number").textContent = page + 1;
    for (let i = 1; i <= 12; i++) {
      const level = page * 12 + i,
        record = data.records[level],
        locked = level > data.next,
        button = document.createElement("button");
      button.className = "level-card" + (level === data.next ? " current" : "");
      button.disabled = locked;
      if (level === data.next) button.setAttribute("aria-current", "step");
      button.setAttribute(
        "aria-label",
        `${t("level")} ${level}${locked ? " · " + t("locked") : ""}`,
      );
      button.innerHTML = `<strong>${String(level).padStart(2, "0")}</strong><span class="level-stars" aria-label="${record ? `${record.stars}/3` : ""}">${record ? "★".repeat(record.stars) : ""}</span><small>${t("level")}</small>`;
      if (!locked) {
        const preview = ArrowBoard.node("svg", {
          class: "level-preview",
          viewBox: "0 0 100 100",
          "aria-hidden": "true",
        });
        const sample = ArrowPuzzle.generate(level);
        preview.setAttribute(
          "viewBox",
          `-1 -1 ${sample.n + 1} ${sample.n + 1}`,
        );
        for (const path of sample.paths) {
          const points = path.map((cell) => ArrowPuzzle.point(cell, sample.n));
          preview.append(
            ArrowBoard.node("path", {
              d: points
                .map((point, index) => `${index ? "L" : "M"}${point}`)
                .join(" "),
            }),
          );
        }
        button.prepend(preview);
      }
      button.onclick = () => start(level);
      $("level-list").append(button);
    }
    $("prev").disabled = page === 0;
    $("next-page").disabled = (page + 1) * 12 >= 10000;
  }
  function map() {
    if (busy) return;
    show("map");
    page = Math.floor((data.next - 1) / 12);
    renderLevels();
  }
  function close() {
    $("dialog").close();
    if (screen === "game" && !document.hidden) started = performance.now();
  }
  function dialog(kind) {
    if (busy) return;
    pauseClock();
    persist();
    $("dialog-title").textContent = t(kind === "help" ? "how" : "reset");
    $("dialog-body").replaceChildren();
    for (const key of kind === "help"
      ? ["rule1", "rule2", "rule3"]
      : ["confirm"]) {
      const p = document.createElement("p");
      p.textContent = t(key);
      $("dialog-body").append(p);
    }
    $("dialog-actions").replaceChildren();
    const add = (key, action, primary) => {
      const button = document.createElement("button");
      button.textContent = t(key);
      if (primary) button.className = "primary";
      button.onclick = () => {
        close();
        action();
      };
      $("dialog-actions").append(button);
    };
    add(
      kind === "help" ? "try" : "reset",
      () =>
        kind === "help" ? start(0, true) : start(board.level, false, true),
      true,
    );
    add("cancel", () => {}, false);
    $("dialog").showModal();
  }
  $("dialog").addEventListener("cancel", (event) => {
    event.preventDefault();
    close();
  });
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
  $("hint").onclick = () => guide();
  $("reset").onclick = () => dialog("reset");
  $("next-level").onclick = () =>
    start(
      learning
        ? data.next
        : complete
          ? Math.min(10000, board.level + 1)
          : board.level,
      false,
      true,
    );
  $("prev").onclick = () => {
    page--;
    renderLevels();
  };
  $("next-page").onclick = () => {
    page++;
    renderLevels();
  };
  $("theme").onclick = () => {
    data.theme = data.theme === "dark" ? "light" : "dark";
    ArrowStore.save();
    labels();
  };
  $("sound").onclick = () => {
    data.muted = !data.muted;
    ArrowStore.save();
    labels();
    sound("tap");
  };
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      pauseClock();
      persist();
    } else if (screen === "game" && !$("dialog").open)
      started = performance.now();
  });
  window.addEventListener("pagehide", () => {
    pauseClock();
    persist();
  });
  window.addEventListener("resize", placeFinger);
  setInterval(() => {
    if (screen === "game") $("time").textContent = clock(milliseconds());
  }, 250);
  // Menü örneği aynı çizim ve çıkış animasyonunu kullanır.
  const demo = new ArrowBoard(
      $("demo"),
      () => {},
      () => "",
    ),
    demoBoard = ArrowPuzzle.generate(2);
  let demoRemaining = demoBoard.paths.map((_, i) => i),
    demoBusy = false;
  function resetDemo() {
    demoRemaining = demoBoard.paths.map((_, i) => i);
    demo.draw(demoBoard, demoRemaining);
    demo.svg
      .querySelectorAll("[tabindex]")
      .forEach((el) => el.removeAttribute("tabindex"));
  }
  resetDemo();
  setInterval(async () => {
    if (screen !== "menu" || document.hidden || reduced() || demoBusy) return;
    demoBusy = true;
    if (demoRemaining.length < 3) {
      await $("demo").animate([{ opacity: 1 }, { opacity: 0 }], {
        duration: 350,
        fill: "forwards",
      }).finished;
      resetDemo();
      $("demo").animate([{ opacity: 0 }, { opacity: 1 }], {
        duration: 500,
        fill: "forwards",
      });
    } else {
      const id = ArrowPuzzle.available(demoBoard, demoRemaining)[0];
      demoRemaining = demoRemaining.filter((v) => v !== id);
      await demo.exit(id, false);
    }
    demoBusy = false;
  }, 1800);
  labels();
})();

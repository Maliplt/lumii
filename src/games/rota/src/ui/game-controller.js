"use strict";
if (typeof document !== "undefined")
  (() => {
    const $ = (id) => document.getElementById(id),
      E = RouteEngine,
      read = RotaStorage.read,
      save = RotaStorage.write,
      reduce = () => matchMedia("(prefers-reduced-motion:reduce)").matches;
    let lang = read("lang", "tr"),
      muted = read("muted", false),
      progress = read("progress", { next: 1, records: {} }),
      state = "home",
      busy = false,
      puzzle = null,
      path = [],
      backtracks = 0,
      hints = 3,
      guide = -1,
      guideNext = -1,
      elapsed = 0,
      started = 0,
      tutorial = false,
      page = 0,
      dragging = false,
      lastPointer = -1,
      lastAction = 0,
      finishTimer = 0;
    if (!["tr", "en", "es", "fr", "ar", "de"].includes(lang)) lang = "tr";
    if (
      !progress ||
      !Number.isSafeInteger(progress.next) ||
      progress.next < 1 ||
      !progress.records
    )
      progress = { next: 1, records: {} };
    const texts = RotaText;
    const picker = createLanguagePicker((value) => {
      lang = value;
      save("lang", value);
      labels();
    });
    const t = (k) => texts[lang]?.[k] || texts.en?.[k] || k;
    const sound = RotaSound.create(() => muted, () => path.length);
    function time() {
      return elapsed + (state === "playing" ? performance.now() - started : 0);
    }
    function fmt(ms) {
      const s = Math.floor(ms / 1000);
      return `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
    }
    function freeze() {
      if (state === "playing") elapsed = time();
      started = performance.now();
    }
    function persist() {
      if (puzzle && !tutorial && ["playing", "paused"].includes(state))
        save("session", {
          level: puzzle.level,
          path,
          backtracks,
          hints,
          elapsed: time(),
        });
    }
    function labels() {
      document.documentElement.lang = lang;
      document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
      picker.update(lang);
      document
        .querySelectorAll("[data-t]")
        .forEach((el) => (el.innerHTML = t(el.dataset.t)));

      $("sound").classList.toggle("muted", muted);
      $("sound").setAttribute("aria-label", t(muted ? "unmute" : "mute"));
      $("saved").textContent =
        `${t("level")} ${progress.next} · ${Object.keys(progress.records).length} ${t("done")}`;
      if (puzzle) render();
      if (state === "levels") renderLevels();
      if (state === "result" && tutorial)
        $("result").querySelector("h2").textContent = t("ready");
    }
    const screenFor = {
      home: "home",
      levels: "levels",
      playing: "game",
      paused: "game",
      celebrating: "game",
      result: "result",
    };
    async function change(next) {
      busy = true;
      const old = $(screenFor[state]),
        fresh = $(screenFor[next]);
      if (old !== fresh && !old.hidden && !reduce())
        await old.animate(
          [
            { opacity: 1, translate: "0 0" },
            { opacity: 0, translate: "0 -9px" },
          ],
          { duration: 140, fill: "forwards" },
        ).finished;
      document.querySelectorAll(".screen").forEach((el) => {
        el.hidden = el !== fresh;
        el.getAnimations().forEach((a) => a.cancel());
      });
      state = next;
      document.body.dataset.state = state;
      if (old !== fresh && !reduce())
        await fresh.animate(
          [
            { opacity: 0, translate: "0 12px" },
            { opacity: 1, translate: "0 0" },
          ],
          { duration: 240, easing: "ease-out" },
        ).finished;
      busy = false;
      if (next === "playing") {
        started = performance.now();
        geometry();
      }
    }
    function validSaved(s) {
      if (
        !s ||
        s.level !== puzzle.level ||
        !Array.isArray(s.path) ||
        s.path[0] !== puzzle.start ||
        new Set(s.path).size !== s.path.length ||
        s.path.length >= puzzle.active.length
      )
        return false;
      let cp = 0;
      return s.path.every((v, i) => {
        if (
          !puzzle.active.includes(v) ||
          (i && !E.adjacent(s.path[i - 1], v, puzzle.n)) ||
          v === puzzle.end
        )
          return false;
        const index = puzzle.checkpoints.indexOf(v);
        if (index >= 0 && index !== cp++) return false;
        return true;
      });
    }
    async function launch(level, fresh = false, learn = false) {
      if (busy) return;
      tutorial = learn;
      clearTimeout(finishTimer);
      puzzle = learn
        ? {
            n: 3,
            level: 0,
            boss: false,
            path: [0, 1, 2, 5, 8, 7],
            active: [0, 1, 2, 5, 8, 7],
            start: 0,
            end: 7,
            checkpoints: [],
          }
        : E.generate(level);
      path = [puzzle.start];
      elapsed = 0;
      backtracks = 0;
      hints = 3;
      guide = -1;
      guideNext = -1;
      const s = read("session", null);
      if (!fresh && !learn && validSaved(s)) {
        path = s.path;
        elapsed = Math.max(0, Number(s.elapsed) || 0);
        backtracks = Math.max(0, Number(s.backtracks) || 0);
        hints = Math.max(0, Math.min(3, Number(s.hints) || 0));
      }
      build();
      render();
      await change("playing");
      render();
      persist();
    }
    function build() {
      const grid = $("cells");
      grid.replaceChildren();
      $("board").style.setProperty("--n", puzzle.n);
      const pad = 2.3,
        gap = puzzle.n > 5 ? 1.3 : 1.7;
      grid.style.setProperty("--pad", pad + "%");
      grid.style.setProperty("--gap", gap + "%");
      for (let i = 0; i < puzzle.n * puzzle.n; i++) {
        const b = document.createElement("button");
        b.className = "cell";
        b.dataset.index = i;
        b.tabIndex = puzzle.active.includes(i) ? 0 : -1;
        b.setAttribute(
          "aria-label",
          `${Math.floor(i / puzzle.n) + 1}, ${(i % puzzle.n) + 1}`,
        );
        b.innerHTML = '<span class="node"></span>';
        b.onclick = (e) => {
          if (performance.now() - lastAction > 280 || e.detail === 0) step(i);
        };
        grid.append(b);
      }
    }
    function legal(i) {
      return (
        puzzle.active.includes(i) &&
        !path.includes(i) &&
        E.adjacent(path.at(-1), i, puzzle.n) &&
        (i !== puzzle.end || path.length === puzzle.active.length - 1) &&
        (puzzle.checkpoints.indexOf(i) < 0 ||
          puzzle.checkpoints.indexOf(i) ===
            puzzle.checkpoints.filter((v) => path.includes(v)).length)
      );
    }
    function render() {
      if (!puzzle) return;
      const last = path.at(-1);
      [...$("cells").children].forEach((b, i) => {
        const visited = path.includes(i),
          checkpoint = puzzle.checkpoints.indexOf(i);
        b.className =
          "cell" +
          (!puzzle.active.includes(i) ? " hole" : "") +
          (i === puzzle.start ? " start" : "") +
          (i === puzzle.end ? " finish" : "") +
          (visited ? " visited" : "") +
          (i === last ? " tip" : "") +
          (legal(i) ? " can" : "") +
          (checkpoint >= 0 ? " checkpoint" : "");
        b.firstElementChild.textContent = checkpoint >= 0 ? checkpoint + 1 : "";
        b.setAttribute("aria-pressed", String(visited));
      });
      $("count").textContent = path.length;
      $("total").textContent = "/ " + puzzle.active.length;
      $("timer").textContent = fmt(time());
      $("hints").textContent = hints;
      $("hint").disabled = tutorial || hints === 0;
      $("undo").disabled = path.length < 2 || tutorial;
      $("progress").style.width =
        `${(path.length / puzzle.active.length) * 100}%`;
      $("levelLabel").textContent =
        t(tutorial ? "learn" : "level") + (tutorial ? "" : " " + puzzle.level);
      $("gameTitle").textContent = t(puzzle.boss ? "boss" : "normal");
      $("checkpointNote").textContent = puzzle.checkpoints
        .map((v, i) => (path.includes(v) ? "✓" : i + 1))
        .join(" → ");
      status(
        tutorial
          ? "tutorialGo"
          : guide >= 0
            ? path.includes(guide)
              ? "hintBack"
              : "hintGo"
            : puzzle.active.some(legal)
              ? "drag"
              : "stuck",
      );
      geometry();
    }
    function status(k) {
      $("status").textContent = t(k);
    }
    function geometry() {
      if (!puzzle || $("game").hidden) return;
      const bs = $("board").clientWidth,
        points = path.map((i) => {
          const el = $("cells").children[i];
          return [
            el.offsetLeft + el.offsetWidth / 2,
            el.offsetTop + el.offsetHeight / 2,
          ];
        });
      const d = points.map((p, i) => (i ? "L" : "M") + p.join(" ")).join(" ");
      $("route").setAttribute("viewBox", `0 0 ${bs} ${bs}`);
      $("route").style.setProperty(
        "--stroke",
        Math.max(5, (bs / puzzle.n) * 0.15) + "px",
      );
      $("routeLine").setAttribute("d", d);
      $("routeShadow").setAttribute("d", d);
      const target = tutorial ? puzzle.path[path.length] : guide,
        el = $("cells").children[target];
      $("hand").style.display = el && state === "playing" ? "block" : "none";
      if (el) {
        $("hand").style.left = el.offsetLeft + el.offsetWidth * 0.55 + "px";
        $("hand").style.top = el.offsetTop + el.offsetHeight * 0.44 + "px";
      }
    }
    new ResizeObserver(geometry).observe($("board"));
    function burst(i, large = false) {
      if (reduce()) return;
      const el = $("cells").children[i];
      for (let k = 0; k < (large ? 16 : 7); k++) {
        const p = document.createElement("i"),
          a = (k / (large ? 16 : 7)) * Math.PI * 2;
        p.className = "particle";
        p.style.cssText = `left:${el.offsetLeft + el.offsetWidth / 2}px;top:${el.offsetTop + el.offsetHeight / 2}px;--dx:${Math.cos(a) * el.offsetWidth * 0.65}px;--dy:${Math.sin(a) * el.offsetHeight * 0.65}px`;
        $("particles").append(p);
        p.addEventListener("animationend", () => p.remove(), { once: true });
      }
    }
    function reject(i, key) {
      status(key);
      const b = $("cells").children[i];
      b.classList.remove("wrong");
      void b.offsetWidth;
      b.classList.add("wrong");
      sound.play("error");
    }
    function step(i) {
      if (
        busy ||
        state !== "playing" ||
        !puzzle.active.includes(i) ||
        i === path.at(-1)
      )
        return;
      if (tutorial && i !== puzzle.path[path.length]) {
        reject(i, "tutorialGo");
        return;
      }
      const existing = path.indexOf(i);
      if (existing >= 0) {
        path = path.slice(0, existing + 1);
        backtracks++;
        sound.play("back");
        if (i === guide) {
          guide = guideNext;
          guideNext = -1;
        }
        render();
        persist();
        return;
      }
      if (!E.adjacent(path.at(-1), i, puzzle.n)) return;
      if (i === puzzle.end && path.length !== puzzle.active.length - 1) {
        reject(i, "early");
        return;
      }
      if (!legal(i)) {
        reject(i, "order");
        return;
      }
      path.push(i);
      if (i === guide) {
        guide = -1;
        guideNext = -1;
      }
      render();
      $("cells").children[i].classList.add("pop");
      const checkpoint = puzzle.checkpoints.includes(i);
      sound.play(checkpoint ? "checkpoint" : "step");
      burst(i, checkpoint);
      persist();
      if (path.length === puzzle.active.length && i === puzzle.end) win();
    }
    $("board").addEventListener("pointerdown", (e) => {
      const el = e.target.closest(".cell");
      if (!el || busy || state !== "playing") return;
      e.preventDefault();
      dragging = true;
      lastPointer = Number(el.dataset.index);
      lastAction = performance.now();
      step(lastPointer);
      $("board").setPointerCapture(e.pointerId);
    });
    $("board").addEventListener("pointermove", (e) => {
      if (!dragging || busy || state !== "playing") return;
      const el = document
        .elementFromPoint(e.clientX, e.clientY)
        ?.closest(".cell");
      if (!el) return;
      const i = Number(el.dataset.index);
      if (i !== lastPointer) {
        lastPointer = i;
        lastAction = performance.now();
        step(i);
      }
    });
    const stop = () => {
      dragging = false;
      lastPointer = -1;
      lastAction = performance.now();
    };
    $("board").addEventListener("pointerup", stop);
    $("board").addEventListener("pointercancel", stop);
    document.addEventListener("keydown", (e) => {
      if (state !== "playing" || busy || $("dialog").open) return;
      const d = {
        ArrowUp: -puzzle.n,
        ArrowDown: puzzle.n,
        ArrowLeft: -1,
        ArrowRight: 1,
      };
      if (e.key in d) {
        e.preventDefault();
        step(path.at(-1) + d[e.key]);
      }
      if (e.key === "Backspace") {
        e.preventDefault();
        undo();
      }
      if (e.key === "Escape") pause();
    });
    function undo() {
      if (busy || tutorial || state !== "playing" || path.length < 2) return;
      step(path.at(-2));
    }
    function hint() {
      if (busy || tutorial || state !== "playing") return;
      if (guide >= 0) {
        geometry();
        return;
      }
      if (!hints) return;
      let common = 0;
      while (common < path.length && path[common] === puzzle.path[common])
        common++;
      hints--;
      if (common < path.length) {
        guide = path[common - 1];
        guideNext = puzzle.path[common];
      } else guide = puzzle.path[path.length];
      render();
      persist();
      sound.play("checkpoint");
    }
    function win() {
      freeze();
      state = "celebrating";
      document.body.dataset.state = state;
      busy = true;
      dragging = false;
      $("hand").style.display = "none";
      const stars =
        backtracks === 0 && hints === 3
          ? 3
          : backtracks < 8 && hints >= 1
            ? 2
            : 1;
      if (!tutorial) {
        const prev = progress.records[puzzle.level];
        progress.records[puzzle.level] = {
          stars: Math.max(prev?.stars || 0, stars),
          time: prev ? Math.min(prev.time, elapsed) : elapsed,
        };
        progress.next = Math.max(progress.next, puzzle.level + 1);
        save("progress", progress);
        save("session", null);
      } else save("learned", true);
      $("resultTime").textContent = fmt(elapsed);
      $("resultMoves").textContent = backtracks;
      $("stars").innerHTML = [1, 2, 3]
        .map((i) => `<span class="${i > stars ? "empty" : ""}">★</span>`)
        .join("");
      $("stars").setAttribute("aria-label", `${stars} / 3`);
      sound.play("win");
      burst(puzzle.end, true);
      if (!reduce())
        $("board").animate(
          [
            { transform: "scale(1)" },
            { transform: "scale(1.015)", offset: 0.4 },
            { transform: "scale(1)" },
          ],
          { duration: 600 },
        );
      finishTimer = setTimeout(
        async () => {
          busy = false;
          await change("result");
          labels();
        },
        reduce() ? 300 : 1050,
      );
    }
    function dialog(title, text, actions) {
      if (busy || $("dialog").open) return;
      if (state === "playing") {
        freeze();
        state = "paused";
        persist();
      }
      $("dialogTitle").textContent = t(title);
      $("dialogText").textContent = t(text);
      $("dialogActions").replaceChildren();
      actions.forEach(([label, fn, primary]) => {
        const b = document.createElement("button");
        b.textContent = t(label);
        if (primary) b.className = "primary";
        b.onclick = () => {
          close();
          fn?.();
        };
        $("dialogActions").append(b);
      });
      $("dialog").showModal();
      $("hand").style.display = "none";
    }
    function close() {
      $("dialog").close();
      if (state === "paused") {
        state = "playing";
        started = performance.now();
        geometry();
      }
    }
    function help() {
      dialog("helpTitle", "helpText", [
        ["try", () => launch(0, true, true), true],
        ["resume", null, false],
      ]);
    }
    function pause() {
      dialog("pause", "pauseText", [
        ["resume", null, true],
        ["levels", levels, false],
      ]);
    }
    function renderLevels() {
      $("levelGrid").replaceChildren();
      for (let k = 1; k <= 12; k++) {
        const level = page * 12 + k,
          record = progress.records[level],
          locked = level > progress.next,
          b = document.createElement("button");
        b.className =
          "level" +
          (record ? " done" : "") +
          (level === progress.next ? " current" : "") +
          (level % 10 === 0 ? " boss" : "");
        b.disabled = locked;
        b.innerHTML = `<b>${String(level).padStart(2, "0")}</b><small>${locked ? "−" : record ? "★".repeat(record.stars) : "↗"}</small>`;
        b.setAttribute(
          "aria-label",
          `${t("level")} ${level}${locked ? " " + t("locked") : ""}`,
        );
        b.onclick = () => launch(level);
        $("levelGrid").append(b);
      }
      $("page").textContent = `${page * 12 + 1} — ${page * 12 + 12}`;
      $("prev").disabled = page === 0;
    }
    async function levels() {
      if (busy) return;
      persist();
      freeze();
      page = Math.floor((progress.next - 1) / 12);
      renderLevels();
      await change("levels");
    }
    $("play").onclick = () =>
      read("learned", false) ? launch(progress.next) : help();
    $("levelsButton").onclick = levels;
    $("tutorialButton").onclick = help;
    $("help").onclick = help;
    $("homeButton").onclick = () => {
      if (busy) return;
      persist();
      freeze();
      change("home");
      labels();
    };
    $("backHome").onclick = () => {
      change("home");
      labels();
    };
    $("backLevels").onclick = () =>
      dialog("exit", "exitText", [
        ["levels", levels, true],
        ["resume", null, false],
      ]);
    $("pause").onclick = pause;
    $("undo").onclick = undo;
    $("hint").onclick = hint;
    $("reset").onclick = () =>
      dialog("restart", "restartText", [
        ["reset", () => launch(puzzle.level, true, tutorial), true],
        ["cancel", null, false],
      ]);
    $("next").onclick = () =>
      launch(tutorial ? progress.next : puzzle.level + 1, true);
    $("retry").onclick = () => launch(puzzle.level, true, tutorial);
    $("resultLevels").onclick = levels;
    $("prev").onclick = () => {
      page = Math.max(0, page - 1);
      renderLevels();
    };
    $("forward").onclick = () => {
      page++;
      renderLevels();
    };
    $("close").onclick = close;
    $("dialog").addEventListener("cancel", (e) => {
      e.preventDefault();
      close();
    });

    $("sound").onclick = () => {
      muted = !muted;
      save("muted", muted);
      if (muted) sound.ctx?.suspend();
      else sound.play("step");
      labels();
    };
    document.addEventListener("visibilitychange", () => {
      if (document.hidden && state === "playing" && !busy) pause();
    });
    window.addEventListener("pagehide", persist);
    setInterval(() => {
      if (state === "playing") $("timer").textContent = fmt(time());
    }, 250);
    setInterval(persist, 4000);
    document.body.dataset.state = state;
    labels();
  })();

BambooModules.define("main.js", function(require, module, exports) {
var import_controls = require("./controls.js");
var import_menus = require("./menus.js");
var import_save_storage = require("./save-storage.js");
var import_tutorial_gesture = require("./tutorial-gesture.js");
var import_celebrations = require("./celebrations.js");
var import_storm = require("./storm.js");
var import_bonuses = require("./bonuses.js");
var import_tutorial = require("./tutorial.js");
var import_shop_drag = require("./shop-drag.js");
var import_world = require("./world.js");
var import_core = require("./core.js");
var import_locales = require("./locales.js");
var import_audio = require("./audio.js");
var import_config = require("./config.js");
var import_menus2 = require("./menus.js");
var import_save = require("./save.js");
var import_platforms = require("./platforms.js");
var import_map = require("./map.js");
var import_missions = require("./missions.js");
var import_costumes = require("./costumes.js");
const app = document.querySelector("#app"), canvas = document.querySelector("#world");
let storage;
try {
  storage = window.localStorage;
} catch {
  storage = {
    getItem: () => null,
    setItem: () => {
      throw Error("storage");
    }
  };
}
const saves = new import_save_storage.SaveStorage(storage, {
  ...window.BambooHopConfig,
  id: window.GameSaveConfig?.userId ?? window.BambooHopConfig?.id,
  subId: window.GameSaveConfig?.profileId ?? window.BambooHopConfig?.subId
});
const save = saves.read(), audio = new import_audio.ForestAudio();
(0, import_missions.ensureDaily)(save);
audio.enabled = save.sound;
let world, toastTimer, storageWarned = false, modal = null, previousFocus = null;
const game = {
  state: "menu",
  mode: "endless",
  x: 0,
  row: 0,
  furthest: 0,
  coins: 0,
  hop: null,
  queue: null,
  seed: 0,
  sideways: 0,
  tutStep: 0,
  death: "",
  wasRecord: false,
  finished: false,
  goals: /* @__PURE__ */ new Set()
};
const t = (k) => import_locales.strings[save.lang][k] || k;
function hydrateSave(progress) {
  Object.assign(save, progress);
  (0, import_missions.ensureDaily)(save);
  audio.enabled = save.sound;
  persist();
  world.dress();
  world.showMenu();
  render();
}
function persist() {
  try {
    saves.write(save);
  } catch {
    if (!storageWarned) {
      storageWarned = true;
      toast(t("savedError"));
    }
  }
}
function toast(message) {
  const el = document.querySelector("#toast");
  el.textContent = message;
  el.classList.add("visible");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove("visible"), 3e3);
}
function utility() {
  return `<div class="utility">${(0, import_menus.action)("language", save.lang.toUpperCase(), "round language", t("language"))}${(0, import_menus.action)("sound", (0, import_menus.icon)(save.sound ? "sound" : "mute"), "round", t("sound"))}${(0, import_menus.action)("settings", (0, import_menus.icon)("gear"), "round", t("settings"))}</div>`;
}
function render() {
  document.documentElement.lang = save.lang;
  document.title = "Bamboo Hop";
  document.documentElement.dir = save.lang === "ar" ? "rtl" : "ltr";
  document.body.dataset.modal = modal || "";
  canvas.setAttribute(
    "aria-label",
    save.lang === "tr" ? "Bamboo Hop 3D oyun alanı" : "Bamboo Hop 3D game area"
  );
  document.body.dataset.state = game.state;
  document.body.classList.toggle("gentle", save.reduced);
  if (game.state === "menu") renderMenu();
  else renderGame();
  if (modal) renderModal();
}
function renderMenu() {
  app.innerHTML = (0, import_menus2.menuHTML)(t, save, import_menus.action, import_menus.icon, utility());
}
function renderGame() {
  const goal = (0, import_missions.ensureDaily)(save)[0];
  if (game.mode === "tutorial") goal.target = import_map.TUTORIAL_END;
  app.innerHTML = `<header class="game-top"><div class="score-block"><span>${t("step")}</span><strong id="score">${game.furthest}</strong><small>${(0, import_menus.icon)("cup")} ${game.mode === "daily" ? save.daily[game.seed] || 0 : save.best}</small></div>
  <div class="game-tools"><div class="coin-counter">${(0, import_menus.icon)("bamboo")}<strong id="coins">${game.coins + (game.reward || 0)}</strong><span id="bamboo-streak" aria-label="${t("bambooSeries")}"></span></div>${(0, import_menus.action)("pause", (0, import_menus.icon)("pause"), "round", t("pause"))}</div></header>
  <div id="tutorial-card"></div>
  <footer class="game-bottom"><div class="desktop-instructions"><div class="key-row"><kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd><span>/</span><kbd>↑</kbd><kbd>←</kbd><kbd>↓</kbd><kbd>→</kbd></div><span>${t("keys")}<i>·</i> ESC ${t("pause")}</span></div>
  <div class="run-goal">${(0, import_menus.icon)("flag")}<span>${game.mode === "tutorial" ? t("tutorial") : t("dailySteps").replace("{n}", goal.target)}<b id="goal-progress">${Math.min(game.furthest, goal.target)} / ${goal.target}${game.mode === "tutorial" ? "" : ` · +${goal.reward}`}</b></span></div></footer><div id="overlay-root"></div>`;
  updateTutorial();
  updateHud();
  const warning = document.createElement("div");
  warning.id = "camera-warning";
  warning.setAttribute("role", "status");
  warning.hidden = true;
  warning.innerHTML = `<svg viewBox="0 0 40 38" aria-hidden="true"><path d="M20 3 38 35H2Z" fill="#f0bc64"/><path d="M20 13v10m0 5v1" stroke="#633e2d" stroke-width="4" stroke-linecap="round"/></svg><span>${t("cameraDanger")}</span>`;
  app.append(warning);
  if (game.state === "paused") renderPause();
  if (game.state === "dead") renderOver();
}
function updateHud() {
  const score = document.querySelector("#score");
  if (score && Number(score.textContent) !== game.furthest) {
    score.textContent = game.furthest;
    if (!save.reduced)
      score.animate(
        [
          { transform: "scale(1)" },
          {
            transform: `scale(${game.furthest % 25 === 0 ? 1.65 : 1.25})`,
            color: "#dc853e"
          },
          { transform: "scale(1)" }
        ],
        { duration: game.furthest % 25 === 0 ? 700 : 240 }
      );
    audio.tone(420 + game.furthest % 8 * 35, 0.075, "sine", 0.025);
  }
  const coins = document.querySelector("#coins");
  if (coins) coins.textContent = game.coins + (game.reward || 0);
  const streak = document.querySelector("#bamboo-streak");
  if (streak) {
    streak.hidden = game.mode === "tutorial";
    streak.innerHTML = [0, 1, 2].map((i) => `<i class="${i < game.streak ? "filled" : ""}"></i>`).join("");
  }
  const goal = document.querySelector("#goal-progress");
  const target = (0, import_missions.ensureDaily)(save)[0];
  if (game.mode === "tutorial") target.target = import_map.TUTORIAL_END;
  if (goal)
    goal.textContent = `${Math.min(game.furthest, target.target)} / ${target.target}${game.mode === "tutorial" ? "" : ` · +${target.reward}`}`;
}
function updateTutorial() {
  const el = document.querySelector("#tutorial-card");
  if (!el) return;
  if (game.mode !== "tutorial" || game.state !== "playing") {
    el.innerHTML = "";
    return;
  }
  const n = game.tutStep + 1, progress = (0, import_tutorial.lessonProgress)(game), total = import_tutorial.LESSONS[game.tutStep].target;
  const touchMode = innerWidth < 700 || matchMedia("(pointer: coarse)").matches;
  const instruction = touchMode && n <= 2 ? t(n === 1 ? "tapOnly" : "swipeOnly") : t("tut" + n + "Text");
  const hand = (0, import_tutorial_gesture.tutorialGesture)(n === 2);
  el.innerHTML = `<section class="tutorial-panel"><div class="tutorial-top"><span>${t("tutLabel")}<b>0${n} / 07</b></span>${(0, import_menus.action)("skip", t("skip"), "text-button")}</div>${n <= 2 ? hand : ""}<h3>${t("tut" + n)}</h3><p>${instruction}</p><div class="progress-track"><i style="width:${Math.min(100, progress / total * 100)}%"></i></div></section>`;
}
function panel(content, cls = "") {
  return `<div class="scrim"><section class="dialog ${cls}" role="dialog" aria-modal="true" aria-labelledby="dialog-title">${content}</section></div>`;
}
function focusDialog() {
  requestAnimationFrame(
    () => [...document.querySelectorAll(".dialog")].at(-1)?.querySelector("button")?.focus({ preventScroll: true })
  );
}
function renderPause() {
  document.querySelector("#overlay-root").innerHTML = panel(
    `<div class="dialog-emblem">${(0, import_menus.icon)("leaf")}</div><p class="eyebrow centered">${t("pause")}</p><h2 id="dialog-title">${t("pauseTitle")}</h2><p>${t("pauseText")}</p><div class="dialog-buttons">${(0, import_menus.action)("resume", `${t("resume")}${(0, import_menus.icon)("arrow")}`, "primary")}${(0, import_menus.action)("restart", t("restart"), "outline")}${(0, import_menus.action)("home", t("home"), "text-button")}</div><div class="pause-options">${(0, import_menus.action)("sound", (0, import_menus.icon)(save.sound ? "sound" : "mute"), "round", t("sound"))}${(0, import_menus.action)("settings", (0, import_menus.icon)("gear"), "round", t("settings"))}${(0, import_menus.action)("fullscreen", (0, import_menus.icon)("fullscreen"), "round", t("fullscreen"))}</div>`
  );
  focusDialog();
}
function renderOver() {
  document.querySelector("#overlay-root").innerHTML = panel(
    (0, import_menus2.resultsHTML)(t, save, game, import_menus.action, import_menus.icon),
    game.wasRecord ? "result new-record" : "result"
  );
  focusDialog();
  game.resultTime = 0;
  game.lastResultTone = 0;
  game.resultCelebrated = false;
  game.lastScorePunch = 0;
  game.lastScorePunchTime = -1;
  game.finalScorePunch = false;
  (0, import_celebrations.refreshMissionClock)(t);
}
function openModal(type) {
  previousFocus = document.activeElement;
  if (game.state === "playing") {
    game.state = "paused";
    game.queue = null;
    render();
  }
  modal = type;
  renderModal();
}
function renderModal() {
  document.body.dataset.modal = modal || "";
  document.querySelector("#modal-root")?.remove();
  const root = document.createElement("div");
  root.id = "modal-root";
  app.append(root);
  const content = modal === "settings" ? (0, import_menus2.settingsHTML)(t, save, import_menus.action, import_menus.icon) : (0, import_menus2.wardrobeHTML)(t, save, import_menus.action, import_menus.icon);
  root.innerHTML = panel(
    `${(0, import_menus.action)("close-modal", `${(0, import_menus.icon)("back")}${t("goBack")}`, "store-back")}${content}`,
    modal
  );
  focusDialog();
}
function closeModal() {
  document.querySelector("#purchase-confirm")?.remove();
  modal = null;
  document.body.dataset.modal = "";
  document.querySelector("#modal-root")?.remove();
  previousFocus?.focus?.();
}
function start(mode = "endless") {
  if (game.state === "intro") return;
  const menuExit = game.state === "menu" ? document.createElement("div") : null;
  if (menuExit) {
    menuExit.className = "menu-exit";
    menuExit.setAttribute("aria-hidden", "true");
    menuExit.inert = true;
    menuExit.innerHTML = app.innerHTML;
  }
  const prepared = game.state === "menu" && !world.tutorial ? world.preparedSeed : null;
  audio.unlock();
  modal = null;
  Object.assign(game, {
    state: "intro",
    introTime: 0,
    attachment: null,
    lessonBamboo: false,
    lessonStorm: false,
    recordCrossed: false,
    mode,
    x: 0,
    row: 0,
    furthest: 0,
    coins: 0,
    reward: 0,
    cameraRow: 0,
    elapsed: 0,
    deathTime: 0,
    landing: 0,
    hop: null,
    queue: null,
    sideways: 0,
    tutStep: 0,
    death: "",
    wasRecord: false,
    finished: false,
    goals: /* @__PURE__ */ new Set(),
    seed: mode === "daily" ? (0, import_core.dailySeed)() : mode === "tutorial" ? 7721 : prepared ?? Math.floor(Math.random() * 2147483647)
  });
  (0, import_bonuses.resetBonuses)(game);
  world.play(
    game.seed,
    mode === "tutorial",
    mode === "daily" ? save.daily[game.seed] || 0 : save.best,
    t("best")
  );
  render();
  if (menuExit) {
    document.body.append(menuExit);
    setTimeout(() => menuExit.remove(), 650);
  }
}
function menu() {
  modal = null;
  game.state = "menu";
  game.hop = null;
  game.queue = null;
  world.showMenu();
  render();
}
function finish(reason, completed = false) {
  if (game.state !== "playing") return;
  game.state = completed ? "dead" : "dying";
  game.queue = null;
  game.hop = null;
  game.death = reason;
  game.finished = completed;
  game.deathTime = 0;
  game.deathOrigin = world.panda.position.clone();
  game.deathDirection = Math.sign(world.lanes.get(game.row)?.speed || 1);
  world.shake = 0.9;
  game.wasRecord = game.mode !== "tutorial" && game.furthest > (game.mode === "daily" ? save.daily[game.seed] || 0 : save.best);
  if (game.mode !== "tutorial") {
    save.best = Math.max(save.best, game.furthest);
    save.bamboo += game.coins + game.reward;
    save.total += game.furthest;
    save.runs++;
    (0, import_missions.recordRun)(save, game);
    if (game.mode === "daily") {
      save.daily[game.seed] = Math.max(
        save.daily[game.seed] || 0,
        game.furthest
      );
      const keys = Object.keys(save.daily).sort();
      while (keys.length > 30) delete save.daily[keys.shift()];
    }
  } else {
    if (completed) {
      save.bamboo += game.coins;
      save.tutorial = true;
    }
  }
  persist();
  if (completed) {
    audio.success();
    world.burst(game.x * import_world.CELL, -game.row * import_world.CELL, "#bcef78", 24);
  } else {
    audio.death();
    world.burst(
      game.x * import_world.CELL,
      -game.row * import_world.CELL,
      reason === "deathRoad" ? "#f2ad6e" : "#a7e8d4",
      54
    );
  }
  render();
  if (!completed) {
    const hit = document.createElement("div");
    hit.className = "impact-ring";
    app.append(hit);
    setTimeout(() => hit.remove(), 450);
  }
}
function move(dx, dr) {
  if (game.state !== "playing" || modal) return;
  audio.unlock();
  if (game.hop) {
    game.queue = [dx, dr];
    return;
  }
  let x = Math.round(game.x) + dx;
  const row = game.row + dr, lane = world.lanes.get(row);
  if (game.mode === "tutorial" && ((0, import_tutorial.lessonBlocks)(game, row, dr) || row > import_map.TUTORIAL_END)) {
    audio.bump();
    return;
  }
  let targetAttachment = null;
  if (lane?.type === "water") {
    targetAttachment = dr === 0 && game.attachment ? (0, import_platforms.adjacentSlot)(game.attachment, dx) : (0, import_platforms.landingSlot)(game.x, lane.movers, import_core.HOP_TIME);
    if (dr === 0 && game.attachment && !targetAttachment) {
      audio.bump();
      return;
    }
    if (targetAttachment) x = targetAttachment.x;
  }
  if (!lane || !(0, import_core.validMove)(x, row, game.row, game.furthest, lane.obstacles)) {
    audio.bump();
    return;
  }
  (0, import_bonuses.watchNearMiss)(game, world.lanes.get(game.row));
  const fromHeight = game.attachment?.platform.height || 0;
  const toHeight = targetAttachment?.platform.height || 0;
  game.hop = {
    fromX: game.x,
    fromRow: game.row,
    toX: x,
    toRow: row,
    fromHeight,
    toHeight,
    elapsed: 0,
    dx,
    dr,
    targetAttachment
  };
  world.panda.rotation.y = dr > 0 ? Math.PI : dr < 0 ? 0 : dx > 0 ? Math.PI / 2 : -Math.PI / 2;
  audio.hop();
}
function landed(hop) {
  game.attachment = hop.targetAttachment;
  if (game.attachment)
    hop.toX = (0, import_platforms.slotPosition)(game.attachment.platform, game.attachment.slot);
  game.x = hop.toX;
  game.row = hop.toRow;
  game.furthest = Math.max(game.furthest, game.row);
  game.hop = null;
  game.landing = 0.15;
  if (hop.dx && game.tutStep === 1) game.sideways++;
  const lane = world.lanes.get(game.row);
  if (lane.type === "water" && !game.attachment) {
    finish("deathWater");
    return;
  }
  if (lane.type === "road" && (0, import_core.hitsHazard)(game.x, lane.movers)) {
    finish("deathRoad");
    return;
  }
  if ((0, import_storm.stormHits)(lane, game.x, -world.panda.position.z / import_world.CELL)) {
    finish("deathStorm");
    return;
  }
  (0, import_bonuses.watchNearMiss)(game, lane);
  awardBonus((0, import_bonuses.leaveRoad)(game, hop), "nearMiss");
  for (const coin of lane.coins)
    if (!coin.collected && Math.abs(game.x - coin.x) < 0.6) {
      coin.collected = true;
      lane.root.remove(coin.mesh, coin.shadow, coin.glow);
      if (game.mode === "tutorial" && lane.index === 6)
        game.lessonBamboo = true;
      game.coins++;
      awardBonus((0, import_bonuses.collectStreak)(game), "bambooSeries");
      audio.coin();
      world.burst(game.x * import_world.CELL, -game.row * import_world.CELL, "#bcef78", 14);
    }
  if (lane.type === "grass")
    world.burst(game.x * import_world.CELL, -game.row * import_world.CELL, "#e0dda9", 4);
  world.ensure(game.furthest);
  if (game.mode !== "tutorial" && world.runRecord > 0 && game.furthest > world.runRecord && !game.recordCrossed) {
    game.recordCrossed = true;
    audio.success();
    world.burst(game.x * import_world.CELL, -game.row * import_world.CELL, "#e7f5a5", 65);
    document.querySelector("#score")?.classList.add("record-live");
  }
  if (game.furthest > 0 && game.furthest % 25 === 0 && !game.goals.has(game.furthest)) {
    game.goals.add(game.furthest);
    audio.success();
    world.burst(game.x * import_world.CELL, -game.row * import_world.CELL, "#e8d278", 40);
    const badge = document.createElement("div");
    badge.className = "milestone-burst";
    badge.textContent = game.furthest;
    app.append(badge);
    setTimeout(() => badge.remove(), 1100);
  }
  if (game.mode === "tutorial") {
    if ((0, import_tutorial.advanceLesson)(game)) audio.coin();
    if (game.tutStep === 6 && game.furthest >= import_map.TUTORIAL_END) {
      finish("", true);
      return;
    }
    updateTutorial();
  }
  updateHud();
  if (game.queue) {
    const next = game.queue;
    game.queue = null;
    move(...next);
  }
}
function awardBonus(amount, label) {
  if (!amount) return;
  game.reward += amount;
  audio.tone(label === "nearMiss" ? 780 : 620, 0.16, "triangle", 0.055, 1100);
  world.burst(game.x * import_world.CELL, -game.row * import_world.CELL, "#d5ef8f", 25);
  const badge = document.createElement("div");
  badge.className = "bonus-pop";
  badge.innerHTML = `<strong>${t(label)}</strong><span>${(0, import_menus.icon)("bamboo")} +${amount}</span>`;
  app.append(badge);
  setTimeout(() => badge.remove(), 1e3);
  updateHud();
}
function update(dt) {
  if (game.state === "intro") {
    game.introTime += dt;
    if (game.introTime >= import_config.CONFIG.introDuration) {
      game.state = "playing";
      render();
    }
    return;
  }
  if (game.state === "dead") {
    (0, import_celebrations.refreshMissionClock)(t);
    if (save.missionDay !== (0, import_missions.dayKey)()) {
      (0, import_missions.ensureDaily)(save);
      persist();
      renderOver();
    }
    game.resultTime = (game.resultTime || 0) + dt;
    const u = Math.min(
      1,
      game.resultTime / (1.2 + Math.min(1.6, game.furthest / 100))
    );
    const ease = u * u * (3 - 2 * u), value = Math.floor(game.furthest * ease);
    const counter = document.querySelector("#result-count");
    if (counter && Number(counter.textContent) !== value) {
      counter.textContent = value;
      if (game.resultTime - (game.lastResultTone || 0) > 0.065) {
        audio.tone(240 + ease * 600, 0.06, "sine", 0.035);
        game.lastResultTone = game.resultTime;
      }
    }
    const fill = document.querySelector("#result-fill");
    if (fill) fill.style.width = `${ease * 100}%`;
    const tier = Math.floor(value / 10);
    if (tier > game.lastScorePunch && game.resultTime - game.lastScorePunchTime > 0.2 && u < 1) {
      game.lastScorePunch = tier;
      game.lastScorePunchTime = game.resultTime;
      (0, import_celebrations.punchScore)(counter, audio, save.reduced);
    }
    if (u >= 1 && !game.finalScorePunch) {
      game.finalScorePunch = true;
      (0, import_celebrations.punchScore)(counter, audio, save.reduced, true);
    }
    if (u >= 1 && game.wasRecord && !game.resultCelebrated) {
      game.resultCelebrated = true;
      audio.success();
      const score = document.querySelector(".result-score");
      for (let i = 0; i < 14; i++) {
        const spark = document.createElement("i");
        spark.className = "prize-spark";
        spark.style.setProperty("--a", `${i * 360 / 14}deg`);
        spark.style.setProperty("--d", `${70 + i % 3 * 26}px`);
        score?.append(spark);
        setTimeout(() => spark.remove(), 1100);
      }
    }
    document.querySelectorAll(".reward-goal").forEach(
      (el, i) => el.classList.toggle("revealed", game.resultTime > 1.2 + i * 0.25)
    );
    return;
  }
  if (game.state === "dying") {
    game.deathTime += dt;
    const u = Math.min(1, game.deathTime / import_config.CONFIG.deathDuration);
    const flight = 1 - Math.pow(1 - Math.min(1, u / 0.84), 2), targetX = Math.max(
      -6.2,
      Math.min(6.2, game.deathOrigin.x + game.deathDirection * 3.2)
    );
    world.panda.position.x = lerp(game.deathOrigin.x, targetX, flight);
    world.panda.position.y = game.deathOrigin.y * (1 - flight) + 0.55 * flight + Math.sin(flight * Math.PI) * 1.7;
    world.panda.rotation.z = flight * Math.PI * 2.5 * game.deathDirection;
    world.panda.scale.setScalar(1);
    if (game.death === "deathStorm") {
      world.panda.position.x = game.deathOrigin.x + flight * 9;
      world.panda.position.y = game.deathOrigin.y + Math.sin(flight * Math.PI / 2) * 4;
      world.panda.rotation.y += dt * 24;
      world.panda.scale.setScalar(1 - flight * 0.85);
      if (u < 0.65)
        world.burst(
          world.panda.position.x,
          world.panda.position.z,
          "#cbdcc8",
          3
        );
    } else if (game.death === "deathWater") {
      world.panda.position.x = game.deathOrigin.x;
      world.panda.position.y = game.deathOrigin.y + Math.sin(flight * Math.PI) * 0.8 - flight * 0.25;
      world.panda.rotation.z = flight * 0.3;
    }
    if (u >= 1) {
      if (game.mode === "tutorial") {
        const checkpoint = import_tutorial.LESSONS[game.tutStep].checkpoint;
        Object.assign(game, {
          state: "intro",
          introTime: 0,
          row: checkpoint,
          furthest: checkpoint,
          cameraRow: checkpoint,
          x: 0,
          attachment: null,
          landing: 0
        });
        world.introFocus = world.focus.clone();
        world.introTime = 0;
        world.introSize = world.camera.top * 2;
        world.panda.position.set(0, 0, -checkpoint * import_world.CELL);
        world.panda.rotation.set(0, 0, 0);
        render();
        return;
      }
      game.state = "dead";
      world.burst(
        world.panda.position.x,
        world.panda.position.z,
        "#d6d4b0",
        10
      );
      render();
    }
    return;
  }
  if (game.state !== "playing") return;
  game.elapsed += dt;
  if (game.streak && game.elapsed - game.lastBambooTime > import_config.CONFIG.bambooStreakSeconds) {
    game.streak = 0;
    updateHud();
  }
  const nextStorm = [...world.lanes.values()].find(
    (l) => l.type === "storm" && l.index >= game.row && l.index <= game.row + 3
  );
  if (nextStorm && !nextStorm.noticed) {
    for (const lane of world.lanes.values())
      if (lane.type === "storm" && lane.start === nextStorm.start) {
        lane.noticed = true;
      }
    audio.tone(185, 0.35, "triangle", 0.06, 120);
  }
  const activeStorm = [...world.lanes.values()].find(
    (lane) => lane.sign && lane.stormActive && Math.abs(lane.index - game.row) < 6
  );
  if (activeStorm && game.lastWindCycle !== activeStorm.offset + Math.floor((world.time + activeStorm.offset) / import_config.CONFIG.stormPeriod) * import_config.CONFIG.stormPeriod) {
    game.lastWindCycle = activeStorm.offset + Math.floor((world.time + activeStorm.offset) / import_config.CONFIG.stormPeriod) * import_config.CONFIG.stormPeriod;
    audio.gust(import_config.CONFIG.stormDuration);
  }
  if (game.mode === "tutorial") {
    const storm = world.lanes.get(18);
    if (storm?.hasPassed && !storm.stormActive) game.lessonStorm = true;
  }
  const advance = game.mode === "tutorial" || nextStorm ? 0 : (0, import_config.cameraSpeed)(game.elapsed, game.furthest) * dt;
  const lead = game.mode === "tutorial" || nextStorm ? 0 : Math.min(2.7, game.furthest / 40);
  game.cameraRow = Math.max(game.furthest + lead, game.cameraRow + advance);
  const cameraWarning = document.querySelector("#camera-warning");
  if (cameraWarning) {
    const distance = game.cameraRow - game.row;
    const danger = game.mode !== "tutorial" && !nextStorm && distance > (cameraWarning.hidden ? import_config.CONFIG.cameraWarningAt : import_config.CONFIG.cameraWarningClearAt);
    cameraWarning.hidden = !danger;
  }
  if (game.cameraRow - game.row > import_config.CONFIG.cameraDeathAt) {
    finish("deathCamera");
    return;
  }
  audio.tick(dt);
  if (game.hop) {
    const hop = game.hop;
    if (hop.targetAttachment)
      hop.toX = (0, import_platforms.slotPosition)(
        hop.targetAttachment.platform,
        hop.targetAttachment.slot
      );
    hop.elapsed += dt;
    const u = Math.min(1, hop.elapsed / import_core.HOP_TIME), ease = u * u * (3 - 2 * u);
    world.panda.position.set(
      (hop.fromX + (hop.toX - hop.fromX) * ease) * import_world.CELL,
      hop.fromHeight + (hop.toHeight - hop.fromHeight) * ease + Math.sin(u * Math.PI) * import_config.CONFIG.hopHeight,
      -(hop.fromRow + (hop.toRow - hop.fromRow) * ease) * import_world.CELL
    );
    world.panda.scale.set(
      1 - Math.sin(u * Math.PI) * 0.1,
      1 + Math.sin(u * Math.PI) * 0.16,
      1 - Math.sin(u * Math.PI) * 0.1
    );
    world.panda.userData.head.rotation.z = Math.sin(u * Math.PI) * hop.dx * 0.12;
    world.panda.userData.arms.forEach(
      (arm, i) => arm.rotation.x = Math.sin(u * Math.PI) * (i ? -0.5 : 0.5)
    );
    if (u >= 1) {
      world.panda.scale.setScalar(1);
      landed(hop);
    }
  } else {
    const lane = world.lanes.get(game.row);
    (0, import_bonuses.watchNearMiss)(game, lane);
    if (lane?.type === "water") {
      const platform = game.attachment?.platform;
      if (!platform) {
        finish("deathWater");
        return;
      }
      game.x = (0, import_platforms.slotPosition)(platform, game.attachment.slot);
      if (Math.abs(game.x) > 5.65) {
        finish("deathEdge");
        return;
      }
    }
    if (lane?.type === "road" && (0, import_core.hitsHazard)(game.x, lane.movers)) {
      finish("deathRoad");
      return;
    }
    if ((0, import_storm.stormHits)(lane, game.x, -world.panda.position.z / import_world.CELL)) {
      finish("deathStorm");
      return;
    }
    const height = game.attachment?.platform.height || 0;
    world.panda.position.set(game.x * import_world.CELL, height, -game.row * import_world.CELL);
    world.panda.userData.body.position.y = 0;
    world.panda.userData.arms.forEach(
      (arm) => arm.rotation.x *= Math.exp(-dt * 12)
    );
    game.landing = Math.max(0, game.landing - dt);
    const squash = Math.sin(game.landing / 0.15 * Math.PI) * 0.12;
    world.panda.scale.set(1 + squash * 0.6, 1 - squash, 1 + squash * 0.6);
  }
}
function toggleSound() {
  save.sound = !save.sound;
  audio.enabled = save.sound;
  audio.unlock();
  persist();
  render();
}
const lerp = (a, b, t2) => a + (b - a) * t2;
function refreshWardrobe() {
  for (const button of document.querySelectorAll('[data-action^="outfit-"]')) {
    const id = button.dataset.action.slice(7), c = (0, import_costumes.costumeById)(id);
    button.innerHTML = save.equipped === id ? `${(0, import_menus.icon)("check")}${t("equipped")}` : save.unlocked.includes(id) ? t("equip") : `${(0, import_menus.icon)("bamboo")} ${c.price} · ${t("unlock")}`;
    button.closest(".costume-card").classList.toggle("selected", save.equipped === id);
  }
  const wallet = document.querySelector(".wardrobe-wallet strong");
  if (wallet) wallet.textContent = save.bamboo;
  const menuWallet = document.querySelector(".bamboo-tile strong");
  if (menuWallet) menuWallet.textContent = save.bamboo;
}
(0, import_shop_drag.enableShopDrag)(app);
app.addEventListener("click", (e) => {
  const button = e.target.closest("[data-action]");
  if (!button || game.state === "intro") return;
  const id = button.dataset.action;
  audio.unlock();
  if (id === "play") start(save.tutorial ? "endless" : "tutorial");
  else if (id === "play-direct") start();
  else if (id === "daily") start("daily");
  else if (id === "tutorial") start("tutorial");
  else if (id === "skip") {
    save.tutorial = true;
    persist();
    start();
  } else if (id === "language") openModal("settings");
  else if (id.startsWith("lang-")) {
    save.lang = id.slice(5);
    persist();
    render();
  } else if (id.startsWith("quality-")) {
    save.quality = id.slice(8);
    persist();
    world.quality();
    render();
  } else if (id === "sound" || id === "toggle-sound") toggleSound();
  else if (id === "settings" || id === "wardrobe") openModal(id);
  else if (id === "close-modal") closeModal();
  else if (id === "motion") {
    save.reduced = !save.reduced;
    persist();
    render();
  } else if (id === "pause") {
    if (game.state === "playing") {
      game.state = "paused";
      game.queue = null;
      render();
    }
  } else if (id === "resume") {
    game.state = "playing";
    render();
  } else if (id === "restart") start(game.mode);
  else if (id === "home") menu();
  else if (id === "fullscreen") {
    if (!document.fullscreenElement)
      document.documentElement.requestFullscreen?.().catch(() => {
      });
    else document.exitFullscreen?.().catch(() => {
    });
  } else if (id.startsWith("rotate-")) {
    const preview = world.previews.get(id.slice(7));
    if (preview) preview.angle = (preview.angle ?? -0.3) + Math.PI / 2;
  } else if (id === "cancel-purchase")
    document.querySelector("#purchase-confirm")?.remove();
  else if (id.startsWith("confirm-")) {
    if ((0, import_costumes.purchaseCostume)(save, id.slice(8))) {
      persist();
      world.dress();
      audio.success();
      refreshWardrobe();
    }
    document.querySelector("#purchase-confirm")?.remove();
  } else if (id.startsWith("claim-")) {
    const reward = (0, import_missions.claimMission)(save, id.slice(6));
    if (reward) {
      persist();
      audio.success();
      button.textContent = t("claimed");
      button.disabled = true;
      button.closest(".reward-goal").classList.add("claimed");
      (0, import_celebrations.flyBamboo)(
        button,
        document.querySelector("#total-bamboo"),
        reward,
        import_menus.icon,
        audio,
        save.reduced
      );
    }
  } else if (id.startsWith("outfit-")) {
    const outfit = id.slice(7), cost = (0, import_costumes.costumeById)(outfit).price;
    if (!save.unlocked.includes(outfit)) {
      if (save.bamboo < cost) {
        toast(t("notEnough"));
        return;
      }
      document.querySelector("#purchase-confirm")?.remove();
      const confirm = document.createElement("div");
      confirm.id = "purchase-confirm";
      confirm.innerHTML = panel(
        `<h2 id="dialog-title">${(0, import_costumes.costumeName)(outfit, save.lang)}</h2><p>${t("buyConfirm")}</p><div class="purchase-price">${(0, import_menus.icon)("bamboo")} ${cost}</div><div class="dialog-buttons">${(0, import_menus.action)("confirm-" + outfit, t("buy"), "primary")}${(0, import_menus.action)("cancel-purchase", t("cancel"), "outline")}</div>`,
        "purchase"
      );
      app.append(confirm);
      focusDialog();
      return;
    }
    save.equipped = outfit;
    persist();
    world.dress();
    refreshWardrobe();
  }
});
window.BambooHopSave = Object.freeze({
  identity: () => ({ ...saves.identity }),
  storageKey: () => saves.client?.key || saves.key,
  schemaVersion: 2,
  useIdentity(id, subId) {
    if (game.state !== "menu" || modal)
      throw Error("Kimlik ana menüde değiştirilir");
    saves.identity = (0, import_save_storage.saveIdentity)(id, subId);
    hydrateSave(saves.read());
  },
  configureDatabase(adapter, autoSync = false) {
    if (!adapter || typeof adapter.load !== "function" || typeof adapter.save !== "function")
      throw Error("load ve save işlevleri gerekli");
    saves.adapter = adapter;
    saves.autoSync = autoSync === true;
  },
  async loadRemote() {
    if (game.state !== "menu" || modal)
      throw Error("Kayıt ana menüde yüklenir");
    const progress = await saves.loadRemote();
    if (game.state !== "menu" || modal)
      throw Error("Yükleme sırasında oyun başladı");
    if (progress) hydrateSave(progress);
    return !!progress;
  },
  pushRemote: () => saves.push(save),
  syncStatus: () => ({ error: saves.lastError }),
  read: () => JSON.parse(JSON.stringify(save)),
  record: () => saves.record(save),
  export: () => (0, import_save.exportSave)(save, saves.identity),
  import(text) {
    if (game.state !== "menu")
      throw Error("Kayıt yalnızca ana menüde yüklenir");
    if (typeof text !== "string" || text.length > 1e5)
      throw Error("Geçersiz kayıt boyutu");
    Object.assign(save, (0, import_save.importSave)(text));
    (0, import_missions.ensureDaily)(save);
    audio.enabled = save.sound;
    persist();
    world.dress();
    world.quality();
    if (game.state === "menu") world.showMenu();
    render();
  }
});
(0, import_controls.bindControls)({
  canvas,
  game,
  move,
  render,
  closeModal,
  getModal: () => modal,
  getWorld: () => world,
  toast,
  t
});
async function boot() {
  try {
    let frame = function(now) {
      requestAnimationFrame(frame);
      const elapsed = (now - last) / 1e3;
      const dt = Math.min(elapsed, 0.04);
      world.budget.sample(
        elapsed,
        !document.hidden && game.state === "playing" && !modal
      );
      last = now;
      world.update(dt, game);
      update(dt);
    };
    const loading = document.querySelector("#loading");
    const fill = document.querySelector("#loading-fill");
    const track = document.querySelector("#loading-progress");
    const paint = () => new Promise(
      (resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))
    );
    async function progress(value) {
      const previous = fill.style.width || "0%";
      fill.style.width = `${value}%`;
      track.setAttribute("aria-valuenow", value);
      await fill.animate([{ width: previous }, { width: `${value}%` }], {
        duration: save.reduced ? 0 : 140,
        easing: "ease-out"
      }).finished;
      await paint();
    }
    document.querySelector("#loading-label").textContent = t("loading");
    await progress(12);
    await document.fonts.ready;
    await progress(30);
    world = new import_world.ForestWorld(canvas, save);
    game.seed = world.seed;
    await progress(72);
    await world.renderer.compileAsync(world.scene, world.camera);
    render();
    world.update(0, game);
    await progress(100);
    loading.remove();
    let last = performance.now();
    requestAnimationFrame(frame);
    window.__bamboo = {
      get state() {
        return {
          state: game.state,
          mode: game.mode,
          x: game.x,
          row: game.row,
          score: game.furthest,
          coins: game.coins,
          tutStep: game.tutStep,
          seed: game.seed,
          hop: !!game.hop,
          lanes: [...world.lanes.values()].filter((l) => l.index >= game.row - 1 && l.index <= game.row + 5).map((l) => ({
            row: l.index,
            type: l.type,
            obstacles: l.obstacles,
            movers: l.movers.map((m) => ({ x: m.x, length: m.length })),
            coins: l.coins.filter((c) => !c.collected).map((c) => c.x)
          }))
        };
      },
      get rendering() {
        return {
          frameMs: world.budget.frameMs,
          resolutionScale: world.budget.scale,
          quality: save.quality,
          protocol: location.protocol,
          calls: world.renderer.info.render.calls,
          triangles: world.renderer.info.render.triangles,
          geometries: world.renderer.info.memory.geometries,
          textures: world.renderer.info.memory.textures
        };
      }
    };
  } catch (error) {
    console.error(error);
    document.querySelector("#loading").innerHTML = `<span class="loading-panda">🐼</span><strong>${t("loadingError")}</strong><button onclick="location.reload()" class="primary">${t("reload")}</button>`;
  }
}
boot();

});

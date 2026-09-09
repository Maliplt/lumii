BambooModules.define("menus.js", function(require, module, exports) {
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var menus_exports = {};
__export(menus_exports, {
  action: () => action,
  flag: () => flag,
  icon: () => icon,
  menuHTML: () => menuHTML,
  resultsHTML: () => resultsHTML,
  settingsHTML: () => settingsHTML,
  wardrobeHTML: () => wardrobeHTML
});
module.exports = __toCommonJS(menus_exports);
var import_config = require("./config.js");
var import_costumes = require("./costumes.js");
var import_missions = require("./missions.js");
const icons = {
  retry: '<path d="M4 9a8 8 0 1 1 0 7M4 3v6h6"/>',
  leaf: '<path d="M20 4C11 3 4 7 5 14c1 6 10 7 13 1 2-4 2-8 2-11Z"/><path d="m4 21 11-12M9 16l-1-5m5 1 4 1"/>',
  arrow: '<path d="M5 12h14m-6-6 6 6-6 6"/>',
  cup: '<path d="M8 3h8v6a4 4 0 0 1-8 0V3Zm0 2H4v3a4 4 0 0 0 4 4m8-7h4v3a4 4 0 0 1-4 4m-4 1v6m-4 2h8"/>',
  sound: '<path d="m11 4-6 5H2v6h3l6 5V4Zm4 4a6 6 0 0 1 0 8m3-11a10 10 0 0 1 0 14"/>',
  mute: '<path d="m11 4-6 5H2v6h3l6 5V4Zm5 5 6 6m0-6-6 6"/>',
  gear: '<path d="m9 3-1 3-3 1-2 3 2 3v4l4 1 3 3 3-3 4-1v-4l2-3-2-3-3-1-1-3H9Z"/><circle cx="12" cy="11" r="3"/>',
  pause: '<path d="M8 5v14M16 5v14"/>',
  close: '<path d="m6 6 12 12M18 6 6 18"/>',
  back: '<path d="M19 12H5m6-6-6 6 6 6"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1 1m12 12 1 1M5 19l1-1M18 6l1-1"/>',
  home: '<path d="m3 11 9-8 9 8M5 10v11h14V10M10 21v-7h4v7"/>',
  check: '<path d="m5 12 4 4L19 6"/>',
  fullscreen: '<path d="M9 3H3v6m12-6h6v6M3 15v6h6m12-6v6h-6"/>',
  bamboo: '<path d="M9 22V3m6 19V7M6 8h6m-6 7h6m0-4h6m-6 7h6M9 5C4 5 3 2 3 2c4-1 6 1 6 3Zm6 5c0-4 3-5 6-5-1 4-3 5-6 5Z"/>',
  book: '<path d="M12 5C8 2 4 3 2 4v15c3-1 7-1 10 1 3-2 7-2 10-1V4c-2-1-6-2-10 1Zm0 0v15"/>',
  cabin: '<path d="m2 11 10-8 10 8M5 10v11h14V10M10 21v-7h4v7M3 21h18"/>',
  flag: '<path d="M5 22V3m0 1c5-4 9 4 15 0v10c-6 4-10-4-15 0"/>',
  storm: '<path d="M6 14a4 4 0 1 1 0-8 6 6 0 0 1 11-1 4.5 4.5 0 1 1 1 9M12 13l-3 5h4l-2 5 7-8h-5l2-4"/>'
};
const icon = (name, cls = "") => `<svg class="icon ${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${icons[name] || icons.leaf}</svg>`;
const action = (id, content, cls = "", label = "") => `<button data-action="${id}" class="${cls}" ${label ? `aria-label="${label}" title="${label}"` : ""}>${content}</button>`;
const flagParts = {
  tr: '<path fill="#e53d3c" d="M0 0h30v20H0z"/><circle fill="white" cx="12" cy="10" r="6"/><circle fill="#e53d3c" cx="14" cy="9" r="5"/><path fill="white" d="m20 6 1 3 3 1-3 1-1 3-1-3-3-1 3-1z"/>',
  en: '<path fill="#214779" d="M0 0h30v20H0z"/><path stroke="white" stroke-width="4" d="m0 0 30 20M30 0 0 20"/><path stroke="#c44340" stroke-width="1.5" d="m0 0 30 20M30 0 0 20"/><path stroke="white" stroke-width="7" d="M15 0v20M0 10h30"/><path stroke="#c44340" stroke-width="4" d="M15 0v20M0 10h30"/>',
  fr: '<path fill="#285190" d="M0 0h10v20H0z"/><path fill="#fff" d="M10 0h10v20H10z"/><path fill="#e65a54" d="M20 0h10v20H20z"/>',
  it: '<path fill="#38865b" d="M0 0h10v20H0z"/><path fill="#fff" d="M10 0h10v20H10z"/><path fill="#dc514e" d="M20 0h10v20H20z"/>',
  ar: '<path fill="#278153" d="M0 0h30v7H0z"/><path fill="#fff" d="M0 7h30v6H0z"/><path fill="#242c29" d="M0 13h30v7H0z"/><path fill="#d94c43" d="M0 0h8v20H0z"/>'
};
function flag(code) {
  return `<svg class="flag-image" viewBox="0 0 30 20" aria-hidden="true">${flagParts[code]}</svg>`;
}
function menuHTML(t, save, action2, icon2, utility) {
  return `<div class="menu-wash"></div>
    <header class="topbar"><div class="brand">${icon2("leaf")}<span>bamboohop</span></div>${utility}</header>
    <main class="home-menu">
      <h1>BAMBOO<br><span>HOP<span class="title-dot">.</span></span></h1>
      <div class="home-stats">
        <div class="stat-tile">${icon2("cup")}<span><small>${t("best")}</small><strong>${save.best}</strong></span></div>
        <div class="stat-tile bamboo-tile">${icon2("bamboo")}<span><small>${t("bamboo")}</small><strong>${save.bamboo}</strong></span></div>
      </div>
      <div class="home-buttons">
        ${action2("play", `${t("play")}${icon2("arrow")}`, "primary")}
        ${action2("daily", `${icon2("sun")}${t("daily")}`, "daily")}
        <div class="home-secondary">${action2("wardrobe", `${icon2("cabin")}${t("wardrobe")}`, "outline")}${action2("tutorial", icon2("book"), "outline help-button", t("tutorial"))}</div>
      </div>
    </main>`;
}
function settingsHTML(t, save, action2, icon2) {
  return `<h2 id="dialog-title">${t("settings")}</h2>
    <section class="setting-group"><h3>${t("language")}</h3><div class="language-grid" role="group" aria-label="${t("language")}">
      ${["tr", "en", "fr", "it", "ar"].map((code) => `<button data-action="lang-${code}" class="language-choice ${save.lang === code ? "selected" : ""}" aria-pressed="${save.lang === code}">${flag(code)}<span>${code.toUpperCase()}</span></button>`).join("")}
    </div></section>
    <section class="setting-group"><h3>${t("quality")}</h3><div class="segmented" role="group" aria-label="${t("quality")}">
      ${["high", "low"].map((mode) => `<button data-action="quality-${mode}" class="${save.quality === mode ? "selected" : ""}" aria-pressed="${save.quality === mode}">${icon2(mode === "high" ? "sun" : "leaf")}${t(mode)}</button>`).join("")}
    </div></section>
    <div class="setting-row"><span>${t("sound")}</span><button class="toggle ${save.sound ? "active" : ""}" data-action="toggle-sound" aria-pressed="${save.sound}">${t(save.sound ? "on" : "off")}</button></div>
    <div class="setting-row"><span>${t("motion")}</span><button class="toggle ${save.reduced ? "active" : ""}" data-action="motion" aria-pressed="${save.reduced}">${t(save.reduced ? "on" : "off")}</button></div>
    `;
}
function wardrobeHTML(t, save, action2, icon2) {
  return `<div class="wardrobe-heading"><h2 id="dialog-title">${t("wardrobe")}</h2><div class="wardrobe-wallet">${icon2("bamboo")}<strong>${save.bamboo}</strong></div></div>
    <div class="costume-gallery">${import_config.CONFIG.costumes.map(
    ({
      id,
      price
    }) => `<article class="costume-card ${save.equipped === id ? "selected" : ""}">
      <button data-action="rotate-${id}" data-preview="${id}" class="costume-preview" aria-label="${(0, import_costumes.costumeName)(id, save.lang)} · ${t("rotate")}"><img alt="" draggable="false" /></button>
      <h3>${(0, import_costumes.costumeName)(id, save.lang)}</h3>
      ${action2(`outfit-${id}`, save.equipped === id ? `${icon2("check")}${t("equipped")}` : save.unlocked.includes(id) ? t("equip") : `${icon2("bamboo")} ${price} · ${t("unlock")}`, "outfit-button")}
    </article>`
  ).join("")}</div>`;
}
function resultsHTML(t, save, game, action2, icon2) {
  const completed = game.mode === "tutorial" && game.finished;
  return `<h2 id="dialog-title">${t(completed ? "tutDone" : game.wasRecord ? "record" : "overTitle")}</h2>
    <div class="result-score ${game.wasRecord ? "record-prize" : ""}"><b id="result-count">0</b><span>${t("step")}</span></div>
    <div class="score-progress"><i id="result-fill"></i></div>
    <div class="result-wallet">${icon2("bamboo")}<span>${t("totalBamboo")}</span><strong id="total-bamboo">${save.bamboo}</strong></div>
    <div class="result-stats"><div>${icon2("bamboo")}<strong>+${game.coins + (game.reward || 0)}</strong><small>${t("bamboo")}</small></div><div>${icon2("cup")}<strong>${game.mode === "daily" ? save.daily[game.seed] || 0 : save.best}</strong><small>${t("best")}</small></div></div>
    ${game.mode === "tutorial" ? "" : `<div class="reward-goals"><h3>${t("dailyGoals")}</h3><p id="mission-clock"></p>${(0, import_missions.ensureDaily)(
    save
  ).map((goal, i) => {
    const done = save.missionProgress[goal.field] >= goal.target, claimed = save.claimed.includes(goal.id);
    return `<div class="reward-goal ${done ? "complete" : ""}"><span>${done ? icon2("check") : icon2("flag")}<span>${t(goal.key).replace("{n}", goal.target)}<small>${Math.min(goal.target, save.missionProgress[goal.field])} / ${goal.target}</small></span></span><b>+${goal.reward}${icon2("bamboo")}</b><button data-action="claim-${goal.id}" ${!done || claimed ? "disabled" : ""}>${t(claimed ? "claimed" : "claim")}</button></div>`;
  }).join("")}</div>`}
    <div class="dialog-buttons">${action2(completed ? "play-direct" : "restart", `<span>${t(completed ? "finishTutorial" : "again")}</span>${icon2(completed ? "arrow" : "retry")}`, "primary result-retry")}${action2("home", t("home"), "outline")}</div>`;
}

});

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
  flag: () => flag,
  menuHTML: () => menuHTML,
  resultsHTML: () => resultsHTML,
  settingsHTML: () => settingsHTML,
  wardrobeHTML: () => wardrobeHTML
});
module.exports = __toCommonJS(menus_exports);
var import_config = require("./config.js");
var import_costumes = require("./costumes.js");
var import_missions = require("./missions.js");
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
function menuHTML(t, save, action, icon, utility) {
  return `<div class="menu-wash"></div>
    <header class="topbar"><div class="brand">${icon("leaf")}<span>bamboohop</span></div>${utility}</header>
    <main class="home-menu">
      <h1>BAMBOO<br><span>HOP<span class="title-dot">.</span></span></h1>
      <div class="home-stats">
        <div class="stat-tile">${icon("cup")}<span><small>${t("best")}</small><strong>${save.best}</strong></span></div>
        <div class="stat-tile bamboo-tile">${icon("bamboo")}<span><small>${t("bamboo")}</small><strong>${save.bamboo}</strong></span></div>
      </div>
      <div class="home-buttons">
        ${action("play", `${t("play")}${icon("arrow")}`, "primary")}
        ${action("daily", `${icon("sun")}${t("daily")}`, "daily")}
        <div class="home-secondary">${action("wardrobe", `${icon("cabin")}${t("wardrobe")}`, "outline")}${action("tutorial", icon("book"), "outline help-button", t("tutorial"))}</div>
      </div>
    </main>`;
}
function settingsHTML(t, save, action, icon) {
  return `<h2 id="dialog-title">${t("settings")}</h2>
    <section class="setting-group"><h3>${t("language")}</h3><div class="language-grid" role="group" aria-label="${t("language")}">
      ${["tr", "en", "fr", "it", "ar"].map((code) => `<button data-action="lang-${code}" class="language-choice ${save.lang === code ? "selected" : ""}" aria-pressed="${save.lang === code}">${flag(code)}<span>${code.toUpperCase()}</span></button>`).join("")}
    </div></section>
    <section class="setting-group"><h3>${t("quality")}</h3><div class="segmented" role="group" aria-label="${t("quality")}">
      ${["high", "low"].map((mode) => `<button data-action="quality-${mode}" class="${save.quality === mode ? "selected" : ""}" aria-pressed="${save.quality === mode}">${icon(mode === "high" ? "sun" : "leaf")}${t(mode)}</button>`).join("")}
    </div></section>
    <div class="setting-row"><span>${t("sound")}</span><button class="toggle ${save.sound ? "active" : ""}" data-action="toggle-sound" aria-pressed="${save.sound}">${t(save.sound ? "on" : "off")}</button></div>
    <div class="setting-row"><span>${t("motion")}</span><button class="toggle ${save.reduced ? "active" : ""}" data-action="motion" aria-pressed="${save.reduced}">${t(save.reduced ? "on" : "off")}</button></div>
    `;
}
function wardrobeHTML(t, save, action, icon) {
  return `<div class="wardrobe-heading"><h2 id="dialog-title">${t("wardrobe")}</h2><div class="wardrobe-wallet">${icon("bamboo")}<strong>${save.bamboo}</strong></div></div>
    <div class="costume-gallery">${import_config.CONFIG.costumes.map(
    ({
      id,
      price
    }) => `<article class="costume-card ${save.equipped === id ? "selected" : ""}">
      <button data-action="rotate-${id}" data-preview="${id}" class="costume-preview" aria-label="${(0, import_costumes.costumeName)(id, save.lang)} · ${t("rotate")}"><img alt="" draggable="false" /></button>
      <h3>${(0, import_costumes.costumeName)(id, save.lang)}</h3>
      ${action(`outfit-${id}`, save.equipped === id ? `${icon("check")}${t("equipped")}` : save.unlocked.includes(id) ? t("equip") : `${icon("bamboo")} ${price} · ${t("unlock")}`, "outfit-button")}
    </article>`
  ).join("")}</div>`;
}
function resultsHTML(t, save, game, action, icon) {
  const completed = game.mode === "tutorial" && game.finished;
  return `<h2 id="dialog-title">${t(completed ? "tutDone" : game.wasRecord ? "record" : "overTitle")}</h2>
    <div class="result-score ${game.wasRecord ? "record-prize" : ""}"><b id="result-count">0</b><span>${t("step")}</span></div>
    <div class="score-progress"><i id="result-fill"></i></div>
    <div class="result-wallet">${icon("bamboo")}<span>${t("totalBamboo")}</span><strong id="total-bamboo">${save.bamboo}</strong></div>
    <div class="result-stats"><div>${icon("bamboo")}<strong>+${game.coins + (game.reward || 0)}</strong><small>${t("bamboo")}</small></div><div>${icon("cup")}<strong>${game.mode === "daily" ? save.daily[game.seed] || 0 : save.best}</strong><small>${t("best")}</small></div></div>
    ${game.mode === "tutorial" ? "" : `<div class="reward-goals"><h3>${t("dailyGoals")}</h3><p id="mission-clock"></p>${(0, import_missions.ensureDaily)(
    save
  ).map((goal, i) => {
    const done = save.missionProgress[goal.field] >= goal.target, claimed = save.claimed.includes(goal.id);
    return `<div class="reward-goal ${done ? "complete" : ""}"><span>${done ? icon("check") : icon("flag")}<span>${t(goal.key).replace("{n}", goal.target)}<small>${Math.min(goal.target, save.missionProgress[goal.field])} / ${goal.target}</small></span></span><b>+${goal.reward}${icon("bamboo")}</b><button data-action="claim-${goal.id}" ${!done || claimed ? "disabled" : ""}>${t(claimed ? "claimed" : "claim")}</button></div>`;
  }).join("")}</div>`}
    <div class="dialog-buttons">${action(completed ? "play-direct" : "restart", `<span>${t(completed ? "finishTutorial" : "again")}</span>${icon(completed ? "arrow" : "retry")}`, "primary result-retry")}${action("home", t("home"), "outline")}</div>`;
}

});

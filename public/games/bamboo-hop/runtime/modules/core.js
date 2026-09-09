BambooModules.define("core.js", function(require, module, exports) {
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
var core_exports = {};
__export(core_exports, {
  HOP_TIME: () => HOP_TIME,
  WIDTH: () => WIDTH,
  dailySeed: () => dailySeed,
  defaultSave: () => defaultSave,
  hitsHazard: () => hitsHazard,
  laneSpec: () => laneSpec,
  onPlatform: () => onPlatform,
  random: () => import_random.random,
  readSave: () => readSave,
  validMove: () => validMove,
  wrap: () => wrap
});
module.exports = __toCommonJS(core_exports);
var import_config = require("./config.js");
var import_costumes = require("./costumes.js");
var import_map = require("./map.js");
var import_random = require("./random.js");
const WIDTH = 5;
const HOP_TIME = import_config.CONFIG.hopDuration;
const laneSpec = import_map.createLaneSpec;
function dailySeed(date = /* @__PURE__ */ new Date()) {
  return Number(
    `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, "0")}${String(date.getDate()).padStart(2, "0")}`
  );
}
function wrap(value, min, max) {
  return ((value - min) % (max - min) + (max - min)) % (max - min) + min;
}
function onPlatform(x, platforms) {
  return platforms.find((p) => Math.abs(x - p.x) < p.length / 2 - 0.1);
}
function hitsHazard(x, hazards) {
  return hazards.some((p) => Math.abs(x - p.x) < p.length / 2 + 0.22);
}
function validMove(x, row, currentRow, furthest, obstacles = []) {
  return x >= -WIDTH && x <= WIDTH && row >= 0 && row >= furthest - 5 && row >= currentRow - 1 && !obstacles.some((o) => Math.abs(o - x) < 0.65);
}
const defaultSave = () => ({
  best: 0,
  bamboo: 0,
  total: 0,
  runs: 0,
  lang: "tr",
  sound: true,
  quality: "high",
  reduced: false,
  tutorial: false,
  equipped: "scarf",
  unlocked: ["scarf"],
  daily: {},
  missionDay: "",
  missionProgress: { steps: 0, coins: 0, runs: 0 },
  claimed: []
});
function readSave(storage) {
  const fresh = defaultSave();
  try {
    const a = JSON.parse(storage.getItem("bamboo-hop"));
    if (!a || typeof a !== "object") return fresh;
    for (const key of ["best", "bamboo", "total", "runs"])
      if (Number.isFinite(a[key]) && a[key] >= 0)
        fresh[key] = Math.floor(a[key]);
    for (const key of ["sound", "reduced", "tutorial"])
      if (typeof a[key] === "boolean") fresh[key] = a[key];
    if (["tr", "en", "fr", "it", "ar"].includes(a.lang)) fresh.lang = a.lang;
    if (["high", "low"].includes(a.quality)) fresh.quality = a.quality;
    if (Array.isArray(a.unlocked))
      fresh.unlocked = [
        .../* @__PURE__ */ new Set([
          "scarf",
          ...a.unlocked.filter((id) => import_costumes.COSTUMES.some((c) => c.id === id))
        ])
      ];
    if (fresh.unlocked.includes(a.equipped)) fresh.equipped = a.equipped;
    if (a.daily && typeof a.daily === "object")
      fresh.daily = Object.fromEntries(
        Object.entries(a.daily).filter(
          ([k, v]) => /^\d{8}$/.test(k) && Number.isFinite(v) && v >= 0
        )
      );
    if (/^\d{8}$/.test(a.missionDay)) fresh.missionDay = a.missionDay;
    for (const k of ["steps", "coins", "runs"])
      if (Number.isFinite(a.missionProgress?.[k]) && a.missionProgress[k] >= 0)
        fresh.missionProgress[k] = Math.floor(a.missionProgress[k]);
    if (Array.isArray(a.claimed))
      fresh.claimed = [
        ...new Set(
          a.claimed.filter((id) => ["steps", "coins", "runs"].includes(id))
        )
      ];
    return fresh;
  } catch {
    return fresh;
  }
}

});

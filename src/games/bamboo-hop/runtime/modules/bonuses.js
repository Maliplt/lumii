BambooModules.define("bonuses.js", function(require, module, exports) {
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
var bonuses_exports = {};
__export(bonuses_exports, {
  collectStreak: () => collectStreak,
  leaveRoad: () => leaveRoad,
  resetBonuses: () => resetBonuses,
  watchNearMiss: () => watchNearMiss
});
module.exports = __toCommonJS(bonuses_exports);
var import_config = require("./config.js");
function resetBonuses(game) {
  game.streak = 0;
  game.lastWindCycle = null;
  game.lastBambooTime = -Infinity;
  game.closeRoads = /* @__PURE__ */ new Set();
  game.rewardedRoads = /* @__PURE__ */ new Set();
}
function collectStreak(game) {
  if (game.mode === "tutorial") return 0;
  game.streak = game.elapsed - game.lastBambooTime <= import_config.CONFIG.bambooStreakSeconds ? game.streak + 1 : 1;
  game.lastBambooTime = game.elapsed;
  if (game.streak < import_config.CONFIG.bambooStreakTarget) return 0;
  game.streak = 0;
  return import_config.CONFIG.bambooStreakReward;
}
function watchNearMiss(game, lane) {
  if (game.mode === "tutorial" || lane?.type !== "road") return;
  const gap = Math.min(
    ...lane.movers.map((m) => Math.abs(game.x - m.x) - m.length / 2 - 0.22)
  );
  if (gap > 0 && gap < 0.45) game.closeRoads.add(lane.index);
}
function leaveRoad(game, hop) {
  if (hop.toRow <= hop.fromRow || !game.closeRoads.has(hop.fromRow) || game.rewardedRoads.has(hop.fromRow))
    return 0;
  game.rewardedRoads.add(hop.fromRow);
  return import_config.CONFIG.nearMissReward;
}

});

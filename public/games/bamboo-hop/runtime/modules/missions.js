BambooModules.define("missions.js", function(require, module, exports) {
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
var missions_exports = {};
__export(missions_exports, {
  claimMission: () => claimMission,
  dailyMissions: () => dailyMissions,
  dayKey: () => dayKey,
  ensureDaily: () => ensureDaily,
  recordRun: () => recordRun
});
module.exports = __toCommonJS(missions_exports);
var import_random = require("./random.js");
function dayKey(date = /* @__PURE__ */ new Date()) {
  return `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, "0")}${String(date.getDate()).padStart(2, "0")}`;
}
function dailyMissions(day = dayKey()) {
  const r = (0, import_random.random)(Number(day));
  const steps = 25 + Math.floor(r() * 4) * 5, coins = 5 + Math.floor(r() * 4), runs = 2 + Math.floor(r() * 3);
  return [
    {
      id: "steps",
      field: "steps",
      target: steps,
      reward: 8,
      key: "dailySteps"
    },
    {
      id: "coins",
      field: "coins",
      target: coins,
      reward: 6,
      key: "dailyCoins"
    },
    { id: "runs", field: "runs", target: runs, reward: 5, key: "dailyRuns" }
  ];
}
function ensureDaily(save, day = dayKey()) {
  if (save.missionDay !== day) {
    save.missionDay = day;
    save.missionProgress = { steps: 0, coins: 0, runs: 0 };
    save.claimed = [];
  }
  return dailyMissions(day);
}
function recordRun(save, run, day = dayKey()) {
  ensureDaily(save, day);
  save.missionProgress.steps = Math.max(
    save.missionProgress.steps,
    run.furthest
  );
  save.missionProgress.coins += run.coins;
  save.missionProgress.runs++;
}
function claimMission(save, id, day = dayKey()) {
  const goal = ensureDaily(save, day).find((g) => g.id === id);
  if (!goal || save.claimed.includes(id) || save.missionProgress[goal.field] < goal.target)
    return 0;
  save.claimed.push(id);
  save.bamboo += goal.reward;
  return goal.reward;
}

});

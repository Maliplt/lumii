BambooModules.define("config.js", function(require, module, exports) {
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
var config_exports = {};
__export(config_exports, {
  CONFIG: () => CONFIG,
  cameraSpeed: () => cameraSpeed,
  stormPhase: () => stormPhase
});
module.exports = __toCommonJS(config_exports);
var import_costumes = require("./costumes.js");
const CONFIG = Object.freeze({
  hopDuration: 0.18,
  hopHeight: 0.42,
  cameraStartSpeed: 0.12,
  cameraMaxSpeed: 1.05,
  cameraAccelerationSeconds: 55,
  cameraWarningAt: 4.8,
  cameraWarningClearAt: 4.45,
  cameraDeathAt: 5.8,
  weatherStep: 35,
  deathDuration: 0.72,
  introDuration: 0.9,
  stormPeriod: 9,
  stormWarning: 1.6,
  stormDuration: 4,
  bambooStreakSeconds: 9,
  bambooStreakTarget: 3,
  bambooStreakReward: 2,
  nearMissReward: 1,
  costumes: import_costumes.COSTUMES
});
function cameraSpeed(seconds, score = 0) {
  const progress = 1 - Math.exp(-(seconds + score * 0.7) / CONFIG.cameraAccelerationSeconds);
  return Math.min(
    CONFIG.cameraMaxSpeed,
    CONFIG.cameraStartSpeed + (CONFIG.cameraMaxSpeed - CONFIG.cameraStartSpeed) * progress
  );
}
function stormPhase(time, offset = 0) {
  const phase = ((time + offset) % CONFIG.stormPeriod + CONFIG.stormPeriod) % CONFIG.stormPeriod;
  return {
    warning: phase < CONFIG.stormWarning,
    active: phase >= CONFIG.stormWarning && phase < CONFIG.stormWarning + CONFIG.stormDuration,
    progress: (phase - CONFIG.stormWarning) / CONFIG.stormDuration,
    countdown: Math.ceil(CONFIG.stormWarning - phase)
  };
}

});

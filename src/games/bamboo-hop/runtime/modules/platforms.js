BambooModules.define("platforms.js", function(require, module, exports) {
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
var platforms_exports = {};
__export(platforms_exports, {
  adjacentSlot: () => adjacentSlot,
  landingSlot: () => landingSlot,
  slotPosition: () => slotPosition,
  slots: () => slots
});
module.exports = __toCommonJS(platforms_exports);
function slots(platform) {
  const count = platform.blocks || 1;
  return Array.from({ length: count }, (_, slot) => ({
    platform,
    slot,
    x: platform.x + slot - (count - 1) / 2
  }));
}
function slotPosition(platform, slot) {
  return platform.x + slot - ((platform.blocks || 1) - 1) / 2;
}
function landingSlot(x, platforms, timeAhead = 0) {
  let best = null, distance = Infinity;
  for (const p of platforms)
    for (const s of slots(p)) {
      const target = s.x + (p.speed || 0) * timeAhead, delta = Math.abs(target - x);
      if (delta <= 0.53 && delta < distance) {
        best = { platform: p, slot: s.slot, x: target };
        distance = delta;
      }
    }
  return best;
}
function adjacentSlot(attachment, direction) {
  const next = attachment.slot + direction;
  if (next < 0 || next >= (attachment.platform.blocks || 1)) return null;
  return {
    platform: attachment.platform,
    slot: next,
    x: slotPosition(attachment.platform, next)
  };
}

});

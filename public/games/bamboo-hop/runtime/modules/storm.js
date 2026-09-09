BambooModules.define("storm.js", function(require, module, exports) {
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
var storm_exports = {};
__export(storm_exports, {
  STORM: () => STORM,
  stormCenter: () => stormCenter,
  stormHits: () => stormHits
});
module.exports = __toCommonJS(storm_exports);
const STORM = Object.freeze({
  halfLength: 18,
  travel: 29,
  rowInset: 0.055
});
function stormCenter(progress) {
  return -STORM.travel + progress * STORM.travel * 2;
}
function stormHits(lane, x, row) {
  return lane?.type === "storm" && lane.stormActive && Math.abs(row - lane.index) < 0.5 - STORM.rowInset && Math.abs(x - lane.stormX) < STORM.halfLength;
}

});

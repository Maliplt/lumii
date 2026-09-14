BambooModules.define("traffic.js", function(require, module, exports) {
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
var traffic_exports = {};
__export(traffic_exports, {
  advanceTraffic: () => advanceTraffic
});
module.exports = __toCommonJS(traffic_exports);
var import_core = require("./core.js");
function advanceTraffic(lane, dt) {
  const changes = lane.movers.map((m) => {
    if (m.fixed) return { m, speed: 0 };
    if (!m.cruise) return { m, speed: m.speed };
    const direction = Math.sign(m.cruise);
    let gap = 32, leader = null;
    for (const other of lane.movers)
      if (other !== m) {
        const distance = (0, import_core.wrap)((other.x - m.x) * direction, 0, 32) - (m.length + other.length) / 2;
        if (distance < gap) {
          gap = distance;
          leader = other;
        }
      }
    const target = Math.min(
      Math.abs(m.cruise),
      Math.max(0.18, Math.abs(leader?.speed || 0) + (gap - 0.55) * 2.4)
    );
    const speed = Math.abs(m.speed) + (target - Math.abs(m.speed)) * (1 - Math.exp(-dt * (target < Math.abs(m.speed) ? 18 : 3)));
    return {
      m,
      speed: direction * Math.min(speed, Math.max(0, gap - 0.3) / Math.max(dt, 1e-3))
    };
  });
  for (const { m, speed } of changes) {
    m.speed = speed;
    if (!m.fixed) m.x = (0, import_core.wrap)(m.x + speed * dt, -16, 16);
  }
}

});

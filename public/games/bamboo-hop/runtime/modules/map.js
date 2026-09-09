BambooModules.define("map.js", function(require, module, exports) {
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
var map_exports = {};
__export(map_exports, {
  TUTORIAL_END: () => TUTORIAL_END,
  TUTORIAL_LAYOUT: () => TUTORIAL_LAYOUT,
  createLaneSpec: () => createLaneSpec,
  sectionAt: () => sectionAt
});
module.exports = __toCommonJS(map_exports);
var import_random = require("./random.js");
const TUTORIAL_END = 23;
const TUTORIAL_LAYOUT = Object.freeze([
  "grass",
  "grass",
  "grass",
  "grass",
  "grass",
  "grass",
  "grass",
  "grass",
  "water",
  "water",
  "water",
  "grass",
  "grass",
  "road",
  "road",
  "grass",
  "grass",
  "grass",
  "storm",
  "storm",
  "grass",
  "grass",
  "grass",
  "finish"
]);
const cache = /* @__PURE__ */ new Map();
function sectionAt(index, seed, tutorial = false) {
  if (tutorial) {
    const type = TUTORIAL_LAYOUT[index] || "grass";
    return {
      type,
      start: type === "water" ? 8 : type === "road" ? 13 : type === "storm" ? 18 : index,
      length: type === "water" ? 3 : ["road", "storm"].includes(type) ? 2 : 1,
      rest: index === 9,
      finish: index === TUTORIAL_END
    };
  }
  if (index < 3) return { type: "grass", start: 0, length: 3 };
  if (!cache.has(seed)) {
    if (cache.size > 8) cache.delete(cache.keys().next().value);
    cache.set(seed, {
      rng: (0, import_random.random)(seed ^ 3297651),
      segments: [],
      end: 3,
      n: 0
    });
  }
  const plan = cache.get(seed);
  while (plan.end <= index) {
    const type = plan.n++ % 4 === 2 ? "storm" : plan.rng() < 0.52 ? "road" : "water";
    const difficulty = Math.min(1, plan.end / 95);
    const length = type === "storm" ? 2 + (difficulty > 0.55 && plan.rng() > 0.6 ? 2 : 0) : 2 + Math.floor(plan.rng() * (difficulty > 0.3 ? 4 : 3));
    plan.segments.push({
      type,
      start: plan.end,
      length,
      rest: type === "water" && length >= 4 ? plan.end + Math.floor(length / 2) : -1
    });
    plan.end += length;
    const safe = 2 + (plan.rng() > 0.75 ? 1 : 0);
    plan.segments.push({ type: "grass", start: plan.end, length: safe });
    plan.end += safe;
  }
  const section = plan.segments.find(
    (s) => index >= s.start && index < s.start + s.length
  );
  return { ...section, rest: section.rest === index };
}
function createLaneSpec(index, seed, tutorial = false) {
  const section = sectionAt(index, seed, tutorial), rng = (0, import_random.random)(seed + index * 7919);
  const direction = (index + Math.abs(seed % 2)) % 2 === 0 ? 1 : -1;
  const difficulty = 1 - Math.exp(-Math.max(0, index) / 70);
  const speed = section.type === "water" ? (0.65 + rng() * 1.1 + difficulty * 0.6) * direction : (1.25 + rng() * 2.1 + difficulty * 1.7) * direction;
  const obstacles = [];
  if (section.type === "grass" && index > 3 && !tutorial) {
    for (let x = -5; x <= 5; x++)
      if (x !== 0 && rng() < 0.13) obstacles.push(x);
  }
  let coinX = Math.floor(rng() * 9) - 4;
  if (obstacles.includes(coinX)) coinX = 0;
  if (tutorial) coinX = index === 6 ? 1 : 0;
  return {
    ...section,
    index,
    speed,
    offset: rng() * 6,
    obstacles,
    coinX,
    variant: rng(),
    tutorial,
    hasCoin: tutorial ? index === 6 || index === 10 : index > 1 && !["storm", "finish"].includes(section.type) && (index % 3 === 0 || section.type === "water"),
    blockPattern: [0, 1, 2, 3].map(
      (i) => tutorial ? 3 : 1 + Math.floor(rng() * 5)
    )
  };
}

});

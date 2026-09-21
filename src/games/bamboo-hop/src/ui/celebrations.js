BambooModules.define("celebrations.js", function(require, module, exports) {
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
var celebrations_exports = {};
__export(celebrations_exports, {
  flyBamboo: () => flyBamboo,
  punchScore: () => punchScore,
  refreshMissionClock: () => refreshMissionClock,
  sparksAt: () => sparksAt
});
module.exports = __toCommonJS(celebrations_exports);
function sparksAt(x, y, count = 14, reduced = false) {
  if (reduced) count = 4;
  for (let i = 0; i < count; i++) {
    const spark = document.createElement("i");
    spark.className = "reward-spark";
    spark.style.left = x + "px";
    spark.style.top = y + "px";
    spark.style.background = ["#e6c85c", "#b1d67b", "#f1efd0"][i % 3];
    document.body.append(spark);
    const angle = i / count * Math.PI * 2, distance = 35 + i % 4 * 17;
    spark.animate(
      [
        { transform: "translate(-50%, -50%) scale(.3)", opacity: 1 },
        {
          transform: `translate(${Math.cos(angle) * distance}px, ${Math.sin(angle) * distance}px) rotate(130deg) scale(1.1)`,
          opacity: 0
        }
      ],
      { duration: reduced ? 180 : 540, easing: "cubic-bezier(.1,.6,.3,1)" }
    ).finished.finally(() => spark.remove());
  }
}
function punchScore(el, audio, reduced, final = false) {
  if (!el) return;
  const rect = el.getBoundingClientRect();
  sparksAt(
    rect.x + rect.width / 2,
    rect.y + rect.height / 2,
    final ? 22 : 10,
    reduced
  );
  if (!reduced)
    el.animate(
      [
        { transform: "scale(1)", filter: "brightness(1)" },
        {
          transform: final ? "scale(1.2)" : "scale(1.1)",
          filter: "brightness(1.28)",
          offset: 0.28
        },
        { transform: "scale(1)", filter: "brightness(1)" }
      ],
      { duration: final ? 420 : 230, easing: "ease-out" }
    );
  audio.tone(final ? 150 : 110, 0.065, "triangle", 0.055, 60);
  audio.tone(final ? 1047 : 740, 0.09, "sine", 0.035, final ? 1568 : 980);
}
function flyBamboo(button, target, amount, icon, audio, reduced) {
  if (!target) return;
  const start = button.getBoundingClientRect(), end = target.getBoundingClientRect();
  const x = start.x + start.width / 2, y = start.y + start.height / 2;
  sparksAt(x, y, 16, reduced);
  const count = reduced ? 1 : Math.min(7, amount);
  for (let i = 0; i < count; i++) {
    const token = document.createElement("span");
    token.className = "flying-bamboo";
    token.innerHTML = icon("bamboo");
    document.body.append(token);
    const tx = end.x + end.width / 2, ty = end.y + end.height / 2;
    const units = Math.floor((i + 1) * amount / count) - Math.floor(i * amount / count);
    token.animate(
      [
        {
          left: x + "px",
          top: y + "px",
          transform: "translate(-50%,-50%) scale(.6)",
          opacity: 0
        },
        {
          left: x + (i - count / 2) * 17 + "px",
          top: y - 40 + "px",
          transform: "translate(-50%,-50%) scale(1.2)",
          opacity: 1,
          offset: 0.25
        },
        {
          left: tx + "px",
          top: ty + "px",
          transform: "translate(-50%,-50%) scale(.6)",
          opacity: 1
        }
      ],
      {
        duration: reduced ? 120 : 600,
        delay: reduced ? 0 : i * 55,
        fill: "both",
        easing: "cubic-bezier(.3,.05,.7,1)"
      }
    ).finished.then(() => {
      if (!target.isConnected) return;
      target.textContent = Number(target.textContent) + units;
      target.animate(
        [{ transform: "scale(1.2)" }, { transform: "scale(1)" }],
        { duration: 180 }
      );
      audio.tone(780 + i * 90, 0.055, "sine", 0.028);
    }).finally(() => token.remove());
  }
}
function refreshMissionClock(t) {
  const el = document.querySelector("#mission-clock");
  if (!el) return;
  const now = /* @__PURE__ */ new Date(), midnight = new Date(now);
  midnight.setHours(24, 0, 0, 0);
  const seconds = Math.max(0, Math.ceil((midnight - now) / 1e3));
  const duration = [
    Math.floor(seconds / 3600),
    Math.floor(seconds / 60) % 60,
    seconds % 60
  ].map((n) => String(n).padStart(2, "0")).join(":");
  const text = t("missionReset").replace("{time}", duration);
  if (el.textContent !== text) el.textContent = text;
}

});

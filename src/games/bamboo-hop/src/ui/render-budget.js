BambooModules.define("render-budget.js", function(require, module, exports) {
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
var render_budget_exports = {};
__export(render_budget_exports, {
  RenderBudget: () => RenderBudget
});
module.exports = __toCommonJS(render_budget_exports);
class RenderBudget {
  constructor(renderer, settings) {
    this.renderer = renderer;
    this.settings = settings;
    this.scale = 1;
    this.sampleTime = 0;
    this.frames = 0;
    this.cooldown = 4;
    this.frameMs = 0;
  }
  apply() {
    const pixelLimit = this.settings.quality === "high" ? 2e6 : 11e5;
    const maxRatio = Math.sqrt(
      pixelLimit / Math.max(1, innerWidth * innerHeight)
    );
    const ratio = Math.min(
      devicePixelRatio || 1,
      this.settings.quality === "high" ? 1.5 : 1,
      maxRatio
    ) * this.scale;
    if (Math.abs(this.renderer.getPixelRatio() - ratio) > 0.01)
      this.renderer.setPixelRatio(ratio);
    this.renderer.setSize(innerWidth, innerHeight, false);
  }
  sample(seconds, active) {
    if (!active || seconds > 0.2 || seconds <= 0) return;
    this.cooldown -= seconds;
    this.sampleTime += seconds;
    this.frames++;
    if (this.sampleTime < 2) return;
    this.frameMs = this.sampleTime / this.frames * 1e3;
    if (this.cooldown <= 0) {
      const next = this.frameMs > 23 ? Math.max(0.65, this.scale - 0.1) : this.frameMs < 17 ? Math.min(1, this.scale + 0.05) : this.scale;
      if (next !== this.scale) {
        this.scale = next;
        this.apply();
        this.cooldown = 6;
      }
    }
    this.sampleTime = 0;
    this.frames = 0;
  }
}

});

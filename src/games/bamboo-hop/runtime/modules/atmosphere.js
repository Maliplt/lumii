BambooModules.define("atmosphere.js", function(require, module, exports) {
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
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
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // Modül dışa aktarımı
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var atmosphere_exports = {};
__export(atmosphere_exports, {
  Atmosphere: () => Atmosphere
});
module.exports = __toCommonJS(atmosphere_exports);
var THREE = __toESM(require("three"));
var import_random = require("./random.js");
var import_config = require("./config.js");
class Atmosphere {
  constructor(scene) {
    const rng = (0, import_random.random)(8301);
    this.positions = new Float32Array(90 * 3);
    this.phases = new Float32Array(90);
    for (let i = 0; i < 90; i++) {
      this.positions.set(
        [(rng() - 0.5) * 22, rng() * 8, (rng() - 0.5) * 20],
        i * 3
      );
      this.phases[i] = rng() * 6.28;
    }
    this.geometry = new THREE.BufferGeometry();
    this.geometry.setAttribute(
      "position",
      new THREE.BufferAttribute(this.positions, 3)
    );
    const pixels = new Uint8Array(16 * 16 * 4);
    for (let y = 0; y < 16; y++)
      for (let x = 0; x < 16; x++) {
        const p = (y * 16 + x) * 4;
        pixels[p] = pixels[p + 1] = pixels[p + 2] = 255;
        pixels[p + 3] = Math.max(0, 1 - Math.hypot(x - 7.5, y - 7.5) / 7.5) * 255;
      }
    const map = new THREE.DataTexture(pixels, 16, 16);
    map.needsUpdate = true;
    this.material = new THREE.PointsMaterial({
      map,
      size: 3.2,
      sizeAttenuation: false,
      color: "#f2f7e9",
      transparent: true,
      opacity: 0,
      depthWrite: false
    });
    this.points = new THREE.Points(this.geometry, this.material);
    this.points.frustumCulled = false;
    scene.add(this.points);
    this.strength = 0;
    this.snowCover = 0;
    this.weatherBand = -1;
    this.weatherStart = 0;
  }
  reset() {
    this.strength = 0;
    this.snowCover = 0;
    this.weatherBand = -1;
    this.points.visible = false;
  }
  update(dt, game, focus, time, reduced, quality) {
    const playing = game.state === "playing" && game.mode !== "tutorial";
    const band = Math.floor((game.furthest || 0) / import_config.CONFIG.weatherStep);
    if (band !== this.weatherBand) {
      this.weatherBand = band;
      this.weatherStart = time;
    }
    const snow = band % 3 === 1 && time - this.weatherStart < 20;
    const pollen = band > 0 && band % 3 === 2;
    const target = playing && (snow || pollen) ? 0.65 : 0;
    this.strength += (target - this.strength) * Math.min(1, dt * 0.65);
    this.snowCover += ((playing && snow ? 0.82 : 0) - this.snowCover) * Math.min(1, dt * 0.24);
    this.points.visible = this.strength > 8e-3;
    if (!this.points.visible) return;
    this.points.position.copy(focus);
    this.material.opacity = this.strength * (reduced ? 0.55 : 1);
    this.material.color.lerp(
      new THREE.Color(band % 3 === 1 ? "#f1f7ed" : "#d9bd79"),
      Math.min(1, dt * 0.7)
    );
    this.material.size = snow ? 3.2 : 3;
    const count = reduced ? 24 : quality === "high" ? 75 : 40;
    this.geometry.setDrawRange(0, count);
    for (let i = 0; i < count; i++) {
      const p = i * 3;
      this.positions[p] += dt * (snow ? 0.2 : 0.6) + Math.sin(time + this.phases[i]) * dt * 0.1;
      this.positions[p + 1] -= dt * (snow ? 0.38 : 0.55);
      if (this.positions[p + 1] < 0.15) this.positions[p + 1] = 8;
      if (this.positions[p] > 11) this.positions[p] = -11;
    }
    this.geometry.attributes.position.needsUpdate = true;
  }
}

});

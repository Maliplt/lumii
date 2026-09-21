BambooModules.define("shop-preview.js", function(require, module, exports) {
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
var shop_preview_exports = {};
__export(shop_preview_exports, {
  ShopPreview: () => ShopPreview
});
module.exports = __toCommonJS(shop_preview_exports);
var THREE = __toESM(require("three"));
var import_art = require("./art.js");
class ShopPreview {
  constructor(cache) {
    this.cache = cache;
    this.renderer = new THREE.WebGLRenderer({
      alpha: false,
      antialias: true,
      preserveDrawingBuffer: true
    });
    this.renderer.setSize(256, 256);
    this.renderer.setPixelRatio(1);
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
  }
  draw() {
    const gallery = document.querySelector(".costume-gallery");
    if (!gallery) return;
    const bounds = gallery.getBoundingClientRect();
    for (const element of gallery.querySelectorAll("[data-preview]")) {
      const rect = element.getBoundingClientRect();
      if (rect.bottom < bounds.top || rect.top > bounds.bottom) continue;
      const id = element.dataset.preview;
      if (!this.cache.has(id)) {
        const scene = new THREE.Scene();
        scene.background = new THREE.Color("#d9e4c4");
        scene.add(new THREE.HemisphereLight("#fff4d6", "#55745a", 2.5));
        const light = new THREE.DirectionalLight("#ffeed0", 2.5);
        light.position.set(-3, 5, 6);
        scene.add(light);
        const model = (0, import_art.panda)(id);
        scene.add(model);
        (0, import_art.box)(scene, "#96b275", 0, -0.12, 0, 1.8, 0.24, 1.55, 0.035);
        (0, import_art.contactShadow)(scene, 0, 0, 0.43);
        const camera = new THREE.PerspectiveCamera(31, 1, 0.1, 20);
        camera.position.set(2.2, 1.8, 4.8);
        camera.lookAt(0, 0.9, 0);
        this.cache.set(id, {
          scene,
          model,
          camera,
          angle: -0.3,
          current: -0.3,
          image: null
        });
      }
      const p = this.cache.get(id), moving = Math.abs(p.angle - p.current) > 0.02;
      if (moving) p.current += (p.angle - p.current) * 0.3;
      else p.current = p.angle;
      if (!p.image || moving) {
        p.model.rotation.y = p.current;
        this.renderer.render(p.scene, p.camera);
        p.image = this.renderer.domElement.toDataURL("image/webp", 0.86);
      }
      const image = element.querySelector("img");
      if (image && image.getAttribute("src") !== p.image) image.src = p.image;
    }
  }
}

});

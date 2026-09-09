BambooModules.define("shop-drag.js", function(require, module, exports) {
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
var shop_drag_exports = {};
__export(shop_drag_exports, {
  enableShopDrag: () => enableShopDrag
});
module.exports = __toCommonJS(shop_drag_exports);
function enableShopDrag(app) {
  let drag = null, suppress = false;
  app.addEventListener("pointerdown", (e) => {
    const gallery = e.target.closest(".costume-gallery");
    if (!gallery || e.pointerType !== "mouse" || e.button !== 0) return;
    drag = {
      gallery,
      start: e.clientY,
      scroll: gallery.scrollTop,
      id: e.pointerId,
      moved: false
    };
  });
  app.addEventListener("pointermove", (e) => {
    if (!drag || e.pointerId !== drag.id) return;
    const dy = e.clientY - drag.start;
    if (Math.abs(dy) > 6 && !drag.moved) {
      drag.moved = true;
      drag.gallery.setPointerCapture(e.pointerId);
      drag.gallery.classList.add("dragging");
    }
    if (drag.moved) {
      e.preventDefault();
      drag.gallery.scrollTop = drag.scroll - dy;
    }
  });
  const end = () => {
    if (!drag) return;
    suppress = drag.moved;
    drag.gallery.classList.remove("dragging");
    if (drag.gallery.hasPointerCapture(drag.id))
      drag.gallery.releasePointerCapture(drag.id);
    drag = null;
    if (suppress) setTimeout(() => suppress = false, 0);
  };
  app.addEventListener("pointerup", end);
  app.addEventListener("pointercancel", end);
  app.addEventListener(
    "click",
    (e) => {
      if (suppress) {
        e.preventDefault();
        e.stopImmediatePropagation();
        suppress = false;
      }
    },
    true
  );
}

});

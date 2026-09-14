BambooModules.define("controls.js", function(require, module, exports) {
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
var controls_exports = {};
__export(controls_exports, {
  bindControls: () => bindControls
});
module.exports = __toCommonJS(controls_exports);
function bindControls({
  canvas,
  game,
  move,
  render,
  closeModal,
  getModal,
  getWorld,
  toast,
  t
}) {
  const keys = {
    ArrowUp: [0, 1],
    w: [0, 1],
    ArrowDown: [0, -1],
    s: [0, -1],
    ArrowLeft: [-1, 0],
    a: [-1, 0],
    ArrowRight: [1, 0],
    d: [1, 0],
    " ": [0, 1]
  };
  document.addEventListener("keydown", (e) => {
    if (e.key === "Tab") {
      const dialogs = document.querySelectorAll(".dialog"), dialog = dialogs[dialogs.length - 1];
      if (!dialog) return;
      const focusable = [
        ...dialog.querySelectorAll('button,select,[tabindex="0"]')
      ], first = focusable[0], last = focusable.at(-1);
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
      return;
    }
    if (e.key === "Escape") {
      if (document.querySelector("#purchase-confirm"))
        document.querySelector("#purchase-confirm").remove();
      else if (getModal()) closeModal();
      else if (game.state === "playing") {
        game.state = "paused";
        game.queue = null;
        render();
      } else if (game.state === "paused") {
        game.state = "playing";
        render();
      }
      return;
    }
    if (e.target.matches("select,input,textarea") || getModal()) return;
    const direction = keys[e.key] || keys[e.key.toLowerCase()];
    if (direction && game.state === "playing") {
      e.preventDefault();
      move(...direction);
    }
  });
  let touch = null;
  canvas.addEventListener("pointerdown", (e) => {
    if (game.state !== "playing") return;
    touch = { x: e.clientX, y: e.clientY, id: e.pointerId };
    canvas.setPointerCapture(e.pointerId);
  });
  canvas.addEventListener("pointerup", (e) => {
    if (!touch || touch.id !== e.pointerId) return;
    const dx = e.clientX - touch.x, dy = e.clientY - touch.y;
    touch = null;
    if (Math.max(Math.abs(dx), Math.abs(dy)) < 18) move(0, 1);
    else if (Math.abs(dx) > Math.abs(dy)) move(Math.sign(dx), 0);
    else move(0, -Math.sign(dy));
  });
  canvas.addEventListener("pointercancel", () => touch = null);
  document.addEventListener("visibilitychange", () => {
    if (document.hidden && game.state === "playing") {
      game.state = "paused";
      game.queue = null;
      render();
    }
  });
  window.addEventListener("blur", () => {
    if (game.state === "playing") {
      game.state = "paused";
      game.queue = null;
      render();
    }
  });
  window.addEventListener("resize", () => getWorld()?.resize());
  canvas.addEventListener("webglcontextlost", (e) => {
    e.preventDefault();
    game.state = "paused";
    render();
    toast(t("loadingError"));
  });
  canvas.addEventListener("webglcontextrestored", () => location.reload());
}

});

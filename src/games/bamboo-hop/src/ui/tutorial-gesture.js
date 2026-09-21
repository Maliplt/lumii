BambooModules.define("tutorial-gesture.js", function(require, module, exports) {
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
var tutorial_gesture_exports = {};
__export(tutorial_gesture_exports, {
  tutorialGesture: () => tutorialGesture
});
module.exports = __toCommonJS(tutorial_gesture_exports);
function tutorialGesture(swipe = false) {
  return `<div class="tutorial-gesture ${swipe ? "swipe-demo" : "tap-demo"}" aria-hidden="true">
    <svg viewBox="0 0 120 120" fill="none">
      <circle cx="53" cy="28" r="18" fill="#dbeac4"/>
      <circle class="tap-ripple" cx="53" cy="28" r="18" stroke="#61934e" stroke-width="2.5"/>
      <path class="swipe-guide" d="M20 29H88m-60-7-8 7 8 7m52-14 8 7-8 7" stroke="#61934e" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
      <g class="tap-hand">
        <path d="M41 88 27 68c-3-5-2-9 2-11 3-2 7-1 10 3l6 8V30c0-5 3-8 8-8s8 3 8 8v23c0-5 3-8 7-8s7 3 7 8v3c0-4 3-7 7-7s7 3 7 7v4c0-4 3-6 6-6 4 0 7 3 7 7v16c0 12-6 18-12 24H51c-2-5-6-9-10-13Z" fill="#234333" opacity=".14" transform="translate(0 4)"/>
        <path d="M41 88 27 68c-3-5-2-9 2-11 3-2 7-1 10 3l6 8V30c0-5 3-8 8-8s8 3 8 8v23c0-5 3-8 7-8s7 3 7 8v3c0-4 3-7 7-7s7 3 7 7v4c0-4 3-6 6-6 4 0 7 3 7 7v16c0 12-6 18-12 24H51c-2-5-6-9-10-13Z" fill="#fffaf0" stroke="#294b3b" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M94 70v7c0 10-5 16-10 20H55l-5-9c14 7 37 3 44-18Z" fill="#e4dfca"/>
        <path d="M61 53v15m14-12v14m14-10v12M46 70c8 0 14 5 15 13" stroke="#9baf99" stroke-width="2.5" stroke-linecap="round"/>
        <path d="M50 35v17" stroke="#fff" stroke-width="3" stroke-linecap="round"/>
        <path d="M50 97h41v13H50Z" fill="#5c8950" stroke="#294b3b" stroke-width="3" stroke-linejoin="round"/>
        <path d="M56 103h22" stroke="#b5d18c" stroke-width="2.5" stroke-linecap="round"/>
        <circle cx="85" cy="104" r="2" fill="#e9edcf"/>
      </g>
    </svg>
  </div>`;
}

});

BambooModules.define("tutorial.js", function(require, module, exports) {
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
var tutorial_exports = {};
__export(tutorial_exports, {
  LESSONS: () => LESSONS,
  advanceLesson: () => advanceLesson,
  lessonBlocks: () => lessonBlocks,
  lessonProgress: () => lessonProgress
});
module.exports = __toCommonJS(tutorial_exports);
const LESSONS = [
  { target: 3, checkpoint: 0 },
  { target: 2, checkpoint: 3 },
  { target: 1, checkpoint: 5 },
  { target: 11, checkpoint: 7 },
  { target: 15, checkpoint: 12 },
  { target: 20, checkpoint: 17 },
  { target: 23, checkpoint: 20 }
];
function advanceLesson(game) {
  const done = [
    game.furthest >= 3,
    game.sideways >= 2,
    game.lessonBamboo,
    game.furthest >= 11,
    game.furthest >= 15,
    game.furthest >= 20,
    game.furthest >= 23
  ];
  if (done[game.tutStep] && game.tutStep < 6) {
    game.tutStep++;
    return true;
  }
  return false;
}
function lessonProgress(game) {
  return game.tutStep === 1 ? game.sideways : game.tutStep === 2 ? Number(game.lessonBamboo) : game.furthest;
}
function lessonBlocks(game, row, dr) {
  return dr > 0 && (game.tutStep === 1 && row > 5 || game.tutStep === 2 && !game.lessonBamboo && row > 7 || row >= 18 && !game.lessonStorm);
}

});

"use strict";
const SudokuJourney = (() => {
  const chapters = [
    { name: "Tekliler", techniques: ["naked-single", "hidden-single"] },
    { name: "Çiftler", techniques: ["naked-pair", "hidden-pair"] },
    {
      name: "Kilitli adaylar",
      techniques: ["locked-candidate-pointing", "locked-candidate-claiming"],
    },
    { name: "Üçlüler", techniques: ["naked-triple", "hidden-triple"] },
    { name: "Usta desenleri", techniques: ["x-wing", "y-wing", "swordfish"] },
  ];
  function meta(level) {
    const chapter = Math.min(4, Math.floor((level - 1) / 12)),
      c = chapters[chapter];
    return {
      chapter,
      technique: c.techniques[(level - 1) % c.techniques.length],
      difficulty: Math.min(3, chapter),
    };
  }
  return { chapters, meta };
})();
if (typeof module !== "undefined") module.exports = SudokuJourney;

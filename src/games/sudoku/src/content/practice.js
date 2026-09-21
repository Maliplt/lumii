"use strict";
const SudokuPractice = (() => {
  const grids = {
    basics:
      "007300905000050000050601003009000600730040091001000500100709020000080000802005400",
    triples:
      "000000509000030100060904037030180000004000700000042060650308090003070000109000000",
    pairs:
      "200940000000006010061080090000000570009105600085000000010020460070800000000069003",
    fish: "308040000510800060000003000609030050005109600070020809000300000030005012000080507",
    hiddenTriple:
      "270413000080006000300000020000008501002307600807100000010000007000900060000751038",
    swordfish:
      "004070009301000070090600008705003000000497000000100703800002030050000906900080400",
  };
  const map = {
    "naked-single": "basics",
    "hidden-single": "basics",
    "naked-pair": "basics",
    "locked-candidate-pointing": "basics",
    "locked-candidate-claiming": "basics",
    "hidden-pair": "pairs",
    "naked-triple": "triples",
    "y-wing": "triples",
    "x-wing": "fish",
    "hidden-triple": "hiddenTriple",
    swordfish: "swordfish",
  };
  function get(technique) {
    const text = grids[map[technique] || "basics"],
      puzzle = SudokuEngine.fromString(text);
    return { ...puzzle, technique };
  }
  function lesson(technique) {
    const puzzle = get(technique);
    const board = [...puzzle.givens];
    const masks = SudokuTechniques.baseMasks(board);
    for (const step of SudokuTechniques.path(board).steps) {
      if (step.technique === technique) {
        return {
          ...puzzle,
          givens: board,
          lessonHint: step,
          lessonNotes: masks,
        };
      }
      for (const item of step.eliminations)
        masks[item.cell] &= ~(1 << item.digit);
      for (const item of step.placements) {
        board[item.cell] = item.digit;
        masks[item.cell] = 0;
        for (const peer of SudokuEngine.peers[item.cell])
          masks[peer] &= ~(1 << item.digit);
      }
    }
    throw new Error("Missing practice technique: " + technique);
  }
  return { get, lesson };
})();
if (typeof module !== "undefined") module.exports = SudokuPractice;

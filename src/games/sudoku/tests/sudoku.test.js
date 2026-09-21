"use strict";
const assert = require("assert");
global.SudokuEngine = require("../src/core/engine.js");
global.SudokuTechniques = require("../src/core/techniques.js");
global.SudokuSession = require("../src/core/session.js");
const SudokuPractice = require("../src/content/practice.js");
const SudokuJourney = require("../src/content/journey.js");

function testGenerator() {
  for (let difficulty = 0; difficulty < 4; difficulty++)
    for (let sample = 0; sample < 3; sample++) {
      const puzzle = SudokuEngine.generate(
        `audit-${difficulty}-${sample}`,
        difficulty,
      );
      const solved = SudokuEngine.solve(puzzle.givens, 2);
      assert.equal(
        solved.count,
        1,
        "generated puzzles must have exactly one solution",
      );
      assert.deepEqual(
        solved.solution,
        puzzle.solution,
        "stored and calculated solutions must match",
      );
      assert.equal(
        SudokuEngine.grade(puzzle),
        difficulty,
        "generated difficulty must match its label",
      );
    }
}

function testPracticeLibrary() {
  for (const technique of Object.keys(SudokuTechniques.names)) {
    const puzzle = SudokuPractice.get(technique);
    assert.equal(
      SudokuEngine.solve(puzzle.givens, 2).count,
      1,
      `${technique} practice puzzle must be unique`,
    );
    const used = SudokuTechniques.path(puzzle.givens).steps.map(
      (step) => step.technique,
    );
    assert(
      used.includes(technique),
      `${technique} practice puzzle must exercise its advertised technique`,
    );
  }
}

function testSession() {
  const puzzle = SudokuPractice.get("naked-single"),
    session = SudokuSession.create(puzzle, {
      id: "test",
      mode: "custom",
      difficulty: 3,
    });
  const index = session.selected,
    value = session.solution[index];
  SudokuSession.input(session, value, false, index, true);
  assert.equal(
    SudokuSession.progress(session).correct,
    1,
    "correct entries must advance progress",
  );
  assert(
    session.notes.some(Boolean),
    "automatic notes must refresh after input",
  );
  assert(SudokuSession.undo(session), "input must be undoable");
  assert.equal(session.board[index], 0, "undo must restore the cell");
  assert(SudokuSession.redo(session), "input must be redoable");
  assert.equal(session.board[index], value, "redo must restore the entry");
  const markIndex = session.board.findIndex((n, i) => !n && !session.givens[i]);
  session.selected = markIndex;
  session.selectedCells = [markIndex];
  assert.equal(
    SudokuSession.cycleMarks(session),
    "a",
    "color marking must cycle",
  );
  assert.equal(session.marks[markIndex], "a", "color marking must be stored");
  const hint = SudokuTechniques.next(session.board);
  assert(hint, "the practice state must expose a logical hint");
  const history = session.history.length;
  SudokuSession.applyHint(session, hint);
  assert.equal(
    session.history.length,
    history + 1,
    "an applied hint must be undoable",
  );
}

function testJourney() {
  assert.equal(SudokuJourney.meta(1).chapter, 0);
  assert.equal(SudokuJourney.meta(60).chapter, 4);
  assert.equal(SudokuJourney.meta(60).difficulty, 3);
}

testGenerator();
testPracticeLibrary();
for (const technique of Object.keys(SudokuTechniques.names)) {
  const lesson = SudokuPractice.lesson(technique);
  assert.equal(lesson.lessonHint.technique, technique);
  assert.equal(lesson.lessonNotes.length, 81);
  for (const { cell, digit } of lesson.lessonHint.placements)
    assert.equal(lesson.solution[cell], digit);
  for (const { cell, digit } of lesson.lessonHint.eliminations)
    assert.notEqual(lesson.solution[cell], digit);
}
testSession();
testJourney();
console.log("Sudoku checks passed: generator, techniques, sessions, journey.");

"use strict";
importScripts("engine.js?v=sudoku-20260916-2");
importScripts("techniques.js?v=sudoku-20260918-1");
self.onmessage = ({ data }) => {
  try {
    self.postMessage({
      puzzle: SudokuEngine.generate(data.seed, data.difficulty),
    });
  } catch {
    self.postMessage({ error: true });
  }
};

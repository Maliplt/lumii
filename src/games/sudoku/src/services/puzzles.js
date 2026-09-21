"use strict";
const SudokuPuzzles = (() => {
  let active;
  const workerUrl = new URL("../core/worker.js", document.currentScript.src);
  function cancel() {
    if (!active) return;
    const request = active;
    active = null;
    clearTimeout(request.timer);
    request.worker?.terminate();
    request.reject(new Error("cancelled"));
  }
  function generate(seed, difficulty) {
    cancel();
    return new Promise((resolve, reject) => {
      const request = { worker: null, timer: 0, reject };
      active = request;
      const finish = (callback) => {
        if (active !== request) return;
        active = null;
        clearTimeout(request.timer);
        request.worker?.terminate();
        callback();
      };
      const fallback = () => {
        if (active !== request) return;
        request.worker?.terminate();
        request.worker = null;
        request.timer = setTimeout(() => {
          if (active !== request) return;
          try {
            const puzzle = SudokuEngine.generate(seed, difficulty);
            finish(() => resolve(puzzle));
          } catch (error) {
            finish(() => reject(error));
          }
        });
      };
      try {
        request.worker = new Worker(workerUrl);
      } catch {
        fallback();
        return;
      }
      const worker = request.worker;
      worker.onmessage = ({ data }) => {
        finish(() =>
          data.error ? reject(new Error("generation")) : resolve(data.puzzle),
        );
      };
      worker.onerror = fallback;
      worker.postMessage({ seed, difficulty });
    });
  }
  return { generate, cancel };
})();

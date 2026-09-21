"use strict";

const createChessSearch = (() => {
  const workerUrl = new URL("../core/worker.js", document.currentScript.src);

  return function createSearch() {
    let worker = null;
    let fallbackTimer = null;
    let requestId = 0;

    function cancel() {
      requestId += 1;
      worker?.terminate();
      worker = null;
      clearTimeout(fallbackTimer);
      fallbackTimer = null;
    }

    function request(state, level, onMove) {
      cancel();
      const id = requestId;
      function deliver(move) {
        if (id !== requestId) return;
        cancel();
        onMove(move);
      }
      function fallback() {
        if (id !== requestId || fallbackTimer !== null) return;
        worker?.terminate();
        worker = null;
        fallbackTimer = setTimeout(() => {
          if (id !== requestId) return;
          deliver(ChessAI.choose(state, level, 200));
        }, 80);
      }
      try {
        worker = new Worker(workerUrl);
        worker.onmessage = ({ data }) => {
          if (data.id === id && data.move) deliver(data.move);
        };
        worker.onerror = fallback;
        worker.postMessage({ id, state, level });
      } catch {
        fallback();
      }
    }

    return { request, cancel };
  };
})();

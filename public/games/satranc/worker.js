"use strict";
importScripts("engine.js", "opponents.js", "ai.js");
onmessage = ({ data }) => {
  try {
    postMessage({ id: data.id, move: ChessAI.choose(data.state, data.level) });
  } catch {
    postMessage({ id: data.id, move: Chess.legal(data.state)[0] || null });
  }
};

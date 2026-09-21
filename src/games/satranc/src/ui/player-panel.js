"use strict";

function createChessPlayerPanel({ $, t, opponents, profileName, readState }) {
  function playerName(side) {
    const { session } = readState();
    if (session?.mode === "solo")
      return side === session.human
        ? profileName()
        : opponents[session.level - 1].name;
    return t(side === "w" ? "white" : "black");
  }
  function safeName(side) {
    const span = document.createElement("span");
    span.textContent = playerName(side);
    return span.innerHTML;
  }
  function formatTime(ms) {
    const { session, lesson } = readState();
    if (!session?.minutes || lesson >= 0) return "∞";
    const seconds = Math.max(0, Math.ceil(ms / 1000));
    return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
  }
  function renderClocks() {
    const { session, lesson, flipped, state } = readState();
    if (!session || lesson >= 0) return;
    for (const [position, side] of [
      ["top", flipped ? "w" : "b"],
      ["bottom", flipped ? "b" : "w"],
    ]) {
      const el = $("clock-" + position),
        remaining = session.clocks[side === "w" ? 0 : 1];
      el.textContent = formatTime(remaining);
      el.classList.toggle("low", !!session.minutes && remaining < 30000);
      $("player-" + position).classList.toggle(
        "active",
        !session.result && state.turn === side,
      );
    }
  }
  function renderPlayers() {
    const { session, lesson, flipped, captured, profile } = readState();
    for (const [position, side] of [
      ["top", flipped ? "w" : "b"],
      ["bottom", flipped ? "b" : "w"],
    ]) {
      const el = $("player-" + position);
      el.querySelector(".player-mark").classList.toggle(
        "is-black",
        side === "b",
      );
      el.querySelector(".player-mark").innerHTML =
        lesson < 0 && session?.mode === "solo"
          ? side === session.human
            ? JourneyArt.avatar(profile.avatar, profile.color)
            : JourneyArt.avatar(session.level - 1, session.level - 1)
          : "";
      el.querySelector("strong").textContent =
        lesson >= 0 ? t(side === "w" ? "white" : "black") : playerName(side);
      el.querySelector("small").textContent =
        session?.mode === "solo" && side !== session.human && lesson < 0
          ? "★".repeat(opponents[session.level - 1].strength)
          : "";
      if (lesson < 0) {
        const pieces = captured.filter((p) => Chess.color(p) !== side);
        if (pieces.length)
          el.querySelector("small").innerHTML = [...new Set(pieces)]
            .map((p) => {
              const count = pieces.filter((x) => x === p).length;
              return `<span class="capture-count" aria-label="${count} ${t(p.toLowerCase())}">${ChessArt.piece(p, "captured-piece")}<b>${count > 1 ? count : ""}</b></span>`;
            })
            .join("");
      }
    }
    renderClocks();
  }
  return { renderPlayers, renderClocks, safeName };
}

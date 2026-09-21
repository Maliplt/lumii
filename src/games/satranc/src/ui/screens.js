"use strict";

function createChessScreens({ $, t, opponents }) {
  function stars(n) {
    return `<span class="stars" aria-label="${n} / 5">${"★".repeat(n)}<span class="off">${"★".repeat(5 - n)}</span></span>`;
  }
  function renderSetup({ mode, level, minutes, human, wins }) {
    const solo = mode === "solo";
    $("setup-caption").textContent = t(solo ? "solo" : "sameDevice");
    $("start").querySelector("[data-t]").textContent = t("startGame");
    $("setup-title").textContent = t(solo ? "opponent" : "local");
    $("opponents").hidden = !solo;
    $("local-art").hidden = solo;
    $("color-group").hidden = !solo;
    $("opponents").innerHTML = opponents
      .map(
        (o, i) =>
          `<button class="opponent ${level === i + 1 ? "selected" : ""}" data-level="${i + 1}" aria-pressed="${level === i + 1}"><span class="portrait">${JourneyArt.avatar(i, i)}</span><span><strong>${o.name}</strong><small>${t(o.style)} · ${o.code}</small><small>+${o.reward} XP${wins[i + 1] ? " · " + wins[i + 1] + " ✓" : ""}</small></span>${stars(o.strength)}</button>`,
      )
      .join("");
    $("local-art").innerHTML =
      ChessArt.piece("K") +
      '<span class="versus">×</span>' +
      ChessArt.piece("k");
    $("time-options").innerHTML = [5, 10, 15, 0]
      .map(
        (n) =>
          `<button data-minutes="${n}" class="${minutes === n ? "selected" : ""}" aria-pressed="${minutes === n}">${n ? n + " " + t("minutes") : t("unlimited")}</button>`,
      )
      .join("");
    $("color-options").innerHTML = [
      ["w", "white"],
      ["b", "black"],
      ["random", "random"],
    ]
      .map(
        ([c, name]) =>
          `<button data-color="${c}" class="${human === c ? "selected" : ""}" aria-pressed="${human === c}">${t(name)}</button>`,
      )
      .join("");
  }
  function resultMarkup(session, safeName) {
    const result = session.result;
    const outcome = result.winner
      ? session.mode === "solo" && result.winner !== session.human
        ? "defeat"
        : "victory"
      : "draw";
    const score =
      result.winner === "w"
        ? "1 : 0"
        : result.winner === "b"
          ? "0 : 1"
          : "½ : ½";
    return `<div class="result result-${outcome}">
      <div class="result-banner"><div class="result-emblem">${ChessArt.piece(result.winner === "b" ? "k" : "K")}</div><div><span class="eyebrow">${t(result.reason)}</span><h2>${t(outcome)}</h2>${result.winner ? `<p class="winner-name">${safeName(result.winner)}</p>` : ""}</div></div>
      <div class="result-board"><div class="result-players"><span class="${result.winner === "w" ? "winner" : ""}"><i class="white-mark"></i>${safeName("w")}</span><span class="${result.winner === "b" ? "winner" : ""}"><i class="black-mark"></i>${safeName("b")}</span></div><div class="result-score" dir="ltr">${score}</div><div class="result-detail"><span>${t("moves")}</span><strong>${Math.ceil(session.log.length / 2)}</strong>${session.reward ? `<strong class="earned-xp">+${session.reward} XP</strong>` : ""}</div></div>
      <button class="primary result-rematch" data-rematch><span>${t("rematch")}</span>${ChessArt.icon("next")}</button>
      <div class="dialog-actions"><button data-cancel>${t("inspect")}</button><button data-menu>${t("mainMenu")}</button></div>
    </div>`;
  }
  return { renderSetup, resultMarkup };
}

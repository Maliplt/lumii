"use strict";
function createChallenges({ navigate, t, onHome }) {
  const section = document.createElement("section");
  section.id = "challenge";
  section.className = "screen";
  section.hidden = true;
  section.innerHTML = `<div class="section-heading"><button id="challenge-back" class="back"></button><span id="challenge-label" class="eyebrow"></span><button id="challenge-reset" class="quiet"></button></div><div class="challenge-layout"><div class="board-column"><div class="board-rim"><div id="challenge-board" class="board"></div></div></div><aside><span id="challenge-chapter" class="eyebrow"></span><h2 id="challenge-title"></h2><p id="challenge-goal"></p><div class="puzzle-counters"><div><span id="target-label"></span><strong id="target-count"></strong></div><div><span id="used-label"></span><strong id="used-count"></strong></div></div><div id="challenge-status" role="status"></div><div class="challenge-tools"><button id="challenge-hint" class="quiet"></button><button id="challenge-undo" class="quiet"></button></div><div id="challenge-success" hidden><div class="puzzle-stars"></div><strong id="challenge-reward"></strong><button id="challenge-next" class="primary"></button></div></aside></div>`;
  document.querySelector("main").append(section);
  const $ = (id) => document.getElementById(id);
  const board = new ChessBoard($("challenge-board"), select);
  const promotion = document.createElement("dialog");
  promotion.className = "promotion-dialog";
  document.body.append(promotion);
  let puzzle,
    state,
    selected = -1,
    hints = 0,
    daily = false,
    dailyDate = null,
    log = [],
    positions = [],
    complete = false,
    timer = 0,
    busy = false,
    ended = false,
    reward = 0,
    retries = 0;
  function stop() {
    clearTimeout(timer);
    busy = false;
    promotion.close();
    board.cancelDrag?.();
  }
  function start(id, isDaily = false, fresh = false) {
    stop();
    puzzle = ChessPuzzles[id - 1];
    daily = isDaily;
    dailyDate = daily ? ChessProgress.day() : null;
    state = Chess.parse(puzzle.fen);
    log = [];
    positions = [state];
    selected = -1;
    hints = 0;
    retries = 0;
    complete = false;
    ended = false;
    const saved = ChessProgress.data.challenge;
    if (
      !fresh &&
      saved?.version === 2 &&
      saved.id === id &&
      saved.fen === puzzle.fen &&
      saved.dailyDate === dailyDate &&
      Array.isArray(saved.log)
    ) {
      try {
        for (const code of saved.log) {
          const move = Chess.legal(state).find((m) => Chess.uci(m) === code);
          if (!move) throw Error("Invalid puzzle move");
          state = Chess.apply(state, move);
          log.push(move);
          positions.push(state);
        }
        hints =
          Number.isSafeInteger(saved.hints) && saved.hints >= 0
            ? saved.hints
            : 0;
        retries =
          Number.isSafeInteger(saved.retries) && saved.retries >= 0
            ? saved.retries
            : 0;
      } catch {
        state = Chess.parse(puzzle.fen);
        log = [];
        positions = [state];
      }
    }
    navigate("challenge");
    if (state.turn === "b") respond();
    else {
      ended = !Chess.legal(state).length;
      save();
      render();
    }
  }
  function render(move = null) {
    if (!puzzle) return;
    board.flipped = false;
    board.render(state, {
      selected,
      moves:
        selected < 0
          ? []
          : Chess.legal(state).filter((m) => m.from === selected),
      lang: document.documentElement.lang,
      animate: move,
    });
    $("challenge-back").innerHTML =
      ChessArt.icon("back") + "<span>" + t("back") + "</span>";
    $("challenge-reset").textContent = t("retry");
    $("challenge-label").textContent = daily
      ? t("daily")
      : t("puzzles") + " / " + String(puzzle.id).padStart(2, "0");
    $("challenge-chapter").textContent = puzzle.theme
      ? t(puzzle.theme)
      : t("chapterNames")[puzzle.chapter - 1];
    $("challenge-title").textContent = t(puzzle.goalKey);
    $("challenge-goal").textContent =
      puzzle.goal === "gain"
        ? t("gainDetail").replace("{n}", puzzle.amount)
        : t("freePuzzle");
    $("target-label").textContent = t("targetMoves");
    $("used-label").textContent = t("usedMoves");
    $("target-count").textContent = puzzle.par;
    $("used-count").textContent = Math.ceil(log.length / 2);
    $("challenge-hint").textContent = t("hint");
    $("challenge-undo").textContent = t("undoPuzzle");
    $("challenge-hint").disabled = busy || complete || ended;
    $("challenge-undo").disabled = busy || complete || !log.length;
    $("challenge-success").hidden = !complete;
    $("challenge-next").textContent = t(daily ? "mainMenu" : "nextPuzzle");
    $("challenge-status").textContent = complete
      ? t("completed")
      : ended
        ? t("puzzleEnded")
        : busy
          ? t("thinking")
          : t("white");
  }
  function select(i) {
    if (busy || complete || ended || state.turn !== "w") return;
    const moves =
      selected < 0
        ? []
        : Chess.legal(state).filter((m) => m.from === selected && m.to === i);
    if (moves.length > 1) {
      promotion.innerHTML = `<h2>${t("promote")}</h2><div class="promotion-options">${moves.map((m) => `<button data-promote="${m.promotion}" aria-label="${t(m.promotion.toLowerCase())}">${ChessArt.piece(m.promotion.toUpperCase())}</button>`).join("")}</div><button class="back">${t("back")}</button>`;
      promotion.querySelector(".back").onclick = () => promotion.close();
      promotion.querySelectorAll("[data-promote]").forEach(
        (el) =>
          (el.onclick = () => {
            promotion.close();
            play(moves.find((m) => m.promotion === el.dataset.promote));
          }),
      );
      promotion.showModal();
      return;
    }
    if (moves.length) {
      play(moves[0]);
      return;
    }
    if (Chess.color(state.board[i]) === "w") {
      selected = selected === i ? -1 : i;
      render();
      ChessAudio.play("select");
    }
  }
  function apply(m) {
    state = Chess.apply(state, m);
    log.push(m);
    positions.push(state);
    selected = -1;
    ChessAudio.play(Chess.check(state) ? "check" : "move");
  }
  function win(move) {
    complete = true;
    busy = false;
    ChessProgress.data.challenge = null;
    const over = Math.max(0, Math.ceil(log.length / 2) - puzzle.par) + retries;
    reward = ChessProgress.puzzle(puzzle.id, over, hints, dailyDate);
    render(move);
    section.querySelector(".puzzle-stars").innerHTML = Array.from(
      { length: 3 },
      (_, i) =>
        `<span style="--delay:${i * 120}ms" class="${i < (hints ? 1 : over ? 2 : 3) ? "earned" : "empty"}">★</span>`,
    ).join("");
    $("challenge-reward").textContent = reward ? "+" + reward + " XP" : "";
    ChessAudio.play("win");
    section.classList.add("challenge-won");
    setTimeout(() => section.classList.remove("challenge-won"), 1200);
  }
  function play(m) {
    apply(m);
    if (puzzle.goal !== "gain" && PuzzleRules.achieved(puzzle, state, log)) {
      win(m);
      return;
    }
    save();
    render(m);
    respond();
  }
  function scriptedReply() {
    let tree = puzzle.tree;
    if (!tree) return null;
    for (let i = 0; i < log.length; i += 2) {
      const replies = tree?.[Chess.uci(log[i])];
      if (!replies) return null;
      if (i + 1 === log.length)
        return (
          Chess.legal(state).find((m) =>
            Object.hasOwn(replies, Chess.uci(m)),
          ) || null
        );
      tree = replies[Chess.uci(log[i + 1])];
    }
    return null;
  }
  function respond() {
    const legal = Chess.legal(state);
    if (!legal.length) {
      if (PuzzleRules.achieved(puzzle, state, log)) win();
      else {
        ended = true;
        busy = false;
        save();
        render();
      }
      return;
    }
    busy = true;
    $("challenge-status").textContent = t("thinking");
    $("challenge-hint").disabled = true;
    $("challenge-undo").disabled = true;
    timer = setTimeout(() => {
      const reply = scriptedReply() || ChessAI.choose(state, 4, 140);
      if (reply) apply(reply);
      busy = false;
      if (PuzzleRules.achieved(puzzle, state, log)) {
        win(reply);
        return;
      }
      ended = !Chess.legal(state).length;
      save();
      render(reply);
    }, 320);
  }
  function save() {
    ChessProgress.data.challenge = {
      version: 2,
      id: puzzle.id,
      fen: puzzle.fen,
      dailyDate,
      log: log.map(Chess.uci),
      hints,
      retries,
    };
    ChessStore.save();
  }
  $("challenge-back").onclick = () => {
    stop();
    if (daily) onHome();
    else navigate("puzzle-map");
  };
  $("challenge-reset").onclick = () => start(puzzle.id, daily, true);
  $("challenge-undo").onclick = () => {
    if (busy || !log.length || complete) return;
    const count = log.length % 2 ? 1 : 2;
    log.splice(-count);
    positions.splice(-count);
    state = positions[positions.length - 1];
    selected = -1;
    ended = false;
    retries++;
    save();
    render();
  };
  $("challenge-hint").onclick = () => {
    if (busy || complete || ended) return;
    hints++;
    save();
    let tree = puzzle.tree;
    for (let i = 0; tree && i < log.length; i += 2)
      tree = tree[Chess.uci(log[i])]?.[Chess.uci(log[i + 1])];
    const code = tree && Object.keys(tree)[0];
    const m =
      (code && Chess.legal(state).find((m) => Chess.uci(m) === code)) ||
      PuzzleRules.suggest(puzzle, state, log);
    if (m) {
      selected = m.from;
      render();
      board.nodes.get(m.to).classList.add("target");
    }
  };
  $("challenge-next").onclick = () => {
    if (daily || puzzle.id === 100) onHome();
    else start(puzzle.id + 1);
  };
  return { start, stop, render };
}

"use strict";

(() => {
  function create({
    element,
    createElement,
    translate,
    icon,
    getGameState,
    canOpen,
    pauseGame,
    resumeGame,
    startTutorial,
    leaveForMap,
    resetLevel,
    unlockAudio,
  }) {
    let kind = "";
    let pausedGame = false;

    function addButton(key, action, quiet = false) {
      const button = createElement("button");
      button.className = "button " + (quiet ? "quiet" : "primary");
      button.textContent = translate(key);
      button.onclick = action;
      element("dialog-actions").append(button);
    }

    function close(resume = true) {
      element("dialog").close();
      kind = "";
      if (resume && pausedGame && getGameState() === "paused") resumeGame();
      pausedGame = false;
    }

    function render() {
      if (!kind) return;
      element("dialog-title").textContent = translate(kind + "Title");
      element("dialog-body").replaceChildren();
      element("dialog-actions").replaceChildren();
      if (kind === "help") {
        element("dialog-body").innerHTML =
          `<div class="help-visual" aria-hidden="true">${icon("bolt")}<span>↻</span>${icon("gem")}</div>`;
        for (let index = 1; index <= 3; index++) {
          const rule = createElement("div");
          rule.className = "help-rule";
          rule.innerHTML = `<b>${index}</b><span>${translate("rule" + index)}</span>`;
          element("dialog-body").append(rule);
        }
        addButton("tryTutorial", () => {
          const returnState = getGameState() === "paused" ? "playing" : getGameState();
          close(false);
          startTutorial(returnState);
        });
        addButton("cancel", () => close(), true);
        return;
      }
      const body = createElement("p");
      body.textContent = translate(kind + "Body");
      element("dialog-body").append(body);
      if (kind === "pause") {
        addButton("resume", () => close());
        addButton(
          "levels",
          () => {
            close(false);
            leaveForMap();
          },
          true,
        );
      }
      if (kind === "leave") {
        addButton("leaveAction", () => {
          close(false);
          leaveForMap();
        });
        addButton("cancel", () => close(), true);
      }
      if (kind === "reset") {
        addButton("resetAction", () => {
          close();
          resetLevel();
        });
        addButton("cancel", () => close(), true);
      }
    }

    function open(nextKind) {
      if (!canOpen() || element("dialog").open) return;
      unlockAudio();
      pausedGame = getGameState() === "playing";
      if (pausedGame) pauseGame();
      kind = nextKind;
      render();
      element("dialog").showModal();
    }

    return Object.freeze({
      open,
      close,
      render,
      isOpen: () => Boolean(kind),
    });
  }

  window.PrizmaDialog = Object.freeze({ create });
})();

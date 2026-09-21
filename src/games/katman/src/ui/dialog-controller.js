"use strict";

function createDialogController({ $, text, getState, setState, isTransitioning, endDrag, freeze, persist, geometry }) {
  function open(title, body, actions, visual = false) {
    if (isTransitioning() || $("dialog").open) return;
    endDrag();
    if (getState() === "playing") {
      freeze();
      setState("paused");
      persist();
    }
    $("dialog-content").innerHTML =
      `<h2>${text(title)}</h2>${visual ? '<div class="help-visual"><i>1</i><span></span><i>1</i></div>' : ""}<p>${text(body)}</p>${visual ? `<p style="margin-top:12px;font-size:12px">${text("bonusNote")}</p>` : ""}`;
    $("dialog-actions").replaceChildren();
    actions.forEach(([label, callback, primary]) => {
      const button = document.createElement("button");
      button.textContent = text(label);
      if (primary) button.className = "primary";
      button.onclick = () => {
        close();
        callback?.();
      };
      $("dialog-actions").append(button);
    });
    $("dialog").showModal();
    $("pointer").style.display = "none";
  }

  function close() {
    $("dialog").close();
    if (getState() === "paused") {
      setState("playing");
      geometry();
    }
  }

  return Object.freeze({ open, close });
}

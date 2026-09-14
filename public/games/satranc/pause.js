"use strict";
function createPauseMenu(actions) {
  const dialog = document.createElement("dialog");
  dialog.id = "pause-dialog";
  dialog.setAttribute("aria-labelledby", "pause-title");
  document.body.append(dialog);
  dialog.addEventListener("cancel", (event) => {
    event.preventDefault();
    actions.resume();
  });
  function render({ t, name, clocks, muted, dark }) {
    const focused = document.activeElement?.id;
    dialog.innerHTML = `
      <div class="pause-heading"><span class="pause-symbol">${ChessArt.icon("pause")}</span><h2 id="pause-title">${t("paused")}</h2></div>
      <div class="pause-match"><strong>${name}</strong><span dir="ltr">${clocks.join(" · ")}</span></div>
      <button id="pause-resume" class="primary"><span>${t("resume")}</span>${ChessArt.icon("play")}</button>
      <div class="pause-settings"><button id="pause-sound" aria-pressed="${!muted}">${ChessArt.icon(muted ? "mute" : "sound")}<span>${t("sound")}</span><i>${t(muted ? "off" : "on")}</i></button><button id="pause-theme" aria-pressed="${dark}">${ChessArt.icon(dark ? "moon" : "sun")}<span>${t("theme")}</span><i>${t(dark ? "night" : "day")}</i></button></div>
      <div class="pause-links"><button id="pause-new">${t("newGame")}</button><button id="pause-rules">${t("rules")}</button><button id="pause-home">${t("mainMenu")}</button></div>`;
    for (const key of ["resume", "sound", "theme", "new", "rules", "home"])
      dialog.querySelector("#pause-" + key).onclick = actions[key];
    if (focused)
      dialog.querySelector("#" + focused)?.focus({ preventScroll: true });
  }
  return {
    render,
    open() {
      if (!dialog.open) dialog.showModal();
    },
    close() {
      dialog.close();
    },
  };
}

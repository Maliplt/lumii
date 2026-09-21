"use strict";

function createAppShell({
  $,
  settings,
  store,
  picker,
  text,
  engine,
  homePreview,
  reducedMotion,
  screens,
  getState,
  setState,
  startPlaying,
  setTransitioning,
  cancelDrag,
  noteActivity,
  renderBoard,
  renderLevels,
  geometry,
  hasBoard,
  isTutorial,
}) {
  function applyTheme() {
    const dark = settings.theme === "dark";
    document.documentElement.dataset.theme = dark ? "dark" : "light";
    document.querySelector('meta[name="theme-color"]').content = dark ? "#141513" : "#f6f4ec";
    $("theme").setAttribute("aria-pressed", String(dark));
    $("theme").setAttribute(
      "aria-label",
      settings.language === "en"
        ? dark ? "Light theme" : "Dark theme"
        : dark ? "Aydınlık tema" : "Karanlık tema",
    );
    $("theme").innerHTML = dark
      ? '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.5 1.5m11 11L19 19M5 19l1.5-1.5m11-11L19 5"/></svg>'
      : '<svg viewBox="0 0 24 24"><path d="M20 15.5A8.5 8.5 0 0 1 8.5 4 8.5 8.5 0 1 0 20 15.5Z"/></svg>';
  }

  function renderHome() {
    $("home-preview").innerHTML = homePreview(engine.tutorial(), engine.COLORS);
  }

  function labels() {
    applyTheme();
    document.documentElement.lang = settings.language;
    document.documentElement.dir = settings.language === "ar" ? "rtl" : "ltr";
    document.querySelectorAll("[data-t]").forEach((element) => {
      element.innerHTML = text(element.dataset.t);
    });
    picker.update(settings.language);
    $("sound").classList.toggle("muted", settings.muted);
    $("sound").setAttribute("aria-label", text(settings.muted ? "soundOff" : "soundOn"));
    $("home-progress").textContent =
      `${text("level")} ${store.data.next} · ${Object.keys(store.data.records).length} ${text("done")}`;
    if (hasBoard()) renderBoard();
    if (getState() === "levels") renderLevels();
    if (getState() === "result" && isTutorial()) {
      $("result").querySelector("h2").textContent = text("ready");
    }
  }

  async function change(next) {
    noteActivity();
    setTransitioning(true);
    cancelDrag();
    const oldScreen = $(screens[getState()]);
    const nextScreen = $(screens[next]);
    if (oldScreen !== nextScreen && !oldScreen.hidden && !reducedMotion()) {
      await oldScreen.animate(
        [{ opacity: 1, translate: "0 0" }, { opacity: 0, translate: "0 -10px" }],
        { duration: 150, fill: "forwards" },
      ).finished;
    }
    document.querySelectorAll(".screen").forEach((element) => {
      element.hidden = element !== nextScreen;
      element.getAnimations().forEach((animation) => animation.cancel());
    });
    setState(next);
    document.body.dataset.state = next;
    if (oldScreen !== nextScreen && !reducedMotion()) {
      await nextScreen.animate(
        [{ opacity: 0, translate: "0 12px" }, { opacity: 1, translate: "0 0" }],
        { duration: 240, easing: "ease-out" },
      ).finished;
    }
    setTransitioning(false);
    if (next === "playing") {
      startPlaying();
      geometry();
    }
  }

  return Object.freeze({ applyTheme, renderHome, labels, change });
}

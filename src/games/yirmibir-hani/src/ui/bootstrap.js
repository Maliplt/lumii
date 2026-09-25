"use strict";
(function (YB) {
  function route() {
    const [name, a, b] = location.hash.replace(/^#/, "").split("/");
    const region = Number(a) - 1;
    const level = Number(b) - 1;
    if (name === "map") return { name, params: Number.isInteger(region) && region >= 0 ? { region } : {} };
    if (name === "decks") return { name, params: {} };
    if (name === "daily" && YB.Store.dailyOpen()) return { name: "play", params: { mode: "daily" } };
    if (name === "endless" && YB.Store.endlessOpen()) return { name: "play", params: { mode: "endless" } };
    if (name === "play" && YB.Levels.REGIONS[region] && level >= 0 && level < YB.Levels.LEVELS && YB.Store.isLevelOpen(region, level)) {
      return { name, params: { mode: "story", region, level } };
    }
    return { name: "menu", params: {} };
  }

  YB.Store.load();
  YB.i18n.set(YB.Store.data.settings.language || YB.i18n.detect());
  const fonts = document.fonts
    ? Promise.race([Promise.all([document.fonts.load('600 16px "Pixelify Sans"'), document.fonts.load('24px "Jacquard 12"'), document.fonts.load('16px "YB Digits"', '0')]), YB.dom.wait(1500)])
    : Promise.resolve();
  fonts.catch(() => {}).then(() => {
    YB.app = new YB.App();
    YB.app.start(route());
  });
})(window.YirmibirHani);

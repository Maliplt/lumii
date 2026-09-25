"use strict";
(function (B) {
  B.Store.load();
  B.Backdrop.init(document.getElementById("backdrop"));
  // the veil is a wall of blocks that closes and opens between screens
  const veil = document.getElementById("veil");
  const colors = ["coral", "tangerine", "sun", "lime", "sky", "ocean", "grape", "bubble"];
  for (let i = 0; i < 48; i++) {
    const x = i % 6;
    const y = Math.floor(i / 6);
    veil.append(B.dom.h("i", { class: `veil__block veil__block--${colors[(x + y * 3) % colors.length]}`, style: { "--d": `${(x + y) * 22}ms` } }));
  }
  B.i18n.set(B.Store.data.settings.language || B.i18n.detect());
  B.app = new B.App();
  B.app.start({ name: "menu", params: {} });
})(window.Blockhaven);

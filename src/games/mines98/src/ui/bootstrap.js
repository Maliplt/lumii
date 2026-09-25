"use strict";
(function (M) {
  M.Store.load();
  M.i18n.set(M.Store.data.settings.language || M.i18n.detect());
  M.app = new M.App(document.getElementById("app"));
  M.app.start();
})(window.Mines98);

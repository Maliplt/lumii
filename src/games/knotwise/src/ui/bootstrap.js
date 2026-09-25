"use strict";
(function (K) {
  K.Store.load();
  K.i18n.set(K.Store.data.settings.language || K.i18n.detect());
  K.app = new K.App();
  K.app.start({ name: "menu", params: {} });
})(window.Knotwise);

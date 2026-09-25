"use strict";
(function (V) {
  V.Store.load();
  V.i18n.set(V.Store.data.settings.language || V.i18n.detect());
  V.app = new V.App();
  V.app.start({ name: "menu", params: {} });
})(window.Purrfit);

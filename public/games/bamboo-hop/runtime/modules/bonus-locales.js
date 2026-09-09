BambooModules.define("bonus-locales.js", function(require, module, exports) {
var import_locales = require("./locales.js");
const labels = {
  tr: ["Yükleniyor..", "BAMBU SERİSİ", "KIL PAYI"],
  en: ["Loading..", "BAMBOO STREAK", "CLOSE CALL"],
  fr: ["Chargement..", "SÉRIE DE BAMBOUS", "DE JUSTESSE"],
  it: ["Caricamento..", "SERIE DI BAMBÙ", "PER UN SOFFIO"],
  ar: ["جارٍ التحميل..", "سلسلة الخيزران", "نجاة بأعجوبة"]
};
for (const [lang, [loading, bambooSeries, nearMiss]] of Object.entries(labels))
  Object.assign(import_locales.strings[lang], { loading, bambooSeries, nearMiss });

});

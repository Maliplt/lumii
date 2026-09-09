BambooModules.define("result-locales.js", function(require, module, exports) {
var import_locales = require("./locales.js");
const labels = {
  tr: ["TOPLAM BAMBU", "Yeni hedefler {time} içinde", "İlerle!"],
  en: ["TOTAL BAMBOO", "New goals in {time}", "Move ahead!"],
  fr: ["TOTAL DE BAMBOUS", "Nouveaux objectifs dans {time}", "Avance !"],
  it: ["BAMBÙ TOTALI", "Nuovi obiettivi tra {time}", "Avanza!"],
  ar: ["مجموع الخيزران", "أهداف جديدة خلال {time}", "تقدم!"]
};
for (const [lang, [totalBamboo, missionReset, cameraDanger]] of Object.entries(
  labels
))
  Object.assign(import_locales.strings[lang], { totalBamboo, missionReset, cameraDanger });

});

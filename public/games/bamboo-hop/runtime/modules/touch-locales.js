BambooModules.define("touch-locales.js", function(require, module, exports) {
var import_locales = require("./locales.js");
const text = {
  tr: ["İleri gitmek için oyun alanına dokun", "Sağa ve sola kaydırarak iki adım at"],
  en: ["Tap the game area to hop forward", "Swipe left and right to take two steps"],
  fr: ["Touche le terrain pour avancer", "Glisse à gauche et à droite pour faire deux pas"],
  it: ["Tocca il campo per avanzare", "Scorri a sinistra e a destra per fare due passi"],
  ar: ["المس منطقة اللعب للقفز للأمام", "اسحب يميناً ويساراً للتحرك خطوتين"]
};
for (const [lang, [tapOnly, swipeOnly]] of Object.entries(text))
  Object.assign(import_locales.strings[lang], { tapOnly, swipeOnly });

});

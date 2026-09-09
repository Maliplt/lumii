BambooModules.define("interface-locales.js", function(require, module, exports) {
var import_locales = require("./locales.js");
const copy = {
  tr: [
    "Mağaza",
    "Tekrar dene",
    "Geri",
    "İLK SIÇRAYIŞ",
    "İleri gitmek için ↑ veya W. Telefonda oyun alanına dokun.",
    "YÖNÜNÜ SEÇ",
    "Sağa ve sola iki adım at.",
    "BAMBUYU TOPLA",
    "Parlayan bambuya doğru ilerle. Üzerine atlayarak topla.",
    "AKINTIYI GEÇ",
    "Kütüklerin karelerine atla. Ortadaki lastikte dinlenebilirsin.",
    "TRAFİĞİ OKU",
    "İki şerit zıt yönde akıyor. Araçların arasındaki boşluğu yakala.",
    "FIRTINAYI BEKLE",
    "Tabela buluta dönünce dur. Rüzgârın sonu geçsin, sonra karşıya atla.",
    "BİTİŞE ULAŞ",
    "Bitiş kemerinden geç. Orman seni bekliyor!"
  ],
  en: [
    "Shop",
    "Try again",
    "Back",
    "FIRST HOP",
    "Use ↑ or W. On a phone, tap the game area.",
    "PICK A DIRECTION",
    "Hop sideways twice.",
    "COLLECT BAMBOO",
    "Hop onto the glowing bamboo to collect it.",
    "CROSS THE CURRENT",
    "Hop between log slots. Rest on the middle tyre.",
    "READ THE TRAFFIC",
    "These lanes run in opposite directions. Find a gap.",
    "WAIT FOR THE STORM",
    "Stop when the sign shows clouds. Wait for the wind’s tail to pass.",
    "REACH THE FINISH",
    "Cross the finish arch. The forest awaits!"
  ],
  fr: [
    "Boutique",
    "Réessayer",
    "Retour",
    "PREMIER SAUT",
    "Utilise ↑ ou W. Sur mobile, touche le terrain.",
    "CHOISIS TA DIRECTION",
    "Saute deux fois sur le côté.",
    "RAMASSE LE BAMBOU",
    "Saute sur le bambou lumineux.",
    "TRAVERSE LE COURANT",
    "Saute entre les rondins. Repose-toi sur le pneu central.",
    "OBSERVE LA CIRCULATION",
    "Les voies vont en sens opposés. Trouve un passage.",
    "ATTENDS LA TEMPÊTE",
    "Arrête-toi devant le nuage. Attends la fin du vent avant de traverser.",
    "REJOINS L’ARRIVÉE",
    "Passe sous l’arche. La forêt t’attend !"
  ],
  it: [
    "Negozio",
    "Riprova",
    "Indietro",
    "PRIMO SALTO",
    "Usa ↑ o W. Sul telefono tocca il terreno.",
    "SCEGLI LA DIREZIONE",
    "Salta lateralmente due volte.",
    "RACCOGLI IL BAMBÙ",
    "Salta sul bambù luminoso.",
    "ATTRAVERSA LA CORRENTE",
    "Salta sui tronchi. Riposa sullo pneumatico centrale.",
    "OSSERVA IL TRAFFICO",
    "Le corsie vanno in direzioni opposte. Trova un varco.",
    "ASPETTA LA TEMPESTA",
    "Fermati quando appare la nuvola. Aspetta la fine del vento.",
    "RAGGIUNGI IL TRAGUARDO",
    "Passa sotto l’arco. La foresta ti aspetta!"
  ],
  ar: [
    "المتجر",
    "حاول مجدداً",
    "رجوع",
    "القفزة الأولى",
    "استخدم ↑ أو W. على الهاتف المس ساحة اللعب.",
    "اختر اتجاهك",
    "اقفز جانبياً مرتين.",
    "اجمع الخيزران",
    "اقفز على الخيزران المضيء.",
    "اعبر التيار",
    "اقفز بين الجذوع واسترح على الإطار الأوسط.",
    "راقب المرور",
    "المساران في اتجاهين متعاكسين. انتظر فجوة.",
    "انتظر العاصفة",
    "توقف عند ظهور السحابة. انتظر نهاية الرياح ثم اعبر.",
    "صل إلى النهاية",
    "اعبر القوس. الغابة تنتظرك!"
  ]
};
const keys = [
  "wardrobe",
  "again",
  "goBack",
  ...Array.from({ length: 7 }, (_, i) => [
    "tut" + (i + 1),
    "tut" + (i + 1) + "Text"
  ]).flat()
];
for (const [lang, values] of Object.entries(copy))
  keys.forEach((key, i) => import_locales.strings[lang][key] = values[i]);

});

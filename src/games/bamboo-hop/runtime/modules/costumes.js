BambooModules.define("costumes.js", function(require, module, exports) {
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var costumes_exports = {};
__export(costumes_exports, {
  COSTUMES: () => COSTUMES,
  costumeById: () => costumeById,
  costumeName: () => costumeName,
  purchaseCostume: () => purchaseCostume
});
module.exports = __toCommonJS(costumes_exports);
const item = (id, price, type, color, names, skin) => ({
  id,
  price,
  type,
  color,
  names,
  skin
});
const COSTUMES = Object.freeze([
  item("scarf", 0, "scarf", "#e98343", [
    "Çin pandası",
    "Giant panda",
    "Panda géant",
    "Panda gigante",
    "الباندا العملاق"
  ]),
  item(
    "mint",
    25,
    "skin",
    "#a37850",
    [
      "Kahverengi panda",
      "Brown panda",
      "Panda brun",
      "Panda marrone",
      "الباندا البني"
    ],
    "brown"
  ),
  item(
    "ranger",
    45,
    "skin",
    "#f4f0dc",
    ["Kutup ayısı", "Polar bear", "Ours polaire", "Orso polare", "الدب القطبي"],
    "polar"
  ),
  item(
    "berry",
    40,
    "skin",
    "#b95832",
    ["Kızıl panda", "Red panda", "Panda roux", "Panda rosso", "الباندا الأحمر"],
    "red"
  ),
  item(
    "winter",
    45,
    "skin",
    "#815334",
    ["Boz ayı", "Grizzly bear", "Grizzly", "Orso grizzly", "الدب البني"],
    "grizzly"
  ),
  item(
    "sunflower",
    55,
    "skin",
    "#302e24",
    ["Güneş ayısı", "Sun bear", "Ours malais", "Orso malese", "دب الشمس"],
    "sun"
  ),
  item("explorer", 15, "hat", "#d9b46b", [
    "Orman kâşifi",
    "Explorer",
    "Explorateur",
    "Esploratore",
    "المستكشف"
  ]),
  item("flower", 25, "flower", "#fff1c4", [
    "Papatya",
    "Daisy",
    "Marguerite",
    "Margherita",
    "الأقحوان"
  ]),
  item("rain", 35, "rain", "#efc65c", [
    "Yağmur pelerini",
    "Rain cape",
    "Cape de pluie",
    "Mantella pioggia",
    "رداء المطر"
  ]),
  item("captain", 40, "cap", "#eae5d2", [
    "Kaptan",
    "Captain",
    "Capitaine",
    "Capitano",
    "القبطان"
  ]),
  item("beanie", 35, "headphones", "#de8454", [
    "Ritim ustası",
    "Beat keeper",
    "Maître du rythme",
    "Maestro del ritmo",
    "سيد الإيقاع"
  ]),
  item("aviator", 55, "goggles", "#a97643", [
    "Pilot",
    "Aviator",
    "Aviateur",
    "Aviatore",
    "الطيار"
  ]),
  item("diver", 55, "goggles", "#4ca598", [
    "Dalgıç",
    "Diver",
    "Plongeur",
    "Subacqueo",
    "الغواص"
  ]),
  item("hiker", 40, "pack", "#cd7548", [
    "Kampçı",
    "Camper",
    "Campeur",
    "Campeggiatore",
    "المخيم"
  ]),
  item("botanist", 65, "wings", "#64b5a0", [
    "Yaprak kanatlar",
    "Leaf wings",
    "Ailes de feuilles",
    "Ali di foglia",
    "أجنحة الأوراق"
  ]),
  item("rose", 70, "armor", "#748979", [
    "Bambu şövalyesi",
    "Bamboo knight",
    "Chevalier bambou",
    "Cavaliere bambù",
    "فارس الخيزران"
  ]),
  item("crown", 80, "crown", "#edc35f", [
    "Orman kralı",
    "Forest king",
    "Roi de la forêt",
    "Re della foresta",
    "ملك الغابة"
  ]),
  item("chef", 65, "chef", "#fff5e3", [
    "Şef",
    "Chef",
    "Chef",
    "Cuoco",
    "الطاهي"
  ]),
  item("miner", 60, "helmet", "#e8b549", [
    "Madenci",
    "Miner",
    "Mineur",
    "Minatore",
    "عامل المنجم"
  ]),
  item("nightwatch", 85, "wizard", "#416d66", [
    "Ay gezgini",
    "Moon wanderer",
    "Voyageur lunaire",
    "Viandante lunare",
    "رحالة القمر"
  ])
]);
const costumeById = (id) => COSTUMES.find((c) => c.id === id) || COSTUMES[0];
function costumeName(id, lang = "tr") {
  return costumeById(id).names[["tr", "en", "fr", "it", "ar"].indexOf(lang)] || costumeById(id).names[1];
}
function purchaseCostume(save, id) {
  const c = COSTUMES.find((c2) => c2.id === id);
  if (!c || save.unlocked.includes(id) || save.bamboo < c.price) return false;
  save.bamboo -= c.price;
  save.unlocked.push(id);
  save.equipped = id;
  return true;
}

});

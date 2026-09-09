BambooModules.define("save.js", function(require, module, exports) {
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
var save_exports = {};
__export(save_exports, {
  SAVE_SCHEMA: () => SAVE_SCHEMA,
  exportSave: () => exportSave,
  importSave: () => importSave
});
module.exports = __toCommonJS(save_exports);
var import_core = require("./core.js");
const SAVE_SCHEMA = {
  version: 2,
  identity: {
    id: "Oyuncu kimliği",
    subId: "Oyuncuya ait alt kayıt kimliği",
    localKey: "bamboo-hop:{id}:{subId}"
  },
  fields: {
    best: "En yüksek adım",
    bamboo: "Harcanabilir bambu",
    total: "Toplam adım",
    runs: "Tamamlanan tur",
    lang: "tr | en | fr | it | ar",
    sound: "Ses açık",
    quality: "high | low",
    reduced: "Sakin efektler",
    tutorial: "Öğretici tamamlandı",
    equipped: "Takılı aksesuar",
    unlocked: "Açılan aksesuarlar",
    daily: "YYYYMMDD: rekor",
    missionDay: "Günlük hedef tarihi: YYYYMMDD",
    missionProgress: "steps: en iyi tur, coins: toplanan bambu, runs: tur sayısı",
    claimed: "Ödülü alınan hedefler: steps | coins | runs"
  }
};
function exportSave(save, identity = { id: "guest", subId: "main" }) {
  const data = {
    game: "Bamboo Hop",
    version: 2,
    identity: { ...identity },
    savedAt: (/* @__PURE__ */ new Date()).toISOString(),
    progress: save
  };
  const url = URL.createObjectURL(
    new Blob([JSON.stringify(data, null, 2)], { type: "application/json" })
  );
  const link = document.createElement("a");
  link.href = url;
  link.download = "bamboo-hop-save.json";
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1e3);
}
function importSave(text) {
  const data = JSON.parse(text);
  if (data?.game !== "Bamboo Hop" || data.version !== 2 || !data.progress || typeof data.progress !== "object")
    throw new Error("Geçersiz kayıt");
  return (0, import_core.readSave)({ getItem: () => JSON.stringify(data.progress) });
}

});

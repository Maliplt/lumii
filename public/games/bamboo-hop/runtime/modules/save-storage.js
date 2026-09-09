BambooModules.define("save-storage.js", function(require, module, exports) {
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
var save_storage_exports = {};
__export(save_storage_exports, {
  SaveStorage: () => SaveStorage,
  saveIdentity: () => saveIdentity
});
module.exports = __toCommonJS(save_storage_exports);
var import_core = require("./core.js");
function saveIdentity(id = "guest", subId = "main") {
  const normalize = (value) => {
    if (!["string", "number"].includes(typeof value))
      throw Error("Geçersiz kayıt kimliği");
    const text = String(value).trim();
    if (!text || text.length > 128) throw Error("Geçersiz kayıt kimliği");
    return text;
  };
  return { id: normalize(id), subId: normalize(subId) };
}
class SaveStorage {
  constructor(storage, options = {}) {
    this.storage = storage;
    this.identity = saveIdentity(options.id, options.subId);
    this.adapter = options.database || null;
    this.autoSync = options.autoSync === true;
    this.pending = Promise.resolve();
    this.lastError = null;
  }
  get key() {
    return "bamboo-hop:" + encodeURIComponent(this.identity.id) + ":" + encodeURIComponent(this.identity.subId);
  }
  read() {
    let raw = null;
    try {
      raw = this.storage.getItem(this.key);
      const record = JSON.parse(raw);
      if (record && (record.version !== 2 || record.game !== "Bamboo Hop" || record.identity?.id !== this.identity.id || record.identity?.subId !== this.identity.subId))
        throw Error("Geçersiz kayıt");
      return (0, import_core.readSave)({ getItem: () => JSON.stringify(record?.progress) });
    } catch {
      return (0, import_core.readSave)({ getItem: () => null });
    }
  }
  record(progress) {
    return {
      game: "Bamboo Hop",
      version: 2,
      identity: { ...this.identity },
      savedAt: (/* @__PURE__ */ new Date()).toISOString(),
      progress: JSON.parse(JSON.stringify(progress))
    };
  }
  write(progress) {
    const record = this.record(progress);
    this.storage.setItem(this.key, JSON.stringify(record));
    if (this.autoSync && this.adapter) {
      const adapter = this.adapter;
      this.pending = this.pending.catch(() => {
      }).then(() => adapter.save(record.identity, record)).then(() => {
        this.lastError = null;
      }).catch((error) => {
        this.lastError = String(error?.message || error);
      });
    }
  }
  async loadRemote() {
    if (!this.adapter?.load) throw Error("Veritabanı bağlantısı tanımlı değil");
    const identity = { ...this.identity };
    const record = await this.adapter.load(identity);
    if (!record) return null;
    if (!record.progress || typeof record.progress !== "object" || record.game !== "Bamboo Hop" || record.version !== 2 || record.identity?.id !== identity.id || record.identity?.subId !== identity.subId || this.identity.id !== identity.id || this.identity.subId !== identity.subId)
      throw Error("Kayıt kimliği eşleşmiyor");
    return (0, import_core.readSave)({ getItem: () => JSON.stringify(record.progress) });
  }
  async push(progress) {
    if (!this.adapter?.save) throw Error("Veritabanı bağlantısı tanımlı değil");
    await this.pending;
    const record = this.record(progress);
    await this.adapter.save(record.identity, record);
    this.lastError = null;
  }
}

});

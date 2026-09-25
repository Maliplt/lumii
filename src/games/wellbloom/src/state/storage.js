// save wrapper that never throws
const backend = (() => {
  if (window.GameSave?.storage) return window.GameSave.storage;
  try {
    return window.localStorage;
  } catch {
    return null;
  }
})();

let syncTimer = null;

export class Storage {
  constructor(key) {
    this.key = key;
    this.pending = null;
  }

  read() {
    try {
      const raw = backend?.getItem(this.key);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  // writes on the next idle moment so rapid changes cost a single write
  write(data) {
    clearTimeout(this.pending);
    this.pending = setTimeout(() => this.flush(data), 150);
  }

  flush(data) {
    clearTimeout(this.pending);
    try {
      backend?.setItem(this.key, JSON.stringify(data));
    } catch {
      // storage unavailable; progress lives only in memory this session
    }
    const adapter = window.GameSaveConfig?.adapter;
    if (window.WellbloomConfig?.autoSync && window.GameSave?.pushRemote && adapter?.load && adapter?.save) {
      clearTimeout(syncTimer);
      syncTimer = setTimeout(() => window.GameSave.pushRemote().catch(() => {}), 2000);
    }
  }
}
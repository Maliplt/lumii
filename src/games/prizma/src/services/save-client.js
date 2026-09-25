"use strict";
(function (root) {
  const copy = (value) => JSON.parse(JSON.stringify(value));
  function createSaveClient(config, backend) {
    const normalize = (value) => {
      if (!["string", "number"].includes(typeof value))
        throw Error("Geçersiz kayıt kimliği");
      const text = String(value ?? "").trim();
      if (!text || text.length > 128) throw Error("Geçersiz kayıt kimliği");
      return text;
    };
    const identity = Object.freeze({
      gameId: normalize(config.gameId),
      userId: normalize(config.userId ?? "guest"),
      profileId: normalize(config.profileId ?? "main"),
    });
    const key =
      "game-suite.v1:" +
      Object.values(identity).map(encodeURIComponent).join(":");
    const slots = config.slots || {};
    let adapter = config.adapter || null;
    let persistent = true;
    let remoteRevision = null;
    let pending = false;
    const fresh = () => ({
      schemaVersion: 1,
      ...identity,
      revision: 0,
      updatedAt: null,
      data: {},
    });
    const valid = (record) =>
      record?.schemaVersion === 1 &&
      Object.entries(identity).every(
        ([name, value]) => record[name] === value,
      ) &&
      Number.isSafeInteger(record.revision) &&
      record.revision >= 0 &&
      record.data &&
      typeof record.data === "object" &&
      !Array.isArray(record.data) &&
      Object.entries(record.data).every(
        ([name, value]) =>
          Object.values(slots).includes(name) && typeof value === "string",
      );
    let state = fresh();
    let readOnly = false;
    try {
      const raw = backend.getItem(key);
      if (raw !== null) {
        const record = JSON.parse(raw);
        if (valid(record)) state = record;
        else readOnly = true;
      } else if (
        config.migrateLegacy === true ||
        (identity.userId === "guest" && identity.profileId === "main")
      ) {
        for (const [legacy, slot] of Object.entries(slots)) {
          const value = backend.getItem(legacy);
          if (value !== null) state.data[slot] = value;
        }
      }
    } catch {
      persistent = false;
    }
    function persist(record) {
      try {
        const raw = backend.getItem(key);
        if (raw !== null && !valid(JSON.parse(raw))) readOnly = true;
      } catch {}
      if (readOnly) throw Error("Kayıt sürümü desteklenmiyor");
      state = copy(record);
      try {
        backend.setItem(key, JSON.stringify(state));
        persistent = true;
      } catch {
        persistent = false;
      }
    }
    function slotFor(name) {
      const slot = slots[name];
      if (!slot) throw Error("Tanımsız kayıt alanı: " + name);
      return slot;
    }
    const storage = Object.freeze({
      getItem(name) {
        return state.data[slotFor(name)] ?? null;
      },
      setItem(name, value) {
        const slot = slotFor(name);
        // Başka sekmenin değiştirdiği alanları koru.
        let next = copy(state);
        try {
          const latest = JSON.parse(backend.getItem(key));
          if (valid(latest) && latest.revision >= next.revision) next = latest;
        } catch {}
        next.data[slot] = String(value);
        next.revision++;
        next.updatedAt = new Date().toISOString();
        persist(next);
      },
    });
    async function remote(operation) {
      if (
        !adapter ||
        typeof adapter.load !== "function" ||
        typeof adapter.save !== "function"
      )
        throw Error("API adaptörü tanımlı değil");
      if (pending) throw Error("Kayıt işlemi devam ediyor");
      pending = true;
      try {
        return await operation();
      } finally {
        pending = false;
      }
    }
    return Object.freeze({
      identity,
      key,
      storage,
      status: () => ({ persistent, readOnly, pending }),
      exportData: () => copy(state),
      importData(record) {
        if (!valid(record)) throw Error("Kayıt kimliği veya biçimi geçersiz");
        persist({
          ...copy(record),
          revision: state.revision + 1,
          updatedAt: new Date().toISOString(),
        });
      },
      configureAdapter(value) {
        if (pending) throw Error("Kayıt işlemi devam ediyor");
        adapter = value;
        remoteRevision = null;
      },
      loadRemote: () =>
        remote(async () => {
          const revision = state.revision;
          const result = await adapter.load(copy(identity));
          if (!result) return null;
          if (!valid(result.record))
            throw Error("API kayıt kimliği veya biçimi geçersiz");
          if (state.revision !== revision)
            throw Error("Yükleme sırasında yerel kayıt değişti");
          remoteRevision = result.revision ?? null;
          // İncelemeden yerel ilerlemenin üzerine yazılmaz.
          return copy(result.record);
        }),
      pushRemote: () =>
        remote(async () => {
          const result = await adapter.save(copy(identity), copy(state), {
            expectedRevision: remoteRevision,
          });
          remoteRevision = result?.revision ?? remoteRevision;
          return result;
        }),
    });
  }
  root.createSaveClient = createSaveClient;
  if (root.GameSaveConfig) {
    let backend;
    try {
      backend = root.localStorage;
    } catch {}
    root.GameSave = createSaveClient(
      root.GameSaveConfig,
      backend || {
        getItem: () => null,
        setItem: () => {
          throw Error("Kayıt kullanılamıyor");
        },
      },
    );
  }
  if (typeof module !== "undefined") module.exports = { createSaveClient };
})(typeof window !== "undefined" ? window : globalThis);

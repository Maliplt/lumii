/* Ortak kayıt katmanı; oyun motorları depolamaya doğrudan erişmez. */
(function (root) {
  "use strict";
  const SCHEMA_VERSION = 1;
  const STORAGE_PREFIX = "puzzle-suite.v1.";
  const CONFIG = {
    denge: {
      generatorVersion: "3",
      fields: {
        "journey.v3.0": "campaigns.classic",
        "journey.v3.1": "campaigns.chaos",
        "journey.v2.0": "legacy.classic",
        "chaos.v1": "sessions.chaos",
        "hints.v1": "wallet.hints",
        language: "settings.language",
        theme: "settings.theme",
        sound: "settings.sound",
        "tutorial.v1": "settings.tutorial",
      },
    },
    prizma: {
      generatorVersion: "2",
      fields: {
        journey: "legacy.classic",
        "journey.v2": "campaigns.classic",
        "session.v2": "sessions.classic",
        "lang.v2": "settings.language",
        "mute.v2": "settings.sound",
        "learned.v2": "settings.tutorial",
      },
    },
  };
  function parse(value, fallback = null) {
    try {
      return value === null ? fallback : JSON.parse(value);
    } catch {
      return fallback;
    }
  }
  function levelId(gameId, modeId, seed, number) {
    if (
      !CONFIG[gameId] ||
      !/^[a-z]+$/.test(modeId) ||
      !/^[1-9]\d*$/.test(String(number)) ||
      !Number.isInteger(seed)
    ) {
      throw new TypeError("Invalid level identity");
    }
    return `${gameId}:${modeId}:g${CONFIG[gameId].generatorVersion}:${seed}:${number}`;
  }
  function open(gameId, backend) {
    if (!backend) {
      try {
        backend = root.localStorage;
      } catch {
        backend = null;
      }
    }
    const config = CONFIG[gameId];
    if (!config) throw new TypeError("Unknown game");
    const storageKey = STORAGE_PREFIX + gameId;
    const safeRead = (key) => {
      try {
        return backend.getItem(key);
      } catch {
        return null;
      }
    };
    const stored = parse(safeRead(storageKey));
    const compatible =
      stored?.schemaVersion === SCHEMA_VERSION &&
      stored?.gameId === gameId &&
      stored?.data &&
      typeof stored.data === "object" &&
      !Array.isArray(stored.data);
    // Yeni sürüme ait kaydın üzerine yazma.
    const readOnly = stored !== null && !compatible;
    let data = compatible ? stored.data : {};
    let updatedAt = compatible ? stored.updatedAt : null;
    function flush() {
      if (readOnly) return false;
      updatedAt = new Date().toISOString();
      try {
        backend.setItem(
          storageKey,
          JSON.stringify({
            schemaVersion: SCHEMA_VERSION,
            gameId,
            updatedAt,
            levels: exportData().levels,
            data,
          }),
        );
        return true;
      } catch {
        return false;
      } // Depolama doluysa oturum bellekte devam eder.
    }
    if (!compatible && !readOnly) {
      for (const [oldKey, field] of Object.entries(config.fields)) {
        const raw = safeRead(`${gameId}.${oldKey}`);
        if (raw !== null) data[field] = raw;
      }
      flush(); // Eski kayıt yedek kalır; bundan sonra yeni anahtar kullanılır.
    }
    function fieldFor(key) {
      const field = config.fields[key];
      if (!field)
        throw new TypeError(`Unregistered storage field: ${gameId}.${key}`);
      return field;
    }
    function exportData() {
      const levels = [];
      for (const modeId of ["classic", "chaos"]) {
        const campaign =
          parse(data[`campaigns.${modeId}`]) ||
          (modeId === "classic" ? parse(data["legacy.classic"]) : null);
        if (!campaign || !Number.isInteger(campaign.seed)) continue;
        for (const [number, record] of Object.entries(campaign.records || {})) {
          if (
            !/^[1-9]\d*$/.test(number) ||
            !record ||
            typeof record !== "object"
          )
            continue;
          const stars = Number.isInteger(record.stars)
            ? Math.max(0, Math.min(3, record.stars))
            : 0;
          levels.push({
            levelId: levelId(gameId, modeId, campaign.seed, number),
            gameId,
            modeId,
            generatorVersion: config.generatorVersion,
            seed: campaign.seed,
            levelNumber: number,
            completed: stars > 0,
            score: {
              stars,
              points:
                gameId === "prizma" && Number.isFinite(record.score)
                  ? record.score
                  : null,
              bestTimeMs:
                gameId === "denge" && Number.isFinite(record.best)
                  ? record.best
                  : null,
            },
          });
        }
      }
      const native = Object.fromEntries(
        Object.entries(data).map(([key, raw]) => [key, parse(raw, raw)]),
      );
      return {
        schemaVersion: SCHEMA_VERSION,
        gameId,
        exportedAt: new Date().toISOString(),
        updatedAt,
        levels,
        settings: {
          language: native["settings.language"] || "tr",
          theme: native["settings.theme"] || null,
          soundEnabled:
            gameId === "denge"
              ? native["settings.sound"] !== "off"
              : native["settings.sound"] !== true,
          tutorialCompleted:
            gameId === "denge"
              ? native["settings.tutorial"] === "done"
              : native["settings.tutorial"] === true,
        },
        native,
      };
    }
    const api = {
      storageKey,
      get: (key) => data[fieldFor(key)] ?? null,
      set(key, value) {
        data[fieldFor(key)] = String(value);
        return flush();
      },
      exportData,
      download() {
        const blob = new Blob([JSON.stringify(exportData(), null, 2)], {
          type: "application/json",
        });
        const url = URL.createObjectURL(blob),
          link = document.createElement("a");
        link.href = url;
        link.download = `${gameId}-save.json`;
        link.click();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
      },
    };
    return Object.freeze(api);
  }
  const api = Object.freeze({
    SCHEMA_VERSION,
    STORAGE_PREFIX,
    CONFIG,
    levelId,
    open,
  });
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.GameData = api;
})(typeof globalThis !== "undefined" ? globalThis : this);

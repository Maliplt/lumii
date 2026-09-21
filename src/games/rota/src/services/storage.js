"use strict";

const RotaStorage = Object.freeze({
  read(key, fallback) {
    try {
      return JSON.parse(GameSave.storage.getItem("rota." + key)) ?? fallback;
    } catch {
      return fallback;
    }
  },
  write(key, value) {
    try {
      GameSave.storage.setItem("rota." + key, JSON.stringify(value));
    } catch {}
  },
});

"use strict";
(function (root) {
  const D = (root.Mines98 = root.Mines98 || {});

  D.GAME_ID = "mines98";
  D.VERSION = "1.0.0";
  D.SEED = "mines98/1";

  D.util = {
    clamp: (value, min, max) => Math.min(max, Math.max(min, value)),
    lerp: (a, b, t) => a + (b - a) * t,
    easeOut: (t) => 1 - (1 - t) ** 3,
    easeIn: (t) => t * t * t,
    easeInOut: (t) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2),
    easeBack: (t) => 1 + 2.7 * (t - 1) ** 3 + 1.7 * (t - 1) ** 2,
    dayKey(date = new Date()) {
      const pad = (n) => String(n).padStart(2, "0");
      return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
    },
    shiftDay(key, days) {
      const [y, m, d] = key.split("-").map(Number);
      return D.util.dayKey(new Date(y, m - 1, d + days));
    },
    // 12 345 style grouping that works in every language
    number(value) {
      return String(Math.round(value)).replace(/\B(?=(\d{3})+(?!\d))/g, " ");
    },
  };
})(typeof window !== "undefined" ? window : globalThis);

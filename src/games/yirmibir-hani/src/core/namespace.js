"use strict";
(function (root) {
  const YB = (root.YirmibirHani = root.YirmibirHani || {});

  YB.GAME_ID = "yirmibir-hani";
  YB.VERSION = "1.0.0";

  YB.util = {
    clamp: (value, min, max) => Math.min(max, Math.max(min, value)),
    lerp: (a, b, t) => a + (b - a) * t,
    easeOut: (t) => 1 - (1 - t) ** 3,
    easeInOut: (t) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2),
    easeBack: (t) => 1 + 2.7 * (t - 1) ** 3 + 1.7 * (t - 1) ** 2,
    dayKey(date = new Date()) {
      const pad = (n) => String(n).padStart(2, "0");
      return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
    },
    shiftDay(key, days) {
      const [y, m, d] = key.split("-").map(Number);
      return YB.util.dayKey(new Date(y, m - 1, d + days));
    },
  };
})(typeof window !== "undefined" ? window : globalThis);

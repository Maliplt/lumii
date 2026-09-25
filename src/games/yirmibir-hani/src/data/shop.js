"use strict";
// the inn's market: card backs and table cloths to keep, tricks to spend
(function (YB) {
  const BACKS = { crimson: 0, forest: 80, harbor: 150, night: 250, royal: 400, sun: 600 };
  const CLOTHS = { plain: 0, felt: 60, indigo: 100, gingham: 150, kilim: 200, brocade: 350 };
  const TRICKS = { heart: 30, time: 25, peek: 20, broom: 35 };
  const TRICK_IDS = Object.keys(TRICKS);
  const STACK = 9;
  // each trick joins the pouch at a story hand ([inn, hand]) and comes with one to try
  const UNLOCK = { heart: [0, 4], time: [0, 6], peek: [0, 8], broom: [1, 1] };

  // coins for a finished hand
  function payout({ score, tipCoins = 0, gained = 0, firstDaily = false, streak = 0 }) {
    const base = Math.floor(score / 100);
    const stars = gained * 5;
    const daily = firstDaily ? 10 + 5 * Math.min(Math.max(streak, 1), 6) : 0;
    return { base, tips: tipCoins, stars, daily, total: base + tipCoins + stars + daily };
  }

  YB.Shop = { BACKS, CLOTHS, TRICKS, TRICK_IDS, STACK, UNLOCK, payout };
})(window.YirmibirHani);

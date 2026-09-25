"use strict";
// the ledger: three errands a day and the long list of deeds
(function (YB) {
  // goals and rewards per tier
  const ERRANDS = {
    twentyOnes: { goals: [6, 12, 20], rewards: [15, 20, 30], stat: (r) => r.twentyOnes + r.blackjacks },
    blackjacks: { goals: [1, 2, 4], rewards: [20, 25, 35], stat: (r) => r.blackjacks },
    fives: { goals: [1, 2, 4], rewards: [20, 25, 35], stat: (r) => r.fives },
    customers: { goals: [3, 6, 10], rewards: [20, 25, 35], stat: (r) => r.tips, needs: "patrons" },
    combo: { goals: [3, 4, 5], rewards: [15, 25, 40], best: true, stat: (r) => r.bestCombo },
    score: { goals: [1200, 2500, 4000], rewards: [15, 25, 40], best: true, stat: (r) => r.score },
    perfect: { goals: [1, 2, 3], rewards: [20, 25, 35], stat: (r) => (r.perfect ? 1 : 0) },
    threeStars: { goals: [1, 2, 3], rewards: [20, 30, 40], stat: (r) => (r.stars === 3 ? 1 : 0), needs: "story" },
    rounds: { goals: [3, 5, 8], rewards: [15, 20, 25], stat: () => 1 },
    jokers: { goals: [2, 3, 5], rewards: [20, 25, 35], stat: (r) => r.jokers, needs: "harbor" },
  };
  const DAILY_COUNT = 3;
  const CHEST = 40;

  const tier = (stars) => (stars < 20 ? 0 : stars < 60 ? 1 : 2);

  // today's three errands, the same for everyone with the same progress
  function daily(day, { stars = 0, open = {} } = {}) {
    const rng = new YB.Random(`${YB.GAME_ID}/errands/${day}`);
    const level = tier(stars);
    const pool = Object.keys(ERRANDS).filter((id) => !ERRANDS[id].needs || open[ERRANDS[id].needs]);
    return rng
      .shuffle(pool)
      .slice(0, DAILY_COUNT)
      .map((id) => ({ id, goal: ERRANDS[id].goals[level], reward: ERRANDS[id].rewards[level], progress: 0, claimed: false }));
  }

  // adds a finished hand to the errands; returns the ones it just completed
  function advance(list, summary) {
    const done = [];
    for (const errand of list) {
      const rule = ERRANDS[errand.id];
      if (!rule || errand.progress >= errand.goal) continue;
      const value = rule.stat(summary);
      errand.progress = Math.min(errand.goal, rule.best ? Math.max(errand.progress, value) : errand.progress + value);
      if (errand.progress >= errand.goal) done.push(errand);
    }
    return done;
  }

  const DEEDS = [
    { id: "twentyOnes", goals: [25, 100, 400] },
    { id: "blackjacks", goals: [5, 25, 80] },
    { id: "fives", goals: [5, 25, 80] },
    { id: "customers", goals: [10, 50, 200] },
    { id: "combo", goals: [3, 4, 5] },
    { id: "stars", goals: [30, 90, 150] },
    { id: "regions", goals: [1, 3, 5] },
    { id: "streak", goals: [3, 7, 30] },
    { id: "endless", goals: [1500, 4000, 8000] },
    { id: "perfect", goals: [1, 10, 50] },
    { id: "coins", goals: [300, 1500, 6000] },
  ];
  const DEED_REWARDS = [25, 60, 150];

  // where a deed stands: the next goal, and how many tiers are ready to claim
  function deed(entry, value, claimed) {
    const reached = entry.goals.filter((goal) => value >= goal).length;
    const next = entry.goals[Math.min(claimed, entry.goals.length - 1)];
    return { reached, claimed, ready: reached > claimed, done: claimed >= entry.goals.length, goal: next, value, reward: DEED_REWARDS[Math.min(claimed, DEED_REWARDS.length - 1)] };
  }

  YB.Quests = { ERRANDS, DAILY_COUNT, CHEST, DEEDS, DEED_REWARDS, tier, daily, advance, deed };
})(window.YirmibirHani);

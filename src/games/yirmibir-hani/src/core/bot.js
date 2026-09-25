"use strict";
// simple players for tuning levels
(function (YB) {
  const { evaluate, isBlackjack, FULL, TARGET } = YB.Lane;

  // chance that the next number card is worth v (ace counted as 1)
  const CHANCE = Array.from({ length: 11 }, (_, v) => (v === 10 ? 16 / 52 : v >= 1 ? 4 / 52 : 0));

  // how promising a lane is: likely to reach 21 soon, unlikely to burst
  function outlook(cards) {
    if (!cards.length) return 20;
    const lane = evaluate(cards);
    const gap = TARGET - lane.best;
    const lowGap = TARGET - lane.low;
    let hit = gap >= 1 && gap <= 10 ? CHANCE[gap] : 0;
    if (gap === 11 || lane.best === 10) hit = 4 / 52;
    if (lane.soft && lowGap <= 10) hit = Math.max(hit, CHANCE[lowGap]);
    let bust = 0;
    for (let v = 1; v <= 10; v++) if (v > lowGap) bust += CHANCE[v];
    let value = hit * 260 - bust * 70;
    if (cards.length === FULL - 1) value += (1 - bust) * 60;
    return value;
  }

  function worth(lane, card) {
    if (card.kind === "joker") return 150 + lane.length * 30 - outlook(lane);
    const cards = [...lane, card];
    const result = evaluate(cards);
    if (result.twentyOne) return 300 + (isBlackjack(cards) ? 60 : 0) + cards.length * 5;
    if (result.bust) return -400 + lane.length * 10;
    if (cards.length >= FULL) return 220;
    return outlook(cards) - outlook(lane);
  }

  function after(lanes, index, card) {
    const next = lanes.slice();
    const cards = [...lanes[index], card];
    const result = card.kind === "joker" ? null : evaluate(cards);
    next[index] = !result || result.twentyOne || result.bust || cards.length >= FULL ? [] : cards;
    return next;
  }

  function bestPlacement(lanes, card) {
    if (!card) return 0;
    return Math.max(...lanes.map((lane) => worth(lane, card)));
  }

  // looks one card ahead: the next card is known, so plan for it too
  function careful(round) {
    let best = { swap: false, lane: 0, value: -Infinity };
    const consider = (card, swap, penalty, upcoming) => {
      round.lanes.forEach((lane, index) => {
        const value = worth(lane, card) + 0.6 * bestPlacement(after(round.lanes, index, card), upcoming) - penalty;
        if (value > best.value) best = { swap, lane: index, value };
      });
    };
    consider(round.current, false, 0, round.next);
    if (round.holdEnabled) {
      if (round.held) consider(round.held, true, 2, round.next);
      else if (round.next) consider(round.next, true, 12, round.deck[1] || null);
    }
    return best;
  }

  function careless(rng) {
    return (round) => {
      const safe = round.lanes.map((_, index) => index).filter((index) => !round.preview(index).bust);
      return { swap: false, lane: rng.pick(safe.length ? safe : [0, 1, 2, 3]) };
    };
  }

  // a person at the table
  function human(rng, slip = 0.2) {
    return (round) => {
      if (rng.next() >= slip) return careful(round);
      const safe = round.lanes.map((_, index) => index).filter((index) => !round.preview(index).bust);
      return { swap: false, lane: rng.pick(safe.length ? safe : [0, 1, 2, 3]) };
    };
  }

  // a human-paced run: `pace` seconds a card, longer on specials, a little uneven
  function playHuman(level, seed, pace = 2.6, slip = 0.2) {
    const rng = new YB.Random(seed);
    const policy = human(rng, slip);
    const round = new YB.Round(level);
    while (!round.over) {
      const special = round.current && round.current.kind !== "number";
      round.tick(pace * (special ? 1.5 : 1) * (0.8 + rng.next() * 0.4));
      if (round.over) break;
      const action = policy(round);
      if (action.swap) round.swap();
      round.place(action.lane);
    }
    return round;
  }

  // plays a level at a steady pace and returns the finished round
  function play(level, policy, pace = 1.6) {
    const round = new YB.Round(level);
    while (!round.over) {
      round.tick(pace);
      if (round.over) break;
      const action = policy(round);
      if (action.swap) round.swap();
      round.place(action.lane);
    }
    return round;
  }

  YB.Bot = { careful, careless, human, play, playHuman, worth };
})(window.YirmibirHani);

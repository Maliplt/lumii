"use strict";
(function (YB) {
  const TARGET = 21;
  const FULL = 5;
  const { worth, isAce, THIEF } = YB.Cards;

  function step(totals, card) {
    const next = new Set();
    for (const t of totals) {
      if (card.kind === "number") {
        next.add(t + worth(card));
        if (isAce(card)) next.add(t + 11);
      } else if (card.kind === "double") next.add(t * 2);
      else if (card.kind === "half") next.add(Math.floor(t / 2));
      else if (card.kind === "thief") next.add(Math.max(0, t - THIEF));
    }
    const under = [...next].filter((t) => t <= TARGET);
    const over = [...next].filter((t) => t > TARGET);
    return over.length ? [...under, Math.min(...over)] : under;
  }

  // every total an ace can make is kept
  function evaluate(cards) {
    let totals = [0];
    for (const card of cards) totals = step(totals, card);
    const fitting = totals.filter((t) => t <= TARGET).sort((a, b) => a - b);
    const bust = fitting.length === 0;
    const best = bust ? Math.min(...totals) : fitting[fitting.length - 1];
    return {
      best,
      low: bust ? best : fitting[0],
      soft: fitting.length > 1,
      bust,
      twentyOne: !bust && best === TARGET,
      count: cards.length,
    };
  }

  function isBlackjack(cards) {
    return cards.length === 2 && cards.some(isAce) && cards.some((card) => card.kind === "number" && worth(card) === 10);
  }

  YB.Lane = { TARGET, FULL, evaluate, isBlackjack };
})(window.YirmibirHani);

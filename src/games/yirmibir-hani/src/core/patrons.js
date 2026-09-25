"use strict";
// patrons sit at a table and ask for something
(function (YB) {
  const { isNumber, isRed, isAce, worth } = YB.Cards;

  const ORDERS = {
    red: { tip: 80, coins: 2, check: (nums) => nums.length > 0 && nums.every(isRed) },
    black: { tip: 80, coins: 2, check: (nums) => nums.length > 0 && nums.every((card) => !isRed(card)) },
    ace: { tip: 80, coins: 2, check: (nums) => nums.some(isAce) },
    face: { tip: 80, coins: 2, check: (nums) => nums.some((card) => card.rank >= 11) },
    three: { tip: 90, coins: 2, check: (nums, cards) => cards.length === 3 },
    two: { tip: 100, coins: 3, check: (nums, cards) => cards.length === 2 },
    joker: { tip: 100, coins: 3, check: (nums, cards, kind) => kind === "joker" },
    odd: { tip: 120, coins: 3, check: (nums) => nums.length > 0 && nums.every((card) => isAce(card) || worth(card) % 2 === 1) },
    even: { tip: 150, coins: 4, check: (nums) => nums.length > 0 && nums.every((card) => !isAce(card) && worth(card) % 2 === 0) },
    five: { tip: 150, coins: 4, check: (nums, cards, kind) => kind === "five" || cards.length >= YB.Lane.FULL },
  };

  const LOOKS = 6;

  function served(order, cards, kind) {
    const nums = cards.filter(isNumber);
    return ORDERS[order].check(nums, cards, kind);
  }

  YB.Patrons = { ORDERS, LOOKS, served };
})(window.YirmibirHani);

"use strict";
(function (YB) {
  const SUITS = ["H", "D", "C", "S"];
  const SPECIALS = ["joker", "double", "half", "thief"];
  const THIEF = 5;

  let serial = 0;

  const number = (rank, suit) => ({ id: ++serial, kind: "number", rank, suit });
  const special = (kind) => ({ id: ++serial, kind });

  const isNumber = (card) => card.kind === "number";
  const isRed = (card) => card.suit === "H" || card.suit === "D";
  const isAce = (card) => isNumber(card) && card.rank === 1;
  const worth = (card) => Math.min(card.rank, 10);

  function label(card) {
    if (card.kind === "joker") return "21";
    if (card.kind === "double") return "×2";
    if (card.kind === "half") return "÷2";
    if (card.kind === "thief") return `−${THIEF}`;
    return { 1: "A", 11: "J", 12: "Q", 13: "K" }[card.rank] || String(card.rank);
  }

  function shuffledPack(rng) {
    const pack = [];
    for (const suit of SUITS) for (let rank = 1; rank <= 13; rank++) pack.push(number(rank, suit));
    return rng.shuffle(pack);
  }

  // count number cards drawn from as many shuffled packs as needed
  function buildDeck(rng, count, specials = {}) {
    const deck = [];
    while (deck.length < count) deck.push(...shuffledPack(rng).slice(0, count - deck.length));
    for (const [kind, amount] of Object.entries(specials)) {
      for (let i = 0; i < amount; i++) deck.splice(rng.int(3, deck.length), 0, special(kind));
    }
    return deck;
  }

  YB.Cards = { SUITS, SPECIALS, THIEF, number, special, isNumber, isRed, isAce, worth, label, buildDeck };
})(window.YirmibirHani);

"use strict";
(function (YB) {
  const LEVELS = 10;
  const PACE = 1.6;
  // a comfortable human pace: seconds a card, used to size clocks and stars
  const HUMAN = 2.6;

  // each region is one inn on the road to the capital and adds one idea
  const REGIONS = [
    { id: "village", cards: [12, 16, 18, 20, 22, 24, 26, 28, 30, 32], perCard: 3.6, hearts: 3, specials: () => ({}) },
    { id: "harbor", cards: [20, 22, 24, 26, 28, 30, 32, 34, 36, 38], perCard: 3.4, hearts: 3, specials: (l) => ({ joker: 1 + Math.floor(l / 4) }) },
    { id: "pass", cards: [22, 24, 26, 28, 30, 32, 34, 36, 38, 40], perCard: 3.4, hearts: 4, specials: (l) => ({ double: 1 + Math.floor(l / 4), joker: l >= 3 ? 1 : 0 }) },
    { id: "abbey", cards: [24, 26, 28, 30, 32, 34, 36, 38, 40, 42], perCard: 3.4, hearts: 4, specials: (l) => ({ half: 1 + Math.floor(l / 4), thief: 1 + Math.floor(l / 6), joker: l >= 4 ? 1 : 0 }) },
    { id: "court", cards: [30, 32, 34, 36, 38, 40, 42, 44, 46, 48], perCard: 3.3, hearts: 4, specials: (l) => ({ joker: 1 + Math.floor(l / 4), double: 1 + Math.floor(l / 5), half: 1, thief: Math.floor(l / 5) }) },
  ];
  // what patrons may ask for in each inn; later inns add harder wishes
  const ORDERS = [
    ["red", "black", "ace", "face", "three"],
    ["red", "black", "ace", "face", "three", "two", "joker"],
    ["red", "black", "ace", "face", "three", "two", "joker", "odd", "five"],
    ["red", "black", "ace", "face", "three", "two", "joker", "odd", "five", "even"],
    ["red", "black", "ace", "face", "three", "two", "joker", "odd", "five", "even"],
  ];
  const SEATS = [1, 2, 2, 3, 3];
  const ALL_ORDERS = ORDERS[4];

  function patronsFor(region, index, deck, seed) {
    if (region === 0 && index < 3) return null;
    const joker = deck.some((card) => card.kind === "joker");
    const pool = ORDERS[region].filter((order) => order !== "joker" || joker);
    return { pool, max: SEATS[region], patience: region === 4 ? 9 : 11, seed };
  }

  const TUTORIAL = [[10, "S"], [6, "H"], [5, "D"], [13, "C"], [1, "S"], [9, "H"], [2, "C"], [7, "D"], [12, "H"], [4, "S"], [8, "C"], [3, "D"]];

  const cache = new Map();
  const round10 = (value) => Math.max(10, Math.round(value / 10) * 10);

  // star targets from a dozen human-paced runs
  function stars(level, seed) {
    const scores = [];
    for (let i = 0; i < 12; i++) scores.push(YB.Bot.playHuman(level, `${seed}/human/${i}`, HUMAN * (0.9 + (i % 4) * 0.08), 0.12 + (i % 3) * 0.08).score);
    scores.sort((a, b) => a - b);
    const at = (q) => scores[Math.min(scores.length - 1, Math.floor(q * scores.length))];
    // three stars stay within reach of a quick, careful player
    const best = YB.Bot.play(level, YB.Bot.careful, PACE).score;
    const three = round10(Math.min(at(0.8), best * 0.95));
    const two = Math.min(three - 10, round10(at(0.4)));
    const one = Math.min(two - 10, round10(at(0.15) * 0.7));
    return [Math.max(10, one), Math.max(20, two), Math.max(30, three)];
  }
  function deckFor(region, index, seed) {
    const spec = REGIONS[region];
    if (region === 0 && index === 0) return TUTORIAL.map(([rank, suit]) => YB.Cards.number(rank, suit));
    return YB.Cards.buildDeck(new YB.Random(seed), spec.cards[index], spec.specials(index));
  }

  // a few shuffles are tried for every level
  function build(region, index) {
    const key = `${region}/${index}`;
    if (cache.has(key)) return cache.get(key);
    const spec = REGIONS[region];
    const base = `${YB.GAME_ID}/${spec.id}/${index}`;
    let chosen = null;
    let gentlest = null;
    for (let attempt = 0; attempt < 12; attempt++) {
      const seed = attempt ? `${base}/${attempt}` : base;
      const deck = deckFor(region, index, seed);
      const level = {
        deck,
        time: region === 0 && index < 1 ? null : Math.round(deck.length * (spec.perCard - index * 0.03)),
        hearts: spec.hearts,
        hold: !(region === 0 && index < 2),
        region,
        index,
        seed,
        patrons: patronsFor(region, index, deck, seed),
      };
      const run = YB.Bot.play(level, YB.Bot.careful, PACE);
      // a shuffle is fair when a careful player keeps their hearts and a person at an easy pace rarely loses them
      const slips = [0, 1, 2, 3].filter((i) => YB.Bot.playHuman(level, `${seed}/check/${i}`, HUMAN).reason === "hearts").length;
      const fair = run.reason !== "hearts" && run.stats.clears >= deck.length / 5 && slips <= 1;
      const score = run.stats.clears * 10 - run.stats.busts * 15;
      if (!gentlest || slips < gentlest.slips) gentlest = { level, score, slips };
      if (fair && (!chosen || (region === 0 && score > chosen.score))) chosen = { level, score };
      if (fair && region > 0) break;
      if (region === 0 && index === 0) {
        chosen = { level, score };
        break;
      }
    }
    // if no shuffle passed, the one that cost the fewest hearts is used
    const level = (chosen || gentlest).level;
    level.stars = stars(level, level.seed);
    cache.set(key, level);
    return level;
  }

  function daily(day) {
    const seed = `${YB.GAME_ID}/daily/${day}`;
    const rng = new YB.Random(seed);
    const level = {
      deck: YB.Cards.buildDeck(rng, 52, { joker: 2, double: 2, half: 1, thief: 1 }),
      time: 140,
      hearts: 4,
      hold: true,
      seed,
      patrons: { pool: ALL_ORDERS, max: 3, patience: 10, seed },
    };
    level.stars = stars(level, seed);
    return level;
  }

  function endless(seed) {
    const rng = new YB.Random(seed);
    let dealt = 0;
    return {
      deck: [],
      time: 70,
      timeGain: 4,
      hearts: 3,
      hold: true,
      patrons: { pool: ALL_ORDERS, max: 2, patience: 10, seed },
      refill() {
        dealt++;
        const specials = dealt < 2 ? {} : { joker: 1, double: rng.int(0, 1), half: rng.int(0, 1), thief: rng.int(0, 1) };
        return YB.Cards.buildDeck(rng, 26, specials);
      },
    };
  }

  // the first time a card kind or rule shows up, the coach explains it
  function tipFor(region, index) {
    if (region === 0 && index === 1) return "time";
    if (region === 0 && index === 2) return "hold";
    if (region === 0 && index === 3) return "patrons";
    if (index === 0 && region > 0) return REGIONS[region].id;
    return null;
  }

  YB.Levels = { LEVELS, REGIONS, build, daily, endless, tipFor };
})(window.YirmibirHani);

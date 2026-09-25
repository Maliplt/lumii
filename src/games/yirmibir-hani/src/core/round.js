"use strict";
(function (YB) {
  const { evaluate, isBlackjack, FULL, TARGET } = YB.Lane;

  const POINTS = { twentyOne: 100, blackjack: 150, five: 120, joker: 100 };
  const FIVE_ON_21 = 50;
  const COMBO_MAX = 5;
  const COMBO_WINDOW = 4;
  const TIME_BONUS = 10;
  const EXTRA_TIME = 15;

  let patronSerial = 0;

  // one round at the tavern table
  class Round {
    constructor({ deck, time = null, hearts = 3, hold = true, lanes = 4, refill = null, timeGain = 0, patrons = null }) {
      this.deck = deck.slice();
      this.refill = refill;
      this.lanes = Array.from({ length: lanes }, () => []);
      this.time = time;
      this.timeLeft = time;
      this.timeGain = timeGain;
      this.hearts = hearts;
      this.maxHearts = hearts;
      this.holdEnabled = hold;
      this.held = null;
      this.score = 0;
      this.combo = 1;
      this.sinceClear = 0;
      this.over = false;
      this.reason = null;
      this.bonus = 0;
      this.lookahead = 1;
      this.used = new Set();
      this.stats = { placed: 0, clears: 0, twentyOnes: 0, blackjacks: 0, fives: 0, jokers: 0, busts: 0, bestCombo: 1, tips: 0, tipCoins: 0 };
      this.patronRules = patrons;
      this.seats = Array.from({ length: lanes }, () => null);
      if (patrons) {
        this.patronRng = new YB.Random(`${patrons.seed || "patrons"}/seats`);
        this.nextPatronAt = 0;
        this.seatPatrons([]);
      }
      this.current = this.draw();
      this.next = this.peek();
    }

    draw() {
      if (!this.deck.length && this.refill) this.deck.push(...this.refill());
      return this.deck.shift() || null;
    }

    peek() {
      if (!this.deck.length && this.refill) this.deck.push(...this.refill());
      return this.deck[0] || null;
    }

    // the next few cards after the current one
    upcoming(count) {
      while (this.deck.length < count && this.refill) this.deck.push(...this.refill());
      return this.deck.slice(0, count);
    }

    // what the lane would become with the current card, for hover hints
    preview(index) {
      if (this.over || !this.current) return null;
      if (this.current.kind === "joker") return { best: TARGET, twentyOne: true, bust: false, soft: false, count: this.lanes[index].length + 1 };
      return evaluate([...this.lanes[index], this.current]);
    }

    place(index) {
      if (this.over || !this.current) return [];
      const card = this.current;
      const lane = this.lanes[index];
      const events = [];
      lane.push(card);
      this.stats.placed++;
      events.push({ type: "place", lane: index, card, slot: lane.length - 1 });

      const result = card.kind === "joker" ? null : evaluate(lane);
      let kind = null;
      if (card.kind === "joker") kind = "joker";
      else if (result.twentyOne) kind = isBlackjack(lane) ? "blackjack" : "twentyOne";
      else if (result.bust) kind = "bust";
      else if (lane.length >= FULL) kind = "five";

      if (kind === "bust") {
        this.hearts--;
        this.combo = 1;
        this.sinceClear = 0;
        this.stats.busts++;
        events.push({ type: "bust", lane: index, cards: lane.splice(0), total: result.best, hearts: this.hearts });
        this.dismiss(index, "angry", events);
      } else if (kind) {
        const base = POINTS[kind] + (kind !== "five" && lane.length >= FULL ? FIVE_ON_21 : 0);
        const points = base * this.combo;
        this.score += points;
        this.stats.clears++;
        this.stats[{ twentyOne: "twentyOnes", blackjack: "blackjacks", five: "fives", joker: "jokers" }[kind]]++;
        this.stats.bestCombo = Math.max(this.stats.bestCombo, this.combo);
        const cards = lane.splice(0);
        events.push({ type: "clear", lane: index, kind, points, combo: this.combo, cards, total: kind === "five" ? result.best : TARGET });
        this.combo = Math.min(COMBO_MAX, this.combo + 1);
        this.sinceClear = 0;
        this.serve(index, cards, kind, events);
        if (this.timeGain && this.timeLeft !== null) {
          const gain = this.timeGain * (kind === "blackjack" ? 1.5 : 1);
          this.timeLeft += gain;
          events.push({ type: "time", amount: gain });
        }
      } else {
        this.sinceClear++;
        if (this.sinceClear >= COMBO_WINDOW && this.combo > 1) {
          this.combo = 1;
          events.push({ type: "comboLost" });
        }
      }
      this.waitPatrons(events);
      this.advance(events);
      if (!this.over) this.seatPatrons(events);
      return events;
    }

    serve(index, cards, kind, events) {
      const patron = this.seats[index];
      if (!patron || !YB.Patrons.served(patron.order, cards, kind)) return;
      const { tip, coins } = YB.Patrons.ORDERS[patron.order];
      this.score += tip;
      this.stats.tips++;
      this.stats.tipCoins += coins;
      this.seats[index] = null;
      patron.served = true;
      events.push({ type: "tip", lane: index, patron, tip, coins });
    }

    dismiss(index, mood, events) {
      const patron = this.seats[index];
      if (!patron) return;
      this.seats[index] = null;
      events.push({ type: "leave", lane: index, patron, mood });
    }

    waitPatrons(events) {
      this.seats.forEach((patron, index) => {
        if (!patron) return;
        patron.left--;
        if (patron.left <= 0) this.dismiss(index, "bored", events);
      });
    }

    seatPatrons(events) {
      const rules = this.patronRules;
      if (!rules) return;
      const seated = this.seats.filter(Boolean).length;
      if (seated >= rules.max || this.stats.placed < this.nextPatronAt) return;
      const open = this.seats.map((seat, i) => (seat ? -1 : i)).filter((i) => i >= 0);
      if (!open.length) return;
      const rng = this.patronRng;
      const lane = rng.pick(open);
      const patron = { id: ++patronSerial, lane, order: rng.pick(rules.pool), patience: rules.patience, left: rules.patience, look: rng.int(0, YB.Patrons.LOOKS - 1) };
      this.seats[lane] = patron;
      this.nextPatronAt = this.stats.placed + rng.int(1, 3);
      events.push({ type: "patron", lane, patron });
    }

    advance(events) {
      this.current = this.draw();
      if (!this.current && this.held) {
        this.current = this.held;
        this.held = null;
        events.push({ type: "unhold" });
      }
      this.next = this.peek();
      events.push({ type: "draw", current: this.current, next: this.next });
      if (this.hearts <= 0) this.finish("hearts", events);
      else if (!this.current) this.finish("deck", events);
    }

    swap() {
      if (this.over || !this.holdEnabled || !this.current) return [];
      if (this.held) {
        [this.current, this.held] = [this.held, this.current];
        return [{ type: "swap", current: this.current, held: this.held }];
      }
      if (!this.next) return [];
      this.held = this.current;
      this.current = this.draw();
      this.next = this.peek();
      return [{ type: "hold", held: this.held, current: this.current, next: this.next }];
    }

    // tavern tricks, each good once a round
    canUse(trick) {
      if (this.over || this.used.has(trick)) return false;
      if (trick === "time") return this.timeLeft !== null;
      if (trick === "broom") return this.lanes.some((lane) => lane.length);
      return true;
    }

    use(trick, lane = null) {
      if (!this.canUse(trick)) return [];
      if (trick === "broom" && (lane === null || !this.lanes[lane].length)) return [];
      this.used.add(trick);
      if (trick === "heart") {
        this.hearts++;
        this.maxHearts++;
        return [{ type: "trick", trick }];
      }
      if (trick === "time") {
        this.timeLeft += EXTRA_TIME;
        return [{ type: "trick", trick }, { type: "time", amount: EXTRA_TIME }];
      }
      if (trick === "peek") {
        this.lookahead = 3;
        return [{ type: "trick", trick }];
      }
      return [{ type: "trick", trick }, { type: "sweep", lane, cards: this.lanes[lane].splice(0) }];
    }

    tick(dt) {
      if (this.over || this.timeLeft === null) return [];
      this.timeLeft = Math.max(0, this.timeLeft - dt);
      if (this.timeLeft > 0) return [];
      const events = [];
      this.finish("time", events);
      return events;
    }

    finish(reason, events) {
      this.over = true;
      this.reason = reason;
      if (reason === "deck" && this.timeLeft !== null) {
        this.bonus = Math.ceil(this.timeLeft) * TIME_BONUS;
        this.score += this.bonus;
      }
      events.push({ type: "end", reason, bonus: this.bonus });
    }
  }

  YB.Round = Round;
  YB.Rules = { POINTS, FIVE_ON_21, COMBO_MAX, COMBO_WINDOW, TIME_BONUS, EXTRA_TIME };
})(window.YirmibirHani);

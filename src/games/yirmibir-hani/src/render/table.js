"use strict";
// draws the tavern table
(function (YB) {
  const { canvas, context, bake, cached, box, text, tint } = YB.Pixels;
  const { W: CW, H: CH } = YB.CardArt;
  const { clamp, easeOut, easeBack } = YB.util;
  const P = () => YB.PALETTE;

  const LANES = 4;
  const LANE_W = 40;
  const LANE_GAP = 2;
  const LANES_W = LANES * LANE_W + (LANES - 1) * LANE_GAP;
  const HEADER = 36;
  const HUD = 26;
  const SIDE = 52;
  const STRIP = 22;
  const TRAY = 26;
  const SLOT = 20;
  const BUBBLE_W = 21;
  const BUBBLE_H = 13;

  const STAR_SMALL = ["...y...", "..yzy..", "yyyzyyy", ".yzzzy.", "..yyy..", ".yY.Yy.", ".Y...Y."];
  const STAR_SMALL_OFF = ["...G...", "..GKG..", "GGGKGGG", ".GKKKG.", "..GKG..", ".GG.GG.", ".G...G."];
  const TICK = ["......l", ".....ll", "l...ll.", "ll.ll..", ".lll...", "..l...."];

  const sprite = (key, rows, options = { outline: "k" }) => cached(`table|${key}`, () => bake(rows, options));

  const settle = (cards) => cards.forEach((s) => {
    s.x = s.to.x;
    s.y = s.to.y;
    s.dur = 0;
    s.face = true;
  });

  class Table {
    // how much art space the table needs, for the stage to pick its pixel size
    static room({ patrons = false, tray = false } = {}) {
      const strip = patrons ? STRIP : 0;
      return { portrait: [174, 262 + strip + (tray ? TRAY : 0)], landscape: [250 + (tray ? TRAY : 0), 228 + strip] };
    }

    constructor() {
      this.particles = new YB.Particles();
      this.time = 0;
      this.width = 0;
      this.height = 0;
      this.round = null;
    }

    start(round, { back = "crimson", cloth = "plain", stars = null, mode = "story", theme = "village", tricks = null } = {}) {
      this.theme = theme;
      this.round = round;
      this.back = back;
      this.cloth = cloth;
      this.stars = stars;
      this.mode = mode;
      this.stock = tricks?.stock || null;
      this.tray = tricks?.ids.length ? tricks.ids : null;
      this.strip = round.patronRules ? STRIP : 0;
      this.lanes = Array.from({ length: LANES }, () => []);
      this.leaving = [];
      this.pending = [];
      this.popups = [];
      this.particles.clear();
      this.timers = [];
      this.shown = new Array(LANES).fill(0);
      this.target = new Array(LANES).fill(0);
      this.soft = new Array(LANES).fill(null);
      this.fill = new Array(LANES).fill(0);
      this.flash = new Array(LANES).fill(0);
      this.bump = new Array(LANES).fill(0);
      this.crack = new Array(LANES).fill(0);
      this.overflow = new Array(LANES).fill(0);
      this.guests = new Array(LANES).fill(null);
      this.gone = [];
      this.trayPop = {};
      this.armed = null;
      this.hint = null;
      this.hoverPatron = null;
      this.shake = 0;
      this.hover = null;
      this.scoreShown = 0;
      this.scorePop = 0;
      this.comboPop = 0;
      this.heartLost = -1;
      this.heartTime = 0;
      this.heartGain = 0;
      this.pouchPop = 0;
      this.timePop = 0;
      this.peekPop = 0;
      this.introAt = this.time;
      this.current = null;
      this.next = null;
      this.held = null;
      this.layout();
      this.current = round.current ? this.card(round.current, "pile") : null;
      this.next = round.next ? this.card(round.next, "pile") : null;
      if (this.current) this.move(this.current, this.slot("current"), 0.38, { arc: 10, delay: 0.25, flip: true });
      if (this.next) this.move(this.next, this.slot("next"), 0.32, { arc: 6, delay: 0.4 });
      round.seats.forEach((patron, lane) => {
        if (!patron) return;
        const delay = 0.7 + lane * 0.15;
        this.guests[lane] = this.guest(patron, delay);
        this.later(delay, () => YB.Audio.play("patron", lane));
      });
    }

    resize(width, height) {
      this.width = width;
      this.height = height;
      if (!this.round) return;
      this.layout();
      this.settle();
    }

    layout() {
      const { width, height } = this;
      const strip = this.strip;
      const portrait = width < 280 || height > width * 1.05;
      const L = { portrait };
      if (portrait) {
        const colW = LANES_W + 4;
        const trayH = this.tray ? TRAY : 0;
        const base = HUD + 10 + strip + HEADER + 2 + 10 + 60 + trayH;
        const cards = clamp(height - 8 - base, CH + 44, CH + 4 * 22);
        L.offset = Math.floor((cards - CH) / 4);
        const content = base + CH + 4 * L.offset;
        L.x = Math.floor((width - colW) / 2);
        L.w = colW;
        L.hudY = Math.max(4, Math.floor((height - content) / 2));
        L.timerY = L.hudY + HUD;
        L.laneTop = L.timerY + 10 + strip;
        L.cardsTop = L.laneTop + HEADER + 2;
        L.laneBottom = L.cardsTop + CH + 4 * L.offset;
        const deckTop = L.laneBottom + 10;
        L.current = { x: L.x + Math.floor(colW / 2 - CW / 2), y: deckTop + 3 };
        L.hold = { x: L.x + 2, y: deckTop + 1, w: CW + 4, h: CH + 4 };
        L.pile = { x: L.x + colW - 3 - CW, y: deckTop + 4 };
        L.next = { x: L.pile.x - 15, y: deckTop + 4 };
        L.table = { x: L.x - 5, y: L.laneTop - 6, w: colW + 10, h: deckTop + 63 - (L.laneTop - 6) };
        L.laneX = (i) => L.x + 2 + i * (LANE_W + LANE_GAP);
        if (this.tray) {
          const span = this.tray.length * SLOT + (this.tray.length - 1) * 4;
          L.tray = { x: L.x + Math.floor((colW - span) / 2), y: L.table.y + L.table.h + 5, dx: SLOT + 4, dy: 0 };
        }
      } else {
        const trayW = this.tray ? TRAY : 0;
        const blockW = trayW + LANES_W + 4 + 8 + SIDE;
        const cards = clamp(height - 8 - HUD - 10 - strip - HEADER - 6, CH + 44, CH + 4 * 20);
        L.offset = Math.floor((cards - CH) / 4);
        const content = HUD + strip + Math.max(10 + HEADER + 2 + CH + 4 * L.offset, 10 + 184);
        L.x = Math.floor((width - blockW) / 2);
        L.w = blockW;
        const lx = L.x + trayW;
        L.hudY = Math.max(4, Math.floor((height - content) / 2));
        L.timerY = L.hudY + HUD;
        L.laneTop = L.timerY + 10 + strip;
        L.cardsTop = L.laneTop + HEADER + 2;
        L.laneBottom = L.cardsTop + CH + 4 * L.offset;
        const side = lx + LANES_W + 4 + 8;
        L.current = { x: side + Math.floor((SIDE - CW) / 2), y: L.laneTop + 2 };
        L.pile = { x: side + SIDE - CW - 1, y: L.laneTop + 64 };
        L.next = { x: side + 1, y: L.laneTop + 62 };
        L.hold = { x: side + Math.floor((SIDE - CW - 4) / 2), y: L.laneTop + 124, w: CW + 4, h: CH + 4 };
        const bottom = Math.max(L.laneBottom, L.hold.y + L.hold.h);
        L.table = { x: lx - 5, y: L.laneTop - 6, w: blockW - trayW + 10, h: bottom + 8 - (L.laneTop - 6) };
        L.laneX = (i) => lx + 2 + i * (LANE_W + LANE_GAP);
        if (this.tray) {
          const span = this.tray.length * SLOT + (this.tray.length - 1) * 4;
          L.tray = { x: L.x - 3, y: L.table.y + Math.floor((L.table.h - span) / 2), dx: 0, dy: SLOT + 4 };
        }
      }
      L.tableTop = L.table.y;
      L.pause = { x: L.x, y: L.hudY + 1, w: 18, h: 18 };
      this.L = L;
    }

    // snaps every card to where it belongs after a resize
    settle() {
      this.lanes.forEach((lane, i) => lane.forEach((s, j) => this.place(s, this.slot("lane", i, j))));
      if (this.current) this.place(this.current, this.slot("current"));
      if (this.next) this.place(this.next, this.slot("next"));
      if (this.held) this.place(this.held, this.slot("held"));
    }

    slot(kind, lane = 0, index = 0) {
      const L = this.L;
      if (kind === "lane") return { x: L.laneX(lane) + 1, y: L.cardsTop + index * L.offset };
      if (kind === "current") return { ...L.current };
      if (kind === "next") return { ...L.next };
      if (kind === "held") return { x: L.hold.x + 2, y: L.hold.y + 2 };
      return { ...L.pile };
    }

    traySlot(i) {
      const T = this.L.tray;
      return { x: T.x + i * T.dx, y: T.y + i * T.dy, w: SLOT, h: SLOT };
    }

    card(card, at) {
      const p = this.slot(at);
      return { card, x: p.x, y: p.y, from: p, to: p, t0: 0, dur: 0, arc: 0, flip: false, face: at !== "pile" };
    }

    guest(patron, delay) {
      return { p: patron, t0: this.time + delay, phase: Math.random() * 3, shown: 1 };
    }

    place(s, p) {
      s.from = p;
      s.to = p;
      s.dur = 0;
      s.x = p.x;
      s.y = p.y;
      s.face = true;
    }

    move(s, to, dur, { arc = 0, delay = 0, flip = false } = {}) {
      s.from = { x: s.x, y: s.y };
      s.to = to;
      s.t0 = this.time + delay;
      s.dur = dur;
      s.arc = arc;
      s.flip = flip && !s.face;
      if (!flip) s.face = true;
    }

    step(s) {
      if (!s.dur) return 1;
      const p = clamp((this.time - s.t0) / s.dur, 0, 1);
      const e = easeOut(p);
      s.x = s.from.x + (s.to.x - s.from.x) * e;
      s.y = s.from.y + (s.to.y - s.from.y) * e - Math.sin(p * Math.PI) * s.arc;
      if (s.flip && p >= 0.5) s.face = true;
      if (p >= 1) s.dur = 0;
      return p;
    }

    apply(events) {
      const flight = 0.2;
      const emptied = new Set();
      for (const event of events) {
        if (event.type === "place") {
          const s = this.current;
          this.current = null;
          this.lanes[event.lane].push(s);
          this.move(s, this.slot("lane", event.lane, event.slot), flight, { arc: 14 });
          this.later(flight, () => this.landed(event.lane, s));
        } else if (event.type === "clear") {
          const cards = this.lanes[event.lane];
          this.lanes[event.lane] = [];
          this.pending.push(cards);
          this.later(flight, () => this.cleared(event, cards));
        } else if (event.type === "bust") {
          const cards = this.lanes[event.lane];
          this.lanes[event.lane] = [];
          this.pending.push(cards);
          this.later(flight, () => this.busted(event, cards));
        } else if (event.type === "tip" || event.type === "leave") {
          const guest = this.guests[event.lane];
          if (guest && guest.p === event.patron) {
            this.guests[event.lane] = null;
            emptied.add(event.lane);
            guest.leave = { t0: this.time + flight + (event.type === "tip" ? 0.15 : 0.05), mood: event.type === "tip" ? "happy" : event.mood === "angry" ? "angry" : "blink" };
            this.gone.push(guest);
            this.later(flight, () => (event.type === "tip" ? this.tipped(event, guest) : this.walkedOut(event, guest)));
          }
        } else if (event.type === "patron") {
          const delay = flight + (emptied.has(event.lane) ? 0.75 : 0.15);
          this.guests[event.lane] = this.guest(event.patron, delay);
          this.later(delay, () => YB.Audio.play("patron", event.lane));
        } else if (event.type === "sweep") {
          this.swept(event);
        } else if (event.type === "trick") {
          this.tricked(event.trick);
        } else if (event.type === "draw") {
          this.pullFromDeck(event);
        } else if (event.type === "unhold") {
          this.next = this.held;
          this.held = null;
        } else if (event.type === "hold") {
          this.held = this.current;
          this.move(this.held, this.slot("held"), 0.18, { arc: 8 });
          this.pouchPop = this.time;
          this.current = null;
          this.pullFromDeck({ current: event.current, next: event.next });
        } else if (event.type === "swap") {
          [this.current, this.held] = [this.held, this.current];
          this.move(this.current, this.slot("current"), 0.18, { arc: 10 });
          this.move(this.held, this.slot("held"), 0.18, { arc: 10 });
          this.pouchPop = this.time;
        } else if (event.type === "time") {
          this.timePop = this.time;
          this.popup(`+${event.amount}`, this.L.x + this.L.w - 16, this.L.timerY + 12, { font: "small", color: P().l });
        } else if (event.type === "comboLost") {
          this.comboPop = this.time;
        }
      }
    }

    pullFromDeck({ current, next }) {
      if (current) {
        if (this.next && this.next.card === current) this.current = this.next;
        else if (this.held && this.held.card === current) {
          this.current = this.held;
          this.held = null;
        } else this.current = this.card(current, "pile");
        this.move(this.current, this.slot("current"), 0.22, { arc: 6, flip: true });
      } else this.current = null;
      if (next && (!this.next || this.next.card !== next || this.next === this.current)) {
        this.next = this.card(next, "pile");
        this.move(this.next, this.slot("next"), 0.2, { delay: 0.05 });
      } else if (!next) this.next = null;
    }

    later(delay, fn) {
      this.timers.push({ at: this.time + delay, fn });
    }

    landed(lane, s) {
      if (!this.lanes[lane].includes(s)) return;
      this.bump[lane] = this.time;
      const x = s.x + CW / 2;
      const y = s.y + CH;
      this.particles.burst(x, y - 2, { kind: "puff", count: 5, colors: ["#fff3da", "#efd3a6"], speed: 30, spread: Math.PI, angle: -Math.PI / 2, gravity: -10, life: 0.35, size: 2 });
      this.refreshLane(lane);
      YB.Audio.play("place", lane);
    }

    refreshLane(lane) {
      const cards = this.lanes[lane].map((s) => s.card);
      const result = YB.Lane.evaluate(cards);
      this.target[lane] = cards.length ? result.best : 0;
      this.soft[lane] = result.soft ? result.low : null;
    }

    cleared(event, cards) {
      const lane = event.lane;
      const L = this.L;
      const cx = L.laneX(lane) + LANE_W / 2;
      this.flash[lane] = this.time;
      this.overflow[lane] = this.time;
      this.target[lane] = event.total;
      this.shown[lane] = event.total;
      this.pending = this.pending.filter((p) => p !== cards);
      settle(cards);
      const group = { cards, t0: this.time + 0.12, kind: "clear", lane };
      cards.forEach((s, i) => {
        s.vx = (i - (cards.length - 1) / 2) * 14 + (Math.random() - 0.5) * 10;
        s.vy = -90 - Math.random() * 30;
        s.spin = (Math.random() - 0.5) * 5;
        s.rot = 0;
      });
      this.leaving.push(group);
      const top = L.cardsTop + (cards.length - 1) * L.offset * 0.5;
      this.particles.burst(cx, top + 20, { kind: "spark", count: 26, colors: ["#fff39e", "#ffd84a", "#ffffff"], speed: 110, gravity: 60, life: 0.8 });
      this.particles.burst(cx, L.laneTop, { kind: "confetti", count: 18, colors: ["#e8424f", "#ffd84a", "#4a9be8", "#6cc24a", "#a45fd6"], speed: 90, spread: 1.6, gravity: 70, life: 1.4 });
      this.particles.coins(cx, top + 12, this.scoreAnchor(), Math.min(12, 3 + event.combo * 2));
      const words = { twentyOne: "pop.twentyOne", blackjack: "pop.blackjack", five: "pop.five", joker: "pop.joker" };
      this.popup(YB.t(words[event.kind]), cx, L.cardsTop + 10, { color: "#ffd84a", shade: "#e9a126", size: 13, life: 1.1, lane });
      this.popups = this.popups.filter((p) => p.lane !== `${lane}+`);
      this.popup(`+${event.points}`, cx, L.cardsTop + 26, { font: "big", color: "#fff3da", shade: "#efd3a6", life: 1.1, delay: 0.1, lane: `${lane}+` });
      if (event.combo > 1) this.comboPop = this.time;
      this.shake = Math.max(this.shake, event.kind === "blackjack" ? 2.4 : 1.2);
      this.later(0.55, () => {
        this.shown[lane] = 0;
        this.target[lane] = 0;
        this.soft[lane] = null;
      });
      YB.Audio.play("clear", { kind: event.kind, combo: event.combo });
    }

    busted(event, cards) {
      const lane = event.lane;
      const L = this.L;
      this.target[lane] = event.total;
      this.shown[lane] = event.total;
      this.crack[lane] = this.time;
      this.pending = this.pending.filter((p) => p !== cards);
      settle(cards);
      const group = { cards, t0: this.time + 0.32, kind: "bust", lane, shakeFrom: this.time };
      cards.forEach((s) => {
        s.vx = (Math.random() - 0.5) * 60;
        s.vy = -40 - Math.random() * 30;
        s.spin = (Math.random() - 0.5) * 8;
        s.rot = 0;
      });
      this.leaving.push(group);
      this.heartLost = event.hearts;
      this.heartTime = this.time;
      this.shake = 3.2;
      const cx = L.laneX(lane) + LANE_W / 2;
      this.popup(YB.t("pop.bust"), cx, L.cardsTop + 14, { color: "#ff8a8f", shade: "#a3263a", size: 13, life: 1.1, lane });
      this.particles.burst(cx, L.laneTop + 10, { kind: "spark", count: 16, colors: ["#e8424f", "#a3263a", "#ffd1a8"], speed: 90, gravity: 220, life: 0.7 });
      this.later(0.7, () => {
        this.shown[lane] = 0;
        this.target[lane] = 0;
        this.soft[lane] = null;
      });
      YB.Audio.play("bust");
    }

    headOf(lane) {
      return { x: this.L.laneX(lane) + 9, y: this.L.tableTop - 11 };
    }

    tipped(event, guest) {
      const L = this.L;
      const head = this.headOf(event.lane);
      const bubble = L.laneX(event.lane) + 18 + Math.floor(BUBBLE_W / 2);
      this.particles.burst(head.x, head.y - 4, { kind: "spark", count: 14, colors: ["#fff39e", "#ffd84a", "#ffffff"], speed: 70, gravity: 80, life: 0.7 });
      this.later(0.25, () => this.particles.coins(bubble, L.tableTop - 14, this.scoreAnchor(), 2 + event.coins * 2));
      this.popup(YB.t("pop.tip"), bubble, L.tableTop - 20, { color: "#ffd84a", shade: "#e9a126", size: 10, life: 1.2, delay: 0.1, lane: `${event.lane}t` });
      this.popup(`+${event.tip}`, bubble, L.tableTop - 6, { font: "big", color: "#fff39e", shade: "#ffd84a", life: 1.2, delay: 0.2, lane: `${event.lane}tp` });
      setTimeout(() => YB.Audio.play("tip"), 180);
      guest.coins = event.coins;
    }

    walkedOut(event) {
      const head = this.headOf(event.lane);
      const angry = event.mood === "angry";
      this.particles.burst(head.x, head.y - 6, { kind: "puff", count: angry ? 8 : 4, colors: angry ? ["#e8e0e8", "#a89aa6"] : ["#d3dce8"], speed: 26, spread: 1.4, angle: -Math.PI / 2, gravity: -30, life: 0.7, size: 2 });
      YB.Audio.play("leave", angry);
    }

    swept(event) {
      const lane = event.lane;
      const cards = this.lanes[lane];
      this.lanes[lane] = [];
      settle(cards);
      const dir = lane < 2 ? -1 : 1;
      cards.forEach((s, i) => {
        s.vx = dir * (110 + i * 18 + Math.random() * 30);
        s.vy = -30 - Math.random() * 20;
        s.spin = dir * (1.5 + Math.random());
        s.rot = 0;
      });
      this.leaving.push({ cards, t0: this.time, kind: "sweep", lane });
      this.target[lane] = 0;
      this.soft[lane] = null;
      const L = this.L;
      const cx = L.laneX(lane) + LANE_W / 2;
      for (let i = 0; i < 4; i++) this.particles.burst(cx, L.cardsTop + 10 + i * 16, { kind: "puff", count: 4, colors: ["#efd3a6", "#c9a877"], speed: 50, spread: 0.8, angle: dir < 0 ? Math.PI : 0, gravity: -8, life: 0.5, size: 2 });
      YB.Audio.play("sweep");
    }

    tricked(trick) {
      this.trayPop[trick] = this.time;
      const L = this.L;
      if (L.tray) {
        const r = this.traySlot(this.tray.indexOf(trick));
        this.particles.burst(r.x + SLOT / 2, r.y + SLOT / 2, { kind: "spark", count: 14, colors: ["#fff39e", "#a8e2ff", "#ffffff"], speed: 60, gravity: 40, life: 0.6 });
      }
      if (trick === "heart") {
        this.heartGain = this.time;
        const hx = L.x + L.w - 8;
        this.particles.burst(hx, L.hudY + 10, { kind: "spark", count: 16, colors: ["#ff8a8f", "#e8424f", "#ffffff"], speed: 60, gravity: 50, life: 0.7 });
      } else if (trick === "peek") {
        this.peekPop = this.time;
        this.particles.burst(L.next.x + CW / 2, L.next.y + CH / 2, { kind: "spark", count: 18, colors: ["#a8e2ff", "#4a9be8", "#ffffff"], speed: 70, gravity: 30, life: 0.7 });
      } else if (trick === "time") {
        this.particles.burst(L.x + L.w - 10, L.timerY + 3, { kind: "spark", count: 14, colors: ["#6cc24a", "#fff39e"], speed: 50, gravity: 40, life: 0.6 });
      }
      YB.Audio.play("trick");
    }

    popup(content, x, y, { font = null, color, shade = null, size = 13, life = 1, delay = 0, lane = null } = {}) {
      const image = font ? YB.Font.render(font, content, { color, shade, ink: P().k }) : text(content, { size, color, shade });
      if (lane !== null) this.popups = this.popups.filter((p) => p.lane !== lane);
      const crowd = this.popups.filter((p) => Math.abs(p.y - y) < 12 && Math.abs(p.x - x) < 70 && this.time - p.t0 < p.life * 0.7).length;
      this.popups.push({ image, x, y: y - crowd * 30, t0: this.time + delay, life, lane });
    }

    scoreAnchor() {
      return { x: this.L.x + Math.floor(this.L.w / 2), y: this.L.hudY + 8 };
    }

    // shows what the patron at a lane wants for a moment
    showOrder(lane, seconds = 2.4) {
      if (!this.guests[lane]) return;
      this.hint = { lane, until: this.time + seconds };
    }

    hit(x, y) {
      const L = this.L;
      if (!L) return null;
      const inside = (r) => x >= r.x && x < r.x + r.w && y >= r.y && y < r.y + r.h;
      if (inside({ x: L.pause.x - 4, y: 0, w: L.pause.w + 8, h: L.pause.h + 8 })) return { type: "pause" };
      if (this.tray) {
        for (let i = 0; i < this.tray.length; i++) {
          const r = this.traySlot(i);
          if (inside({ x: r.x - 2, y: r.y - 2, w: r.w + 4, h: r.h + 4 })) return { type: "trick", id: this.tray[i] };
        }
      }
      if (this.round?.holdEnabled && inside({ x: L.hold.x - 3, y: L.hold.y - 3, w: L.hold.w + 6, h: L.hold.h + 6 })) return { type: "hold" };
      for (let i = 0; i < LANES; i++) {
        const lx = L.laneX(i) - LANE_GAP / 2;
        if (x < lx || x >= lx + LANE_W + LANE_GAP) continue;
        if (y >= L.laneTop - 4 && y < L.laneBottom + 8) return { type: "lane", index: i };
        if (this.strip && y >= L.tableTop - STRIP && y < L.laneTop - 4) return { type: "patron", index: i };
      }
      return null;
    }

    // where a thing is on screen, in art pixels, for the coach's hand
    anchor(kind, index = 0) {
      const L = this.L;
      if (kind === "lane") return { x: L.laneX(index) + LANE_W / 2, y: L.cardsTop + 20 };
      if (kind === "hold") return { x: L.hold.x + L.hold.w / 2, y: L.hold.y + L.hold.h / 2 };
      if (kind === "current") return { x: L.current.x + CW / 2, y: L.current.y + CH / 2 };
      if (kind === "timer") return { x: L.x + L.w / 2, y: L.timerY + 3 };
      if (kind === "patron") return { x: L.laneX(index) + 20, y: L.tableTop - 12 };
      if (kind === "tray" && L.tray) {
        const r = this.traySlot(index);
        return { x: r.x + SLOT / 2, y: r.y + SLOT / 2 };
      }
      return { x: L.x + L.w / 2, y: L.laneTop };
    }

    update(dt) {
      this.time += dt;
      if (this.timers.length) {
        const due = this.timers.filter((t) => t.at <= this.time);
        this.timers = this.timers.filter((t) => t.at > this.time);
        due.forEach((t) => t.fn());
      }
      for (let i = 0; i < LANES; i++) {
        const diff = this.target[i] - this.shown[i];
        if (diff) this.shown[i] += Math.sign(diff) * Math.max(1, Math.round(Math.abs(diff) * dt * 12));
        if (Math.sign(this.target[i] - this.shown[i]) !== Math.sign(diff)) this.shown[i] = this.target[i];
        const fill = Math.min(1.1, this.shown[i] / 21);
        this.fill[i] += (fill - this.fill[i]) * Math.min(1, dt * 10);
        const guest = this.guests[i];
        if (guest) guest.shown += (guest.p.left / guest.p.patience - guest.shown) * Math.min(1, dt * 8);
      }
      if (this.round) {
        const diff = this.round.score - this.scoreShown;
        if (diff > 0) {
          this.scoreShown += Math.max(1, Math.ceil(diff * dt * 6));
          if (this.scoreShown >= this.round.score) this.scoreShown = this.round.score;
          this.scorePop = this.time;
        } else this.scoreShown = this.round.score;
      }
      for (const group of this.leaving) {
        if (this.time < group.t0) continue;
        const gravity = { bust: 520, sweep: 140 }[group.kind] || 60;
        for (const s of group.cards) {
          s.vy += gravity * dt;
          s.x += s.vx * dt;
          s.y += s.vy * dt;
          s.rot += s.spin * dt;
        }
      }
      this.leaving = this.leaving.filter((g) => this.time - g.t0 < (g.kind === "bust" ? 1.4 : g.kind === "sweep" ? 0.8 : 0.7));
      this.gone = this.gone.filter((g) => this.time - g.leave.t0 < 1.2);
      this.popups = this.popups.filter((p) => this.time - p.t0 < p.life);
      if (this.hint && this.time > this.hint.until) this.hint = null;
      this.particles.update(dt);
      this.shake = Math.max(0, this.shake - dt * 10);
    }

    draw(ctx, { calm = false } = {}) {
      const L = this.L;
      if (!L || !this.round) return;
      ctx.save();
      if (this.shake > 0.2 && !calm) ctx.translate(Math.round((Math.random() - 0.5) * this.shake), Math.round((Math.random() - 0.5) * this.shake));
      if (this.strip) this.drawPatrons(ctx);
      this.drawTable(ctx);
      if (this.strip) this.drawBubbles(ctx);
      for (let i = 0; i < LANES; i++) this.drawLane(ctx, i);
      this.drawDeck(ctx);
      for (let i = 0; i < LANES; i++) for (const s of this.lanes[i]) this.drawCard(ctx, s);
      for (const cards of this.pending) for (const s of cards) this.drawCard(ctx, s);
      for (const group of this.leaving) this.drawLeaving(ctx, group);
      if (this.current) this.drawCurrent(ctx);
      this.particles.draw(ctx);
      ctx.restore();
      this.drawHud(ctx);
      if (this.tray) this.drawTray(ctx);
      for (const p of this.popups) this.drawPopup(ctx, p);
      this.drawLabel(ctx);
    }

    drawTable(ctx) {
      const { table } = this.L;
      const theme = YB.THEMES[this.theme];
      const [light, mid, dark] = theme.table;
      box(ctx, table.x, table.y + 3, table.w, table.h, "rgba(20,10,20,0.45)", { ink: null, notch: 2 });
      box(ctx, table.x, table.y, table.w, table.h, mid, { ink: P().k, light, dark, notch: 2 });
      ctx.fillStyle = dark;
      for (let y = table.y + 9; y < table.y + table.h - 3; y += 9) ctx.fillRect(table.x + 2, y, table.w - 4, 1);
      ctx.fillStyle = "rgba(255,255,255,0.07)";
      for (let y = table.y + 10; y < table.y + table.h - 3; y += 9) ctx.fillRect(table.x + 2, y, table.w - 4, 1);
      const L = this.L;
      if (L.portrait) {
        const clothY = L.laneBottom + 5;
        const h = table.y + table.h - clothY - 1;
        YB.Cloth.fill(ctx, this.cloth, theme, table.x + 1, clothY, table.w - 2, h);
        ctx.fillStyle = "rgba(0,0,0,0.25)";
        ctx.fillRect(table.x + 1, clothY, table.w - 2, 1);
        ctx.fillStyle = "rgba(255,255,255,0.18)";
        for (let x = table.x + 3; x < table.x + table.w - 3; x += 4) ctx.fillRect(x, clothY + 2, 2, 1);
      } else {
        const side = L.current.x - 8;
        YB.Cloth.fill(ctx, this.cloth, theme, side, table.y + 1, table.x + table.w - side - 1, table.h - 2);
        ctx.fillStyle = "rgba(0,0,0,0.25)";
        ctx.fillRect(side, table.y + 1, 1, table.h - 2);
        ctx.fillStyle = "rgba(255,255,255,0.18)";
        for (let y = table.y + 3; y < table.y + table.h - 3; y += 4) ctx.fillRect(side + 2, y, 1, 2);
      }
    }

    // how far a patron has sunk behind the table (0 is seated), and their mood
    pose(guest) {
      if (guest.leave) {
        const age = this.time - guest.leave.t0;
        if (age < 0) return { sink: 0, mood: "idle", dx: 0 };
        const mood = guest.leave.mood;
        if (mood === "happy") return { sink: age < 0.4 ? -Math.round(Math.sin((age / 0.4) * Math.PI) * 4) : Math.round((age - 0.4) * 55), mood, dx: 0 };
        if (mood === "angry") return { sink: age < 0.35 ? 0 : Math.round((age - 0.35) * 60), mood, dx: age < 0.35 ? (Math.floor(age * 30) % 2 ? 1 : -1) : 0 };
        return { sink: Math.round(age * 45), mood, dx: 0 };
      }
      const age = this.time - guest.t0;
      if (age < 0) return null;
      const a = clamp(age / 0.45, 0, 1);
      const sink = Math.round((1 - easeBack(a)) * 20);
      const left = guest.p.left;
      let mood = left <= 1 ? "angry" : "idle";
      if (mood === "idle" && (this.time + guest.phase) % 3.4 < 0.13) mood = "blink";
      return { sink, mood, dx: 0 };
    }

    drawPatrons(ctx) {
      const L = this.L;
      const draw = (guest) => {
        const pose = this.pose(guest);
        if (!pose || pose.sink >= 20) return;
        const image = YB.PatronArt.patron(guest.p.look, pose.mood);
        const x = L.laneX(guest.p.lane) + 1 + pose.dx;
        ctx.save();
        ctx.beginPath();
        ctx.rect(x - 2, L.tableTop - STRIP - 4, image.width + 4, STRIP + 6);
        ctx.clip();
        ctx.drawImage(image, x, L.tableTop - 17 + pose.sink);
        ctx.restore();
      };
      this.gone.forEach(draw);
      this.guests.forEach((guest) => guest && draw(guest));
    }

    drawBubbles(ctx) {
      const L = this.L;
      for (const guest of this.guests) {
        if (!guest) continue;
        const pose = this.pose(guest);
        if (!pose || pose.sink > 6) continue;
        const lane = guest.p.lane;
        const x0 = L.laneX(lane) + 1;
        // hands resting on the table's edge
        const [skin, shade] = YB.PatronArt.skin(guest.p.look);
        for (const hx of [x0 + 2, x0 + 10]) {
          box(ctx, hx, L.tableTop - 1 + Math.max(0, pose.sink), 5, 4, skin, { ink: P().k, dark: shade, notch: 1 });
        }
        const age = this.time - guest.t0;
        if (age < 0.3) continue;
        const pop = clamp((age - 0.3) / 0.25, 0, 1);
        const left = guest.p.left;
        const urgent = left <= 3;
        const jitter = urgent && Math.floor(this.time * 14) % 2 ? 1 : 0;
        const bx = L.laneX(lane) + 18 + jitter;
        const by = L.tableTop - 21 + Math.round((1 - easeBack(pop)) * 4);
        const hot = this.hint?.lane === lane || this.hoverPatron === lane;
        box(ctx, bx, by, BUBBLE_W, BUBBLE_H, hot ? P().z : P().s, { ink: P().k, light: P().w, dark: P().S, notch: 1 });
        ctx.fillStyle = P().k;
        ctx.fillRect(bx - 1, by + 8, 1, 2);
        ctx.fillRect(bx - 2, by + 10, 1, 1);
        ctx.fillStyle = hot ? P().z : P().s;
        ctx.fillRect(bx, by + 8, 1, 2);
        const icon = YB.PatronArt.order(guest.p.order);
        ctx.drawImage(icon, bx + Math.floor((BUBBLE_W - icon.width) / 2), by + Math.floor((BUBBLE_H - icon.height) / 2));
        // patience
        const barX = L.laneX(lane) + 19;
        const barY = L.tableTop - 7;
        const barW = BUBBLE_W - 2;
        box(ctx, barX, barY, barW, 4, P().N, { ink: P().k, notch: 0 });
        const ratio = clamp(guest.shown, 0, 1);
        const color = ratio > 0.5 ? P().l : ratio > 0.25 ? P().y : P().r;
        if (!(urgent && Math.floor(this.time * 5) % 2)) {
          ctx.fillStyle = color;
          ctx.fillRect(barX + 1, barY + 1, Math.round((barW - 2) * ratio), 2);
        }
        if (urgent && left > 1) {
          const drop = Math.floor(this.time * 3) % 3;
          ctx.fillStyle = P().c;
          ctx.fillRect(x0 + 13, L.tableTop - 14 + drop, 1, 2);
          ctx.fillStyle = P().w;
          ctx.fillRect(x0 + 13, L.tableTop - 14 + drop, 1, 1);
        }
      }
    }

    // a caption over the table: what a patron wants, or what a trick needs
    drawLabel(ctx) {
      const L = this.L;
      let content = null;
      let lane = null;
      if (this.armed === "broom") content = YB.t("tricks.pickLane");
      else {
        lane = this.hint ? this.hint.lane : this.hoverPatron;
        const guest = lane !== null ? this.guests[lane] : null;
        if (guest) content = YB.t(`orders.${guest.p.order}.text`);
      }
      if (!content) return;
      const image = text(content, { size: 11, color: P().k, ink: null });
      const w = image.width + 8;
      const h = image.height + 5;
      const center = lane !== null ? L.laneX(lane) + LANE_W / 2 : L.x + L.w / 2;
      const x = Math.round(clamp(center - w / 2, 2, this.width - w - 2));
      const y = Math.max(2, L.tableTop - STRIP - h + 1);
      box(ctx, x, y, w, h, P().z, { ink: P().k, light: P().w, dark: P().y, notch: 1 });
      ctx.drawImage(image, x + 4, y + 3);
    }

    drawLane(ctx, i) {
      const L = this.L;
      const x = L.laneX(i);
      const hover = this.hover === i && !this.round.over;
      const sweeping = this.armed === "broom" && this.lanes[i].length > 0;
      ctx.fillStyle = hover ? "rgba(255,240,190,0.18)" : this.guests[i] ? "rgba(255,216,74,0.1)" : "rgba(35,23,38,0.16)";
      ctx.fillRect(x, L.cardsTop - 2, LANE_W, L.laneBottom - L.cardsTop + 4);
      if (sweeping && Math.floor(this.time * 4) % 2) {
        ctx.fillStyle = "rgba(168,226,255,0.22)";
        ctx.fillRect(x, L.cardsTop - 2, LANE_W, L.laneBottom - L.cardsTop + 4);
      }
      const count = this.lanes[i].length;
      if (count < YB.Lane.FULL) {
        const p = this.slot("lane", i, count);
        ctx.fillStyle = hover ? "rgba(255,243,218,0.7)" : "rgba(255,243,218,0.28)";
        for (let d = 2; d < CW - 2; d += 3) {
          ctx.fillRect(p.x + d, p.y, 1, 1);
          ctx.fillRect(p.x + d, p.y + CH - 1, 1, 1);
        }
        for (let d = 2; d < CH - 2; d += 3) {
          ctx.fillRect(p.x, p.y + d, 1, 1);
          ctx.fillRect(p.x + CW - 1, p.y + d, 1, 1);
        }
      }
      this.drawMug(ctx, i, x + Math.floor(LANE_W / 2) - 8, L.laneTop);
      this.drawPlaque(ctx, i, x + 1, L.laneTop + 19, hover);
      if (this.flash[i] && this.time - this.flash[i] < 0.14) {
        ctx.fillStyle = "rgba(255,255,255,0.55)";
        ctx.fillRect(x, L.laneTop, LANE_W, L.laneBottom - L.laneTop);
      }
    }

    drawMug(ctx, i, x, y) {
      const bump = this.bump[i] ? Math.max(0, 1 - (this.time - this.bump[i]) * 8) : 0;
      y -= Math.round(bump * 2);
      const cracked = this.crack[i] && this.time - this.crack[i] < 0.8;
      const fill = cracked ? 0 : clamp(this.fill[i], 0, 1);
      const h = 15;
      const w = 12;
      ctx.fillStyle = P().k;
      ctx.fillRect(x, y + 2, w, h + 1);
      ctx.fillRect(x + w, y + 5, 4, 8);
      ctx.fillStyle = "#cfe9f2";
      ctx.fillRect(x + 1, y + 3, w - 2, h - 1);
      ctx.fillStyle = P().k;
      ctx.fillRect(x + w + 1, y + 7, 2, 4);
      ctx.fillStyle = "#cfe9f2";
      ctx.fillRect(x + w, y + 6, 3, 1);
      ctx.fillRect(x + w, y + 11, 3, 1);
      ctx.fillRect(x + w + 2, y + 6, 1, 6);
      const level = Math.round(fill * (h - 3));
      if (level > 0) {
        const top = y + 3 + (h - 1) - level;
        ctx.fillStyle = this.target[i] > 21 ? P().r : P().a;
        ctx.fillRect(x + 1, top, w - 2, level);
        ctx.fillStyle = P().A;
        ctx.fillRect(x + 1, top + level - 2, w - 2, 2);
        ctx.fillStyle = P().s;
        ctx.fillRect(x + 1, top - 1, w - 2, 2);
        if (fill >= 0.99 && !cracked) {
          const t = this.time * 8;
          ctx.fillRect(x, top - 2, w, 1);
          ctx.fillRect(x + 2 + Math.round(Math.sin(t) * 2), top - 3, 3, 1);
          ctx.fillRect(x + 6 + Math.round(Math.cos(t * 1.3)), top - 3, 3, 1);
        }
      }
      ctx.fillStyle = "rgba(255,255,255,0.7)";
      ctx.fillRect(x + 2, y + 5, 1, h - 6);
      ctx.fillStyle = P().M;
      ctx.fillRect(x + 1, y + 3, w - 2, 1);
      ctx.fillRect(x + 1, y + h + 1, w - 2, 1);
      if (cracked) {
        ctx.fillStyle = P().k;
        ctx.fillRect(x + 4, y + 4, 1, 3);
        ctx.fillRect(x + 5, y + 7, 1, 2);
        ctx.fillRect(x + 6, y + 9, 1, 3);
        ctx.fillRect(x + 7, y + 6, 1, 2);
      }
      const spill = this.overflow[i] && this.time - this.overflow[i] < 0.6;
      if (spill) {
        const t = (this.time - this.overflow[i]) / 0.6;
        ctx.fillStyle = P().s;
        for (let b = 0; b < 5; b++) {
          const bx = x + 1 + b * 2 + Math.round(Math.sin(b * 2 + t * 9));
          ctx.fillRect(bx, y - Math.round(t * 8) - (b % 2) * 2, 2, 2);
        }
      }
    }

    drawPlaque(ctx, i, x, y, hover) {
      const w = LANE_W - 2;
      const h = 15;
      const bump = this.bump[i] ? Math.max(0, 1 - (this.time - this.bump[i]) * 7) : 0;
      y -= Math.round(bump * 2);
      box(ctx, x, y, w, h, P().n, { ink: P().k, light: P().T, dark: P().N, notch: 1 });
      let value = this.shown[i];
      let color = P().s;
      let shade = P().S;
      let soft = this.soft[i];
      const preview = hover && this.round.current && !this.armed ? this.round.preview(i) : null;
      if (preview) {
        value = preview.best;
        soft = preview.soft ? preview.low : null;
        const blink = Math.floor(this.time * 4) % 2 === 0;
        color = preview.bust ? (blink ? P().x : P().r) : preview.twentyOne ? P().z : P().y;
        shade = preview.bust ? P().R : P().Y;
      } else if (this.target[i] > 21) {
        color = P().x;
        shade = P().r;
      } else if (this.target[i] === 21) {
        color = P().z;
        shade = P().y;
      }
      const digits = YB.Font.render("big", String(value), { color, shade, ink: P().k });
      const dx = soft !== null ? -4 : 0;
      ctx.drawImage(digits, x + Math.floor((w - digits.width) / 2) + dx, y + 2);
      if (soft !== null) {
        const small = YB.Font.render("small", `/${soft}`, { color: P().S });
        ctx.drawImage(small, x + Math.floor((w + digits.width) / 2) + dx + 1, y + h - 7);
      }
      const count = preview ? preview.count : this.lanes[i].length;
      for (let p = 0; p < YB.Lane.FULL; p++) {
        ctx.fillStyle = p < count ? P().y : P().N;
        ctx.fillRect(x + Math.floor(w / 2) - 9 + p * 4, y + h + 1, 3, 2);
      }
    }

    drawDeck(ctx) {
      const L = this.L;
      const remaining = this.round.deck.length;
      const pile = L.pile;
      const back = YB.CardArt.back(this.back);
      if (this.mode !== "endless") {
        const layers = Math.min(4, Math.ceil(remaining / 6));
        for (let i = layers - 1; i >= 0; i--) ctx.drawImage(back, pile.x + i, pile.y + i * 1);
        if (!remaining) {
          ctx.fillStyle = "rgba(35,23,38,0.35)";
          ctx.fillRect(pile.x + 2, pile.y + 2, CW - 4, CH - 4);
        }
        const count = YB.Font.render("small", String(remaining), { color: P().s });
        box(ctx, pile.x + CW - count.width - 3, pile.y + CH - 4, count.width + 4, 9, P().k, { ink: null, notch: 1 });
        ctx.drawImage(count, pile.x + CW - count.width - 1, pile.y + CH - 2);
      } else {
        for (let i = 3; i >= 0; i--) ctx.drawImage(back, pile.x + i, pile.y + i);
      }
      if (this.round.lookahead > 1 && this.next) this.drawPeek(ctx);
      else if (this.next) this.drawCard(ctx, this.next, { dim: true });

      if (this.round.holdEnabled) {
        const h = L.hold;
        const pop = this.pouchPop ? Math.max(0, 1 - (this.time - this.pouchPop) * 6) : 0;
        box(ctx, h.x, h.y - Math.round(pop * 2), h.w, h.h, "rgba(35,23,38,0.28)", { ink: null, notch: 2 });
        ctx.fillStyle = "rgba(255,243,218,0.55)";
        for (let d = 3; d < h.w - 3; d += 3) {
          ctx.fillRect(h.x + d, h.y, 1, 1);
          ctx.fillRect(h.x + d, h.y + h.h - 1, 1, 1);
        }
        for (let d = 3; d < h.h - 3; d += 3) {
          ctx.fillRect(h.x, h.y + d, 1, 1);
          ctx.fillRect(h.x + h.w - 1, h.y + d, 1, 1);
        }
        if (!this.held) {
          const pouch = sprite("pouch", YB.Sprites.POUCH);
          ctx.drawImage(pouch, h.x + Math.floor((h.w - pouch.width) / 2), h.y + Math.floor((h.h - pouch.height) / 2) - 2);
        } else this.drawCard(ctx, this.held);
      }
    }

    // the spyglass trick: the next three cards written on a slip
    drawPeek(ctx) {
      this.step(this.next);
      const x = Math.round(this.next.x);
      const pop = this.peekPop ? Math.max(0, 1 - (this.time - this.peekPop) * 5) : 0;
      const y = Math.round(this.next.y) - Math.round(pop * 3);
      box(ctx, x, y, CW, CH, P().s, { ink: P().k, light: P().w, dark: P().S, notch: 2 });
      const eye = sprite("trick-peek", YB.Sprites.TRICKS.peek);
      ctx.drawImage(eye, x + Math.floor((CW - eye.width) / 2), y + 2);
      this.round.upcoming(3).forEach((card, i) => {
        const cy = y + 13 + i * 13;
        ctx.fillStyle = P().S;
        for (let d = 3; d < CW - 3; d += 2) ctx.fillRect(x + d, cy - 2, 1, 1);
        const head = YB.CardArt.corner(card);
        if (i > 0) ctx.globalAlpha = 0.75;
        ctx.drawImage(head, x + Math.floor((CW - head.width) / 2), cy + 1);
        ctx.globalAlpha = 1;
      });
    }

    drawCurrent(ctx) {
      const s = this.current;
      const done = this.step(s) >= 1;
      const bob = done && !this.round.over ? Math.round(Math.sin(this.time * 4) * 1) : 0;
      if (done) {
        const glow = Math.floor(this.time * 3) % 2 ? P().z : P().y;
        box(ctx, Math.round(s.x) - 2, Math.round(s.y) - 2 + bob, CW + 4, CH + 4, "rgba(0,0,0,0)", { ink: glow, notch: 3 });
      }
      this.drawCard(ctx, s, { offset: bob, stepped: true });
    }

    drawCard(ctx, s, { dim = false, offset = 0, stepped = false } = {}) {
      if (!stepped) this.step(s);
      if (this.time < s.t0 && s.dur) return;
      const image = s.face ? YB.CardArt.face(s.card) : YB.CardArt.back(this.back);
      const x = Math.round(s.x);
      const y = Math.round(s.y) + offset;
      if (s.flip && s.dur) {
        const p = clamp((this.time - s.t0) / s.dur, 0, 1);
        const squash = Math.max(1, Math.round(CW * Math.abs(Math.cos(p * Math.PI))));
        ctx.drawImage(image, x + Math.floor((CW - squash) / 2), y, squash, CH);
      } else {
        ctx.drawImage(image, x, y);
      }
      if (dim) {
        ctx.fillStyle = "rgba(35,23,38,0.3)";
        ctx.fillRect(x + 1, y + 1, CW - 2, CH - 2);
      }
    }

    drawLeaving(ctx, group) {
      const age = this.time - group.t0;
      for (const s of group.cards) {
        let image = YB.CardArt.face(s.card);
        let jitter = 0;
        if (group.kind === "bust" && age < 0) {
          image = cached(`red|${s.card.kind}|${s.card.rank}|${s.card.suit}`, () => {
            const el = canvas(CW, CH);
            const c = context(el);
            c.drawImage(YB.CardArt.face(s.card), 0, 0);
            c.globalAlpha = 0.45;
            c.drawImage(tint(YB.CardArt.face(s.card), "#e8424f"), 0, 0);
            return el;
          });
          jitter = Math.round(Math.sin((this.time - group.shakeFrom) * 60));
        }
        if (group.kind === "clear" && age < 0) image = cached(`white|${s.card.kind}|${s.card.rank}|${s.card.suit}`, () => tint(YB.CardArt.face(s.card), "#fffbe8"));
        const alpha = group.kind === "clear" ? clamp(1 - age / 0.6, 0, 1) : group.kind === "sweep" ? clamp(1 - age / 0.75, 0, 1) : 1;
        if (alpha <= 0) continue;
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.translate(Math.round(s.x + CW / 2) + jitter, Math.round(s.y + CH / 2));
        ctx.rotate(age > 0 ? s.rot : 0);
        ctx.drawImage(image, -CW / 2, -CH / 2);
        ctx.restore();
      }
    }

    drawTray(ctx) {
      const counts = this.stock?.() || {};
      this.tray.forEach((id, i) => {
        const r = this.traySlot(i);
        const count = counts[id] || 0;
        const used = this.round.used.has(id);
        const ready = count > 0 && this.round.canUse(id);
        const armed = this.armed === id;
        const pop = this.trayPop[id] ? Math.max(0, 1 - (this.time - this.trayPop[id]) * 5) : 0;
        const y = r.y - Math.round(pop * 3);
        const ink = armed ? (Math.floor(this.time * 5) % 2 ? P().z : P().y) : P().k;
        box(ctx, r.x, y + 2, SLOT, SLOT, "rgba(20,10,20,0.45)", { ink: null, notch: 1 });
        box(ctx, r.x, y, SLOT, SLOT, ready ? P().s : P().K, { ink, light: ready ? P().w : "#5c4460", dark: ready ? P().S : null, notch: 1 });
        if (armed) box(ctx, r.x + 1, y + 1, SLOT - 2, SLOT - 2, "rgba(0,0,0,0)", { ink, notch: 0 });
        const icon = sprite(`trick-${id}`, YB.Sprites.TRICKS[id]);
        if (!ready) ctx.globalAlpha = 0.45;
        ctx.drawImage(icon, r.x + Math.floor((SLOT - icon.width) / 2), y + Math.floor((SLOT - icon.height) / 2) - 1);
        ctx.globalAlpha = 1;
        if (used) {
          const tick = sprite("tick", TICK);
          ctx.drawImage(tick, r.x + SLOT - tick.width + 1, y + SLOT - tick.height + 1);
        } else {
          const digits = YB.Font.render("small", String(count), { color: count ? P().s : P().g, ink: P().k });
          ctx.drawImage(digits, r.x + SLOT - digits.width + 1, y + SLOT - digits.height + 2);
        }
      });
    }

    drawHud(ctx) {
      const L = this.L;
      const round = this.round;
      const y = L.hudY;
      box(ctx, L.pause.x, L.pause.y, L.pause.w, L.pause.h, P().s, { ink: P().k, light: P().w, dark: P().S, notch: 1 });
      ctx.fillStyle = P().k;
      ctx.fillRect(L.pause.x + 1, L.pause.y + L.pause.h, L.pause.w - 2, 2);
      const icon = sprite("pause", YB.Sprites.ICONS.pause, { colors: { "#": P().k } });
      ctx.drawImage(icon, L.pause.x + 7, L.pause.y + 6);

      const cx = L.x + Math.floor(L.w / 2);
      const panelW = 62;
      box(ctx, cx - panelW / 2, y, panelW, 23, P().K, { ink: P().k, light: "#5c4460", notch: 2 });
      const pop = this.scorePop ? Math.max(0, 1 - (this.time - this.scorePop) * 8) : 0;
      const score = YB.Font.render("big", String(this.scoreShown), { color: P().s, shade: P().S, ink: P().k });
      ctx.drawImage(score, cx - Math.floor(score.width / 2), y + 2 - Math.round(pop));
      if (this.stars) {
        const barW = 56;
        const bx = cx - barW / 2;
        const by = y + 15;
        box(ctx, bx, by, barW, 5, P().N, { ink: P().k, notch: 0 });
        const top = this.stars[2];
        const ratio = clamp(this.scoreShown / top, 0, 1);
        ctx.fillStyle = P().y;
        ctx.fillRect(bx + 1, by + 1, Math.round((barW - 2) * ratio), 3);
        this.stars.forEach((value) => {
          const sx = bx + Math.round((barW - 2) * (value / top));
          const on = this.scoreShown >= value;
          const star = sprite(on ? "star-on" : "star-off", on ? STAR_SMALL : STAR_SMALL_OFF, { outline: "k" });
          ctx.drawImage(star, sx - 4, by - 2);
        });
      }

      if (round.combo > 1) {
        const bump = this.comboPop ? Math.max(0, 1 - (this.time - this.comboPop) * 5) : 0;
        const frame = Math.floor(this.time * 8) % 3;
        const flame = sprite(`flame${frame}`, YB.Sprites.FLAME[frame]);
        const combo = YB.Font.render("big", `×${round.combo}`, { color: P().z, shade: P().o, ink: P().k });
        const x = L.pause.x + L.pause.w + 2;
        ctx.drawImage(flame, x, y + 3 - Math.round(bump * 2));
        ctx.drawImage(combo, x + flame.width, y + 2 - Math.round(bump * 3));
        const left = YB.Rules.COMBO_WINDOW - round.sinceClear;
        for (let p = 0; p < YB.Rules.COMBO_WINDOW; p++) {
          ctx.fillStyle = p < left ? P().o : P().K;
          ctx.fillRect(x + flame.width + 1 + p * 4, y + 15, 3, 2);
        }
      }

      const heart = sprite("heart", YB.Sprites.HEART);
      const empty = sprite("heart-empty", YB.Sprites.HEART_EMPTY);
      const gap = round.maxHearts > 3 ? 8 : 9;
      const hw = round.maxHearts * gap + 3;
      const hx0 = L.x + L.w - hw;
      box(ctx, hx0, y + 3, hw, 14, P().K, { ink: P().k, light: "#5c4460", notch: 1 });
      for (let i = 0; i < round.maxHearts; i++) {
        const hx = hx0 + 2 + i * gap;
        let hy = y + 5;
        const lost = i >= round.hearts;
        if (i === round.maxHearts - 1 && this.heartGain && this.time - this.heartGain < 0.5) hy -= Math.round(Math.sin(((this.time - this.heartGain) / 0.5) * Math.PI) * 4);
        if (i === this.heartLost && this.time - this.heartTime < 0.6) {
          hy += Math.round(Math.sin((this.time - this.heartTime) * 40) * 2);
          if (this.time - this.heartTime < 0.3) {
            ctx.drawImage(heart, hx, hy);
            continue;
          }
        }
        ctx.drawImage(lost ? empty : heart, hx, hy);
      }

      if (round.timeLeft !== null) this.drawFuse(ctx);
    }

    drawFuse(ctx) {
      const L = this.L;
      const round = this.round;
      const x = L.x + 2;
      const w = L.w - 4 - 16;
      const y = L.timerY;
      const full = Math.max(round.time, round.timeLeft);
      const ratio = clamp(round.timeLeft / full, 0, 1);
      const danger = round.timeLeft <= 10 && !round.over;
      box(ctx, x, y, w, 6, P().N, { ink: P().k, notch: 1 });
      const fill = Math.round((w - 2) * ratio);
      const color = ratio > 0.5 ? P().y : ratio > 0.25 ? P().o : P().r;
      if (!(danger && Math.floor(this.time * 4) % 2)) {
        ctx.fillStyle = color;
        ctx.fillRect(x + 1, y + 1, fill, 4);
        ctx.fillStyle = "rgba(255,255,255,0.45)";
        ctx.fillRect(x + 1, y + 1, fill, 1);
      }
      if (fill > 0 && !round.over) {
        const flame = sprite(`flame${Math.floor(this.time * 10) % 3}`, YB.Sprites.FLAME[Math.floor(this.time * 10) % 3]);
        ctx.drawImage(flame, x + fill - 4, y - 6);
      }
      const seconds = YB.Font.render("small", String(Math.ceil(round.timeLeft)), { color: danger ? P().x : P().s });
      const pop = this.timePop ? Math.max(0, 1 - (this.time - this.timePop) * 5) : 0;
      ctx.drawImage(seconds, L.x + L.w - 2 - seconds.width, y + 1 - Math.round(pop * 2));
    }

    drawPopup(ctx, p) {
      const age = this.time - p.t0;
      if (age < 0) return;
      const t = age / p.life;
      const rise = Math.round(easeBack(Math.min(1, age * 4)) * 6 + t * 10);
      ctx.globalAlpha = t > 0.7 ? Math.max(0, 1 - (t - 0.7) / 0.3) : 1;
      ctx.drawImage(p.image, Math.round(p.x - p.image.width / 2), Math.round(p.y - rise));
      ctx.globalAlpha = 1;
    }
  }

  YB.Table = Table;
})(window.YirmibirHani);

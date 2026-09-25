"use strict";
(function (YB) {
  const { canvas, context, bake, cached, box } = YB.Pixels;
  const { label, isRed } = YB.Cards;
  const S = () => YB.Sprites;
  const P = () => YB.PALETTE;

  const W = 38;
  const H = 52;

  const SPECIAL = {
    joker: { fill: "#fff0c2", dark: "#f0d58a", ink: "#8a5a10" },
    double: { fill: "#ffe2d2", dark: "#f5c2a8", ink: "#a3263a" },
    half: { fill: "#f4e6cf", dark: "#e0c9a4", ink: "#744029" },
    thief: { fill: "#e0f2d6", dark: "#bfdcae", ink: "#255a3e" },
  };

  const suitColor = (suit) => (suit === "H" || suit === "D" ? P().r : P().k);

  function suitSprite(suit, big) {
    return cached(`suit|${suit}|${big}`, () => {
      const rows = big ? S().SUIT_BIG[suit] : S().SUIT_SMALL[suit];
      const red = suit === "H" || suit === "D";
      return bake(rows, { colors: { "#": red ? P().r : P().K, w: red ? P().x : P().g } });
    });
  }

  function corner(card) {
    return cached(`corner|${card.kind}|${card.rank}|${card.suit}`, () => {
      const text = label(card);
      const color = card.kind === "number" ? (isRed(card) ? P().R : P().k) : SPECIAL[card.kind].ink;
      const glyphs = YB.Font.render("card", text, { color });
      const suit = card.kind === "number" ? suitSprite(card.suit, false) : null;
      const el = canvas(glyphs.width + (suit ? suit.width + 2 : 0), 7);
      const ctx = context(el);
      ctx.drawImage(glyphs, 0, 0);
      if (suit) ctx.drawImage(suit, glyphs.width + 2, 0);
      return el;
    });
  }

  function paper(ctx, fill, dark) {
    box(ctx, 0, 0, W, H, fill, { ink: P().k, light: P().w, dark, notch: 2 });
    ctx.fillStyle = dark;
    ctx.fillRect(2, H - 3, W - 4, 1);
  }

  function face(card) {
    return cached(`face|${card.kind}|${card.rank}|${card.suit}`, () => {
      const el = canvas(W, H);
      const ctx = context(el);
      const special = SPECIAL[card.kind];
      paper(ctx, special ? special.fill : P().s, special ? special.dark : P().S);

      const head = corner(card);
      ctx.drawImage(head, 3, 3);
      ctx.save();
      ctx.translate(W, H);
      ctx.rotate(Math.PI);
      ctx.drawImage(head, 3, 3);
      ctx.restore();

      if (special) {
        const art = cached(`special|${card.kind}`, () => bake(S().SPECIAL_ART[card.kind], { outline: "k" }));
        ctx.drawImage(art, Math.round((W - art.width) / 2), 11);
        const big = YB.Font.render("big", label(card), { color: P().s, shade: P().S, ink: special.ink });
        ctx.drawImage(big, Math.round((W - big.width) / 2), 31);
      } else if (card.rank >= 11) {
        box(ctx, 9, 12, 20, 28, isRed(card) ? "#ffe8d6" : "#e6ecf7", { ink: P().q, notch: 1 });
        const portrait = cached(`portrait|${card.rank}`, () => bake(S().FACES[card.rank], { outline: "k" }));
        ctx.save();
        ctx.beginPath();
        ctx.rect(10, 13, 18, 26);
        ctx.clip();
        ctx.drawImage(portrait, Math.round((W - portrait.width) / 2), 16);
        ctx.restore();
      } else {
        const pip = suitSprite(card.suit, true);
        ctx.drawImage(pip, Math.round((W - pip.width) / 2), Math.round((H - pip.height) / 2) + 1);
      }
      return el;
    });
  }

  const EMBLEMS = {
    crown: ["y.y.y.y", "yyyyyyy", "yryybyy", "yyyyyyy"],
    leaf: ["...l...", "..lll..", ".llLll.", "lllLlll", ".llLll.", "..lLl..", "...L..."],
    wave: ["..cc...", ".c..c..", "c....cc", "......."],
    moon: ["..zzz..", ".zz....", "zz.....", "zz.....", "zz.....", ".zz....", "..zzz.."],
    sun: ["...y...", ".y.y.y.", "..yyy..", "yyyzyyy", "..yyy..", ".y.y.y.", "...y..."],
    mug: ["sssss..", "tttttt.", "tTttt.t", "tTttt.t", "tTtttt.", "ttttt.."],
  };

  const BACKS = {
    crimson: { fill: "#c8303e", dark: "#8f1f2e", line: "#ffd84a", dot: "#e8616b", emblem: "mug", pattern: "lattice" },
    forest: { fill: "#3c8a43", dark: "#255a3e", line: "#ffd84a", dot: "#6cc24a", emblem: "leaf", pattern: "dots" },
    harbor: { fill: "#2c5fa8", dark: "#1d3f73", line: "#a8e2ff", dot: "#4a9be8", emblem: "wave", pattern: "waves" },
    night: { fill: "#2b2450", dark: "#1a1633", line: "#fff39e", dot: "#5a4d8f", emblem: "moon", pattern: "stars" },
    royal: { fill: "#643a95", dark: "#43256a", line: "#ffd84a", dot: "#a45fd6", emblem: "crown", pattern: "lattice" },
    sun: { fill: "#e9a126", dark: "#b8741a", line: "#fff3da", dot: "#ffd84a", emblem: "sun", pattern: "dots" },
  };

  function back(id) {
    return cached(`back|${id}`, () => {
      const style = BACKS[id] || BACKS.crimson;
      const el = canvas(W, H);
      const ctx = context(el);
      box(ctx, 0, 0, W, H, style.fill, { ink: P().k, dark: style.dark, notch: 2 });
      ctx.fillStyle = style.line;
      ctx.fillRect(3, 3, W - 6, 1);
      ctx.fillRect(3, H - 4, W - 6, 1);
      ctx.fillRect(3, 3, 1, H - 6);
      ctx.fillRect(W - 4, 3, 1, H - 6);
      ctx.fillStyle = style.dot;
      for (let y = 5; y < H - 5; y++) {
        for (let x = 5; x < W - 5; x++) {
          let on = false;
          if (style.pattern === "lattice") on = (x + y) % 6 === 0 || (x - y + 60) % 6 === 0;
          else if (style.pattern === "dots") on = x % 4 === 1 && y % 4 === 1;
          else if (style.pattern === "waves") on = (y + Math.round(Math.sin(x * 0.8) * 1.2)) % 5 === 0;
          else if (style.pattern === "stars") on = (x * 7 + y * 13) % 23 === 0;
          if (on) ctx.fillRect(x, y, 1, 1);
        }
      }
      const cx = Math.floor(W / 2);
      const cy = Math.floor(H / 2);
      box(ctx, cx - 8, cy - 8, 17, 17, style.dark, { ink: style.line, notch: 2 });
      const emblem = bake(EMBLEMS[style.emblem], { outline: "k" });
      ctx.drawImage(emblem, cx - Math.floor(emblem.width / 2), cy - Math.floor(emblem.height / 2));
      return el;
    });
  }

  YB.CardArt = { W, H, face, back, corner, suitSprite, BACK_IDS: Object.keys(BACKS), BACKS, SPECIAL };
})(window.YirmibirHani);

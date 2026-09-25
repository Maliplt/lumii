"use strict";
// the patrons who come to the tables
(function (YB) {
  const { canvas, context, bake, cached } = YB.Pixels;
  const P = () => YB.PALETTE;

  // '1' skin, '2' skin shade, '3' hair; every other letter is the palette
  const FACES = {
    idle: ["..1111111111..", ".211k1111k112.", ".211k1111k112.", "..1p112211p1..", "..1111kk1111..", "...11111111..."],
    happy: ["..1111111111..", ".211k1111k112.", ".21k1k11k1k12.", "..1p112211p1..", "..11k1111k11..", "...11kkkk11..."],
    angry: ["..1kk1111kk1..", ".2111k11k1112.", ".211k1111k112.", "..1p112211p1..", "..111kkkk111..", "...1k1111k1..."],
    blink: ["..1111111111..", ".211111111112.", ".21kk1111kk12.", "..1p112211p1..", "..1111kk1111..", "...11111111..."],
  };

  const LOOKS = [
    {
      // a farmer in a straw hat
      skin: ["#ffd1a8", "#e0986a"],
      hair: "#744029",
      hat: ["..............", ".....yyyy.....", "....yYYYYy....", "....RRRRRR....", "yyyyyyyyyyyyyy", "..3333333333.."],
      body: [".....1111.....", "..lnllllllnl..", ".llnllllllnll.", "lllnllllllnlll", "LllnllllllnllL", "LllnllllllnllL"],
    },
    {
      // a sailor in a knitted cap
      skin: ["#e0a86a", "#a8683f"],
      hair: "#4a2821",
      hat: ["......ss......", ".....bbbb.....", "....bbbbbb....", "...bbbbbbbb...", "..BBBBBBBBBB..", "..3111111113.."],
      body: [".....1111.....", "..ssssssssss..", ".bbbbbbbbbbbb.", "ssssssssssssss", "bbbbbbbbbbbbbb", "ssssssssssssss"],
    },
    {
      // a guard off duty
      skin: ["#ffd1a8", "#e0986a"],
      hair: "#4a2821",
      hat: ["......rr......", ".....mmmm.....", "....mmmmmm....", "...mmwmmmmm...", "..MmmmmmmmmM..", "..MMMMMMMMMM.."],
      body: [".....1111.....", "..gggggggggg..", ".gggrrrrrrggg.", "gggGrrrrrrGggg", "gggGrryyrrGggg", "gggGrrrrrrGggg"],
    },
    {
      // a monk from the abbey
      skin: ["#ffe6cc", "#e8b890"],
      hair: "#744029",
      hat: ["..............", ".....nnnn.....", "...nnnnnnnn...", "..nnnnnnnnnn..", ".nnNNNNNNNNnn.", ".nN11111111Nn."],
      body: [".nn..1111..nn.", ".nnnnnnnnnnnn.", "nnnnnnqqnnnnnn", "nnNnnnqqnnnNnn", "nnNnnnnnnnnNnn", "nnNnnnnnnnnNnn"],
    },
    {
      // a lady with a coin-trimmed scarf
      skin: ["#ffd1a8", "#e0986a"],
      hair: "#231726",
      hat: ["..............", ".....vvvv.....", "...vvvvvvvv...", "..vvVvvvvVvv..", "..yvyvyvyvyv..", ".v3333333333v."],
      body: [".v...1111...v.", ".vppppppppppv.", ".pppppppppppp.", "ppPppppppppPpp", "ppPppyyppppPpp", "ppPppppppppPpp"],
    },
    {
      // a merchant in a turban
      skin: ["#c68a5a", "#9c6438"],
      hair: "#231726",
      hat: ["..............", ".....ssss.....", "...ssSSSSss...", "..sSSsssSSSs..", "..ssssrrssss..", "..SSSSSSSSSS.."],
      body: [".....1111.....", "..RRssssssRR..", ".RRRssyyssRRR.", "RRRRssssssRRRR", "RRRRssyyssRRRR", "RRRRssssssRRRR"],
    },
  ];

  const ANGRY_SKIN = ["#ff9a8a", "#d8655a"];

  // a patron as a baked sprite, 16×20 with its outline
  function patron(look, mood = "idle") {
    return cached(`patron|${look}|${mood}`, () => {
      const style = LOOKS[look % LOOKS.length];
      const skin = mood === "angry" ? ANGRY_SKIN : style.skin;
      return bake([...style.hat, ...(FACES[mood] || FACES.idle), ...style.body], { colors: { 1: skin[0], 2: skin[1], 3: style.hair }, outline: "k" });
    });
  }

  const CROWN = ["y...y...y", "yy.yzy.yy", "yyyyyyyyy", "yRyyByyRy", "YYYYYYYYY"];
  const JESTER = ["...lll..", "..lllll.", ".LLLLLLL", "..hhhh..", ".hkhhkh.", ".hhhhhh.", "..hRRh..", "...hh..."];

  function miniCard(fill, ink, dark) {
    const el = canvas(8, 11);
    const ctx = context(el);
    ctx.fillStyle = ink;
    ctx.fillRect(1, 0, 6, 11);
    ctx.fillRect(0, 1, 8, 9);
    ctx.fillStyle = fill;
    ctx.fillRect(1, 1, 6, 9);
    ctx.fillStyle = dark;
    ctx.fillRect(1, 9, 6, 1);
    return el;
  }

  function row(parts, gap = 1) {
    const width = parts.reduce((sum, part) => sum + part.width, 0) + gap * (parts.length - 1);
    const height = Math.max(...parts.map((part) => part.height));
    const el = canvas(width, height);
    const ctx = context(el);
    let x = 0;
    for (const part of parts) {
      ctx.drawImage(part, x, Math.floor((height - part.height) / 2));
      x += part.width + gap;
    }
    return el;
  }

  // the picture inside a patron's bubble for each kind of order
  function order(id) {
    return cached(`order|${id}`, () => {
      const suit = (s, color, light) => bake(YB.Sprites.SUIT_SMALL[s], { colors: { "#": color, w: light } });
      const digits = (text, color = P().k) => YB.Font.render("card", text, { color });
      const card = () => {
        const el = miniCard(P().r, P().k, P().R);
        const ctx = context(el);
        ctx.fillStyle = P().y;
        ctx.fillRect(3, 3, 2, 5);
        ctx.fillRect(2, 5, 4, 1);
        return el;
      };
      if (id === "red") return row([suit("H", P().r), suit("D", P().r)]);
      if (id === "black") return row([suit("S", P().k), suit("C", P().k)]);
      if (id === "ace") {
        const el = miniCard(P().s, P().k, P().S);
        context(el).drawImage(YB.Font.render("card", "A", { color: P().R }), 1, 2);
        return el;
      }
      if (id === "face") return bake(CROWN, { outline: "k" });
      if (id === "three" || id === "two" || id === "five") return row([digits({ three: "3", two: "2", five: "5" }[id]), card()]);
      if (id === "joker") return bake(JESTER, { outline: "k" });
      if (id === "odd") return digits("A35", P().R);
      if (id === "even") return digits("246", P().B);
      return canvas(1, 1);
    });
  }

  const skin = (look) => LOOKS[look % LOOKS.length].skin;

  YB.PatronArt = { LOOKS: LOOKS.length, patron, order, skin };
})(window.YirmibirHani);

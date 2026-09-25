"use strict";
// six notebooks of eighteen pages
(function (K) {
  const LEVELS = 18;
  const CHAPTERS = [
    { id: "first", color: "#ff8a7a", deep: "#e0594a", teach: null },
    { id: "pins", color: "#6cc4ff", deep: "#2f93d6", teach: "pins" },
    { id: "colors", color: "#b58cff", deep: "#8358e0", teach: "colors" },
    { id: "bands", color: "#5fd6a8", deep: "#23a577", teach: "bands" },
    { id: "mix", color: "#ffc94d", deep: "#e09a12", teach: null },
    { id: "master", color: "#ff8cc6", deep: "#e0569c", teach: null },
  ];
  const FREE_SIZES = { small: 9, medium: 14, large: 20 };

  const lerp = (a, b, t) => Math.round(a + (b - a) * t);

  function storySpec(chapter, level) {
    const t = level / (LEVELS - 1);
    const seed = `${K.SEED}/${chapter}/${level}`;
    const motif = K.MOTIFS[(chapter * LEVELS + level) % K.MOTIFS.length].id;
    const spec = { seed, motif, keep: 0.55 + 0.2 * t, shuffle: 0.55 + 0.45 * t };
    switch (chapter) {
      case 0:
        spec.nodes = [4, 5, 6, 6, 7, 7, 8, 8, 9, 9, 10, 10, 11, 11, 12, 12, 13, 14][level];
        spec.shuffle = 0.3 + 0.7 * t;
        if (level === 0) Object.assign(spec, { keep: 1, layout: "ring", minTangle: 1, maxTangle: 1 });
        if (level === 1) Object.assign(spec, { minTangle: 1, maxTangle: 2 });
        if (level === 2) Object.assign(spec, { minTangle: 2, maxTangle: 3 });
        break;
      case 1:
        Object.assign(spec, { nodes: lerp(8, 17, t), pins: 0.3 - 0.1 * t });
        break;
      case 2:
        Object.assign(spec, { nodes: lerp(9, 19, t), colors: level < 9 ? 2 : 3, keep: 0.72 + 0.16 * t });
        break;
      case 3:
        Object.assign(spec, { nodes: lerp(8, 17, t), bands: 0.2 + 0.12 * t });
        break;
      case 4:
        Object.assign(spec, { nodes: lerp(11, 21, t), keep: 0.62 + 0.14 * t });
        if (level % 3 !== 2) spec.pins = 0.14;
        if (level % 3 !== 0) spec.colors = 2;
        if (level % 3 !== 1) spec.bands = 0.15;
        break;
      default:
        Object.assign(spec, { nodes: lerp(15, 26, t), keep: 0.66 + 0.12 * t, shuffle: 0.75 + 0.25 * t });
        if (level % 2) spec.colors = level > 9 ? 3 : 2;
        if (level % 3 === 1) spec.pins = 0.12;
        if (level % 4 !== 0) spec.bands = 0.13;
    }
    return spec;
  }

  // mixes in only the ideas the player has already met
  function extras(rng, reached) {
    const spec = {};
    if (reached >= 1 && rng.chance(0.5)) spec.pins = 0.15;
    if (reached >= 2 && rng.chance(0.5)) spec.colors = 2;
    if (reached >= 3 && rng.chance(0.5)) spec.bands = 0.16;
    return spec;
  }

  const Levels = {
    LEVELS,
    CHAPTERS,
    FREE_SIZES,
    storySpec,

    story(chapter, level) {
      return K.Generator.build(storySpec(chapter, level));
    },

    daily(day, reached = 5) {
      const rng = new K.Random(`${K.SEED}/daily/${day}`);
      return K.Generator.build({ seed: `${K.SEED}/daily/${day}`, motif: rng.pick(K.MOTIFS).id, nodes: rng.int(12, 16), keep: 0.7, shuffle: 1, ...extras(rng, reached) });
    },

    free(size, seed, reached = 0) {
      const rng = new K.Random(`${K.SEED}/free/${seed}`);
      return K.Generator.build({ seed: `${K.SEED}/free/${seed}`, motif: rng.pick(K.MOTIFS).id, nodes: FREE_SIZES[size] || FREE_SIZES.medium, keep: 0.7, shuffle: 1, ...extras(rng, reached) });
    },

    // moves allowed for the "few moves" star
    par(puzzle) {
      const moved = puzzle.nodes.filter((node) => !node.pin && Math.hypot(node.start.x - node.home.x * 1.15, node.start.y - node.home.y * 1.15) > 0.08).length;
      return Math.max(2, Math.ceil(moved * 1.2) + 1);
    },
  };

  K.Levels = Levels;
})(window.Knotwise);

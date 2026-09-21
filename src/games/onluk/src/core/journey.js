"use strict";
/** Declarative chapter rules. Rendering and storage never own these rules. */
const TenJourney = (() => {
  const TOTAL_LEVELS = 250;
  const worlds = [
    {
      id: "classic",
      name: "Temel",
      en: "Basics",
      icon: "",
      rule: "Toplamı 10 yap.",
      ruleEn: "Make 10.",
      gravity: "down",
      min: 2,
    },
    {
      id: "reverse",
      name: "Ters yön",
      en: "Reverse",
      icon: "",
      rule: "Taşlar yukarı düşer.",
      ruleEn: "Tiles fall upward.",
      gravity: "up",
      min: 3,
    },
    {
      id: "bonus",
      name: "Bonus",
      en: "Bonus",
      icon: "",
      rule: "Sarı işaretli taş: +50 puan.",
      ruleEn: "Yellow-marked tile: +50 points.",
      gravity: "down",
      min: 3,
      gold: true,
    },
    {
      id: "four",
      name: "4’lü zincir",
      en: "Four tiles",
      icon: "",
      rule: "En az 4 taşı bağla.",
      ruleEn: "Connect at least 4 tiles.",
      gravity: "down",
      min: 4,
    },
    {
      id: "expert",
      name: "İleri",
      en: "Advanced",
      icon: "",
      rule: "Ters yerçekimi · Bonus taşlar",
      ruleEn: "Reverse gravity · Bonus tiles",
      gravity: "up",
      min: 3,
      gold: true,
    },
  ];
  const chapter = (level) =>
    worlds[Math.floor((level - 1) / 10) % worlds.length];
  const stars = (state) =>
    state.turns ? 0 : 1 + Number(!state.hints) + Number(!state.undos);
  const text = (world, language, rule = false) =>
    world[
      rule
        ? language === "tr"
          ? "rule"
          : "ruleEn"
        : language === "tr"
          ? "name"
          : "en"
    ];
  return { TOTAL_LEVELS, worlds, chapter, stars, text };
})();

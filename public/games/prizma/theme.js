"use strict";
const PrizmaTheme = (() => {
  const colors = {
    "#ded9cc": "#1e2329",
    "#c9c2b2": "#505965",
    "#d9926e": "#ffda3e",
    "#b97c5a": "#ab880e",
    "#fffaf0": "#fff6ba",
    "#d47e5c": "#ffda3e",
    "#aa6046": "#b38b0a",
    "#edb08b": "#fff4ab",
    "#92aaa6": "#8d969f",
    "#6e8d89": "#4c535c",
    "#c9d9d1": "#bec7d1",
    "#b5ae9e": "#090b0e",
    "#d8d5c7": "#393d43",
    "#fff3e4": "#383320",
    "#f7f6ed": "#25292f",
    "#9d7451": "#ffda3e",
    "#d4cdbe": "#515863",
    "#d18c6a": "#ffe469",
    "#aabeb5": "#929da8",
    "#b17453": "#af890b",
    "#859e93": "#515c66",
    "#e9eee4": "#343b43",
    "#ac674b": "#c5a11e",
    "#8eaaa2": "#8d99a5",
    "#fff0cc": "#151719",
    "#f8d9b1": "#fff5b3",
    "#ffe0af": "#ffdf63",
    "#92b2a6": "#bac4ce",
    "#9c937f": "#bbc2c9",
    "#e8e0cd": "#626b75",
    "#d77555": "#ffda3e",
    "#c5beb0": "#080a0c",
    "#ded9ca": "#1c2025",
    "#c8c3b5": "#0d1014",
    "#dad3c2": "#3d4248",
    "#fff3da": "#383320",
    "#faf7ee": "#25292f",
    "#fff7df": "#fff4ab",
    "#968b74": "#aab5c0",
  };
  const dark = () => document.documentElement.dataset.theme === "dark";
  function color(value) {
    return dark() ? colors[value] || value : value;
  }
  function markup(svg) {
    return dark()
      ? svg.replace(/#[0-9a-f]{6}/gi, (value) => color(value.toLowerCase()))
      : svg;
  }
  function apply(theme, language) {
    document.documentElement.dataset.theme = theme;
    document.querySelector('meta[name="theme-color"]').content =
      theme === "dark" ? "#141619" : "#f0efe6";
    const labels = {
      tr: ["Gece modu", "Aydınlık mod"],
      en: ["Night mode", "Light mode"],
      es: ["Modo nocturno", "Modo claro"],
      fr: ["Mode nuit", "Mode clair"],
      ar: ["الوضع الليلي", "الوضع الفاتح"],
      de: ["Nachtmodus", "Heller Modus"],
    };
    const button = document.getElementById("theme");
    button.setAttribute("aria-pressed", String(theme === "dark"));
    button.setAttribute(
      "aria-label",
      (labels[language] || labels.en)[theme === "dark" ? 1 : 0],
    );
    button.textContent = theme === "dark" ? "☀" : "◐";
  }
  return { color, markup, apply };
})();

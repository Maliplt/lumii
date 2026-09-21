"use strict";
const PrizmaTheme = (() => {
  const colors = {
    "#d8a366": "#ffda3e",
    "#8ca59a": "#b7c6d5",
    "#bf8154": "#fff4ab",
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
  const lightColors = {
    "#d8a366": "#c74336",
    "#8ca59a": "#b6ada3",
    "#bf8154": "#f3937f",
    "#ded9cc": "#e6dfd6",
    "#c9c2b2": "#cfc3b5",
    "#d9926e": "#f3937f",
    "#b97c5a": "#a5322a",
    "#fffaf0": "#ffffff",
    "#d47e5c": "#c74336",
    "#aa6046": "#942d27",
    "#edb08b": "#ffc8b5",
    "#92aaa6": "#b6ada3",
    "#6e8d89": "#897e72",
    "#c9d9d1": "#e5ded5",
    "#b5ae9e": "#b8a999",
    "#d8d5c7": "#dcd3c7",
    "#fff3e4": "#fff0e8",
    "#f7f6ed": "#ffffff",
    "#9d7451": "#c74336",
    "#d4cdbe": "#ddd0c2",
    "#d18c6a": "#ed927b",
    "#aabeb5": "#d0c5b8",
    "#b17453": "#a5322a",
    "#859e93": "#9c8c7b",
    "#e9eee4": "#f0eae2",
    "#ac674b": "#942d27",
    "#8eaaa2": "#ac9b88",
    "#fff0cc": "#ffffff",
    "#f8d9b1": "#ffd8c7",
    "#ffe0af": "#ffffff",
    "#92b2a6": "#978773",
    "#9c937f": "#817365",
    "#e8e0cd": "#fffaf5",
    "#d77555": "#e6634f",
    "#c5beb0": "#b6a38f",
    "#ded9ca": "#eee5dc",
    "#c8c3b5": "#bdad9c",
    "#dad3c2": "#dcd3c7",
    "#fff3da": "#fff0e8",
    "#faf7ee": "#ffffff",
    "#fff7df": "#ffffff",
    "#968b74": "#817365",
  };
  const dark = () => document.documentElement.dataset.theme === "dark";
  function color(value) {
    return (dark() ? colors : lightColors)[value] || value;
  }
  function markup(svg) {
    return svg.replace(/#[0-9a-f]{6}/gi, (value) => color(value.toLowerCase()));
  }
  function apply(theme, language) {
    document.documentElement.dataset.theme = theme;
    document.querySelector('meta[name="theme-color"]').content =
      theme === "dark" ? "#141619" : "#faf7f3";
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
    button.innerHTML =
      theme === "dark"
        ? '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l2 2m10 10 2 2M5 19l2-2M17 7l2-2"/></svg>'
        : '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 15a8 8 0 0 1-11-11 8 8 0 1 0 11 11Z"/></svg>';
  }
  return { color, markup, apply };
})();

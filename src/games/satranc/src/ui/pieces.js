"use strict";
const ChessArt = (() => {
  const shapes = {
    p: '<circle cx="32" cy="17" r="8"/><path d="M26 25h12l-2 8 6 15H22l6-15Z"/><path d="M20 48h24l3 8H17Z"/>',
    r: '<path d="M18 9h7v8h4V9h6v8h4V9h7v17l-7 5 2 17H23l2-17-7-5Z"/><path d="M20 48h24l3 8H17ZM24 26h16"/>',
    n: '<path d="m22 48 2-12 12-10-9 2-5 5-9-6 9-17 9-3 1-4 9 8c9 8 10 22 3 37Z"/><path d="m22 15 7 1M34 14l3 2M22 48h22l4 8H17Z"/>',
    b: '<path d="M32 6c-6 6-13 11-13 18 0 7 6 10 13 10s13-3 13-10C45 17 38 12 32 6Z"/><path d="m35 12-8 13M28 34l-5 14h18l-5-14M20 48h24l3 8H17Z"/><circle cx="32" cy="5" r="2.5"/>',
    q: '<path d="m16 19 6 22h20l6-22-10 10-6-15-6 15Z"/><path d="M23 41h18v7H23ZM20 48h24l3 8H17Z"/><circle cx="16" cy="16" r="3.5"/><circle cx="32" cy="11" r="3.5"/><circle cx="48" cy="16" r="3.5"/>',
    k: '<path d="M28 5h8v6h6v7H22v-7h6Z"/><path d="M32 24c-16-15-24 8-11 14l5 10h12l5-10c13-6 5-29-11-14Z"/><path d="M20 48h24l3 8H17ZM24 38h16"/>',
  };
  function piece(p, extra = "") {
    return `<svg class="piece ${Chess.color(p) === "w" ? "white" : "black"} ${extra}" viewBox="0 0 64 64" aria-hidden="true"><g stroke-linecap="round" stroke-linejoin="round">${shapes[p.toLowerCase()]}</g></svg>`;
  }
  const icons = {
    pause: '<path d="M8 5v14M16 5v14" stroke-width="3"/>',
    back: '<path d="m12 5-7 7 7 7M5 12h15"/>',
    next: '<path d="m12 5 7 7-7 7M19 12H4"/>',
    moon: '<path d="M20 14A8 8 0 0 1 10 4a8 8 0 1 0 10 10Z"/>',
    sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.5 1.5m11 11L19 19M5 19l1.5-1.5m11-11L19 5"/>',
    sound:
      '<path d="m4 9 4 0 5-4v14l-5-4H4ZM17 8c3 2 3 6 0 8m3-11c5 4 5 10 0 14"/>',
    mute: '<path d="m4 9 4 0 5-4v14l-5-4H4ZM17 9l5 6m0-6-5 6"/>',
    play: '<path d="m9 5 11 7-11 7Z"/>',
    flip: '<path d="M5 8h14l-4-4M19 16H5l4 4"/>',
    close: '<path d="m6 6 12 12M6 18 18 6"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 6v6l4 2"/>',
    book: '<path d="M12 5C9 3 5 3 2 4v15c3-1 7-1 10 1 3-2 7-2 10-1V4c-3-1-7-1-10 1Zm0 0v15"/>',
    flag: '<path d="M5 22V3c6-4 8 4 15 0v10c-7 4-9-4-15 0"/>',
    people:
      '<circle cx="8" cy="8" r="3"/><circle cx="18" cy="9" r="2.5"/><path d="M2 21v-3c0-7 12-7 12 0v3m2-7c5-2 7 2 6 7"/>',
    check: '<path d="m5 12 4 4L20 5"/>',
  };
  const icon = (name) =>
    `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${icons[name] || icons.play}</svg>`;
  return { piece, icon };
})();

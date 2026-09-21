"use strict";
const SudokuIcons = (() => {
  const paths = {
    arrow: '<path d="M4 12h15m-6-6 6 6-6 6"/>',
    back: '<path d="M20 12H5m6-6-6 6 6 6"/>',
    play: '<path d="m8 4 12 8-12 8Z"/>',
    pause: '<path d="M8 5v14M16 5v14"/>',
    close: '<path d="m6 6 12 12M18 6 6 18"/>',
    settings:
      '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-2.8 2.8-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.6v.2h-4V21a1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1L4.2 17l.1-.1a1.7 1.7 0 0 0 .3-1.9A1.7 1.7 0 0 0 3 14H2.8v-4H3a1.7 1.7 0 0 0 1.6-1 1.7 1.7 0 0 0-.3-1.9L4.2 7 7 4.2l.1.1A1.7 1.7 0 0 0 9 4.6a1.7 1.7 0 0 0 1-1.6v-.2h4V3a1.7 1.7 0 0 0 1 1.6 1.7 1.7 0 0 0 1.9-.3l.1-.1L19.8 7l-.1.1a1.7 1.7 0 0 0-.3 1.9 1.7 1.7 0 0 0 1.6 1h.2v4H21a1.7 1.7 0 0 0-1.6 1Z"/>',
    undo: '<path d="M4 10h9a6 6 0 0 1 0 12M4 10l5-5M4 10l5 5"/>',
    redo: '<path d="M20 10h-9a6 6 0 0 0 0 12M20 10l-5-5M20 10l-5 5"/>',
    erase: '<path d="m4 13 9-9 7 7-9 9H7l-3-3Z"/><path d="m9 8 7 7M11 20h10"/>',
    pencil:
      '<path d="m4 20 1-6L16 3l5 5-11 11Z"/><path d="m13 6 5 5M5 14l5 5"/>',
    hint: '<path d="M9 18h6M10 21h4M8 15a7 7 0 1 1 8 0l-1 3H9Z"/>',
    sun: '<circle cx="12" cy="12" r="4"/><path d="M12 1v3m0 16v3M1 12h3m16 0h3M4 4l2 2m12 12 2 2M20 4l-2 2M6 18l-2 2"/>',
    moon: '<path d="M20 15A9 9 0 0 1 9 4a9 9 0 1 0 11 11Z"/>',
    fire: '<path d="M13 2c2 6-5 7-2 11 2 0 4-2 4-4 7 7 4 13-3 13S2 17 5 11c0 4 3 4 3 2-2-4 1-7 5-11Z"/>',
    trophy:
      '<path d="M7 3h10v7a5 5 0 0 1-10 0ZM7 5H3v3a4 4 0 0 0 4 4m10-7h4v3a4 4 0 0 1-4 4M12 15v6m-4 0h8"/>',
    check: '<path d="m5 12 4 4L20 5"/>',
    grid: '<rect x="3" y="3" width="18" height="18" rx="1"/><path d="M9 3v18M15 3v18M3 9h18M3 15h18"/>',
    book: '<path d="M12 5v16M3 3c4 0 6 0 9 2 3-2 5-2 9-2v16c-4 0-6 0-9 2-3-2-5-2-9-2Z"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 6v6l4 2"/>',
    lock: '<rect x="5" y="10" width="14" height="11" rx="2"/><path d="M8 10V6a4 4 0 0 1 8 0v4"/>',
    chart: '<path d="M5 20V11m7 9V4m7 16v-6"/>',
    calendar:
      '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M8 3v4m8-4v4M3 10h18"/>',
    spark:
      '<path d="m12 2 1.6 6.4L20 10l-6.4 1.6L12 18l-1.6-6.4L4 10l6.4-1.6Z"/>',
    palette:
      '<path d="M12 3a9 9 0 0 0 0 18h1.5a2 2 0 0 0 0-4H12a2 2 0 0 1 0-4h4a5 5 0 0 0 5-5c0-3-4-5-9-5Z"/><circle cx="7" cy="10" r="1"/><circle cx="9" cy="6" r="1"/><circle cx="14" cy="6" r="1"/>',
    share:
      '<circle cx="18" cy="5" r="2"/><circle cx="6" cy="12" r="2"/><circle cx="18" cy="19" r="2"/><path d="m8 11 8-5M8 13l8 5"/>',
  };
  return (name) =>
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.65" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
    (paths[name] || paths.grid) +
    "</svg>";
})();

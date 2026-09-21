"use strict";
const DotView = (() => {
  function formatTime(ms) {
    const seconds = Math.floor(ms / 1000);
    return `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;
  }

  function roundedPath(points, cellSize) {
    if (!points.length) return "";
    let path = `M${points[0].x} ${points[0].y}`;
    const radius = cellSize * 0.19;
    for (let index = 1; index < points.length - 1; index++) {
      const previous = points[index - 1];
      const point = points[index];
      const next = points[index + 1];
      const incoming = Math.hypot(point.x - previous.x, point.y - previous.y);
      const outgoing = Math.hypot(next.x - point.x, next.y - point.y);
      if (!incoming || !outgoing) continue;
      const curve = Math.min(radius, incoming / 2, outgoing / 2);
      path += ` L${point.x + ((previous.x - point.x) * curve) / incoming} ${point.y + ((previous.y - point.y) * curve) / incoming} Q${point.x} ${point.y} ${point.x + ((next.x - point.x) * curve) / outgoing} ${point.y + ((next.y - point.y) * curve) / outgoing}`;
    }
    if (points.length > 1)
      path += ` L${points.at(-1).x} ${points.at(-1).y}`;
    return path;
  }

  function homePreview(puzzle, colors) {
    let markup = "";
    for (let index = 0; index < 16; index++)
      markup += `<rect class="demo-cell${puzzle.walls.includes(index) ? " demo-wall" : ""}" x="${20 + (index % 4) * 90}" y="${20 + Math.floor(index / 4) * 90}" width="88" height="88" rx="7"/>`;
    for (const route of puzzle.routes) {
      const color = colors[route.color];
      const path = route.solution
        .map(
          (index, part) =>
            `${part ? "L" : "M"}${64 + (index % 4) * 90} ${64 + Math.floor(index / 4) * 90}`,
        )
        .join(" ");
      markup += `<path class="demo-line" d="${path}" style="--color:${color};--delay:${route.color * 0.6}s"/>`;
      for (const index of [route.start, route.end])
        markup += `<g transform="translate(${64 + (index % 4) * 90} ${64 + Math.floor(index / 4) * 90})"><circle class="demo-socket" r="26" style="--color:${color}"/><text class="demo-number" text-anchor="middle" dominant-baseline="central">${route.color + 1}</text></g>`;
    }
    return markup;
  }

  return Object.freeze({ formatTime, roundedPath, homePreview });
})();

if (typeof module !== "undefined" && module.exports) module.exports = DotView;

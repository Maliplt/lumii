"use strict";
class ArrowBoard {
  constructor(svg, onTap, label) {
    this.svg = svg;
    this.onTap = onTap;
    this.label = label;
    this.groups = new Map();
  }
  static node(tag, attributes) {
    const el = document.createElementNS("http://www.w3.org/2000/svg", tag);
    for (const [key, value] of Object.entries(attributes))
      el.setAttribute(key, value);
    return el;
  }
  draw(board, remaining) {
    this.board = board;
    this.groups.clear();
    this.svg.replaceChildren();
    const unit = 40,
      pad = 30,
      end = (board.n - 1) * unit + pad * 2;
    this.extent = end;
    this.svg.setAttribute("viewBox", `0 0 ${end} ${end}`);
    this.trailLayer = ArrowBoard.node("g", {
      class: "trails",
      "aria-hidden": "true",
    });
    this.svg.append(this.trailLayer);
    const active = new Set(remaining);
    board.paths.forEach((path, id) => {
      if (!active.has(id)) this.addTrail(path);
    });
    for (const id of remaining) {
      const path = board.paths[id],
        points = path.map((cell) =>
          ArrowPuzzle.point(cell, board.n).map((v) => pad + v * unit),
        );
      const group = ArrowBoard.node("g", {
        class: "arrow",
        role: "button",
        tabindex: "0",
        "aria-label": `${this.label()} ${id + 1}`,
        "data-id": id,
      });
      const d = points.map((p, i) => `${i ? "L" : "M"}${p}`).join(" ");
      const line = ArrowBoard.node("path", { d, class: "line" });
      const hit = ArrowBoard.node("path", { d, class: "hit" });
      const dir = ArrowPuzzle.direction(path, board.n),
        head = ArrowBoard.node("path", {
          d: "M-9 -7 0 0 -9 7",
          class: "head",
          transform: `translate(${points.at(-1)}) rotate(${dir * 90 - 90})`,
        });
      group.append(hit, line, head);
      group.addEventListener("click", () => this.onTap(id));
      group.addEventListener("keydown", (event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          this.onTap(id);
        }
      });
      this.svg.append(group);
      this.groups.set(id, { group, line, head, hit, points, dir });
    }
  }
  addTrail(path, visible = true) {
    return path.map((cell) => {
      const [cx, cy] = ArrowPuzzle.point(cell, this.board.n).map(
        (v) => 30 + v * 40,
      );
      const dot = ArrowBoard.node("circle", { cx, cy, r: 2.4 });
      dot.style.visibility = visible ? "visible" : "hidden";
      this.trailLayer.append(dot);
      return dot;
    });
  }
  hint(id) {
    for (const [key, value] of this.groups)
      value.group.classList.toggle("hinted", key === id);
  }
  reject(id, blocker) {
    for (const key of new Set([id, blocker])) {
      const el = this.groups.get(key)?.group;
      if (!el) continue;
      el.classList.remove("blocked");
      void el.getBoundingClientRect();
      el.classList.add("blocked");
      setTimeout(() => el.classList.remove("blocked"), 650);
    }
  }
  async exit(id, reduced) {
    const item = this.groups.get(id);
    if (!item) return;
    const { group, line, head, hit, points, dir } = item;
    group.classList.add("leaving");
    group.setAttribute("tabindex", "-1");
    hit.remove();
    const trail = this.addTrail(this.board.paths[id], false);
    const length = line.getTotalLength(),
      distance = this.extent + length,
      [dx, dy] = ArrowPuzzle.vectors[dir],
      [x, y] = points.at(-1);
    line.setAttribute(
      "d",
      line.getAttribute("d") + ` L${x + dx * distance} ${y + dy * distance}`,
    );
    line.style.strokeDasharray = `${length} ${distance + length}`;
    const duration = reduced ? 0 : 480 + Math.min(220, length / 2),
      start = performance.now();
    await new Promise((resolve) => {
      const tick = (now) => {
        const p = duration ? Math.min(1, (now - start) / duration) : 1,
          t = p * p * distance;
        line.style.strokeDashoffset = -t;
        trail.forEach((dot, index) => {
          if (t > index * 40 + 6 || p === 1) dot.style.visibility = "visible";
        });
        head.setAttribute(
          "transform",
          `translate(${x + dx * t} ${y + dy * t}) rotate(${dir * 90 - 90})`,
        );
        if (p < 1) requestAnimationFrame(tick);
        else resolve();
      };
      requestAnimationFrame(tick);
    });
    group.remove();
    this.groups.delete(id);
  }
}

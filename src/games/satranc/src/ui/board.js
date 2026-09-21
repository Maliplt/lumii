"use strict";
class ChessBoard {
  constructor(element, onSquare) {
    this.element = element;
    this.onSquare = onSquare;
    this.flipped = false;
    this.focus = 60;
    this.nodes = new Map();
    this.ignoreClick = 0;
    this.bindDrag();
    element.addEventListener("click", (event) => {
      if (event.detail > 0 && performance.now() < this.ignoreClick) {
        this.ignoreClick = 0;
        return;
      }
      const cell = event.target.closest("[data-square]");
      if (cell) this.onSquare(Number(cell.dataset.square));
    });
    element.addEventListener("keydown", (event) => {
      const steps = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -8, ArrowDown: 8 };
      if (!(event.key in steps)) return;
      event.preventDefault();
      const step = steps[event.key] * (this.flipped ? -1 : 1);
      this.focus = Math.max(
        0,
        Math.min(
          63,
          Number(
            event.target.closest("[data-square]")?.dataset.square ?? this.focus,
          ) + step,
        ),
      );
      this.nodes.get(this.focus)?.focus();
    });
  }
  render(
    state,
    {
      selected = -1,
      moves = [],
      last = null,
      target = -1,
      lang = "tr",
      animate = null,
    } = {},
  ) {
    const oldState = this.state;
    const capturedAt = animate?.ep
      ? animate.to + (oldState?.turn === "w" ? 8 : -8)
      : animate?.to;
    const capturedPiece = animate && oldState?.board[capturedAt];
    this.state = state;
    const focused = document.activeElement?.dataset.square;
    const previous = new Map();
    for (const [i, node] of this.nodes)
      previous.set(i, node.getBoundingClientRect());
    this.element.replaceChildren();
    this.nodes.clear();
    const inCheck = Chess.check(state),
      king = state.board.indexOf(state.turn === "w" ? "K" : "k");
    for (let position = 0; position < 64; position++) {
      const i = this.flipped ? 63 - position : position,
        p = state.board[i],
        node = document.createElement("button");
      node.type = "button";
      node.dataset.square = i;
      node.className =
        "square " +
        ((Math.floor(i / 8) + (i % 8)) % 2 ? "dark-square" : "light-square");
      node.tabIndex = i === this.focus ? 0 : -1;
      const destination = moves.some((m) => m.to === i);
      node.classList.toggle("selected", i === selected);
      node.classList.toggle("legal", destination && !p);
      node.classList.toggle(
        "capture",
        destination && (!!p || moves.some((m) => m.to === i && m.ep)),
      );
      node.classList.toggle(
        "last",
        !!last && (last.from === i || last.to === i),
      );
      node.classList.toggle("in-check", inCheck && i === king);
      node.classList.toggle("target", i === target);
      node.setAttribute(
        "aria-label",
        `${Chess.square(i)}${p ? " " + ChessText.t(Chess.color(p) === "w" ? "white" : "black", lang) + " " + ChessText.t(p.toLowerCase(), lang) : ""}`,
      );
      node.innerHTML =
        (p ? ChessArt.piece(p) : "") +
        (position % 8 === 0
          ? `<span class="rank">${Chess.square(i)[1]}</span>`
          : "") +
        (position >= 56
          ? `<span class="file">${Chess.square(i)[0]}</span>`
          : "");
      this.element.append(node);
      this.nodes.set(i, node);
    }
    if (animate && !matchMedia("(prefers-reduced-motion: reduce)").matches) {
      this.animateMove(animate.from, animate.to, previous);
      if (capturedPiece) this.captureEffect(capturedAt, capturedPiece);
      if (inCheck) this.checkEffect(king);
      if (animate.castle)
        this.animateMove(
          animate.to > animate.from ? animate.from + 3 : animate.from - 4,
          animate.to > animate.from ? animate.from + 1 : animate.from - 1,
          previous,
        );
    }
    if (focused !== undefined)
      this.nodes.get(Number(focused))?.focus({ preventScroll: true });
  }
  bindDrag() {
    let drag = null;
    this.cancelDrag = () => {
      if (!drag) return;
      drag.ghost?.remove();
      const piece = this.nodes.get(drag.from)?.querySelector(".piece");
      if (piece) piece.style.opacity = "";
      drag = null;
    };
    this.element.addEventListener("pointerdown", (event) => {
      if (event.button !== 0) return;
      const cell = event.target.closest("[data-square]");
      if (!cell) return;
      const from = Number(cell.dataset.square),
        piece = this.state?.board[from];
      if (!piece || Chess.color(piece) !== this.state.turn) return;
      drag = {
        from,
        piece,
        x: event.clientX,
        y: event.clientY,
        id: event.pointerId,
        ghost: null,
      };
    });
    window.addEventListener(
      "pointermove",
      (event) => {
        if (!drag || event.pointerId !== drag.id) return;
        if (
          !drag.ghost &&
          Math.hypot(event.clientX - drag.x, event.clientY - drag.y) > 8
        ) {
          if (!this.nodes.get(drag.from)?.classList.contains("selected"))
            this.onSquare(drag.from);
          if (!this.nodes.get(drag.from)?.classList.contains("selected")) {
            drag = null;
            return;
          }
          const size = this.nodes.get(drag.from).getBoundingClientRect().width;
          drag.ghost = document.createElement("div");
          drag.ghost.className = "drag-piece";
          drag.ghost.style.width = size + "px";
          drag.ghost.style.height = size + "px";
          drag.ghost.innerHTML = ChessArt.piece(drag.piece);
          document.body.append(drag.ghost);
          this.nodes.get(drag.from).querySelector(".piece").style.opacity =
            ".25";
        }
        if (drag.ghost) {
          event.preventDefault();
          drag.ghost.style.left = event.clientX + "px";
          drag.ghost.style.top = event.clientY + "px";
        }
      },
      { passive: false },
    );
    const release = (event) => {
      if (!drag || event.pointerId !== drag.id) return;
      const current = drag;
      drag = null;
      if (!current.ghost) return;
      current.ghost.remove();
      this.ignoreClick = performance.now() + 350;
      const piece = this.nodes.get(current.from)?.querySelector(".piece");
      if (piece) piece.style.opacity = "";
      const target = document
        .elementFromPoint(event.clientX, event.clientY)
        ?.closest("[data-square]");
      if (
        event.type === "pointerup" &&
        target &&
        Number(target.dataset.square) !== current.from
      )
        this.onSquare(Number(target.dataset.square));
    };
    window.addEventListener("pointerup", release);
    window.addEventListener("pointercancel", release);
  }
  captureEffect(square, piece) {
    const cell = this.nodes.get(square);
    if (!cell) return;
    const ghost = document.createElement("span");
    ghost.className = "capture-ghost";
    ghost.innerHTML = ChessArt.piece(piece);
    cell.append(ghost);
    ghost.animate(
      [
        { transform: "scale(1)", opacity: 1 },
        { transform: "scale(1.16)", opacity: 0.9, offset: 0.3 },
        { transform: "translateY(-20%) scale(.3) rotate(12deg)", opacity: 0 },
      ],
      {
        duration: 440,
        delay: 130,
        easing: "cubic-bezier(.2,.7,.2,1)",
        fill: "both",
      },
    ).onfinish = () => ghost.remove();
    const burst = document.createElement("span");
    burst.className = "capture-burst";
    burst.innerHTML = Array.from(
      { length: 6 },
      (_, i) => `<i style="--angle:${i * 60}deg"></i>`,
    ).join("");
    cell.append(burst);
    setTimeout(() => burst.remove(), 750);
  }
  checkEffect(king) {
    const cell = this.nodes.get(king);
    if (!cell) return;
    cell.classList.add("check-arrival");
    cell
      .querySelector(".piece")
      ?.animate(
        [
          { transform: "scale(1)" },
          { transform: "scale(1.13)", offset: 0.35 },
          { transform: "scale(1)" },
        ],
        { duration: 650, easing: "ease-out" },
      );
  }
  animateMove(from, to, previous) {
    const el = this.nodes.get(to)?.querySelector(".piece"),
      a = previous.get(from),
      b = this.nodes.get(to)?.getBoundingClientRect();
    if (!el || !a || !b) return;
    el.parentElement.style.zIndex = 3;
    el.animate(
      [
        {
          transform: `translate(${a.left - b.left}px,${a.top - b.top}px) scale(1.06)`,
        },
        { transform: "translate(0,0) scale(1)" },
      ],
      { duration: 240, easing: "cubic-bezier(.2,.75,.25,1)" },
    ).onfinish = () => {
      el.parentElement.style.zIndex = "";
    };
  }
  pulse(i) {
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    this.nodes
      .get(i)
      ?.animate(
        [
          { transform: "translateX(0)" },
          { transform: "translateX(-3px)" },
          { transform: "translateX(3px)" },
          { transform: "translateX(0)" },
        ],
        { duration: 180 },
      );
  }
}

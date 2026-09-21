"use strict";

function createBoardCelebration({ $, colors, reducedMotion, getBoard, getPaths, burst }) {
  return function celebrateBoard() {
    if (reducedMotion()) return;
    const board = getBoard();
    const paths = getPaths();
    for (const route of board.routes) {
      burst(route.start, route.color, true);
      burst(route.end, route.color, true);
      paths[route.color].forEach((index, step) => {
        $("cells").children[index].animate(
          [
            { scale: "1", filter: "brightness(1)" },
            { scale: "0.94", filter: "brightness(1.18)", offset: 0.35 },
            { scale: "1", filter: "brightness(1)" },
          ],
          { duration: 460, delay: step * Math.min(45, 650 / paths[route.color].length), easing: "ease-out" },
        );
      });
    }
    for (let index = 0; index < 36; index++) {
      const piece = document.createElement("i");
      piece.className = "victory-piece";
      piece.style.background = colors[index % board.routes.length];
      piece.style.left = 8 + Math.random() * 84 + "%";
      $("effects").append(piece);
      piece.animate(
        [
          { transform: "translate(0, 0) rotate(0deg)", opacity: 0 },
          { opacity: 1, offset: 0.12 },
          { transform: `translate(${(Math.random() - 0.5) * 140}px, ${$("board").clientHeight}px) rotate(${180 + Math.random() * 360}deg)`, opacity: 0 },
        ],
        { duration: 1600, delay: 150 + Math.random() * 500, easing: "cubic-bezier(.2,.6,.5,1)" },
      ).finished.then(() => piece.remove());
    }
  };
}

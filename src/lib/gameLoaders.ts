import { createElement, lazy, type ComponentType, type LazyExoticComponent } from "react";

type GameComponent = LazyExoticComponent<ComponentType>;

const gameComponents: Record<string, GameComponent> = {
  kelimezinciri: lazy(() => import("../games/KelimeZinciri/KelimeZinciri")),
  sudoku: lazy(() => import("../games/Sudoku/Sudoku")),
  minesweeper: lazy(() => import("../games/Minesweeper/Minesweeper")),
  blockbloom: lazy(() => import("../games/BlockBloomPuzzle/BlockBloomPuzzle")),
  mahjong: lazy(() => import("../games/MahjongSanctuary/MahjongSanctuary")),
  doom: lazy(() => import("../games/Doom/Doom")),
};

const PUBLIC_GAMES = new Set([
  "bamboo-hop",
  "rota",
  "prizma",
  "denge",
  "2048",
  "egg-hop",
  "renk-renk",
  "satranc",
  "siyril",
]);

export function hasGameComponent(gameId: string): boolean {
  return PUBLIC_GAMES.has(gameId) || Boolean(gameComponents[gameId]);
}

export function LoadedGame({ gameId }: { gameId: string }) {
  if (PUBLIC_GAMES.has(gameId)) {
    return createElement(
      "div",
      { className: "public-game-container" },
      createElement("iframe", {
        src: `/games/${gameId}/index.html`,
        title: `${gameId} Oyunu`,
        className: "public-game-frame",
        allow: "autoplay; fullscreen",
      })
    );
  }
  const GameComponent = gameComponents[gameId];
  return GameComponent ? createElement(GameComponent) : null;
}

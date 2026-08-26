import { createElement, lazy, type ComponentType, type LazyExoticComponent } from "react";

type GameComponent = LazyExoticComponent<ComponentType>;
const gameComponents: Record<string, GameComponent> = {
  doom: lazy(() => import("../games/Doom/Doom")),
  "2048": lazy(() => import("../games/Game2048/Game2048")),
  kelimezinciri: lazy(() => import("../games/KelimeZinciri/KelimeZinciri")),
  sudoku: lazy(() => import("../games/Sudoku/Sudoku")),
  minesweeper: lazy(() => import("../games/Minesweeper/Minesweeper")),
  blockbloom: lazy(() => import("../games/BlockBloomPuzzle/BlockBloomPuzzle")),
  mahjong: lazy(() => import("../games/MahjongSanctuary/MahjongSanctuary")),
};

export function hasGameComponent(gameId: string): boolean {
  return Boolean(gameComponents[gameId]);
}

export function LoadedGame({ gameId }: { gameId: string }) {
  const GameComponent = gameComponents[gameId];
  return GameComponent ? createElement(GameComponent) : null;
}

import { createElement, lazy, type ComponentType, type LazyExoticComponent } from "react";
import { findGame } from "./games";

type GameComponent = LazyExoticComponent<ComponentType>;

const gameComponents: Record<string, GameComponent> = {
  kelimezinciri: lazy(() => import("../games/KelimeZinciri/KelimeZinciri")),
  minesweeper: lazy(() => import("../games/Minesweeper/Minesweeper")),
  blockbloom: lazy(() => import("../games/BlockBloomPuzzle/BlockBloomPuzzle")),
  mahjong: lazy(() => import("../games/MahjongSanctuary/MahjongSanctuary")),
  doom: lazy(() => import("../games/Doom/Doom")),
};

const PUBLIC_GAMES = new Set([
  "bamboo-hop",
  "prizma",
  "denge",
  "2048",
  "egg-hop",
  "renk-renk",
  "satranc",
  "ok-cikmazi",
  "fuzyon",
  "katman",
  "onluk",
  "orgu",
  "sudoku",
  "zar-izi",
  "wellbloom",
  "blockhaven",
  "knotwise",
  "purrfit",
  "yirmibir-hani",
  "mines98",
]);

export function hasGameComponent(gameId: string): boolean {
  gameId = findGame(gameId)?.id ?? gameId;
  return PUBLIC_GAMES.has(gameId) || Boolean(gameComponents[gameId]);
}

export function LoadedGame({ gameId }: { gameId: string }) {
  gameId = findGame(gameId)?.id ?? gameId;
  if (PUBLIC_GAMES.has(gameId)) {
    return createElement(
      "div",
      { className: "public-game-container" },
      createElement("iframe", {
        src: `${import.meta.env.BASE_URL}src/games/${gameId}/index.html`,
        title: `${findGame(gameId)?.name ?? gameId} Oyunu`,
        className: "public-game-frame",
        allow: "autoplay; fullscreen",
      })
    );
  }
  const GameComponent = gameComponents[gameId];
  return GameComponent ? createElement(GameComponent) : null;
}

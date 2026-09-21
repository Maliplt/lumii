import { existsSync, readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { describe, expect, test } from "vitest";
import { GAMES, findGame } from "../src/lib/games";
import { hasGameComponent, LoadedGame } from "../src/lib/gameLoaders";

const importedGames = [
  "2048", "bamboo-hop", "denge", "egg-hop", "fuzyon", "katman", "onluk",
  "orgu", "prizma", "renk-renk", "satranc", "ok-cikmazi", "sudoku", "zar-izi",
];

describe("Tenet standalone game integration", () => {
  test("all carousel games have unique routes and an available loader", () => {
    expect(new Set(GAMES.map((game) => game.id)).size).toBe(GAMES.length);
    expect(new Set(GAMES.map((game) => game.path)).size).toBe(GAMES.length);
    for (const game of GAMES) expect(hasGameComponent(game.id), game.id).toBe(true);
  });

  test.each(importedGames)("%s has an entry, icon, and resolvable local entry assets", (id) => {
    const game = findGame(id);
    expect(game?.path).toBe(`/play/${id}`);
    const entry = resolve(`src/games/${id}/index.html`);
    expect(existsSync(entry)).toBe(true);
    expect(existsSync(resolve(`src/assets/images/games/${id}.svg`))).toBe(true);
    const html = readFileSync(entry, "utf8");
    for (const [, ref] of html.matchAll(/(?:src|href)=["']([^"']+)["']/g)) {
      if (/^(?:[a-z]+:|\/|#)/i.test(ref)) continue;
      expect(existsSync(resolve(dirname(entry), ref.split(/[?#]/)[0])), `${id}: ${ref}`).toBe(true);
    }
    const frame = LoadedGame({ gameId: id })?.props.children;
    expect(frame.props.src).toBe(`/src/games/${id}/index.html`);
    expect(frame.props.title).toBe(`${game?.name} Oyunu`);
  });

  test("the old Sıyrıl route opens Ok Çıkmazı without changing saved progress keys", () => {
    expect(findGame("siyril")).toBe(findGame("ok-cikmazi"));
    expect(findGame("siyril")?.storageKey).toBe("siyril.v1");
    expect(hasGameComponent("siyril")).toBe(true);
    expect(LoadedGame({ gameId: "siyril" })?.props.children.props.src)
      .toBe("/src/games/ok-cikmazi/index.html");
    const config = readFileSync(resolve("src/games/ok-cikmazi/profile-config.js"), "utf8");
    expect(config).toContain('gameId: "siyril"');
  });

  test("existing games outside the imported suite remain available", () => {
    for (const id of ["rota", "doom", "kelimezinciri", "minesweeper", "blockbloom", "mahjong"]) {
      expect(findGame(id), id).toBeDefined();
      expect(hasGameComponent(id), id).toBe(true);
    }
  });
});

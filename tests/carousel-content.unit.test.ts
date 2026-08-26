import { describe, expect, test, vi } from "vitest";
import { seededShuffle } from "../src/lib/contentPersonalization";
import { createTrailerPreviewCoordinator } from "../src/lib/trailerPreviewContext";
import { heroFrom } from "../src/lib/utils";
import type { Movie } from "../src/types/types";
import {
  shouldRenderCarouselPage,
  visibleCarouselItems,
} from "../src/components/media/useCarouselLayout";

function movie(id: number, changes: Partial<Movie> = {}): Movie {
  return {
    id,
    title: `Film ${id}`,
    overview: "Carousel kartında gösterilecek kısa içerik açıklaması.",
    poster_path: `/poster-${id}.jpg`,
    backdrop_path: `/backdrop-${id}.jpg`,
    release_date: "2026-08-25",
    genre_ids: [28],
    vote_average: 8,
    ...changes,
  } as Movie;
}

describe("Carousel içerikleri", () => {
  test("Hero alanında eksik içerik gösterilmemeli", () => {
    const items = [
      movie(1),
      movie(2, { poster_path: null }),
      movie(3, { backdrop_path: null }),
      movie(4, { overview: "   " }),
      movie(5),
      movie(6),
      movie(7),
      movie(8),
      movie(9),
    ];

    expect(heroFrom(items, 5).map((item) => item.id)).toEqual([1, 5, 6, 7, 8]);
  });

  test("Aynı kullanıcı aynı içerik sırasını görmeli", () => {
    const original = [1, 2, 3, 4, 5, 6, 7, 8];
    const first = seededShuffle(original, "mali.polatkesen:ana-profil:2026-08-25");
    const second = seededShuffle(original, "mali.polatkesen:ana-profil:2026-08-25");

    expect(first).toEqual(second);
    expect(first).not.toEqual(original);
    expect(original).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
  });

  test("Yeni fragman açılınca önceki kapanmalı", () => {
    const coordinator = createTrailerPreviewCoordinator();
    const firstOwner = Symbol("ilk-carousel-karti");
    const secondOwner = Symbol("ikinci-carousel-karti");
    const closeFirst = vi.fn();

    expect(
      coordinator.claim({
        owner: firstOwner,
        priority: "automatic",
        cancel: closeFirst,
      }),
    ).toBe(true);
    expect(
      coordinator.claim({
        owner: secondOwner,
        priority: "automatic",
        cancel: vi.fn(),
      }),
    ).toBe(true);
    expect(closeFirst).toHaveBeenCalledOnce();
    expect(coordinator.owns(secondOwner)).toBe(true);
  });

  test("Kullanıcının açtığı fragman kendiliğinden kapanmamalı", () => {
    const coordinator = createTrailerPreviewCoordinator();
    const userOwner = Symbol("kullanici-fragmani");
    const automaticOwner = Symbol("otomatik-fragman");
    const closeUserPreview = vi.fn();

    coordinator.claim({
      owner: userOwner,
      priority: "user",
      cancel: closeUserPreview,
    });
    const accepted = coordinator.claim({
      owner: automaticOwner,
      priority: "automatic",
      cancel: vi.fn(),
    });

    expect(accepted).toBe(false);
    expect(closeUserPreview).not.toHaveBeenCalled();
    expect(coordinator.owns(userOwner)).toBe(true);
  });

  test("Her ekran boyutunda doğru kart sayısı gösterilmeli", () => {
    expect(visibleCarouselItems(390)).toBe(2);
    expect(visibleCarouselItems(700)).toBe(3);
    expect(visibleCarouselItems(900)).toBe(4);
    expect(visibleCarouselItems(1280)).toBe(6);
  });

  test("Sadece aktif ve yakın carousel sayfaları çalışmalı", () => {
    expect(shouldRenderCarouselPage(2, 2)).toBe(true);
    expect(shouldRenderCarouselPage(1, 2)).toBe(true);
    expect(shouldRenderCarouselPage(3, 2)).toBe(true);
    expect(shouldRenderCarouselPage(0, 2)).toBe(false);
    expect(shouldRenderCarouselPage(5, 2)).toBe(false);
  });
});

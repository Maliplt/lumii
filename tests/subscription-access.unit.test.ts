import { describe, expect, test } from "vitest";
import {
  canAccessChannel,
  canUseLevel,
  getPlan,
} from "../src/lib/subscription";

describe("Paket erişimi", () => {
  test("Bilinmeyen paket ücretli içeriği açmamalı", () => {
    expect(getPlan("bilinmeyen-paket").id).toBe("free");
    expect(canUseLevel("bilinmeyen-paket", "standard")).toBe(false);
  });

  test("Spor kanalları sadece Premium pakette açılmalı", () => {
    expect(canAccessChannel("standard", 0, "Spor")).toBe(false);
    expect(canAccessChannel("premium", 0, "Spor")).toBe(true);
  });

  test("Üst paket alt paket içeriklerini de açmalı", () => {
    expect(canUseLevel("free", "standard")).toBe(false);
    expect(canUseLevel("standard", "standard")).toBe(true);
    expect(canUseLevel("premium", "standard")).toBe(true);
    expect(canUseLevel("standard", "premium")).toBe(false);
  });

  test("Her paketin kanal sınırı doğru uygulanmalı", () => {
    expect(canAccessChannel("free", 4)).toBe(true);
    expect(canAccessChannel("free", 5)).toBe(false);
    expect(canAccessChannel("standard", 9)).toBe(true);
    expect(canAccessChannel("standard", 10)).toBe(false);
    expect(canAccessChannel("premium", 10)).toBe(true);
  });
});

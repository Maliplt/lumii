import { describe, expect, it } from "vitest";
import {
  findBestSubtitlePair,
  rankSubtitleOptions,
  type SubtitleOption,
  type SubtitleLanguage,
} from "../src/services/subtitles";
import {
  alignSubtitleTimelines,
  subtitleTimeAt,
  subtitleTimeScale,
} from "../src/components/cinema-player/subtitleTiming";

function subtitle(
  id: string,
  language: SubtitleLanguage,
  releaseName: string,
  options: Partial<SubtitleOption> = {},
): SubtitleOption {
  return {
    id,
    language,
    label: releaseName,
    provider: "OpenSubtitles",
    url: `https://example.com/${id}.srt`,
    fileName: `${releaseName}.srt`,
    releaseName,
    fps: null,
    matchedVideoHashes: [],
    sourceOrder: 0,
    ...options,
  };
}

describe("Altyazı eşleştirme", () => {
  it("OpenSubtitles dosya hash eşleşmesini diğer release benzerliklerinin önüne almalı", () => {
    const hash = "8e245d9679d31e12";
    const ranked = rankSubtitleOptions([
      subtitle("release", "tur", "Movie.2026.1080p.WEB-DL.REPACK-FLUX"),
      subtitle("hash", "tur", "Movie.2026.BluRay-SPARKS", {
        matchedVideoHashes: [hash],
      }),
    ], ["Movie.2026.1080p.WEB-DL.REPACK-FLUX.mkv"], hash);

    expect(ranked[0].id).toBe("hash");
  });

  it("dizilerde yanlış bölüm altyazısını doğru bölümün önüne taşımamalı", () => {
    const ranked = rankSubtitleOptions([
      subtitle("wrong", "tur", "Series.S01E05.1080p.WEB-DL-NTb"),
      subtitle("correct", "tur", "Series.S01E04.1080p.WEB-DL-NTb"),
    ], ["Series.S01E04.1080p.WEB-DL-NTb.mkv"]);

    expect(ranked[0].id).toBe("correct");
  });

  it("REPACK sürümünde aynı zaman çizelgesine ait altyazıyı seçmeli", () => {
    const ranked = rankSubtitleOptions([
      subtitle("regular", "tur", "Movie.2026.1080p.WEB-DL-FLUX"),
      subtitle("repack", "tur", "Movie.2026.1080p.WEB-DL.REPACK-FLUX"),
    ], ["Movie.2026.1080p.WEB-DL.REPACK-FLUX.mkv"]);

    expect(ranked[0].id).toBe("repack");
  });

  it("otomatik seçimde en iyi Türkçe eşleşmeyi İngilizceden önce sunmalı", () => {
    const ranked = rankSubtitleOptions([
      subtitle("english", "eng", "Movie.2026.1080p.WEB-DL-FLUX"),
      subtitle("turkish-wrong", "tur", "Movie.2026.BluRay-SPARKS"),
      subtitle("turkish-correct", "tur", "Movie.2026.1080p.WEB-DL-FLUX"),
    ], ["Movie.2026.1080p.WEB-DL-FLUX.mkv"]);

    expect(ranked[0].id).toBe("turkish-correct");
    expect(ranked[0].language).toBe("tur");
  });

  it("TS altyazıyı BluRay video için WEB sürümünün önüne koymamalı", () => {
    const ranked = rankSubtitleOptions([
      subtitle("ts", "tur", "The.Dark.Knight.Rises.2012.TS.XViD-INSPiRAL", { fps: 29.97 }),
      subtitle("web", "tur", "The.Dark.Knight.Rises.2012.WEBRip.iTunes", { fps: 23.976 }),
    ], ["The.Dark.Knight.Rises.2012.1080p.BluRay.x265-RARBG.mp4"]);

    expect(ranked[0].id).toBe("web");
  });

  it("video ve Türkçe altyazıyı aynı release ailesinden birlikte seçmeli", () => {
    const pair = findBestSubtitlePair(
      [subtitle("web", "tur", "The.Dark.Knight.Rises.2012.WEBRip.iTunes")],
      [
        { id: "bluray", filename: "The.Dark.Knight.Rises.2012.1080p.BluRay-RARBG.mkv", releaseName: "", videoHash: "" },
        { id: "web", filename: "The.Dark.Knight.Rises.2012.1080p.WEB-DL.iTunes.mkv", releaseName: "", videoHash: "" },
      ],
    );

    expect(pair?.streamId).toBe("web");
    expect(pair?.subtitleId).toBe("web");
  });

  it("başka bir içeriğe ait altyazıyı listeden çıkarmalı", () => {
    const ranked = rankSubtitleOptions([
      subtitle("wrong", "tur", "Boardwalk.Empire.S03E05.720p.HDTV-IMMERSE"),
      subtitle("correct", "tur", "The.Dark.Knight.Rises.2012.WEBRip.iTunes"),
    ], ["The.Dark.Knight.Rises.2012.1080p.WEB-DL.iTunes.mkv"]);

    expect(ranked.map((option) => option.id)).toEqual(["correct"]);
  });

  it("25 FPS altyazıyı 23.976 FPS videoda doğrusal drift oluşturmadan ölçeklemeli", () => {
    const scale = subtitleTimeScale(25, 23.976);
    const oneHourOfSubtitle = subtitleTimeAt(3_600 * scale, 0, scale);

    expect(scale).toBeCloseTo(1.0427, 3);
    expect(oneHourOfSubtitle).toBeCloseTo(3_600, 5);
  });

  it("gerçekçi olmayan FPS oranlarını zaman çizelgesine uygulamamalı", () => {
    expect(subtitleTimeScale(25, 60)).toBe(1);
  });

  it("Türkçe altyazıyı doğru İngilizce referansın ofset ve FPS zaman çizelgesine hizalamalı", () => {
    const scale = 25 / 23.976;
    const target = Array.from({ length: 120 }, (_, index) => {
      const startTime = index * 7.3 + (index % 5) * 0.41;
      return { startTime, endTime: startTime + 2.2, text: `TR ${index}` };
    });
    const reference = target.map((cue, index) => ({
      startTime: cue.startTime * scale + 3.4,
      endTime: cue.endTime * scale + 3.4,
      text: `EN ${index}`,
    }));

    const alignment = alignSubtitleTimelines(target, reference);

    expect(alignment?.scale).toBeCloseTo(scale, 3);
    expect(alignment?.offset).toBeCloseTo(3.4, 1);
  });
});

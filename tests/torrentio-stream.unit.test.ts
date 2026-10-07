import { describe, expect, test } from "vitest";
import {
  buildTorrentioConfigString,
  buildTorrentioStreamPath,
  parseTorrentioStream,
} from "../src/services/torrentio";
import { validateRealDebridToken } from "../src/services/realdebrid";

describe("Torrentio & Real-Debrid Akış Yapılandırması", () => {
  test("Torrentio yapılandırma metni doğru üretilmeli", () => {
    const config = buildTorrentioConfigString({
      realDebridApiKey: "TEST_RD_API_TOKEN_123",
      providers: ["yts", "rarbg", "1337x"],
      sort: "qualitysize",
    });

    expect(config).toBe(
      "providers=yts,rarbg,1337x|sort=qualitysize|realdebrid=TEST_RD_API_TOKEN_123",
    );
  });

  test("Film için Torrentio endpoint URL'si doğru formatta olmalı", () => {
    const url = buildTorrentioStreamPath({
      type: "movie",
      imdbId: "tt1375666",
      realDebridApiKey: "MY_TOKEN",
    });

    expect(url).toBe(
      "https://torrentio.strem.fun/realdebrid=MY_TOKEN/stream/movie/tt1375666.json",
    );
  });

  test("Dizi için Torrentio endpoint URL'si sezon ve bölüm taşımalı", () => {
    const url = buildTorrentioStreamPath({
      type: "tv",
      imdbId: "tt0903747",
      season: 3,
      episode: 8,
      realDebridApiKey: "MY_TOKEN",
    });

    expect(url).toBe(
      "https://torrentio.strem.fun/realdebrid=MY_TOKEN/stream/series/tt0903747:3:8.json",
    );
  });

  test("Torrentio akış bilgisi doğru ayrıştırılmalı (RD+, 4K, Boyut, Kodek)", () => {
    const parsed = parseTorrentioStream(
      {
        name: "[RD+] Torrentio\n4k",
        title: "Inception.2010.2160p.UHD.BluRay.x265.HDR-SPARKS\n💾 24.5 GB 👤 412 ⚙️ RARBG\n🔊 TrueHD Atmos 7.1 🇬🇧",
        url: "https://torrentio.strem.fun/realdebrid=token/stream/movie/tt1375666:inception.mkv",
      },
      0,
    );

    expect(parsed).not.toBeNull();
    expect(parsed?.isRealDebrid).toBe(true);
    expect(parsed?.quality).toBe("4K");
    expect(parsed?.size).toBe("24.5 GB");
    expect(parsed?.tracker).toBe("RARBG");
    expect(parsed?.codec).toBe("x265");
    expect(parsed?.audio).toBe("TrueHD Atmos 7.1 🇬🇧");
    expect(parsed?.url).toBe(
      "https://torrentio.strem.fun/realdebrid=token/stream/movie/tt1375666:inception.mkv",
    );
  });

  test("Torrentio 1080p akışı doğru çözülmeli", () => {
    const parsed = parseTorrentioStream(
      {
        name: "[RD+] Torrentio\n1080p",
        title: "Breaking.Bad.S01E01.1080p.BluRay.x264\n💾 3.2 GB 👤 85 ⚙️ TorrentGalaxy\n🔊 EAC3 5.1",
        url: "https://torrentio.strem.fun/stream/123",
      },
      1,
    );

    expect(parsed).not.toBeNull();
    expect(parsed?.isRealDebrid).toBe(true);
    expect(parsed?.quality).toBe("1080p");
    expect(parsed?.size).toBe("3.2 GB");
  });

  test("URL ve infoHash olmayan geçersiz akış elenmeli", () => {
    const parsed = parseTorrentioStream(
      {
        name: "Boş",
        title: "Geçersiz",
      },
      2,
    );

    expect(parsed).toBeNull();
  });

  test("Boş Real-Debrid API anahtarı geçersiz sayılmalı", async () => {
    const result = await validateRealDebridToken("   ");
    expect(result.valid).toBe(false);
    expect(result.error).toBeDefined();
  });
});

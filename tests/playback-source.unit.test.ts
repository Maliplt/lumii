import { describe, expect, test } from "vitest";
import { ServiceError } from "../src/services/serviceError";
import { resolvePlaybackSource } from "../src/services/player";
import { buildYoutubeEmbedUrl } from "../src/lib/utils";

describe("Oynatma adresleri", () => {
  test("Film adresi kullanıcı tercihlerini korumalı", () => {
    const source = resolvePlaybackSource({
      type: "movie",
      id: 550,
      autoplayEnabled: false,
      startAt: 93.8,
    });
    const url = new URL(source.url);

    expect(source.kind).toBe("vidfast");
    expect(url.pathname).toBe("/movie/550");
    expect(url.searchParams.get("autoPlay")).toBe("false");
    expect(url.searchParams.get("startAt")).toBe("93");
    expect(url.searchParams.get("sub")).toBe("tr");
  });

  test("Dizi adresi bölüm bilgilerini doğru taşımalı", () => {
    const source = resolvePlaybackSource({
      type: "tv",
      id: "1396",
      season: 2,
      episode: 7,
      autoplayEnabled: true,
    });
    const url = new URL(source.url);

    expect(url.pathname).toBe("/tv/1396/2/7");
    expect(url.searchParams.get("autoPlay")).toBe("true");
    expect(url.searchParams.get("autoNext")).toBe("true");
    expect(url.searchParams.get("nextButton")).toBe("true");
  });

  test("Geçersiz içerik kimliği oynatıcıyı açmamalı", () => {
    expect(() =>
      resolvePlaybackSource({
        type: "movie",
        id: "film-kimligi-yok",
        autoplayEnabled: true,
      }),
    ).toThrow(ServiceError);

    try {
      resolvePlaybackSource({ type: "movie", id: 0, autoplayEnabled: true });
    } catch (error) {
      expect(error).toMatchObject({ code: "playback" });
    }
  });

  test("Tıklanan fragman sesli başlamalı", () => {
    const url = new URL(
      buildYoutubeEmbedUrl("QftAW9TTmuQ", {
        autoplay: true,
        muted: false,
      }),
    );

    expect(url.searchParams.get("autoplay")).toBe("1");
    expect(url.searchParams.get("mute")).toBe("0");
    expect(url.searchParams.has("enablejsapi")).toBe(false);
    expect(url.searchParams.has("vq")).toBe(false);
  });

  test("Otomatik hero önizlemesi sessiz başlamalı", () => {
    const url = new URL(
      buildYoutubeEmbedUrl("QftAW9TTmuQ", { autoplay: true }),
    );

    expect(url.searchParams.get("autoplay")).toBe("1");
    expect(url.searchParams.get("mute")).toBe("1");
  });
});

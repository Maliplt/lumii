import { describe, expect, test } from "vitest";
import { buildYoutubeEmbedUrl } from "../src/lib/utils";

describe("Oynatma adresleri", () => {
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

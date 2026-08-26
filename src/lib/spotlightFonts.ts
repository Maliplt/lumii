import { useEffect } from "react";
import type { SpotlightTypography } from "../data/spotlightDefinitions";

interface SpotlightFontDefinition {
  key: string;
  familyQuery: string;
}

const SPOTLIGHT_FONTS: Record<SpotlightTypography, SpotlightFontDefinition> = {
  fantasy: { key: "cinzel", familyQuery: "Cinzel:wght@600;700;800" },
  adventure: { key: "cinzel", familyQuery: "Cinzel:wght@600;700;800" },
  "sci-fi": { key: "orbitron", familyQuery: "Orbitron:wght@600;700;800" },
  horror: { key: "creepster", familyQuery: "Creepster" },
  action: { key: "bebas-neue", familyQuery: "Bebas+Neue" },
  classic: {
    key: "cormorant-garamond",
    familyQuery: "Cormorant+Garamond:wght@600;700",
  },
  playful: { key: "unbounded", familyQuery: "Unbounded:wght@700;800" },
};

const requestedFonts = new Set<string>();

function requestSpotlightFont(typography: SpotlightTypography) {
  const font = SPOTLIGHT_FONTS[typography];
  if (typeof document === "undefined" || requestedFonts.has(font.key)) return;

  const existing = document.head.querySelector<HTMLLinkElement>(
    `link[data-spotlight-font="${font.key}"]`,
  );
  if (existing) {
    requestedFonts.add(font.key);
    return;
  }

  const stylesheet = document.createElement("link");
  stylesheet.rel = "stylesheet";
  stylesheet.href = `https://fonts.googleapis.com/css2?family=${font.familyQuery}&display=swap`;
  stylesheet.dataset.spotlightFont = font.key;
  document.head.append(stylesheet);
  requestedFonts.add(font.key);
}

// spotlight fontunu gerektiğinde yükle
export function useSpotlightFont(
  typography: SpotlightTypography,
  enabled = true,
) {
  useEffect(() => {
    if (!enabled) return;
    requestSpotlightFont(typography);
  }, [enabled, typography]);
}

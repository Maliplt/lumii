import type { CSSProperties } from "react";
import ContentCarousel from "./ContentCarousel";
import Spinner from "./Spinner";
import {
  loadSpotlightCarousel,
  type SpotlightCarouselData,
} from "../services/spotlightCarousels";
import type { SpotlightDefinition } from "../data/spotlightCarousels";
import { useFetch } from "../helpers";

function presentationStyle(definition: SpotlightDefinition): CSSProperties {
  return {
    "--spotlight-accent": definition.theme.accent,
    "--spotlight-accent-contrast": definition.theme.accentContrast,
    "--spotlight-position": definition.theme.backgroundPosition ?? "center",
  } as CSSProperties;
}

export default function SpotlightContentCarousel({
  definition,
}: {
  definition: SpotlightDefinition;
}) {
  const spotlight = useFetch<SpotlightCarouselData | null>(
    () => loadSpotlightCarousel(definition),
    `spotlight-${definition.id}`,
  );

  if (spotlight.loading) {
    return (
      <section
        className={`content-carousel content-carousel--spotlight content-carousel--spotlight-loading spotlight-typography--${definition.theme.typography}`}
        style={presentationStyle(definition)}
        aria-label={`${definition.title} yükleniyor`}
      >
        <div className="cc-spotlight-loading-copy">
          <h3 className="cc-header__title">{definition.title}</h3>
          <Spinner inline />
        </div>
      </section>
    );
  }

  const data = spotlight.data;
  if (!data) return null;

  return (
    <ContentCarousel
      type="movie"
      title={data.title}
      items={data.items}
      spotlight={data.presentation}
    />
  );
}

import { useMemo, type CSSProperties } from "react";
import ContentCarousel from "./ContentCarousel";
import ServiceErrorView from "./ServiceErrorView";
import Spinner from "./Spinner";
import {
  loadSpotlightCarousel,
  type SpotlightCarouselData,
} from "../services/spotlightCarousels";
import type { SpotlightDefinition } from "../data/spotlightCarousels";
import { useFetch } from "../helpers";
import { seededShuffle } from "../lib/contentPersonalization";

function presentationStyle(definition: SpotlightDefinition): CSSProperties {
  return {
    "--spotlight-accent": definition.theme.accent,
    "--spotlight-accent-contrast": definition.theme.accentContrast,
    "--spotlight-position": definition.theme.backgroundPosition ?? "center",
  } as CSSProperties;
}

export default function SpotlightContentCarousel({
  definition,
  audienceKey,
}: {
  definition: SpotlightDefinition;
  audienceKey: string;
}) {
  const spotlight = useFetch<SpotlightCarouselData | null>(
    () => loadSpotlightCarousel(definition),
    `spotlight-${definition.id}`,
    "section",
  );
  const data = spotlight.data;
  const personalizedItems = useMemo(
    () =>
      data && definition.source === "person"
        ? seededShuffle(data.items, `${audienceKey}:${definition.id}:movies`)
        : (data?.items ?? []),
    [audienceKey, data, definition.id, definition.source],
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
          <Spinner variant="compact" />
        </div>
      </section>
    );
  }

  if (spotlight.error) {
    return (
      <section
        className={`content-carousel content-carousel--spotlight content-carousel--spotlight-error spotlight-typography--${definition.theme.typography}`}
        style={presentationStyle(definition)}
        aria-label={`${definition.title} yüklenemedi`}
      >
        <ServiceErrorView
          error={spotlight.error}
          context="section"
          onRetry={spotlight.retry}
        />
      </section>
    );
  }

  if (!data) return null;

  return (
    <ContentCarousel
      type={data.mediaType}
      title={data.title}
      items={personalizedItems}
      spotlight={data.presentation}
    />
  );
}

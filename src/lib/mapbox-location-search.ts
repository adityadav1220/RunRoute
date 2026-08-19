import {
  MapboxError,
  SearchBoxCore,
  SearchSession,
  type SearchBoxOptions,
  type SearchBoxRetrieveResponse,
  type SearchBoxSuggestion,
  type SearchBoxSuggestionResponse,
} from "@mapbox/search-js-core";
import type { MapCoordinate, SelectedLocation } from "@/types/map";

type MapboxSearchSession = SearchSession<
  SearchBoxOptions,
  SearchBoxSuggestion,
  SearchBoxSuggestionResponse,
  SearchBoxRetrieveResponse
>;

export type LocationSearchErrorKind =
  | "authorization"
  | "network"
  | "result";

export interface LocationSuggestion {
  id: string;
  primaryText: string;
  secondaryText: string;
}

export class LocationSearchError extends Error {
  constructor(readonly kind: LocationSearchErrorKind) {
    super(kind);
    this.name = "LocationSearchError";
  }
}

function suggestionDescription(suggestion: SearchBoxSuggestion) {
  return (
    suggestion.full_address ||
    suggestion.place_formatted ||
    suggestion.feature_type
  );
}

function resultLabel(
  response: SearchBoxRetrieveResponse,
  fallback: SearchBoxSuggestion,
) {
  const properties = response.features[0]?.properties;

  return (
    properties?.full_address ||
    [properties?.name, properties?.place_formatted]
      .filter(Boolean)
      .join(", ") ||
    fallback.full_address ||
    fallback.name
  );
}

function classifyError(error: unknown) {
  if (
    error instanceof MapboxError &&
    (error.statusCode === 401 || error.statusCode === 403)
  ) {
    return new LocationSearchError("authorization");
  }

  return new LocationSearchError("network");
}

export class MapboxLocationSearchClient {
  private readonly session: MapboxSearchSession;
  private readonly suggestions = new Map<string, SearchBoxSuggestion>();

  constructor(accessToken: string, debounceMilliseconds: number) {
    const search = new SearchBoxCore({ accessToken });
    this.session = new SearchSession(search, debounceMilliseconds);
  }

  async suggest(
    query: string,
    proximity: MapCoordinate | null,
    limit: number,
  ): Promise<LocationSuggestion[]> {
    try {
      const response = await this.session.suggest(query, {
        limit,
        proximity: proximity
          ? [proximity.longitude, proximity.latitude]
          : undefined,
      });
      const results = response.suggestions
        .filter((suggestion) => this.session.canRetrieve(suggestion))
        .slice(0, limit);

      this.suggestions.clear();
      for (const suggestion of results) {
        this.suggestions.set(suggestion.mapbox_id, suggestion);
      }

      return results.map((suggestion) => ({
        id: suggestion.mapbox_id,
        primaryText: suggestion.name,
        secondaryText: suggestionDescription(suggestion),
      }));
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        throw error;
      }

      throw classifyError(error);
    }
  }

  async retrieve(suggestionId: string): Promise<SelectedLocation> {
    const suggestion = this.suggestions.get(suggestionId);
    if (!suggestion) {
      throw new LocationSearchError("result");
    }

    try {
      const response = await this.session.retrieve(suggestion);
      const feature = response.features[0];
      const longitude = feature?.properties.coordinates.longitude;
      const latitude = feature?.properties.coordinates.latitude;

      if (
        typeof longitude !== "number" ||
        typeof latitude !== "number" ||
        !Number.isFinite(longitude) ||
        !Number.isFinite(latitude)
      ) {
        throw new LocationSearchError("result");
      }

      this.session.incrementSession();
      this.suggestions.clear();

      return {
        longitude,
        latitude,
        label: resultLabel(response, suggestion),
        source: "search",
      };
    } catch (error) {
      if (error instanceof LocationSearchError) {
        throw error;
      }

      throw classifyError(error);
    }
  }

  abort() {
    this.session.abort();
  }

  discardSuggestions() {
    this.suggestions.clear();
  }
}

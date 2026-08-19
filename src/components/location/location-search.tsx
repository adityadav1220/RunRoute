"use client";

import {
  useEffect,
  useRef,
  useState,
  type FocusEvent,
  type KeyboardEvent,
} from "react";
import {
  LocationSearchError,
  MapboxLocationSearchClient,
  type LocationSuggestion,
} from "@/lib/mapbox-location-search";
import type { SelectedLocation } from "@/types/map";

type SearchStatus = "idle" | "loading" | "ready" | "empty" | "error";
type GeolocationStatus = "idle" | "locating" | "error";

const MAPBOX_ACCESS_TOKEN =
  process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN?.trim() ?? "";
const MINIMUM_QUERY_LENGTH = 3;
const SEARCH_DEBOUNCE_MS = 300;
const MAXIMUM_SUGGESTIONS = 5;

interface LocationSearchProps {
  selectedLocation: SelectedLocation | null;
  query: string;
  disabled: boolean;
  onQueryChange: (query: string) => void;
  onLocationSelect: (location: SelectedLocation) => void;
  onLocationClear: () => void;
}

function meaningfulCharacterCount(value: string) {
  return value.match(/[\p{L}\p{N}]/gu)?.length ?? 0;
}

function searchErrorMessage(error: unknown) {
  if (error instanceof LocationSearchError && error.kind === "authorization") {
    return "Location search is not authorized. Check the public Mapbox token and its URL restrictions.";
  }

  if (error instanceof LocationSearchError && error.kind === "result") {
    return "Mapbox did not return a usable point for that location. Choose another result.";
  }

  return "Location search is temporarily unavailable. Check your connection and try again.";
}

function geolocationErrorMessage(error: GeolocationPositionError) {
  switch (error.code) {
    case error.PERMISSION_DENIED:
      return "Location permission was denied. Allow location access in your browser settings or choose a point another way.";
    case error.POSITION_UNAVAILABLE:
      return "Your current position is unavailable. Try again or choose a point another way.";
    case error.TIMEOUT:
      return "Finding your current position timed out. Try again or choose a point another way.";
    default:
      return "Your current position could not be determined. Try again or choose a point another way.";
  }
}

export function LocationSearch({
  selectedLocation,
  query,
  disabled,
  onQueryChange,
  onLocationSelect,
  onLocationClear,
}: LocationSearchProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const searchClientRef = useRef<MapboxLocationSearchClient | null>(null);
  const requestVersionRef = useRef(0);
  const geolocationRequestRef = useRef(0);
  const mountedRef = useRef(true);
  const [suggestions, setSuggestions] = useState<LocationSuggestion[]>([]);
  const [searchStatus, setSearchStatus] = useState<SearchStatus>("idle");
  const [searchMessage, setSearchMessage] = useState("");
  const [geolocationStatus, setGeolocationStatus] =
    useState<GeolocationStatus>("idle");
  const [geolocationMessage, setGeolocationMessage] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  useEffect(() => {
    mountedRef.current = true;

    if (MAPBOX_ACCESS_TOKEN) {
      searchClientRef.current = new MapboxLocationSearchClient(
        MAPBOX_ACCESS_TOKEN,
        SEARCH_DEBOUNCE_MS,
      );
    }

    return () => {
      mountedRef.current = false;
      requestVersionRef.current += 1;
      geolocationRequestRef.current += 1;
      searchClientRef.current?.abort();
      searchClientRef.current?.discardSuggestions();
      searchClientRef.current = null;
    };
  }, []);

  useEffect(() => {
    const trimmedQuery = query.trim();
    const queryCharacterCount = meaningfulCharacterCount(trimmedQuery);
    const searchClient = searchClientRef.current;
    const requestVersion = requestVersionRef.current + 1;
    requestVersionRef.current = requestVersion;

    searchClient?.abort();

    if (
      !MAPBOX_ACCESS_TOKEN ||
      !searchClient ||
      queryCharacterCount < MINIMUM_QUERY_LENGTH ||
      trimmedQuery === selectedLocation?.label
    ) {
      return;
    }

    const activeSearchClient = searchClient;
    let cancelled = false;

    async function loadSuggestions() {
      try {
        const results = await activeSearchClient.suggest(
          trimmedQuery,
          selectedLocation,
          MAXIMUM_SUGGESTIONS,
        );

        if (
          cancelled ||
          !mountedRef.current ||
          requestVersion !== requestVersionRef.current
        ) {
          return;
        }

        setSuggestions(results);
        setSearchStatus(
          results.length > 0 ? "ready" : "empty",
        );
        setSearchMessage(
          results.length > 0
            ? `${results.length} location suggestion${results.length === 1 ? "" : "s"} available.`
            : "No matching locations found.",
        );
        setActiveIndex(results.length > 0 ? 0 : -1);
      } catch (error) {
        if (
          cancelled ||
          !mountedRef.current ||
          requestVersion !== requestVersionRef.current ||
          (error instanceof DOMException && error.name === "AbortError")
        ) {
          return;
        }

        setSuggestions([]);
        setSearchStatus("error");
        setSearchMessage(searchErrorMessage(error));
        setActiveIndex(-1);
      }
    }

    void loadSuggestions();

    return () => {
      cancelled = true;
    };
  }, [query, selectedLocation]);

  const trimmedQuery = query.trim();
  const queryCharacterCount = meaningfulCharacterCount(trimmedQuery);
  const hasUnconfirmedQuery =
    trimmedQuery.length > 0 && trimmedQuery !== selectedLocation?.label;
  const showSuggestions =
    isFocused &&
    MAPBOX_ACCESS_TOKEN.length > 0 &&
    queryCharacterCount >= MINIMUM_QUERY_LENGTH &&
    trimmedQuery !== selectedLocation?.label &&
    searchStatus !== "idle";

  async function selectSuggestion(suggestion: LocationSuggestion) {
    const searchClient = searchClientRef.current;
    if (!searchClient || disabled) {
      return;
    }

    const requestVersion = requestVersionRef.current + 1;
    requestVersionRef.current = requestVersion;
    setSearchStatus("loading");
    setSearchMessage("Loading selected location…");

    try {
      const location = await searchClient.retrieve(suggestion.id);
      if (
        !mountedRef.current ||
        requestVersion !== requestVersionRef.current
      ) {
        return;
      }

      setSuggestions([]);
      setSearchStatus("idle");
      setSearchMessage("");
      setGeolocationStatus("idle");
      setGeolocationMessage("");
      setActiveIndex(-1);
      onLocationSelect(location);
    } catch (error) {
      if (
        !mountedRef.current ||
        requestVersion !== requestVersionRef.current
      ) {
        return;
      }

      setSearchStatus("error");
      setSearchMessage(searchErrorMessage(error));
    }
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (!showSuggestions || suggestions.length === 0) {
      if (event.key === "Escape") {
        setIsFocused(false);
      }
      return;
    }

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((current) => (current + 1) % suggestions.length);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex(
        (current) => (current - 1 + suggestions.length) % suggestions.length,
      );
    } else if (event.key === "Enter" && activeIndex >= 0) {
      event.preventDefault();
      void selectSuggestion(suggestions[activeIndex]);
    } else if (event.key === "Escape") {
      event.preventDefault();
      setIsFocused(false);
    }
  }

  function handleContainerBlur(event: FocusEvent<HTMLDivElement>) {
    if (
      event.relatedTarget instanceof Node &&
      containerRef.current?.contains(event.relatedTarget)
    ) {
      return;
    }

    setIsFocused(false);
  }

  function handleClear() {
    requestVersionRef.current += 1;
    geolocationRequestRef.current += 1;
    searchClientRef.current?.abort();
    searchClientRef.current?.discardSuggestions();
    onQueryChange("");
    setSuggestions([]);
    setSearchStatus("idle");
    setSearchMessage("");
    setGeolocationStatus("idle");
    setGeolocationMessage("");
    setActiveIndex(-1);
    onLocationClear();
  }

  function handleCurrentLocation() {
    if (disabled || geolocationStatus === "locating") {
      return;
    }

    if (!("geolocation" in navigator)) {
      setGeolocationStatus("error");
      setGeolocationMessage(
        "Current location is unavailable in this browser. Choose a point another way.",
      );
      return;
    }

    const requestId = geolocationRequestRef.current + 1;
    geolocationRequestRef.current = requestId;
    setGeolocationStatus("locating");
    setGeolocationMessage("Finding your current location…");
    setSuggestions([]);
    setSearchStatus("idle");
    setSearchMessage("");

    navigator.geolocation.getCurrentPosition(
      (position) => {
        if (
          !mountedRef.current ||
          requestId !== geolocationRequestRef.current
        ) {
          return;
        }

        const location: SelectedLocation = {
          longitude: position.coords.longitude,
          latitude: position.coords.latitude,
          label: "Current location",
          source: "current-location",
        };

        setGeolocationStatus("idle");
        setGeolocationMessage("");
        onLocationSelect(location);
      },
      (error) => {
        if (
          !mountedRef.current ||
          requestId !== geolocationRequestRef.current
        ) {
          return;
        }

        setGeolocationStatus("error");
        setGeolocationMessage(geolocationErrorMessage(error));
      },
      {
        enableHighAccuracy: true,
        timeout: 10_000,
        maximumAge: 60_000,
      },
    );
  }

  return (
    <div>
      <label
        className="text-sm font-semibold text-slate-800"
        htmlFor="starting-location"
      >
        Starting location
      </label>
      <div
        ref={containerRef}
        className="relative mt-2"
        onBlur={handleContainerBlur}
      >
        <div className="relative">
          <input
            id="starting-location"
            type="text"
            role="combobox"
            autoComplete="off"
            disabled={disabled}
            value={query}
            onChange={(event) => {
              const nextQuery = event.target.value;
              const trimmedNextQuery = nextQuery.trim();
              const nextQueryCharacterCount =
                meaningfulCharacterCount(trimmedNextQuery);
              requestVersionRef.current += 1;
              searchClientRef.current?.abort();
              onQueryChange(nextQuery);
              setSuggestions([]);
              setSearchMessage("");
              setActiveIndex(-1);
              setSearchStatus(
                MAPBOX_ACCESS_TOKEN &&
                  nextQueryCharacterCount >= MINIMUM_QUERY_LENGTH
                  ? "loading"
                  : "idle",
              );
              setIsFocused(true);
            }}
            onFocus={() => setIsFocused(true)}
            onKeyDown={handleKeyDown}
            placeholder="Search for a place or click the map"
            aria-autocomplete="list"
            aria-expanded={showSuggestions}
            aria-controls="location-suggestions"
            aria-activedescendant={
              showSuggestions && activeIndex >= 0
                ? `location-suggestion-${activeIndex}`
                : undefined
            }
            aria-describedby="location-help location-status"
            className="w-full rounded-xl border border-slate-300 bg-white py-3 pl-4 pr-20 text-base text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100 disabled:cursor-not-allowed disabled:bg-slate-100"
          />
          {(query || selectedLocation) && (
            <button
              type="button"
              disabled={disabled || geolocationStatus === "locating"}
              onClick={handleClear}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg px-2 py-1 text-xs font-bold text-slate-600 outline-none transition hover:bg-slate-100 focus-visible:ring-2 focus-visible:ring-emerald-600 disabled:cursor-not-allowed disabled:opacity-60"
              aria-label="Clear starting point"
            >
              Clear
            </button>
          )}
        </div>

        {showSuggestions && (
          <ul
            id="location-suggestions"
            role="listbox"
            aria-label="Location suggestions"
            className="absolute z-20 mt-2 w-full overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl shadow-slate-950/10"
          >
            {searchStatus === "loading" && (
              <li role="none">
                <p className="px-4 py-3 text-sm text-slate-600" role="status">
                  Searching Mapbox…
                </p>
              </li>
            )}

            {searchStatus === "ready" &&
              suggestions.map((suggestion, index) => (
                <li key={suggestion.id} role="none">
                  <button
                    id={`location-suggestion-${index}`}
                    type="button"
                    role="option"
                    aria-selected={activeIndex === index}
                    onMouseEnter={() => setActiveIndex(index)}
                    onClick={() => void selectSuggestion(suggestion)}
                    className={`block w-full border-b border-slate-100 px-4 py-3 text-left outline-none last:border-b-0 ${
                      activeIndex === index
                        ? "bg-emerald-50"
                        : "bg-white hover:bg-slate-50"
                    }`}
                  >
                    <span className="block text-sm font-bold text-slate-900">
                      {suggestion.primaryText}
                    </span>
                    <span className="mt-0.5 block text-xs leading-5 text-slate-600">
                      {suggestion.secondaryText}
                    </span>
                  </button>
                </li>
              ))}

            {(searchStatus === "empty" || searchStatus === "error") && (
              <li role="none">
                <p
                  className={`px-4 py-3 text-sm ${searchStatus === "error" ? "text-red-700" : "text-slate-600"}`}
                  role={searchStatus === "error" ? "alert" : "status"}
                >
                  {searchMessage}
                </p>
              </li>
            )}
          </ul>
        )}
      </div>

      <div className="mt-2 flex flex-wrap items-start justify-between gap-2">
        <p id="location-help" className="max-w-[18rem] text-xs leading-5 text-slate-500">
          Search and select a real result, or click the map to drop a pin.
          Typed but unselected text is not a confirmed starting point.
        </p>
        <button
          type="button"
          disabled={disabled || geolocationStatus === "locating"}
          onClick={handleCurrentLocation}
          className="rounded-lg px-2 py-1 text-sm font-semibold text-emerald-700 outline-none transition hover:bg-emerald-50 focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {geolocationStatus === "locating"
            ? "Finding location…"
            : "Use current location"}
        </button>
      </div>

      {!MAPBOX_ACCESS_TOKEN && (
        <p className="mt-2 text-xs font-medium text-amber-800" role="status">
          Mapbox search is unavailable until a public token is configured in
          <code className="ml-1">.env.local</code>. Map clicks are also unavailable,
          but current location can still provide coordinates.
        </p>
      )}

      <p
        id="location-status"
        className={`mt-2 text-xs font-medium ${
          searchStatus === "error" || geolocationStatus === "error"
            ? "text-red-700"
            : "text-amber-800"
        }`}
        aria-live="polite"
      >
        {geolocationMessage || searchMessage}
      </p>

      {hasUnconfirmedQuery && selectedLocation && (
        <p className="mt-2 text-xs leading-5 text-amber-800">
          This text is not selected. The confirmed point remains
          <span className="font-semibold"> {selectedLocation.label}</span>.
        </p>
      )}

      {selectedLocation && (
        <div
          className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50 p-3"
          aria-live="polite"
        >
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-xs font-bold uppercase tracking-wide text-emerald-800">
                Confirmed starting point
              </p>
              <p className="mt-1 break-words text-sm font-semibold text-slate-900">
                {selectedLocation.label}
              </p>
              <p className="mt-1 font-mono text-xs text-slate-700">
                {selectedLocation.latitude.toFixed(5)} latitude ·{" "}
                {selectedLocation.longitude.toFixed(5)} longitude
              </p>
            </div>
            <button
              type="button"
              disabled={disabled || geolocationStatus === "locating"}
              onClick={handleClear}
              className="rounded-lg bg-white px-3 py-1.5 text-xs font-bold text-emerald-800 ring-1 ring-emerald-300 outline-none transition hover:bg-emerald-100 focus-visible:ring-2 focus-visible:ring-emerald-700 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Clear starting point
            </button>
          </div>
          <p className="mt-2 text-xs leading-5 text-slate-600">
            This coordinate is real. Generated route metrics remain demo data.
          </p>
        </div>
      )}
    </div>
  );
}

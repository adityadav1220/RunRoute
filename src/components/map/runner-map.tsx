"use client";

import { useEffect, useRef, useState } from "react";
import type {
  Map as MapboxMap,
  MapboxErrorEvent,
  MapMouseEvent,
  Marker as MapboxMarker,
} from "mapbox-gl";
import type { MapCoordinate, SelectedLocation } from "@/types/map";

type MapboxLibrary = typeof import("mapbox-gl").default;
type MapStatus =
  | "loading"
  | "ready"
  | "missing-token"
  | "unsupported"
  | "authorization-error"
  | "style-error"
  | "network-error"
  | "initialization-error";

const MAPBOX_ACCESS_TOKEN =
  process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN?.trim() ?? "";

const INITIAL_CENTER: MapCoordinate = {
  longitude: -98.5795,
  latitude: 39.8283,
};

interface RunnerMapProps {
  selectedLocation: SelectedLocation | null;
  onPointSelect: (point: MapCoordinate) => void;
}

function classifyMapError(message: string): MapStatus {
  const normalizedMessage = message.toLowerCase();

  if (
    normalizedMessage.includes("401") ||
    normalizedMessage.includes("403") ||
    normalizedMessage.includes("unauthorized") ||
    normalizedMessage.includes("access token")
  ) {
    return "authorization-error";
  }

  if (normalizedMessage.includes("style")) {
    return "style-error";
  }

  if (
    normalizedMessage.includes("network") ||
    normalizedMessage.includes("failed to fetch") ||
    normalizedMessage.includes("load failed") ||
    normalizedMessage.includes("connection")
  ) {
    return "network-error";
  }

  return "initialization-error";
}

function placeMarker(
  mapbox: MapboxLibrary,
  map: MapboxMap,
  markerRef: React.MutableRefObject<MapboxMarker | null>,
  point: MapCoordinate,
) {
  if (markerRef.current) {
    markerRef.current.setLngLat([point.longitude, point.latitude]);
    return;
  }

  markerRef.current = new mapbox.Marker({ color: "#047857" })
    .setLngLat([point.longitude, point.latitude])
    .addTo(map);
}

export function RunnerMap({ selectedLocation, onPointSelect }: RunnerMapProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<MapboxMap | null>(null);
  const markerRef = useRef<MapboxMarker | null>(null);
  const mapboxRef = useRef<MapboxLibrary | null>(null);
  const selectedLocationRef = useRef(selectedLocation);
  const onPointSelectRef = useRef(onPointSelect);
  const [status, setStatus] = useState<MapStatus>(
    MAPBOX_ACCESS_TOKEN ? "loading" : "missing-token",
  );

  useEffect(() => {
    onPointSelectRef.current = onPointSelect;
  }, [onPointSelect]);

  useEffect(() => {
    selectedLocationRef.current = selectedLocation;

    if (!selectedLocation) {
      markerRef.current?.remove();
      markerRef.current = null;
      return;
    }

    if (mapRef.current && mapboxRef.current) {
      placeMarker(
        mapboxRef.current,
        mapRef.current,
        markerRef,
        selectedLocation,
      );

      if (selectedLocation.source !== "map") {
        mapRef.current.flyTo({
          center: [selectedLocation.longitude, selectedLocation.latitude],
          zoom: 14,
          essential: true,
        });
      }
    }
  }, [selectedLocation]);

  useEffect(() => {
    if (!MAPBOX_ACCESS_TOKEN || !containerRef.current) {
      return;
    }

    let disposed = false;
    let hasLoaded = false;
    let resizeObserver: ResizeObserver | null = null;

    async function initializeMap() {
      try {
        const mapbox = (await import("mapbox-gl")).default;

        if (disposed || !containerRef.current) {
          return;
        }

        if (!mapbox.supported()) {
          setStatus("unsupported");
          return;
        }

        mapboxRef.current = mapbox;

        const map = new mapbox.Map({
          accessToken: MAPBOX_ACCESS_TOKEN,
          container: containerRef.current,
          style: "mapbox://styles/mapbox/streets-v12",
          center: [INITIAL_CENTER.longitude, INITIAL_CENTER.latitude],
          zoom: 3.4,
          attributionControl: true,
        });

        mapRef.current = map;
        resizeObserver = new ResizeObserver(() => map.resize());
        resizeObserver.observe(containerRef.current);
        map.addControl(
          new mapbox.NavigationControl({
            showCompass: true,
            showZoom: true,
            visualizePitch: true,
          }),
          "top-right",
        );

        const handleLoad = () => {
          if (disposed) {
            return;
          }

          hasLoaded = true;
          map.resize();
          setStatus("ready");

          if (selectedLocationRef.current) {
            placeMarker(
              mapbox,
              map,
              markerRef,
              selectedLocationRef.current,
            );

            if (selectedLocationRef.current.source !== "map") {
              map.jumpTo({
                center: [
                  selectedLocationRef.current.longitude,
                  selectedLocationRef.current.latitude,
                ],
                zoom: 14,
              });
            }
          }
        };

        const handleClick = (event: MapMouseEvent) => {
          onPointSelectRef.current({
            longitude: event.lngLat.lng,
            latitude: event.lngLat.lat,
          });
        };

        const handleError = (event: MapboxErrorEvent) => {
          if (!disposed && !hasLoaded) {
            setStatus(classifyMapError(event.error.message));
          }
        };

        map.once("load", handleLoad);
        map.on("click", handleClick);
        map.on("error", handleError);
      } catch {
        if (!disposed) {
          setStatus("initialization-error");
        }
      }
    }

    void initializeMap();

    return () => {
      disposed = true;
      resizeObserver?.disconnect();
      markerRef.current?.remove();
      markerRef.current = null;
      mapRef.current?.remove();
      mapRef.current = null;
      mapboxRef.current = null;
    };
  }, []);

  const errorContent =
    status === "authorization-error"
      ? {
          title: "Mapbox authorization failed",
          description:
            "The public token was rejected or is not allowed for this browser origin. Check the token restrictions, then reload the page.",
        }
      : status === "style-error"
        ? {
            title: "Map style unavailable",
            description:
              "Mapbox could not load the streets style. Check the token's style access and try again.",
          }
        : status === "network-error"
          ? {
              title: "Mapbox network unavailable",
              description:
                "The browser could not reach Mapbox. Check the connection or content-security policy, then reload the page.",
            }
          : status === "initialization-error"
            ? {
                title: "The map could not start",
                description:
                  "Mapbox encountered an initialization error. Reload the page or try a supported browser.",
              }
            : null;

  return (
    <div
      className="relative h-[22rem] w-full overflow-hidden bg-slate-100 sm:h-[28rem] lg:h-[34rem]"
      role="region"
      aria-label="Interactive starting-point map"
      aria-describedby="map-instructions"
    >
      <div
        ref={containerRef}
        style={{ position: "absolute", inset: 0 }}
      />

      {status === "loading" && (
        <div
          className="absolute inset-0 flex items-center justify-center bg-slate-100"
          role="status"
          aria-live="polite"
        >
          <div className="text-center">
            <span className="mx-auto block size-8 animate-spin rounded-full border-4 border-emerald-100 border-t-emerald-700 motion-reduce:animate-none" />
            <p className="mt-3 text-sm font-bold text-slate-900">Loading map…</p>
            <p className="mt-1 text-xs text-slate-600">
              Preparing the interactive starting-point map.
            </p>
          </div>
        </div>
      )}

      {status === "missing-token" && (
        <div className="absolute inset-0 flex items-center justify-center bg-[radial-gradient(circle_at_top,#dcfce7,transparent_60%)] p-6">
          <div className="max-w-md rounded-2xl border border-emerald-200 bg-white/95 p-6 text-center shadow-lg shadow-emerald-950/5">
            <span
              className="mx-auto flex size-10 items-center justify-center rounded-full bg-amber-100 text-lg font-bold text-amber-800"
              aria-hidden="true"
            >
              !
            </span>
            <h3 className="mt-3 text-lg font-bold text-slate-950">
              Mapbox setup required
            </h3>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Add a public Mapbox access token to <code>.env.local</code> using
              this environment variable:
            </p>
            <code className="mt-3 block break-all rounded-lg bg-slate-950 px-3 py-2 text-xs font-semibold text-emerald-200">
              NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN
            </code>
          </div>
        </div>
      )}

      {status === "unsupported" && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-100 p-6" role="alert">
          <div className="max-w-sm text-center">
            <h3 className="font-bold text-slate-950">Map unavailable</h3>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              This browser does not support the graphics features required by
              Mapbox GL JS. The rest of the planner is still available.
            </p>
          </div>
        </div>
      )}

      {errorContent && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-100 p-6" role="alert">
          <div className="max-w-sm text-center">
            <h3 className="font-bold text-slate-950">{errorContent.title}</h3>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              {errorContent.description} The rest of the planner remains
              available.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

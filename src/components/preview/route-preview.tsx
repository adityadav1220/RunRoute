import { RunnerMap } from "@/components/map/runner-map";
import type { MapCoordinate } from "@/types/map";
import type { MockRoute } from "@/types/routes";

interface RoutePreviewProps {
  route: MockRoute | null;
  isGenerating: boolean;
  selectedPoint: MapCoordinate | null;
  onPointSelect: (point: MapCoordinate) => void;
}

export function RoutePreview({
  route,
  isGenerating,
  selectedPoint,
  onPointSelect,
}: RoutePreviewProps) {
  const unitLabel = route?.unit === "kilometers" ? "km" : "mi";

  return (
    <section
      aria-labelledby="route-preview-heading"
      className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl shadow-slate-900/5"
    >
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-200 px-5 py-5 sm:px-6">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-700">
            Map foundation
          </p>
          <h2
            id="route-preview-heading"
            className="mt-1 text-2xl font-bold tracking-tight text-slate-950"
          >
            Route preview
          </h2>
        </div>
        {route && (
          <div className="rounded-xl bg-slate-950 px-4 py-2 text-right text-white">
            <p className="text-xs font-medium text-slate-300">Selected demo route</p>
            <p className="text-sm font-bold">
              {route.name} · {route.distance} {unitLabel}
            </p>
          </div>
        )}
      </div>

      <div className="relative">
        <RunnerMap
          selectedPoint={selectedPoint}
          onPointSelect={onPointSelect}
        />
        {isGenerating && (
          <div
            className="pointer-events-none absolute left-1/2 top-4 z-10 flex -translate-x-1/2 items-center gap-2 rounded-full bg-slate-950/90 px-4 py-2 text-xs font-bold text-white shadow-lg"
            role="status"
            aria-live="polite"
          >
            <span className="size-3 animate-spin rounded-full border-2 border-white/40 border-t-white motion-reduce:animate-none" />
            Building demo routes…
          </div>
        )}
      </div>

      <div className="border-t border-slate-200 bg-slate-50 px-5 py-4 sm:px-6">
        <div className="flex items-start gap-3">
          <span
            className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full bg-amber-100 text-sm font-bold text-amber-800"
            aria-hidden="true"
          >
            i
          </span>
          <div>
            <p id="map-instructions" className="text-sm font-semibold text-slate-800">
              {selectedPoint
                ? "The selected map point is a real coordinate."
                : "With Mapbox configured, click the map to place your starting point."}
            </p>
            <p className="mt-1 text-xs leading-5 text-slate-600">
              Route metrics remain illustrative demo data. Real route geometry
              will be implemented later and is not drawn on this map.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

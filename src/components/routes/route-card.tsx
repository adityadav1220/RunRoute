import type { KeyboardEvent } from "react";
import type { MockRoute } from "@/types/routes";

interface RouteCardProps {
  route: MockRoute;
  selected: boolean;
  onSelect: () => void;
}

export function RouteCard({ route, selected, onSelect }: RouteCardProps) {
  const unitLabel = route.unit === "miles" ? "mi" : "km";

  function handleKeyDown(event: KeyboardEvent<HTMLElement>) {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onSelect();
    }
  }

  return (
    <article
      role="button"
      aria-pressed={selected}
      tabIndex={0}
      onClick={onSelect}
      onKeyDown={handleKeyDown}
      className={`w-full cursor-pointer rounded-2xl border p-5 text-left outline-none transition focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2 ${
        selected
          ? "border-emerald-600 bg-emerald-50 shadow-md shadow-emerald-950/5"
          : "border-slate-200 bg-white hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md motion-reduce:hover:translate-y-0"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-lg font-bold text-slate-950">{route.name}</h3>
            {route.id === "best-match" && (
              <span className="rounded-full bg-emerald-700 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
                Recommended
              </span>
            )}
          </div>
          <p className="mt-1 text-sm text-slate-600">
            {route.distance} {unitLabel} · {route.duration}
          </p>
        </div>
        <span
          className={`flex size-6 shrink-0 items-center justify-center rounded-full border text-xs font-bold ${
            selected
              ? "border-emerald-700 bg-emerald-700 text-white"
              : "border-slate-300 bg-white text-transparent"
          }`}
          aria-hidden="true"
        >
          ✓
        </span>
      </div>

      <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 border-y border-slate-200/80 py-4 sm:grid-cols-4 lg:grid-cols-2 xl:grid-cols-4">
        <div>
          <dt className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
            Pace
          </dt>
          <dd className="mt-0.5 text-sm font-bold text-slate-900">
            {route.pace}/{unitLabel}
          </dd>
        </div>
        <div>
          <dt className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
            Elevation
          </dt>
          <dd className="mt-0.5 text-sm font-bold text-slate-900">
            {route.elevationGain} ft
          </dd>
        </div>
        <div>
          <dt className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
            Turns
          </dt>
          <dd className="mt-0.5 text-sm font-bold text-slate-900">{route.turns}</dd>
        </div>
        <div>
          <dt className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
            Repeated
          </dt>
          <dd className="mt-0.5 text-sm font-bold text-slate-900">
            {route.repeatedRoutePercentage}%
          </dd>
        </div>
      </dl>

      <ul className="mt-4 space-y-2">
        {route.reasons.map((reason) => (
          <li key={reason} className="flex gap-2 text-xs leading-5 text-slate-600">
            <span className="mt-2 size-1.5 shrink-0 rounded-full bg-emerald-600" />
            <span>{reason}</span>
          </li>
        ))}
      </ul>

      <p className="mt-4 text-xs font-bold text-emerald-800">
        {selected ? "Selected route" : "Select this route"}
      </p>
    </article>
  );
}

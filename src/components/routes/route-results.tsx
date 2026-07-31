import { RouteCard } from "./route-card";
import type { MockRoute } from "@/types/routes";

interface RouteResultsProps {
  routes: MockRoute[];
  selectedRouteId: MockRoute["id"] | null;
  onSelect: (route: MockRoute) => void;
}

export function RouteResults({
  routes,
  selectedRouteId,
  onSelect,
}: RouteResultsProps) {
  return (
    <section aria-labelledby="route-options-heading" className="mt-8">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-700">
            Compare options
          </p>
          <h2
            id="route-options-heading"
            className="mt-1 text-2xl font-bold tracking-tight text-slate-950"
          >
            Demo routes
          </h2>
        </div>
        <p className="max-w-xs text-right text-xs leading-5 text-slate-500">
          Illustrative values only—not generated from real streets or conditions.
        </p>
      </div>
      <div className="grid gap-4">
        {routes.map((route) => (
          <RouteCard
            key={route.id}
            route={route}
            selected={route.id === selectedRouteId}
            onSelect={() => onSelect(route)}
          />
        ))}
      </div>
    </section>
  );
}

"use client";

import { useEffect, useRef, useState } from "react";
import { generateMockRoutes } from "@/lib/mock-routes";
import type { MockRoute, PlannerConfig, RouteType } from "@/types/routes";
import { RoutePreview } from "@/components/preview/route-preview";
import { RouteResults } from "@/components/routes/route-results";
import { PlannerForm } from "./planner-form";

const GENERATION_DELAY_MS = 450;

export function PlannerApp() {
  const [routes, setRoutes] = useState<MockRoute[]>([]);
  const [selectedRoute, setSelectedRoute] = useState<MockRoute | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [previewRouteType, setPreviewRouteType] = useState<RouteType>("loop");
  const generationTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (generationTimer.current) {
        clearTimeout(generationTimer.current);
      }
    };
  }, []);

  function handleGenerate(config: PlannerConfig) {
    if (generationTimer.current) {
      return;
    }

    setIsGenerating(true);
    setRoutes([]);
    setSelectedRoute(null);
    setPreviewRouteType(config.routeType);

    generationTimer.current = setTimeout(() => {
      const generatedRoutes = generateMockRoutes(config);
      setRoutes(generatedRoutes);
      setSelectedRoute(generatedRoutes[0]);
      setIsGenerating(false);
      generationTimer.current = null;
    }, GENERATION_DELAY_MS);
  }

  function handlePlannerChange() {
    if (routes.length > 0 || selectedRoute) {
      setRoutes([]);
      setSelectedRoute(null);
    }
  }

  return (
    <div className="mx-auto max-w-[1500px] px-4 pb-16 sm:px-6 lg:px-8">
      <header className="flex flex-col gap-6 py-8 sm:py-10 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <a
            href="#main-content"
            className="sr-only rounded-lg bg-white px-4 py-2 font-semibold text-emerald-800 focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50"
          >
            Skip to planner
          </a>
          <div className="flex items-center gap-3">
            <span
              className="flex size-11 items-center justify-center rounded-2xl bg-emerald-700 text-white shadow-sm"
              aria-hidden="true"
            >
              <svg viewBox="0 0 24 24" className="size-6" fill="none">
                <path d="M7 19c4-1 1-7 6-8s2-6 5-6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
                <circle cx="6" cy="19" r="2" fill="currentColor" />
                <circle cx="18" cy="5" r="2" fill="#fbbf24" />
              </svg>
            </span>
            <div>
              <h1 className="text-2xl font-extrabold tracking-tight text-slate-950">
                RunRoute
              </h1>
              <p className="text-sm font-medium text-emerald-800">
                Smart routes for every run.
              </p>
            </div>
          </div>
        </div>
        <div className="max-w-xl lg:text-right">
          <p className="text-sm leading-6 text-slate-600">
            Shape a run around your distance and style, then compare three
            illustrative route concepts before mapping arrives.
          </p>
          <p className="mt-2 inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-600 ring-1 ring-slate-200">
            <span className="size-2 rounded-full bg-amber-500" />
            Local demo data only
          </p>
        </div>
      </header>

      <main
        id="main-content"
        className="grid grid-cols-[minmax(0,1fr)] items-start gap-6 lg:grid-cols-[minmax(360px,430px)_minmax(0,1fr)] lg:gap-8"
      >
        <aside className="min-w-0 rounded-3xl border border-slate-200 bg-white p-5 shadow-xl shadow-slate-900/5 sm:p-7 lg:sticky lg:top-6">
          <PlannerForm
            isGenerating={isGenerating}
            onGenerate={handleGenerate}
            onFormChange={handlePlannerChange}
            onRouteTypeChange={setPreviewRouteType}
          />
        </aside>

        <div className="min-w-0" aria-busy={isGenerating}>
          <RoutePreview
            route={selectedRoute}
            routeType={previewRouteType}
            isGenerating={isGenerating}
          />

          {!isGenerating && routes.length > 0 && (
            <RouteResults
              routes={routes}
              selectedRouteId={selectedRoute?.id ?? null}
              onSelect={setSelectedRoute}
            />
          )}

          {!isGenerating && routes.length === 0 && (
            <section className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-white/60 px-6 py-8 text-center">
              <p className="font-bold text-slate-900">Your route options will appear here</p>
              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-600">
                Enter a starting point, choose a distance, and tune your route
                preferences to generate three illustrative options.
              </p>
            </section>
          )}
        </div>
      </main>
    </div>
  );
}

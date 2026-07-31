"use client";

import { useState, type FormEvent } from "react";
import type {
  DistanceUnit,
  PlannerConfig,
  RoutePersonality,
  RoutePreference,
  RouteType,
} from "@/types/routes";

const routeTypes: Array<{
  value: RouteType;
  label: string;
  description: string;
}> = [
  {
    value: "loop",
    label: "Loop",
    description: "Returns to the start using different streets where possible.",
  },
  {
    value: "out-and-back",
    label: "Out and back",
    description: "Follows a route outward and returns along the same path.",
  },
];

const personalities: Array<{
  value: RoutePersonality;
  label: string;
  description: string;
}> = [
  {
    value: "balanced",
    label: "Balanced",
    description: "A practical mix of distance accuracy, comfort, and variety.",
  },
  {
    value: "comfortable",
    label: "Comfortable",
    description: "Fewer turns and a calmer running experience.",
  },
  {
    value: "explorer",
    label: "Explorer",
    description: "Prioritizes variety and unfamiliar areas.",
  },
  {
    value: "fast",
    label: "Fast",
    description: "Favors simple and direct routes.",
  },
];

const preferenceOptions: Array<{
  value: RoutePreference;
  label: string;
}> = [
  { value: "preferParks", label: "Prefer parks" },
  { value: "avoidMajorRoads", label: "Avoid major roads" },
  { value: "preferFlatter", label: "Prefer flatter routes" },
  { value: "preferNewStreets", label: "Prefer new streets" },
];

const initialConfig: PlannerConfig = {
  startingLocation: "",
  distance: 3,
  unit: "miles",
  routeType: "loop",
  personality: "balanced",
  preferences: {
    preferParks: false,
    avoidMajorRoads: false,
    preferFlatter: false,
    preferNewStreets: false,
  },
};

const MILES_TO_KILOMETERS = 1.60934;

interface PlannerFormProps {
  isGenerating: boolean;
  onGenerate: (config: PlannerConfig) => void;
  onFormChange: () => void;
  onRouteTypeChange: (routeType: RouteType) => void;
}

export function PlannerForm({
  isGenerating,
  onGenerate,
  onFormChange,
  onRouteTypeChange,
}: PlannerFormProps) {
  const [config, setConfig] = useState(initialConfig);
  const [locationMessage, setLocationMessage] = useState("");
  const maximumDistance = config.unit === "miles" ? 50 : 80;
  const isLocationValid = config.startingLocation.trim().length > 0;
  const isDistanceValid =
    Number.isFinite(config.distance) &&
    config.distance > 0 &&
    config.distance <= maximumDistance;
  const isValid = isLocationValid && isDistanceValid;

  function updateConfig<Key extends keyof PlannerConfig>(
    key: Key,
    value: PlannerConfig[Key],
  ) {
    onFormChange();
    setConfig((current) => ({ ...current, [key]: value }));
  }

  function updateUnit(unit: DistanceUnit) {
    const maximum = unit === "miles" ? 50 : 80;
    onFormChange();
    setConfig((current) => ({
      ...current,
      unit,
      distance: Math.min(
        Number(
          (
            current.distance *
            (unit === "kilometers"
              ? MILES_TO_KILOMETERS
              : 1 / MILES_TO_KILOMETERS)
          ).toFixed(1),
        ),
        maximum,
      ),
    }));
  }

  function togglePreference(preference: RoutePreference) {
    onFormChange();
    setConfig((current) => ({
      ...current,
      preferences: {
        ...current.preferences,
        [preference]: !current.preferences[preference],
      },
    }));
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isValid && !isGenerating) {
      onGenerate({
        ...config,
        startingLocation: config.startingLocation.trim(),
      });
    }
  }

  return (
    <form className="space-y-8" onSubmit={handleSubmit} noValidate>
      <div>
        <div className="mb-5 flex items-center justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-700">
              Plan your run
            </p>
            <h2 className="mt-1 text-2xl font-bold tracking-tight text-slate-950">
              Route preferences
            </h2>
          </div>
          <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-800 ring-1 ring-amber-200">
            Demo
          </span>
        </div>

        <label
          className="text-sm font-semibold text-slate-800"
          htmlFor="starting-location"
        >
          Starting location
        </label>
        <input
          id="starting-location"
          type="text"
          disabled={isGenerating}
          value={config.startingLocation}
          onChange={(event) =>
            updateConfig("startingLocation", event.target.value)
          }
          placeholder="Enter an address or neighborhood"
          aria-describedby="location-help location-status"
          className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-base text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100"
        />
        <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
          <p id="location-help" className="text-xs text-slate-500">
            Used only to configure this illustrative demo.
          </p>
          <button
            type="button"
            disabled={isGenerating}
            onClick={() =>
              setLocationMessage(
                "Live location support will be added in a later milestone.",
              )
            }
            className="rounded-lg px-2 py-1 text-sm font-semibold text-emerald-700 outline-none transition hover:bg-emerald-50 focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2"
          >
            Use current location
          </button>
        </div>
        <p
          id="location-status"
          className="mt-2 text-xs font-medium text-amber-800"
          aria-live="polite"
        >
          {locationMessage}
        </p>
      </div>

      <fieldset>
        <legend className="text-sm font-semibold text-slate-800">Distance</legend>
        <div className="mt-2 grid grid-cols-[minmax(0,1fr)_auto] gap-2">
          <input
            aria-label={`Distance in ${config.unit}`}
            type="number"
            disabled={isGenerating}
            inputMode="decimal"
            min="0.1"
            max={maximumDistance}
            step="0.1"
            value={config.distance || ""}
            onChange={(event) =>
              updateConfig("distance", event.target.valueAsNumber || 0)
            }
            aria-invalid={!isDistanceValid}
            aria-describedby="distance-help"
            className="min-w-0 rounded-xl border border-slate-300 bg-white px-4 py-3 text-base font-semibold text-slate-950 outline-none transition focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100"
          />
          <select
            aria-label="Distance unit"
            disabled={isGenerating}
            value={config.unit}
            onChange={(event) => updateUnit(event.target.value as DistanceUnit)}
            className="rounded-xl border border-slate-300 bg-white px-3 py-3 text-sm font-semibold text-slate-800 outline-none transition focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100"
          >
            <option value="miles">Miles</option>
            <option value="kilometers">Kilometers</option>
          </select>
        </div>
        <p
          id="distance-help"
          className={`mt-2 text-xs ${isDistanceValid ? "text-slate-500" : "font-medium text-red-700"}`}
        >
          Enter a distance between 0.1 and {maximumDistance} {config.unit}.
        </p>
      </fieldset>

      <fieldset>
        <legend className="text-sm font-semibold text-slate-800">Route type</legend>
        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
          {routeTypes.map((option) => {
            const selected = config.routeType === option.value;
            return (
              <label
                key={option.value}
                className={`cursor-pointer rounded-xl border p-4 outline-none transition focus-within:ring-2 focus-within:ring-emerald-600 focus-within:ring-offset-2 ${
                  selected
                    ? "border-emerald-600 bg-emerald-50 shadow-sm"
                    : "border-slate-200 bg-white hover:border-slate-300"
                }`}
              >
                <input
                  type="radio"
                  disabled={isGenerating}
                  name="route-type"
                  value={option.value}
                  checked={selected}
                  onChange={() => {
                    updateConfig("routeType", option.value);
                    onRouteTypeChange(option.value);
                  }}
                  className="sr-only"
                />
                <span className="flex items-center justify-between gap-2">
                  <span className="font-semibold text-slate-900">{option.label}</span>
                  <span
                    className={`flex size-5 items-center justify-center rounded-full border text-[10px] font-bold ${
                      selected
                        ? "border-emerald-700 bg-emerald-700 text-white"
                        : "border-slate-300 text-transparent"
                    }`}
                    aria-hidden="true"
                  >
                    ✓
                  </span>
                </span>
                <span className="mt-2 block text-xs leading-5 text-slate-600">
                  {option.description}
                </span>
              </label>
            );
          })}
        </div>
      </fieldset>

      <fieldset>
        <legend className="text-sm font-semibold text-slate-800">
          Route personality
        </legend>
        <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
          {personalities.map((option) => {
            const selected = config.personality === option.value;
            return (
              <label
                key={option.value}
                className={`cursor-pointer rounded-xl border px-4 py-3 outline-none transition focus-within:ring-2 focus-within:ring-emerald-600 focus-within:ring-offset-2 ${
                  selected
                    ? "border-emerald-600 bg-emerald-50"
                    : "border-slate-200 bg-white hover:border-slate-300"
                }`}
              >
                <input
                  type="radio"
                  disabled={isGenerating}
                  name="route-personality"
                  value={option.value}
                  checked={selected}
                  onChange={() => updateConfig("personality", option.value)}
                  className="sr-only"
                />
                <span className="flex items-center justify-between gap-2">
                  <span className="font-semibold text-slate-900">{option.label}</span>
                  {selected && (
                    <span className="text-xs font-bold text-emerald-800">Selected</span>
                  )}
                </span>
                <span className="mt-1 block text-xs leading-5 text-slate-600">
                  {option.description}
                </span>
              </label>
            );
          })}
        </div>
      </fieldset>

      <fieldset>
        <legend className="text-sm font-semibold text-slate-800">
          Route preferences
        </legend>
        <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
          {preferenceOptions.map((option) => {
            const selected = config.preferences[option.value];
            return (
              <label
                key={option.value}
                className={`flex cursor-pointer items-center gap-3 rounded-xl border px-3 py-3 text-sm font-medium outline-none transition focus-within:ring-2 focus-within:ring-emerald-600 focus-within:ring-offset-2 ${
                  selected
                    ? "border-emerald-600 bg-emerald-50 text-emerald-950"
                    : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
                }`}
              >
                <input
                  type="checkbox"
                  disabled={isGenerating}
                  checked={selected}
                  onChange={() => togglePreference(option.value)}
                  className="size-4 rounded border-slate-300 accent-emerald-700"
                />
                {option.label}
              </label>
            );
          })}
        </div>
      </fieldset>

      <div>
        <button
          type="submit"
          disabled={!isValid || isGenerating}
          aria-describedby={!isValid ? "form-validation" : undefined}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-700 px-5 py-3.5 text-base font-bold text-white shadow-sm outline-none transition hover:bg-emerald-800 focus-visible:ring-2 focus-visible:ring-emerald-700 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-600 disabled:shadow-none"
        >
          {isGenerating && (
            <span
              className="size-4 animate-spin rounded-full border-2 border-white/40 border-t-white motion-reduce:animate-none"
              aria-hidden="true"
            />
          )}
          {isGenerating ? "Generating routes…" : "Generate routes"}
        </button>
        <p id="form-validation" className="mt-2 text-center text-xs text-slate-500">
          {!isLocationValid
            ? "Enter a starting location to generate demo routes."
            : !isDistanceValid
              ? `Enter a valid distance up to ${maximumDistance} ${config.unit}.`
              : "Routes use illustrative data only."}
        </p>
      </div>
    </form>
  );
}

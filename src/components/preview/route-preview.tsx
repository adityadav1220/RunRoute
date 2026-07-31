import type { MockRoute, RouteType } from "@/types/routes";

interface RoutePreviewProps {
  route: MockRoute | null;
  routeType: RouteType;
  isGenerating: boolean;
}

function RouteIllustration({ routeType }: { routeType: RouteType }) {
  const isLoop = routeType === "loop";

  return (
    <svg
      viewBox="0 0 640 340"
      role="img"
      aria-label={
        isLoop
          ? "Abstract illustration of a loop route"
          : "Abstract illustration of an out-and-back route"
      }
      className="h-full w-full"
    >
      <defs>
        <pattern id="preview-grid" width="32" height="32" patternUnits="userSpaceOnUse">
          <path d="M 32 0 L 0 0 0 32" fill="none" stroke="#dce8e1" strokeWidth="1" />
        </pattern>
        <filter id="route-shadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="4" stdDeviation="5" floodColor="#064e3b" floodOpacity="0.18" />
        </filter>
      </defs>
      <rect width="640" height="340" rx="24" fill="#f0f6f2" />
      <rect width="640" height="340" rx="24" fill="url(#preview-grid)" />
      <path d="M-10 258 C110 230 150 286 278 258 S495 220 660 250" fill="none" stroke="#d7e5dc" strokeWidth="22" />
      <path d="M40 64 C122 98 168 42 242 70 S366 114 464 70 S566 54 634 82" fill="none" stroke="#d7e5dc" strokeWidth="14" />
      <circle cx="535" cy="148" r="42" fill="#d8eadc" />
      <circle cx="104" cy="160" r="30" fill="#d8eadc" />
      <circle cx="466" cy="278" r="24" fill="#d8eadc" />
      <path
        d={
          isLoop
            ? "M174 242 C109 183 147 96 238 97 C330 98 317 183 414 166 C501 151 542 229 465 267 C373 311 248 307 174 242 Z"
            : "M140 243 C202 221 236 158 300 173 C363 187 393 99 492 104 M492 104 C395 117 370 204 300 186 C233 168 201 233 140 243"
        }
        fill="none"
        stroke="#047857"
        strokeWidth="12"
        strokeLinecap="round"
        strokeLinejoin="round"
        filter="url(#route-shadow)"
      />
      <circle cx={isLoop ? "174" : "140"} cy={isLoop ? "242" : "243"} r="15" fill="white" stroke="#064e3b" strokeWidth="7" />
      <circle cx={isLoop ? "174" : "492"} cy={isLoop ? "242" : "104"} r="7" fill="#f59e0b" stroke="white" strokeWidth="4" />
    </svg>
  );
}

export function RoutePreview({
  route,
  routeType,
  isGenerating,
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
            Visual guide
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
            <p className="text-xs font-medium text-slate-300">Selected</p>
            <p className="text-sm font-bold">
              {route.name} · {route.distance} {unitLabel}
            </p>
          </div>
        )}
      </div>

      <div className="relative aspect-[16/9] min-h-64 p-4 sm:p-6">
        <RouteIllustration routeType={route?.routeType ?? routeType} />
        {isGenerating && (
          <div
            className="absolute inset-0 flex items-center justify-center bg-white/85 backdrop-blur-sm"
            role="status"
            aria-live="polite"
          >
            <div className="text-center">
              <span className="mx-auto block size-8 animate-spin rounded-full border-4 border-emerald-100 border-t-emerald-700 motion-reduce:animate-none" />
              <p className="mt-3 text-sm font-bold text-slate-900">
                Building demo routes…
              </p>
              <p className="mt-1 text-xs text-slate-600">
                Calculating illustrative options locally.
              </p>
            </div>
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
            <p className="text-sm font-semibold text-slate-800">
              {route
                ? "This is an abstract illustration, not a real route."
                : "Configure your run to compare three route ideas."}
            </p>
            <p className="mt-1 text-xs leading-5 text-slate-600">
              An interactive map will be added in a later milestone.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

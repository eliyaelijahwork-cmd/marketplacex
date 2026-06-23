"use client";

import { useLocation } from "@/app/contexts/LocationContext";

type LocationButtonProps = {
  compact?: boolean;
};

export default function LocationButton({ compact = false }: LocationButtonProps) {
  const { location, loading, error, requestLocation, clearLocation } = useLocation();

  return (
    <div className="flex min-w-0 flex-col gap-1 md:w-auto">
      <button
        className="inline-flex w-full max-w-full items-center justify-center gap-2 rounded-md border border-cyan-200 bg-cyan-50 px-3 py-2 text-sm font-bold text-cyan-900 transition hover:bg-cyan-100 disabled:cursor-wait disabled:opacity-70 md:w-auto"
        disabled={loading}
        onClick={requestLocation}
        type="button"
      >
        <Icon path="M12 21s7-4.35 7-11a7 7 0 1 0-14 0c0 6.65 7 11 7 11Zm0-8a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" />
        <span className="truncate">
          {loading
            ? "Detecting..."
            : location
              ? compact
                ? location.city
                : `${location.city}${location.state ? `, ${location.state}` : ""}`
              : "Use My Location"}
        </span>
      </button>
      {!compact && location && (
        <button
          className="text-left text-xs font-semibold text-slate-500 transition hover:text-slate-900"
          onClick={clearLocation}
          type="button"
        >
          Clear location
        </button>
      )}
      {!compact && error && <p className="max-w-xs text-xs font-semibold text-red-600">{error}</p>}
    </div>
  );
}

function Icon({ path }: { path: string }) {
  return (
    <svg
      aria-hidden="true"
      className="h-4 w-4 flex-shrink-0"
      fill="none"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d={path}
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      />
    </svg>
  );
}

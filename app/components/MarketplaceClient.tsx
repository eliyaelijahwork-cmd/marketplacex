"use client";

import Link from "next/link";
import { categories, type MaterialFilters } from "@/app/data/marketplace";
import { useLocation } from "@/app/contexts/LocationContext";
import { useMaterials } from "@/app/hooks/useMaterials";
import LocationButton from "./LocationButton";
import MaterialCard from "./MaterialCard";

type MarketplaceClientProps = {
  initialFilters?: Partial<MaterialFilters>;
};

const distanceOptions = [
  { label: "Any distance", value: 500 },
  { label: "Within 5 km", value: 5 },
  { label: "Within 10 km", value: 10 },
  { label: "Within 25 km", value: 25 },
  { label: "Within 50 km", value: 50 },
];

export default function MarketplaceClient({ initialFilters }: MarketplaceClientProps) {
  const { location } = useLocation();
  const { visibleMaterials, filters, setFilters, loading, error } =
    useMaterials(initialFilters);

  return (
    <main className="bg-slate-50">
      <section className="border-b border-slate-200 bg-white py-10">
        <div className="mx-auto grid w-full max-w-7xl gap-6 px-4 sm:px-6 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end lg:px-8">
          <div>
            <p className="text-sm font-black uppercase text-cyan-700">
              Marketplace listings
            </p>
            <h1 className="mt-3 text-3xl font-black text-slate-950 sm:text-4xl">
              Construction Materials Near You
            </h1>
            <p className="mt-4 max-w-3xl text-lg leading-8 text-slate-600">
              Filter by category, price, city, and distance. Listings are sorted by nearest
              supplier when your location is available.
            </p>
          </div>
          <LocationButton />
        </div>
      </section>

      <section className="mx-auto grid w-full max-w-7xl grid-cols-1 gap-6 px-4 py-8 sm:px-6 lg:grid-cols-[minmax(0,18rem)_minmax(0,1fr)] lg:px-8">
        <aside className="h-fit max-w-full rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:p-5 lg:sticky lg:top-44">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-lg font-black text-slate-950">Filters</h2>
            <button
              className="text-sm font-bold text-cyan-700"
              onClick={() =>
                setFilters({
                  query: "",
                  category: "all",
                  maxDistanceKm: 500,
                  minPrice: "",
                  maxPrice: "",
                  location: "",
                  minRating: "",
                })
              }
              type="button"
            >
              Reset
            </button>
          </div>

          <div className="mt-5 grid gap-4">
            <label className="grid gap-2 text-sm font-bold text-slate-700">
              Search
              <input
                className={inputClass}
                onChange={(event) =>
                  setFilters((current) => ({ ...current, query: event.target.value }))
                }
                placeholder="Material or supplier"
                type="search"
                value={filters.query}
              />
            </label>

            <label className="grid gap-2 text-sm font-bold text-slate-700">
              Category
              <select
                className={inputClass}
                onChange={(event) =>
                  setFilters((current) => ({ ...current, category: event.target.value }))
                }
                value={filters.category}
              >
                <option value="all">All categories</option>
                {categories.map((category) => (
                  <option key={category.slug} value={category.slug}>
                    {category.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="grid gap-2 text-sm font-bold text-slate-700">
              Distance
              <select
                className={inputClass}
                disabled={!location}
                onChange={(event) =>
                  setFilters((current) => ({
                    ...current,
                    maxDistanceKm: Number(event.target.value),
                  }))
                }
                value={filters.maxDistanceKm}
              >
                {distanceOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              {!location && (
                <span className="text-xs font-semibold text-slate-500">
                  Use location to enable distance filtering.
                </span>
              )}
            </label>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <label className="grid gap-2 text-sm font-bold text-slate-700">
                Min price
                <input
                  className={inputClass}
                  min="0"
                  onChange={(event) =>
                    setFilters((current) => ({ ...current, minPrice: event.target.value }))
                  }
                  type="number"
                  value={filters.minPrice}
                />
              </label>
              <label className="grid gap-2 text-sm font-bold text-slate-700">
                Max price
                <input
                  className={inputClass}
                  min="0"
                  onChange={(event) =>
                    setFilters((current) => ({ ...current, maxPrice: event.target.value }))
                  }
                  type="number"
                  value={filters.maxPrice}
                />
              </label>
            </div>

            <label className="grid gap-2 text-sm font-bold text-slate-700">
              City or state
              <input
                className={inputClass}
                onChange={(event) =>
                  setFilters((current) => ({ ...current, location: event.target.value }))
                }
                placeholder="Chennai, Tamil Nadu"
                value={filters.location}
              />
            </label>

            <label className="grid gap-2 text-sm font-bold text-slate-700">
              Supplier rating
              <select
                className={inputClass}
                onChange={(event) =>
                  setFilters((current) => ({ ...current, minRating: event.target.value }))
                }
                value={filters.minRating}
              >
                <option value="">Any rating</option>
                <option value="4.5">4.5+ stars</option>
                <option value="4">4+ stars</option>
                <option value="3">3+ stars</option>
              </select>
            </label>
          </div>
        </aside>

        <div>
          <div className="mb-5 flex flex-col gap-3 rounded-lg border border-slate-200 bg-white p-4 shadow-sm md:flex-row md:items-center md:justify-between">
            <div>
              <p className="font-black text-slate-950">
                {loading ? "Loading listings..." : `${visibleMaterials.length} materials found`}
              </p>
              <p className="mt-1 text-sm text-slate-600">
                {location
                  ? `Sorted nearest to ${location.city}`
                  : "Use location to sort by nearest suppliers"}
              </p>
            </div>
            <Link
              className="w-full rounded-md bg-cyan-700 px-4 py-2 text-center text-sm font-black text-white transition hover:bg-cyan-800 md:w-auto"
              href="/login?redirect=/supplier-dashboard"
            >
              Post a listing
            </Link>
          </div>

          {error && (
            <div className="mb-5 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm font-semibold text-amber-900">
              {error}
            </div>
          )}

          {loading ? (
            <ListingSkeleton />
          ) : visibleMaterials.length ? (
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
              {visibleMaterials.map((material) => (
                <MaterialCard key={material.id} material={material} />
              ))}
            </div>
          ) : (
            <div className="rounded-lg border border-slate-200 bg-white p-10 text-center shadow-sm">
              <h2 className="text-2xl font-black text-slate-950">No listings found</h2>
              <p className="mt-3 text-slate-600">
                Try a wider distance, another category, or a different price range.
              </p>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}

const inputClass =
  "w-full min-w-0 rounded-md border border-slate-300 bg-white px-3 py-2.5 font-normal outline-none transition focus:border-cyan-600 focus:ring-2 focus:ring-cyan-100 disabled:bg-slate-100";

function ListingSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: 6 }).map((_, index) => (
        <div
          className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm"
          key={index}
        >
          <div className="aspect-[4/3] animate-pulse bg-slate-200" />
          <div className="grid gap-3 p-4">
            <div className="h-5 w-2/3 animate-pulse rounded bg-slate-200" />
            <div className="h-4 w-1/2 animate-pulse rounded bg-slate-200" />
            <div className="h-10 animate-pulse rounded bg-slate-200" />
          </div>
        </div>
      ))}
    </div>
  );
}

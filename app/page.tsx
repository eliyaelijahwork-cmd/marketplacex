import Link from "next/link";
import LocationButton from "./components/LocationButton";
import MaterialCard from "./components/MaterialCard";
import {
  categories,
  heroImage,
  seedMaterials,
  seedSuppliers,
} from "./data/marketplace";

const trustStats = [
  { label: "Live material categories", value: "9" },
  { label: "Supplier-ready listings", value: "500+" },
  { label: "Direct calls and WhatsApp", value: "24/7" },
];

export default function Home() {
  return (
    <main className="bg-slate-50">
      <section className="relative isolate overflow-hidden border-b border-slate-200 bg-white">
        <img
          alt="Construction materials stocked for marketplace buyers"
          className="absolute inset-0 h-full w-full max-w-full object-cover"
          src={heroImage}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-white via-white/95 to-white/40" />
        <div className="relative mx-auto grid min-h-[480px] w-full max-w-7xl grid-cols-1 gap-8 px-4 py-8 sm:min-h-[520px] sm:px-6 sm:py-10 lg:grid-cols-[minmax(0,0.78fr)_minmax(0,0.7fr)] lg:items-center lg:px-8">
          <div>
            <p className="text-sm font-black uppercase text-cyan-700">
              OLX-style construction material marketplace
            </p>
            <h1 className="mt-4 max-w-3xl text-3xl font-black leading-tight text-slate-950 sm:text-5xl lg:text-6xl">
              Buy cement, steel, sand, bricks, and site supplies near you.
            </h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-700">
              Compare nearby suppliers, sort by distance, call directly, and let suppliers post
              verified material stock with photos and GPS location.
            </p>

            <form
              action="/materials"
              className="mt-7 grid overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm sm:grid-cols-[minmax(0,1fr)_minmax(10rem,14rem)] md:grid-cols-[minmax(0,1fr)_minmax(10rem,14rem)_auto]"
            >
              <input
                className="min-w-0 px-4 py-4 text-sm text-slate-950 outline-none"
                name="q"
                placeholder="Search M-sand, 12mm TMT, OPC cement..."
                type="search"
              />
              <select
                className="border-t border-slate-200 bg-white px-4 py-4 text-sm font-bold text-slate-800 outline-none sm:border-l sm:border-t-0"
                defaultValue="all"
                name="category"
              >
                <option value="all">All categories</option>
                {categories.map((category) => (
                  <option key={category.slug} value={category.slug}>
                    {category.name}
                  </option>
                ))}
              </select>
              <button
                className="w-full bg-cyan-700 px-6 py-4 text-sm font-black text-white transition hover:bg-cyan-800 sm:w-auto"
                type="submit"
              >
                Search
              </button>
            </form>

            <div className="mt-5 flex flex-col items-stretch gap-3 sm:flex-row sm:items-center">
              <LocationButton />
              <Link
                className="w-full rounded-md bg-slate-950 px-5 py-3 text-center text-sm font-black text-white transition hover:bg-slate-800 sm:w-auto"
                href="/login?redirect=/supplier-dashboard"
              >
                Post Material
              </Link>
            </div>
          </div>

          <div className="grid gap-3">
            {trustStats.map((stat) => (
              <div
                className="rounded-lg border border-white/70 bg-white/90 p-5 shadow-sm backdrop-blur"
                key={stat.label}
              >
                <p className="text-3xl font-black text-cyan-700">{stat.value}</p>
                <p className="mt-1 text-sm font-bold text-slate-700">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white py-8">
        <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <h2 className="text-2xl font-black text-slate-950">Browse Categories</h2>
            <Link className="w-full text-sm font-black text-cyan-700 md:w-auto" href="/materials">
              View all
            </Link>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
            {categories.map((category) => (
              <Link
                className="group rounded-lg border border-slate-200 bg-white p-4 text-center shadow-sm transition hover:border-cyan-300 hover:bg-cyan-50"
                href={`/materials?category=${category.slug}`}
                key={category.slug}
              >
                <span className="mx-auto grid h-11 w-11 place-items-center rounded-md bg-slate-100 text-cyan-700 group-hover:bg-white">
                  <Icon path={category.iconPath} />
                </span>
                <p className="mt-3 text-sm font-black text-slate-950">{category.name}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="py-10">
        <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-black uppercase text-cyan-700">Featured stock</p>
              <h2 className="mt-2 text-3xl font-black text-slate-950">Nearby-ready Materials</h2>
            </div>
            <Link
              className="w-full rounded-md border border-slate-300 px-4 py-2 text-center text-sm font-black text-slate-800 transition hover:border-cyan-500 hover:text-cyan-700 sm:w-auto"
              href="/materials"
            >
              Open Marketplace
            </Link>
          </div>
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
            {seedMaterials.slice(0, 6).map((material) => (
              <MaterialCard key={material.id} material={material} />
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white py-10">
        <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-6">
            <p className="text-sm font-black uppercase text-cyan-700">Supplier network</p>
            <h2 className="mt-2 text-3xl font-black text-slate-950">Verified Supplier Profiles</h2>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
            {seedSuppliers.map((supplier) => (
              <Link
                className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm transition hover:border-cyan-300 hover:bg-cyan-50"
                href={`/suppliers/${supplier.uid}`}
                key={supplier.uid}
              >
                <p className="font-black text-slate-950">{supplier.companyName}</p>
                <p className="mt-2 text-sm text-slate-600">
                  {supplier.city}, {supplier.state}
                </p>
                <p className="mt-3 text-sm font-bold text-cyan-700">
                  {supplier.rating} rating · {supplier.reviews} reviews
                </p>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}

function Icon({ path }: { path: string }) {
  return (
    <svg
      aria-hidden="true"
      className="h-5 w-5"
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

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
          className="absolute inset-0 h-full w-full object-cover"
          src={heroImage}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-white via-white/95 to-white/40" />
        <div className="relative mx-auto grid min-h-[520px] w-full max-w-7xl gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[0.78fr_0.7fr] lg:items-center lg:px-8">
          <div>
            <p className="text-sm font-black uppercase text-cyan-700">
              OLX-style construction material marketplace
            </p>
            <h1 className="mt-4 max-w-3xl text-4xl font-black leading-tight text-slate-950 sm:text-6xl">
              Buy cement, steel, sand, bricks, and site supplies near you.
            </h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-700">
              Compare nearby suppliers, sort by distance, call directly, and let suppliers post
              verified material stock with photos and GPS location.
            </p>

            <form
              action="/materials"
              className="mt-7 grid overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm sm:grid-cols-[minmax(0,1fr)_220px_auto]"
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
                className="bg-cyan-700 px-6 py-4 text-sm font-black text-white transition hover:bg-cyan-800"
                type="submit"
              >
                Search
              </button>
            </form>

            <div className="mt-5 flex flex-wrap items-center gap-3">
              <LocationButton />
              <Link
                className="rounded-md bg-slate-950 px-5 py-3 text-sm font-black text-white transition hover:bg-slate-800"
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
          <div className="mb-5 flex items-center justify-between gap-4">
            <h2 className="text-2xl font-black text-slate-950">Browse Categories</h2>
            <Link className="text-sm font-black text-cyan-700" href="/materials">
              View all
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-9">
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
              className="rounded-md border border-slate-300 px-4 py-2 text-sm font-black text-slate-800 transition hover:border-cyan-500 hover:text-cyan-700"
              href="/materials"
            >
              Open Marketplace
            </Link>
          </div>
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
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
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
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

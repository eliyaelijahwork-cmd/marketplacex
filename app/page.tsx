import Link from "next/link";
import LocationButton from "./components/LocationButton";
import MaterialCard from "./components/MaterialCard";
import CategoryBrowser from "./components/CategoryBrowser";
import { mainCategories } from "./data/directory";
import {
  categories,
  seedMaterials,
  seedSuppliers,
} from "./data/marketplace";

export default function Home() {
  return (
    <main className="bg-slate-50">
      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto grid w-full max-w-7xl grid-cols-1 px-4 py-4 sm:px-6 lg:items-center lg:px-8">
          <form action="/materials" className="grid overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm sm:grid-cols-[minmax(0,1fr)_minmax(10rem,14rem)] md:grid-cols-[minmax(0,1fr)_minmax(10rem,14rem)_auto]">
            <input className="min-w-0 px-4 py-4 text-sm text-slate-950 outline-none" name="q" placeholder="Search M-sand, 12mm TMT, OPC cement..." type="search" />
            <select className="border-t border-slate-200 bg-white px-4 py-4 text-sm font-bold text-slate-800 outline-none sm:border-l sm:border-t-0" defaultValue="all" name="category">
              <option value="all">All categories</option>
              {categories.map((category) => <option key={category.slug} value={category.slug}>{category.name}</option>)}
            </select>
            <button className="w-full bg-cyan-700 px-6 py-4 text-sm font-black text-white transition hover:bg-cyan-800 sm:w-auto" type="submit">Search</button>
          </form>
          <div className="mt-4 flex flex-col items-stretch gap-3 sm:flex-row sm:items-center">
            <LocationButton />
            <Link className="w-full rounded-md bg-slate-950 px-5 py-3 text-center text-sm font-black text-white transition hover:bg-slate-800 sm:w-auto" href="/login?redirect=/supplier-dashboard">Post Material</Link>
          </div>
        </div>
      </section>

      <section className="bg-white py-8">
        <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <h2 className="text-2xl font-black text-slate-950">Browse Categories</h2>
            <Link className="w-full text-sm font-black text-cyan-700 md:w-auto" href="/categories">View all categories</Link>
          </div>
          <CategoryBrowser categories={mainCategories} featured />
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

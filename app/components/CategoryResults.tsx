"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { DirectoryCategory, DirectorySubcategory } from "@/app/data/directory";
import type { MaterialListing } from "@/app/data/marketplace";
import MaterialCard from "./MaterialCard";

type Business = { id: string; companyName: string; description?: string; city?: string; state?: string; address?: string; logoUrl?: string };
type Service = { id: string; supplierId: string; title: string; description: string; businessName: string; city?: string };

export default function CategoryResults({ category, selectedPath = [] }: { category: DirectoryCategory; selectedPath?: string[] }) {
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [materials, setMaterials] = useState<MaterialListing[]>([]);
  const [query, setQuery] = useState("");
  const [location, setLocation] = useState("");
  const [sort, setSort] = useState("relevance");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    fetch(`/api/directory/${category.slug}`, { cache: "no-store" })
      .then((response) => response.ok ? response.json() : Promise.reject())
      .then((data) => {
        if (!active) return;
        setBusinesses(data.businesses ?? []);
        setMaterials(data.materials ?? []);
        setServices(data.services ?? []);
      })
      .catch(() => { if (active) { setBusinesses([]); setMaterials([]); setServices([]); } })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [category.slug]);

  const allSubcategories = useMemo(() => flatten(category.subcategories), [category]);
  const categoryIds = useMemo(() => new Set(allSubcategories.map((subcategory) => subcategory.id)), [allSubcategories]);
  let selected: DirectorySubcategory | undefined;
  let level = category.subcategories;
  for (const slug of selectedPath) {
    selected = level.find((subcategory) => subcategory.slug === slug);
    level = selected?.children ?? [];
  }
  const selectedText = selected?.name.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
  const filteredBusinesses = businesses.filter((business) =>
    `${business.companyName} ${business.description ?? ""} ${business.city ?? ""}`.toLowerCase().includes(query.toLowerCase()) &&
    (!location || `${business.city ?? ""} ${business.state ?? ""} ${business.address ?? ""}`.toLowerCase().includes(location.toLowerCase())));
  const filteredServices = services.filter((service) =>
    `${service.title} ${service.description} ${service.businessName}`.toLowerCase().includes(query.toLowerCase()) &&
    (!location || `${service.city ?? ""} ${service.businessName}`.toLowerCase().includes(location.toLowerCase())));
  const filteredMaterials = materials.filter((material) =>
    (categoryIds.has(material.category) || material.category === category.slug) &&
    (!selectedText || material.category === selected?.id || material.materialName.toLowerCase().replace(/[^a-z0-9]+/g, " ").includes(selectedText)) &&
    `${material.materialName} ${material.description} ${material.category}`.toLowerCase().includes(query.toLowerCase()) &&
    (!location || `${material.city} ${material.state} ${material.address}`.toLowerCase().includes(location.toLowerCase())))
    .sort((a, b) => sort === "newest" ? new Date(b.createdAt ?? 0).getTime() - new Date(a.createdAt ?? 0).getTime() : sort === "price-low" ? a.price - b.price : sort === "price-high" ? b.price - a.price : a.materialName.localeCompare(b.materialName));
  const visibleSubcategories = selected?.children ?? (!selectedPath.length ? category.subcategories : []);

  return <main className="mx-auto min-h-[70vh] w-full max-w-7xl px-4 py-9 sm:px-6 lg:px-8">
    <nav className="mb-5 flex flex-wrap gap-1 text-sm text-slate-500">
      <Link href="/categories" className="hover:text-cyan-800">Categories</Link> / <Link href={`/categories/${category.slug}`} className="hover:text-cyan-800">{category.name}</Link>
      {selectedPath.map((slug, index) => <span key={`${slug}-${index}`}> / {findName(category.subcategories, selectedPath.slice(0, index + 1))}</span>)}
    </nav>
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
      <span aria-hidden="true" className="text-4xl">{category.icon}</span>
      <p className="mt-3 text-sm font-black uppercase text-cyan-700">{category.subcategories.length} specialties</p>
      <h1 className="mt-1 text-3xl font-black text-slate-950">{selected?.name ?? category.name}</h1>
      <p className="mt-3 max-w-3xl text-slate-600">{selected?.description ?? category.description}</p>
    </section>
    {visibleSubcategories.length > 0 && <section className="mt-8">
      <h2 className="mb-4 text-xl font-black text-slate-950">Browse specialties</h2>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
        {visibleSubcategories.filter((subcategory) => subcategory.active).sort((a, b) => a.displayOrder - b.displayOrder).map((subcategory) =>
          <Link key={subcategory.id} href={`/categories/${category.slug}/${[...selectedPath, subcategory.slug].join("/")}`} className="rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-800 hover:border-cyan-400 hover:text-cyan-800">{subcategory.name}<span className="float-right" aria-hidden="true">→</span></Link>)}
      </div>
    </section>}
    <section className="mt-9">
      <h2 className="mb-4 text-xl font-black text-slate-950">Businesses, products & services</h2>
      <div className="mb-5 grid gap-3 rounded-xl border border-slate-200 bg-white p-4 sm:grid-cols-[1fr_1fr_auto]">
        <input aria-label="Search listings" className="rounded-md border border-slate-300 px-3 py-2" placeholder="Search this category" value={query} onChange={(event) => setQuery(event.target.value)} />
        <input aria-label="Filter by location" className="rounded-md border border-slate-300 px-3 py-2" placeholder="City or state" value={location} onChange={(event) => setLocation(event.target.value)} />
        <select aria-label="Sort listings" className="rounded-md border border-slate-300 px-3 py-2" value={sort} onChange={(event) => setSort(event.target.value)}><option value="relevance">Sort: relevance</option><option value="newest">Newest</option><option value="price-low">Price: low to high</option><option value="price-high">Price: high to low</option></select>
      </div>
      {loading ? <p className="rounded-lg bg-white p-8 text-center text-slate-600">Loading category listings…</p> : <>
        {filteredBusinesses.length > 0 && <div className="mb-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{filteredBusinesses.map((business) => <Link href={`/suppliers/${business.id}`} key={business.id} className="rounded-xl border border-slate-200 bg-white p-5 hover:border-cyan-300">{business.logoUrl && <img src={business.logoUrl} alt="" className="mb-3 h-12 w-12 rounded-md object-cover" />}<h3 className="font-black text-slate-950">{business.companyName}</h3><p className="mt-2 line-clamp-2 text-sm text-slate-600">{business.description}</p><p className="mt-3 text-sm font-semibold text-cyan-800">{business.city}{business.state ? `, ${business.state}` : ""}</p></Link>)}</div>}
        {filteredMaterials.length > 0 && <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{filteredMaterials.map((material) => <MaterialCard key={material.id} material={material} />)}</div>}
        {filteredServices.length > 0 && <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{filteredServices.map((service) => <article key={service.id} className="rounded-xl border border-slate-200 bg-white p-5"><h3 className="font-black text-slate-950">{service.title}</h3><p className="mt-2 text-sm text-slate-600">{service.description}</p><Link className="mt-3 inline-block text-sm font-bold text-cyan-800" href={`/suppliers/${service.supplierId}`}>{service.businessName} →</Link></article>)}</div>}
        {!filteredBusinesses.length && !filteredMaterials.length && !filteredServices.length && <p className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center text-slate-600">No matching listings yet. Business owners can <Link className="font-black text-cyan-800" href="/signup">register their business</Link> to appear here.</p>}
      </>}
    </section>
  </main>;
}

function flatten(rows: DirectorySubcategory[]): DirectorySubcategory[] {
  return rows.flatMap((row) => [row, ...flatten(row.children ?? [])]);
}
function findName(rows: DirectorySubcategory[], path: string[]): string {
  const current = rows.find((row) => row.slug === path[0]);
  return current ? path.length === 1 ? current.name : findName(current.children ?? [], path.slice(1)) : path.join(" / ");
}

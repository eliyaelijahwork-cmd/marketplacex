"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { DirectoryCategory } from "@/app/data/directory";

export default function CategoryBrowser({ categories, featured = false }: { categories: DirectoryCategory[]; featured?: boolean }) {
  const [allCategories, setAllCategories] = useState(categories);
  const [query, setQuery] = useState("");
  useEffect(() => {
    let active = true;
    fetch("/api/categories", { cache: "no-store" }).then((response) => response.ok ? response.json() : Promise.reject()).then((result) => { if (active && Array.isArray(result.data)) setAllCategories(result.data); }).catch(() => undefined);
    return () => { active = false; };
  }, []);
  const visible = useMemo(() => allCategories.filter((category) => `${category.name} ${category.description} ${category.subcategories.map((item) => item.name).join(" ")}`.toLowerCase().includes(query.trim().toLowerCase())), [allCategories, query]);
  const rows = featured && !query ? visible.slice(0, 12) : visible;
  return <>
    <label className="mb-5 flex items-center gap-3 rounded-lg border border-slate-200 bg-white px-4 py-3 shadow-sm">
      <span aria-hidden="true" className="text-cyan-700">⌕</span>
      <input aria-label="Search categories" className="w-full bg-transparent text-sm outline-none" onChange={(event) => setQuery(event.target.value)} placeholder="Search categories and subcategories" value={query} />
      {query && <button className="text-xs font-bold text-cyan-800" onClick={() => setQuery("")} type="button">Clear</button>}
    </label>
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
      {rows.map((category) => <article className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm transition hover:border-cyan-300 hover:shadow-md sm:p-4" key={category.id}>
        <Link className="group flex items-center gap-2" href={`/categories/${category.slug}`}>
          <span aria-hidden="true" className="grid h-8 w-8 shrink-0 place-items-center rounded-md bg-cyan-50 text-cyan-800"><CategoryIcon name={category.name} /></span>
          <strong className="min-w-0 text-sm font-black leading-5 text-slate-950 group-hover:text-cyan-800">{category.name}</strong>
        </Link>
        <ul className="mt-2 grid gap-1">
          {category.subcategories.slice(0, 4).map((item) => <li key={item.id}><Link className="block truncate text-xs text-slate-600 hover:text-cyan-800" href={`/categories/${category.slug}/${item.slug}`}>{item.name}</Link></li>)}
        </ul>
        <Link className="mt-2 inline-block text-xs font-bold text-cyan-800 hover:underline" href={`/categories/${category.slug}`}>View All →</Link>
      </article>)}
    </div>
    {!rows.length && <p className="rounded-lg border border-dashed border-slate-300 p-8 text-center text-slate-600">No categories match “{query}”.</p>}
    {featured && !query && allCategories.length > rows.length && <div className="mt-5 text-center"><Link className="inline-flex rounded-md border border-slate-300 px-5 py-2.5 text-sm font-black text-slate-800 transition hover:border-cyan-600 hover:text-cyan-800" href="/categories">View All Categories</Link></div>}
  </>;
}

function CategoryIcon({ name }: { name: string }) {
  const lower = name.toLowerCase();
  const path = lower.includes("sand") ? "M3 19 9 8l3 5 3-4 6 10H3Z" : lower.includes("brick") || lower.includes("block") ? "M3 5h8v6H3zm10 0h8v6h-8zM3 13h8v6H3zm10 0h8v6h-8z" : lower.includes("cement") || lower.includes("factory") ? "M3 20V9l6 3V8l6 4V5h6v15H3Z" : lower.includes("steel") ? "M5 3h3v18H5zm6 0h3v18h-3zm6 0h3v18h-3z" : lower.includes("elect") ? "M13 2 5 13h6l-1 9 9-12h-6l1-8Z" : lower.includes("plumb") ? "M12 3s7 8 7 12a7 7 0 1 1-14 0c0-4 7-12 7-12Z" : lower.includes("hardware") ? "M14 7a5 5 0 0 0-6-6L5 4l3 3-3 3-3-3-3 3a5 5 0 0 0 6 6l10 10 4-4L9 12" : lower.includes("tile") ? "M4 4h7v7H4zm9 0h7v7h-7zM4 13h7v7H4zm9 0h7v7h-7z" : lower.includes("paint") ? "M4 3h16v8H4zm3 8v10h10V11m-5 0v10" : lower.includes("construction") || lower.includes("contract") ? "M3 21h18M5 21V9l7-5 7 5v12M9 21v-7h6v7" : "M3 19 9 8l3 5 3-4 6 10H3Z";
  return <svg aria-hidden="true" className="h-5 w-5" fill="none" viewBox="0 0 24 24"><path d={path} stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" /></svg>;
}

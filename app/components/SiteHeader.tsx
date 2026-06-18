"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { categories } from "@/app/data/marketplace";
import { useAuth } from "@/app/contexts/AuthContext";
import BrandLogo from "./BrandLogo";
import LocationButton from "./LocationButton";

const topLinks = [
  { href: "/materials", label: "Marketplace" },
  { href: "/suppliers", label: "Suppliers" },
  { href: "/contact", label: "Help" },
];

export default function SiteHeader() {
  const pathname = usePathname();
  const { user, profile, logout } = useAuth();

  return (
    <header className="sticky top-0 z-40 bg-white shadow-sm">
      <div className="bg-[#06323f] text-white">
        <div className="mx-auto flex w-full max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-2 text-xs font-semibold sm:px-6 lg:px-8">
          <p>Construction materials near your project site</p>
          <nav className="flex flex-wrap items-center gap-4">
            {topLinks.map((item) => (
              <Link
                className="transition hover:text-cyan-200"
                href={item.href}
                key={item.href}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      </div>

      <div className="border-b border-slate-200">
        <div className="mx-auto grid w-full max-w-7xl gap-4 px-4 py-4 sm:px-6 lg:grid-cols-[auto_minmax(280px,1fr)_auto] lg:items-center lg:px-8">
          <BrandLogo />

          <form
            action="/materials"
            className="flex min-w-0 overflow-hidden rounded-md border border-cyan-200 bg-white shadow-sm focus-within:border-cyan-600 focus-within:ring-2 focus-within:ring-cyan-100"
          >
            <input
              className="min-w-0 flex-1 px-4 py-3 text-sm text-slate-900 outline-none"
              name="q"
              placeholder="Search cement, steel, bricks, sand..."
              type="search"
            />
            <select
              className="hidden border-l border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-800 outline-none sm:block"
              defaultValue="all"
              name="category"
            >
              <option value="all">All Categories</option>
              {categories.map((category) => (
                <option key={category.slug} value={category.slug}>
                  {category.name}
                </option>
              ))}
            </select>
            <button
              aria-label="Search materials"
              className="grid w-14 place-items-center bg-cyan-700 text-white transition hover:bg-cyan-800"
              type="submit"
            >
              <HeaderIcon path="m21 21-4.35-4.35M10.5 18a7.5 7.5 0 1 1 0-15 7.5 7.5 0 0 1 0 15Z" />
            </button>
          </form>

          <div className="flex flex-wrap items-center justify-between gap-2 lg:justify-end">
            <LocationButton compact />
            {user ? (
              <>
                <Link
                  className="inline-flex items-center gap-2 rounded-md bg-slate-950 px-3 py-2 text-sm font-bold text-white transition hover:bg-slate-800"
                  href="/supplier-dashboard"
                >
                  <HeaderIcon path="M4 13h6V4H4v9Zm10 7h6V4h-6v16ZM4 20h6v-3H4v3Z" />
                  Dashboard
                </Link>
                <button
                  className="rounded-md border border-slate-300 px-3 py-2 text-sm font-bold text-slate-700 transition hover:border-cyan-500 hover:text-cyan-700"
                  onClick={logout}
                  type="button"
                >
                  Logout
                </button>
              </>
            ) : (
              <Link
                className="inline-flex items-center gap-2 rounded-md bg-slate-950 px-3 py-2 text-sm font-bold text-white transition hover:bg-slate-800"
                href="/login"
              >
                <HeaderIcon path="M20 21a8 8 0 0 0-16 0M12 13a5 5 0 1 0 0-10 5 5 0 0 0 0 10Z" />
                Login
              </Link>
            )}
          </div>
        </div>
      </div>

      <nav className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex w-full max-w-7xl items-center gap-3 overflow-x-auto px-4 py-3 text-sm font-bold text-slate-900 sm:px-6 lg:px-8">
          <Link
            className={navClass(pathname === "/materials")}
            href="/materials"
          >
            <HeaderIcon path="M4 7h16M4 12h16M4 17h16" />
            All Materials
          </Link>
          {categories.map((category) => (
            <Link
              className="min-w-fit rounded-md px-3 py-2 transition hover:bg-cyan-50 hover:text-cyan-700"
              href={`/materials?category=${category.slug}`}
              key={category.slug}
            >
              {category.name}
            </Link>
          ))}
          <Link
            className="ml-auto min-w-fit rounded-md bg-red-600 px-4 py-2 text-white transition hover:bg-red-700"
            href={user ? "/supplier-dashboard" : "/login?redirect=/supplier-dashboard"}
          >
            Post Material
          </Link>
        </div>
      </nav>

      {user && profile && (
        <div className="border-b border-cyan-100 bg-cyan-50">
          <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-3 px-4 py-2 text-xs font-semibold text-cyan-900 sm:px-6 lg:px-8">
            <span className="truncate">
              Logged in as {profile.companyName || profile.supplierName || user.phoneNumber || user.email}
            </span>
            <Link className="shrink-0 underline" href="/supplier-dashboard">
              Manage profile
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}

function navClass(active: boolean) {
  return `flex min-w-fit items-center gap-2 rounded-md px-4 py-2 transition ${
    active ? "bg-cyan-700 text-white" : "bg-slate-100 text-slate-900 hover:bg-cyan-50 hover:text-cyan-700"
  }`;
}

function HeaderIcon({ path }: { path: string }) {
  return (
    <svg
      aria-hidden="true"
      className="h-5 w-5 shrink-0"
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

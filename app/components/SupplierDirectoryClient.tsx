"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  distanceInKm,
  formatDistance,
  getCategoryName,
  getTelUrl,
  getWhatsAppUrl,
  seedSuppliers,
  type Supplier,
} from "@/app/data/marketplace";
import { useLocation } from "@/app/contexts/LocationContext";
import { useMaterials } from "@/app/hooks/useMaterials";
import LocationButton from "./LocationButton";

export default function SupplierDirectoryClient() {
  const { location } = useLocation();
  const { materials, loading } = useMaterials();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [minRating, setMinRating] = useState("");

  const suppliers = useMemo(() => {
    const supplierMap = new Map<string, Supplier>();

    seedSuppliers.forEach((supplier) => supplierMap.set(supplier.uid, supplier));

    materials.forEach((material) => {
      if (!supplierMap.has(material.supplierId)) {
        supplierMap.set(material.supplierId, {
          uid: material.supplierId,
          id: material.supplierId,
          supplierName: material.supplierName,
          companyName: material.supplierCompanyName || material.supplierName,
          name: material.supplierCompanyName || material.supplierName,
          email: "",
          phoneNumber: material.supplierPhoneNumber,
          whatsappNumber: material.supplierWhatsappNumber,
          profilePhoto: material.supplierPhoto,
          address: material.address,
          city: material.city,
          state: material.state,
          latitude: material.latitude,
          longitude: material.longitude,
          description: "Verified MarketPlaceX supplier.",
          isVerified: material.supplierVerified,
          verificationStatus: material.supplierVerified ? "verified" : "pending",
          rating: material.supplierRating || 0,
          reviewCount: 0,
          location: `${material.city}, ${material.state}`,
          reviews: 0,
          specialties: [],
          imagePosition: "50% 50%",
        });
      }
    });

    const normalizedQuery = query.trim().toLowerCase();
    const listingCounts = new Map<string, number>();
    const categoriesBySupplier = new Map<string, Set<string>>();

    materials.forEach((material) => {
      listingCounts.set(material.supplierId, (listingCounts.get(material.supplierId) ?? 0) + 1);
      if (!categoriesBySupplier.has(material.supplierId)) {
        categoriesBySupplier.set(material.supplierId, new Set<string>());
      }
      categoriesBySupplier.get(material.supplierId)?.add(material.category);
    });

    return [...supplierMap.values()]
      .map((supplier) => ({
        ...supplier,
        reviews: Math.max(supplier.reviews, listingCounts.get(supplier.uid) ?? 0),
        specialties:
          categoriesBySupplier.has(supplier.uid)
            ? [...(categoriesBySupplier.get(supplier.uid) ?? new Set<string>())].map(getCategoryName)
            : supplier.specialties,
      }))
      .filter((supplier) => {
        const queryMatches =
          !normalizedQuery ||
          supplier.companyName.toLowerCase().includes(normalizedQuery) ||
          supplier.supplierName.toLowerCase().includes(normalizedQuery) ||
          supplier.city.toLowerCase().includes(normalizedQuery) ||
          supplier.specialties.some((specialty) =>
            specialty.toLowerCase().includes(normalizedQuery),
          );
        const categoryMatches =
          category === "all" ||
          supplier.specialties.some(
            (specialty) => specialty.toLowerCase() === getCategoryName(category).toLowerCase(),
          ) ||
          materials.some(
            (material) => material.supplierId === supplier.uid && material.category === category,
          );
        const minRatingNumber = Number(minRating);
        const ratingMatches =
          !Number.isFinite(minRatingNumber) ||
          minRatingNumber <= 0 ||
          supplier.rating >= minRatingNumber;

        return queryMatches && categoryMatches && ratingMatches;
      })
      .sort((a, b) => {
        if (!location) {
          return b.reviews - a.reviews;
        }
        return distanceInKm(location, a) - distanceInKm(location, b);
      });
  }, [category, location, materials, minRating, query]);

  return (
    <main className="bg-slate-50">
      <section className="border-b border-slate-200 bg-white py-10">
        <div className="mx-auto grid w-full max-w-7xl gap-6 px-4 sm:px-6 lg:grid-cols-[1fr_auto] lg:items-end lg:px-8">
          <div>
            <p className="text-sm font-black uppercase text-cyan-700">Nearby suppliers</p>
            <h1 className="mt-3 text-4xl font-black text-slate-950">
              Find Construction Material Suppliers
            </h1>
            <p className="mt-4 max-w-3xl text-lg leading-8 text-slate-600">
              Browse supplier profiles, active categories, phone numbers, WhatsApp contacts, and
              site distance.
            </p>
          </div>
          <LocationButton />
        </div>
      </section>

      <section className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6 grid gap-3 rounded-lg border border-slate-200 bg-white p-4 shadow-sm md:grid-cols-[1fr_220px_180px_auto]">
          <input
            className="rounded-md border border-slate-300 px-3 py-2.5 outline-none transition focus:border-cyan-600 focus:ring-2 focus:ring-cyan-100"
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search supplier, city, or specialty"
            type="search"
            value={query}
          />
          <select
            className="rounded-md border border-slate-300 bg-white px-3 py-2.5 font-semibold outline-none transition focus:border-cyan-600 focus:ring-2 focus:ring-cyan-100"
            onChange={(event) => setCategory(event.target.value)}
            value={category}
          >
            <option value="all">All categories</option>
            {[
              "aggregates",
              "sand",
              "bricks-blocks",
              "cement",
              "steel",
              "electrical-materials",
              "hardware-materials",
              "plumbing-materials",
              "plywood-wood",
            ].map((slug) => (
              <option key={slug} value={slug}>
                {getCategoryName(slug)}
              </option>
            ))}
          </select>
          <select
            className="rounded-md border border-slate-300 bg-white px-3 py-2.5 font-semibold outline-none transition focus:border-cyan-600 focus:ring-2 focus:ring-cyan-100"
            onChange={(event) => setMinRating(event.target.value)}
            value={minRating}
          >
            <option value="">Any rating</option>
            <option value="4.5">4.5+ stars</option>
            <option value="4">4+ stars</option>
            <option value="3">3+ stars</option>
          </select>
          <Link
            className="rounded-md bg-cyan-700 px-5 py-3 text-center font-black text-white transition hover:bg-cyan-800"
            href="/login?redirect=/supplier-dashboard"
          >
            Join as supplier
          </Link>
        </div>

        {loading ? (
          <SupplierSkeleton />
        ) : suppliers.length ? (
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {suppliers.map((supplier) => {
              const distance = location ? distanceInKm(location, supplier) : undefined;

              return (
                <article
                  className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm transition hover:border-cyan-300 hover:shadow-md"
                  key={supplier.uid}
                >
                  <div className="flex items-start gap-4">
                    <img
                      alt={`${supplier.companyName} profile`}
                      className="h-16 w-16 rounded-lg object-cover"
                      src={supplier.profilePhoto || "/assets/construction-marketplace-hero.png"}
                    />
                    <div className="min-w-0">
                      <Link href={`/suppliers/${supplier.uid}`}>
                        <h2 className="truncate text-xl font-black text-slate-950 transition hover:text-cyan-700">
                          {supplier.companyName}
                        </h2>
                      </Link>
                      {supplier.isVerified && (
                        <span className="mt-2 inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-0.5 text-xs font-black text-emerald-700">
                          <Icon path="m5 12 4 4L19 6" />
                          Verified
                        </span>
                      )}
                      <p className="mt-1 text-sm text-slate-600">
                        {supplier.city}, {supplier.state} · {formatDistance(distance)}
                      </p>
                      <p className="mt-2 text-sm font-bold text-cyan-700">
                        {supplier.rating.toFixed(1)} rating · {supplier.reviews} active signals
                      </p>
                    </div>
                  </div>

                  <p className="mt-4 line-clamp-2 min-h-12 text-sm leading-6 text-slate-600">
                    {supplier.description}
                  </p>

                  <div className="mt-4 flex flex-wrap gap-2">
                    {supplier.specialties.slice(0, 4).map((specialty) => (
                      <span
                        className="rounded-md bg-cyan-50 px-2.5 py-1 text-xs font-bold text-cyan-800"
                        key={specialty}
                      >
                        {specialty}
                      </span>
                    ))}
                  </div>

                  <div className="mt-5 grid grid-cols-3 gap-2">
                    <a
                      className="rounded-md bg-emerald-600 px-3 py-2 text-center text-sm font-black text-white transition hover:bg-emerald-700"
                      href={getTelUrl(supplier.phoneNumber)}
                    >
                      Call
                    </a>
                    <a
                      className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-center text-sm font-black text-emerald-800 transition hover:bg-emerald-100"
                      href={getWhatsAppUrl(supplier.whatsappNumber)}
                      rel="noreferrer"
                      target="_blank"
                    >
                      WhatsApp
                    </a>
                    <Link
                      className="rounded-md border border-slate-300 px-3 py-2 text-center text-sm font-black text-slate-800 transition hover:border-cyan-500 hover:text-cyan-700"
                      href={`/suppliers/${supplier.uid}`}
                    >
                      Profile
                    </Link>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="rounded-lg border border-slate-200 bg-white p-10 text-center shadow-sm">
            <h2 className="text-2xl font-black text-slate-950">No suppliers found</h2>
            <p className="mt-3 text-slate-600">Try another category or search term.</p>
          </div>
        )}
      </section>
    </main>
  );
}

function Icon({ path }: { path: string }) {
  return (
    <svg
      aria-hidden="true"
      className="h-4 w-4"
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

function SupplierSkeleton() {
  return (
    <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: 6 }).map((_, index) => (
        <div className="h-64 animate-pulse rounded-lg bg-slate-200" key={index} />
      ))}
    </div>
  );
}

"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  defaultMaterialImage,
  formatDistance,
  getSupplierFromMaterials,
  getTelUrl,
  getWhatsAppUrl,
  seedSuppliers,
  type Supplier,
  type SupplierProfile,
} from "@/app/data/marketplace";
import { useLocation } from "@/app/contexts/LocationContext";
import { distanceInKm } from "@/app/data/marketplace";
import { useMaterials } from "@/app/hooks/useMaterials";
import { listenToUserProfile } from "@/app/lib/firebase/marketplace";
import MaterialCard from "./MaterialCard";
import LocationButton from "./LocationButton";

type SupplierProfileClientProps = {
  supplierId: string;
};

export default function SupplierProfileClient({ supplierId }: SupplierProfileClientProps) {
  const { location } = useLocation();
  const { materials, loading } = useMaterials();
  const [liveProfile, setLiveProfile] = useState<SupplierProfile | null>(null);

  useEffect(() => {
    return listenToUserProfile(supplierId, setLiveProfile);
  }, [supplierId]);

  const supplierMaterials = materials.filter((material) => material.supplierId === supplierId);
  const supplier = useMemo(
    () =>
      liveProfile
        ? profileToSupplier(liveProfile, supplierMaterials.length)
        : getSupplierFromMaterials(supplierId, materials) ??
          seedSuppliers.find((item) => item.uid === supplierId),
    [liveProfile, materials, supplierId, supplierMaterials.length],
  );

  if (loading && !supplier) {
    return <SupplierSkeleton />;
  }

  if (!supplier) {
    return (
      <main className="mx-auto grid min-h-[60vh] w-full max-w-4xl place-items-center px-4 py-16 text-center sm:px-6 lg:px-8">
        <div className="rounded-lg border border-slate-200 bg-white p-10 shadow-sm">
          <h1 className="text-3xl font-black text-slate-950">Supplier not found</h1>
          <p className="mt-3 text-slate-600">This supplier profile is not public yet.</p>
          <Link
            className="mt-6 inline-flex rounded-md bg-cyan-700 px-5 py-3 font-black text-white"
            href="/materials"
          >
            Browse materials
          </Link>
        </div>
      </main>
    );
  }

  const distance = location ? distanceInKm(location, supplier) : undefined;

  return (
    <main className="bg-slate-50">
      <section className="border-b border-slate-200 bg-white py-10">
        <div className="mx-auto grid w-full max-w-7xl gap-8 px-4 sm:px-6 lg:grid-cols-[1fr_0.75fr] lg:px-8">
          <div>
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
              <img
                alt={`${supplier.companyName} profile`}
                className="h-24 w-24 rounded-lg border border-slate-200 object-cover"
                src={supplier.profilePhoto || defaultMaterialImage}
              />
              <div>
                <p className="text-sm font-black uppercase text-cyan-700">Supplier profile</p>
                <h1 className="mt-2 text-4xl font-black text-slate-950">{supplier.companyName}</h1>
                {supplier.isVerified && (
                  <span className="mt-3 inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2.5 py-1 text-sm font-black text-emerald-700">
                    <Icon path="m5 12 4 4L19 6" />
                    Verified supplier
                  </span>
                )}
                <p className="mt-2 text-lg text-slate-600">
                  {supplier.city}, {supplier.state} · {formatDistance(distance)}
                </p>
                <p className="mt-2 text-sm font-black text-cyan-700">
                  {supplier.rating.toFixed(1)} rating · {supplier.reviewCount} reviews
                </p>
              </div>
            </div>
            <p className="mt-6 max-w-3xl text-lg leading-8 text-slate-700">
              {supplier.description || "Verified MarketPlaceX supplier."}
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              {supplier.specialties.map((specialty) => (
                <span
                  className="rounded-md bg-cyan-50 px-3 py-1.5 text-sm font-bold text-cyan-800"
                  key={specialty}
                >
                  {specialty}
                </span>
              ))}
            </div>
          </div>

          <aside className="grid gap-4 rounded-lg border border-slate-200 bg-slate-50 p-5">
            <LocationButton />
            <div>
              <p className="text-sm font-black text-slate-950">Contact</p>
              <p className="mt-1 text-slate-600">{supplier.supplierName}</p>
              <p className="mt-1 font-bold text-cyan-700">{supplier.phoneNumber}</p>
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              <a
                className="rounded-md bg-emerald-600 px-4 py-3 text-center font-black text-white transition hover:bg-emerald-700"
                href={getTelUrl(supplier.phoneNumber)}
              >
                Call Now
              </a>
              <a
                className="rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-center font-black text-emerald-800 transition hover:bg-emerald-100"
                href={getWhatsAppUrl(supplier.whatsappNumber)}
                rel="noreferrer"
                target="_blank"
              >
                WhatsApp
              </a>
            </div>
          </aside>
        </div>
      </section>

      <section className="py-10">
        <div className="mx-auto grid w-full max-w-7xl gap-6 px-4 sm:px-6 lg:grid-cols-[0.8fr_1fr] lg:px-8">
          <article className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-2xl font-black text-slate-950">Address</h2>
            <p className="mt-3 leading-7 text-slate-700">{supplier.address}</p>
            <p className="mt-4 text-sm font-bold text-slate-500">
              GPS: {supplier.latitude.toFixed(5)}, {supplier.longitude.toFixed(5)}
            </p>
          </article>
          <article className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
            <iframe
              className="h-72 w-full"
              loading="lazy"
              src={`https://www.google.com/maps?q=${supplier.latitude},${supplier.longitude}&output=embed`}
              title={`${supplier.companyName} location map`}
            />
          </article>
        </div>
      </section>

      <section className="bg-white py-10">
        <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-6 flex items-end justify-between gap-4">
            <div>
              <p className="text-sm font-black uppercase text-cyan-700">Supplier listings</p>
              <h2 className="mt-2 text-3xl font-black text-slate-950">Materials Posted</h2>
            </div>
            <Link className="text-sm font-black text-cyan-700" href="/materials">
              View marketplace
            </Link>
          </div>
          {supplierMaterials.length ? (
            <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {supplierMaterials.map((material) => (
                <MaterialCard key={material.id} material={material} />
              ))}
            </div>
          ) : (
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-8 text-center text-slate-600">
              No active listings from this supplier yet.
            </div>
          )}
        </div>
      </section>
    </main>
  );
}

function profileToSupplier(profile: SupplierProfile, listingCount: number): Supplier {
  return {
    ...profile,
    id: profile.uid,
    name: profile.companyName || profile.supplierName,
    location: `${profile.city}, ${profile.state}`,
    rating: 4.4,
    reviews: listingCount,
    specialties: ["Construction Materials"],
    imagePosition: "50% 50%",
  };
}

function SupplierSkeleton() {
  return (
    <main className="mx-auto grid w-full max-w-7xl gap-8 px-4 py-10 sm:px-6 lg:px-8">
      <div className="h-44 animate-pulse rounded-lg bg-slate-200" />
      <div className="grid gap-5 md:grid-cols-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <div className="h-80 animate-pulse rounded-lg bg-slate-200" key={index} />
        ))}
      </div>
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

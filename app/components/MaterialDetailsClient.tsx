"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useLocation } from "@/app/contexts/LocationContext";
import {
  defaultMaterialImage,
  distanceInKm,
  formatCurrency,
  formatDate,
  formatDistance,
  getCategoryName,
  getMaterial,
  getTelUrl,
  getWhatsAppUrl,
} from "@/app/data/marketplace";
import { useMaterials } from "@/app/hooks/useMaterials";
import MaterialCard from "./MaterialCard";

type MaterialDetailsClientProps = {
  materialId: string;
};

export default function MaterialDetailsClient({ materialId }: MaterialDetailsClientProps) {
  const { location } = useLocation();
  const { materials, loading } = useMaterials();
  const material = useMemo(
    () => getMaterial(materialId, materials),
    [materialId, materials],
  );
  const [activeImage, setActiveImage] = useState(0);

  if (loading && !material) {
    return <DetailsSkeleton />;
  }

  if (!material) {
    return (
      <main className="mx-auto grid min-h-[60vh] w-full max-w-4xl place-items-center px-4 py-16 text-center sm:px-6 lg:px-8">
        <div className="rounded-lg border border-slate-200 bg-white p-10 shadow-sm">
          <h1 className="text-3xl font-black text-slate-950">Material not found</h1>
          <p className="mt-3 text-slate-600">The listing may have been deleted by its supplier.</p>
          <Link
            className="mt-6 inline-flex rounded-md bg-cyan-700 px-5 py-3 font-black text-white"
            href="/materials"
          >
            Back to marketplace
          </Link>
        </div>
      </main>
    );
  }

  const images = material.images.length ? material.images : [defaultMaterialImage];
  const distance = location ? distanceInKm(location, material) : undefined;
  const similarMaterials = materials
    .filter((item) => item.category === material.category && item.id !== material.id)
    .slice(0, 3);

  return (
    <main className="bg-slate-50">
      <section className="bg-white py-10">
        <div className="mx-auto grid w-full max-w-7xl gap-8 px-4 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:px-8">
          <div>
            <div className="overflow-hidden rounded-lg border border-slate-200 bg-slate-100">
              <img
                alt={`${material.materialName} gallery image`}
                className="aspect-[4/3] w-full object-cover"
                src={images[activeImage]}
              />
            </div>
            <div className="mt-3 grid grid-cols-5 gap-2 sm:grid-cols-8">
              {images.map((image, index) => (
                <button
                  aria-label={`View image ${index + 1}`}
                  className={`overflow-hidden rounded-md border ${
                    activeImage === index ? "border-cyan-600" : "border-slate-200"
                  }`}
                  key={`${image}-${index}`}
                  onClick={() => setActiveImage(index)}
                  type="button"
                >
                  <img
                    alt=""
                    className="aspect-square w-full object-cover"
                    src={image}
                  />
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col">
            <p className="text-sm font-black uppercase text-cyan-700">
              {getCategoryName(material.category)}
            </p>
            <h1 className="mt-3 text-4xl font-black leading-tight text-slate-950">
              {material.materialName}
            </h1>
            <div className="mt-4 flex flex-wrap items-end gap-x-4 gap-y-2">
              <p className="text-4xl font-black text-cyan-700">
                {formatCurrency(material.price)}
              </p>
              <p className="pb-1 text-lg font-bold text-slate-500">/ {material.unit}</p>
              <p className="pb-1 text-lg font-bold text-emerald-700">{material.quantity}</p>
            </div>
            <p className="mt-5 text-lg leading-8 text-slate-700">{material.description}</p>

            <div className="mt-6 grid gap-3 rounded-lg border border-slate-200 bg-slate-50 p-5">
              <InfoRow
                icon="M12 21s7-4.35 7-11a7 7 0 1 0-14 0c0 6.65 7 11 7 11Zm0-8a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z"
                label="Location"
                value={`${material.address} · ${formatDistance(distance)}`}
              />
              <InfoRow
                icon="M8 7V3m8 4V3M5 11h14M7 21h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2Z"
                label="Posted"
                value={formatDate(material.createdAt)}
              />
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              <a
                className="inline-flex items-center justify-center gap-2 rounded-md bg-emerald-600 px-5 py-3 font-black text-white transition hover:bg-emerald-700"
                href={getTelUrl(material.supplierPhoneNumber)}
              >
                <Icon path="M22 16.92v3a2 2 0 0 1-2.18 2 19.8 19.8 0 0 1-8.63-3.07A19.5 19.5 0 0 1 3.16 10.8 19.8 19.8 0 0 1 .09 2.18 2 2 0 0 1 2.06 0h3a2 2 0 0 1 2 1.72c.13 1 .36 1.96.7 2.88a2 2 0 0 1-.45 2.11L6.1 7.9a16 16 0 0 0 6 6l1.19-1.19a2 2 0 0 1 2.11-.45c.92.34 1.88.57 2.88.7A2 2 0 0 1 22 16.92Z" />
                Call Now
              </a>
              <a
                className="inline-flex items-center justify-center gap-2 rounded-md border border-emerald-200 bg-emerald-50 px-5 py-3 font-black text-emerald-800 transition hover:bg-emerald-100"
                href={getWhatsAppUrl(material.supplierWhatsappNumber)}
                rel="noreferrer"
                target="_blank"
              >
                <Icon path="M20 11.5a8 8 0 0 1-11.8 7L4 20l1.5-4.1A8 8 0 1 1 20 11.5ZM9 8.5c.2 3 2.5 5.3 5.5 5.5l1-1.5-2-.8-.8.7c-1.1-.5-1.9-1.3-2.4-2.4l.7-.8-.8-2-1.2 1.3Z" />
                WhatsApp
              </a>
              <Link
                className="inline-flex items-center justify-center rounded-md border border-slate-300 px-5 py-3 font-black text-slate-800 transition hover:border-cyan-500 hover:text-cyan-700"
                href={`/suppliers/${material.supplierId}`}
              >
                Supplier Profile
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="py-10">
        <div className="mx-auto grid w-full max-w-7xl gap-6 px-4 sm:px-6 lg:grid-cols-[0.75fr_1fr] lg:px-8">
          <article className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-sm font-black uppercase text-cyan-700">Supplier profile</p>
            <div className="mt-4 flex items-start gap-4">
              <img
                alt={`${material.supplierName} profile`}
                className="h-16 w-16 rounded-lg object-cover"
                src={material.supplierPhoto || defaultMaterialImage}
              />
              <div>
                <h2 className="text-2xl font-black text-slate-950">
                  {material.supplierCompanyName || material.supplierName}
                </h2>
                {material.supplierVerified && (
                  <span className="mt-2 inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-0.5 text-xs font-black text-emerald-700">
                    <Icon path="m5 12 4 4L19 6" />
                    Verified supplier
                  </span>
                )}
                <p className="mt-1 text-slate-600">{material.supplierName}</p>
                <p className="mt-2 font-bold text-cyan-700">{material.supplierPhoneNumber}</p>
                <p className="mt-1 text-sm font-bold text-amber-700">
                  {material.supplierRating.toFixed(1)} supplier rating
                </p>
              </div>
            </div>
          </article>

          <article className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
            <iframe
              className="h-80 w-full"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              src={`https://www.google.com/maps?q=${material.latitude},${material.longitude}&output=embed`}
              title={`${material.materialName} supplier location map`}
            />
          </article>
        </div>
      </section>

      {similarMaterials.length > 0 && (
        <section className="bg-white py-10">
          <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-black text-slate-950">Similar Materials</h2>
            <div className="mt-6 grid gap-5 md:grid-cols-3">
              {similarMaterials.map((item) => (
                <MaterialCard compact key={item.id} material={item} />
              ))}
            </div>
          </div>
        </section>
      )}
    </main>
  );
}

function InfoRow({
  icon,
  label,
  value,
}: {
  icon: string;
  label: string;
  value: string;
}) {
  return (
    <div className="flex gap-3 text-sm">
      <span className="mt-0.5 text-cyan-700">
        <Icon path={icon} />
      </span>
      <div>
        <p className="font-black text-slate-950">{label}</p>
        <p className="mt-1 leading-6 text-slate-600">{value}</p>
      </div>
    </div>
  );
}

function DetailsSkeleton() {
  return (
    <main className="mx-auto grid w-full max-w-7xl gap-8 px-4 py-10 sm:px-6 lg:grid-cols-2 lg:px-8">
      <div className="aspect-[4/3] animate-pulse rounded-lg bg-slate-200" />
      <div className="grid content-start gap-4">
        <div className="h-5 w-32 animate-pulse rounded bg-slate-200" />
        <div className="h-12 w-3/4 animate-pulse rounded bg-slate-200" />
        <div className="h-8 w-48 animate-pulse rounded bg-slate-200" />
        <div className="h-32 animate-pulse rounded bg-slate-200" />
      </div>
    </main>
  );
}

function Icon({ path }: { path: string }) {
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

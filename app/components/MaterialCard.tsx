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
  getTelUrl,
  getWhatsAppUrl,
  type MaterialListing,
} from "@/app/data/marketplace";

type MaterialCardProps = {
  material: MaterialListing;
  compact?: boolean;
};

export default function MaterialCard({ material, compact = false }: MaterialCardProps) {
  const { location } = useLocation();
  const images = material.images.length ? material.images : [defaultMaterialImage];
  const [imageIndex, setImageIndex] = useState(0);
  const distance = useMemo(
    () => (location ? distanceInKm(location, material) : undefined),
    [location, material],
  );

  function nextImage() {
    setImageIndex((current) => (current + 1) % images.length);
  }

  function previousImage() {
    setImageIndex((current) => (current - 1 + images.length) % images.length);
  }

  return (
    <article className="max-w-full overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm transition hover:border-cyan-300 hover:shadow-md">
      <div className="relative aspect-[4/3] bg-slate-100">
        <img
          alt={`${material.materialName} construction material`}
          className="h-full w-full max-w-full object-cover"
          src={images[imageIndex]}
        />
        <div className="absolute left-3 top-3 rounded-md bg-white/95 px-2.5 py-1 text-xs font-bold text-slate-950 shadow-sm">
          {getCategoryName(material.category)}
        </div>
        {images.length > 1 && (
          <div className="absolute inset-x-3 top-1/2 flex -translate-y-1/2 justify-between">
            <button
              aria-label="Previous image"
              className="grid h-9 w-9 place-items-center rounded-full bg-white/90 text-slate-900 shadow-sm transition hover:bg-white"
              onClick={previousImage}
              type="button"
            >
              <Icon path="m15 18-6-6 6-6" />
            </button>
            <button
              aria-label="Next image"
              className="grid h-9 w-9 place-items-center rounded-full bg-white/90 text-slate-900 shadow-sm transition hover:bg-white"
              onClick={nextImage}
              type="button"
            >
              <Icon path="m9 18 6-6-6-6" />
            </button>
          </div>
        )}
        <div className="absolute bottom-3 right-3 rounded-md bg-slate-950/80 px-2 py-1 text-xs font-semibold text-white">
          {imageIndex + 1}/{images.length}
        </div>
      </div>

      <div className="grid gap-4 p-4">
        <div>
          <Link href={`/materials/${material.id}`}>
            <h3 className="line-clamp-2 text-lg font-bold leading-6 text-slate-950 transition hover:text-cyan-700">
              {material.materialName}
            </h3>
          </Link>
          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1">
            <p className="text-xl font-black text-cyan-700">
              {formatCurrency(material.price)}
              <span className="text-sm font-semibold text-slate-500"> / {material.unit}</span>
            </p>
            <p className="text-sm font-semibold text-emerald-700">{material.quantity}</p>
          </div>
        </div>

        <div className="grid gap-2 text-sm text-slate-600">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-bold text-slate-900">{material.supplierName}</p>
            {material.supplierVerified && <VerifiedBadge />}
            <span className="rounded-md bg-amber-50 px-2 py-0.5 text-xs font-black text-amber-700">
              {material.supplierRating.toFixed(1)}
            </span>
          </div>
          <p className="flex items-start gap-2">
            <Icon path="M12 21s7-4.35 7-11a7 7 0 1 0-14 0c0 6.65 7 11 7 11Zm0-8a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" />
            <span>
              {material.city}, {material.state} · {formatDistance(distance)}
            </span>
          </p>
          {!compact && (
            <p className="flex items-center gap-2">
              <Icon path="M8 7V3m8 4V3M5 11h14M7 21h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2Z" />
              Posted {formatDate(material.createdAt)}
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
          <a
            className="inline-flex w-full items-center justify-center gap-1 rounded-md bg-emerald-600 px-3 py-2 text-sm font-bold text-white transition hover:bg-emerald-700"
            href={getTelUrl(material.supplierPhoneNumber)}
          >
            <Icon path="M22 16.92v3a2 2 0 0 1-2.18 2 19.8 19.8 0 0 1-8.63-3.07A19.5 19.5 0 0 1 3.16 10.8 19.8 19.8 0 0 1 .09 2.18 2 2 0 0 1 2.06 0h3a2 2 0 0 1 2 1.72c.13 1 .36 1.96.7 2.88a2 2 0 0 1-.45 2.11L6.1 7.9a16 16 0 0 0 6 6l1.19-1.19a2 2 0 0 1 2.11-.45c.92.34 1.88.57 2.88.7A2 2 0 0 1 22 16.92Z" />
            Call
          </a>
          <a
            className="inline-flex w-full items-center justify-center gap-1 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-bold text-emerald-800 transition hover:bg-emerald-100"
            href={getWhatsAppUrl(material.supplierWhatsappNumber)}
            rel="noreferrer"
            target="_blank"
          >
            <Icon path="M20 11.5a8 8 0 0 1-11.8 7L4 20l1.5-4.1A8 8 0 1 1 20 11.5ZM9 8.5c.2 3 2.5 5.3 5.5 5.5l1-1.5-2-.8-.8.7c-1.1-.5-1.9-1.3-2.4-2.4l.7-.8-.8-2-1.2 1.3Z" />
            WhatsApp
          </a>
          <Link
            className="inline-flex w-full items-center justify-center rounded-md border border-slate-300 px-3 py-2 text-sm font-bold text-slate-800 transition hover:border-cyan-500 hover:text-cyan-700"
            href={`/materials/${material.id}`}
          >
            Details
          </Link>
        </div>
      </div>
    </article>
  );
}

function VerifiedBadge() {
  return (
    <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-0.5 text-xs font-black text-emerald-700">
      <Icon path="m5 12 4 4L19 6" />
      Verified
    </span>
  );
}

function Icon({ path }: { path: string }) {
  return (
    <svg
      aria-hidden="true"
      className="h-4 w-4 shrink-0"
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

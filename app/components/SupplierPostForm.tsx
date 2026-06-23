"use client";

import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import type { Category } from "../data/marketplace";
import { formatCurrency } from "../data/marketplace";

type SupplierPostFormProps = {
  categories: Pick<Category, "name" | "slug">[];
};

type PostedListing = {
  id: string;
  supplierName: string;
  materialName: string;
  categorySlug: string;
  price: number;
  unit: string;
  quantity: string;
  location: string;
  delivery: string;
  notes: string;
};

const storageKey = "marketplacex-supplier-listings";
const units = ["Ton", "Bag", "Piece", "Kg", "Meter", "Sheet", "Box", "Unit"];
const deliveryOptions = ["Same day", "24 hours", "2-3 days", "Supplier pickup"];

export default function SupplierPostForm({ categories }: SupplierPostFormProps) {
  const [listings, setListings] = useState<PostedListing[]>([]);
  const [status, setStatus] = useState("");

  const categoryNames = useMemo(
    () => new Map(categories.map((category) => [category.slug, category.name])),
    [categories],
  );

  useEffect(() => {
    window.setTimeout(() => {
      try {
        const savedListings = window.localStorage.getItem(storageKey);
        if (savedListings) {
          setListings(JSON.parse(savedListings) as PostedListing[]);
        }
      } catch {
        setListings([]);
      }
    }, 0);
  }, []);

  function saveListings(nextListings: PostedListing[]) {
    setListings(nextListings);
    window.localStorage.setItem(storageKey, JSON.stringify(nextListings));
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);

    const listing: PostedListing = {
      id: String(Date.now()),
      supplierName: String(formData.get("supplierName") ?? "").trim(),
      materialName: String(formData.get("materialName") ?? "").trim(),
      categorySlug: String(formData.get("categorySlug") ?? categories[0]?.slug),
      price: Number(formData.get("price") ?? 0),
      unit: String(formData.get("unit") ?? "Unit"),
      quantity: String(formData.get("quantity") ?? "").trim(),
      location: String(formData.get("location") ?? "").trim(),
      delivery: String(formData.get("delivery") ?? deliveryOptions[0]),
      notes: String(formData.get("notes") ?? "").trim(),
    };

    const nextListings = [listing, ...listings].slice(0, 3);
    saveListings(nextListings);
    setStatus(`${listing.materialName} posted for buyer review.`);
    form.reset();
  }

  return (
    <div className="grid max-w-full grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.8fr)]">
      <form
        className="max-w-full rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:p-6 lg:p-8"
        onSubmit={handleSubmit}
      >
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <label className="grid gap-2 text-sm font-semibold text-slate-800">
            Supplier name
            <input
              className="w-full min-w-0 rounded-md border border-slate-300 px-3 py-2.5 font-normal outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
              name="supplierName"
              placeholder="Your company name"
              required
            />
          </label>
          <label className="grid gap-2 text-sm font-semibold text-slate-800">
            Material name
            <input
              className="w-full min-w-0 rounded-md border border-slate-300 px-3 py-2.5 font-normal outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
              name="materialName"
              placeholder="Example: Red Bricks"
              required
            />
          </label>
          <label className="grid gap-2 text-sm font-semibold text-slate-800">
            Category
            <select
              className="w-full min-w-0 rounded-md border border-slate-300 bg-white px-3 py-2.5 font-normal outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
              name="categorySlug"
              required
            >
              {categories.map((category) => (
                <option key={category.slug} value={category.slug}>
                  {category.name}
                </option>
              ))}
            </select>
          </label>
          <label className="grid gap-2 text-sm font-semibold text-slate-800">
            Price
            <input
              className="w-full min-w-0 rounded-md border border-slate-300 px-3 py-2.5 font-normal outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
              min="1"
              name="price"
              placeholder="1250"
              required
              type="number"
            />
          </label>
          <label className="grid gap-2 text-sm font-semibold text-slate-800">
            Unit
            <select
              className="w-full min-w-0 rounded-md border border-slate-300 bg-white px-3 py-2.5 font-normal outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
              name="unit"
              required
            >
              {units.map((unit) => (
                <option key={unit} value={unit}>
                  {unit}
                </option>
              ))}
            </select>
          </label>
          <label className="grid gap-2 text-sm font-semibold text-slate-800">
            Quantity available
            <input
              className="w-full min-w-0 rounded-md border border-slate-300 px-3 py-2.5 font-normal outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
              name="quantity"
              placeholder="100 tons"
              required
            />
          </label>
          <label className="grid gap-2 text-sm font-semibold text-slate-800">
            Location
            <input
              className="w-full min-w-0 rounded-md border border-slate-300 px-3 py-2.5 font-normal outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
              name="location"
              placeholder="Chennai"
              required
            />
          </label>
          <label className="grid gap-2 text-sm font-semibold text-slate-800">
            Delivery
            <select
              className="w-full min-w-0 rounded-md border border-slate-300 bg-white px-3 py-2.5 font-normal outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
              name="delivery"
              required
            >
              {deliveryOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>
          <label className="grid gap-2 text-sm font-semibold text-slate-800 md:col-span-2">
            Notes
            <textarea
              className="min-h-24 w-full min-w-0 resize-y rounded-md border border-slate-300 px-3 py-2.5 font-normal outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
              name="notes"
              placeholder="Brand, grade, dispatch timing, or minimum order"
            />
          </label>
        </div>
        <div className="mt-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <p className="min-h-6 text-sm font-semibold text-green-700">
            {status}
          </p>
          <button
            className="w-full rounded-md bg-blue-700 px-5 py-3 text-sm font-bold text-white transition hover:bg-blue-800 md:w-auto"
            type="submit"
          >
            Post Material
          </button>
        </div>
      </form>

      <aside className="max-w-full rounded-lg border border-blue-100 bg-blue-50 p-4 sm:p-6 lg:p-8">
        <p className="text-sm font-bold uppercase text-blue-700">
          Supplier post queue
        </p>
        <h3 className="mt-2 text-2xl font-bold text-slate-950">
          Recent material posts
        </h3>
        <div className="mt-5 divide-y divide-blue-100">
          {listings.length === 0 && (
            <p className="py-5 text-sm leading-6 text-slate-600">
              New supplier posts will appear here for buyer review.
            </p>
          )}
          {listings.map((listing) => (
            <article className="py-4" key={listing.id}>
              <div className="flex min-w-0 flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div className="min-w-0">
                  <p className="font-bold text-slate-950">
                    {listing.materialName}
                  </p>
                  <p className="mt-1 text-sm text-slate-600">
                    {categoryNames.get(listing.categorySlug)} by{" "}
                    {listing.supplierName}
                  </p>
                </div>
                <p className="flex-shrink-0 font-bold text-blue-700 md:text-right">
                  {formatCurrency(listing.price)}
                  <span className="block text-xs font-semibold text-slate-500">
                    / {listing.unit}
                  </span>
                </p>
              </div>
              <p className="mt-3 text-sm text-slate-700">
                {listing.quantity} available in {listing.location} -{" "}
                {listing.delivery}
              </p>
              {listing.notes && (
                <p className="mt-2 text-sm text-slate-600">{listing.notes}</p>
              )}
            </article>
          ))}
        </div>
      </aside>
    </div>
  );
}

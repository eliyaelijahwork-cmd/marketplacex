"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import type { Category, Product } from "../data/marketplace";
import {
  formatCurrency,
  getSupplier,
  heroImage,
} from "../data/marketplace";
import AddToCartButton from "./AddToCartButton";

type ProductBrowserProps = {
  products: Product[];
  categories: Category[];
  initialCategorySlug?: string;
  initialQuery?: string;
  title?: string;
  showCategoryFilter?: boolean;
  showSearch?: boolean;
};

export default function ProductBrowser({
  products,
  categories,
  initialCategorySlug = "all",
  initialQuery = "",
  title,
  showCategoryFilter = true,
  showSearch = true,
}: ProductBrowserProps) {
  const [query, setQuery] = useState(initialQuery);
  const [categorySlug, setCategorySlug] = useState(initialCategorySlug);

  const visibleProducts = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return products.filter((product) => {
      const matchesCategory =
        categorySlug === "all" || product.categorySlug === categorySlug;
      const matchesQuery =
        normalizedQuery.length === 0 ||
        product.name.toLowerCase().includes(normalizedQuery) ||
        product.categoryName.toLowerCase().includes(normalizedQuery);

      return matchesCategory && matchesQuery;
    });
  }, [categorySlug, products, query]);

  return (
    <section className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
      {(title || showSearch || showCategoryFilter) && (
        <div className="mb-8 grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
          {title && (
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-blue-700">
                Product catalog
              </p>
              <h2 className="mt-2 text-2xl font-bold text-slate-950 sm:text-3xl">
                {title}
              </h2>
            </div>
          )}

          {(showSearch || showCategoryFilter) && (
            <div className="grid grid-cols-1 gap-3 rounded-lg border border-slate-200 bg-white p-3 shadow-sm sm:grid-cols-2 lg:grid-cols-[minmax(0,1fr)_minmax(10rem,14rem)]">
              {showSearch && (
                <label className="flex flex-col gap-2">
                  <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Search
                  </span>
                  <input
                    className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="Search products"
                    type="search"
                    value={query}
                  />
                </label>
              )}

              {showCategoryFilter && (
                <label className="flex flex-col gap-2">
                  <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Category
                  </span>
                  <select
                    className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                    onChange={(event) => setCategorySlug(event.target.value)}
                    value={categorySlug}
                  >
                    <option value="all">All categories</option>
                    {categories.map((category) => (
                      <option key={category.slug} value={category.slug}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </label>
              )}
            </div>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
        {visibleProducts.map((product) => {
          const supplier = getSupplier(product.supplierId);

          return (
            <article
              className="max-w-full overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm"
              key={product.slug}
            >
              <div className="relative aspect-[4/3] w-full bg-slate-100 sm:aspect-[16/9]">
                <Image
                  alt={`${product.name} construction material`}
                  className="object-cover"
                  fill
                  sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                  src={heroImage}
                  style={{ objectPosition: product.imagePosition }}
                />
                <div className="absolute left-3 top-3 rounded-md bg-white/90 px-2.5 py-1 text-xs font-semibold text-blue-800 shadow-sm">
                  {product.categoryName}
                </div>
              </div>

              <div className="grid gap-4 p-5">
                <div>
                  <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                    <h3 className="text-lg font-semibold text-slate-950">
                      {product.name}
                    </h3>
                    <p className="text-left text-lg font-bold text-blue-700 md:text-right">
                      {formatCurrency(product.price)}
                    </p>
                  </div>
                  <p className="mt-1 text-sm text-slate-500">{product.unit}</p>
                </div>

                <div className="rounded-md bg-slate-50 p-3 text-sm text-slate-700">
                  <p className="font-semibold text-slate-950">{supplier.name}</p>
                  <p>{supplier.location}</p>
                  <p>{product.stock}</p>
                </div>

                <div className="grid gap-3">
                  <AddToCartButton compact product={product} />
                  <Link
                    className="rounded-md border border-slate-300 px-4 py-2.5 text-center text-sm font-semibold text-slate-800 transition hover:border-blue-600 hover:text-blue-700"
                    href={`/products/${product.slug}`}
                  >
                    View details
                  </Link>
                </div>
              </div>
            </article>
          );
        })}
      </div>

      {visibleProducts.length === 0 && (
        <div className="rounded-lg border border-slate-200 bg-white p-8 text-center text-slate-600">
          No products match your search.
        </div>
      )}
    </section>
  );
}

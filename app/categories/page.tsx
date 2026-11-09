import type { Metadata } from "next";
import CategoryBrowser from "@/app/components/CategoryBrowser";
import { mainCategories } from "@/app/data/directory";

export const metadata: Metadata = { title: "Browse Business Categories | MarketPlaceX", description: "Find businesses, suppliers, products, and services across 50 categories on MarketPlaceX." };

export default function CategoriesPage() {
  return <main className="mx-auto min-h-[70vh] w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
    <p className="text-sm font-black uppercase text-cyan-700">Explore MarketPlaceX</p>
    <h1 className="mt-2 text-3xl font-black text-slate-950 sm:text-4xl">Browse all business categories</h1>
    <p className="mb-7 mt-3 max-w-3xl text-slate-600">Explore local businesses, products, and services. Select a category to see its specialties and matching listings.</p>
    <CategoryBrowser categories={mainCategories} />
  </main>;
}

import type { Metadata } from "next";
import MarketplaceClient from "../components/MarketplaceClient";
import { categories } from "../data/marketplace";

export const metadata: Metadata = {
  title: "Marketplace Listings | MarketPlaceX",
  description:
    "Find nearby construction materials, compare suppliers, and contact sellers directly.",
};

type MaterialsPageProps = {
  searchParams?: Promise<{
    category?: string;
    q?: string;
    location?: string;
  }>;
};

export default async function MaterialsPage({ searchParams }: MaterialsPageProps) {
  const params = await searchParams;
  const category = categories.some((item) => item.slug === params?.category)
    ? params?.category
    : "all";

  return (
    <MarketplaceClient
      initialFilters={{
        query: params?.q ?? "",
        category,
        location: params?.location ?? "",
      }}
    />
  );
}

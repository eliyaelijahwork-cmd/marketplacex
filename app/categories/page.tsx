import { redirect } from "next/navigation";

type CategoriesPageProps = {
  searchParams?: Promise<{
    category?: string;
    q?: string;
  }>;
};

export default async function CategoriesPage({ searchParams }: CategoriesPageProps) {
  const params = await searchParams;
  const query = new URLSearchParams();

  if (params?.category) {
    query.set("category", params.category);
  }
  if (params?.q) {
    query.set("q", params.q);
  }

  redirect(`/materials${query.size ? `?${query}` : ""}`);
}

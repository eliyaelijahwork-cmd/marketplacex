import { notFound } from "next/navigation";
import CategoryResults from "@/app/components/CategoryResults";
import { getDirectoryCategory } from "@/app/lib/categories/server";
export default async function DirectorySubcategoryPage({ params }: { params: Promise<{ slug: string; path: string[] }> }) {
  const { slug, path } = await params;
  const category = await getDirectoryCategory(slug);
  if (!category) notFound();
  let current = category.subcategories;
  for (const item of path) {
    const match = current.find((subcategory) => subcategory.slug === item && subcategory.active);
    if (!match) notFound();
    current = match.children ?? [];
  }
  return <CategoryResults category={category} selectedPath={path} />;
}

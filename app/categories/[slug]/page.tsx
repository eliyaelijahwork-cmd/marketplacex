import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getDirectoryCategory } from "@/app/lib/categories/server";
import CategoryResults from "@/app/components/CategoryResults";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params; const category = await getDirectoryCategory(slug);
  return category ? { title: category.seoTitle, description: category.seoDescription } : {};
}
export default async function DirectoryCategoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params; const category = await getDirectoryCategory(slug);
  if (!category) notFound();
  return <CategoryResults category={category} />;
}

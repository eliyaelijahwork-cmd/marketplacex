import { NextResponse } from "next/server";
import { mainCategories } from "@/app/data/directory";
import { getAdminDb } from "@/app/lib/firebase/admin";

export const runtime = "nodejs";
type SubcategoryRow = Record<string, unknown> & { id: string; children: SubcategoryRow[] };
type CategoryRow = Record<string, unknown> & { id: string; active?: boolean; displayOrder?: number; subcategories: SubcategoryRow[] };
export async function GET() {
  try {
    const db = getAdminDb();
    const [categorySnapshot, subcategorySnapshot] = await Promise.all([db.collection("categories").limit(200).get(), db.collection("subcategories").limit(2000).get()]);
    if (!categorySnapshot.size) return NextResponse.json({ data: mainCategories });
    const children: SubcategoryRow[] = subcategorySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data(), children: [] }));
    const data: CategoryRow[] = categorySnapshot.docs.map((doc) => {
      const row = doc.data();
      const all = children.filter((sub) => sub.parentCategoryId === doc.id && sub.active !== false).sort((a, b) => Number(a.displayOrder ?? 0) - Number(b.displayOrder ?? 0));
      const byId = new Map(all.map((sub) => [sub.id, sub])); const roots: SubcategoryRow[] = [];
      all.forEach((sub) => {
        const parent = typeof sub.parentSubcategoryId === "string" ? byId.get(sub.parentSubcategoryId) : undefined;
        if (parent) parent.children.push(sub); else roots.push(sub);
      });
      return { ...row, id: doc.id, subcategories: roots } as CategoryRow;
    }).filter((row) => row.active !== false).sort((a, b) => Number(a.displayOrder ?? 0) - Number(b.displayOrder ?? 0));
    return NextResponse.json({ data });
  } catch (error) {
    console.error("Category directory lookup failed", error);
    return NextResponse.json({ data: mainCategories });
  }
}

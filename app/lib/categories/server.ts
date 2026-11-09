import { findDirectoryCategory, mainCategories, type DirectoryCategory, type DirectorySubcategory } from "@/app/data/directory";
import { getAdminDb } from "@/app/lib/firebase/admin";

export async function getDirectoryCategory(slug: string): Promise<DirectoryCategory | undefined> {
  try {
    const db = getAdminDb();
    let snapshot = await db.collection("categories").where("slug", "==", slug).limit(1).get();
    if (snapshot.empty) { const byId = await db.collection("categories").doc(slug).get(); if (byId.exists) snapshot = await db.collection("categories").where("slug", "==", byId.id).limit(1).get(); }
    if (snapshot.empty) return findDirectoryCategory(slug);
    const doc = snapshot.docs[0]; const data = doc.data(); if (data.active === false) return undefined;
    const subSnapshot = await db.collection("subcategories").where("parentCategoryId", "==", doc.id).limit(1000).get();
    const allSubcategories: DirectorySubcategory[] = subSnapshot.docs.map((sub) => {
      const row = sub.data();
      return { id: sub.id, slug: String(row.slug ?? sub.id), name: String(row.name ?? sub.id), parentCategoryId: String(row.parentCategoryId ?? doc.id), parentSubcategoryId: typeof row.parentSubcategoryId === "string" ? row.parentSubcategoryId : null, description: String(row.description ?? ""), displayOrder: Number(row.displayOrder ?? 0), level: Number(row.level ?? 1), active: row.active !== false, children: [] };
    }).sort((a, b) => Number(a.displayOrder ?? 0) - Number(b.displayOrder ?? 0));
    const subcategoryById = new Map(allSubcategories.map((sub) => [sub.id, sub]));
    const subcategories: DirectoryCategory["subcategories"] = [];
    for (const sub of allSubcategories) {
      const parentId = typeof sub.parentSubcategoryId === "string" ? sub.parentSubcategoryId : "";
      const parent = parentId ? subcategoryById.get(parentId) : undefined;
      if (parent) { parent.children ??= []; parent.children.push(sub); }
      else subcategories.push(sub as DirectoryCategory["subcategories"][number]);
    }
    return { id: doc.id, slug: String(data.slug ?? doc.id), name: String(data.name ?? doc.id), description: String(data.description ?? ""), icon: String(data.icon ?? "🏷️"), iconPath: String(data.iconPath ?? "M4 7h16v10H4z"), image: String(data.image ?? ""), seoTitle: String(data.seoTitle ?? `${data.name ?? doc.id} | MarketPlaceX`), seoDescription: String(data.seoDescription ?? ""), displayOrder: Number(data.displayOrder ?? 0), active: true, subcategories } as DirectoryCategory;
  } catch {
    return findDirectoryCategory(slug);
  }
}

export async function getAllDirectoryCategories() {
  try {
    const db = getAdminDb(); const snapshot = await db.collection("categories").limit(200).get();
    if (snapshot.empty) return mainCategories;
    return Promise.all(snapshot.docs.filter((doc) => doc.data().active !== false).map(async (doc) => await getDirectoryCategory(doc.id))).then((rows) => rows.filter((row): row is DirectoryCategory => Boolean(row)).sort((a,b)=>a.displayOrder-b.displayOrder));
  } catch { return mainCategories; }
}

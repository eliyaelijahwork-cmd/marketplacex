import { NextResponse } from "next/server";
import { getAdminDb } from "@/app/lib/firebase/admin";
import { findDirectoryCategory } from "@/app/data/directory";

export const runtime = "nodejs";
export async function GET(_request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  try {
    const db = getAdminDb();
    let category = findDirectoryCategory(slug);
    if (!category) {
      let categorySnapshot = await db.collection("categories").doc(slug).get();
      if (!categorySnapshot.exists) {
        const matches = await db.collection("categories").where("slug", "==", slug).limit(1).get();
        if (matches.docs[0]) categorySnapshot = await matches.docs[0].ref.get();
      }
      if (!categorySnapshot.exists || categorySnapshot.data()?.active === false) return NextResponse.json({ error: "Category not found." }, { status: 404 });
      const row = categorySnapshot.data() ?? {};
      const subcategories = await db.collection("subcategories").where("parentCategoryId", "==", categorySnapshot.id).limit(1000).get();
      category = { id: categorySnapshot.id, slug: String(row.slug ?? categorySnapshot.id), name: String(row.name ?? ""), description: String(row.description ?? ""), icon: String(row.icon ?? "🏷️"), iconPath: String(row.iconPath ?? "M4 7h16v10H4z"), image: String(row.image ?? ""), seoTitle: String(row.seoTitle ?? ""), seoDescription: String(row.seoDescription ?? ""), displayOrder: Number(row.displayOrder ?? 0), active: true, subcategories: subcategories.docs.map((doc) => ({ id: doc.id, slug: String(doc.data().slug ?? doc.id), name: String(doc.data().name ?? doc.id), parentCategoryId: categorySnapshot.id, displayOrder: Number(doc.data().displayOrder ?? 0), active: doc.data().active !== false })) };
    }
    if (!category?.active) return NextResponse.json({ error: "Category not found." }, { status: 404 });
    const oldMaterialIds = ["aggregates", "sand", "bricks-blocks", "cement", "steel", "electrical-materials", "hardware-materials", "plumbing-materials", "plywood-wood"];
    const userQueries = [db.collection("users").where("businessCategory", "==", category.slug).limit(500).get(), db.collection("users").where("mainCategoryId", "==", category.id).limit(500).get()];
    if (category.slug === "building-materials") userQueries.push(db.collection("users").where("businessCategory", "in", oldMaterialIds).limit(500).get());
    const [userSnapshots, listingSnapshots, serviceSnapshots] = await Promise.all([
      Promise.all(userQueries),
      Promise.all([db.collection("materials").where("category", "==", category.slug).limit(1000).get(), ...(category.slug === "building-materials" ? [db.collection("materials").where("category", "in", oldMaterialIds).limit(1000).get()] : [])]),
      Promise.all([db.collection("services").where("categoryId", "==", category.slug).limit(1000).get(), db.collection("services").where("categoryId", "==", category.id).limit(1000).get()]),
    ]);
    const userDocs = [...new Map(userSnapshots.flatMap((snapshot) => snapshot.docs).map((doc) => [doc.id, doc])).values()];
    const listingDocs = [...new Map(listingSnapshots.flatMap((snapshot) => snapshot.docs).map((doc) => [doc.id, doc])).values()];
    const serviceDocs = [...new Map(serviceSnapshots.flatMap((snapshot) => snapshot.docs).map((doc) => [doc.id, doc])).values()];
    const businesses = userDocs.flatMap((doc) => {
      const data = doc.data();
      const approved = data.isVerified === true || data.approvalStatus === "approved" || data.verificationStatus === "approved" || data.verificationStatus === "verified";
      if (!approved || data.isActive === false || data.isSuspended === true) return [];
      if (data.businessCategory !== category.slug && data.mainCategoryId !== category.id) return [];
      return [{ id: doc.id, companyName: String(data.companyName ?? data.businessName ?? "Business"), description: String(data.description ?? ""), city: String(data.city ?? ""), state: String(data.state ?? ""), address: String(data.address ?? ""), logoUrl: String(data.businessLogo ?? ""), coverImageUrl: String(data.businessCoverImage ?? ""), businessPhotos: Array.isArray(data.businessPhotos) ? data.businessPhotos.filter((item): item is string => typeof item === "string") : [], businessCategory: String(data.businessCategory ?? "") }];
    });
    const validSupplierIds = new Set(businesses.map((business) => business.id));
    const legacyIds = new Set(category.subcategories.map((sub) => sub.id));
    const materials = listingDocs.flatMap((doc) => {
      const data = doc.data();
      const status = data.approvalStatus ?? (data.isApproved === true ? "approved" : "pending");
      if (data.isActive === false || data.isSuspended === true || (status !== "approved" && data.isApproved !== true)) return [];
      if (!validSupplierIds.has(String(data.supplierId ?? "")) && !legacyIds.has(String(data.category ?? ""))) return [];
      if (!legacyIds.has(String(data.category ?? "")) && data.businessCategory !== category.slug && data.mainCategoryId !== category.id) return [];
      return [{ id: doc.id, supplierId: String(data.supplierId ?? ""), supplierName: String(data.supplierName ?? ""), supplierCompanyName: String(data.supplierCompanyName ?? ""), supplierPhoneNumber: String(data.supplierPhoneNumber ?? ""), supplierWhatsappNumber: String(data.supplierWhatsappNumber ?? ""), supplierPhoto: String(data.supplierPhoto ?? ""), supplierVerified: true, supplierRating: Number(data.supplierRating ?? 0), duplicateKey: String(data.duplicateKey ?? ""), materialName: String(data.materialName ?? data.title ?? ""), category: String(data.category ?? ""), price: Number(data.price ?? 0), quantity: String(data.quantity ?? ""), unit: String(data.unit ?? ""), description: String(data.description ?? ""), images: Array.isArray(data.images) ? data.images.filter((item): item is string => typeof item === "string") : [], address: String(data.address ?? ""), city: String(data.city ?? ""), state: String(data.state ?? ""), latitude: Number(data.latitude ?? 0), longitude: Number(data.longitude ?? 0), createdAt: data.createdAt?.toDate?.().toISOString?.() ?? (typeof data.createdAt === "string" ? data.createdAt : undefined) }];
    });
    const services = serviceDocs.flatMap((doc) => {
      const data = doc.data();
      if (data.active === false || data.isActive === false || (data.approvalStatus !== "approved" && data.status !== "approved")) return [];
      if (!validSupplierIds.has(String(data.supplierId ?? "")) || (data.categoryId !== category.id && data.categoryId !== category.slug)) return [];
      return [{ id: doc.id, supplierId: String(data.supplierId ?? ""), title: String(data.title ?? ""), description: String(data.description ?? ""), businessName: String(data.businessName ?? ""), city: String(data.city ?? ""), status: String(data.approvalStatus ?? data.status ?? "approved") }];
    });
    return NextResponse.json({ businesses, materials, services });
  } catch (error) {
    console.error("Public directory query failed", error);
    return NextResponse.json({ error: "Directory listings are temporarily unavailable." }, { status: 503 });
  }
}

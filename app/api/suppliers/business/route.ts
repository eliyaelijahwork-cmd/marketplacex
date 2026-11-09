import { FieldValue, type DocumentData } from "firebase-admin/firestore";
import { NextRequest, NextResponse } from "next/server";
import { getAdminDb } from "@/app/lib/firebase/admin";
import { requireUser } from "@/app/lib/firebase/admin-auth";
import { mainCategories } from "@/app/data/directory";

export const runtime = "nodejs";
function plain(data: DocumentData) { return JSON.parse(JSON.stringify(data, (_key, value) => value?.toDate instanceof Function ? value.toDate().toISOString() : value)); }
export async function GET(request: NextRequest) {
  const auth = await requireUser(request); if ("error" in auth) return auth.error;
  try {
    const db = getAdminDb(); const uid = auth.decoded.uid;
    const [profile, services, inquiries] = await Promise.all([
      db.collection("users").doc(uid).get(),
      db.collection("services").where("supplierId", "==", uid).limit(200).get(),
      db.collection("inquiries").where("supplierId", "==", uid).limit(200).get(),
    ]);
    return NextResponse.json({ profile: plain(profile.data() ?? {}), services: services.docs.map((item) => ({ id: item.id, ...plain(item.data()) })), inquiries: inquiries.docs.map((item) => ({ id: item.id, ...plain(item.data()) })) });
  } catch (error) { console.error("Supplier business data failed", error); return NextResponse.json({ error: "Could not load business data." }, { status: 500 }); }
}
export async function POST(request: NextRequest) {
  const auth = await requireUser(request); if ("error" in auth) return auth.error;
  let body: Record<string, unknown>; try { body = await request.json(); } catch { return NextResponse.json({ error: "Invalid request." }, { status: 400 }); }
  const db = getAdminDb(); const profileRef = db.collection("users").doc(auth.decoded.uid);
  if (body.action === "category") {
    const categorySlug = typeof body.businessCategory === "string" ? body.businessCategory : "";
    const categorySnapshot = categorySlug ? await db.collection("categories").doc(categorySlug).get() : undefined;
    const staticCategory = mainCategories.find((item) => item.slug === categorySlug);
    const category = categorySnapshot?.exists ? { id: categorySnapshot.id, active: categorySnapshot.data()?.active !== false } : staticCategory;
    const subcategoryId = typeof body.subcategoryId === "string" ? body.subcategoryId : "";
    const subcategorySnapshot = subcategoryId ? await db.collection("subcategories").doc(subcategoryId).get() : undefined;
    const staticSubcategory = staticCategory?.subcategories.find((subcategory) => subcategory.id === subcategoryId && subcategory.active);
    const validSubcategory = subcategorySnapshot?.exists ? subcategorySnapshot.data()?.parentCategoryId === category?.id && subcategorySnapshot.data()?.active !== false : Boolean(staticSubcategory && staticCategory?.id === category?.id);
    if (!category || !category.active || !validSubcategory) return NextResponse.json({ error: "Choose a valid main category and subcategory." }, { status: 400 });
    const existing = (await profileRef.get()).data();
    if (!existing || (existing.role !== "supplier" && !existing.companyName && !existing.businessName)) return NextResponse.json({ error: "Business profile not found." }, { status: 404 });
    await profileRef.update({ businessCategory: categorySlug, mainCategoryId: category.id, subcategoryId, updatedAt: FieldValue.serverTimestamp() });
    return NextResponse.json({ ok: true });
  }
  if (body.action === "photos") {
    const photos = body.businessPhotos;
    if (!Array.isArray(photos) || photos.length > 10 || photos.some((url) => {
      if (typeof url !== "string") return true;
      try { return !decodeURIComponent(new URL(url).pathname).includes(`/businesses/${auth.decoded.uid}/photos/`); } catch { return true; }
    })) return NextResponse.json({ error: "Choose up to ten photos uploaded to this business account." }, { status: 400 });
    await profileRef.update({ businessPhotos: photos, updatedAt: FieldValue.serverTimestamp() });
    return NextResponse.json({ ok: true });
  }
  const title = typeof body.title === "string" ? body.title.trim() : ""; const description = typeof body.description === "string" ? body.description.trim() : "";
  if (body.action !== "create-service" || title.length < 2 || title.length > 140 || description.length > 1500) return NextResponse.json({ error: "Enter a service name and a description up to 1,500 characters." }, { status: 400 });
  const profile = (await profileRef.get()).data(); if (!profile || (profile.role !== "supplier" && !profile.companyName && !profile.businessName)) return NextResponse.json({ error: "Business profile not found." }, { status: 404 });
  if (profile.accountStatus === "suspended" || profile.accountStatus === "rejected" || profile.isSuspended === true) return NextResponse.json({ error: "This business account cannot manage listings." }, { status: 403 });
  const ref = await db.collection("services").add({ supplierId: auth.decoded.uid, businessName: profile.companyName ?? profile.businessName ?? "", title, description, categoryId: profile.mainCategoryId ?? profile.businessCategory ?? "", status: "pending", active: true, createdAt: FieldValue.serverTimestamp(), updatedAt: FieldValue.serverTimestamp() });
  return NextResponse.json({ ok: true, id: ref.id }, { status: 201 });
}
export async function PATCH(request: NextRequest) {
  const auth = await requireUser(request); if ("error" in auth) return auth.error;
  let body: Record<string, unknown>; try { body = await request.json(); } catch { return NextResponse.json({ error: "Invalid request." }, { status: 400 }); }
  if (typeof body.id !== "string" || body.id.length > 150) return NextResponse.json({ error: "Choose a valid service listing." }, { status: 400 });
  const ref = getAdminDb().collection("services").doc(body.id); const snap = await ref.get();
  if (!snap.exists || snap.data()?.supplierId !== auth.decoded.uid) return NextResponse.json({ error: "Service listing not found." }, { status: 404 });
  if (body.action === "deactivate") await ref.update({ active: false, status: "inactive", updatedAt: FieldValue.serverTimestamp() });
  else if (body.action === "activate") await ref.update({ active: true, status: "pending", updatedAt: FieldValue.serverTimestamp() });
  else return NextResponse.json({ error: "Unsupported action." }, { status: 400 });
  return NextResponse.json({ ok: true });
}

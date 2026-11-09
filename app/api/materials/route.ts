import { createDuplicateKey, slugify } from "@/app/data/marketplace";
import { getAdminBucket, getAdminDb } from "@/app/lib/firebase/admin";
import { requireUser } from "@/app/lib/firebase/admin-auth";
import { NextRequest, NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";

export const runtime = "nodejs";
type ListingInput = { materialName?: unknown; category?: unknown; price?: unknown; quantity?: unknown; unit?: unknown; description?: unknown; address?: unknown; city?: unknown; state?: unknown; latitude?: unknown; longitude?: unknown; images?: unknown; id?: unknown };
function validText(value: unknown, min: number, max: number): value is string { return typeof value === "string" && value.trim().length >= min && value.trim().length <= max; }
function supplierCanPost(profile: Record<string, unknown>) {
  if (profile.role !== "supplier" || profile.supplierStatus === "suspended" || profile.supplierStatus === "rejected" || profile.accountStatus === "suspended" || profile.accountStatus === "rejected" || profile.approvalStatus === "suspended" || profile.approvalStatus === "rejected" || profile.verificationStatus === "rejected" || profile.isSuspended === true || profile.isActive === false || profile.isBlocked === true) return false;
  if (profile.supplierApproved === true && profile.accountStatus === "active") return true;
  if (profile.accountStatus !== undefined || profile.supplierStatus !== undefined || profile.canPostMaterials !== undefined) {
    return profile.role === "supplier" && (profile.supplierStatus === "active" || profile.accountStatus === "active") && profile.verificationStatus === "approved" && profile.canPostMaterials === true;
  }
  return profile.isVerified === true && profile.verificationStatus === "verified" && profile.isSuspended !== true && profile.isActive !== false;
}
function validateInput(input: ListingInput) {
  if (!validText(input.materialName, 2, 160) || !validText(input.category, 2, 80) || typeof input.price !== "number" || !Number.isFinite(input.price) || input.price <= 0 || input.price > 100000000 || !validText(input.quantity, 1, 80) || !validText(input.unit, 1, 40) || !validText(input.description, 1, 3000) || !validText(input.address, 1, 500) || !validText(input.city, 1, 120) || !validText(input.state, 1, 120) || typeof input.latitude !== "number" || input.latitude < -90 || input.latitude > 90 || typeof input.longitude !== "number" || input.longitude < -180 || input.longitude > 180 || !Array.isArray(input.images) || input.images.length > 10 || input.images.some((image) => typeof image !== "string" || image.length > 2048)) return false;
  return true;
}
function imagesBelongToSupplier(images: string[], uid: string, listingId: string) {
  return images.every((image) => {
    try {
      const url = new URL(image);
      return url.protocol === "https:" && url.hostname === "firebasestorage.googleapis.com" && decodeURIComponent(url.pathname).includes(`/materials/${uid}/${listingId}/`);
    } catch { return false; }
  });
}

async function getSupplier(uid: string) {
  return getAdminDb().collection("users").doc(uid).get();
}
function materialData(input: ListingInput, uid: string, profile: Record<string, unknown>, id: string, duplicateKey: string) {
  return {
    id, supplierId: uid,
    supplierName: String(profile.supplierName || profile.companyName),
    supplierCompanyName: String(profile.companyName),
    supplierPhoneNumber: String(profile.phoneNumber),
    supplierWhatsappNumber: String(profile.whatsappNumber || profile.phoneNumber),
    supplierPhoto: String(profile.profilePhoto || ""),
    supplierVerified: true, supplierRating: typeof profile.rating === "number" ? profile.rating : 0,
    duplicateKey,
    materialName: (input.materialName as string).trim(), category: (input.category as string).trim(), price: input.price,
    quantity: (input.quantity as string).trim(), unit: (input.unit as string).trim(), description: (input.description as string).trim(),
    images: input.images as string[], address: (input.address as string).trim(), city: (input.city as string).trim(), state: (input.state as string).trim(),
    latitude: input.latitude, longitude: input.longitude,
  };
}

export async function POST(request: NextRequest) {
  const auth = await requireUser(request);
  if ("error" in auth) return auth.error;
  let input: ListingInput;
  try { input = await request.json(); } catch { return NextResponse.json({ error: "Invalid material data." }, { status: 400 }); }
  if (!validateInput(input)) return NextResponse.json({ error: "Material listing fields are invalid." }, { status: 400 });
  const uid = auth.decoded.uid;
  const profileSnapshot = await getSupplier(uid);
  const profile = profileSnapshot.data() as Record<string, unknown> | undefined;
  if (!profile || !supplierCanPost(profile)) return NextResponse.json({ error: "An approved, active supplier account is required to post materials." }, { status: 403 });
  const duplicateKey = createDuplicateKey({ supplierId: uid, materialName: input.materialName as string, category: input.category as string, city: input.city as string });
  const id = `${uid}-${slugify(duplicateKey)}`.slice(0, 120);
  if (typeof input.id === "string" && input.id !== id) return NextResponse.json({ error: "Material listing ID is invalid." }, { status: 400 });
  if (!imagesBelongToSupplier(input.images as string[], uid, id)) return NextResponse.json({ error: "Product images must be uploaded to this supplier's listing folder." }, { status: 400 });

  const db = getAdminDb();
  const materialRef = db.collection("materials").doc(id);
  try {
    await db.runTransaction(async (transaction) => {
      const existing = await transaction.get(materialRef);
      if (existing.exists) throw new Error("DUPLICATE_LISTING");
      transaction.create(materialRef, {
        ...materialData(input, uid, profile, id, duplicateKey),
        approvalStatus: "approved", isActive: true, moderationStatus: "active", isSuspended: false,
        createdAt: FieldValue.serverTimestamp(),
      });
    });
    return NextResponse.json({ id });
  } catch (error) {
    if (error instanceof Error && error.message === "DUPLICATE_LISTING") return NextResponse.json({ error: "This material listing already exists." }, { status: 409 });
    console.error("Material creation failed", error);
    return NextResponse.json({ error: "Could not publish the material listing." }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  const auth = await requireUser(request);
  if ("error" in auth) return auth.error;
  let input: ListingInput;
  try { input = await request.json(); } catch { return NextResponse.json({ error: "Invalid material data." }, { status: 400 }); }
  if (!validText(input.id, 1, 120) || !validateInput(input)) return NextResponse.json({ error: "Material listing fields are invalid." }, { status: 400 });
  const uid = auth.decoded.uid;
  const profileSnapshot = await getSupplier(uid);
  const profile = profileSnapshot.data() as Record<string, unknown> | undefined;
  if (!profile || !supplierCanPost(profile)) return NextResponse.json({ error: "An approved, active supplier account is required to edit materials." }, { status: 403 });
  if (!imagesBelongToSupplier(input.images as string[], uid, input.id as string)) return NextResponse.json({ error: "Product images must be uploaded to this supplier's listing folder." }, { status: 400 });
  const db = getAdminDb();
  const materialRef = db.collection("materials").doc(input.id as string);
  const existing = await materialRef.get();
  if (!existing.exists || existing.data()?.supplierId !== uid || existing.data()?.isActive !== true || existing.data()?.moderationStatus === "rejected") return NextResponse.json({ error: "Active listing not found." }, { status: 404 });
  const duplicateKey = createDuplicateKey({ supplierId: uid, materialName: input.materialName as string, category: input.category as string, city: input.city as string });
  const duplicate = await db.collection("materials").where("supplierId", "==", uid).where("duplicateKey", "==", duplicateKey).limit(2).get();
  if (duplicate.docs.some((doc) => doc.id !== input.id)) return NextResponse.json({ error: "This material would duplicate another listing." }, { status: 409 });
  await materialRef.update({ ...materialData(input, uid, profile, input.id as string, duplicateKey), updatedAt: FieldValue.serverTimestamp() });
  return NextResponse.json({ ok: true });
}

export async function DELETE(request: NextRequest) {
  const auth = await requireUser(request);
  if ("error" in auth) return auth.error;
  let body: { id?: unknown };
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Invalid delete request." }, { status: 400 }); }
  if (typeof body.id !== "string" || body.id.length > 120) return NextResponse.json({ error: "Invalid listing ID." }, { status: 400 });
  const ref = getAdminDb().collection("materials").doc(body.id);
  const snapshot = await ref.get();
  if (!snapshot.exists || snapshot.data()?.supplierId !== auth.decoded.uid) return NextResponse.json({ error: "Listing not found." }, { status: 404 });
  await ref.delete();
  try {
    await getAdminBucket().deleteFiles({ prefix: `materials/${auth.decoded.uid}/${body.id}/` });
  } catch (error) {
    console.error("Material image cleanup failed", error);
  }
  return NextResponse.json({ ok: true });
}

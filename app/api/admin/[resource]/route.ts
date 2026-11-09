import { FieldValue } from "firebase-admin/firestore";
import { NextRequest, NextResponse } from "next/server";
import { getAdminBucket, getAdminDb } from "@/app/lib/firebase/admin";
import { requireAdminSession, writeAdminActivity } from "@/app/lib/firebase/admin-auth";

export const runtime = "nodejs";
const resources = new Set(["suppliers", "businesses", "businessRegistrations", "categories", "subcategories", "payments", "materials", "services", "users", "enquiries", "reviews", "featuredListings", "settings", "activity"]);
function serialize(value: unknown): unknown {
  if (value instanceof Date) return value.toISOString();
  if (Array.isArray(value)) return value.map(serialize);
  if (value && typeof value === "object") {
    const candidate = value as { toDate?: () => Date };
    if (typeof candidate.toDate === "function") return candidate.toDate().toISOString();
    return Object.fromEntries(Object.entries(value).map(([key, child]) => [key, serialize(child)]));
  }
  return value;
}

export async function GET(request: NextRequest, context: { params: Promise<{ resource: string }> }) {
  const auth = await requireAdminSession(request);
  if ("error" in auth) return auth.error;
  const { resource } = await context.params;
  if (!resources.has(resource)) return NextResponse.json({ error: "Unknown admin resource." }, { status: 404 });
  try {
    const db = getAdminDb();
    if (resource === "settings") {
      const setting = await db.collection("settings").doc("approval").get();
      return NextResponse.json({ data: [{ id: "approval", ...(setting.data() ?? { autoApproveSuppliers: false, requireVerifiedEmail: true, requireVerifiedPhone: false }) }] });
    }
    const collectionName = resource === "activity" ? "adminActivityLogs" : resource === "suppliers" || resource === "businesses" || resource === "businessRegistrations" ? "users" : resource === "enquiries" ? "inquiries" : resource;
    const sourceCollection = resource === "users" ? "users" : resource === "featuredListings" ? "materials" : collectionName;
    const snapshot = await db.collection(sourceCollection).orderBy("createdAt", "desc").limit(500).get().catch(async () => db.collection(sourceCollection).limit(500).get());
    let rows: Record<string, unknown>[] = snapshot.docs.map((doc) => ({ id: doc.id, ...(serialize(doc.data()) as Record<string, unknown>) }));
    if (["suppliers", "businesses", "businessRegistrations"].includes(resource)) rows = rows.filter((row) => row.role === "supplier" || row.supplierName || row.companyName);
    if (resource === "businessRegistrations") rows = rows.filter((row) => row.businessRegistrationStatus || row.companyName || row.businessName);
    if (resource === "businessRegistrations") rows = await Promise.all(rows.map(async (row) => {
      if (typeof row.registrationDocumentPath !== "string" || !row.registrationDocumentPath.startsWith(`businesses/${String(row.uid ?? row.id)}/document/`)) return row;
      try { const [url] = await getAdminBucket().file(row.registrationDocumentPath).getSignedUrl({ action: "read", expires: Date.now() + 30 * 60 * 1000 }); return { ...row, registrationDocumentUrl: url }; }
      catch { return row; }
    }));
    if (resource === "featuredListings") rows = rows.filter((row) => row.isFeatured === true);
    return NextResponse.json({ data: rows });
  } catch (error) {
    console.error("Admin data query failed", error);
    return NextResponse.json({ error: "Could not load admin records." }, { status: 500 });
  }
}

export async function POST(request: NextRequest, context: { params: Promise<{ resource: string }> }) {
  const auth = await requireAdminSession(request);
  if ("error" in auth) return auth.error;
  const { resource } = await context.params;
  if (resource === "settings") {
    let body: { autoApproveSuppliers?: unknown };
    try { body = await request.json(); } catch { return NextResponse.json({ error: "Invalid settings request." }, { status: 400 }); }
    if (typeof body.autoApproveSuppliers !== "boolean") return NextResponse.json({ error: "Choose whether automatic approval is enabled." }, { status: 400 });
    await getAdminDb().collection("settings").doc("approval").set({ autoApproveSuppliers: body.autoApproveSuppliers, updatedAt: FieldValue.serverTimestamp(), updatedBy: auth.decoded.email ?? "admin" }, { merge: true });
    await writeAdminActivity(auth.decoded.email ?? "admin", "update approval settings", "settings/approval");
    return NextResponse.json({ ok: true });
  }
  if (["categories", "subcategories"].includes(resource)) {
    let body: Record<string, unknown>;
    try { body = await request.json(); } catch { return NextResponse.json({ error: "Invalid category request." }, { status: 400 }); }
    const action = body.action;
    const db = getAdminDb(); const collection = db.collection(resource);
    const safeSlug = (value: string) => value.toLowerCase().replace(/&/g, "and").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
    if (action === "create") {
      const name = typeof body.name === "string" ? body.name.trim() : "";
      if (name.length < 2 || name.length > 120) return NextResponse.json({ error: "Enter a category name between 2 and 120 characters." }, { status: 400 });
      const id = typeof body.id === "string" && /^[a-z0-9][a-z0-9-]{1,119}$/.test(body.id) ? body.id : safeSlug(name);
      if (!id) return NextResponse.json({ error: "A valid category slug is required." }, { status: 400 });
      const parentCategoryId = typeof body.parentCategoryId === "string" ? body.parentCategoryId : "";
      if (resource === "subcategories" && (!parentCategoryId || !(await db.collection("categories").doc(parentCategoryId).get()).exists)) return NextResponse.json({ error: "Choose an existing parent category." }, { status: 400 });
      const parentSubcategoryId = typeof body.parentSubcategoryId === "string" && body.parentSubcategoryId ? body.parentSubcategoryId : null;
      let level = 1;
      if (resource === "subcategories" && parentSubcategoryId) {
        const parent = await db.collection("subcategories").doc(parentSubcategoryId).get();
        if (!parent.exists || parent.data()?.parentCategoryId !== parentCategoryId) return NextResponse.json({ error: "Choose a subcategory under the selected parent category." }, { status: 400 });
        level = Number(parent.data()?.level ?? 1) + 1;
        if (level > 5) return NextResponse.json({ error: "Subcategories can be nested up to five levels." }, { status: 400 });
      }
      const ref = collection.doc(id); if ((await ref.get()).exists) return NextResponse.json({ error: "That category ID already exists; edit its existing record instead." }, { status: 409 });
      const order = Number.isInteger(body.displayOrder) && Number(body.displayOrder) > 0 ? Number(body.displayOrder) : Date.now();
      const data = { id, slug: id, name, description: typeof body.description === "string" ? body.description.slice(0, 1000) : "", icon: typeof body.icon === "string" ? body.icon.slice(0, 80) : "🏷️", image: typeof body.image === "string" ? body.image.slice(0, 2048) : "", seoTitle: typeof body.seoTitle === "string" ? body.seoTitle.slice(0, 180) : `${name} | MarketPlaceX`, seoDescription: typeof body.seoDescription === "string" ? body.seoDescription.slice(0, 320) : `Find ${name} on MarketPlaceX.`, displayOrder: order, active: true, enabled: true, ...(resource === "subcategories" ? { parentCategoryId, parentSubcategoryId, level } : {}), createdAt: FieldValue.serverTimestamp(), updatedAt: FieldValue.serverTimestamp() };
      await ref.create(data);
      await writeAdminActivity(auth.decoded.email ?? "admin", "create", `${resource}/${id}`);
      return NextResponse.json({ ok: true, id }, { status: 201 });
    }
    if (typeof body.id !== "string" || !["edit", "activate", "deactivate"].includes(String(action))) return NextResponse.json({ error: "Choose a valid category action." }, { status: 400 });
    const ref = collection.doc(body.id); const existing = await ref.get(); if (!existing.exists) return NextResponse.json({ error: "Category not found." }, { status: 404 });
    if (action === "deactivate" || action === "activate") await ref.update({ active: action === "activate", enabled: action === "activate", updatedAt: FieldValue.serverTimestamp() });
    else {
      const updates: Record<string, unknown> = { updatedAt: FieldValue.serverTimestamp() };
      for (const key of ["name", "description", "icon", "image", "seoTitle", "seoDescription"] as const) if (typeof body[key] === "string") updates[key] = (body[key] as string).trim().slice(0, key === "description" ? 1000 : key === "seoDescription" ? 320 : 2048);
      if (Number.isInteger(body.displayOrder) && Number(body.displayOrder) > 0) updates.displayOrder = Number(body.displayOrder);
      await ref.update(updates);
    }
    await writeAdminActivity(auth.decoded.email ?? "admin", String(action), `${resource}/${body.id}`);
    return NextResponse.json({ ok: true });
  }
  if (["services", "materials", "featuredListings", "reviews", "enquiries"].includes(resource)) {
    let body: { id?: unknown; action?: unknown };
    try { body = await request.json(); } catch { return NextResponse.json({ error: "Invalid moderation request." }, { status: 400 }); }
    const allowedActions = resource === "enquiries" ? ["mark-read", "mark-unread"] : ["activate", "deactivate", "approve", "reject"];
    if (typeof body.id !== "string" || !allowedActions.includes(String(body.action))) return NextResponse.json({ error: "Choose a valid moderation action." }, { status: 400 });
    const collection = resource === "featuredListings" ? "materials" : resource === "enquiries" ? "inquiries" : resource;
    const ref = getAdminDb().collection(collection).doc(body.id); const snap = await ref.get();
    if (!snap.exists) return NextResponse.json({ error: "Listing not found." }, { status: 404 });
    if (resource === "enquiries") {
      const read = body.action === "mark-read";
      await ref.update({ read, status: read ? "read" : "new", updatedAt: FieldValue.serverTimestamp() });
      await writeAdminActivity(auth.decoded.email ?? "admin", String(body.action), `${resource}/${body.id}`);
      return NextResponse.json({ ok: true });
    }
    if (resource === "featuredListings") {
      await ref.update({ isFeatured: body.action === "deactivate" || body.action === "reject" ? false : true, updatedAt: FieldValue.serverTimestamp() });
      await writeAdminActivity(auth.decoded.email ?? "admin", String(body.action), `${resource}/${body.id}`);
      return NextResponse.json({ ok: true });
    }
    const approved = body.action === "activate" || body.action === "approve";
    await ref.update({ active: approved, isActive: approved, approvalStatus: approved ? "approved" : body.action === "reject" ? "rejected" : "suspended", isFeatured: resource === "featuredListings" ? approved : snap.data()?.isFeatured ?? false, updatedAt: FieldValue.serverTimestamp() });
    await writeAdminActivity(auth.decoded.email ?? "admin", String(body.action), `${resource}/${body.id}`);
    return NextResponse.json({ ok: true });
  }
  if (resource === "businessRegistrations") {
    let body: { id?: unknown; action?: unknown };
    try { body = await request.json(); } catch { return NextResponse.json({ error: "Invalid registration review request." }, { status: 400 }); }
    if (typeof body.id !== "string" || !["approve", "reject"].includes(String(body.action))) return NextResponse.json({ error: "Choose approve or reject for this registration." }, { status: 400 });
    const ref = getAdminDb().collection("users").doc(body.id); const snapshot = await ref.get();
    if (!snapshot.exists || (!snapshot.data()?.companyName && !snapshot.data()?.businessName)) return NextResponse.json({ error: "Business registration not found." }, { status: 404 });
    await ref.update({ businessRegistrationStatus: body.action === "approve" ? "approved" : "rejected", businessRegistrationReviewedBy: auth.decoded.email ?? "admin", businessRegistrationReviewedAt: FieldValue.serverTimestamp(), updatedAt: FieldValue.serverTimestamp() });
    await writeAdminActivity(auth.decoded.email ?? "admin", `${body.action} registration`, `users/${body.id}`);
    return NextResponse.json({ ok: true });
  }
  if (resource !== "suppliers") return NextResponse.json({ error: "This resource is read-only or does not support this action." }, { status: 400 });
  let body: { uid?: unknown; action?: unknown };
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Invalid moderation request." }, { status: 400 }); }
  if (typeof body.uid !== "string" || typeof body.action !== "string" || !["suspend", "reject", "reactivate"].includes(body.action)) {
    return NextResponse.json({ error: "Choose suspend, reject, or reactivate." }, { status: 400 });
  }

  const db = getAdminDb();
  const supplierRef = db.collection("users").doc(body.uid);
  const supplierSnapshot = await supplierRef.get();
  const supplier = supplierSnapshot.data();
  if (!supplierSnapshot.exists || (supplier?.role !== "supplier" && !supplier?.companyName)) {
    return NextResponse.json({ error: "Supplier record not found." }, { status: 404 });
  }
  if (body.action === "reactivate" && supplier.accountStatus !== "suspended" && supplier.supplierStatus !== "suspended") {
    return NextResponse.json({ error: "Only a suspended supplier can be reactivated." }, { status: 409 });
  }

  const next = body.action === "suspend"
    ? { accountStatus: "suspended", supplierStatus: "suspended", approvalStatus: "suspended", isSuspended: true, isActive: false, canPostMaterials: false }
    : body.action === "reject"
      ? { accountStatus: "rejected", supplierStatus: "rejected", approvalStatus: "rejected", verificationStatus: "rejected", isSuspended: false, isActive: false, canPostMaterials: false }
      : { accountStatus: "active", supplierStatus: "active", approvalStatus: "approved", verificationStatus: "approved", isVerified: true, isSuspended: false, isActive: true, canPostMaterials: true };
  await supplierRef.update({ ...next, updatedAt: FieldValue.serverTimestamp() });

  const listings = await db.collection("materials").where("supplierId", "==", body.uid).get();
  for (let offset = 0; offset < listings.docs.length; offset += 400) {
    const batch = db.batch();
    for (const listing of listings.docs.slice(offset, offset + 400)) {
      if (body.action === "reactivate") {
        if (listing.data().moderationStatus === "suspended") batch.update(listing.ref, { isActive: true, approvalStatus: "approved", moderationStatus: "active", isSuspended: false, updatedAt: FieldValue.serverTimestamp() });
      } else {
        batch.update(listing.ref, { isActive: false, approvalStatus: body.action === "reject" ? "rejected" : "suspended", moderationStatus: body.action, isSuspended: body.action === "suspend", updatedAt: FieldValue.serverTimestamp() });
      }
    }
    await batch.commit();
  }
  await writeAdminActivity(auth.decoded.email ?? "admin", body.action, `users/${body.uid}`);
  return NextResponse.json({ ok: true });
}

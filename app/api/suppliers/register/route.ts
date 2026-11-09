import { createHash } from "node:crypto";
import { FieldValue } from "firebase-admin/firestore";
import { NextRequest, NextResponse } from "next/server";
import { getAdminDb } from "@/app/lib/firebase/admin";
import { requireUser } from "@/app/lib/firebase/admin-auth";
import { validateSupplierRegistration } from "@/app/lib/suppliers/validation";
import { mainCategories } from "@/app/data/directory";

export const runtime = "nodejs";
const DAY_MS = 24 * 60 * 60 * 1000;
const MAX_REGISTRATIONS_PER_DAY = 5;

export async function POST(request: NextRequest) {
  const auth = await requireUser(request);
  if ("error" in auth) return auth.error;
  const provider = typeof auth.decoded.firebase === "object" && auth.decoded.firebase && "sign_in_provider" in auth.decoded.firebase ? String(auth.decoded.firebase.sign_in_provider) : "";
  const emailVerified = provider === "google.com" && auth.decoded.email_verified === true && Boolean(auth.decoded.email);
  const phoneVerified = provider === "phone" && typeof auth.decoded.phone_number === "string";
  if (!emailVerified && !phoneVerified) return NextResponse.json({ error: "Register with a verified Google email or a successfully verified phone OTP." }, { status: 403 });

  let body: unknown;
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Invalid registration data." }, { status: 400 }); }
  const input = validateSupplierRegistration(body);
  if (!input) return NextResponse.json({ error: "Complete every field with a valid Indian mobile number and PIN code." }, { status: 400 });
  if (emailVerified && input.email !== auth.decoded.email!.toLowerCase()) {
    return NextResponse.json({ error: "The registration email must match your verified Firebase account." }, { status: 400 });
  }
  if (phoneVerified && normalizePhone(input.mobileNumber) !== normalizePhone(auth.decoded.phone_number!)) return NextResponse.json({ error: "The registration mobile number must match the phone verified with OTP." }, { status: 400 });
  if (input.registrationDocumentPath && !input.registrationDocumentPath.startsWith(`businesses/${auth.decoded.uid}/document/`)) return NextResponse.json({ error: "The registration document must belong to this Firebase account." }, { status: 400 });
  if (!ownedAssetUrl(input.logoUrl, auth.decoded.uid, "logo") || !ownedAssetUrl(input.coverImageUrl, auth.decoded.uid, "cover") || input.businessPhotos.some((url) => !ownedAssetUrl(url, auth.decoded.uid, "photos"))) return NextResponse.json({ error: "Business images must be uploaded to this supplier account." }, { status: 400 });

  const db = getAdminDb();
  let categoryId = input.businessCategory;
  const staticCategory = mainCategories.find((category) => category.slug === input.businessCategory || category.id === input.businessCategory);
  let categorySnapshot = await db.collection("categories").doc(input.businessCategory).get();
  if (!categorySnapshot.exists) {
    const matches = await db.collection("categories").where("slug", "==", input.businessCategory).limit(1).get();
    categorySnapshot = matches.docs[0] ? await matches.docs[0].ref.get() : categorySnapshot;
  }
  if (categorySnapshot.exists) {
    categoryId = categorySnapshot.id;
    if (categorySnapshot.data()?.active === false) return NextResponse.json({ error: "This business category is inactive." }, { status: 400 });
  } else if (!staticCategory) return NextResponse.json({ error: "Choose an active business category." }, { status: 400 });
  const subcategoryRef = db.collection("subcategories").doc(input.subcategoryId);
  let subcategorySnapshot = await subcategoryRef.get();
  if (!subcategorySnapshot.exists) {
    const matches = await db.collection("subcategories").where("slug", "==", input.subcategoryId).where("parentCategoryId", "==", categoryId).limit(1).get();
    subcategorySnapshot = matches.docs[0] ? await matches.docs[0].ref.get() : subcategorySnapshot;
  }
  const staticSubcategoryValid = staticCategory?.subcategories.some((subcategory) => (subcategory.id === input.subcategoryId || subcategory.slug === input.subcategoryId) && subcategory.active);
  const subcategoryValid = subcategorySnapshot.exists
    ? subcategorySnapshot.data()?.parentCategoryId === categoryId && subcategorySnapshot.data()?.active !== false
    : Boolean(staticSubcategoryValid && staticCategory?.id === categoryId);
  if (!subcategoryValid) return NextResponse.json({ error: "Choose an active subcategory under the selected business category." }, { status: 400 });
  const uid = auth.decoded.uid;
  const profileRef = db.collection("users").doc(uid);
  const phoneClaimRef = db.collection("supplierPhoneClaims").doc(createHash("sha256").update(input.mobileNumber).digest("hex"));
  const limitRef = db.collection("supplierRegistrationLimits").doc(uid);
  const now = Date.now();

  try {
    const outcome = await db.runTransaction(async (transaction) => {
      const [profileSnap, phoneClaimSnap, limitSnap] = await Promise.all([
        transaction.get(profileRef), transaction.get(phoneClaimRef), transaction.get(limitRef),
      ]);
      const profile = profileSnap.data();
      if (profile?.supplierStatus === "suspended" || profile?.accountStatus === "suspended" || profile?.approvalStatus === "suspended" || profile?.isSuspended === true || profile?.isActive === false || profile?.isBlocked === true || profile?.verificationStatus === "rejected") return "blocked";
      if (phoneClaimSnap.exists && phoneClaimSnap.data()?.uid !== uid) return "duplicate_phone";
      if (profileSnap.exists && profile?.phoneNumber && profile.phoneNumber !== input.mobileNumber) return "already_registered";
      if (!profileSnap.exists) {
        const limit = limitSnap.data();
        const startsAt = Number(limit?.startsAt ?? 0);
        const count = startsAt > now - DAY_MS ? Number(limit?.count ?? 0) : 0;
        if (count >= MAX_REGISTRATIONS_PER_DAY) return "rate_limited";
        transaction.set(limitRef, { startsAt: startsAt > now - DAY_MS ? startsAt : now, count: count + 1, updatedAt: FieldValue.serverTimestamp() });
      }

      transaction.set(phoneClaimRef, { uid, createdAt: phoneClaimSnap.exists ? phoneClaimSnap.data()?.createdAt : FieldValue.serverTimestamp() });
      const profileFields = {
        uid,
        userId: uid,
        role: "supplier",
        supplierName: input.fullName,
        companyName: input.businessName,
        businessName: input.businessName,
        businessCategory: input.businessCategory,
        mainCategoryId: categoryId,
        subcategoryId: input.subcategoryId,
        businessTypes: input.businessTypes,
        businessDescription: input.description,
        description: input.description || profile?.description || "",
        email: input.email,
        phoneNumber: input.mobileNumber,
        whatsappNumber: input.whatsappNumber,
        profilePhoto: auth.decoded.picture ?? "",
        address: input.businessAddress,
        country: input.country,
        city: input.city,
        state: input.state,
        district: input.district,
        area: input.area,
        pinCode: input.pinCode,
        latitude: input.latitude ?? profile?.latitude ?? 0,
        longitude: input.longitude ?? profile?.longitude ?? 0,
        businessLogo: input.logoUrl,
        businessCoverImage: input.coverImageUrl,
        businessPhotos: input.businessPhotos,
        gstNumber: input.gstNumber,
        registrationDocumentUrl: input.registrationDocumentUrl,
        registrationDocumentPath: input.registrationDocumentPath,
        businessRegistrationStatus: "complete",
        authenticationVerified: true,
        googleAuthenticated: provider === "google.com" || profile?.googleAuthenticated === true,
        emailVerified,
        phoneVerified: phoneVerified || profile?.phoneVerified === true,
        supplierApproved: true,
        isVerified: true,
        verificationStatus: "approved",
        approvalStatus: "approved",
        supplierStatus: "active",
        accountStatus: "active",
        isApproved: true,
        isSuspended: false,
        isActive: true,
        paymentRequired: false,
        paymentStatus: "not_required",
        canPostMaterials: true,
        rating: profile?.rating ?? 0,
        reviewCount: profile?.reviewCount ?? 0,
        createdAt: profile?.createdAt ?? FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      };
      transaction.set(profileRef, profileFields, { merge: true });
      return "ok";
    });

    if (outcome === "duplicate_phone") return NextResponse.json({ error: "This mobile number is already linked to a supplier account." }, { status: 409 });
    if (outcome === "already_registered") return NextResponse.json({ error: "This account is already registered with a different mobile number." }, { status: 409 });
    if (outcome === "rate_limited") return NextResponse.json({ error: "Registration limit reached. Please try again tomorrow." }, { status: 429 });
    if (outcome === "blocked") return NextResponse.json({ error: "This supplier account is restricted and cannot be reactivated by registration." }, { status: 403 });
    return NextResponse.json({ ok: true, accountStatus: "active", supplierApproved: true, paymentRequired: false, paymentStatus: "not_required" });
  } catch (error) {
    console.error("Supplier registration failed", error);
    return NextResponse.json({ error: "Could not save supplier registration." }, { status: 500 });
  }
}

function normalizePhone(value: string) { return value.replace(/\D/g, "").replace(/^91(?=[6-9]\d{9}$)/, ""); }
function ownedAssetUrl(value: string, uid: string, folder: string) {
  if (!value) return true;
  try {
    const url = new URL(value);
    return url.protocol === "https:" && url.hostname === "firebasestorage.googleapis.com" && decodeURIComponent(url.pathname).includes(`/businesses/${uid}/${folder}/`);
  } catch { return false; }
}

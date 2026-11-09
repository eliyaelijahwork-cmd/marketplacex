import { FieldValue } from "firebase-admin/firestore";
import { NextRequest, NextResponse } from "next/server";
import { getAdminDb } from "@/app/lib/firebase/admin";
import { requireUser } from "@/app/lib/firebase/admin-auth";

export const runtime = "nodejs";

/** Creates a minimal supplier record on first authenticated login, or migrates
 * eligible legacy pending records. Admin review states are never changed here. */
export async function POST(request: NextRequest) {
  const auth = await requireUser(request);
  if ("error" in auth) return auth.error;

  const { uid, email, name, picture, phone_number: phoneNumber, email_verified: emailVerified } = auth.decoded;
  const provider = typeof auth.decoded.firebase === "object" && auth.decoded.firebase && "sign_in_provider" in auth.decoded.firebase
    ? String(auth.decoded.firebase.sign_in_provider)
    : "";
  if (provider !== "google.com" && provider !== "phone") {
    return NextResponse.json({ error: "Use Google sign-in or verified phone OTP to access supplier tools." }, { status: 403 });
  }
  const googleAuthenticated = provider === "google.com";
  const phoneVerified = provider === "phone" && Boolean(phoneNumber);
  const profileRef = getAdminDb().collection("users").doc(uid);

  try {
    const result = await getAdminDb().runTransaction(async (transaction) => {
      const snapshot = await transaction.get(profileRef);
      const existing = snapshot.data() ?? {};
      const isBlocked = existing.supplierStatus === "suspended" || existing.accountStatus === "suspended" ||
        existing.approvalStatus === "suspended" || existing.isSuspended === true ||
        existing.supplierStatus === "rejected" || existing.accountStatus === "rejected" ||
        existing.approvalStatus === "rejected" || existing.verificationStatus === "rejected" ||
        existing.isBlocked === true || existing.isActive === false;

      if (!snapshot.exists) {
        transaction.create(profileRef, {
          uid,
          userId: uid,
          role: "supplier",
          authenticationVerified: true,
          googleAuthenticated,
          emailVerified: emailVerified === true,
          phoneVerified,
          supplierApproved: true,
          supplierName: name ?? "",
          companyName: name ?? "",
          email: email ?? "",
          phoneNumber: phoneNumber ?? "",
          whatsappNumber: phoneNumber ?? "",
          profilePhoto: picture ?? "",
          address: "",
          city: "",
          state: "",
          latitude: 0,
          longitude: 0,
          description: "",
          isVerified: true,
          verificationStatus: "approved",
          approvalStatus: "approved",
          supplierStatus: "active",
          accountStatus: "active",
          isApproved: true,
          isSuspended: false,
          isActive: true,
          isBlocked: false,
          paymentRequired: false,
          paymentStatus: "not_required",
          canPostMaterials: true,
          rating: 0,
          reviewCount: 0,
          createdAt: FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp(),
        });
        return "created";
      }

      const updates: Record<string, unknown> = { updatedAt: FieldValue.serverTimestamp() };
      if (email && !existing.email) updates.email = email;
      if (name && !existing.supplierName) updates.supplierName = name;
      if (name && !existing.companyName) updates.companyName = name;
      if (picture && !existing.profilePhoto) updates.profilePhoto = picture;
      if (phoneNumber && !existing.phoneNumber) updates.phoneNumber = phoneNumber;
      Object.assign(updates, {
        authenticationVerified: true,
        googleAuthenticated: existing.googleAuthenticated === true || googleAuthenticated,
        emailVerified: emailVerified === true,
        phoneVerified: existing.phoneVerified === true || phoneVerified,
        paymentRequired: false,
        paymentStatus: "not_required",
      });

      if (!isBlocked) {
        Object.assign(updates, {
          role: existing.role ?? "supplier",
          supplierApproved: true,
          isVerified: true,
          verificationStatus: "approved",
          approvalStatus: "approved",
          supplierStatus: "active",
          accountStatus: "active",
          isApproved: true,
          isSuspended: false,
          isActive: true,
          isBlocked: false,
          canPostMaterials: true,
        });
      }
      transaction.update(profileRef, updates);
      return isBlocked ? "blocked" : "approved";
    });

    return NextResponse.json({ ok: true, status: result });
  } catch (error) {
    console.error("Supplier login profile sync failed", error);
    return NextResponse.json({ error: "Could not create or update your supplier profile." }, { status: 500 });
  }
}

import { randomUUID } from "node:crypto";
import { FieldValue } from "firebase-admin/firestore";
import { NextRequest, NextResponse } from "next/server";
import { getAdminDb } from "@/app/lib/firebase/admin";
import { requireUser } from "@/app/lib/firebase/admin-auth";
import { buildCheckoutRequest, getPhonePeClient, isPhonePeConfigured, supplierFeeCurrency, supplierFeePaise } from "@/app/lib/payments/phonepe";

export const runtime = "nodejs";
const MAX_ORDERS_PER_HOUR = 5;

export async function POST(request: NextRequest) {
  const auth = await requireUser(request);
  if ("error" in auth) return auth.error;
  if (!isPhonePeConfigured()) return NextResponse.json({ error: "PhonePe checkout is not configured yet." }, { status: 503 });
  const uid = auth.decoded.uid;
  const db = getAdminDb();
  const supplierRef = db.collection("users").doc(uid);
  const limitRef = db.collection("paymentRateLimits").doc(uid);
  const supplier = await supplierRef.get();
  if (!supplier.exists || supplier.data()?.role !== "supplier") return NextResponse.json({ error: "Complete supplier registration first." }, { status: 409 });
  if (supplier.data()?.paymentStatus === "success" && supplier.data()?.canPostMaterials === true) {
    return NextResponse.json({ error: "This supplier account has already paid." }, { status: 409 });
  }

  const merchantOrderId = `MPX-${randomUUID()}`;
  const paymentRef = db.collection("payments").doc(merchantOrderId);
  const now = Date.now();
  try {
    const allowed = await db.runTransaction(async (transaction) => {
      const limitSnapshot = await transaction.get(limitRef);
      const current = limitSnapshot.data();
      const startsAt = Number(current?.startsAt ?? 0);
      const count = startsAt > now - 60 * 60 * 1000 ? Number(current?.count ?? 0) : 0;
      if (count >= MAX_ORDERS_PER_HOUR) return false;
      transaction.set(limitRef, { startsAt: startsAt > now - 60 * 60 * 1000 ? startsAt : now, count: count + 1, updatedAt: FieldValue.serverTimestamp() });
      transaction.create(paymentRef, {
        merchantOrderId, uid, amount: supplierFeePaise, currency: supplierFeeCurrency,
        paymentStatus: "pending", provider: "phonepe", createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      });
      return true;
    });
    if (!allowed) return NextResponse.json({ error: "Too many payment attempts. Please wait before retrying." }, { status: 429 });

    const origin = process.env.NEXT_PUBLIC_SITE_URL || request.nextUrl.origin;
    const result = await getPhonePeClient().pay(buildCheckoutRequest(
      merchantOrderId, uid, `${origin}/supplier-dashboard?payment=${encodeURIComponent(merchantOrderId)}`,
    ));
    if (!result.redirectUrl || !result.redirectUrl.startsWith("https://")) throw new Error("PhonePe did not return a secure checkout URL.");
    await paymentRef.update({ checkoutUrl: result.redirectUrl, updatedAt: FieldValue.serverTimestamp() });
    return NextResponse.json({ merchantOrderId, checkoutUrl: result.redirectUrl });
  } catch (error) {
    await paymentRef.set({ paymentStatus: "failed", failureCode: "checkout_initialization_failed", updatedAt: FieldValue.serverTimestamp() }, { merge: true }).catch(() => undefined);
    console.error("PhonePe order creation failed", error);
    return NextResponse.json({ error: "Could not start PhonePe checkout. Please try again." }, { status: 502 });
  }
}

import { FieldValue } from "firebase-admin/firestore";
import { NextRequest, NextResponse } from "next/server";
import { getAdminDb } from "@/app/lib/firebase/admin";
import { requireUser } from "@/app/lib/firebase/admin-auth";
import { applyVerifiedPayment } from "@/app/lib/payments/settlement";
import { getPhonePeClient, isPhonePeConfigured, supplierFeeCurrency, supplierFeePaise, verifyPhonePeStatus } from "@/app/lib/payments/phonepe";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const auth = await requireUser(request);
  if ("error" in auth) return auth.error;
  if (!isPhonePeConfigured()) return NextResponse.json({ error: "PhonePe checkout is not configured yet." }, { status: 503 });
  let body: { merchantOrderId?: unknown };
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Invalid payment request." }, { status: 400 }); }
  if (typeof body.merchantOrderId !== "string" || !/^MPX-[0-9a-f-]{36}$/i.test(body.merchantOrderId)) {
    return NextResponse.json({ error: "Invalid merchant order ID." }, { status: 400 });
  }
  const db = getAdminDb();
  const paymentRef = db.collection("payments").doc(body.merchantOrderId);
  const payment = await paymentRef.get();
  if (!payment.exists || payment.data()?.uid !== auth.decoded.uid) return NextResponse.json({ error: "Payment order not found." }, { status: 404 });

  try {
    const status = await getPhonePeClient().getOrderStatus(body.merchantOrderId, true);
    const state = String(status.state ?? "PENDING");
    if (state !== "COMPLETED") {
      const paymentStatus = state === "FAILED" || state === "CANCELLED" ? "failed" : "pending";
      await paymentRef.update({ paymentStatus, providerState: state, updatedAt: FieldValue.serverTimestamp() });
      await db.collection("users").doc(auth.decoded.uid).update({ paymentStatus, updatedAt: FieldValue.serverTimestamp() });
      return NextResponse.json({ paymentStatus });
    }

    const verified = verifyPhonePeStatus(status, { merchantOrderId: body.merchantOrderId, supplierUid: auth.decoded.uid });
    await applyVerifiedPayment(db, {
      merchantOrderId: body.merchantOrderId, supplierUid: auth.decoded.uid,
      amount: supplierFeePaise, currency: supplierFeeCurrency, verified,
    });
    return NextResponse.json({ paymentStatus: "success", accountStatus: "active", canPostMaterials: true });
  } catch (error) {
    console.error("PhonePe status verification failed", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Could not verify PhonePe payment." }, { status: 409 });
  }
}

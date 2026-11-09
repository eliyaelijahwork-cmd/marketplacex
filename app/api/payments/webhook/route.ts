import { FieldValue } from "firebase-admin/firestore";
import { NextRequest, NextResponse } from "next/server";
import { getAdminDb } from "@/app/lib/firebase/admin";
import { applyVerifiedPayment } from "@/app/lib/payments/settlement";
import { getPhonePeClient, isPhonePeConfigured, supplierFeeCurrency, supplierFeePaise, verifyPhonePeStatus } from "@/app/lib/payments/phonepe";

export const runtime = "nodejs";
type CallbackPayload = {
  event?: string;
  payload?: {
    merchantOrderId?: string; merchantId?: string; state?: string; amount?: number | string;
    currency?: string; metaInfo?: { udf1?: string; udf2?: string };
  };
};

export async function POST(request: NextRequest) {
  if (!isPhonePeConfigured() || !process.env.PHONEPE_CALLBACK_USERNAME || !process.env.PHONEPE_CALLBACK_PASSWORD) {
    return NextResponse.json({ error: "PhonePe webhook is not configured." }, { status: 503 });
  }
  const rawBody = await request.text();
  const authorization = request.headers.get("authorization");
  if (!authorization || rawBody.length > 64 * 1024) return NextResponse.json({ error: "Invalid callback." }, { status: 400 });

  let callback: CallbackPayload;
  try {
    callback = getPhonePeClient().validateCallback(
      process.env.PHONEPE_CALLBACK_USERNAME,
      process.env.PHONEPE_CALLBACK_PASSWORD,
      authorization,
      rawBody,
    ) as CallbackPayload;
  } catch {
    return NextResponse.json({ error: "PhonePe callback authentication failed." }, { status: 401 });
  }

  const payload = callback.payload;
  const orderId = payload?.merchantOrderId;
  const uid = payload?.metaInfo?.udf1;
  if (!orderId || !uid || payload?.metaInfo?.udf2 !== orderId) return NextResponse.json({ error: "Callback order metadata is invalid." }, { status: 400 });
  if (Number(payload.amount) !== supplierFeePaise || (payload.currency && payload.currency !== supplierFeeCurrency)) {
    return NextResponse.json({ error: "Callback amount or currency does not match the registration fee." }, { status: 400 });
  }
  if (!["checkout.order.completed", "checkout.order.failed"].includes(callback.event ?? "")) return NextResponse.json({ ok: true });

  const db = getAdminDb();
  const paymentRef = db.collection("payments").doc(orderId);
  const payment = await paymentRef.get();
  if (!payment.exists || payment.data()?.uid !== uid || payment.data()?.amount !== supplierFeePaise || payment.data()?.currency !== supplierFeeCurrency) {
    return NextResponse.json({ error: "Callback does not match a stored payment order." }, { status: 409 });
  }

  try {
    const status = await getPhonePeClient().getOrderStatus(orderId, true);
    if (status.state !== "COMPLETED") {
      const state = String(status.state ?? payload.state ?? "PENDING");
      const paymentStatus = state === "FAILED" || state === "CANCELLED" ? "failed" : "pending";
      await paymentRef.update({ paymentStatus, providerState: state, updatedAt: FieldValue.serverTimestamp() });
      await db.collection("users").doc(uid).update({ paymentStatus, updatedAt: FieldValue.serverTimestamp() });
      return NextResponse.json({ ok: true });
    }
    const verified = verifyPhonePeStatus(status, { merchantOrderId: orderId, supplierUid: uid });
    await applyVerifiedPayment(db, { merchantOrderId: orderId, supplierUid: uid, amount: supplierFeePaise, currency: supplierFeeCurrency, verified });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("PhonePe callback processing failed", error);
    return NextResponse.json({ error: "Callback could not be verified against PhonePe." }, { status: 409 });
  }
}

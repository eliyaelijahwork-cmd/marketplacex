import { createHash } from "node:crypto";
import { FieldValue, type Firestore } from "firebase-admin/firestore";
import type { VerifiedPayment } from "./phonepe";

type Attempt = { transactionId?: string; amount?: number | string; state?: string; paymentMode?: string; timestamp?: number };
export async function applyVerifiedPayment(
  db: Firestore,
  input: { merchantOrderId: string; supplierUid: string; amount: number; currency: string; verified: VerifiedPayment },
) {
  const paymentRef = db.collection("payments").doc(input.merchantOrderId);
  const supplierRef = db.collection("users").doc(input.supplierUid);
  const transactionRef = db.collection("paymentTransactions").doc(createHash("sha256").update(input.verified.transactionId).digest("hex"));

  return db.runTransaction(async (transaction) => {
    const [paymentSnap, supplierSnap, existingTransaction] = await Promise.all([
      transaction.get(paymentRef), transaction.get(supplierRef), transaction.get(transactionRef),
    ]);
    if (!paymentSnap.exists || !supplierSnap.exists) throw new Error("Payment order or supplier account does not exist.");
    const payment = paymentSnap.data()!;
    const supplier = supplierSnap.data()!;
    if (payment.merchantOrderId !== input.merchantOrderId || payment.uid !== input.supplierUid) throw new Error("Payment ownership does not match.");
    if (Number(payment.amount) !== input.amount || payment.currency !== input.currency) throw new Error("Stored payment amount or currency does not match.");
    if (payment.paymentStatus === "success") return { alreadyProcessed: true };
    if (existingTransaction.exists && existingTransaction.data()?.merchantOrderId !== input.merchantOrderId) {
      throw new Error("PhonePe transaction has already been used for another order.");
    }

    const attempts = input.verified.paymentDetails as Attempt[];
    for (const attempt of attempts) {
      if (!attempt.transactionId) continue;
      const ref = paymentRef.collection("attempts").doc(createHash("sha256").update(attempt.transactionId).digest("hex"));
      transaction.set(ref, {
        transactionId: attempt.transactionId,
        amount: Number(attempt.amount ?? 0),
        state: attempt.state ?? "UNKNOWN",
        paymentMode: attempt.paymentMode ?? null,
        providerTimestamp: attempt.timestamp ?? null,
        recordedAt: FieldValue.serverTimestamp(),
      }, { merge: true });
    }
    transaction.set(transactionRef, {
      merchantOrderId: input.merchantOrderId,
      supplierUid: input.supplierUid,
      transactionId: input.verified.transactionId,
      amount: input.amount,
      currency: input.currency,
      createdAt: FieldValue.serverTimestamp(),
    });
    transaction.update(paymentRef, {
      paymentStatus: "success",
      providerState: "COMPLETED",
      transactionId: input.verified.transactionId,
      completedAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });

    const blocked = supplier.accountStatus === "suspended" || supplier.accountStatus === "rejected" ||
      supplier.supplierStatus === "suspended" || supplier.supplierStatus === "rejected" ||
      supplier.approvalStatus === "suspended" || supplier.approvalStatus === "rejected" ||
      supplier.isSuspended === true || supplier.verificationStatus === "rejected";
    transaction.update(supplierRef, {
      paymentStatus: "success",
      ...(blocked ? {} : {
        verificationStatus: "approved",
        accountStatus: "active",
        canPostMaterials: true,
        isVerified: true,
        approvalStatus: "approved",
        supplierStatus: "active",
        isApproved: true,
        isSuspended: false,
        isActive: true,
        approvedAt: FieldValue.serverTimestamp(),
        verifiedAt: FieldValue.serverTimestamp(),
      }),
      updatedAt: FieldValue.serverTimestamp(),
    });
    return { alreadyProcessed: false };
  });
}

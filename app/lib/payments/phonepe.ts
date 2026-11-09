import { Env, StandardCheckoutClient, StandardCheckoutPayRequest } from "@phonepe-pg/pg-sdk-node";
import type { OrderStatusResponse } from "@phonepe-pg/pg-sdk-node/dist/common/models/response/OrderStatusResponse";
export const supplierFeePaise = 200;
export const supplierFeeCurrency = "INR" as const;
export function isPhonePeConfigured() {
  return Boolean(process.env.PHONEPE_CLIENT_ID && process.env.PHONEPE_CLIENT_SECRET &&
    process.env.PHONEPE_CLIENT_VERSION && process.env.PHONEPE_CALLBACK_USERNAME &&
    process.env.PHONEPE_CALLBACK_PASSWORD &&
    (process.env.PHONEPE_ENV === "SANDBOX" || process.env.PHONEPE_ENV === "PRODUCTION"));
}
export function getPhonePeClient() {
  if (!isPhonePeConfigured()) throw new Error("PhonePe merchant credentials are not configured.");
  const version = Number(process.env.PHONEPE_CLIENT_VERSION);
  if (!Number.isInteger(version) || version < 1) throw new Error("PhonePe client version is invalid.");
  return StandardCheckoutClient.getInstance(process.env.PHONEPE_CLIENT_ID!, process.env.PHONEPE_CLIENT_SECRET!,
    version, process.env.PHONEPE_ENV === "PRODUCTION" ? Env.PRODUCTION : Env.SANDBOX, false);
}
export function buildCheckoutRequest(merchantOrderId: string, supplierUid: string, redirectUrl: string) {
  return StandardCheckoutPayRequest.builder().merchantOrderId(merchantOrderId).amount(supplierFeePaise)
    .expireAfter(900).metaInfo({ udf1: supplierUid, udf2: merchantOrderId }).redirectUrl(redirectUrl)
    .message("MarketPlaceX supplier registration fee").build();
}
type PhonePeStatus = Omit<OrderStatusResponse, "paymentDetails"> & {
  merchantOrderId?: string; currency?: string; payableCurrency?: string;
  metaInfo?: { udf1?: string; udf2?: string };
  paymentDetails?: Array<{ transactionId?: string; state?: string; amount?: number | string; currency?: string }>;
};
export type VerifiedPayment = { transactionId: string; paymentDetails: NonNullable<PhonePeStatus["paymentDetails"]> };
export function verifyPhonePeStatus(result: PhonePeStatus, expected: { merchantOrderId: string; supplierUid: string }): VerifiedPayment {
  if (result.state !== "COMPLETED") throw new Error("PhonePe has not confirmed a completed payment.");
  if (Number(result.amount) !== supplierFeePaise) throw new Error("PhonePe payment amount does not match ?2.");
  if (result.merchantOrderId && result.merchantOrderId !== expected.merchantOrderId) throw new Error("PhonePe merchant order ID does not match.");
  if (result.metaInfo?.udf1 !== expected.supplierUid || result.metaInfo?.udf2 !== expected.merchantOrderId) throw new Error("PhonePe supplier or merchant order metadata does not match.");
  if ((result.currency && result.currency !== supplierFeeCurrency) || (result.payableCurrency && result.payableCurrency !== supplierFeeCurrency)) throw new Error("PhonePe payment currency does not match INR.");
  const details = result.paymentDetails ?? [];
  const paid = details.find((attempt) => attempt.state === "COMPLETED" && Number(attempt.amount) === supplierFeePaise &&
    (!attempt.currency || attempt.currency === supplierFeeCurrency) && typeof attempt.transactionId === "string" && attempt.transactionId.length > 0);
  if (!paid?.transactionId) throw new Error("PhonePe returned no completed ?2 INR transaction.");
  return { transactionId: paid.transactionId, paymentDetails: details };
}

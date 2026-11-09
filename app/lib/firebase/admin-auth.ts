import { NextRequest, NextResponse } from "next/server";
import { getAdminAuth } from "./admin";

export const ADMIN_EMAIL = "eliyaelijahwork@gmail.com";
const ADMIN_COOKIE = "mpx-admin-session";

export async function requireUser(request: NextRequest) {
  const token = request.headers.get("authorization")?.match(/^Bearer\s+(.+)$/i)?.[1];
  if (!token) return { error: NextResponse.json({ error: "Authentication required." }, { status: 401 }) };
  try {
    return { decoded: await getAdminAuth().verifyIdToken(token, true) };
  } catch {
    return { error: NextResponse.json({ error: "Invalid or expired authentication." }, { status: 401 }) };
  }
}

export async function requireAdminSession(request: NextRequest) {
  const cookie = request.cookies.get(ADMIN_COOKIE)?.value;
  if (!cookie) return { error: NextResponse.json({ error: "Administrator session required." }, { status: 401 }) };
  try {
    const decoded = await getAdminAuth().verifySessionCookie(cookie, true);
    if (decoded.email?.toLowerCase() !== ADMIN_EMAIL || decoded.email_verified !== true) {
      return { error: NextResponse.json({ error: "Administrator access denied." }, { status: 403 }) };
    }
    return { decoded };
  } catch {
    return { error: NextResponse.json({ error: "Invalid or expired administrator session." }, { status: 401 }) };
  }
}

export async function writeAdminActivity(adminEmail: string, action: string, target: string) {
  const { getAdminDb } = await import("./admin");
  const { FieldValue } = await import("firebase-admin/firestore");
  await getAdminDb().collection("adminActivityLogs").add({
    adminEmail,
    action,
    target,
    createdAt: FieldValue.serverTimestamp(),
  });
}

export const adminSessionCookie = ADMIN_COOKIE;
export const adminSessionMaxAgeMs = 5 * 24 * 60 * 60 * 1000;

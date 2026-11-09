import { NextRequest, NextResponse } from "next/server";
import { getAdminAuth } from "@/app/lib/firebase/admin";
import { ADMIN_EMAIL, adminSessionCookie, adminSessionMaxAgeMs } from "@/app/lib/firebase/admin-auth";

export const runtime = "nodejs";
export async function POST(request: NextRequest) {
  const bearer = request.headers.get("authorization")?.match(/^Bearer\s+(.+)$/i)?.[1];
  if (!bearer) return NextResponse.json({ error: "Sign in first." }, { status: 401 });
  let stage: "initialize" | "verify-token" | "create-cookie" = "initialize";
  try {
    const auth = getAdminAuth();
    stage = "verify-token";
    const decoded = await auth.verifyIdToken(bearer, true);
    if (decoded.email?.toLowerCase() !== ADMIN_EMAIL || decoded.email_verified !== true) {
      return NextResponse.json({ error: "Use the authorized, verified administrator account." }, { status: 403 });
    }
    stage = "create-cookie";
    const cookie = await auth.createSessionCookie(bearer, { expiresIn: adminSessionMaxAgeMs });
    const response = NextResponse.json({ ok: true });
    response.cookies.set(adminSessionCookie, cookie, {
      httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax",
      path: "/", maxAge: adminSessionMaxAgeMs / 1000,
    });
    return response;
  } catch (error) {
    const code = typeof error === "object" && error !== null && "code" in error
      ? String(error.code)
      : "unknown";
    console.error("Admin session creation failed", { stage, code });
    return NextResponse.json({ error: "Could not establish an administrator session." }, { status: 401 });
  }
}
export async function DELETE() {
  const response = NextResponse.json({ ok: true });
  response.cookies.set(adminSessionCookie, "", {
    httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: 0,
  });
  return response;
}

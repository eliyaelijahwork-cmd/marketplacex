import { randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { getAdminBucket } from "@/app/lib/firebase/admin";
import { requireUser } from "@/app/lib/firebase/admin-auth";

export const runtime = "nodejs";
const allowedTypes = new Set(["image/jpeg", "image/png", "image/webp"]);
const maxSizeBytes = 5 * 1024 * 1024;

export async function POST(request: NextRequest) {
  const auth = await requireUser(request);
  if ("error" in auth) return auth.error;

  let form: FormData;
  try { form = await request.formData(); }
  catch { return NextResponse.json({ error: "Choose a valid image file." }, { status: 400 }); }
  const file = form.get("file");
  const requestedPath = form.get("path");
  if (!(file instanceof File) || typeof requestedPath !== "string" || file.size < 1 || file.size > maxSizeBytes || !allowedTypes.has(file.type)) {
    return NextResponse.json({ error: "Choose a JPG, PNG, or WebP image up to 5 MB." }, { status: 400 });
  }

  const segments = requestedPath.split("/");
  const ownsProfilePath = segments.length === 4 && segments[0] === "users" && segments[1] === auth.decoded.uid && segments[2] === "profile";
  const ownsMaterialPath = segments.length === 4 && segments[0] === "materials" && segments[1] === auth.decoded.uid && /^[A-Za-z0-9_-]{1,120}$/.test(segments[2]);
  if (!ownsProfilePath && !ownsMaterialPath) return NextResponse.json({ error: "Uploads must belong to your own profile or listing." }, { status: 403 });

  const extension = file.type === "image/jpeg" ? "jpg" : file.type === "image/png" ? "png" : "webp";
  const basename = segments[3].split(/[\\/]/).pop()?.replace(/[^A-Za-z0-9._-]/g, "-").slice(0, 100) || "image";
  const path = `${segments.slice(0, 3).join("/")}/${randomUUID()}-${basename.replace(/\.[^.]*$/, "")}.${extension}`;
  const token = randomUUID();

  try {
    const bucket = getAdminBucket();
    const object = bucket.file(path);
    await object.save(Buffer.from(await file.arrayBuffer()), {
      resumable: false,
      metadata: {
        contentType: file.type,
        cacheControl: "public, max-age=86400",
        metadata: { firebaseStorageDownloadTokens: token },
      },
    });
    const url = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(path)}?alt=media&token=${token}`;
    return NextResponse.json({ url });
  } catch (error) {
    console.error("Supplier image upload failed", error);
    return NextResponse.json({ error: "Could not upload the image." }, { status: 500 });
  }
}

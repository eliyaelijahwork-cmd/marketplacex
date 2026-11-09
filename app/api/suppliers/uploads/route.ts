import { randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { getAdminBucket } from "@/app/lib/firebase/admin";
import { requireUser } from "@/app/lib/firebase/admin-auth";

export const runtime = "nodejs";
const imageTypes = new Set(["image/jpeg", "image/png", "image/webp"]);
export async function POST(request: NextRequest) {
  const auth = await requireUser(request);
  if ("error" in auth) return auth.error;
  let form: FormData;
  try { form = await request.formData(); } catch { return NextResponse.json({ error: "Choose valid upload files." }, { status: 400 }); }
  const entries: Array<{ field: string; file: File }> = [];
  for (const field of ["logo", "cover", "photos", "document"]) {
    for (const item of form.getAll(field)) {
      if (item instanceof File && item.size > 0) entries.push({ field, file: item });
    }
  }
  if (!entries.length || entries.length > 13 || entries.filter((entry) => entry.field === "logo").length > 1 || entries.filter((entry) => entry.field === "cover").length > 1 || entries.filter((entry) => entry.field === "document").length > 1 || entries.filter((entry) => entry.field === "photos").length > 10) {
    return NextResponse.json({ error: "Upload one logo, one cover, up to ten business photos, and one registration document." }, { status: 400 });
  }
  for (const { field, file } of entries) {
    const valid = field === "document" ? file.type === "application/pdf" && file.size <= 10 * 1024 * 1024 : imageTypes.has(file.type) && file.size <= 5 * 1024 * 1024;
    if (!valid) return NextResponse.json({ error: field === "document" ? "The registration document must be a PDF up to 10 MB." : "Images must be JPG, PNG, or WebP files up to 5 MB." }, { status: 400 });
  }
  try {
    const bucket = getAdminBucket();
    const urls: Record<string, string | string[]> = { photos: [] };
    const paths: Record<string, string> = {};
    for (const { field, file } of entries) {
      const suffix = field === "document" ? "pdf" : file.type.split("/")[1].replace("jpeg", "jpg");
      const object = bucket.file(`businesses/${auth.decoded.uid}/${field}/${randomUUID()}.${suffix}`);
      const token = randomUUID();
      await object.save(Buffer.from(await file.arrayBuffer()), { resumable: false, metadata: { contentType: file.type, cacheControl: field === "document" ? "private, no-store" : "public, max-age=86400", ...(field === "document" ? {} : { metadata: { firebaseStorageDownloadTokens: token } }) } });
      if (field === "document") {
        paths.document = object.name;
        const [url] = await object.getSignedUrl({ action: "read", expires: Date.now() + 6 * 24 * 60 * 60 * 1000 });
        urls.document = url;
      } else {
        const url = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(object.name)}?alt=media&token=${token}`;
        if (field === "photos") (urls.photos as string[]).push(url); else urls[field] = url;
      }
    }
    return NextResponse.json({ urls, paths });
  } catch (error) {
    console.error("Supplier asset upload failed", error);
    return NextResponse.json({ error: "Could not upload business files." }, { status: 500 });
  }
}

"use client";

import type { User } from "firebase/auth";
import { getFirebaseAuth } from "./client";
import {
  collection,
  doc,
  getDoc,
  onSnapshot,
  serverTimestamp,
  setDoc,
  updateDoc,
  type DocumentData,
  type Unsubscribe,
} from "firebase/firestore";
import {
  createDuplicateKey,
  seedMaterials,
  seedSuppliers,
  slugify,
  type MaterialListing,
  type SupplierProfile,
} from "@/app/data/marketplace";
import {
  getFirebaseDb,
  firebaseConfigMissing,
} from "./client";

export type SupplierProfileInput = Omit<
  SupplierProfile,
  | "uid"
  | "profilePhoto"
  | "isVerified"
  | "verificationStatus"
  | "verifiedAt"
  | "rating"
  | "reviewCount"
  | "createdAt"
  | "updatedAt"
> & {
  profilePhoto?: string;
};

export type MaterialInput = Omit<
  MaterialListing,
  | "id"
  | "supplierId"
  | "images"
  | "supplierName"
  | "supplierCompanyName"
  | "supplierPhoneNumber"
  | "supplierWhatsappNumber"
  | "supplierPhoto"
  | "supplierVerified"
  | "supplierRating"
  | "duplicateKey"
  | "createdAt"
  | "updatedAt"
> & {
  images?: string[];
};

export const maxListingImages = 10;
export const maxImageSizeBytes = 5 * 1024 * 1024;
export const allowedImageTypes = ["image/jpeg", "image/png", "image/webp"];

export function validateImageFiles(files: File[]) {
  if (files.length > maxListingImages) {
    return `Upload up to ${maxListingImages} images.`;
  }

  const invalidType = files.find((file) => !allowedImageTypes.includes(file.type));
  if (invalidType) {
    return `${invalidType.name} must be a JPG, PNG, or WebP image.`;
  }

  const oversized = files.find((file) => file.size > maxImageSizeBytes);
  if (oversized) {
    return `${oversized.name} is larger than 5 MB.`;
  }

  return "";
}

export function isVerifiedSupplier(profile?: SupplierProfile | null) {
  if (!profile) return false;
  if (profile.supplierStatus === "suspended" || profile.supplierStatus === "rejected" ||
      profile.accountStatus === "suspended" || profile.accountStatus === "rejected" ||
      profile.approvalStatus === "suspended" || profile.approvalStatus === "rejected" ||
      profile.verificationStatus === "rejected" || profile.isSuspended || profile.isActive === false) return false;
  if (profile.supplierApproved === true && profile.accountStatus === "active") return true;
  if (profile.accountStatus !== undefined || profile.supplierStatus !== undefined || profile.canPostMaterials !== undefined) {
    return profile.verificationStatus === "approved" && (profile.supplierStatus === "active" || profile.accountStatus === "active") && profile.canPostMaterials === true;
  }
  return profile.isVerified && profile.verificationStatus === "verified";
}

export function listenToMaterials(
  onNext: (materials: MaterialListing[]) => void,
  onError?: (message: string) => void,
): Unsubscribe {
  if (firebaseConfigMissing) {
    onNext(seedMaterials);
    onError?.("Firebase is not configured yet. Showing demo listings.");
    return () => undefined;
  }

  try {
    return onSnapshot(
      collection(getFirebaseDb(), "materials"),
      (snapshot) => {
        const materials = snapshot.docs
          .map((document) => materialFromDoc(document.id, document.data()))
          .sort(byNewest);
        onNext(materials.length ? materials : seedMaterials);
      },
      (error) => {
        console.error(error);
        onNext(seedMaterials);
        onError?.("Could not load Firestore listings. Showing demo listings.");
      },
    );
  } catch (error) {
    console.error(error);
    onNext(seedMaterials);
    onError?.("Could not initialize Firestore. Showing demo listings.");
    return () => undefined;
  }
}

export function listenToUserProfile(
  uid: string,
  onNext: (profile: SupplierProfile | null) => void,
  onError?: (message: string) => void,
): Unsubscribe {
  if (firebaseConfigMissing) {
    onNext(seedSuppliers.find((supplier) => supplier.uid === uid) ?? null);
    return () => undefined;
  }

  return onSnapshot(
    doc(getFirebaseDb(), "users", uid),
    (snapshot) => onNext(snapshot.exists() ? profileFromDoc(snapshot.id, snapshot.data()) : null),
    (error) => {
      console.error(error);
      onError?.("Could not load supplier profile.");
    },
  );
}

export async function ensureUserProfile(user: User) {
  if (firebaseConfigMissing) return;
  const token = await user.getIdToken();
  const response = await fetch("/api/suppliers/profile", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) {
    const result = await response.json().catch(() => null) as { error?: string } | null;
    throw new Error(result?.error ?? "Could not sync supplier profile.");
  }
}

export async function saveSupplierProfile(
  uid: string,
  input: SupplierProfileInput,
  profilePhoto?: File | null,
) {
  if (firebaseConfigMissing) {
    throw new Error("Firebase is not configured. Add root .env.local values first.");
  }

  const db = getFirebaseDb();
  const profileRef = doc(db, "users", uid);
  const current = await getDoc(profileRef);
  const photoUrl = profilePhoto
    ? await uploadFile(profilePhoto, `users/${uid}/profile/${Date.now()}-${sanitizeFileName(profilePhoto.name)}`)
    : input.profilePhoto ?? current.data()?.profilePhoto ?? "";

  const payload = {
    uid,
    supplierName: input.supplierName,
    companyName: input.companyName,
    email: input.email,
    phoneNumber: input.phoneNumber,
    whatsappNumber: input.whatsappNumber,
    profilePhoto: photoUrl,
    address: input.address,
    city: input.city,
    state: input.state,
        businessCategory: input.businessCategory ?? "",
    pinCode: input.pinCode ?? "",
    latitude: input.latitude,
    longitude: input.longitude,
    description: input.description,
  };

  if (current.exists()) {
    await updateDoc(profileRef, {
      ...payload,
      updatedAt: serverTimestamp(),
    });
  } else {
    await setDoc(profileRef, {
      ...payload,
      createdAt: serverTimestamp(),
    });
  }
}

export async function createMaterialListing(
  input: MaterialInput,
  supplier: SupplierProfile,
  files: File[],
  onProgress?: (progress: number) => void,
) {
  if (firebaseConfigMissing) {
    throw new Error("Firebase is not configured. Add root .env.local values first.");
  }
  if (!isVerifiedSupplier(supplier)) {
    throw new Error("Only verified suppliers can post materials.");
  }

  const validationMessage = validateImageFiles(files);
  if (validationMessage) {
    throw new Error(validationMessage);
  }

  const duplicateKey = createDuplicateKey({
    supplierId: supplier.uid,
    materialName: input.materialName,
    category: input.category,
    city: input.city,
  });
  const materialId = `${supplier.uid}-${slugify(duplicateKey)}`.slice(0, 120);
  const images = files.length
    ? await uploadFiles(files, `materials/${supplier.uid}/${materialId}`, onProgress)
    : [];
  await authorizedMaterialRequest("POST", {
    id: materialId,
    materialName: input.materialName,
    category: input.category,
    price: input.price,
    quantity: input.quantity,
    unit: input.unit,
    description: input.description,
    images,
    address: input.address,
    city: input.city,
    state: input.state,
    latitude: input.latitude,
    longitude: input.longitude,
  });

  onProgress?.(100);
  return materialId;
}

export async function updateMaterialListing(
  material: MaterialListing,
  input: MaterialInput,
  files: File[],
  supplier: SupplierProfile,
  onProgress?: (progress: number) => void,
) {
  if (firebaseConfigMissing) {
    throw new Error("Firebase is not configured. Add root .env.local values first.");
  }
  if (!isVerifiedSupplier(supplier)) {
    throw new Error("Only verified suppliers can update material listings.");
  }

  const validationMessage = validateImageFiles(files);
  if (validationMessage) {
    throw new Error(validationMessage);
  }

  const newImages = files.length
    ? await uploadFiles(files, `materials/${supplier.uid}/${material.id}`, onProgress)
    : material.images;
  await authorizedMaterialRequest("PATCH", {
    id: material.id,
    materialName: input.materialName,
    category: input.category,
    price: input.price,
    quantity: input.quantity,
    unit: input.unit,
    description: input.description,
    images: newImages,
    address: input.address,
    city: input.city,
    state: input.state,
    latitude: input.latitude,
    longitude: input.longitude,
  });

  onProgress?.(100);
}

export async function deleteMaterialListing(material: MaterialListing) {
  if (firebaseConfigMissing) {
    throw new Error("Firebase is not configured. Add root .env.local values first.");
  }

  await authorizedMaterialRequest("DELETE", { id: material.id });
}

async function authorizedMaterialRequest(method: "POST" | "PATCH" | "DELETE", body: Record<string, unknown>) {
  const user = getFirebaseAuth().currentUser;
  if (!user) throw new Error("Sign in again to manage material listings.");
  const token = await user.getIdToken();
  const response = await fetch("/api/materials", {
    method,
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    const result = await response.json().catch(() => null) as { error?: string } | null;
    throw new Error(result?.error ?? "Could not save the material listing.");
  }
}

async function uploadFiles(
  files: File[],
  folder: string,
  onProgress?: (progress: number) => void,
) {
  const urls: string[] = [];

  for (let index = 0; index < files.length; index += 1) {
    const file = files[index];
    const url = await uploadFile(
      file,
      `${folder}/${index + 1}-${Date.now()}-${sanitizeFileName(file.name)}`,
      (singleProgress) => {
        const totalProgress = ((index + singleProgress / 100) / files.length) * 100;
        onProgress?.(Math.round(totalProgress));
      },
    );
    urls.push(url);
  }

  return urls;
}

async function uploadFile(
  file: File,
  path: string,
  onProgress?: (progress: number) => void,
) {
  const user = getFirebaseAuth().currentUser;
  if (!user) throw new Error("Sign in again before uploading files.");
  onProgress?.(0);
  const form = new FormData();
  form.set("path", path);
  form.set("file", file);
  const response = await fetch("/api/suppliers/file-upload", {
    method: "POST",
    headers: { Authorization: `Bearer ${await user.getIdToken()}` },
    body: form,
  });
  const result = await response.json().catch(() => null) as { url?: string; error?: string } | null;
  if (!response.ok || !result?.url) throw new Error(result?.error ?? "Could not upload the file.");
  onProgress?.(100);
  return result.url;
}

function sanitizeFileName(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9.]+/g, "-").replace(/(^-|-$)/g, "");
}

function profileFromDoc(id: string, data: DocumentData): SupplierProfile {
  return {
    uid: stringValue(data.uid, id),
    supplierName: stringValue(data.supplierName),
    companyName: stringValue(data.companyName),
    email: stringValue(data.email),
    phoneNumber: stringValue(data.phoneNumber),
    whatsappNumber: stringValue(data.whatsappNumber),
    profilePhoto: stringValue(data.profilePhoto),
    address: stringValue(data.address),
    city: stringValue(data.city),
    state: stringValue(data.state),
    latitude: numberValue(data.latitude),
    longitude: numberValue(data.longitude),
    description: stringValue(data.description),
    isVerified: booleanValue(data.isVerified),
    verificationStatus: verificationStatusValue(data.verificationStatus),
    accountStatus: typeof data.accountStatus === "string" ? data.accountStatus as SupplierProfile["accountStatus"] : undefined,
    paymentStatus: typeof data.paymentStatus === "string" ? data.paymentStatus as SupplierProfile["paymentStatus"] : undefined,
    authenticationVerified: typeof data.authenticationVerified === "boolean" ? data.authenticationVerified : undefined,
    googleAuthenticated: typeof data.googleAuthenticated === "boolean" ? data.googleAuthenticated : undefined,
    emailVerified: typeof data.emailVerified === "boolean" ? data.emailVerified : undefined,
    phoneVerified: typeof data.phoneVerified === "boolean" ? data.phoneVerified : undefined,
    supplierApproved: typeof data.supplierApproved === "boolean" ? data.supplierApproved : undefined,
    paymentRequired: typeof data.paymentRequired === "boolean" ? data.paymentRequired : undefined,
    canPostMaterials: typeof data.canPostMaterials === "boolean" ? data.canPostMaterials : undefined,
    supplierStatus: typeof data.supplierStatus === "string" ? data.supplierStatus as SupplierProfile["supplierStatus"] : undefined,
    approvalStatus: typeof data.approvalStatus === "string" ? data.approvalStatus as SupplierProfile["approvalStatus"] : undefined,
    isSuspended: typeof data.isSuspended === "boolean" ? data.isSuspended : undefined,
    isActive: typeof data.isActive === "boolean" ? data.isActive : undefined,
    businessCategory: stringValue(data.businessCategory),
    pinCode: stringValue(data.pinCode),
    verifiedAt: timestampToIso(data.verifiedAt),
    rating: numberValue(data.rating),
    reviewCount: numberValue(data.reviewCount),
    createdAt: timestampToIso(data.createdAt),
    updatedAt: timestampToIso(data.updatedAt),
  };
}

function materialFromDoc(id: string, data: DocumentData): MaterialListing {
  return {
    id: stringValue(data.id, id),
    supplierId: stringValue(data.supplierId),
    supplierName: stringValue(data.supplierName),
    supplierCompanyName: stringValue(data.supplierCompanyName),
    supplierPhoneNumber: stringValue(data.supplierPhoneNumber),
    supplierWhatsappNumber: stringValue(data.supplierWhatsappNumber),
    supplierPhoto: stringValue(data.supplierPhoto),
    supplierVerified: booleanValue(data.supplierVerified),
    supplierRating: numberValue(data.supplierRating),
    duplicateKey: stringValue(data.duplicateKey),
    materialName: stringValue(data.materialName),
    category: stringValue(data.category),
    price: numberValue(data.price),
    quantity: stringValue(data.quantity),
    unit: stringValue(data.unit),
    description: stringValue(data.description),
    images: Array.isArray(data.images) ? data.images.filter((item) => typeof item === "string") : [],
    address: stringValue(data.address),
    city: stringValue(data.city),
    state: stringValue(data.state),
    latitude: numberValue(data.latitude),
    longitude: numberValue(data.longitude),
    createdAt: timestampToIso(data.createdAt),
    updatedAt: timestampToIso(data.updatedAt),
  };
}

function timestampToIso(value: unknown) {
  if (!value) {
    return undefined;
  }
  if (typeof value === "string") {
    return value;
  }
  if (typeof value === "object" && "toDate" in value && typeof value.toDate === "function") {
    return value.toDate().toISOString();
  }
  return undefined;
}

function stringValue(value: unknown, fallback = "") {
  return typeof value === "string" ? value : fallback;
}

function numberValue(value: unknown, fallback = 0) {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function booleanValue(value: unknown, fallback = false) {
  return typeof value === "boolean" ? value : fallback;
}

function verificationStatusValue(value: unknown): SupplierProfile["verificationStatus"] {
  return value === "verified" || value === "approved" || value === "pending_payment" || value === "rejected" || value === "pending"
    ? value
    : "pending";
}

function byNewest(a: MaterialListing, b: MaterialListing) {
  return new Date(b.createdAt ?? 0).getTime() - new Date(a.createdAt ?? 0).getTime();
}






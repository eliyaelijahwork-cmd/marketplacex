import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import { getStorage } from "firebase-admin/storage";

function getAdminApp() {
  if (getApps().length) return getApps()[0];

  const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
  const rawPrivateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY?.trim().replace(/^(["'])|(["'])$/g, "");
  let privateKey = rawPrivateKey?.replace(/\\r?\\n/g, "\n").replace(/\r\n/g, "\n");
  const storageBucket = process.env.FIREBASE_ADMIN_STORAGE_BUCKET || process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error("Firebase Admin credentials are not configured.");
  }

  // Some secret stores omit the PEM header while retaining the PKCS#8 body and footer.
  // Restore that boundary only for this recognizable format; let Firebase reject other data.
  privateKey = privateKey.trim();
  if (privateKey.startsWith("\\n")) privateKey = privateKey.slice(2);
  if (privateKey.startsWith("MII") && privateKey.includes("-----END PRIVATE KEY-----")) {
    privateKey = `-----BEGIN PRIVATE KEY-----\n${privateKey}`;
  }

  return initializeApp({
    credential: cert({ projectId, clientEmail, privateKey }),
    ...(storageBucket ? { storageBucket } : {}),
  });
}

export function getAdminAuth() {
  return getAuth(getAdminApp());
}

export function getAdminDb() {
  return getFirestore(getAdminApp());
}

export function getAdminBucket() {
  return getStorage(getAdminApp()).bucket();
}

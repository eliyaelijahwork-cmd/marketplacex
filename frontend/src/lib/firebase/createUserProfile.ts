import { db, auth } from './client';
import { doc, setDoc } from 'firebase/firestore';

export async function createUserProfile(uid: string, email: string, role: 'customer' | 'supplier' | 'admin', additionalData = {}) {
  const userRef = doc(db, 'users', uid);
  await setDoc(userRef, {
    email,
    role,
    createdAt: new Date().toISOString(),
    isActive: true,
    ...additionalData,
  }, { merge: true });
}
"use client";

import {
  GoogleAuthProvider,
  RecaptchaVerifier,
  onAuthStateChanged,
  signInWithPhoneNumber,
  signInWithPopup,
  signOut,
  type ConfirmationResult,
  type User,
} from "firebase/auth";
import {
  createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode,
} from "react";
import type { SupplierProfile } from "@/app/data/marketplace";
import { ensureUserProfile, listenToUserProfile } from "@/app/lib/firebase/marketplace";
import { firebaseConfigMissing, getFirebaseAuth } from "@/app/lib/firebase/client";

type AuthContextValue = {
  user: User | null;
  profile: SupplierProfile | null;
  profileLoading: boolean;
  loading: boolean;
  error: string;
  firebaseReady: boolean;
  loginWithGoogle: () => Promise<void>;
  sendOtp: (phoneNumber: string) => Promise<boolean>;
  verifyOtp: (code: string) => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<SupplierProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(!firebaseConfigMissing);
  const [loading, setLoading] = useState(!firebaseConfigMissing);
  const [error, setError] = useState(firebaseConfigMissing ? "Firebase is not configured. Add root .env.local values." : "");
  const confirmationRef = useRef<ConfirmationResult | null>(null);
  const recaptchaRef = useRef<RecaptchaVerifier | null>(null);

  useEffect(() => {
    if (firebaseConfigMissing) return;
    return onAuthStateChanged(getFirebaseAuth(), async (nextUser) => {
      setUser(nextUser);
      setProfileLoading(Boolean(nextUser));
      if (nextUser) {
        try { await ensureUserProfile(nextUser); }
        catch (reason) { console.error(reason); setError(reason instanceof Error ? reason.message : "Signed in, but could not sync the supplier profile."); }
      } else {
        setProfile(null);
        setProfileLoading(false);
      }
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    if (!user || firebaseConfigMissing) return undefined;
    return listenToUserProfile(
      user.uid,
      (nextProfile) => { setProfile(nextProfile); setProfileLoading(false); },
      (message) => { setError(message); setProfileLoading(false); },
    );
  }, [user]);

  const loginWithGoogle = useCallback(async () => {
    setError("");
    if (firebaseConfigMissing) { setError("Firebase is not configured. Add root .env.local values."); return; }
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: "select_account" });
      const result = await signInWithPopup(getFirebaseAuth(), provider);
      await ensureUserProfile(result.user);
    } catch (reason) { console.error("Google sign-in failed", reason); setError(firebaseAuthError(reason, "Google sign-in failed.")); }
  }, []);

  const sendOtp = useCallback(async (phoneNumber: string) => {
    setError("");
    if (firebaseConfigMissing) { setError("Firebase is not configured. Add root .env.local values."); return false; }
    const formattedPhone = formatPhone(phoneNumber);
    if (!formattedPhone) { setError("Enter a valid Indian mobile number."); return false; }
    try {
      const auth = getFirebaseAuth();
      if (!recaptchaRef.current) recaptchaRef.current = new RecaptchaVerifier(auth, "recaptcha-container", { size: "invisible" });
      confirmationRef.current = await signInWithPhoneNumber(auth, formattedPhone, recaptchaRef.current);
      return true;
    } catch (reason) {
      console.error("Phone OTP request failed", reason); recaptchaRef.current?.clear(); recaptchaRef.current = null;
      setError(firebaseAuthError(reason, "OTP could not be sent."));
      return false;
    }
  }, []);

  const verifyOtp = useCallback(async (code: string) => {
    setError("");
    if (!confirmationRef.current) { setError("Request an OTP first."); return; }
    try {
      const result = await confirmationRef.current.confirm(code);
      await ensureUserProfile(result.user);
      confirmationRef.current = null;
    } catch (reason) { console.error("Phone OTP verification failed", reason); setError(firebaseAuthError(reason, "The OTP code is incorrect or expired.")); }
  }, []);

  const logout = useCallback(async () => {
    setError("");
    if (firebaseConfigMissing) { setUser(null); setProfile(null); setProfileLoading(false); return; }
    await signOut(getFirebaseAuth());
  }, []);

  const value = useMemo(() => ({
    user, profile, profileLoading, loading, error, firebaseReady: !firebaseConfigMissing,
    loginWithGoogle, sendOtp, verifyOtp, logout, clearError: () => setError(""),
  }), [error, loading, loginWithGoogle, logout, profile, profileLoading, sendOtp, user, verifyOtp]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

function firebaseAuthError(reason: unknown, fallback: string) {
  const code = typeof reason === "object" && reason !== null && "code" in reason && typeof reason.code === "string"
    ? reason.code
    : "";
  const messages: Record<string, string> = {
    "auth/popup-blocked": "Your browser blocked the Google sign-in popup. Allow popups and try again.",
    "auth/popup-closed-by-user": "Google sign-in was closed before it finished.",
    "auth/unauthorized-domain": "This website domain is not authorized in Firebase Authentication.",
    "auth/operation-not-allowed": "Enable this sign-in provider in Firebase Authentication.",
    "auth/network-request-failed": "Network error while contacting Firebase. Check your connection and try again.",
    "auth/invalid-phone-number": "Enter a valid phone number with country code.",
    "auth/invalid-verification-code": "The OTP code is incorrect.",
    "auth/code-expired": "The OTP code has expired. Request a new code.",
    "auth/captcha-check-failed": "Phone verification could not validate this browser. Refresh and try again.",
  };
  if (messages[code]) return messages[code];
  if (!code && reason instanceof Error && reason.message) return reason.message;
  return `${fallback}${code ? ` (${code})` : " Check Firebase Authentication setup and try again."}`;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error("useAuth must be used inside AuthProvider.");
  return value;
}

function formatPhone(value: string) {
  const digits = value.replace(/\D/g, "");
  if (digits.length === 10) return `+91${digits}`;
  if (digits.length === 12 && digits.startsWith("91")) return `+${digits}`;
  if (value.trim().startsWith("+") && digits.length >= 10) return value.trim();
  return "";
}

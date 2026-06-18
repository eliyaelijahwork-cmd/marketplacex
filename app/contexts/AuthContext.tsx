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
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { SupplierProfile } from "@/app/data/marketplace";
import { ensureUserProfile, listenToUserProfile } from "@/app/lib/firebase/marketplace";
import { firebaseConfigMissing, getFirebaseAuth } from "@/app/lib/firebase/client";

type AuthContextValue = {
  user: User | null;
  profile: SupplierProfile | null;
  loading: boolean;
  error: string;
  firebaseReady: boolean;
  loginWithGoogle: () => Promise<void>;
  sendOtp: (phoneNumber: string) => Promise<void>;
  verifyOtp: (code: string) => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<SupplierProfile | null>(null);
  const [loading, setLoading] = useState(!firebaseConfigMissing);
  const [error, setError] = useState(
    firebaseConfigMissing ? "Firebase is not configured. Add root .env.local values." : "",
  );
  const confirmationRef = useRef<ConfirmationResult | null>(null);
  const recaptchaRef = useRef<RecaptchaVerifier | null>(null);

  useEffect(() => {
    if (firebaseConfigMissing) {
      return;
    }

    const auth = getFirebaseAuth();
    return onAuthStateChanged(auth, async (nextUser) => {
      setUser(nextUser);
      if (nextUser) {
        try {
          await ensureUserProfile(nextUser);
        } catch (reason) {
          console.error(reason);
          setError("Signed in, but could not sync the Firestore profile.");
        }
      } else {
        setProfile(null);
      }
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    if (!user || firebaseConfigMissing) {
      return undefined;
    }

    return listenToUserProfile(
      user.uid,
      setProfile,
      (message) => setError(message),
    );
  }, [user]);

  const loginWithGoogle = useCallback(async () => {
    setError("");
    if (firebaseConfigMissing) {
      setError("Firebase is not configured. Add root .env.local values.");
      return;
    }

    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(getFirebaseAuth(), provider);
      await ensureUserProfile(result.user);
    } catch (reason) {
      console.error(reason);
      setError("Google sign-in failed. Check provider setup in Firebase Authentication.");
    }
  }, []);

  const sendOtp = useCallback(async (phoneNumber: string) => {
    setError("");
    if (firebaseConfigMissing) {
      setError("Firebase is not configured. Add root .env.local values.");
      return;
    }

    const formattedPhone = formatPhone(phoneNumber);
    if (!formattedPhone) {
      setError("Enter a valid Indian mobile number.");
      return;
    }

    try {
      const auth = getFirebaseAuth();
      if (!recaptchaRef.current) {
        recaptchaRef.current = new RecaptchaVerifier(auth, "recaptcha-container", {
          size: "invisible",
        });
      }
      confirmationRef.current = await signInWithPhoneNumber(
        auth,
        formattedPhone,
        recaptchaRef.current,
      );
    } catch (reason) {
      console.error(reason);
      recaptchaRef.current?.clear();
      recaptchaRef.current = null;
      setError("OTP could not be sent. Enable Phone Authentication and test numbers in Firebase.");
    }
  }, []);

  const verifyOtp = useCallback(async (code: string) => {
    setError("");
    if (!confirmationRef.current) {
      setError("Request an OTP first.");
      return;
    }

    try {
      const result = await confirmationRef.current.confirm(code);
      await ensureUserProfile(result.user);
      confirmationRef.current = null;
    } catch (reason) {
      console.error(reason);
      setError("The OTP code is incorrect or expired.");
    }
  }, []);

  const logout = useCallback(async () => {
    setError("");
    if (firebaseConfigMissing) {
      setUser(null);
      setProfile(null);
      return;
    }

    await signOut(getFirebaseAuth());
  }, []);

  const value = useMemo(
    () => ({
      user,
      profile,
      loading,
      error,
      firebaseReady: !firebaseConfigMissing,
      loginWithGoogle,
      sendOtp,
      verifyOtp,
      logout,
      clearError: () => setError(""),
    }),
    [error, loading, loginWithGoogle, logout, profile, sendOtp, user, verifyOtp],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) {
    throw new Error("useAuth must be used inside AuthProvider.");
  }
  return value;
}

function formatPhone(value: string) {
  const digits = value.replace(/\D/g, "");
  if (digits.length === 10) {
    return `+91${digits}`;
  }
  if (digits.length === 12 && digits.startsWith("91")) {
    return `+${digits}`;
  }
  if (value.trim().startsWith("+") && digits.length >= 10) {
    return value.trim();
  }
  return "";
}

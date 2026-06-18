"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { useAuth } from "@/app/contexts/AuthContext";

type AuthFormProps = {
  mode: "login" | "signup";
};

const inputClass =
  "rounded-md border border-slate-300 px-3 py-2.5 outline-none transition focus:border-cyan-600 focus:ring-2 focus:ring-cyan-100";

export default function AuthForm({ mode }: AuthFormProps) {
  const isSignup = mode === "signup";
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirect") ?? "/supplier-dashboard";
  const { user, loading, error, firebaseReady, loginWithGoogle, sendOtp, verifyOtp, clearError } =
    useAuth();
  const [phoneNumber, setPhoneNumber] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState("");

  useEffect(() => {
    if (!loading && user) {
      router.replace(redirectTo);
    }
  }, [loading, redirectTo, router, user]);

  async function handleGoogleLogin() {
    setSubmitting(true);
    setStatus("");
    await loginWithGoogle();
    setSubmitting(false);
  }

  async function handleOtpRequest(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    clearError();
    setSubmitting(true);
    setStatus("");
    await sendOtp(phoneNumber);
    setOtpSent(true);
    setStatus("OTP sent. Enter the verification code to continue.");
    setSubmitting(false);
  }

  async function handleOtpVerify(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    clearError();
    setSubmitting(true);
    await verifyOtp(otp);
    setSubmitting(false);
  }

  return (
    <section className="mx-auto grid min-h-[72vh] w-full max-w-7xl place-items-center px-4 py-12 sm:px-6 lg:px-8">
      <div className="grid w-full max-w-5xl overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm lg:grid-cols-[0.9fr_1.1fr]">
        <div className="bg-[#06323f] p-8 text-white">
          <p className="text-sm font-bold uppercase text-cyan-200">
            {isSignup ? "Supplier onboarding" : "Supplier login"}
          </p>
          <h1 className="mt-4 text-3xl font-black leading-tight">
            {isSignup ? "Create your supplier account" : "Access your supplier tools"}
          </h1>
          <p className="mt-4 leading-7 text-cyan-50">
            Post materials, keep your profile current, and receive buyer calls directly through
            MarketPlaceX.
          </p>
          <div className="mt-8 grid gap-3 text-sm font-semibold text-cyan-50">
            <p className="flex items-center gap-2">
              <Icon path="m5 12 4 4L19 6" />
              Google Sign-In for quick access
            </p>
            <p className="flex items-center gap-2">
              <Icon path="M22 16.92v3a2 2 0 0 1-2.18 2 19.8 19.8 0 0 1-8.63-3.07A19.5 19.5 0 0 1 3.16 10.8 19.8 19.8 0 0 1 .09 2.18 2 2 0 0 1 2.06 0h3a2 2 0 0 1 2 1.72c.13 1 .36 1.96.7 2.88a2 2 0 0 1-.45 2.11L6.1 7.9a16 16 0 0 0 6 6l1.19-1.19a2 2 0 0 1 2.11-.45c.92.34 1.88.57 2.88.7A2 2 0 0 1 22 16.92Z" />
              Phone OTP for mobile-first suppliers
            </p>
            <p className="flex items-center gap-2">
              <Icon path="M12 3 5 6v5c0 4.6 2.9 8.7 7 10 4.1-1.3 7-5.4 7-10V6l-7-3Z" />
              Firestore profile created after sign-in
            </p>
          </div>
        </div>

        <div className="p-6 sm:p-8">
          {!firebaseReady && (
            <div className="mb-5 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm font-semibold text-amber-900">
              Firebase env values are missing at the project root. The UI is ready, but sign-in
              needs `.env.local` and enabled Firebase providers.
            </div>
          )}

          <button
            className="flex w-full items-center justify-center gap-2 rounded-md border border-slate-300 px-5 py-3 font-bold text-slate-900 transition hover:border-cyan-500 hover:text-cyan-700 disabled:cursor-wait disabled:opacity-70"
            disabled={submitting || !firebaseReady}
            onClick={handleGoogleLogin}
            type="button"
          >
            <Icon path="M20.64 12.2c0-.64-.06-1.25-.17-1.84H12v3.48h4.84a4.14 4.14 0 0 1-1.79 2.72v2.26h2.9c1.7-1.56 2.69-3.87 2.69-6.62Z" />
            Continue with Google
          </button>

          <div className="my-6 flex items-center gap-3 text-xs font-bold uppercase text-slate-400">
            <span className="h-px flex-1 bg-slate-200" />
            or use phone OTP
            <span className="h-px flex-1 bg-slate-200" />
          </div>

          <form className="grid gap-4" onSubmit={handleOtpRequest}>
            <label className="grid gap-2">
              <span className="text-sm font-bold text-slate-700">Phone number</span>
              <input
                className={inputClass}
                inputMode="tel"
                onChange={(event) => setPhoneNumber(event.target.value)}
                placeholder="+91 98765 43210"
                required
                type="tel"
                value={phoneNumber}
              />
            </label>
            <button
              className="rounded-md bg-cyan-700 px-5 py-3 font-bold text-white transition hover:bg-cyan-800 disabled:cursor-wait disabled:opacity-70"
              disabled={submitting || !firebaseReady}
              type="submit"
            >
              {otpSent ? "Send OTP again" : "Send OTP"}
            </button>
          </form>

          {otpSent && (
            <form className="mt-5 grid gap-4" onSubmit={handleOtpVerify}>
              <label className="grid gap-2">
                <span className="text-sm font-bold text-slate-700">Verification code</span>
                <input
                  className={inputClass}
                  inputMode="numeric"
                  maxLength={6}
                  onChange={(event) => setOtp(event.target.value)}
                  placeholder="123456"
                  required
                  value={otp}
                />
              </label>
              <button
                className="rounded-md bg-slate-950 px-5 py-3 font-bold text-white transition hover:bg-slate-800 disabled:cursor-wait disabled:opacity-70"
                disabled={submitting || !firebaseReady}
                type="submit"
              >
                Verify and continue
              </button>
            </form>
          )}

          <div id="recaptcha-container" />

          {(status || error) && (
            <p
              className={`mt-5 rounded-md p-3 text-sm font-semibold ${
                error ? "bg-red-50 text-red-700" : "bg-emerald-50 text-emerald-700"
              }`}
            >
              {error || status}
            </p>
          )}

          <p className="mt-6 text-sm text-slate-600">
            {isSignup ? "Already listed on MarketPlaceX?" : "New supplier?"}{" "}
            <Link
              className="font-bold text-cyan-700 transition hover:text-cyan-900"
              href={isSignup ? "/login" : "/signup"}
            >
              {isSignup ? "Log in" : "Create account"}
            </Link>
          </p>
        </div>
      </div>
    </section>
  );
}

function Icon({ path }: { path: string }) {
  return (
    <svg
      aria-hidden="true"
      className="h-5 w-5 shrink-0"
      fill="none"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d={path}
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      />
    </svg>
  );
}

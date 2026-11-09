"use client";

import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { getFirebaseAuth } from "@/app/lib/firebase/client";

export default function AdminLoginPage() {
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const router = useRouter();

  async function login() {
    setBusy(true); setError("");
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: "select_account" });
      const credential = await signInWithPopup(getFirebaseAuth(), provider);
      const response = await fetch("/api/admin/session", {
        method: "POST",
        headers: { Authorization: `Bearer ${await credential.user.getIdToken(true)}` },
      });
      if (!response.ok) {
        await getFirebaseAuth().signOut();
        const result = await response.json();
        throw new Error(result.error || "Administrator sign-in failed.");
      }
      router.replace("/admin");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Administrator sign-in failed.");
    } finally { setBusy(false); }
  }

  return <main className="mx-auto grid min-h-[70vh] max-w-xl place-items-center px-4 py-12">
    <section className="w-full rounded-xl border bg-white p-8 shadow-sm">
      <h1 className="text-3xl font-black">MarketPlaceX Admin</h1>
      <p className="mt-3 text-slate-600">Use the authorized, verified administrator Google account.</p>
      <button className="mt-6 w-full rounded-md bg-slate-950 px-5 py-3 font-bold text-white disabled:opacity-60" disabled={busy} onClick={() => void login()}>{busy ? "Signing in�" : "Sign in with Google"}</button>
      {error && <p role="alert" className="mt-4 text-sm font-semibold text-red-700">{error}</p>}
    </section>
  </main>;
}

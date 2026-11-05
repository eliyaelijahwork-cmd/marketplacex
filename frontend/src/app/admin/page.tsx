
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase";

const ADMIN_EMAIL = "YOUR_ADMIN_GMAIL@gmail.com";

export default function AdminPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.replace("/admin/login");
        return;
      }

      const token = await user.getIdTokenResult(true);

      const allowed =
        user.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase() &&
        user.emailVerified &&
        token.claims.email_verified === true;

      if (!allowed) {
        await auth.signOut();
        router.replace("/admin/login");
        return;
      }

      setLoading(false);
    });

    return () => unsubscribe();
  }, [router]);

  if (loading) return <p>Verifying administrator access...</p>;

  return (
    <main>
      <h1>MarketPlaceX Admin Dashboard</h1>
      {/* Your existing admin dashboard */}
    </main>
  );
}


"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { useAuth } from "@/app/contexts/AuthContext";

export default function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.replace(`/login?redirect=${encodeURIComponent(pathname)}`);
    }
  }, [loading, pathname, router, user]);

  if (loading) {
    return (
      <main className="mx-auto grid min-h-[60vh] w-full max-w-4xl place-items-center px-4 py-16 sm:px-6 lg:px-8">
        <div className="w-full rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:p-6 lg:p-8">
          <div className="h-7 w-48 animate-pulse rounded bg-slate-200" />
          <div className="mt-5 grid gap-3">
            <div className="h-4 animate-pulse rounded bg-slate-200" />
            <div className="h-4 w-2/3 animate-pulse rounded bg-slate-200" />
          </div>
        </div>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="mx-auto grid min-h-[60vh] w-full max-w-4xl place-items-center px-4 py-16 text-center sm:px-6 lg:px-8">
        <div className="w-full rounded-lg border border-slate-200 bg-white p-6 shadow-sm sm:p-10">
          <h1 className="text-2xl font-black text-slate-950 sm:text-3xl">Supplier login required</h1>
          <p className="mt-3 text-slate-600">Sign in before posting or managing materials.</p>
          <Link
            className="mt-6 inline-flex w-full justify-center rounded-md bg-cyan-700 px-5 py-3 font-black text-white sm:w-auto"
            href={`/login?redirect=${encodeURIComponent(pathname)}`}
          >
            Continue to login
          </Link>
        </div>
      </main>
    );
  }

  return <>{children}</>;
}

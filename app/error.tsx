"use client";

import { useEffect } from "react";

export default function ErrorPage({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="mx-auto grid min-h-[60vh] w-full max-w-4xl place-items-center px-4 py-16 text-center sm:px-6 lg:px-8">
      <div className="rounded-lg border border-slate-200 bg-white p-10 shadow-sm">
        <p className="text-sm font-black uppercase text-red-600">Something went wrong</p>
        <h1 className="mt-3 text-3xl font-black text-slate-950">MarketPlaceX hit an error.</h1>
        <p className="mt-3 text-slate-600">Try again, or return to the marketplace listings.</p>
        <button
          className="mt-6 rounded-md bg-cyan-700 px-5 py-3 font-black text-white transition hover:bg-cyan-800"
          onClick={() => unstable_retry()}
          type="button"
        >
          Try again
        </button>
      </div>
    </main>
  );
}

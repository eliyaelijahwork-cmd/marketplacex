"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { FormEvent } from "react";
import { formatCurrency } from "../data/marketplace";
import { cartSubtotal, type CartLine, readCart, writeCart } from "./cart-storage";

const inputClass =
  "w-full min-w-0 rounded-md border border-slate-300 px-3 py-2 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100";

export default function CheckoutForm() {
  const [lines] = useState<CartLine[]>(() =>
    typeof window === "undefined" ? [] : readCart(),
  );
  const [submitted, setSubmitted] = useState(false);

  const subtotal = useMemo(() => cartSubtotal(lines), [lines]);
  const delivery = lines.length > 0 ? 45 : 0;
  const total = subtotal + delivery + subtotal * 0.03;

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitted(true);
    writeCart([]);
  }

  if (submitted) {
    return (
      <section className="mx-auto w-full max-w-3xl px-4 py-16 text-center sm:px-6 lg:px-8">
        <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm sm:p-10">
          <p className="text-sm font-semibold uppercase tracking-wide text-blue-700">
            Order received
          </p>
          <h1 className="mt-3 text-2xl font-bold text-slate-950 sm:text-3xl">
            Your request has been sent to suppliers.
          </h1>
          <p className="mt-3 text-slate-600">
            A MarketPlaceX coordinator will confirm stock, delivery, and final
            pricing before dispatch.
          </p>
          <Link
            className="mt-6 inline-flex w-full justify-center rounded-md bg-blue-700 px-5 py-3 font-semibold text-white transition hover:bg-blue-800 sm:w-auto"
            href="/categories"
          >
            Continue shopping
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="mx-auto grid w-full max-w-7xl grid-cols-1 gap-8 px-4 py-8 sm:px-6 sm:py-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,22.5rem)] lg:px-8">
      <div className="min-w-0">
        <p className="text-sm font-semibold uppercase tracking-wide text-blue-700">
          Checkout
        </p>
        <h1 className="mt-3 text-3xl font-bold text-slate-950 sm:text-4xl">
          Delivery and billing
        </h1>

        <form
          className="mt-8 grid gap-6 rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:p-6 lg:p-8"
          onSubmit={handleSubmit}
        >
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <label className="grid gap-2">
              <span className="text-sm font-medium text-slate-700">Full name</span>
              <input className={inputClass} required type="text" />
            </label>
            <label className="grid gap-2">
              <span className="text-sm font-medium text-slate-700">Phone</span>
              <input className={inputClass} required type="tel" />
            </label>
          </div>

          <label className="grid gap-2">
            <span className="text-sm font-medium text-slate-700">Email</span>
            <input className={inputClass} required type="email" />
          </label>

          <label className="grid gap-2">
            <span className="text-sm font-medium text-slate-700">
              Delivery address
            </span>
            <textarea className={`${inputClass} min-h-28`} required />
          </label>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <label className="grid gap-2">
              <span className="text-sm font-medium text-slate-700">
                Delivery date
              </span>
              <input className={inputClass} required type="date" />
            </label>
            <label className="grid gap-2">
              <span className="text-sm font-medium text-slate-700">
                Payment mode
              </span>
              <select className={inputClass} required>
                <option>Bank transfer</option>
                <option>Card payment</option>
                <option>Pay on delivery</option>
              </select>
            </label>
          </div>

          <button
            className="w-full rounded-md bg-blue-700 px-5 py-3 font-semibold text-white transition hover:bg-blue-800 md:w-auto"
            disabled={lines.length === 0}
            type="submit"
          >
            Place order
          </button>
        </form>
      </div>

      <aside className="h-fit max-w-full rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:p-6 lg:p-8">
        <h2 className="text-2xl font-bold text-slate-950">Order summary</h2>
        <div className="mt-5 grid gap-4">
          {lines.length === 0 ? (
            <p className="text-slate-600">No cart items yet.</p>
          ) : (
            lines.map((line) => (
              <div className="border-b border-slate-100 pb-3" key={line.slug}>
                <div className="flex min-w-0 justify-between gap-4">
                  <span className="min-w-0 break-words font-medium text-slate-950">{line.name}</span>
                  <span className="text-right">{formatCurrency(line.price * line.quantity)}</span>
                </div>
                <p className="mt-1 text-sm text-slate-500">
                  Qty {line.quantity} | {line.unit}
                </p>
              </div>
            ))
          )}
        </div>
        <div className="mt-5 grid gap-3 text-slate-700">
          <div className="flex justify-between gap-4">
            <span>Subtotal</span>
            <span className="text-right">{formatCurrency(subtotal)}</span>
          </div>
          <div className="flex justify-between gap-4">
            <span>Delivery estimate</span>
            <span className="text-right">{formatCurrency(delivery)}</span>
          </div>
          <div className="flex justify-between gap-4 border-t border-slate-200 pt-3 text-lg font-bold text-slate-950">
            <span>Total</span>
            <span className="text-right">{formatCurrency(total)}</span>
          </div>
        </div>
      </aside>
    </section>
  );
}

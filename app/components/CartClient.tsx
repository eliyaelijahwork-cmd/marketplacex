"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { formatCurrency } from "../data/marketplace";
import { cartSubtotal, type CartLine, readCart, writeCart } from "./cart-storage";

export default function CartClient() {
  const [lines, setLines] = useState<CartLine[]>(() =>
    typeof window === "undefined" ? [] : readCart(),
  );

  const subtotal = useMemo(() => cartSubtotal(lines), [lines]);
  const delivery = lines.length > 0 ? 45 : 0;
  const serviceFee = subtotal * 0.03;
  const total = subtotal + delivery + serviceFee;

  function updateQuantity(slug: string, quantity: number) {
    const nextLines = lines
      .map((line) =>
        line.slug === slug
          ? { ...line, quantity: Math.max(1, quantity) }
          : line,
      )
      .filter((line) => line.quantity > 0);
    setLines(nextLines);
    writeCart(nextLines);
  }

  function removeLine(slug: string) {
    const nextLines = lines.filter((line) => line.slug !== slug);
    setLines(nextLines);
    writeCart(nextLines);
  }

  if (lines.length === 0) {
    return (
      <section className="mx-auto w-full max-w-4xl px-4 py-16 text-center sm:px-6 lg:px-8">
        <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm sm:p-10">
          <h1 className="text-2xl font-bold text-slate-950 sm:text-3xl">Your cart is empty</h1>
          <p className="mt-3 text-slate-600">
            Add products from the catalog to build your construction material
            order.
          </p>
          <Link
            className="mt-6 inline-flex w-full justify-center rounded-md bg-blue-700 px-5 py-3 font-semibold text-white transition hover:bg-blue-800 sm:w-auto"
            href="/categories"
          >
            Browse categories
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="mx-auto grid w-full max-w-7xl grid-cols-1 gap-8 px-4 py-8 sm:px-6 sm:py-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,22.5rem)] lg:px-8">
      <div className="min-w-0">
        <h1 className="text-3xl font-bold text-slate-950 sm:text-4xl">Cart</h1>
        <div className="mt-6 grid gap-4">
          {lines.map((line) => (
            <article
              className="grid grid-cols-1 gap-4 rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:p-5 md:grid-cols-[minmax(0,1fr)_auto]"
              key={line.slug}
            >
              <div className="min-w-0">
                <h2 className="text-xl font-semibold text-slate-950">
                  {line.name}
                </h2>
                <p className="mt-1 text-slate-600">
                  {formatCurrency(line.price)} {line.unit}
                </p>
              </div>

              <div className="flex flex-col gap-3 md:flex-row md:flex-wrap md:items-center">
                <label className="flex w-full items-center justify-between gap-2 rounded-md border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 md:w-auto">
                  Qty
                  <input
                    aria-label={`${line.name} cart quantity`}
                    className="w-16 text-right outline-none"
                    min={1}
                    onChange={(event) =>
                      updateQuantity(line.slug, Number(event.target.value) || 1)
                    }
                    type="number"
                    value={line.quantity}
                  />
                </label>
                <p className="text-left font-bold text-slate-950 md:min-w-24 md:text-right">
                  {formatCurrency(line.price * line.quantity)}
                </p>
                <button
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:border-blue-600 hover:text-blue-700 md:w-auto"
                  onClick={() => removeLine(line.slug)}
                  type="button"
                >
                  Remove
                </button>
              </div>
            </article>
          ))}
        </div>
      </div>

      <aside className="h-fit max-w-full rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:p-6 lg:p-8">
        <h2 className="text-2xl font-bold text-slate-950">Order summary</h2>
        <div className="mt-5 grid gap-3 text-slate-700">
          <div className="flex justify-between gap-4">
            <span>Subtotal</span>
            <span className="text-right">{formatCurrency(subtotal)}</span>
          </div>
          <div className="flex justify-between gap-4">
            <span>Delivery estimate</span>
            <span className="text-right">{formatCurrency(delivery)}</span>
          </div>
          <div className="flex justify-between gap-4">
            <span>Service fee</span>
            <span className="text-right">{formatCurrency(serviceFee)}</span>
          </div>
          <div className="border-t border-slate-200 pt-3">
            <div className="flex justify-between gap-4 text-lg font-bold text-slate-950">
              <span>Total</span>
              <span className="text-right">{formatCurrency(total)}</span>
            </div>
          </div>
        </div>
        <Link
          className="mt-6 block w-full rounded-md bg-blue-700 px-5 py-3 text-center font-semibold text-white transition hover:bg-blue-800"
          href="/checkout"
        >
          Continue to checkout
        </Link>
      </aside>
    </section>
  );
}

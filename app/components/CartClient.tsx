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
        <div className="rounded-lg border border-slate-200 bg-white p-10 shadow-sm">
          <h1 className="text-3xl font-bold text-slate-950">Your cart is empty</h1>
          <p className="mt-3 text-slate-600">
            Add products from the catalog to build your construction material
            order.
          </p>
          <Link
            className="mt-6 inline-flex rounded-md bg-blue-700 px-5 py-3 font-semibold text-white transition hover:bg-blue-800"
            href="/categories"
          >
            Browse categories
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="mx-auto grid w-full max-w-7xl gap-8 px-4 py-12 sm:px-6 lg:grid-cols-[1fr_360px] lg:px-8">
      <div>
        <h1 className="text-4xl font-bold text-slate-950">Cart</h1>
        <div className="mt-6 grid gap-4">
          {lines.map((line) => (
            <article
              className="grid gap-4 rounded-lg border border-slate-200 bg-white p-5 shadow-sm md:grid-cols-[1fr_auto]"
              key={line.slug}
            >
              <div>
                <h2 className="text-xl font-semibold text-slate-950">
                  {line.name}
                </h2>
                <p className="mt-1 text-slate-600">
                  {formatCurrency(line.price)} {line.unit}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <label className="flex items-center gap-2 rounded-md border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700">
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
                <p className="min-w-24 text-right font-bold text-slate-950">
                  {formatCurrency(line.price * line.quantity)}
                </p>
                <button
                  className="rounded-md border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:border-blue-600 hover:text-blue-700"
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

      <aside className="h-fit rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-2xl font-bold text-slate-950">Order summary</h2>
        <div className="mt-5 grid gap-3 text-slate-700">
          <div className="flex justify-between gap-4">
            <span>Subtotal</span>
            <span>{formatCurrency(subtotal)}</span>
          </div>
          <div className="flex justify-between gap-4">
            <span>Delivery estimate</span>
            <span>{formatCurrency(delivery)}</span>
          </div>
          <div className="flex justify-between gap-4">
            <span>Service fee</span>
            <span>{formatCurrency(serviceFee)}</span>
          </div>
          <div className="border-t border-slate-200 pt-3">
            <div className="flex justify-between gap-4 text-lg font-bold text-slate-950">
              <span>Total</span>
              <span>{formatCurrency(total)}</span>
            </div>
          </div>
        </div>
        <Link
          className="mt-6 block rounded-md bg-blue-700 px-5 py-3 text-center font-semibold text-white transition hover:bg-blue-800"
          href="/checkout"
        >
          Continue to checkout
        </Link>
      </aside>
    </section>
  );
}

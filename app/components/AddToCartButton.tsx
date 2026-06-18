"use client";

import { useState } from "react";
import type { Product } from "../data/marketplace";
import { addProductToCart } from "./cart-storage";

type AddToCartButtonProps = {
  product: Product;
  compact?: boolean;
  variant?: "full" | "compact" | "icon";
};

export default function AddToCartButton({
  product,
  compact = false,
  variant = "full",
}: AddToCartButtonProps) {
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);

  function handleAdd() {
    addProductToCart(product, quantity);
    setAdded(true);
    window.setTimeout(() => setAdded(false), 1600);
  }

  if (variant === "icon") {
    return (
      <button
        aria-label={`Add ${product.name} to cart`}
        className="grid h-10 w-10 place-items-center rounded-md bg-blue-700 text-white shadow-sm transition hover:bg-blue-800"
        onClick={handleAdd}
        type="button"
      >
        {added ? (
          <svg
            aria-hidden="true"
            className="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="m5 12 4 4L19 6"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
            />
          </svg>
        ) : (
          <svg
            aria-hidden="true"
            className="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M6 6h15l-1.5 8.5H8L6 3H3m6 18a1 1 0 1 0 0-2 1 1 0 0 0 0 2Zm9 0a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
            />
          </svg>
        )}
      </button>
    );
  }

  const isCompact = compact || variant === "compact";

  return (
    <div className={isCompact ? "grid gap-2" : "flex flex-col gap-3 sm:flex-row"}>
      <label className="flex items-center justify-between gap-3 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700">
        Qty
        <input
          aria-label={`${product.name} quantity`}
          className="w-16 bg-transparent text-right text-slate-950 outline-none"
          min={1}
          onChange={(event) =>
            setQuantity(Math.max(1, Number(event.target.value) || 1))
          }
          type="number"
          value={quantity}
        />
      </label>

      <button
        className="rounded-md bg-blue-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-800"
        onClick={handleAdd}
        type="button"
      >
        {added ? "Added" : "Add to cart"}
      </button>
    </div>
  );
}

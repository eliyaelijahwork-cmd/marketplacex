import type { Product } from "../data/marketplace";

export type CartLine = {
  slug: string;
  name: string;
  price: number;
  unit: string;
  quantity: number;
};

const cartKey = "marketplacex-cart";

export function readCart(): CartLine[] {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const stored = window.localStorage.getItem(cartKey);
    return stored ? (JSON.parse(stored) as CartLine[]) : [];
  } catch {
    return [];
  }
}

export function writeCart(lines: CartLine[]) {
  window.localStorage.setItem(cartKey, JSON.stringify(lines));
  window.dispatchEvent(new CustomEvent("marketplacex-cart-updated"));
}

export function addProductToCart(product: Product, quantity: number) {
  const safeQuantity = Math.max(1, quantity);
  const lines = readCart();
  const existing = lines.find((line) => line.slug === product.slug);

  if (existing) {
    existing.quantity += safeQuantity;
  } else {
    lines.push({
      slug: product.slug,
      name: product.name,
      price: product.price,
      unit: product.unit,
      quantity: safeQuantity,
    });
  }

  writeCart(lines);
}

export function cartSubtotal(lines: CartLine[]) {
  return lines.reduce((total, line) => total + line.price * line.quantity, 0);
}

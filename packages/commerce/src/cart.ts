import type { CartLine, CartSnapshot } from "./types";

export const CART_COOKIE_NAME = "nx_cart_v1";
export const CART_COOKIE_MAX_AGE = 60 * 60 * 24 * 14;

export function parseCartCookie(raw: string | undefined | null): CartSnapshot {
  if (!raw?.trim()) return { lines: [] };
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object") return { lines: [] };
    const linesRaw = (parsed as { lines?: unknown }).lines;
    if (!Array.isArray(linesRaw)) return { lines: [] };
    const lines: CartLine[] = [];
    for (const item of linesRaw) {
      if (!item || typeof item !== "object") continue;
      const productId = String((item as CartLine).productId ?? "").trim();
      const variantId = String((item as CartLine).variantId ?? "").trim() || undefined;
      const quantity = Math.floor(Number((item as CartLine).quantity));
      if (!productId || quantity < 1) continue;
      lines.push({ productId, variantId, quantity: Math.min(quantity, 99) });
    }
    return { lines: mergeCartLines(lines) };
  } catch {
    return { lines: [] };
  }
}

export function serializeCartCookie(cart: CartSnapshot): string {
  return JSON.stringify({ lines: mergeCartLines(cart.lines) });
}

function lineKey(line: CartLine): string {
  return `${line.productId}::${line.variantId ?? ""}`;
}

export function mergeCartLines(lines: CartLine[]): CartLine[] {
  const map = new Map<string, CartLine>();
  for (const line of lines) {
    const key = lineKey(line);
    const prev = map.get(key);
    map.set(key, {
      productId: line.productId,
      variantId: line.variantId,
      quantity: Math.min((prev?.quantity ?? 0) + line.quantity, 99),
    });
  }
  return [...map.values()];
}

export function addToCart(
  cart: CartSnapshot,
  productId: string,
  quantity = 1,
  variantId?: string
): CartSnapshot {
  return { lines: mergeCartLines([...cart.lines, { productId, variantId, quantity }]) };
}

export function setCartLineQuantity(
  cart: CartSnapshot,
  productId: string,
  quantity: number,
  variantId?: string
): CartSnapshot {
  const same = (line: CartLine) =>
    line.productId === productId && (line.variantId ?? "") === (variantId ?? "");
  if (quantity < 1) {
    return { lines: cart.lines.filter((line) => !same(line)) };
  }
  return {
    lines: mergeCartLines([...cart.lines.filter((line) => !same(line)), { productId, variantId, quantity }]),
  };
}

export function cartItemCount(cart: CartSnapshot): number {
  return cart.lines.reduce((sum, l) => sum + l.quantity, 0);
}

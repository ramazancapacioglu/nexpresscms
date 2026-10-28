import { cookies } from "next/headers";
import {
  CART_COOKIE_MAX_AGE,
  CART_COOKIE_NAME,
  parseCartCookie,
  serializeCartCookie,
  type CartSnapshot,
} from "@nexpress/commerce";

export async function readCartFromCookies(): Promise<CartSnapshot> {
  const jar = await cookies();
  return parseCartCookie(jar.get(CART_COOKIE_NAME)?.value);
}

export async function writeCartToCookies(cart: CartSnapshot): Promise<void> {
  const jar = await cookies();
  jar.set(CART_COOKIE_NAME, serializeCartCookie(cart), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: CART_COOKIE_MAX_AGE,
  });
}

export async function clearCartCookies(): Promise<void> {
  const jar = await cookies();
  jar.delete(CART_COOKIE_NAME);
}

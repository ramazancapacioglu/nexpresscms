"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { getCommerceOpsRepository, getCommerceRepository } from "@nexpress/database";
import {
  addToCart,
  setCartLineQuantity,
  type CommerceAddress,
} from "@nexpress/commerce";
import {
  clearCartCookies,
  readCartFromCookies,
  writeCartToCookies,
} from "@/lib/commerce/cart-server";

async function siteIdFromHeaders(): Promise<string> {
  const reqHeaders = await headers();
  return reqHeaders.get("x-nexpress-site-id") ?? "default";
}

export async function addToCartAction(formData: FormData) {
  const productId = String(formData.get("productId") ?? "");
  const locale = String(formData.get("locale") ?? "tr");
  const qty = Math.min(99, Math.max(1, Number(formData.get("quantity") ?? 1)));
  const variantId = String(formData.get("variantId") ?? "").trim() || undefined;
  if (!productId) return;

  const cart = await readCartFromCookies();
  await writeCartToCookies(addToCart(cart, productId, qty, variantId));
  redirect(`/${locale}/magaza/sepet`);
}

export async function updateCartLineAction(formData: FormData) {
  const productId = String(formData.get("productId") ?? "");
  const locale = String(formData.get("locale") ?? "tr");
  const qty = Math.floor(Number(formData.get("quantity") ?? 0));
  const variantId = String(formData.get("variantId") ?? "").trim() || undefined;
  if (!productId) return;

  const cart = await readCartFromCookies();
  await writeCartToCookies(setCartLineQuantity(cart, productId, qty, variantId));
  redirect(`/${locale}/magaza/sepet`);
}

export async function checkoutAction(formData: FormData) {
  const locale = String(formData.get("locale") ?? "tr");
  const repo = getCommerceRepository(await siteIdFromHeaders());
  const settings = await repo.getCommerceSettings();
  if (!settings.enabled) {
    redirect(`/${locale}/magaza`);
  }

  const cart = await readCartFromCookies();
  if (cart.lines.length === 0) {
    redirect(`/${locale}/magaza/sepet`);
  }

  const siteId = await siteIdFromHeaders();
  const ops = getCommerceOpsRepository(siteId);
  const products = await repo.getProductsByIds(cart.lines.map((line) => line.productId));
  let subtotal = 0;
  for (const line of cart.lines) {
    const product = products.find((item) => item.id === line.productId);
    if (!product) continue;
    const variants = line.variantId ? await ops.listVariants(product.id) : [];
    const variant = variants.find((item) => item.id === line.variantId);
    subtotal += (variant?.priceCents ?? product.priceCents) * line.quantity;
  }

  const customerName = String(formData.get("customerName") ?? "").trim();
  const customerEmail = String(formData.get("customerEmail") ?? "").trim();
  const customerId = await ops.upsertCustomer({
    source: "site",
    name: customerName,
    email: customerEmail,
    phone: String(formData.get("customerPhone") ?? "").trim() || null,
    externalKey: customerEmail || null,
  });
  const couponCode = String(formData.get("couponCode") ?? "").trim();
  const quote = couponCode
    ? await ops.quoteCoupon(couponCode, subtotal, customerId)
    : { discountCents: 0, coupon: null };
  const methods = await ops.listShipping();
  const shippingMethodId = String(formData.get("shippingMethodId") ?? "");
  const method = methods.find((item) => item.id === shippingMethodId && item.enabled);
  let shippingCents = method
    ? subtotal >= method.freeThresholdCents
      ? 0
      : method.flatRateCents
    : undefined;
  if (quote.coupon?.discountType === "free_shipping") shippingCents = 0;

  const shippingAddress: CommerceAddress = {
    line1: String(formData.get("line1") ?? "").trim(),
    line2: String(formData.get("line2") ?? "").trim() || undefined,
    city: String(formData.get("city") ?? "").trim(),
    region: String(formData.get("region") ?? "").trim() || undefined,
    postalCode: String(formData.get("postalCode") ?? "").trim(),
    country: String(formData.get("country") ?? "TR").trim(),
  };

  const order = await repo.createOrderFromCart({
    customerName: String(formData.get("customerName") ?? "").trim(),
    customerEmail: String(formData.get("customerEmail") ?? "").trim(),
    customerPhone: String(formData.get("customerPhone") ?? "").trim() || undefined,
    customerNote: String(formData.get("customerNote") ?? "").trim() || undefined,
    shippingAddress,
    customerId,
    couponCode: quote.coupon ? couponCode : undefined,
    discountCents: quote.discountCents,
    shippingCents,
    shippingMethodId: method?.id,
    lines: cart.lines,
  });
  if (quote.coupon) await ops.consumeCoupon(couponCode);
  await ops.addLoyalty(customerId, Math.floor(order.totalCents / 100), `Sipariş ${order.orderNumber}`);

  await clearCartCookies();
  redirect(`/${locale}/magaza/tesekkurler?no=${encodeURIComponent(order.orderNumber)}`);
}

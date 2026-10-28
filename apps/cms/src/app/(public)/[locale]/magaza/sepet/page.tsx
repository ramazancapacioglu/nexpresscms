import React from "react";
import { createTranslator } from "@nexpress/i18n";
import { Link } from "@/components/public/link";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { getCommerceRepository } from "@nexpress/database";
import { formatMoney } from "@nexpress/commerce";
import { readCartFromCookies } from "@/lib/commerce/cart-server";
import { shopBasePath } from "@/lib/commerce/shop-paths";
import { updateCartLineAction } from "../actions";

export const dynamic = "force-dynamic";

export default async function ShopCartPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = createTranslator(locale);
  const reqHeaders = await headers();
  const siteId = reqHeaders.get("x-nexpress-site-id") ?? "default";
  const repo = getCommerceRepository(siteId);
  const settings = await repo.getCommerceSettings();
  if (!settings.enabled) notFound();

  const cart = await readCartFromCookies();
  const products = await repo.getProductsByIds(cart.lines.map((l) => l.productId));
  const byId = new Map(products.map((p) => [p.id, p]));
  const base = shopBasePath(settings, locale);

  let subtotal = 0;
  const rows = cart.lines
    .map((line) => {
      const p = byId.get(line.productId);
      if (!p) return null;
      const lineTotal = p.priceCents * line.quantity;
      subtotal += lineTotal;
      return { line, p, lineTotal };
    })
    .filter(Boolean) as Array<{
    line: { productId: string; variantId?: string; quantity: number };
    p: (typeof products)[0];
    lineTotal: number;
  }>;

  const shipping =
    subtotal >= settings.freeShippingThresholdCents ? 0 : settings.flatShippingCents;
  const total = subtotal + shipping;

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="text-2xl font-semibold">{t("shop.cart")}</h1>
      {rows.length === 0 ? (
        <p className="mt-6 text-sm text-neutral-500">
          {t("shop.cartEmpty")}{" "}
          <Link href={base} className="underline">
            {t("common.backToStore")}
          </Link>
        </p>
      ) : (
        <>
          <ul className="mt-6 divide-y divide-neutral-200 dark:divide-neutral-800">
            {rows.map(({ line, p, lineTotal }) => (
              <li key={p.id} className="flex flex-wrap items-center justify-between gap-4 py-4">
                <div>
                  <Link href={`${base}/${p.slug}`} className="font-medium hover:underline">
                    {p.name}
                  </Link>
                  <p className="text-sm text-neutral-500">{formatMoney(p.priceCents, p.currency)}</p>
                </div>
                <form action={updateCartLineAction} className="flex items-center gap-2 text-sm">
                  <input type="hidden" name="productId" value={p.id} />
                  <input type="hidden" name="locale" value={locale} />
                  {line.variantId ? <input type="hidden" name="variantId" value={line.variantId} /> : null}
                  <input
                    name="quantity"
                    type="number"
                    min={0}
                    max={99}
                    defaultValue={line.quantity}
                    className="w-16 rounded border border-neutral-200 px-2 py-1 dark:border-neutral-700"
                  />
                  <button type="submit" className="underline">
                    {t("shop.update")}
                  </button>
                </form>
                <span className="text-sm font-medium">{formatMoney(lineTotal, p.currency)}</span>
              </li>
            ))}
          </ul>
          <dl className="mt-6 space-y-1 border-t border-neutral-200 pt-4 text-sm dark:border-neutral-800">
            <div className="flex justify-between">
              <dt>Ara toplam</dt>
              <dd>{formatMoney(subtotal, settings.currency)}</dd>
            </div>
            <div className="flex justify-between">
              <dt>Kargo</dt>
              <dd>{formatMoney(shipping, settings.currency)}</dd>
            </div>
            <div className="flex justify-between font-semibold">
              <dt>{t("shop.total")}</dt>
              <dd>{formatMoney(total, settings.currency)}</dd>
            </div>
          </dl>
          <Link
            href={`${base}/odeme`}
            className="mt-6 inline-block rounded-full bg-neutral-900 px-6 py-2.5 text-sm font-medium text-white dark:bg-white dark:text-neutral-900"
          >
            {t("shop.toCheckout")}
          </Link>
        </>
      )}
    </div>
  );
}

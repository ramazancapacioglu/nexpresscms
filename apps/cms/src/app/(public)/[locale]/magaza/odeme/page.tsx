import React from "react";
import { createTranslator } from "@nexpress/i18n";
import { Link } from "@/components/public/link";
import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { getCommerceOpsRepository, getCommerceRepository } from "@nexpress/database";
import { readCartFromCookies } from "@/lib/commerce/cart-server";
import { shopBasePath } from "@/lib/commerce/shop-paths";
import { checkoutAction } from "../actions";

export const dynamic = "force-dynamic";

export default async function ShopCheckoutPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = createTranslator(locale);
  const reqHeaders = await headers();
  const siteId = reqHeaders.get("x-nexpress-site-id") ?? "default";
  const repo = getCommerceRepository(siteId);
  const methods = (await getCommerceOpsRepository(siteId).listShipping()).filter((method) => method.enabled);
  const settings = await repo.getCommerceSettings();
  if (!settings.enabled) notFound();

  const cart = await readCartFromCookies();
  if (cart.lines.length === 0) {
    redirect(shopBasePath(settings, locale) + "/sepet");
  }

  const base = shopBasePath(settings, locale);

  return (
    <div className="mx-auto max-w-lg px-4 py-10">
      <p className="mb-4 text-sm">
        <Link href={`${base}/sepet`} className="text-neutral-500 hover:underline">
          {t("shop.backToCart")}
        </Link>
      </p>
      <h1 className="text-2xl font-semibold">{t("shop.checkout")}</h1>
      <p className="mt-1 text-sm text-neutral-500">
        {t("shop.paymentNote")}
      </p>

      <form action={checkoutAction} className="mt-8 grid gap-4 text-sm">
        <input type="hidden" name="locale" value={locale} />
        <Field label={t("shop.fullName")} name="customerName" required />
        <Field label={t("shop.email")} name="customerEmail" type="email" required />
        <Field label={t("shop.phone")} name="customerPhone" />
        <Field label={t("shop.address")} name="line1" required />
        <Field label={t("shop.address2")} name="line2" />
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={t("shop.city")} name="city" required />
          <Field label={t("shop.postalCode")} name="postalCode" required />
        </div>
        <input type="hidden" name="country" value="TR" />
        {methods.length > 0 ? (
          <label className="block">
            <span className="mb-1 block text-neutral-500">Kargo</span>
            <select
              name="shippingMethodId"
              className="w-full rounded-lg border border-neutral-200 px-3 py-2 dark:border-neutral-700 dark:bg-neutral-950"
              defaultValue={methods[0]?.id}
            >
              {methods.map((method) => (
                <option key={method.id} value={method.id}>
                  {method.name}
                  {method.carrier ? ` · ${method.carrier}` : ""}
                </option>
              ))}
            </select>
          </label>
        ) : null}
        <Field label={t("shop.coupon")} name="couponCode" />
        <label className="block">
          <span className="mb-1 block text-neutral-500">{t("shop.orderNote")}</span>
          <textarea
            name="customerNote"
            rows={3}
            className="w-full rounded-lg border border-neutral-200 px-3 py-2 dark:border-neutral-700 dark:bg-neutral-950"
          />
        </label>
        <button
          type="submit"
          className="rounded-full bg-neutral-900 px-6 py-2.5 font-medium text-white dark:bg-white dark:text-neutral-900"
        >
          {t("shop.placeOrder")}
        </button>
      </form>
    </div>
  );
}

function Field({
  label,
  name,
  type = "text",
  required,
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-neutral-500">{label}</span>
      <input
        name={name}
        type={type}
        required={required}
        className="w-full rounded-lg border border-neutral-200 px-3 py-2 dark:border-neutral-700 dark:bg-neutral-950"
      />
    </label>
  );
}

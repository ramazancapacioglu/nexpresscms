import React from "react";
import { createTranslator } from "@nexpress/i18n";
import type { Metadata } from "next";
import { Link } from "@/components/public/link";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { getCommerceRepository } from "@nexpress/database";
import { formatMoney, cartItemCount } from "@nexpress/commerce";
import { readCartFromCookies } from "@/lib/commerce/cart-server";
import { shopBasePath } from "@/lib/commerce/shop-paths";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return { title: `${createTranslator(locale)("shop.title")} | ${locale.toUpperCase()}` };
}

export default async function ShopIndexPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = createTranslator(locale);
  const reqHeaders = await headers();
  const siteId = reqHeaders.get("x-nexpress-site-id") ?? "default";
  const repo = getCommerceRepository(siteId);
  const [settings, products, cart] = await Promise.all([
    repo.getCommerceSettings(),
    repo.listProducts({ status: "published" }),
    readCartFromCookies(),
  ]);

  if (!settings.enabled) notFound();

  const base = shopBasePath(settings, locale);
  const count = cartItemCount(cart);

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{t("shop.title")}</h1>
          <p className="mt-1 text-sm text-neutral-500">{t("shop.subtitle")}</p>
        </div>
        <Link
          href={`${base}/sepet`}
          className="rounded-full border border-neutral-200 px-4 py-2 text-sm font-medium dark:border-neutral-700"
        >
          {t("shop.cart")}{count > 0 ? ` (${count})` : ""}
        </Link>
      </header>

      {products.length === 0 ? (
        <p className="text-sm text-neutral-500">{t("shop.empty")}</p>
      ) : (
        <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((p) => (
            <li
              key={p.id}
              className="flex flex-col overflow-hidden rounded-xl border border-neutral-200 dark:border-neutral-800"
            >
              {p.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={p.imageUrl} alt="" className="aspect-[4/3] w-full object-cover" />
              ) : (
                <div className="aspect-[4/3] bg-neutral-100 dark:bg-neutral-900" />
              )}
              <div className="flex flex-1 flex-col p-4">
                <h2 className="font-medium">
                  <Link href={`${base}/${p.slug}`} className="hover:underline">
                    {p.name}
                  </Link>
                </h2>
                {p.shortDescription ? (
                  <p className="mt-1 line-clamp-2 text-sm text-neutral-500">{p.shortDescription}</p>
                ) : null}
                <p className="mt-auto pt-3 text-sm font-semibold">
                  {formatMoney(p.priceCents, p.currency)}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

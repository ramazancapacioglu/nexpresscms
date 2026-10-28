import React from "react";
import type { Metadata } from "next";
import { Link } from "@/components/public/link";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { sanitizeInlineHtml } from "@nexpress/core";
import { getCommerceOpsRepository, getCommerceRepository } from "@nexpress/database";
import { formatMoney } from "@nexpress/commerce";
import { addToCartAction } from "../actions";
import { shopBasePath } from "@/lib/commerce/shop-paths";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const reqHeaders = await headers();
  const siteId = reqHeaders.get("x-nexpress-site-id") ?? "default";
  const product = await getCommerceRepository(siteId).getProductBySlug(slug);
  if (!product || product.status !== "published") {
    return { title: "Ürün bulunamadı" };
  }
  return {
    title: product.name,
    description: product.shortDescription || undefined,
  };
}

export default async function ShopProductPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  const reqHeaders = await headers();
  const siteId = reqHeaders.get("x-nexpress-site-id") ?? "default";
  const repo = getCommerceRepository(siteId);
  const [settings, product] = await Promise.all([
    repo.getCommerceSettings(),
    repo.getProductBySlug(slug),
  ]);

  if (!settings.enabled || !product || product.status !== "published") {
    notFound();
  }

  const variants = await getCommerceOpsRepository(siteId).listVariants(product.id);

  const base = shopBasePath(settings, locale);
  const description = sanitizeInlineHtml(product.descriptionHtml);

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <p className="mb-4 text-sm">
        <Link href={base} className="text-neutral-500 hover:underline">
          ← Mağaza
        </Link>
      </p>
      <article className="grid gap-8 md:grid-cols-2">
        {product.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={product.imageUrl}
            alt=""
            className="w-full rounded-xl border border-neutral-200 object-cover dark:border-neutral-800"
          />
        ) : (
          <div className="aspect-square rounded-xl bg-neutral-100 dark:bg-neutral-900" />
        )}
        <div>
          <h1 className="text-2xl font-semibold">{product.name}</h1>
          <p className="mt-2 text-lg font-semibold">
            {formatMoney(product.priceCents, product.currency)}
          </p>
          {product.shortDescription ? (
            <p className="mt-3 text-sm text-neutral-600 dark:text-neutral-400">
              {product.shortDescription}
            </p>
          ) : null}
          {product.stockStatus === "outofstock" ? (
            <p className="mt-4 text-sm text-red-600">Stokta yok</p>
          ) : (
            <form action={addToCartAction} className="mt-6 flex items-center gap-3">
              <input type="hidden" name="productId" value={product.id} />
              <input type="hidden" name="locale" value={locale} />
              {variants.length > 0 ? (
                <label className="text-sm">
                  Varyasyon{" "}
                  <select
                    name="variantId"
                    className="ml-1 rounded border border-neutral-200 px-2 py-1 dark:border-neutral-700"
                    defaultValue={variants[0]?.id}
                  >
                    {variants.map((variant) => (
                      <option key={variant.id} value={variant.id}>
                        {variant.sku} · {formatMoney(variant.priceCents, product.currency)}
                      </option>
                    ))}
                  </select>
                </label>
              ) : null}
              <label className="text-sm">
                Adet{" "}
                <input
                  name="quantity"
                  type="number"
                  min={1}
                  max={99}
                  defaultValue={1}
                  className="ml-1 w-16 rounded border border-neutral-200 px-2 py-1 dark:border-neutral-700"
                />
              </label>
              <button
                type="submit"
                className="rounded-full bg-neutral-900 px-5 py-2 text-sm font-medium text-white dark:bg-white dark:text-neutral-900"
              >
                Sepete ekle
              </button>
            </form>
          )}
        </div>
      </article>
      {description ? (
        <div
          className="prose prose-sm mt-10 max-w-none dark:prose-invert"
          dangerouslySetInnerHTML={{ __html: description }}
        />
      ) : null}
    </div>
  );
}

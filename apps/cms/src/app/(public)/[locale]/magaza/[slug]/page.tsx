import React from "react";
import { createTranslator } from "@nexpress/i18n";
import type { Metadata } from "next";
import { Link } from "@/components/public/link";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { sanitizeInlineHtml } from "@nexpress/core";
import { getCommerceOpsRepository, getCommerceRepository } from "@nexpress/database";
import { formatMoney } from "@nexpress/commerce";
import { addToCartAction } from "../actions";
import { shopBasePath } from "@/lib/commerce/shop-paths";
import { getThemeManifest, RscBlockRenderer } from "@nexpress/themes";
import { templateHasBlock } from "@nexpress/core";
import { getPublicSite } from "@/lib/public-data";
import { getResolvedMenu } from "@/lib/menu-data";
import { templateFor } from "@/lib/templates";
import { buildTemplateContext } from "@/lib/template-context";
import { loadDynamicData } from "@/lib/dynamic-content";
import { buildProductGraph, jsonLdString } from "@nexpress/seo-core";
import { listPublicReviews } from "@/lib/public-data";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  const reqHeaders = await headers();
  const siteId = reqHeaders.get("x-nexpress-site-id") ?? "default";
  const product = await getCommerceRepository(siteId).getProductBySlug(slug);
  if (!product || product.status !== "published") {
    return { title: createTranslator(locale)("shop.productNotFound") };
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
  const t = createTranslator(locale);
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

  // Product şeması (JSON-LD): yalnızca gerçek veri; puan yalnızca bağlı içeriğin onaylı yorumlarından
  const appUrl = (process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000").replace(/\/$/, "");
  const productUrl = `${appUrl}${base}/${product.slug}`;
  const approved = product.contentId ? (await listPublicReviews(siteId, product.contentId)).filter((r) => r.status === "approved") : [];
  const schemaJson = jsonLdString(
    buildProductGraph({
      baseUrl: appUrl,
      url: productUrl,
      name: product.name,
      description: product.shortDescription || description,
      images: [product.imageUrl, ...product.galleryUrls],
      sku: product.sku,
      priceCents: product.priceCents,
      currency: product.currency,
      stockStatus: product.stockStatus,
      variants: variants.map((v) => ({ sku: v.sku, priceCents: v.priceCents })),
      rating: approved.length ? { value: approved.reduce((n, r) => n + r.rating, 0) / approved.length, count: approved.length } : null,
      breadcrumbs: [{ name: "Ana sayfa", url: `${appUrl}/${locale}` }, { name: t("shop.title"), url: `${appUrl}${base}` }, { name: product.name, url: productUrl }],
    })
  );
  const schemaScript = <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: schemaJson }} />;

  // Tema oluşturucu: ürün şablonu. Satın alma kutusu (tpl_product_buy) yoksa ürün alınamaz: yerleşik görünüm kalır.
  const tpl = await templateFor(siteId, "product", null, { locale, contentType: "product", slug: product.slug });
  if (tpl && templateHasBlock(tpl.blocks, "tpl_product_buy")) {
    const site = await getPublicSite(siteId);
    const theme = getThemeManifest(site?.activeThemeId ?? "corporate-aurora");
    const tokens = site?.designTokens ?? theme.tokens;
    const dynamic = await loadDynamicData(siteId, locale, tpl.blocks, product.id);
    const ctx = buildTemplateContext({
      site: site ? { name: site.name, tagline: site.tagline } : null,
      locale,
      menu: await getResolvedMenu(siteId, locale),
      tokens,
      menuLabel: t("site.menu"),
      breadcrumbs: [{ name: "Ana sayfa", href: `/${locale}` }, { name: t("shop.title"), href: base }, { name: product.name, href: `${base}/${product.slug}` }],
      post: {
        title: product.name,
        content: description ? <div className="prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: description }} /> : null,
        featuredImage: product.imageUrl ? { url: product.imageUrl, alt: product.name } : null,
        date: null,
        author: null,
        categories: [],
      },
    });
    ctx.product = {
      id: product.id,
      priceLabel: formatMoney(product.priceCents, product.currency),
      compareLabel: product.compareAtCents && product.compareAtCents > product.priceCents ? formatMoney(product.compareAtCents, product.currency) : null,
      inStock: product.stockStatus !== "outofstock",
      shortDescription: product.shortDescription,
      variants: variants.map((v) => ({ id: v.id, label: `${v.sku} · ${formatMoney(v.priceCents, product.currency)}` })),
      quantityLabel: t("shop.quantity"),
      addLabel: t("shop.addToCart"),
      outOfStockLabel: t("shop.outOfStock"),
      action: addToCartAction,
    };
    return (
      <>
        {schemaScript}
        <RscBlockRenderer blocks={tpl.blocks} themeId={theme.id} tokens={tokens} locale={locale} tpl={ctx} dynamic={dynamic} />
      </>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      {schemaScript}
      <p className="mb-4 text-sm">
        <Link href={base} className="text-neutral-500 hover:underline">
          {t("shop.back")}
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
            <p className="mt-4 text-sm text-red-600">{t("shop.outOfStock")}</p>
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
                {t("shop.quantity")}{" "}
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
                {t("shop.addToCart")}
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

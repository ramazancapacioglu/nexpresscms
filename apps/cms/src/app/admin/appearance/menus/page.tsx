import React from "react";
import { headers } from "next/headers";
import { resolvePublishing } from "@nexpress/core";
import { getScopedRepository } from "@nexpress/database";
import { listStorefrontProducts } from "@/lib/plugin-gate";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { ChromeSubNav } from "@/components/admin/section-tabs";
import { MenuEditor } from "@/components/admin/appearance/menu-editor";
import type { MenuSourceLists } from "@/components/admin/appearance/menu/menu-sources";
import { requireUser } from "@/lib/auth/session";
import { loadChrome } from "../load-chrome";

export const dynamic = "force-dynamic";

export default async function MenuAppearancePage({ searchParams }: { searchParams: Promise<{ locale?: string }> }) {
  await requireUser();
  const sp = await searchParams;
  const siteId = (await headers()).get("x-nexpress-site-id") ?? "default";
  const repo = getScopedRepository(siteId);
  const chrome = await loadChrome(sp.locale);
  const [contents, taxonomies, products] = await Promise.all([
    repo.listContents({ locale: chrome.locale }),
    repo.listTaxonomies(),
    listStorefrontProducts(siteId),
  ]);
  const lists: MenuSourceLists = {
    contents: contents
      .filter((c) => c.status !== "trashed" && c.type !== "product")
      .map((c) => ({ id: c.contentId, title: c.title, slug: c.slug, type: c.type, published: c.status === "published" && resolvePublishing(c.schemaAttributes).visibility !== "private" })),
    taxonomies: taxonomies.filter((t) => t.taxonomyType === "category" || t.taxonomyType === "tag").map((t) => ({ id: t.id, name: t.name, slug: t.slug, type: t.taxonomyType as "category" | "tag" })),
    products: products.map((p) => ({ id: p.id, name: p.name, slug: p.slug, published: p.status === "published" })),
  };
  return (
    <div className="space-y-4">
      <AdminPageHeader
        title="Site İskeleti — Menüler"
        description="Birden çok menü kaydı yönetin. Birini Header’a atayın; diğerlerini Footer ve Kenar çubuğu bileşenlerinde kullanın."
        actions={<ChromeSubNav />}
      />
      <MenuEditor key={chrome.locale} menus={chrome.menus} lists={lists} locale={chrome.locale} locales={chrome.locales} defaultLocale={chrome.defaultLocale} hasOwn={chrome.hasOwn} />
    </div>
  );
}

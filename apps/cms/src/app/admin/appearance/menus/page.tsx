import React from "react";
import { headers } from "next/headers";
import { resolvePublishing } from "@nexpress/core";
import { getCommerceRepository, getScopedRepository } from "@nexpress/database";
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
    getCommerceRepository(siteId).listProducts().catch(() => []),
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
      <header className="border-b border-[#D5D8DE] pb-3 dark:border-[#2E333D]">
        <h1 className="text-[18px] font-semibold">Menüler</h1>
        <p className="text-[12px] text-[#5F6570] dark:text-[#8C9099]">
          Birden çok menü kaydı açın. Header’da birini seçin; diğerlerini footer sütununda ve kenar çubuğunda “Menü” bileşenine bağlayın. Onay kutusuyla çoklu seçim yapılır.
        </p>
      </header>
      <MenuEditor key={chrome.locale} menus={chrome.menus} lists={lists} locale={chrome.locale} locales={chrome.locales} defaultLocale={chrome.defaultLocale} hasOwn={chrome.hasOwn} />
    </div>
  );
}

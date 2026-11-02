import type { MenuLookup, MenuSource } from "@nexpress/core";

/** Menüye eklenebilecek kaynakların düz listeleri (sunucu sayfası yükler, ekleme paneli süzer). */
export interface MenuSourceLists {
  contents: Array<{ id: string; title: string; slug: string; type: string; published: boolean }>;
  taxonomies: Array<{ id: string; name: string; slug: string; type: "category" | "tag" }>;
  products: Array<{ id: string; name: string; slug: string; published: boolean }>;
}

export function buildClientLookup(lists: MenuSourceLists, locale = "tr"): MenuLookup {
  return {
    locale,
    contents: Object.fromEntries(lists.contents.map((c) => [c.id, { slug: c.slug, published: c.published }])),
    taxonomies: Object.fromEntries(lists.taxonomies.map((t) => [t.id, { slug: t.slug, type: t.type }])),
    products: Object.fromEntries(lists.products.map((p) => [p.id, { slug: p.slug, published: p.published }])),
  };
}

export const KIND_LABEL: Record<NonNullable<MenuSource["kind"]>, string> = {
  custom: "Özel bağlantı",
  home: "Ana sayfa",
  content: "İçerik",
  category: "Kategori",
  tag: "Etiket",
  store: "Mağaza",
  product: "Ürün",
};

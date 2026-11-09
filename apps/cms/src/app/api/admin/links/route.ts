import { NextResponse } from "next/server";
import { resolvePublishing } from "@nexpress/core";
import { getScopedRepository } from "@nexpress/database";
import { listStorefrontProducts } from "@/lib/plugin-gate";
import { getSession } from "@/lib/auth/session";

export const runtime = "nodejs";

/** Bağlantı seçici için site içi hedefler (yayındaki içerik, kategori, etiket, ürün). Yönetici ve editör. */
export async function GET() {
  const session = await getSession();
  const headers = { "Cache-Control": "no-store" };
  if (!session) return NextResponse.json({ ok: false, error: "Oturum gerekli." }, { status: 401, headers });
  const repo = getScopedRepository(session.siteId);
  const site = await repo.getSite();
  const locale = site?.defaultLocale ?? "tr";
  const [contents, taxonomies, products] = await Promise.all([repo.listContents({ locale, status: "published" }), repo.listTaxonomies(), listStorefrontProducts(session.siteId, "published")]);
  const items = [
    ...contents.filter((c) => c.type !== "product" && resolvePublishing(c.schemaAttributes).visibility !== "private").map((c) => ({ group: c.type === "page" ? "Sayfalar" : "Yazılar", title: c.title, href: c.slug === "ana-sayfa" ? `/${locale}` : `/${locale}/${c.slug}` })),
    ...taxonomies.filter((t) => t.taxonomyType === "category" || t.taxonomyType === "tag").map((t) => ({ group: t.taxonomyType === "category" ? "Kategoriler" : "Etiketler", title: t.name, href: `/${locale}/${t.taxonomyType === "category" ? "kategori" : "etiket"}/${t.slug}` })),
    ...products.map((p) => ({ group: "Ürünler", title: p.name, href: `/${locale}/magaza/${p.slug}` })),
    { group: "Sayfalar", title: "Mağaza", href: `/${locale}/magaza` },
  ];
  return NextResponse.json({ ok: true, items }, { headers });
}

import React from "react";
import { getScopedRepository } from "@nexpress/database";
import { CatalogRewrite } from "./catalog-rewrite";

export async function CatalogAiCard({ siteId }: { siteId: string }) {
  const repo = getScopedRepository(siteId);
  const contents = await repo.listContents({ locale: "tr" });
  const products = contents.filter((c) => c.type === "product" || c.schemaType === "Product");

  const auditedProducts = products.map((p) => {
    const titleLen = p.title.length;
    const desc = p.tldr || "";
    const hasGoodTitle = titleLen >= 25 && titleLen <= 70;
    const hasGoodDesc = desc.length >= 80;
    const hasSchema = Boolean(p.schemaAttributes);

    let score = 100;
    const issues: string[] = [];
    if (!hasGoodTitle) {
      score -= 30;
      issues.push("Başlık uzunluğu optimize edilmeli (25-70 karakter)");
    }
    if (!hasGoodDesc) {
      score -= 40;
      issues.push("Kısa ürün açıklaması / TL;DR eksik");
    }
    if (!hasSchema) {
      score -= 30;
      issues.push("Fiyat veya SKU şema özniteliği eksik");
    }

    return {
      id: p.id,
      title: p.title,
      slug: p.slug,
      score: Math.max(20, score),
      issues,
    };
  });

  const avgCatalogScore =
    auditedProducts.length > 0
      ? Math.round(auditedProducts.reduce((acc, p) => acc + p.score, 0) / auditedProducts.length)
      : 0;

  return (
    <div className="rounded-xl border border-nx-line bg-nx-card p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h4 className="text-sm font-semibold text-nx-fg">Katalog & E-Ticaret AI SEO Denetçisi</h4>
            <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
              Ticaret Skoru
            </span>
          </div>
          <p className="mt-0.5 text-xs text-nx-soft">
            Ürün başlıkları, açıklamaları, SKU ve Google Merchant Center uyumunun anlık yapay zeka denetimi.
          </p>
        </div>

        <div className="flex items-center gap-2 rounded-lg border border-nx-line bg-nx-subtle px-3 py-1.5">
          <span className="text-xs text-nx-soft">Katalog Sağlığı:</span>
          <span className="text-base font-bold text-emerald-600 dark:text-emerald-400">%{avgCatalogScore}</span>
        </div>
      </div>

      {auditedProducts.length === 0 ? (
        <div className="rounded-lg border border-nx-line bg-nx-subtle p-3.5 text-xs text-nx-soft">
          Henüz ürün eklenmedi veya ürün sayfaları kurumsal sayfa olarak kaydedildi. Yeni bir ürün eklediğinizde başlık, açıklama ve Google Alışveriş (Merchant) uyumu otomatik denetlenir.
        </div>
      ) : (
        <div className="space-y-2">
          {auditedProducts.slice(0, 4).map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between rounded-lg border border-nx-line bg-nx-subtle p-3 text-xs"
            >
              <div className="space-y-0.5 min-w-0 flex-1 pr-3">
                <div className="font-semibold text-nx-fg truncate">{item.title}</div>
                <div className="text-[11px] text-nx-soft">
                  {item.issues.length === 0 ? (
                    <span className="text-emerald-600 dark:text-emerald-400 font-medium">✓ Tüm SEO gereksinimleri tam</span>
                  ) : (
                    <span className="text-amber-600 dark:text-amber-400">{item.issues.join(" • ")}</span>
                  )}
                </div>
                <CatalogRewrite contentId={item.id} />
              </div>

              <div className="flex items-center gap-3">
                <span className={`rounded px-2 py-0.5 text-[10px] font-bold ${
                  item.score >= 80 ? "bg-emerald-500/10 text-emerald-700" : "bg-amber-500/10 text-amber-700"
                }`}>
                  %{item.score} Skor
                </span>
                <a
                  href={`/admin/contents?id=${item.id}`}
                  className="rounded border border-nx-line bg-nx-card px-2.5 py-1 text-xs font-semibold text-nx-fg hover:bg-nx-line transition"
                >
                  Editör
                </a>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}


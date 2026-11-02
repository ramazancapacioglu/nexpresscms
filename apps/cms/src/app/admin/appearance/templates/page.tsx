import React from "react";
import { headers } from "next/headers";
import { readTemplateMeta, TEMPLATE_KIND_IDS, validateTemplate } from "@nexpress/core";
import { getScopedRepository } from "@nexpress/database";
import { AppearanceNav } from "@/components/admin/section-tabs";
import { requireUser } from "@/lib/auth/session";
import { TemplatesManager, type TemplateRow } from "./templates-manager";

export const dynamic = "force-dynamic";

export default async function TemplatesPage() {
  await requireUser();
  const siteId = (await headers()).get("x-nexpress-site-id") ?? "default";
  const repo = getScopedRepository(siteId);
  const locale = (await repo.getSite())?.defaultLocale ?? "tr";
  const rows: TemplateRow[] = (await repo.listContents({ locale, type: "template" })).flatMap((c) => {
    const meta = readTemplateMeta(c.schemaAttributes);
    return meta ? [{ id: c.contentId, name: c.title, kind: meta.kind, isDefault: meta.isDefault, blocks: c.blocks.length, errors: validateTemplate(meta.kind, c.blocks).filter((i) => i.level === "error").map((i) => i.message) }] : [];
  });
  return (
    <div className="space-y-4">
      <AppearanceNav />
      <header className="border-b border-[#D5D8DE] pb-3 dark:border-[#2E333D]">
        <h1 className="text-[18px] font-semibold">Şablonlar (Tema oluşturucu)</h1>
        <p className="text-[12px] text-[#5F6570] dark:text-[#8C9099]">Header, footer, kenar çubuğu, sayfa, blog yazısı, kategori, etiket, ürün ve mağaza görünümlerini hazır şablondan oluşturun, stüdyoda düzenleyin ve varsayılan yapın. Sayfa/yazı ve kategori/etiket düzenlerken şablonu tek tek de seçebilirsiniz.</p>
      </header>
      <TemplatesManager rows={rows} kinds={TEMPLATE_KIND_IDS} />
    </div>
  );
}

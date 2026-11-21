import React from "react";
import { headers } from "next/headers";
import { readTemplateMeta, TEMPLATE_KIND_IDS, validateTemplate } from "@nexpress/core";
import { getScopedRepository } from "@nexpress/database";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
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
    return meta ? [{ id: c.contentId, name: c.title, kind: meta.kind, isDefault: meta.isDefault, conditions: meta.conditions ?? { include: [], exclude: [] }, behavior: meta.behavior ?? {}, blocks: c.blocks.length, errors: validateTemplate(meta.kind, c.blocks).filter((i) => i.level === "error").map((i) => i.message) }] : [];
  });
  return (
    <div className="space-y-4">
      <AdminPageHeader
        title="Şablonlar & Modeller"
        description="Header, footer, kenar çubuğu, sayfa, blog yazısı, arşiv, ürün, mağaza şablonları ve senkronize modeller. Varsayılan atayın veya içerik bazında seçin."
      />
      <TemplatesManager rows={rows} kinds={TEMPLATE_KIND_IDS} />
    </div>
  );
}

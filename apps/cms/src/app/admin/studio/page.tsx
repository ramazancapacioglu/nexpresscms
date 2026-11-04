import React from "react";
import type { Metadata } from "next";
import { headers } from "next/headers";
import { readTemplateMeta, resolveSiteSettings } from "@nexpress/core";
import { getScopedRepository, getDesignLibraryRepository } from "@nexpress/database";
import { AppearanceNav } from "@/components/admin/section-tabs";
import { StudioClient, type StudioTemplateItem, type StudioLibraryItem } from "./studio-client";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Tasarım Stüdyosu & Şablon Fabrikası | NexPress CMS",
  description: "Tüm site şablonları, senkronize modeller, yapay zeka tasarımları ve özel CSS/JS kodları.",
};

export default async function AdminStudioPage() {
  const reqHeaders = await headers();
  const siteId = reqHeaders.get("x-nexpress-site-id") ?? "default";
  const repo = getScopedRepository(siteId);
  const libraryRepo = getDesignLibraryRepository(siteId);

  const site = await repo.getSite();
  const locale = site?.defaultLocale ?? "tr";

  // Şablonları yükle
  const rawTemplates = await repo.listContents({ locale, type: "template" });
  const templates: StudioTemplateItem[] = rawTemplates.map((c) => {
    const meta = readTemplateMeta(c.schemaAttributes);
    return {
      id: c.contentId,
      slug: c.slug,
      name: c.title,
      kind: meta?.kind || "page",
      isDefault: Boolean(meta?.isDefault),
      category: ((meta as unknown as Record<string, unknown> | undefined)?.category as string) || "Genel",
      blocksCount: c.blocks.length,
      blocks: c.blocks,
      description: c.tldr || "",
    };
  });

  // Tasarım kütüphanesini yükle
  const rawLibrary = await libraryRepo.list();
  const library: StudioLibraryItem[] = rawLibrary.map((item) => ({
    id: item.id,
    name: item.name,
    kind: item.kind,
    category: item.category,
    description: item.description,
    source: item.source,
    blocksCount: Array.isArray((item.payload as Record<string, unknown> | undefined)?.blocks)
      ? ((item.payload as Record<string, unknown>).blocks as unknown[]).length
      : 0,
    createdAt: item.createdAt.toISOString(),
  }));

  // Ayarları ve özel kodları çöz
  const resolvedSettings = resolveSiteSettings(site?.settings);
  const cust = resolvedSettings.customizer;

  return (
    <div className="space-y-6">
      <AppearanceNav />
      <StudioClient
        initialTemplates={templates}
        initialLibrary={library}
        currentCustomCss={cust.customCss || ""}
        currentHeaderScripts={cust.headerScripts || ""}
        currentFooterScripts={cust.footerScripts || ""}
      />
    </div>
  );
}


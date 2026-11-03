import React from "react";
import { headers } from "next/headers";
import { readTemplateMeta } from "@nexpress/core";
import { getScopedRepository } from "@nexpress/database";
import { OFFICIAL_THEME_STORE, getThemeManifest } from "@nexpress/themes";
import { ThemeStoreClient } from "@/components/admin/theme-store-client";
import { AppearanceNav } from "@/components/admin/section-tabs";

export const dynamic = "force-dynamic";

export default async function AdminThemesPage() {
  const reqHeaders = await headers();
  const siteId = reqHeaders.get("x-nexpress-site-id") ?? "default";
  const repo = getScopedRepository(siteId);
  const site = await repo.getSite();
  const locale = site?.defaultLocale ?? "tr";

  const activeThemeId = site?.activeThemeId ?? "corporate-aurora";
  const activeManifest = getThemeManifest(activeThemeId);

  const rawTemplates = await repo.listContents({ locale, type: "template" });
  const initialTemplates = rawTemplates.flatMap((c) => {
    const meta = readTemplateMeta(c.schemaAttributes);
    return meta
      ? [
          {
            id: c.contentId,
            name: c.title,
            kind: meta.kind,
            isDefault: meta.isDefault,
            blocks: c.blocks.length,
          },
        ]
      : [];
  });

  return (
    <div className="space-y-4">
      <AppearanceNav />
      <ThemeStoreClient
        themes={OFFICIAL_THEME_STORE}
        activeThemeId={activeThemeId}
        currentTokens={site?.designTokens ?? activeManifest.tokens}
        currentSettings={site?.settings}
        initialTemplates={initialTemplates}
      />
    </div>
  );
}

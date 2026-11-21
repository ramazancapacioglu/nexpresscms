import React from "react";
import { readTemplateMeta } from "@nexpress/core";
import { getScopedRepository } from "@nexpress/database";
import { OFFICIAL_THEME_STORE, getThemeManifest } from "@nexpress/themes";
import { ThemeStoreClient } from "@/components/admin/theme-store-client";
import type { CustomizerTabId } from "@/components/admin/use-theme-store";
import { AppearanceNav } from "@/components/admin/section-tabs";
import { requireAdminPage } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

const ALLOWED_TABS: CustomizerTabId[] = ["colors", "typography", "layout", "chrome", "code"];

export default async function AdminThemeCustomizerPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const [me, sp] = await Promise.all([requireAdminPage(), searchParams]);
  const repo = getScopedRepository(me.siteId);
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

  const initialTab: CustomizerTabId =
    sp.tab && ALLOWED_TABS.includes(sp.tab as CustomizerTabId)
      ? (sp.tab as CustomizerTabId)
      : "colors";

  return (
    <div className="space-y-4">
      <AppearanceNav />
      <ThemeStoreClient
        themes={OFFICIAL_THEME_STORE}
        activeThemeId={activeThemeId}
        currentTokens={site?.designTokens ?? activeManifest.tokens}
        currentSettings={site?.settings}
        initialTemplates={initialTemplates}
        initialTab={initialTab}
      />
    </div>
  );
}

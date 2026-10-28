import React from "react";
import Link from "next/link";
import { Download } from "lucide-react";
import { getScopedRepository } from "@nexpress/database";
import { requireAdminPage } from "@/lib/auth/session";
import { UploadPanel } from "./upload-panel";
import { ThemeCard, type ThemeCardData } from "./theme-card";

export const dynamic = "force-dynamic";

const border = "border-[#E6E7EA] dark:border-[#23262E]";

export default async function ThemePackagesPage() {
  const me = await requireAdminPage();
  const repo = getScopedRepository(me.siteId);
  const [themes, site] = await Promise.all([repo.listUploadedThemes(), repo.getSite()]);
  const defaultLocale = site?.defaultLocale ?? "tr";
  const cards: ThemeCardData[] = themes
    .sort((a, b) => b.installedAt.getTime() - a.installedAt.getTime())
    .map((t) => ({
      id: t.themeId,
      name: t.name,
      version: t.version,
      author: t.author,
      description: t.description || t.tagline,
      tagline: t.tagline,
      checksum: t.checksum,
      isActive: t.isActive,
      screenshot: t.screenshot,
      swatches: [t.tokens.colors.primary, t.tokens.colors.secondary, t.tokens.colors.accent, t.tokens.colors.background, t.tokens.colors.muted],
      pages: t.pages.length,
      hasChrome: Boolean(t.header || t.footer),
      hasCss: Boolean(t.css),
      installedAt: t.installedAt.toISOString(),
    }));

  return (
    <div className="space-y-5">
      <div className={`flex flex-wrap items-end justify-between gap-3 border-b ${border} pb-3.5`}>
        <div>
          <h1 className="text-[18px] font-semibold tracking-tight text-[#14151A] dark:text-[#F3F4F6]">Tema paketleri</h1>
          <p className="text-[12px] text-[#5F6570] dark:text-[#8C9099]">
            <Link href="/admin/themes" className="text-[#1D5ED8] dark:text-[#7AA7FF] hover:underline">← Tema mağazası</Link> · Yüklenen veri temaları: önizleyin, etkinleştirin, dışa aktarın.
          </p>
        </div>
        <a href="/api/admin/themes/export?current=1" className="inline-flex h-8 items-center gap-1.5 rounded-md border border-[#E6E7EA] dark:border-[#23262E] px-3 text-[12px] font-medium hover:bg-[#F4F5F7] dark:hover:bg-[#1C1E24]">
          <Download className="h-3.5 w-3.5" /> Mevcut tasarımı dışa aktar
        </a>
      </div>

      <UploadPanel />

      {cards.length === 0 ? (
        <p className={`rounded-lg border ${border} bg-white dark:bg-[#15171C] px-6 py-10 text-center text-[12px] text-[#5F6570] dark:text-[#8C9099]`}>Henüz yüklenmiş tema yok.</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {cards.map((c) => (
            <ThemeCard key={c.id} theme={c} previewPath={`/${defaultLocale}`} />
          ))}
        </div>
      )}
    </div>
  );
}

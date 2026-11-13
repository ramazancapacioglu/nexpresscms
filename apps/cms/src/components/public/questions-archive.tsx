import React from "react";
import type { Metadata } from "next";
import { isPluginModuleEnabled, sanitizeQaState } from "@nexpress/core";
import { getScopedRepository } from "@nexpress/database";
import { createTranslator } from "@nexpress/i18n";
import { siteLocaleBase } from "@/lib/locale-url";
import { Link } from "@/components/public/link";
import { QA_PLUGIN_ID } from "@/plugins/qa";

export async function questionsArchiveOn(siteId: string): Promise<boolean> {
  return isPluginModuleEnabled(siteId, QA_PLUGIN_ID, "archive");
}

export async function questionsArchiveMetadata(siteId: string, locale: string): Promise<Metadata | null> {
  if (!(await questionsArchiveOn(siteId))) return null;
  const t = createTranslator(locale);
  const lb = await siteLocaleBase(siteId, locale);
  const base = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  return {
    title: t("qa.archiveTitle"),
    description: t("qa.archiveIntro"),
    alternates: { canonical: `${base}${lb}/sorular` },
  };
}

/** Yayındaki soru sayfalarının listesi. Betik yok. */
export async function QuestionsArchive({ siteId, locale }: { siteId: string; locale: string }) {
  const t = createTranslator(locale);
  const lb = await siteLocaleBase(siteId, locale);
  const rows = await getScopedRepository(siteId).listContents({ locale, type: "ai_prompt", status: "published" });
  const items = rows
    .map((row) => ({ slug: row.slug, title: row.title, tldr: row.tldr ?? "", votes: sanitizeQaState((row.schemaAttributes as Record<string, unknown>)._qa).upvotes }))
    .sort((a, b) => b.votes - a.votes || a.title.localeCompare(b.title, locale));
  return (
    <article className="mx-auto max-w-3xl space-y-6 px-4 py-10">
      <header className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">{t("qa.archiveTitle")}</h1>
        <p className="text-sm leading-relaxed text-nx-muted">{t("qa.archiveIntro")}</p>
      </header>
      {items.length === 0 ? <p className="text-sm text-nx-muted">{t("qa.empty")}</p> : null}
      <ul className="space-y-3">
        {items.map((item) => (
          <li key={item.slug} className="rounded-lg border border-nx-line p-4">
            <Link href={`${lb}/${item.slug}`} className="font-semibold hover:underline">{item.title}</Link>
            {item.tldr ? <p className="mt-1 text-sm text-nx-muted">{item.tldr}</p> : null}
            {item.votes > 0 ? <p className="mt-2 text-xs text-nx-soft">{t("qa.votes", { n: item.votes })}</p> : null}
          </li>
        ))}
      </ul>
    </article>
  );
}

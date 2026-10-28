import React from "react";
import { headers } from "next/headers";
import Link from "next/link";
import { cmsHooks, getCmsMode, PluginSlot } from "@nexpress/core";
import { getDbDialect, getScopedRepository } from "@nexpress/database";
import { getThemeManifest } from "@nexpress/themes";
import {
  Plus,
  ArrowUpRight,
  SlidersHorizontal,
  ArrowUpDown,
  Layers,
  Hash,
  FileCode,
  Link2,
} from "lucide-react";

export default async function AdminOverviewPage() {
  const reqHeaders = await headers();
  const siteId = reqHeaders.get("x-nexpress-site-id") ?? "default";
  const repo = getScopedRepository(siteId);

  const site = await repo.getSite();
  const contents = await repo.listContents({ locale: "tr" });
  const entityLinks = await repo.listEntityLinks();
  const activeTheme = getThemeManifest(
    site?.activeThemeId ?? "corporate-aurora"
  );
  const registeredHooks = cmsHooks.getRegisteredHooksSummary();

  const avgSeoScore =
    contents.length > 0
      ? Math.round(
          contents.reduce((acc, c) => acc + c.seoScore, 0) / contents.length
        )
      : 95;

  return (
    <div className="space-y-5">
      {/* ATTIO CRM TARZI KOMPAKT SAYFA BAŞLIĞI VE GÖRÜNÜM ÇUBUĞU */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#E6E7EA] dark:border-[#23262E] pb-4">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <h1 className="text-[18px] font-semibold tracking-tight text-[#14151A] dark:text-[#F3F4F6]">
              {site?.name ?? "NexPress CMS"}
            </h1>
            <span className="inline-flex items-center gap-1 rounded border border-[#E6E7EA] dark:border-[#23262E] bg-white dark:bg-[#15171C] px-2 py-0.5 font-mono text-[11px] text-[#5C5F66] dark:text-[#9CA3AF]">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              {siteId} ({getCmsMode()})
            </span>
          </div>
          <p className="text-[12px] text-[#8C9099]">
            Çift motorlu içerik tablosu, @id varlık grafiği ve sıfır maliyetli Markdown akışı.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/admin/themes"
            className="h-7 inline-flex items-center gap-1.5 rounded-md border border-[#E6E7EA] dark:border-[#23262E] bg-white dark:bg-[#15171C] px-2.5 text-[12px] font-medium text-[#14151A] dark:text-[#F3F4F6] hover:bg-[#F4F5F7] dark:hover:bg-[#1C1E24] transition"
          >
            <span>Tema: {activeTheme.name}</span>
          </Link>
          <Link
            href="/admin/contents"
            className="h-7 inline-flex items-center gap-1.5 rounded-md bg-[#14151A] dark:bg-[#F3F4F6] px-3 text-[12px] font-medium text-white dark:text-[#14151A] hover:opacity-90 transition"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Yeni Kayıt</span>
          </Link>
        </div>
      </div>

      {/* ATTIO TARZI İNCE KENARLIKLI BÖLÜNMÜŞ METRİK ŞERİDİ (1px Hairline Strip) */}
      <div className="rounded-lg border border-[#E6E7EA] dark:border-[#23262E] bg-white dark:bg-[#15171C] grid grid-cols-2 lg:grid-cols-4 divide-y lg:divide-y-0 lg:divide-x divide-[#E6E7EA] dark:divide-[#23262E]">
        <div className="p-4 space-y-1">
          <div className="flex items-center justify-between text-[11px] text-[#8C9099]">
            <span>Toplam Kayıt (Objects)</span>
            <Layers className="h-3.5 w-3.5 text-[#8C9099]" strokeWidth={1.75} />
          </div>
          <div className="flex items-baseline justify-between pt-1">
            <span className="text-xl font-semibold tabular-nums tracking-tight">
              {contents.length}
            </span>
            <span className="font-mono text-[11px] text-emerald-600 dark:text-emerald-400">
              100% MarkdownCache
            </span>
          </div>
        </div>

        <div className="p-4 space-y-1">
          <div className="flex items-center justify-between text-[11px] text-[#8C9099]">
            <span>@id Entity İlişkileri</span>
            <Link2 className="h-3.5 w-3.5 text-[#8C9099]" strokeWidth={1.75} />
          </div>
          <div className="flex items-baseline justify-between pt-1">
            <span className="text-xl font-semibold tabular-nums tracking-tight">
              {entityLinks.length}
            </span>
            <span className="font-mono text-[11px] text-[#5C5F66] dark:text-[#9CA3AF]">
              about • offer_for
            </span>
          </div>
        </div>

        <Link href="/admin/seo" className="p-4 space-y-1 hover:bg-[#F4F5F7] dark:hover:bg-[#1C1E24]">
          <div className="flex items-center justify-between text-[11px] text-[#8C9099]">
            <span>Ortalama SEO & GEO</span>
            <Hash className="h-3.5 w-3.5 text-[#8C9099]" strokeWidth={1.75} />
          </div>
          <div className="flex items-baseline justify-between pt-1">
            <span className="text-xl font-semibold tabular-nums tracking-tight">
              {avgSeoScore}
              <span className="text-xs font-normal text-[#8C9099]">/100</span>
            </span>
            <span className="font-mono text-[11px] text-emerald-600 dark:text-emerald-400">
              TL;DR + @graph
            </span>
          </div>
        </Link>

        <div className="p-4 space-y-1">
          <div className="flex items-center justify-between text-[11px] text-[#8C9099]">
            <span>Ön Yüz İstemci JS Yükü</span>
            <FileCode className="h-3.5 w-3.5 text-[#8C9099]" strokeWidth={1.75} />
          </div>
          <div className="flex items-baseline justify-between pt-1">
            <span className="text-xl font-semibold tabular-nums tracking-tight">
              0 KB
            </span>
            <span className="font-mono text-[11px] text-[#266DF0] dark:text-[#3B82F6]">
              {getDbDialect()} • RSC
            </span>
          </div>
        </div>
      </div>

      {/* ATTIO CRM SPREADSHEET / RECORD GRID TABLOSU */}
      <div className="rounded-lg border border-[#E6E7EA] dark:border-[#23262E] bg-white dark:bg-[#15171C] overflow-hidden">
        {/* Tablo Üst Filtre & Görünüm Çubuğu */}
        <div className="px-4 py-2 border-b border-[#E6E7EA] dark:border-[#23262E] bg-[#FBFBFB] dark:bg-[#121317] flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-md bg-[#EAECED] dark:bg-[#22252D] px-2 py-1 text-[11px] font-medium text-[#14151A] dark:text-[#F3F4F6]">
              Tüm Kayıtlar ({contents.length})
            </span>
            <span className="inline-flex items-center gap-1 rounded-md border border-[#E6E7EA] dark:border-[#23262E] bg-white dark:bg-[#15171C] px-2 py-1 text-[11px] text-[#5C5F66] dark:text-[#9CA3AF]">
              <SlidersHorizontal className="h-3 w-3" />
              <span>siteId = {siteId}</span>
            </span>
            <span className="inline-flex items-center gap-1 rounded-md border border-[#E6E7EA] dark:border-[#23262E] bg-white dark:bg-[#15171C] px-2 py-1 text-[11px] text-[#5C5F66] dark:text-[#9CA3AF]">
              <ArrowUpDown className="h-3 w-3" />
              <span>Önem Skoru (Azalan)</span>
            </span>
          </div>

          <Link
            href="/admin/contents"
            className="text-[11px] font-medium text-[#5C5F66] dark:text-[#9CA3AF] hover:text-[#14151A] dark:hover:text-white flex items-center gap-1"
          >
            <span>Stüdyoda Aç</span>
            <ArrowUpRight className="h-3 w-3" />
          </Link>
        </div>

        {/* Hücre Çizgili (divide-x & divide-y) Attio Tablosu */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#E6E7EA] dark:border-[#23262E] bg-[#FBFBFB] dark:bg-[#121317] text-[11px] font-medium text-[#8C9099] divide-x divide-[#E6E7EA] dark:divide-[#23262E]">
                <th className="py-2 px-3.5 font-medium">Aa Kayıt Başlığı</th>
                <th className="py-2 px-3 font-medium">🔗 URL Yolu</th>
                <th className="py-2 px-3 font-medium">◎ Nesne Türü</th>
                <th className="py-2 px-3 font-medium">@ Schema.org</th>
                <th className="py-2 px-3 font-medium text-right"># Önem</th>
                <th className="py-2 px-3 font-medium text-right"># SEO</th>
                <th className="py-2 px-3.5 font-medium text-right">Eylemler</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E6E7EA] dark:divide-[#23262E] text-[12px]">
              {contents.map((item) => {
                const publicPath =
                  item.slug === "ana-sayfa" ? "/tr" : `/tr/${item.slug}`;
                return (
                  <tr
                    key={item.id}
                    className="hover:bg-[#F4F5F7]/70 dark:hover:bg-[#1C1E24]/70 transition divide-x divide-[#E6E7EA] dark:divide-[#23262E]"
                  >
                    <td className="py-2.5 px-3.5 font-medium text-[#14151A] dark:text-[#F3F4F6] max-w-xs truncate">
                      <Link
                        href="/admin/contents"
                        className="hover:underline block truncate"
                      >
                        {item.title}
                      </Link>
                    </td>
                    <td className="py-2.5 px-3 font-mono text-[11px] text-[#5C5F66] dark:text-[#9CA3AF]">
                      {publicPath}
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="inline-flex items-center gap-1.5 rounded border border-[#E6E7EA] dark:border-[#23262E] bg-[#FBFBFB] dark:bg-[#121317] px-2 py-0.5 font-mono text-[11px] text-[#14151A] dark:text-[#F3F4F6]">
                        <span className="h-1.5 w-1.5 rounded-full bg-[#266DF0]" />
                        {item.type}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 font-mono text-[11px] text-[#5C5F66] dark:text-[#9CA3AF]">
                      {item.schemaType}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-[11px] tabular-nums">
                      {item.importanceScore}/10
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-[11px] tabular-nums font-medium text-emerald-600 dark:text-emerald-400">
                      {item.seoScore}
                    </td>
                    <td className="py-2.5 px-3.5 text-right space-x-1.5 whitespace-nowrap">
                      <Link
                        href={publicPath}
                        target="_blank"
                        className="inline-flex items-center rounded border border-[#E6E7EA] dark:border-[#23262E] bg-white dark:bg-[#15171C] px-2 py-0.5 text-[11px] font-medium text-[#14151A] dark:text-[#F3F4F6] hover:bg-[#F4F5F7] transition"
                      >
                        RSC
                      </Link>
                      <Link
                        href={`${publicPath}?format=md`}
                        target="_blank"
                        className="inline-flex items-center rounded border border-[#E6E7EA] dark:border-[#23262E] bg-[#FBFBFB] dark:bg-[#121317] px-2 py-0.5 font-mono text-[11px] text-[#5C5F66] dark:text-[#9CA3AF] hover:text-[#14151A] transition"
                      >
                        .md
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* KURAL 4: OPEN-CORE GENİŞLEME YUVASI (dashboard.overview.cards) */}
      <PluginSlot
        name="dashboard.overview.cards"
        siteId={siteId}
        fallback={
          <div className="rounded-lg border border-[#E6E7EA] dark:border-[#23262E] bg-white dark:bg-[#15171C] px-4 py-3 flex items-center justify-between text-[12px]">
            <div className="flex items-center gap-2.5">
              <span className="h-2 w-2 rounded-full bg-[#266DF0]" />
              <span className="font-medium text-[#14151A] dark:text-[#F3F4F6]">
                Open-Core Genişleme Yuvası (<code>dashboard.overview.cards</code>)
              </span>
              <span className="text-[#8C9099] hidden md:inline">
                — Eklentileri ve modüllerini yönetmek için Eklentiler sayfasını açın.
              </span>
            </div>
            <Link
              href="/admin/plugins"
              className="rounded border border-[#E6E7EA] dark:border-[#23262E] bg-[#FBFBFB] dark:bg-[#121317] px-2.5 py-1 font-mono text-[11px] text-[#14151A] dark:text-[#F3F4F6] hover:bg-[#EAECED] transition"
            >
              Eklentiler ({registeredHooks.length} kanca) →
            </Link>
          </div>
        }
      />
    </div>
  );
}

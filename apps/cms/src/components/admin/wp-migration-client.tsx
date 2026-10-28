"use client";

import React, { useState, useTransition } from "react";
import Link from "next/link";
import {
  DEMO_WORDPRESS_EXPORT_PAYLOAD,
  convertWpPostsToNexPress,
  type WpMigrationReport,
} from "@nexpress/wp-importer";
import { runWpMigrationAction } from "@/app/admin/actions";
import {
  ArrowRightLeft,
  Check,
  FileCode2,
  ExternalLink,
  ShieldCheck,
} from "lucide-react";

export function WpMigrationClient() {
  const [customHtml, setCustomHtml] = useState(
    DEMO_WORDPRESS_EXPORT_PAYLOAD[0]?.rawContentHtml.trim() ?? ""
  );
  const [customTitle, setCustomTitle] = useState(
    DEMO_WORDPRESS_EXPORT_PAYLOAD[0]?.title ?? ""
  );
  const [customSlug, setCustomSlug] = useState(
    DEMO_WORDPRESS_EXPORT_PAYLOAD[0]?.slug ?? ""
  );
  const [report, setReport] = useState<WpMigrationReport | null>(null);
  const [isPending, startTransition] = useTransition();

  const livePreview = convertWpPostsToNexPress([
    {
      wpId: 999,
      title: customTitle,
      slug: customSlug,
      wpType: "docs",
      oldPermalink: `https://eski-wp-site.com/2025/${customSlug}/`,
      rawContentHtml: customHtml,
    },
  ])[0];

  const handleRunDemoBatchMigration = () => {
    startTransition(async () => {
      const res = await runWpMigrationAction();
      setReport(res);
    });
  };

  const handleRunCustomMigration = () => {
    startTransition(async () => {
      const res = await runWpMigrationAction({
        customPosts: [
          {
            wpId: Date.now(),
            title: customTitle,
            slug: customSlug,
            wpType: "docs",
            oldPermalink: `https://eski-wp-site.com/2025/${customSlug}/`,
            rawContentHtml: customHtml,
          },
        ],
      });
      setReport(res);
    });
  };

  return (
    <div className="space-y-5">
      {/* ÜST TOPLU GÖÇ BARI (ATTIO PRECISION CARD) */}
      <div className="rounded-lg border border-[#E6E7EA] dark:border-[#23262E] bg-white dark:bg-[#15171C] p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-0.5 max-w-2xl">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-[#266DF0]" />
            <h2 className="text-[13px] font-semibold">
              WordPress + Elementor + WooCommerce Simülasyon Paketi
            </h2>
            <span className="rounded border border-[#E6E7EA] dark:border-[#23262E] bg-[#FBFBFB] dark:bg-[#121317] px-1.5 py-0.5 font-mono text-[10px] text-[#5C5F66]">
              @nexpress/wp-importer
            </span>
          </div>
          <p className="text-[12px] text-[#8C9099]">
            <code>[vc_row]</code>, <code>[elementor-template]</code> ve{" "}
            <code>&lt;!-- wp:* --&gt;</code> kısa kodlarını ayıklar; 0-KB RSC bloklarına,{" "}
            <code>markdownCache</code> sütununa ve 301 yönlendirmelerine dönüştürür.
          </p>
        </div>

        <button
          type="button"
          disabled={isPending}
          onClick={handleRunDemoBatchMigration}
          className="h-7 shrink-0 inline-flex items-center gap-1.5 rounded-md bg-[#14151A] dark:bg-[#F3F4F6] px-3 text-[12px] font-medium text-white dark:text-[#14151A] hover:opacity-90 transition cursor-pointer"
        >
          <ArrowRightLeft className="h-3.5 w-3.5" />
          <span>{isPending ? "Aktarılıyor..." : "Örnek WP Paketini Aktar (2 Kayıt)"}</span>
        </button>
      </div>

      {/* GÖÇ SONUÇ TABLOSU */}
      {report && (
        <div className="rounded-lg border border-[#E6E7EA] dark:border-[#23262E] bg-white dark:bg-[#15171C] overflow-hidden">
          <div className="px-4 py-2.5 border-b border-[#E6E7EA] dark:border-[#23262E] bg-[#FBFBFB] dark:bg-[#121317] flex items-center justify-between text-[12px]">
            <span className="flex items-center gap-2 font-medium text-emerald-700 dark:text-emerald-400">
              <Check className="h-3.5 w-3.5" />
              <span>
                {report.totalProcessed} kayıt veritabanına aktarıldı ({report.totalShortcodesStripped} shortcode temizlendi)
              </span>
            </span>
            <Link
              href="/tr"
              target="_blank"
              className="font-mono text-[11px] text-[#266DF0] hover:underline inline-flex items-center gap-1"
            >
              <span>Vitrini Aç</span>
              <ExternalLink className="h-3 w-3" />
            </Link>
          </div>

          <div className="divide-y divide-[#E6E7EA] dark:divide-[#23262E] text-[12px]">
            {report.items.map((item) => (
              <div
                key={item.wpId}
                className="px-4 py-2.5 flex flex-wrap items-center justify-between gap-2"
              >
                <div className="flex items-center gap-2.5">
                  <span className="rounded border border-[#E6E7EA] dark:border-[#23262E] bg-[#FBFBFB] dark:bg-[#121317] px-1.5 py-0.5 font-mono text-[10px]">
                    {item.targetType} • @{item.schemaType}
                  </span>
                  <span className="font-medium">{item.title}</span>
                </div>
                <div className="flex items-center gap-3 font-mono text-[11px]">
                  <span className="text-[#8C9099]">
                    301: {item.redirect301.fromPath} → {item.redirect301.toPath}
                  </span>
                  <Link
                    href={item.redirect301.toPath}
                    target="_blank"
                    className="text-[#266DF0] hover:underline"
                  >
                    RSC
                  </Link>
                  <Link
                    href={`${item.redirect301.toPath}?format=md`}
                    target="_blank"
                    className="text-emerald-600 hover:underline"
                  >
                    .md
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* BÖLÜNMÜŞ SHORTCODE TEMİZLEME VE AST ÖNİZLEME PANELİ */}
      <div className="rounded-lg border border-[#E6E7EA] dark:border-[#23262E] bg-white dark:bg-[#15171C] overflow-hidden grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-[#E6E7EA] dark:divide-[#23262E]">
        <div className="p-4 space-y-3 text-[12px]">
          <div className="flex items-center justify-between border-b border-[#E6E7EA] dark:border-[#23262E] pb-2.5">
            <span className="font-semibold flex items-center gap-1.5">
              <FileCode2 className="h-3.5 w-3.5 text-[#8C9099]" />
              <span>Kaynak: Ham WordPress / Elementor HTML</span>
            </span>
            <span className="font-mono text-[10px] text-rose-600">
              {livePreview?.strippedShortcodesCount ?? 0} shortcode algılandı
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="block text-[11px] text-[#8C9099] mb-1">Başlık</label>
              <input
                type="text"
                value={customTitle}
                onChange={(e) => setCustomTitle(e.target.value)}
                className="w-full rounded border border-[#E6E7EA] dark:border-[#23262E] bg-[#FBFBFB] dark:bg-[#121317] px-2.5 py-1 text-[12px] outline-none"
              />
            </div>
            <div>
              <label className="block text-[11px] text-[#8C9099] mb-1">Hedef Slug</label>
              <input
                type="text"
                value={customSlug}
                onChange={(e) => setCustomSlug(e.target.value)}
                className="w-full rounded border border-[#E6E7EA] dark:border-[#23262E] bg-[#FBFBFB] dark:bg-[#121317] px-2.5 py-1 font-mono text-[11px] outline-none"
              />
            </div>
          </div>

          <textarea
            rows={10}
            value={customHtml}
            onChange={(e) => setCustomHtml(e.target.value)}
            className="w-full rounded border border-[#E6E7EA] dark:border-[#23262E] bg-[#FBFBFB] dark:bg-[#121317] p-2.5 font-mono text-[11px] leading-relaxed outline-none"
          />

          <button
            type="button"
            disabled={isPending}
            onClick={handleRunCustomMigration}
            className="w-full h-7 rounded-md bg-[#14151A] dark:bg-[#F3F4F6] text-white dark:text-[#14151A] text-[12px] font-medium hover:opacity-90 transition cursor-pointer"
          >
            Dönüştür ve Kayıt Tablosuna Ekle
          </button>
        </div>

        <div className="p-4 space-y-3 text-[12px] bg-[#FBFBFB] dark:bg-[#121317]">
          <div className="flex items-center justify-between border-b border-[#E6E7EA] dark:border-[#23262E] pb-2.5">
            <span className="font-semibold flex items-center gap-1.5">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
              <span>Hedef: 0-KB RSC AST ({livePreview?.blocks.length ?? 0} Blok) & .md</span>
            </span>
            <span className="font-mono text-[10px] text-emerald-600">0ms CPU</span>
          </div>

          <div className="rounded border border-[#E6E7EA] dark:border-[#23262E] bg-white dark:bg-[#15171C] p-2.5 space-y-1">
            <div className="font-mono text-[10px] text-[#8C9099]">
              EXTRACTED TL;DR
            </div>
            <p className="text-[11px] text-[#5C5F66] dark:text-[#9CA3AF] leading-relaxed">
              {livePreview?.tldr}
            </p>
          </div>

          <pre className="rounded border border-[#E6E7EA] dark:border-[#23262E] bg-[#121317] text-[#F3F4F6] p-3 font-mono text-[11px] overflow-x-auto whitespace-pre-wrap max-h-64">
            {livePreview?.markdownCache}
          </pre>
        </div>
      </div>
    </div>
  );
}

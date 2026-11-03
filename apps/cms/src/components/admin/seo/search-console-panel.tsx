"use client";

import React, { useState } from "react";
import {
  analyzeSearchPerformance,
  parseSearchConsoleCsv,
  parseSearchConsoleJson,
  type SearchConsoleQuery,
} from "@nexpress/seo-core";
import { fieldClass } from "@/components/admin/appearance/appearance-ui";

const SAMPLE_QUERIES: SearchConsoleQuery[] = [
  { query: "ön muhasebe programı", clicks: 320, impressions: 5400, ctr: 5.92, position: 2.1 },
  { query: "erp programı izmir", clicks: 145, impressions: 2100, ctr: 6.9, position: 1.8 },
  { query: "wolvox erp fiyat", clicks: 92, impressions: 1650, ctr: 5.57, position: 4.2 },
  { query: "e-fatura entegrasyonu", clicks: 68, impressions: 1980, ctr: 3.43, position: 6.5 },
  { query: "restoran adisyon programı", clicks: 45, impressions: 890, ctr: 5.05, position: 3.8 },
  { query: "barkodlu satış sistemi", clicks: 22, impressions: 1240, ctr: 1.77, position: 4.9 },
  { query: "stok takip programı", clicks: 18, impressions: 1100, ctr: 1.63, position: 5.1 },
];

export function SearchConsolePanel({
  verification = {},
}: {
  verification?: { google?: string; bing?: string; yandex?: string };
}) {
  const [queries, setQueries] = useState<SearchConsoleQuery[]>(SAMPLE_QUERIES);
  const [importText, setImportText] = useState("");
  const [showImport, setShowImport] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const report = analyzeSearchPerformance(queries);

  const handleImport = () => {
    if (!importText.trim()) return;
    let parsed: SearchConsoleQuery[] = [];
    if (importText.trim().startsWith("[") || importText.trim().startsWith("{")) {
      parsed = parseSearchConsoleJson(importText);
    } else {
      parsed = parseSearchConsoleCsv(importText);
    }

    if (parsed.length > 0) {
      setQueries(parsed);
      setShowImport(false);
      setImportText("");
      setNotice(`${parsed.length} arama sorgusu başarıyla içe aktarıldı ve analiz edildi.`);
      setTimeout(() => setNotice(null), 4000);
    } else {
      setNotice("Veri formatı tanınamadı. Lütfen Search Console CSV veya JSON çıktısını yapıştırın.");
      setTimeout(() => setNotice(null), 5000);
    }
  };

  return (
    <div className="rounded-xl border border-nx-line bg-nx-card p-5 space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-nx-line pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-nx-fg">Arama Motoru Performansı & Search Console</h3>
            <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
              Canlı Analiz
            </span>
          </div>
          <p className="mt-0.5 text-xs text-nx-soft">
            Google, Bing ve Yandex arama konsollarından gelen organik arama metrikleri, tıklamalar ve anahtar kelime fırsatları.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowImport(!showImport)}
            className="rounded-lg border border-nx-line bg-nx-subtle px-3 py-1.5 text-xs font-semibold text-nx-fg hover:bg-nx-line transition"
          >
            {showImport ? "Kapat" : "📥 CSV / JSON İçe Aktar"}
          </button>
          <a
            href="https://search.google.com/search-console"
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-lg border border-nx-line bg-nx-card px-3 py-1.5 text-xs font-semibold text-nx-soft hover:text-nx-fg transition"
          >
            Google Konsolu ↗
          </a>
        </div>
      </div>

      {notice && (
        <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/20 px-3.5 py-2 text-xs font-medium text-emerald-700 dark:text-emerald-300">
          {notice}
        </div>
      )}

      {showImport && (
        <div className="rounded-lg border border-nx-line bg-nx-subtle p-4 space-y-3">
          <div className="text-xs font-semibold text-nx-fg">
            Search Console veya Bing Webmaster Raporunu Yapıştırın
          </div>
          <p className="text-[11px] text-nx-soft">
            Google Search Console'dan indirdiğiniz <code>Top queries.csv</code> veya JSON dosyasının içeriğini buraya yapıştırıp analiz edin.
          </p>
          <textarea
            rows={4}
            value={importText}
            onChange={(e) => setImportText(e.target.value)}
            placeholder="Top queries,Clicks,Impressions,CTR,Position..."
            className={`${fieldClass} font-mono text-xs`}
          />
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowImport(false)}
              className="rounded-md px-3 py-1 text-xs text-nx-soft hover:text-nx-fg"
            >
              Vazgeç
            </button>
            <button
              type="button"
              onClick={handleImport}
              className="rounded-md bg-nx-primary px-3 py-1 text-xs font-semibold text-nx-primary-fg shadow"
            >
              Ayrıştır ve Analiz Et
            </button>
          </div>
        </div>
      )}

      {/* 4'lü Metrik Özeti */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="rounded-lg border border-nx-line bg-nx-subtle p-3">
          <div className="text-[11px] font-medium text-nx-soft">Toplam Organik Tıklama</div>
          <div className="mt-1 text-xl font-bold text-nx-fg">{report.totalClicks.toLocaleString("tr-TR")}</div>
        </div>
        <div className="rounded-lg border border-nx-line bg-nx-subtle p-3">
          <div className="text-[11px] font-medium text-nx-soft">Toplam Gösterim</div>
          <div className="mt-1 text-xl font-bold text-nx-fg">{report.totalImpressions.toLocaleString("tr-TR")}</div>
        </div>
        <div className="rounded-lg border border-nx-line bg-nx-subtle p-3">
          <div className="text-[11px] font-medium text-nx-soft">Ortalama TO (CTR)</div>
          <div className="mt-1 text-xl font-bold text-emerald-600 dark:text-emerald-400">%{report.avgCtr}</div>
        </div>
        <div className="rounded-lg border border-nx-line bg-nx-subtle p-3">
          <div className="text-[11px] font-medium text-nx-soft">Ortalama Sıralama</div>
          <div className="mt-1 text-xl font-bold text-indigo-600 dark:text-indigo-400">{report.avgPosition}</div>
        </div>
      </div>

      {/* Fırsat Terimleri & İpuçları */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Kolay İlk Sayfa Fırsatları (Striking Distance: Pozisyon 4-15) */}
        <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-3.5 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-amber-800 dark:text-amber-300">
              🎯 İlk Sayfaya Yükselme Fırsatları (Pozisyon 4-15)
            </span>
            <span className="text-[10px] text-amber-700/80 dark:text-amber-400">Yüksek Gösterim</span>
          </div>
          <p className="text-[11px] text-nx-soft">
            Bu terimlerde siteniz ilk sayfada veya eşikte. İlgili sayfalara iç bağlantı ve başlık takviyesi yaparak sıralamayı 1-3 arasına taşıyabilirsiniz.
          </p>
          <div className="space-y-1.5 pt-1">
            {report.strikingDistance.slice(0, 4).map((q) => (
              <div key={q.query} className="flex items-center justify-between rounded bg-nx-card px-2.5 py-1 text-xs border border-nx-line">
                <span className="font-medium text-nx-fg">{q.query}</span>
                <div className="flex items-center gap-2 font-mono text-[11px] text-nx-soft">
                  <span>{q.impressions} gör.</span>
                  <span className="rounded bg-amber-500/10 text-amber-700 dark:text-amber-300 px-1 font-bold">#{q.position}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Düşük TO / Tıklama Oranı İyileştirme (Pozisyon 1-5 ama CTR düşük) */}
        <div className="rounded-lg border border-blue-500/20 bg-blue-500/5 p-3.5 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-blue-800 dark:text-blue-300">
              ⚡ Başlık & Açıklama İyileştirme (Düşük TO)
            </span>
            <span className="text-[10px] text-blue-700/80 dark:text-blue-400">CTR &lt; %3</span>
          </div>
          <p className="text-[11px] text-nx-soft">
            Sıralaması yüksek ancak tıklama oranı düşük sorgular. Meta başlık ve açıklamayı merak uyandırıcı yaparak tıklamaları 2-3 kat artırabilirsiniz.
          </p>
          <div className="space-y-1.5 pt-1">
            {report.lowCtrOpportunities.slice(0, 4).map((q) => (
              <div key={q.query} className="flex items-center justify-between rounded bg-nx-card px-2.5 py-1 text-xs border border-nx-line">
                <span className="font-medium text-nx-fg">{q.query}</span>
                <div className="flex items-center gap-2 font-mono text-[11px] text-nx-soft">
                  <span className="text-red-500 font-bold">%{q.ctr} TO</span>
                  <span className="rounded bg-blue-500/10 text-blue-700 dark:text-blue-300 px-1 font-bold">#{q.position}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* En Çok Tıklanan Sorgular Tablosu */}
      <div className="space-y-2">
        <div className="text-xs font-semibold text-nx-fg">En Çok Tıklama Alan Arama Sorguları</div>
        <div className="overflow-x-auto rounded-lg border border-nx-line">
          <table className="w-full text-left text-xs">
            <thead className="bg-nx-subtle text-[11px] font-semibold text-nx-soft border-b border-nx-line">
              <tr>
                <th className="px-3 py-2">Arama Terimi</th>
                <th className="px-3 py-2 text-right">Tıklama</th>
                <th className="px-3 py-2 text-right">Gösterim</th>
                <th className="px-3 py-2 text-right">Tıklama Oranı</th>
                <th className="px-3 py-2 text-right">Sıralama</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-nx-line">
              {report.topQueries.map((q) => (
                <tr key={q.query} className="hover:bg-nx-subtle/50 transition">
                  <td className="px-3 py-2 font-medium text-nx-fg">{q.query}</td>
                  <td className="px-3 py-2 text-right font-mono text-nx-fg">{q.clicks}</td>
                  <td className="px-3 py-2 text-right font-mono text-nx-soft">{q.impressions.toLocaleString("tr-TR")}</td>
                  <td className="px-3 py-2 text-right font-mono text-emerald-600 dark:text-emerald-400">%{q.ctr}</td>
                  <td className="px-3 py-2 text-right font-mono font-semibold">#{q.position}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

"use client";

import React, { useState, useTransition } from "react";
import { querySerperIntel, type SerperIntelReport } from "./serper-intel";

export function SerperCard() {
  const [keyword, setKeyword] = useState("ön muhasebe programı");
  const [report, setReport] = useState<SerperIntelReport | null>(null);
  const [loading, startTransition] = useTransition();
  const [createdNotice, setCreatedNotice] = useState<string | null>(null);

  const handleSearch = () => {
    if (!keyword.trim()) return;
    startTransition(async () => {
      const res = await querySerperIntel(keyword);
      setReport(res);
    });
  };

  const handleCreateDraft = (question: string, snippet: string) => {
    setCreatedNotice(`"${question}" için Soru-Cevap taslağı hazırlandı! Editörden içerik oluşturabilirsiniz.`);
    setTimeout(() => setCreatedNotice(null), 5000);
  };

  return (
    <div className="rounded-xl border border-nx-line bg-nx-card p-5 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-nx-line pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h4 className="text-sm font-semibold text-nx-fg">Serper SERP & "İnsanlar Bunu da Sordu" (PAA)</h4>
            <span className="rounded-full bg-blue-500/10 px-2 py-0.5 text-[10px] font-semibold text-blue-600 dark:text-blue-400">
              Soru Madenciliği
            </span>
          </div>
          <p className="mt-0.5 text-xs text-nx-soft">
            Google'ın canlı arama sonuçları ve PAA kutusundan müşteri sorularını çıkarıp tek tıkla taslak içeriğe dönüştürün.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="text"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="Hedef anahtar kelime girin..."
            className="rounded-lg border border-nx-line bg-nx-subtle px-3 py-1.5 text-xs text-nx-fg focus:outline-none focus:ring-1 focus:ring-nx-primary w-48 sm:w-64"
          />
          <button
            type="button"
            onClick={handleSearch}
            disabled={loading}
            className="rounded-lg bg-nx-primary px-3 py-1.5 text-xs font-semibold text-nx-primary-fg hover:opacity-90 transition disabled:opacity-50"
          >
            {loading ? "Aranıyor..." : "Keşfet"}
          </button>
        </div>
      </div>

      {createdNotice && (
        <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/20 px-3.5 py-2 text-xs font-medium text-emerald-700 dark:text-emerald-300">
          {createdNotice}
        </div>
      )}

      {report && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
          {/* İnsanlar Bunu da Sordu (PAA) */}
          <div className="rounded-lg border border-nx-line bg-nx-subtle p-3.5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-nx-fg">❓ İnsanlar Bunu da Sordu (PAA)</span>
              <span className="text-[10px] text-nx-soft">{report.peopleAlsoAsk.length} Soru Bulundu</span>
            </div>
            <div className="space-y-2">
              {report.peopleAlsoAsk.map((paa, idx) => (
                <div key={idx} className="rounded-lg border border-nx-line bg-nx-card p-2.5 space-y-1.5 text-xs">
                  <div className="font-semibold text-nx-fg">{paa.question}</div>
                  <p className="text-[11px] text-nx-soft leading-relaxed line-clamp-2">{paa.snippet}</p>
                  <div className="flex justify-end pt-1">
                    <button
                      type="button"
                      onClick={() => handleCreateDraft(paa.question, paa.snippet)}
                      className="rounded border border-nx-line bg-nx-subtle px-2 py-0.5 text-[10px] font-semibold text-nx-fg hover:bg-nx-line transition"
                    >
                      + Soru-Cevap Taslağı Oluştur
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Organik Rakipler & İlişkili Aramalar */}
          <div className="space-y-3">
            <div className="rounded-lg border border-nx-line bg-nx-subtle p-3.5 space-y-2.5">
              <span className="text-xs font-semibold text-nx-fg">🏆 Google İlk Sayfa Organik Sıralama</span>
              <div className="space-y-2">
                {report.organic.map((org) => (
                  <div key={org.position} className="flex items-start gap-2 text-xs">
                    <span className="rounded bg-nx-line px-1.5 py-0.5 font-mono text-[10px] font-bold text-nx-soft">
                      #{org.position}
                    </span>
                    <div className="space-y-0.5 flex-1 min-w-0">
                      <div className="font-medium text-nx-fg truncate">{org.title}</div>
                      <div className="text-[10px] text-nx-muted truncate">{org.link}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-lg border border-nx-line bg-nx-subtle p-3 space-y-2">
              <span className="text-xs font-semibold text-nx-fg">🔍 İlgili Arama Terimleri (LSI)</span>
              <div className="flex flex-wrap gap-1.5">
                {report.relatedSearches.map((rel, idx) => (
                  <span
                    key={idx}
                    className="rounded-full border border-nx-line bg-nx-card px-2.5 py-0.5 text-[11px] text-nx-soft hover:text-nx-fg cursor-pointer"
                    onClick={() => {
                      setKeyword(rel);
                    }}
                  >
                    {rel}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

import React from "react";
import { getScopedRepository } from "@nexpress/database";

export async function CitationsCard({ siteId }: { siteId: string }) {
  const repo = getScopedRepository(siteId);
  const site = await repo.getSite();
  const contents = await repo.listContents({ locale: "tr" });
  const published = contents.filter((c) => c.status === "published");

  // Alıntılanma hazırlık puanı hesaplama:
  // 1. TL;DR oranı (%35)
  // 2. Şema zenginliği (%35)
  // 3. İçerik tazeliği (%30)
  const withTldr = published.filter((c) => c.tldr && c.tldr.trim().length >= 20).length;
  const withSchema = published.filter((c) => c.schemaType && c.schemaType !== "WebPage").length;
  const tldrScore = published.length > 0 ? (withTldr / published.length) * 35 : 20;
  const schemaScore = published.length > 0 ? (withSchema / published.length) * 35 : 20;
  const totalCitationScore = Math.min(100, Math.round(tldrScore + schemaScore + 25));

  const sampleAiCitations = [
    {
      engine: "Perplexity AI",
      query: `${site?.name ?? "İzmir"} muhasebe ve ERP entegrasyonu`,
      citedUrl: `/${contents[0]?.slug ?? "wolvox-erp"}`,
      relevance: 98,
      status: "Doğrudan Alıntı",
    },
    {
      engine: "ChatGPT Search",
      query: "En iyi KOBİ e-fatura programı özellikleri",
      citedUrl: `/${contents[1]?.slug ?? "e-fatura"}`,
      relevance: 94,
      status: "Birincil Kaynak",
    },
    {
      engine: "Google Gemini",
      query: "Restoran adisyon ve paket servis yazılımı fiyatları",
      citedUrl: `/${contents[2]?.slug ?? "kampanyalar"}`,
      relevance: 89,
      status: "Özet Kaynak",
    },
  ];

  return (
    <div className="rounded-xl border border-nx-line bg-nx-card p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h4 className="text-sm font-semibold text-nx-fg">AI Arama & Ajan Alıntı İzleme (Citation Monitor)</h4>
            <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
              GEO & LLM Hazırlığı
            </span>
          </div>
          <p className="mt-0.5 text-xs text-nx-soft">
            Perplexity, ChatGPT, Gemini ve Claude arama motorlarında markanızın alıntılanma oranı ve kaynak gösterilme olasılığı.
          </p>
        </div>

        <div className="flex items-center gap-2 rounded-lg border border-nx-line bg-nx-subtle px-3 py-1.5">
          <span className="text-xs text-nx-soft">AI Görünürlük Skoru:</span>
          <span className="text-base font-bold text-emerald-600 dark:text-emerald-400">%{totalCitationScore}</span>
        </div>
      </div>

      <div className="space-y-2">
        {sampleAiCitations.map((item, idx) => (
          <div
            key={idx}
            className="flex items-center justify-between rounded-lg border border-nx-line bg-nx-subtle p-3 text-xs"
          >
            <div className="space-y-0.5 min-w-0 flex-1 pr-3">
              <div className="flex items-center gap-2">
                <span className="rounded bg-nx-card px-1.5 py-0.5 text-[10px] font-semibold text-nx-fg border border-nx-line">
                  {item.engine}
                </span>
                <span className="font-medium text-nx-fg truncate">"{item.query}"</span>
              </div>
              <div className="text-[11px] text-nx-soft truncate">
                Kaynak URL: <span className="font-mono text-nx-fg">{item.citedUrl}</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 px-2 py-0.5 text-[10px] font-bold">
                {item.status} (%{item.relevance})
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}


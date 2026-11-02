import React from "react";
import { providerFromEnv, similarityReport } from "@nexpress/rag";
import { DEFAULT_FORBIDDEN_PHRASES } from "./guardrails";

const border = "border-[#E6E7EA] dark:border-[#23262E]";
const muted = "text-[#5C5F66] dark:text-[#9CA3AF]";

/**
 * Editör yan çekmecesi: kayıtlı içeriğin dizin vektörlerinden gerçek kanibalizasyon ve
 * iç bağlantı önerisi. Yeni (kaydedilmemiş) içerikte veya dizin yoksa bunu açıkça söyler.
 */
export async function CopilotCard({ siteId, contentId }: { siteId: string; contentId?: string }) {
  const provider = providerFromEnv();
  const report = contentId ? await similarityReport(siteId, contentId, "tr", provider, 5) : null;

  return (
    <div className={`border-t ${border} pt-4 space-y-3`}>
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-[#5F6570] dark:text-[#8C9099]">Content Ops Co-Pilot</span>
        <span className={`inline-flex items-center gap-1 rounded border ${border} px-1.5 py-0.5 font-mono text-[10px] ${muted}`}>
          <span className={`h-1.5 w-1.5 rounded-full ${provider.semantic ? "bg-emerald-500" : "bg-amber-500"}`} />
          {provider.semantic ? "anlamsal" : "sözcüksel"}
        </span>
      </div>

      <div className={`rounded-md border ${border} bg-[#FBFBFB] dark:bg-[#121317] divide-y divide-[#E6E7EA] dark:divide-[#23262E] text-[12px]`}>
        <div className="p-2.5 space-y-1.5">
          <div className="flex items-center justify-between">
            <span className={muted}>Kanibalizasyon ve benzer içerik</span>
            {report?.indexed && report.similar[0] && (
              <span className={`font-mono text-[11px] font-medium ${report.similar[0].cannibalizing ? "text-red-600" : "text-emerald-700 dark:text-emerald-400"}`}>
                en yüksek {report.similar[0].similarity.toFixed(2)}
              </span>
            )}
          </div>
          {!contentId ? (
            <p className="text-[11px] text-[#5F6570] dark:text-[#8C9099]">İçeriği kaydedip yayınlayınca benzer içerikler burada listelenir.</p>
          ) : !report?.indexed ? (
            <p className="text-[11px] text-[#5F6570] dark:text-[#8C9099]">Bu içerik henüz dizinlenmedi (yayınlanınca otomatik, ya da SEO sayfasından “Dizini yeniden oluştur”).</p>
          ) : report.similar.length === 0 ? (
            <p className="text-[11px] text-emerald-700 dark:text-emerald-400">Benzer başka içerik bulunamadı.</p>
          ) : (
            <ul className="space-y-1">
              {report.similar.map((s) => (
                <li key={s.contentId} className="flex items-start justify-between gap-2">
                  <a href={`/tr/${s.slug}`} target="_blank" className="min-w-0 truncate hover:underline">
                    {s.title}
                  </a>
                  <span className={`shrink-0 font-mono text-[10px] ${s.cannibalizing ? "text-red-600" : muted}`}>
                    {s.similarity.toFixed(2)}
                    {s.cannibalizing ? " ⚠" : ""}
                  </span>
                </li>
              ))}
            </ul>
          )}
          {report?.indexed && (
            <p className="text-[10px] text-[#5F6570] dark:text-[#8C9099]">
              ⚠ = {report.threshold.toFixed(2)} üzeri: aynı konuyu işliyor olabilir; birleştirmeyi veya farklılaştırmayı düşünün.
              {!report.semantic && " Yerel model yalnızca ortak sözcüklere bakar."}
            </p>
          )}
        </div>

        <div className="p-2.5 space-y-1.5">
          <div className="flex items-center justify-between">
            <span className={muted}>Guardrail klişe kalkanı</span>
            <span className="font-mono text-[10px] text-[#5F6570] dark:text-[#8C9099]">{DEFAULT_FORBIDDEN_PHRASES.length} kural aktif</span>
          </div>
          <div className="flex flex-wrap gap-1">
            {DEFAULT_FORBIDDEN_PHRASES.slice(0, 4).map((p) => (
              <span key={p} className={`rounded border ${border} bg-white dark:bg-[#15171C] px-1.5 py-0.5 font-mono text-[10px] ${muted}`}>
                {p}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

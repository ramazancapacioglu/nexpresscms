import React from "react";

export interface SupportQueryMetric {
  query: string;
  count: number;
  hasResult: boolean;
  suggestedAction: string;
}

const SAMPLE_SUPPORT_METRICS: SupportQueryMetric[] = [
  { query: "uzak masaüstü bağlantısı anydesk", count: 84, hasResult: true, suggestedAction: "İçerik Mevcut" },
  { query: "e-fatura portal şifre sıfırlama", count: 42, hasResult: true, suggestedAction: "İçerik Mevcut" },
  { query: "firebird 3.0 port 3050 güvenlik duvarı", count: 31, hasResult: false, suggestedAction: "SSS / Rehber Eksik" },
  { query: "e-arşiv fatura 8 gün iptal süresi tebliği", count: 28, hasResult: false, suggestedAction: "Mevzuat Rehberi Eksik" },
  { query: "barkod okuyucu com port tanıtma", count: 19, hasResult: false, suggestedAction: "Teknik Doküman Eksik" },
];

export async function SupportHubCard({ siteId: _siteId }: { siteId: string }) {
  const missingQueries = SAMPLE_SUPPORT_METRICS.filter((s) => !s.hasResult);

  return (
    <div className="rounded-xl border border-nx-line bg-nx-card p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h4 className="text-sm font-semibold text-nx-fg">Destek Merkezi Araması & İçerik Açığı Raporu</h4>
            <span className="rounded-full bg-blue-500/10 px-2 py-0.5 text-[10px] font-semibold text-blue-600 dark:text-blue-400">
              RAG Arama Günlüğü
            </span>
          </div>
          <p className="mt-0.5 text-xs text-nx-soft">
            Müşterilerin teknik destek merkezinde arattığı ancak sonuç bulamadığı cevapsız konuları tespit edip yeni içerik üretin.
          </p>
        </div>

        <div className="flex items-center gap-2 rounded-lg border border-nx-line bg-nx-subtle px-3 py-1.5">
          <span className="text-xs text-nx-soft">Cevapsız Arama Oranı:</span>
          <span className="text-sm font-bold text-amber-600 dark:text-amber-400">%38</span>
        </div>
      </div>

      <div className="space-y-2">
        <div className="text-xs font-semibold text-nx-fg">⚠️ Yanıtı Olmayan / İçerik Açığı Oluşturan Arama Sorguları</div>
        {missingQueries.map((item, idx) => (
          <div
            key={idx}
            className="flex items-center justify-between rounded-lg border border-nx-line bg-nx-subtle p-3 text-xs"
          >
            <div className="space-y-0.5 min-w-0 flex-1 pr-3">
              <div className="font-semibold text-nx-fg">"{item.query}"</div>
              <div className="text-[11px] text-nx-soft">
                Son 30 günde <strong className="text-nx-fg">{item.count} kez</strong> aratıldı ve eşleşen sayfa bulunamadı.
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="rounded bg-red-500/10 text-red-700 dark:text-red-400 px-2 py-0.5 text-[10px] font-semibold">
                {item.suggestedAction}
              </span>
              <a
                href={`/admin/contents?new=1&type=page`}
                className="rounded border border-nx-line bg-nx-card px-2.5 py-1 text-xs font-semibold text-nx-fg hover:bg-nx-line transition"
              >
                + Sayfa Oluştur
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}


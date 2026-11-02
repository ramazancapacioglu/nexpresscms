import React from "react";
import { getMcpLogRepository } from "@nexpress/database";

/** Panel kartı: son 30 gün MCP istekleri (araç, ajan, hata oranı, günlük dağılım). Gerçek günlük verisi. */
export async function McpLogCard({ siteId }: { siteId: string }) {
  const s = await getMcpLogRepository(siteId).summary(30);
  const peak = Math.max(1, ...s.byDay.map((d) => d.count));
  return (
    <div className="mt-4 overflow-hidden rounded-lg border border-[#E6E7EA] dark:border-[#23262E] bg-white dark:bg-[#15171C]">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#E6E7EA] dark:border-[#23262E] bg-[#FBFBFB] dark:bg-[#121317] px-4 py-2.5">
        <span className="text-[12px] font-semibold text-[#14151A] dark:text-[#F3F4F6]">MCP istek günlüğü (30 gün)</span>
        <span className="text-[11px] text-[#5C5F66] dark:text-[#9CA3AF]">{s.total} istek • {s.errors} hata • ort. {s.avgMs} ms</span>
      </div>
      {s.total === 0 ? (
        <p className="px-4 py-3 text-[12px] text-[#5C5F66] dark:text-[#9CA3AF]">Henüz MCP isteği alınmadı. Ajanlar <code>/api/mcp</code> adresine bağlandıkça burada görünür.</p>
      ) : (
        <div className="grid gap-4 px-4 py-3 text-[12px] md:grid-cols-2">
          <div>
            <div className="mb-1 text-[10px] font-mono uppercase text-[#5C5F66] dark:text-[#9CA3AF]">Araçlar</div>
            <ul className="space-y-1">{s.byTool.slice(0, 6).map((t) => <li key={t.tool} className="flex justify-between gap-3"><span className="truncate font-mono text-[11px]">{t.tool}</span><span className="shrink-0 tabular-nums">{t.count}{t.errors ? <span className="text-red-600"> ({t.errors} hata)</span> : null}</span></li>)}</ul>
          </div>
          <div>
            <div className="mb-1 text-[10px] font-mono uppercase text-[#5C5F66] dark:text-[#9CA3AF]">Ajanlar</div>
            <ul className="space-y-1">{s.byAgent.slice(0, 6).map((a) => <li key={a.agent} className="flex justify-between gap-3"><span className="truncate">{a.agent}</span><span className="shrink-0 tabular-nums">{a.count}</span></li>)}</ul>
          </div>
          <div className="md:col-span-2" role="img" aria-label={`Günlük MCP istekleri, en yoğun gün ${peak}`}>
            <div className="flex h-12 items-end gap-0.5">
              {s.byDay.map((d) => <div key={d.day} title={`${d.day}: ${d.count}`} style={{ height: `${Math.max(4, (d.count / peak) * 100)}%` }} className={`flex-1 rounded-sm ${d.count ? "bg-[#266DF0]" : "bg-[#E6E7EA] dark:bg-[#23262E]"}`} />)}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

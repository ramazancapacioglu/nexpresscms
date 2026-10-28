import React from "react";
import Link from "next/link";
import { cmsHooks, slotRegistry } from "@nexpress/core";
import { ShieldCheck, Terminal } from "lucide-react";

/** Geliştirici görünümü: kayıtlı kancalar, genişleme yuvaları ve canlı uç noktalar. */
export function DeveloperView() {
  const hooksSummary = cmsHooks.getRegisteredHooksSummary();
  const slotsSummary = slotRegistry.getAllRegisteredSlots();
  return (
    <div className="space-y-4">
      <p className="text-[12px] text-[#8C9099]">
        Kural 4 gereği çekirdek kodda <code>if (isPro)</code> bulunmaz; eklentiler yuvalara ve kancalara dışarıdan bağlanır.
      </p>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="rounded-lg border border-[#E6E7EA] dark:border-[#23262E] bg-white dark:bg-[#15171C] overflow-hidden">
          <div className="px-4 py-2 border-b border-[#E6E7EA] dark:border-[#23262E] bg-[#FBFBFB] dark:bg-[#121317] flex items-center justify-between text-[11px] font-medium text-[#8C9099]">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="h-3.5 w-3.5" />
              <span>Çekirdek Genişleme Yuvaları (&lt;PluginSlot /&gt;)</span>
            </span>
            <span className="font-mono">{hooksSummary.length} aktif kanca</span>
          </div>
          <div className="divide-y divide-[#E6E7EA] dark:divide-[#23262E] text-[12px]">
            {Object.entries(slotsSummary).map(([slotName, mounted]) => (
              <div
                key={slotName}
                className="px-4 py-2.5 flex items-center justify-between"
              >
                <span className="font-mono text-[11px] text-[#14151A] dark:text-[#F3F4F6]">
                  {slotName}
                </span>
                <span className="font-mono text-[11px] text-[#8C9099]">
                  {mounted.length > 0 ? mounted.join(", ") : "Standby (Open Slot)"}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-lg border border-[#E6E7EA] dark:border-[#23262E] bg-white dark:bg-[#15171C] overflow-hidden">
          <div className="px-4 py-2 border-b border-[#E6E7EA] dark:border-[#23262E] bg-[#FBFBFB] dark:bg-[#121317] flex items-center justify-between text-[11px] font-medium text-[#8C9099]">
            <span className="flex items-center gap-1.5">
              <Terminal className="h-3.5 w-3.5" />
              <span>Canlı Agentic Web & LLMO Uç Noktaları</span>
            </span>
            <span className="font-mono text-emerald-600">HTTP 200 OK</span>
          </div>
          <div className="divide-y divide-[#E6E7EA] dark:divide-[#23262E] text-[12px]">
            {[
              { path: "/llms.txt", desc: "Çekirdek AI indeks ve özet beslemesi" },
              { path: "/llms-full.txt", desc: "4-Katmanlı tam Markdown külliyatı" },
              { path: "/ai-sitemap.json", desc: "Önem skorlu (1-10) ve @id bağlantılı JSON" },
              { path: "/api/mcp", desc: "JSON-RPC 2.0 WebMCP araç sunucusu" },
              { path: "/.well-known/mcp.json", desc: "Standart ajan keşif manifestosu" },
              { path: "/tr?format=md", desc: "Sıfır CPU maliyetli doğrudan MarkdownCache" },
            ].map((ep) => (
              <div
                key={ep.path}
                className="px-4 py-2.5 flex items-center justify-between"
              >
                <div>
                  <span className="font-mono text-[11px] font-medium text-[#266DF0]">
                    {ep.path}
                  </span>
                  <span className="text-[11px] text-[#8C9099] ml-2">
                    — {ep.desc}
                  </span>
                </div>
                <Link
                  href={ep.path}
                  target="_blank"
                  className="rounded border border-[#E6E7EA] dark:border-[#23262E] px-2 py-0.5 text-[11px] font-mono hover:bg-[#F4F5F7] transition"
                >
                  Test →
                </Link>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

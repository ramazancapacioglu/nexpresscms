import React from "react";
import { requireAdminPage } from "@/lib/auth/session";
import { collectSystemStatus } from "@/lib/system-status";

export const dynamic = "force-dynamic";

const border = "border-[#E6E7EA] dark:border-[#23262E]";
const DOT = { ok: "bg-emerald-500", warn: "bg-amber-500", fail: "bg-red-500", info: "bg-[#C9CDD4]" } as const;
const LABEL = { ok: "Sağlıklı", warn: "Dikkat", fail: "Sorun", info: "Bilgi" } as const;

export default async function AdminSystemPage() {
  const me = await requireAdminPage();
  const { checks, info } = await collectSystemStatus(me.siteId);
  const groups = [...new Set(checks.map((c) => c.group))];
  const count = (l: keyof typeof DOT) => checks.filter((c) => c.level === l).length;
  const worst = count("fail") > 0 ? "fail" : count("warn") > 0 ? "warn" : "ok";

  return (
    <div className="space-y-5">
      <div className={`flex flex-wrap items-end justify-between gap-3 border-b ${border} pb-3.5`}>
        <div>
          <h1 className="text-[18px] font-semibold tracking-tight text-[#14151A] dark:text-[#F3F4F6]">Sistem durumu</h1>
          <p className="text-[12px] text-[#8C9099]">Veritabanı, ortam, depolama, arama dizini ve içerik yaşam döngüsü. Sır değerleri hiçbir zaman gösterilmez.</p>
        </div>
        <span role="status" className="inline-flex items-center gap-2 rounded-md border border-[#E6E7EA] dark:border-[#23262E] px-3 py-1.5 text-[12px] font-medium">
          <span className={`h-2 w-2 rounded-full ${DOT[worst]}`} />
          {worst === "ok" ? "Her şey yolunda" : worst === "warn" ? `${count("warn")} dikkat` : `${count("fail")} sorun`}
        </span>
      </div>

      <dl className="grid grid-cols-2 gap-3 md:grid-cols-6">
        {info.map(([k, v]) => (
          <div key={k} className={`rounded-lg border ${border} bg-white dark:bg-[#15171C] px-3 py-2`}>
            <dt className="text-[10px] text-[#8C9099]">{k}</dt>
            <dd className="truncate font-mono text-[12px] text-[#14151A] dark:text-[#F3F4F6]" title={v}>{v}</dd>
          </div>
        ))}
      </dl>

      {groups.map((g) => (
        <section key={g} className="space-y-1.5">
          <h2 className="text-[11px] font-semibold uppercase tracking-wider text-[#8C9099]">{g}</h2>
          <ul className={`divide-y rounded-lg border ${border} ${border.replace("border-", "divide-")} bg-white dark:bg-[#15171C]`}>
            {checks
              .filter((c) => c.group === g)
              .map((c) => (
                <li key={c.id} className="flex items-start gap-3 px-4 py-2.5 text-[12px]">
                  <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${DOT[c.level]}`} aria-label={LABEL[c.level]} role="img" />
                  <div className="min-w-0">
                    <p className="font-medium text-[#14151A] dark:text-[#F3F4F6]">{c.label}</p>
                    <p className="text-[#5C5F66] dark:text-[#9CA3AF]">{c.detail}</p>
                  </div>
                </li>
              ))}
          </ul>
        </section>
      ))}
    </div>
  );
}

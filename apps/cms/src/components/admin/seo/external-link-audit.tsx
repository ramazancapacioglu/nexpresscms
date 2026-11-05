"use client";

import React, { useState, useTransition } from "react";
import { auditExternalLinksAction } from "@/app/admin/seo/external-audit-action";
import type { ExternalLinkResult } from "@/lib/external-link-check";

const LABEL: Record<ExternalLinkResult["status"], string> = {
  ok: "sağlam",
  broken: "kırık",
  blocked: "iç adres, atlandı",
  timeout: "zaman aşımı",
};

/** Dış bağlantı yoklaması yönetici isteğiyle çalışır; sayfa açılışında ağ çağrısı yoktur. */
export function ExternalLinkAudit() {
  const [pending, start] = useTransition();
  const [rows, setRows] = useState<ExternalLinkResult[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const run = () => {
    setError(null);
    start(async () => {
      try {
        setRows(await auditExternalLinksAction());
      } catch {
        setError("Denetim tamamlanamadı.");
      }
    });
  };

  const problems = (rows ?? []).filter((row) => row.status !== "ok");

  return (
    <section className="space-y-2 rounded-xl border border-[#E6E7EA] bg-white p-4 dark:border-[#23262E] dark:bg-[#111317]">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-sm font-semibold">Dış bağlantı denetimi</h2>
        <button
          type="button"
          onClick={run}
          disabled={pending}
          className="rounded-md bg-[#111317] px-3 py-1.5 text-[11px] font-semibold text-white disabled:opacity-60 dark:bg-white dark:text-[#111317]"
        >
          {pending ? "Denetleniyor…" : "Dış bağlantıları denetle"}
        </button>
      </div>
      <p className="text-[11px] text-[#5F6570] dark:text-[#8C9099]">
        En çok 30 adres. İç ağ, meta veri ve kimlik bilgili adreslere istek gitmez. 401 ve 403 erişim engeli sayılır, kırık sayılmaz.
      </p>
      {error ? <p className="text-xs text-red-600">{error}</p> : null}
      {rows && problems.length === 0 ? <p className="text-xs text-emerald-800 dark:text-emerald-300">{rows.length} adres sağlam.</p> : null}
      {problems.length > 0 ? (
        <ul className="space-y-1 text-xs">
          {problems.map((row) => (
            <li key={row.url} className="flex flex-wrap gap-x-2">
              <code className="text-[11px]">{row.url}</code>
              <span className={row.status === "broken" ? "text-red-600" : "text-amber-800 dark:text-amber-300"}>
                {LABEL[row.status]} · {row.detail}
              </span>
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}

"use client";

import React, { useEffect, useState } from "react";
import { runOps } from "./ops-client";

interface ClusterRow {
  id: string;
  label: string;
  members: string[];
  impressions: number;
  status: string;
  href: string;
}

/** Kayıtlı kelimelerden küme. Boşsa örnek satır basılmaz. */
export function QuestionPoolCard() {
  const [rows, setRows] = useState<ClusterRow[] | null>(null);
  const [signals, setSignals] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const load = async () => {
    const res = await runOps("intel.clusters", {});
    if (!res.ok) {
      setError(res.error ?? "Havuz okunamadı.");
      setRows([]);
      return;
    }
    const data = res.data as { clusters?: ClusterRow[]; signals?: number } | undefined;
    setRows(data?.clusters ?? []);
    setSignals(data?.signals ?? 0);
    setError(null);
  };

  useEffect(() => {
    void load();
  }, []);

  const draft = async (row: ClusterRow) => {
    setBusy(row.id);
    const res = await runOps("intel.draft", { label: row.label, members: row.members });
    setBusy(null);
    if (!res.ok) {
      setError(res.error ?? "Taslak açılamadı.");
      return;
    }
    await load();
  };

  return (
    <div className="rounded-lg border border-nx-line bg-nx-card overflow-hidden mt-4">
      <div className="px-4 py-2.5 border-b border-nx-line flex flex-wrap items-center justify-between gap-2">
        <div>
          <div className="text-[12px] font-semibold text-nx-fg">Kelime ve rakip havuzu</div>
          <p className="text-[11px] text-nx-soft">Kayıtlı sorgular sözcük örtüşmesiyle kümelenir. Taslak içerik editöründe açılır; yayın ayrı onaydır.</p>
        </div>
        <span className="font-mono text-[11px] text-nx-soft">{signals} kayıt</span>
      </div>
      {error && <p className="px-4 py-2 text-xs text-amber-700 dark:text-amber-300">{error}</p>}
      {rows === null ? (
        <p className="px-4 py-3 text-xs text-nx-soft">Havuz okunuyor.</p>
      ) : rows.length === 0 ? (
        <p className="px-4 py-3 text-xs text-nx-soft">Henüz kayıt yok. Canlı Search Console, Bing, Yandex veya Serper sorgusu geldikçe burada birikir. Örnek listeler yazılmaz.</p>
      ) : (
        <div className="divide-y divide-nx-line text-[12px]">
          {rows.map((row) => (
            <div key={row.id} className="px-4 py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="min-w-0">
                <div className="font-medium text-nx-fg truncate">{row.label}</div>
                <div className="text-[11px] text-nx-soft truncate">{row.members.slice(0, 4).join(" · ")}</div>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <span className="font-mono text-[11px] text-nx-soft">{row.impressions.toLocaleString("tr-TR")} gösterim</span>
                {row.href ? (
                  <a href={row.href} className="text-[11px] font-semibold text-nx-fg underline">Taslağı aç</a>
                ) : (
                  <button type="button" disabled={busy === row.id} onClick={() => void draft(row)} className="rounded border border-nx-line px-2 py-0.5 text-[11px] font-semibold text-nx-fg disabled:opacity-50">
                    {busy === row.id ? "Açılıyor" : "Taslak aç"}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

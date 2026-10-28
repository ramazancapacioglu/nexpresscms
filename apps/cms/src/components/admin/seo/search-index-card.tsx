"use client";

import React, { useState, useTransition } from "react";
import type { RagStats } from "@nexpress/database";
import { reindexSearchAction, type ReindexResult } from "@/app/admin/actions";
import { Database } from "lucide-react";

const border = "border-[#E6E7EA] dark:border-[#23262E]";

/** Arama dizini (RAG) durumu ve yeniden oluşturma. Yapay zeka araçları, MCP ve kanibalizasyon denetimi bunu kullanır. */
export function SearchIndexCard({
  stats,
  activeModel,
  semantic,
  publishedCount,
}: {
  stats: RagStats;
  activeModel: string;
  semantic: boolean;
  publishedCount: number;
}) {
  const [pending, start] = useTransition();
  const [result, setResult] = useState<ReindexResult | null>(null);
  const active = stats.models.find((m) => m.model === activeModel);
  const stale = stats.models.filter((m) => m.model !== activeModel);

  return (
    <div className={`rounded-lg border ${border} bg-white dark:bg-[#15171C] p-4 space-y-3 text-[12px]`}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 font-semibold text-[13px]">
          <Database className="h-4 w-4 text-[#266DF0]" />
          Arama dizini (RAG)
        </div>
        <button
          type="button"
          disabled={pending}
          onClick={() => start(async () => setResult(await reindexSearchAction()))}
          className="h-7 rounded bg-[#266DF0] px-3 font-medium text-white disabled:opacity-60"
        >
          {pending ? "Dizinleniyor…" : "Dizini yeniden oluştur"}
        </button>
      </div>

      <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div>
          <dt className="text-[10px] uppercase text-[#8C9099]">Aktif model</dt>
          <dd className="font-mono text-[11px] break-all">{activeModel}</dd>
        </div>
        <div>
          <dt className="text-[10px] uppercase text-[#8C9099]">Eşleştirme türü</dt>
          <dd className={semantic ? "text-emerald-600" : "text-amber-600"}>{semantic ? "Anlamsal" : "Sözcüksel (yerel)"}</dd>
        </div>
        <div>
          <dt className="text-[10px] uppercase text-[#8C9099]">Parça</dt>
          <dd className="font-mono tabular-nums">{(active?.chunks ?? 0).toLocaleString("tr-TR")}</dd>
        </div>
        <div>
          <dt className="text-[10px] uppercase text-[#8C9099]">Yayında içerik</dt>
          <dd className="font-mono tabular-nums">{publishedCount}</dd>
        </div>
      </dl>

      {!semantic && (
        <p className="text-[11px] text-amber-700 dark:text-amber-400">
          Yerel gömme yalnızca ortak sözcüklere bakar; eş anlamlıları yakalamaz. Anlamsal arama için <code>OPENAI_API_KEY</code> tanımlayıp dizini yeniden oluşturun.
        </p>
      )}
      {stale.length > 0 && (
        <p className="text-[11px] text-[#8C9099]">
          Eski model parçaları var ({stale.map((m) => `${m.model}: ${m.chunks}`).join(", ")}); yeniden oluşturunca yeni modelle değişir.
        </p>
      )}
      {result &&
        (result.ok ? (
          <p className="text-[11px] text-emerald-700">
            {result.summary.indexed} içerik dizinlendi, {result.summary.unchanged} değişmedi, {result.summary.skipped} atlandı • {result.summary.chunks} parça
            {result.summary.failed.length > 0 && ` • ${result.summary.failed.length} hata: ${result.summary.failed[0]!.error}`}
          </p>
        ) : (
          <p role="alert" className="text-[11px] text-red-600">{result.error}</p>
        ))}
    </div>
  );
}

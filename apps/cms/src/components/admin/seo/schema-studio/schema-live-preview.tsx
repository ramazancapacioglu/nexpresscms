"use client";

import React, { useState, useTransition } from "react";
import type { SchemaPlacement } from "@nexpress/core";
import { AlertTriangle, CheckCircle2, Copy, Eye, FileCode2, FileText, Layers } from "lucide-react";
import {
  previewSchemaForContentAction,
  type SchemaPreviewResult,
} from "@/app/admin/seo/schemas/preview-action";
import type { SchemaTargetOption } from "./schema-rule-editor";

/**
 * "Bot & AI Gözüyle Gör" (Dual-Engine Inspector):
 * Gerçek bir sayfada taslak şema kurallarıyla üretilecek JSON-LD `@graph` + doğrulama,
 * AI Markdown (`?format=md`) ve RAG vektör parçalarını tek ekranda gösterir.
 */
export function SchemaLivePreview({
  contents,
  draftRules,
}: {
  contents: SchemaTargetOption[];
  draftRules: SchemaPlacement[];
}) {
  const [selectedId, setSelectedId] = useState(contents[0]?.id ?? "");
  const [tab, setTab] = useState<"jsonld" | "markdown" | "rag">("jsonld");
  const [result, setResult] = useState<SchemaPreviewResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [pending, start] = useTransition();

  const runPreview = () => {
    if (!selectedId) return;
    start(async () => {
      setError(null);
      const res = await previewSchemaForContentAction({ contentId: selectedId, draftRules });
      if (res.ok) setResult(res);
      else setError(res.error);
    });
  };

  const errors = result?.issues.filter((i) => i.level === "error") ?? [];
  const warnings = result?.issues.filter((i) => i.level === "warning") ?? [];

  return (
    <section className="space-y-3 rounded-lg border border-[#E6E7EA] bg-white p-4 dark:border-[#23262E] dark:bg-[#15171C]">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="inline-flex items-center gap-1.5 text-[13px] font-semibold">
            <Eye className="h-4 w-4 text-[#266DF0]" /> Bot &amp; AI Gözüyle Gör (Canlı Doğrulayıcı)
          </h2>
          <p className="text-[11px] text-[#5F6570] dark:text-[#8C9099]">
            Kaydetmeden önce gerçek bir sayfada JSON-LD `@graph`, `?format=md` ve RAG parçalarını test edin.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <select
            aria-label="Test edilecek sayfa"
            value={selectedId}
            onChange={(e) => setSelectedId(e.target.value)}
            className="h-8 max-w-[260px] rounded-md border border-[#E6E7EA] bg-[#FBFBFB] px-2 text-[12px] dark:border-[#23262E] dark:bg-[#121317]"
          >
            {contents.slice(0, 120).map((c) => (
              <option key={c.id} value={c.id}>
                {c.label} {c.sub ? `(${c.sub})` : ""}
              </option>
            ))}
          </select>
          <button
            type="button"
            disabled={pending || !selectedId}
            onClick={runPreview}
            className="inline-flex h-8 items-center gap-1.5 rounded-md bg-[#14151A] px-3 text-[12px] font-medium text-white hover:opacity-90 disabled:opacity-50 dark:bg-[#F3F4F6] dark:text-[#14151A]"
          >
            <Eye className="h-3.5 w-3.5" />
            {pending ? "Çözümleniyor..." : "Canlı Test Et"}
          </button>
        </div>
      </div>

      {error ? <p className="text-[12px] text-rose-700 dark:text-rose-400">{error}</p> : null}

      {result ? (
        <div className="space-y-3 border-t border-[#E6E7EA] pt-3 dark:border-[#23262E]">
          <div className="flex flex-wrap items-center justify-between gap-2 text-[12px]">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="rounded bg-[#266DF0]/10 px-2 py-0.5 font-mono text-[11px] font-semibold text-[#1D5ED8] dark:text-[#7AA7FF]">
                @type: {result.effectiveType}
              </span>
              {result.matchedPrimaryName ? (
                <span className="rounded border border-[#E6E7EA] px-2 py-0.5 text-[11px] dark:border-[#23262E]">
                  Ana kural: {result.matchedPrimaryName}
                </span>
              ) : null}
              {result.matchedAdditionalNames.map((n) => (
                <span key={n} className="rounded border border-emerald-300 bg-emerald-50 px-2 py-0.5 text-[11px] text-emerald-900 dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-200">
                  + {n}
                </span>
              ))}
            </div>
            <div className="flex items-center gap-2 text-[11px] font-medium">
              {errors.length === 0 ? (
                <span className="inline-flex items-center gap-1 text-emerald-700 dark:text-emerald-400">
                  <CheckCircle2 className="h-3.5 w-3.5" /> 0 Hata
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-rose-700 dark:text-rose-400">
                  <AlertTriangle className="h-3.5 w-3.5" /> {errors.length} Hata
                </span>
              )}
              {warnings.length > 0 ? (
                <span className="text-amber-800 dark:text-amber-300">{warnings.length} Uyarı</span>
              ) : null}
            </div>
          </div>

          <div className="flex items-center justify-between gap-2">
            <div className="inline-flex rounded-lg border border-[#E6E7EA] bg-[#F4F5F7] p-0.5 text-[12px] font-medium dark:border-[#23262E] dark:bg-[#1C1E24]">
              <button
                type="button"
                onClick={() => setTab("jsonld")}
                className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 ${tab === "jsonld" ? "bg-white text-[#14151A] shadow-2xs dark:bg-[#2A2D35] dark:text-[#F3F4F6]" : "text-[#5C5F66] dark:text-[#9CA3AF]"}`}
              >
                <FileCode2 className="h-3.5 w-3.5" /> JSON-LD @graph
              </button>
              <button
                type="button"
                onClick={() => setTab("markdown")}
                className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 ${tab === "markdown" ? "bg-white text-[#14151A] shadow-2xs dark:bg-[#2A2D35] dark:text-[#F3F4F6]" : "text-[#5C5F66] dark:text-[#9CA3AF]"}`}
              >
                <FileText className="h-3.5 w-3.5" /> AI Markdown
              </button>
              <button
                type="button"
                onClick={() => setTab("rag")}
                className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 ${tab === "rag" ? "bg-white text-[#14151A] shadow-2xs dark:bg-[#2A2D35] dark:text-[#F3F4F6]" : "text-[#5C5F66] dark:text-[#9CA3AF]"}`}
              >
                <Layers className="h-3.5 w-3.5" /> RAG Parçaları ({result.chunks.length})
              </button>
            </div>
            {tab === "jsonld" ? (
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard?.writeText(result.jsonLd);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 1800);
                }}
                className="inline-flex h-7 items-center gap-1 rounded border border-[#E6E7EA] px-2 text-[11px] hover:bg-[#F4F5F7] dark:border-[#23262E] dark:hover:bg-[#1C1E24]"
              >
                <Copy className="h-3 w-3" /> {copied ? "Kopyalandı" : "JSON-LD Kopyala"}
              </button>
            ) : null}
          </div>

          {tab === "jsonld" ? (
            <div className="space-y-2">
              {result.issues.length > 0 ? (
                <ul className="space-y-1 rounded-md border border-amber-300 bg-amber-50/70 p-2.5 text-[11px] dark:border-amber-800 dark:bg-amber-950/30">
                  {result.issues.map((iss, i) => (
                    <li key={i} className={iss.level === "error" ? "font-semibold text-rose-800 dark:text-rose-300" : "text-amber-900 dark:text-amber-200"}>
                      [{iss.type}] {iss.message}
                    </li>
                  ))}
                </ul>
              ) : null}
              <pre className="max-h-80 overflow-auto rounded-md border border-[#E6E7EA] bg-[#0D0E11] p-3 font-mono text-[11px] leading-relaxed text-[#E5E7EB] dark:border-[#23262E]">
                {result.jsonLd}
              </pre>
            </div>
          ) : tab === "markdown" ? (
            <pre className="max-h-80 overflow-auto whitespace-pre-wrap rounded-md border border-[#E6E7EA] bg-[#FBFBFB] p-3 font-mono text-[11px] leading-relaxed dark:border-[#23262E] dark:bg-[#121317]">
              {result.markdown}
            </pre>
          ) : result.chunks.length === 0 ? (
            <p className="py-6 text-center text-[12px] text-[#5F6570] dark:text-[#8C9099]">
              Bu içerik henüz RAG arama dizinine alınmamış. Aşağıdaki Arama Dizini kartından dizini yenileyebilirsiniz.
            </p>
          ) : (
            <div className="grid gap-2 md:grid-cols-2">
              {result.chunks.map((ch) => (
                <div key={ch.index} className="rounded-md border border-[#E6E7EA] p-2.5 text-[11px] dark:border-[#23262E]">
                  <div className="flex items-center justify-between font-medium">
                    <span className="truncate">{ch.headingPath}</span>
                    <span className="shrink-0 font-mono text-[10px] text-[#5F6570]">#{ch.index + 1} · {ch.wordCount} sözcük</span>
                  </div>
                  <p className="mt-1 line-clamp-3 text-[#5F6570] dark:text-[#8C9099]">{ch.preview}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : null}
    </section>
  );
}

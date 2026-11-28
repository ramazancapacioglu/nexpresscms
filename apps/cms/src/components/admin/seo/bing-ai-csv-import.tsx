"use client";

import React, { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { BingAiPerformanceSnapshot } from "@nexpress/core";
import { clearBingAiPerformanceAction, importBingAiPerformanceCsvAction } from "@/app/admin/seo/actions";
import { CheckCircle2, FileSpreadsheet, Search, Trash2, Upload } from "lucide-react";

interface BingAiCsvImportProps {
  snapshot: BingAiPerformanceSnapshot | null;
}

export function BingAiCsvImport({ snapshot }: BingAiCsvImportProps) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [mode, setMode] = useState<"merge" | "replace">("merge");
  const [status, setStatus] = useState<{ tone: "ok" | "err"; text: string } | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleFile = (file: File | null) => {
    if (!file) return;
    if (!file.name.toLowerCase().endsWith(".csv") && !file.type.includes("csv") && !file.type.includes("text")) {
      setStatus({ tone: "err", text: "Lütfen .csv uzantılı bir Bing AI Performance dışa aktarımı seçin." });
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setStatus({ tone: "err", text: "CSV dosyası 2 MB sınırını aşıyor." });
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const csvText = typeof reader.result === "string" ? reader.result : "";
      startTransition(async () => {
        const res = await importBingAiPerformanceCsvAction({
          csvText,
          fileName: file.name,
          mode,
        });
        if (!res.ok) {
          setStatus({ tone: "err", text: res.error });
          return;
        }
        setStatus({ tone: "ok", text: res.message ?? "Bing AI Performance verisi içe aktarıldı." });
        if (inputRef.current) inputRef.current.value = "";
        router.refresh();
      });
    };
    reader.onerror = () => {
      setStatus({ tone: "err", text: "Dosya okunamadı." });
    };
    reader.readAsText(file, "utf-8");
  };

  const handleClear = () => {
    startTransition(async () => {
      const res = await clearBingAiPerformanceAction();
      if (!res.ok) {
        setStatus({ tone: "err", text: res.error });
        return;
      }
      setStatus({ tone: "ok", text: res.message ?? "Veri temizlendi." });
      router.refresh();
    });
  };

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-border bg-card p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <FileSpreadsheet className="h-4 w-4 text-sky-500" />
              <h3 className="text-sm font-semibold text-foreground">
                Bing Webmaster AI Performance CSV İçe Aktarma
              </h3>
            </div>
            <p className="text-xs text-muted-foreground">
              Bing Webmaster Tools → <strong>AI Performance</strong> ekranından indirdiğiniz{" "}
              <em>Cited Pages</em> ve <em>Grounding Queries</em> CSV dosyalarını yükleyin; sayfa atıfları yukarıdaki GEO ROI tablosuna otomatik eşlenir.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex rounded-lg border border-border bg-muted/40 p-0.5 text-[11px]">
              <button
                type="button"
                onClick={() => setMode("merge")}
                className={`rounded-md px-2.5 py-1 font-medium transition ${
                  mode === "merge" ? "bg-background text-foreground shadow-2xs" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Birleştir
              </button>
              <button
                type="button"
                onClick={() => setMode("replace")}
                className={`rounded-md px-2.5 py-1 font-medium transition ${
                  mode === "replace" ? "bg-background text-foreground shadow-2xs" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Üzerine Yaz
              </button>
            </div>

            <input
              ref={inputRef}
              type="file"
              accept=".csv,text/csv"
              className="hidden"
              onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
            />
            <button
              type="button"
              disabled={isPending}
              onClick={() => inputRef.current?.click()}
              className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-primary px-3 text-xs font-semibold text-primary-foreground transition hover:bg-primary/90 disabled:opacity-50"
            >
              <Upload className="h-3.5 w-3.5" />
              {isPending ? "Yükleniyor..." : "CSV Yükle"}
            </button>

            {snapshot ? (
              <button
                type="button"
                disabled={isPending}
                onClick={handleClear}
                className="inline-flex h-8 items-center gap-1 rounded-lg border border-border bg-background px-2.5 text-xs font-medium text-muted-foreground transition hover:border-destructive/40 hover:text-destructive disabled:opacity-50"
                title="Kayıtlı Bing AI CSV verisini temizle"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Temizle
              </button>
            ) : null}
          </div>
        </div>

        {status ? (
          <div
            className={`mt-3 flex items-center gap-2 rounded-lg border px-3 py-2 text-xs ${
              status.tone === "ok"
                ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                : "border-destructive/30 bg-destructive/10 text-destructive"
            }`}
          >
            {status.tone === "ok" ? <CheckCircle2 className="h-3.5 w-3.5 shrink-0" /> : null}
            <span>{status.text}</span>
          </div>
        ) : null}

        {snapshot ? (
          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-border/70 pt-3 text-[11px] text-muted-foreground">
            <span>
              Son aktarım:{" "}
              <strong className="font-mono text-foreground">
                {new Date(snapshot.importedAt).toLocaleString("tr-TR")}
              </strong>
            </span>
            {snapshot.sourceFileName ? (
              <span>
                Dosya: <strong className="font-mono text-foreground">{snapshot.sourceFileName}</strong>
              </span>
            ) : null}
            <span>
              Atıf alan sayfa: <strong className="font-mono text-foreground">{snapshot.citedPages.length}</strong>
            </span>
            <span>
              Grounding sorgusu:{" "}
              <strong className="font-mono text-foreground">{snapshot.groundingQueries.length}</strong>
            </span>
            <span>
              Toplam Bing AI atıf:{" "}
              <strong className="font-mono text-sky-600 dark:text-sky-400">
                {snapshot.totalCitations.toLocaleString("tr-TR")}
              </strong>
            </span>
          </div>
        ) : null}
      </div>

      {snapshot && snapshot.groundingQueries.length > 0 ? (
        <div className="overflow-hidden rounded-xl border border-border bg-card">
          <div className="flex items-center justify-between gap-2 border-b border-border px-4 py-3">
            <div className="flex items-center gap-2">
              <Search className="h-4 w-4 text-sky-500" />
              <div>
                <h3 className="text-sm font-semibold text-foreground">
                  Bing AI Grounding Sorguları ({snapshot.groundingQueries.length})
                </h3>
                <p className="text-xs text-muted-foreground">
                  Microsoft Copilot / Bing AI yanıtlarının sitenizi kaynak gösterirken ürettiği alt sorgular.
                </p>
              </div>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-border bg-muted/40 text-[11px] uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-4 py-2 font-semibold">Grounding Sorgusu</th>
                  <th className="px-3 py-2 text-right font-semibold">Bing AI Atıf</th>
                  <th className="px-3 py-2 text-right font-semibold">Ort. Sıra</th>
                  <th className="px-4 py-2 font-semibold">Eşleşen Sayfa</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {snapshot.groundingQueries.slice(0, 50).map((q) => (
                  <tr key={q.query} className="hover:bg-muted/20">
                    <td className="px-4 py-2 font-medium text-foreground">{q.query}</td>
                    <td className="px-3 py-2 text-right font-mono font-semibold text-sky-600 dark:text-sky-400">
                      {q.citations.toLocaleString("tr-TR")}
                    </td>
                    <td className="px-3 py-2 text-right font-mono text-muted-foreground">
                      {q.avgPosition ? q.avgPosition.toFixed(1) : "—"}
                    </td>
                    <td className="px-4 py-2 font-mono text-[11px] text-muted-foreground">
                      {q.topUrl ?? "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}
    </div>
  );
}

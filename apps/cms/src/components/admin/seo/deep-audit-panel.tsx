"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import type { DeepAuditCategory, DeepAuditFinding, DeepAuditReport } from "@nexpress/seo-core";
import { AlertCircle, AlertTriangle, CheckCircle2, ExternalLink, ShieldCheck } from "lucide-react";

const CATEGORY_LABELS: Record<DeepAuditCategory | "all", string> = {
  all: "Tüm Bulgular",
  schema: "Şema & JSON-LD",
  consistency: "İçerik & Markdown",
  links_html: "İç Link & HTML",
  eeat_rag: "E-E-A-T & RAG",
};

export function DeepAuditPanel({ report }: { report: DeepAuditReport }) {
  const [cat, setCat] = useState<DeepAuditCategory | "all">("all");
  const [onlyErrors, setOnlyErrors] = useState(false);

  const visible = useMemo(() => {
    return report.findings.filter((f) => {
      if (cat !== "all" && f.category !== cat) return false;
      if (onlyErrors && f.severity !== "error") return false;
      return true;
    });
  }, [report.findings, cat, onlyErrors]);

  const { summary } = report;

  return (
    <section className="space-y-3 rounded-xl border border-border/80 bg-card p-4 shadow-2xs">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/60 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600/10 text-indigo-700 dark:text-indigo-300">
            <ShieldCheck className="h-4 w-4" />
          </div>
          <div>
            <h2 className="text-[13px] font-semibold text-foreground">
              Derin Teknik, Şema, Markdown &amp; RAG Öz-Denetimi
            </h2>
            <p className="text-[11px] text-muted-foreground">
              JSON-LD çakışmaları, ham HTML sızıntıları, kırık iç bağlantılar, yazar E-E-A-T ve RAG vektör uyumu canlı denetlenir.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-[11px]">
          <span
            className={`rounded-full px-2.5 py-0.5 font-semibold ${
              summary.errors > 0
                ? "bg-rose-500/10 text-rose-700 dark:text-rose-300"
                : "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
            }`}
          >
            Skor: {summary.score}/100
          </span>
          <span className="rounded-full bg-rose-500/10 px-2.5 py-0.5 font-semibold text-rose-700 dark:text-rose-300">
            {summary.errors} kritik
          </span>
          <span className="rounded-full bg-amber-500/10 px-2.5 py-0.5 font-semibold text-amber-800 dark:text-amber-300">
            {summary.warnings} uyarı
          </span>
        </div>
      </div>

      {/* Kategori Filtre Sekmeleri */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
          {(["all", "schema", "consistency", "links_html", "eeat_rag"] as const).map((k) => {
            const count =
              k === "all"
                ? report.findings.length
                : summary.byCategory[k].errors + summary.byCategory[k].warnings;
            const errCount = k === "all" ? summary.errors : summary.byCategory[k].errors;
            return (
              <button
                key={k}
                type="button"
                onClick={() => setCat(k)}
                className={`rounded-full border px-2.5 py-1 font-medium transition ${
                  cat === k
                    ? "border-blue-500 bg-blue-500/10 text-blue-700 dark:text-blue-300"
                    : "border-border bg-background text-muted-foreground hover:text-foreground"
                }`}
              >
                {CATEGORY_LABELS[k]} ({count})
                {errCount > 0 ? <span className="ml-1 text-rose-600 dark:text-rose-400">•</span> : null}
              </button>
            );
          })}
        </div>

        <label className="inline-flex cursor-pointer items-center gap-1.5 text-[11px] text-muted-foreground">
          <input
            type="checkbox"
            checked={onlyErrors}
            onChange={(e) => setOnlyErrors(e.target.checked)}
            className="rounded border-border"
          />
          Yalnızca kritik hatalar
        </label>
      </div>

      {visible.length === 0 ? (
        <div className="flex items-center gap-2 rounded-lg border border-emerald-500/25 bg-emerald-500/5 px-3.5 py-3 text-[12px] text-emerald-800 dark:text-emerald-300">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>Bu görünümde tespit edilen teknik, şema veya RAG sorunu yok.</span>
        </div>
      ) : (
        <ul className="divide-y divide-border/60 overflow-hidden rounded-lg border border-border/70 bg-background">
          {visible.slice(0, 60).map((f: DeepAuditFinding) => (
            <li key={f.id} className="flex flex-wrap items-start justify-between gap-3 px-3.5 py-2.5 text-[12px]">
              <div className="flex min-w-0 flex-1 items-start gap-2.5">
                {f.severity === "error" ? (
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-600 dark:text-rose-400" />
                ) : (
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
                )}
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="font-semibold text-foreground">{f.title}</span>
                    <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                      {CATEGORY_LABELS[f.category]}
                    </span>
                  </div>
                  <p className="mt-0.5 text-[11px] leading-relaxed text-muted-foreground">{f.detail}</p>
                </div>
              </div>

              <div className="flex shrink-0 items-center gap-1.5">
                {f.targetUrl ? (
                  <a
                    href={f.targetUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex h-7 items-center gap-1 rounded-md border border-border px-2 text-[11px] text-muted-foreground hover:bg-muted hover:text-foreground"
                  >
                    Önizle <ExternalLink className="h-3 w-3" />
                  </a>
                ) : null}
                {f.editHref ? (
                  <Link
                    href={f.editHref}
                    className="inline-flex h-7 items-center rounded-md border border-border bg-card px-2.5 text-[11px] font-medium hover:bg-muted"
                  >
                    Düzelt →
                  </Link>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

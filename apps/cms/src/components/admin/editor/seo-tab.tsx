"use client";

import { AiSuggestPanel } from "./ai-suggest-panel";
import { SchemaIssues } from "./schema-issues";
import { useStudioInspector } from "./studio-inspector-context";

export function SeoTab() {
  const {
    seoAnalysis,
    autoSchemaNodes,
    inspectorSlot,
    status,
    focusKeyword,
    setFocusKeyword,
    slug,
    title,
    tldr,
    setTldr,
    metaTitle,
    setMetaTitle,
    metaDescription,
    setMetaDescription,
    schemaType,
    setSchemaType,
    importanceScore,
    setImportanceScore,
  } = useStudioInspector();

  return (
                <div className="space-y-4">
                  {/* Skor Özeti */}
                  <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-3.5 flex items-center justify-between">
                    <div>
                      <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-300">
                        Çekirdek SEO & GEO Motoru
                      </div>
                      <div className="text-lg font-extrabold text-foreground">
                        {seoAnalysis.score} / 100 Puan
                      </div>
                      <div className="text-[11px] text-muted-foreground">
                        {
                          seoAnalysis.checks.filter((c) => c.status === "pass")
                            .length
                        }{" "}
                        / {seoAnalysis.checks.length} kriter tam uyumlu
                      </div>
                    </div>
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-600 text-lg font-black text-white">
                      {seoAnalysis.grade}
                    </div>
                  </div>

                  {/* Odak Anahtar Kelime */}
                  <div>
                    <label className="block text-[11px] font-semibold mb-1">
                      🎯 Odak Anahtar Kelime (Focus Keyword)
                    </label>
                    <input aria-label="🎯 Odak Anahtar Kelime (Focus Keyword)"
                      type="text"
                      value={focusKeyword}
                      onChange={(e) => setFocusKeyword(e.target.value)}
                      placeholder="Örn: 0-KB React Server Components"
                      className="h-8 w-full rounded border border-border bg-background px-2.5"
                    />
                  </div>

                  {/* SERP Önizleme */}
                  <div className="rounded-lg border border-border bg-muted/20 p-3 space-y-1">
                    <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                      Canlı Google & AI SERP Önizlemesi
                    </div>
                    <div className="text-[11px] text-emerald-800 dark:text-emerald-400 font-mono truncate">
                      https://localhost:3000/tr/{slug}
                    </div>
                    <div className="text-sm font-semibold text-blue-600 line-clamp-1">
                      {metaTitle || title}
                    </div>
                    <div className="text-[11px] text-muted-foreground line-clamp-2">
                      {metaDescription || tldr}
                    </div>
                  </div>

                  {/* Meta Alanları */}
                  <div className="space-y-2.5">
                    <div>
                      <label className="block text-[11px] font-medium mb-1">
                        SEO Başlığı ({(metaTitle || title).length}/60)
                      </label>
                      <input
                        type="text"
                        value={metaTitle}
                        onChange={(e) => setMetaTitle(e.target.value)}
                        className="h-8 w-full rounded border border-border bg-background px-2"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium mb-1">
                        Answer-First TL;DR & Meta Açıklama (
                        {(metaDescription || tldr).length}/160)
                      </label>
                      <textarea
                        rows={3}
                        value={tldr}
                        onChange={(e) => {
                          setTldr(e.target.value);
                          setMetaDescription(e.target.value);
                        }}
                        className="w-full rounded border border-border bg-background p-2"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[10px] text-muted-foreground mb-1">
                          Birincil Schema.org
                        </label>
                        <select aria-label="Birincil Schema.org"
                          value={schemaType}
                          onChange={(e) => setSchemaType(e.target.value)}
                          className="h-8 w-full rounded border border-border bg-background px-2"
                        >
                          <option value="WebPage">WebPage</option>
                          <option value="BlogPosting">BlogPosting</option>
                          <option value="TechArticle">TechArticle</option>
                          <option value="FAQPage">FAQPage</option>
                          <option value="AboutPage">AboutPage</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] text-muted-foreground mb-1">
                          SGE / RAG Önem (1-10)
                        </label>
                        <input aria-label="SGE / RAG Önem (1-10)"
                          type="number"
                          min={1}
                          max={10}
                          value={importanceScore}
                          onChange={(e) =>
                            setImportanceScore(Number(e.target.value))
                          }
                          className="h-8 w-full rounded border border-border bg-background px-2 font-mono"
                        />
                      </div>
                    </div>
                  </div>

                  <AiSuggestPanel />

                  {/* Otomatik Algılanan Zengin Schema Düğümleri */}
                  <div className="rounded-lg border border-blue-500/30 bg-blue-500/5 p-2.5 space-y-1">
                    <div className="text-[10px] font-bold uppercase text-blue-600">
                      Otomatik @graph Schema Düğümleri ({autoSchemaNodes.length + 2})
                    </div>
                    <div className="flex flex-wrap gap-1">
                      <span className="rounded bg-blue-600 text-white px-1.5 py-0.5 text-[10px] font-mono">
                        #{schemaType.toLowerCase()}
                      </span>
                      <span className="rounded bg-blue-600/20 text-blue-700 dark:text-blue-300 px-1.5 py-0.5 text-[10px] font-mono">
                        #breadcrumb
                      </span>
                      {autoSchemaNodes.map((n: any, i: number) => (
                        <span
                          key={i}
                          className="rounded bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 px-1.5 py-0.5 text-[10px] font-mono"
                        >
                          {String(n["@type"])}
                        </span>
                      ))}
                    </div>
                    <SchemaIssues nodes={autoSchemaNodes} />
                  </div>

                  {/* 17-Noktalı Canlı Denetim Listesi */}
                  <div className="space-y-1.5">
                    <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                      Canlı Motor Denetim Listesi
                    </div>
                    {seoAnalysis.checks.map((chk) => (
                      <div
                        key={chk.id}
                        className="flex items-start gap-2 rounded-md border border-border bg-muted/20 p-2"
                      >
                        <span
                          className={`mt-0.5 h-2 w-2 rounded-full shrink-0 ${
                            chk.status === "pass"
                              ? "bg-emerald-500"
                              : chk.status === "warn"
                                ? "bg-amber-500"
                                : "bg-rose-500"
                          }`}
                        />
                        <div className="min-w-0 flex-1">
                          <div className="font-semibold text-[11px]">
                            {chk.label}
                          </div>
                          <div className="text-[10px] text-muted-foreground">
                            {chk.detail}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {inspectorSlot}
                </div>
  );
}

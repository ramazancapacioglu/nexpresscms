"use client";

import { useState } from "react";
import { AiSuggestPanel } from "./ai-suggest-panel";
import { RichSchemaPanel } from "./rich-schema-panel";
import { LengthMeter, SerpPreview, SocialPreview } from "./seo-previews";
import { SchemaIssues } from "./schema-issues";
import { useStudioInspector } from "./studio-inspector-context";

type SubTab = "general" | "schema" | "social" | "advanced" | "audit";
const SUBTABS: Array<{ id: SubTab; label: string }> = [
  { id: "general", label: "Genel" },
  { id: "schema", label: "Şema" },
  { id: "social", label: "Sosyal" },
  { id: "advanced", label: "Gelişmiş" },
  { id: "audit", label: "Denetim" },
];

export function SeoTab() {
  const [sub, setSub] = useState<SubTab>("general");
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
    richSchema,
    setRichSchema,
    setMetaDescription,
    schemaType,
    setSchemaType,
    importanceScore,
    setImportanceScore,
    noIndex,
    setNoIndex,
    canonicalUrl,
    setCanonicalUrl,
    featuredImageUrl,
    locale,
  } = useStudioInspector();
  const base = (process.env.NEXT_PUBLIC_APP_URL ?? "").replace(/\/$/, "");
  const pageUrl = `${base || (typeof window !== "undefined" ? window.location.origin : "")}/${locale}/${slug}`;
  const effTitle = metaTitle || title;
  const effDesc = metaDescription || tldr;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between rounded-lg border border-emerald-500/30 bg-emerald-500/5 px-3 py-2">
        <div className="text-[12px]"><span className="font-extrabold">{seoAnalysis.score}/100</span> <span className="text-muted-foreground">SEO &amp; GEO • {seoAnalysis.checks.filter((c) => c.status === "pass").length}/{seoAnalysis.checks.length} kriter</span></div>
        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-600 text-sm font-black text-white">{seoAnalysis.grade}</span>
      </div>
      <div role="tablist" aria-label="SEO bölümleri" className="flex gap-1 overflow-x-auto border-b border-border pb-1.5">
        {SUBTABS.map((t) => (
          <button key={t.id} type="button" role="tab" id={`seo-sub-${t.id}`} aria-selected={sub === t.id} aria-controls={`seo-panel-${t.id}`} onClick={() => setSub(t.id)} className={`shrink-0 rounded px-2.5 py-1 text-[12px] font-semibold ${sub === t.id ? "bg-blue-600 text-white" : "text-muted-foreground hover:bg-muted"}`}>{t.label}</button>
        ))}
      </div>

      {sub === "general" && (
        <div role="tabpanel" id="seo-panel-general" aria-labelledby="seo-sub-general" className="space-y-4">
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

                  <SerpPreview title={effTitle} description={effDesc} url={canonicalUrl || pageUrl} />
                  {/* Meta Alanları */}
                  <div className="space-y-2.5">
                    <div>
                      <label htmlFor="seo-meta-title" className="block text-[11px] font-medium mb-1">SEO başlığı</label>
                      <input id="seo-meta-title" type="text" value={metaTitle} placeholder={title} onChange={(e) => setMetaTitle(e.target.value)} className="h-8 w-full rounded border border-border bg-background px-2" />
                      <LengthMeter value={effTitle.length} min={30} max={60} label="Başlık uzunluğu" />
                    </div>
                    <div>
                      <label htmlFor="seo-meta-desc" className="block text-[11px] font-medium mb-1">Meta açıklama <span className="font-normal text-muted-foreground">(boşsa TL;DR kullanılır)</span></label>
                      <textarea id="seo-meta-desc" rows={3} value={metaDescription} placeholder={tldr} onChange={(e) => setMetaDescription(e.target.value)} className="w-full rounded border border-border bg-background p-2" />
                      <LengthMeter value={effDesc.length} min={70} max={160} label="Açıklama uzunluğu" />
                    </div>
                    <div>
                      <label htmlFor="seo-tldr" className="block text-[11px] font-medium mb-1">TL;DR — Answer-First özet <span className="font-normal text-muted-foreground">(sayfada gösterilir; yapay zeka alıntısı için)</span></label>
                      <textarea id="seo-tldr" rows={3} value={tldr} onChange={(e) => setTldr(e.target.value)} className="w-full rounded border border-border bg-background p-2" />
                      <LengthMeter value={tldr.length} min={40} max={260} label="TL;DR uzunluğu" />
                      {tldr && tldr !== metaDescription && <button type="button" onClick={() => setMetaDescription(tldr.slice(0, 160))} className="mt-1 text-[10px] font-medium text-blue-700 underline dark:text-blue-300">TL;DR'yi meta açıklamaya kopyala (160 karaktere kırpar)</button>}
                    </div>
                  </div>
          <AiSuggestPanel />
        </div>
      )}

      {sub === "schema" && (
        <div role="tabpanel" id="seo-panel-schema" aria-labelledby="seo-sub-schema" className="space-y-4">
          <div className="space-y-2.5">
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
                          <option value="QAPage">QAPage</option>
                          <option value="SoftwareApplication">SoftwareApplication</option>
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
          <RichSchemaPanel value={richSchema} onChange={setRichSchema} />
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

        </div>
      )}

      {sub === "social" && (
        <div role="tabpanel" id="seo-panel-social" aria-labelledby="seo-sub-social" className="space-y-4">
                  <SocialPreview title={effTitle} description={effDesc} image={featuredImageUrl} host={base ? base.replace(/^https?:\/\//, "") : "site"} />
        </div>
      )}

      {sub === "advanced" && (
        <div role="tabpanel" id="seo-panel-advanced" aria-labelledby="seo-sub-advanced" className="space-y-4">
                  <details className="rounded-lg border border-border p-3 text-[11px]" open>
                    <summary className="cursor-pointer font-semibold">Gelişmiş: dizinleme ve canonical</summary>
                    <div className="mt-2 space-y-2.5">
                      <label className="flex items-start gap-2"><input type="checkbox" checked={noIndex} onChange={(e) => setNoIndex(e.target.checked)} className="mt-0.5" /><span><strong>Arama motorlarına kapat (noindex)</strong><span className="block text-muted-foreground">Sayfa sitemap, llms.txt ve beslemelerden de çıkar. Yayındaki bir sayfayı kapatırsanız sıralamadan düşer.</span></span></label>
                      {noIndex && status === "published" && <p role="alert" className="rounded bg-amber-500/15 px-2 py-1 text-amber-800 dark:text-amber-300">Yayındaki sayfa noindex: arama sonuçlarında görünmeyecek.</p>}
                      <div>
                        <label htmlFor="seo-canonical" className="mb-1 block font-medium">Canonical adres <span className="font-normal text-muted-foreground">(boşsa sayfanın kendi adresi)</span></label>
                        <input id="seo-canonical" type="text" value={canonicalUrl} onChange={(e) => setCanonicalUrl(e.target.value)} placeholder={pageUrl} className="h-8 w-full rounded border border-border bg-background px-2 font-mono" />
                        {canonicalUrl && !/^(https?:\/\/|\/)/.test(canonicalUrl) && <p role="alert" className="mt-1 text-red-600">https:// ile veya / ile başlamalı.</p>}
                        {canonicalUrl && /^https?:\/\//.test(canonicalUrl) && base && !canonicalUrl.startsWith(base) && <p className="mt-1 text-amber-800 dark:text-amber-300">Canonical başka bir alan adına işaret ediyor: bu sayfa o adresin kopyası sayılır.</p>}
                      </div>
                    </div>
                  </details>

        </div>
      )}

      {sub === "audit" && (
        <div role="tabpanel" id="seo-panel-audit" aria-labelledby="seo-sub-audit" className="space-y-4">
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
      )}
    </div>
  );
}

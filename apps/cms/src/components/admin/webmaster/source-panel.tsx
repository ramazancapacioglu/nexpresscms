"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { AlertTriangle, ExternalLink, KeyRound, RefreshCw, SearchCheck } from "lucide-react";
import type { UrlInspection, WebmasterReport, WebmasterSource } from "@nexpress/seo-core";
import { inspectUrlAction, loadWebmasterReportAction } from "@/app/admin/seo/webmaster-actions";
import { ManualImport } from "./manual-import";
import { ReportView } from "./report-view";

export const SECTION_LABELS: Record<WebmasterSource, Array<[string, string]>> = {
  gsc: [["overview", "Performans"], ["queries", "Sorgular"], ["pages", "Sayfalar"], ["countries", "Ülkeler"], ["devices", "Cihazlar"], ["appearance", "Görünüm"], ["sitemaps", "Site haritaları"], ["inspect", "Sayfa denetimi"]],
  ga4: [["overview", "Özet"], ["channels", "Kanallar"], ["pages", "Sayfalar"], ["sources", "Kaynaklar"], ["geo", "Konum"], ["devices", "Cihazlar"], ["organic", "Organik arama"], ["ai", "Yapay zekâ"], ["realtime", "Gerçek zamanlı"]],
  bing: [["overview", "Performans"], ["queries", "Sorgular"], ["pages", "Sayfalar"], ["crawl", "Tarama"], ["sitemaps", "Site haritaları"], ["links", "Geri bağlantılar"]],
  yandex: [["overview", "Özet"], ["sources", "Kaynaklar"], ["pages", "Giriş sayfaları"], ["search", "Arama motorları"], ["geo", "Ülkeler"], ["devices", "Cihazlar"]],
};

export const SOURCE_NAMES: Record<WebmasterSource, string> = { gsc: "Google Search Console", ga4: "Google Analytics 4", bing: "Bing Webmaster", yandex: "Yandex Metrika" };

export interface ReportState {
  status: "loading" | "ok" | "error";
  report?: WebmasterReport;
  error?: { message: string; hint?: string; kind: string };
}

/** Rapor yükleyici: önceki çizim yeni veri gelene kadar ekranda kalır (iskelet/kayma yok); aynı istek tekrarlanmaz. */
export function useReport(source: WebmasterSource, section: string, days: number, enabled = true, refreshMs = 0) {
  const [state, setState] = useState<ReportState>({ status: "loading" });
  const seq = useRef(0);
  const cache = useRef(new Map<string, WebmasterReport>());
  const key = `${source}|${section}|${days}`;

  const load = useCallback(async (fresh = false) => {
    const mine = ++seq.current;
    const cached = cache.current.get(key);
    setState((s) => ({ status: "loading", report: cached ?? s.report }));
    if (cached && !fresh) {
      setState({ status: "ok", report: cached });
      return;
    }
    try {
      const res = await loadWebmasterReportAction({ source, section, days, fresh });
      if (mine !== seq.current) return;
      if (res.ok) {
        cache.current.set(key, res.report);
        setState({ status: "ok", report: res.report });
      } else {
        setState({ status: "error", error: { message: res.error, hint: res.hint, kind: res.kind } });
      }
    } catch {
      if (mine === seq.current) setState({ status: "error", error: { message: "Rapor alınamadı (bağlantı hatası).", kind: "network" } });
    }
  }, [key, source, section, days]);

  useEffect(() => {
    if (!enabled) return;
    void load(false);
  }, [enabled, load]);
  useEffect(() => {
    if (!enabled || !refreshMs) return;
    const timer = setInterval(() => void load(true), refreshMs);
    return () => clearInterval(timer);
  }, [enabled, refreshMs, load]);
  return { state, reload: () => load(true) };
}

const NEEDS_CONNECTION = new Set(["not_connected", "auth", "permission", "api_disabled", "not_found"]);

export function ErrorCard({ error, source, onOpenConnection }: { error: NonNullable<ReportState["error"]>; source: WebmasterSource; onOpenConnection: (source: WebmasterSource) => void }) {
  return (
    <div role="alert" className="v-card flex items-start gap-3 p-4" style={{ borderColor: "color-mix(in srgb, var(--v-bad) 35%, transparent)" }}>
      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" style={{ color: "var(--v-bad)" }} aria-hidden="true" />
      <div className="space-y-1">
        <p className="v-ink text-[13px] font-semibold">{error.kind === "not_connected" ? `${SOURCE_NAMES[source]} bağlı değil` : "Rapor alınamadı"}</p>
        <p className="v-ink2 text-[12px]">{error.message}</p>
        {error.hint ? <p className="v-ink text-[12px]">{error.hint}</p> : null}
        {NEEDS_CONNECTION.has(error.kind) ? (
          <button type="button" onClick={() => onOpenConnection(source)} className="mt-1 inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-[12px] font-medium v-ink hover:bg-[var(--v-wash)]" style={{ borderColor: "var(--v-ring)" }}>
            <KeyRound className="h-3.5 w-3.5" aria-hidden="true" /> Bağlantı bilgilerini aç
          </button>
        ) : null}
      </div>
    </div>
  );
}

function Skeleton() {
  return (
    <div className="space-y-3" aria-busy="true" aria-label="Yükleniyor">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">{[0, 1, 2, 3].map((i) => <div key={i} className="v-skel h-[78px]" />)}</div>
      <div className="grid gap-3 lg:grid-cols-2"><div className="v-skel h-[236px]" /><div className="v-skel h-[236px]" /></div>
    </div>
  );
}

function Verdict({ label, value }: { label: string; value: string }) {
  const good = value === "Geçti";
  const bad = value === "Başarısız";
  return (
    <div className="v-card p-3">
      <div className="v-ink2 text-[11px]">{label}</div>
      <div className="v-ink mt-0.5 text-[13px] font-semibold" style={{ color: good ? "var(--v-good)" : bad ? "var(--v-bad)" : undefined }}>{good ? "✓ " : bad ? "✕ " : ""}{value}</div>
    </div>
  );
}

/** URL Inspection: bir sayfanın Google'daki dizin durumu (kapsam, son tarama, kanonik, mobil, zengin sonuç). */
export function UrlInspector({ origin, onOpenConnection }: { origin: string; onOpenConnection: (source: WebmasterSource) => void }) {
  const [url, setUrl] = useState(`${origin}/`);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<UrlInspection | null>(null);
  const [error, setError] = useState<{ message: string; hint?: string } | null>(null);
  const run = async (target: string) => {
    setBusy(true);
    setError(null);
    const res = await inspectUrlAction({ url: target }).catch(() => ({ ok: false as const, error: "Denetim yapılamadı (bağlantı hatası)." }));
    setBusy(false);
    if (res.ok) setResult(res.result);
    else {
      setResult(null);
      setError({ message: res.error, hint: "hint" in res ? res.hint : undefined });
    }
  };
  return (
    <div className="space-y-3">
      <div className="v-card p-3">
        <h4 className="v-ink text-[13px] font-semibold">Sayfa denetimi (URL Inspection)</h4>
        <p className="v-ink2 text-[11px]">Google'ın bu sayfayı dizinleyip dizinlemediğini, son tarama tarihini ve seçtiği kanonik adresi gösterir. Günlük kota: 2.000 sayfa.</p>
        <form className="mt-2 flex flex-wrap gap-2" onSubmit={(e) => { e.preventDefault(); void run(url); }}>
          <label className="min-w-64 flex-1">
            <span className="sr-only">Denetlenecek adres</span>
            <input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://…" className="v-ink h-8 w-full rounded-md border bg-transparent px-2 text-[12px]" style={{ borderColor: "var(--v-ring)" }} />
          </label>
          <button type="submit" disabled={busy} className="inline-flex h-8 items-center gap-1.5 rounded-md bg-nx-primary px-3 text-[12px] font-semibold text-nx-primary-fg disabled:opacity-60">
            <SearchCheck className="h-3.5 w-3.5" aria-hidden="true" /> {busy ? "Denetleniyor…" : "Denetle"}
          </button>
        </form>
      </div>
      {error ? <ErrorCard error={{ message: error.message, hint: error.hint, kind: /bağlı değil/.test(error.message) ? "not_connected" : "unknown" }} source="gsc" onOpenConnection={onOpenConnection} /> : null}
      {result ? (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <Verdict label="Dizin kararı" value={result.verdict} />
            <Verdict label="Mobil uyumluluk" value={result.mobile} />
            <Verdict label="Zengin sonuçlar" value={result.richResults} />
            <div className="v-card p-3"><div className="v-ink2 text-[11px]">Son tarama</div><div className="v-ink mt-0.5 text-[13px] font-semibold">{result.lastCrawl || "—"}</div></div>
          </div>
          <div className="v-card p-3">
            <dl className="grid gap-x-6 gap-y-1.5 text-[12px] md:grid-cols-2">
              {([["Kapsam durumu", result.coverage], ["Dizinleme", result.indexingState], ["robots.txt", result.robots], ["Tarayıcı", result.crawledAs], ["Google'ın seçtiği kanonik", result.googleCanonical || "—"], ["Sizin kanonik adresiniz", result.userCanonical || "—"]] as const).map(([k, v]) => (
                <div key={k} className="flex justify-between gap-3 border-b py-1" style={{ borderColor: "var(--v-grid)" }}>
                  <dt className="v-ink2">{k}</dt>
                  <dd className="v-ink truncate text-right" title={v}>{v}</dd>
                </div>
              ))}
            </dl>
            {result.inspectionLink ? <a href={result.inspectionLink} target="_blank" rel="noopener noreferrer" className="v-ink2 mt-2 inline-flex items-center gap-1 text-[11px] underline underline-offset-2">Search Console'da aç <ExternalLink className="h-3 w-3" aria-hidden="true" /></a> : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}

/** Bir kaynağın sekmesi: bölüm gezinmesi + seçili rapor. */
export function SourcePanel({ source, days, origin, onOpenConnection }: { source: WebmasterSource; days: number; origin: string; onOpenConnection: (source: WebmasterSource) => void }) {
  const [section, setSection] = useState("overview");
  const isInspect = source === "gsc" && section === "inspect";
  const { state, reload } = useReport(source, isInspect ? "overview" : section, days, !isInspect, source === "ga4" && section === "realtime" ? 60_000 : 0);
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <nav aria-label={`${SOURCE_NAMES[source]} raporları`} className="flex flex-wrap gap-1.5">
          {SECTION_LABELS[source].map(([id, label]) => (
            <button key={id} type="button" aria-current={section === id ? "page" : undefined} onClick={() => setSection(id)} className={`rounded-full px-3 py-1 text-[12px] font-medium transition ${section === id ? "bg-nx-primary text-nx-primary-fg" : "bg-nx-subtle text-nx-soft hover:text-nx-fg"}`}>
              {label}
            </button>
          ))}
        </nav>
        {!isInspect ? (
          <button type="button" onClick={() => void reload()} disabled={state.status === "loading"} className="inline-flex items-center gap-1.5 rounded-md border border-nx-line px-2.5 py-1 text-[12px] font-medium text-nx-soft hover:text-nx-fg disabled:opacity-60">
            <RefreshCw className={`h-3.5 w-3.5 ${state.status === "loading" ? "animate-spin" : ""}`} aria-hidden="true" /> Yenile
          </button>
        ) : null}
      </div>
      {isInspect ? (
        <UrlInspector origin={origin} onOpenConnection={onOpenConnection} />
      ) : state.status === "error" ? (
        <ErrorCard error={state.error!} source={source} onOpenConnection={onOpenConnection} />
      ) : state.report ? (
        <ReportView report={state.report} days={days} loading={state.status === "loading"} />
      ) : (
        <Skeleton />
      )}
      {source === "gsc" && section === "queries" ? <ManualImport /> : null}
      {!isInspect && state.report ? (
        <p className="v-ink2 text-[10px]">{state.report.range.start} – {state.report.range.end} · {new Date(state.report.generatedAt).toLocaleString("tr-TR")} itibarıyla</p>
      ) : null}
    </div>
  );
}

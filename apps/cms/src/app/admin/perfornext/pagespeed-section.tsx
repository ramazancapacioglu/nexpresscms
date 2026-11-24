import React from "react";
import { Gauge, Monitor, Smartphone } from "lucide-react";
import type { PsiSnapshot, PsiState } from "@/lib/perfornext/pagespeed";
import { runPageSpeedAction } from "./actions";

function scoreTone(score: number): string {
  if (score >= 90) return "text-emerald-600 dark:text-emerald-400 border-emerald-500/30 bg-emerald-500/10";
  if (score >= 50) return "text-amber-700 dark:text-amber-300 border-amber-500/30 bg-amber-500/10";
  return "text-rose-700 dark:text-rose-300 border-rose-500/30 bg-rose-500/10";
}

function fmtMs(ms: number | null): string {
  if (ms == null) return "—";
  return ms >= 1000 ? `${(ms / 1000).toFixed(2)} sn` : `${Math.round(ms)} ms`;
}

function SnapshotCard({
  title,
  icon,
  snap,
}: {
  title: string;
  icon: React.ReactNode;
  snap: PsiSnapshot | null;
}) {
  return (
    <div className="rounded-xl border border-border/80 bg-muted/15 p-4 space-y-3">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-[13px] font-semibold text-foreground">
          {icon}
          <span>{title}</span>
        </div>
        {snap ? (
          <span className="font-mono text-[10px] text-muted-foreground">
            {snap.fetchedAt.slice(0, 16).replace("T", " ")}
          </span>
        ) : (
          <span className="text-[11px] text-muted-foreground">Henüz ölçülmedi</span>
        )}
      </div>

      {snap ? (
        <>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {[
              ["Performans", snap.scores.performance],
              ["Erişilebilirlik", snap.scores.accessibility],
              ["En İyi Uyg.", snap.scores.bestPractices],
              ["SEO", snap.scores.seo],
            ].map(([label, score]) => (
              <div
                key={String(label)}
                className={`rounded-lg border px-2.5 py-2 text-center ${scoreTone(Number(score))}`}
              >
                <div className="font-mono text-[20px] font-bold leading-none tabular-nums">
                  {score}
                </div>
                <div className="mt-1 text-[10px] font-semibold">{label}</div>
              </div>
            ))}
          </div>

          <dl className="grid grid-cols-3 gap-2 border-t border-border/60 pt-2.5 text-center text-[11px] sm:grid-cols-5">
            <div>
              <dt className="text-[10px] text-muted-foreground">LCP</dt>
              <dd className="font-mono font-semibold text-foreground">{fmtMs(snap.metrics.lcpMs)}</dd>
            </div>
            <div>
              <dt className="text-[10px] text-muted-foreground">CLS</dt>
              <dd className="font-mono font-semibold text-foreground">
                {snap.metrics.cls != null ? snap.metrics.cls.toFixed(3) : "—"}
              </dd>
            </div>
            <div>
              <dt className="text-[10px] text-muted-foreground">FCP</dt>
              <dd className="font-mono font-semibold text-foreground">{fmtMs(snap.metrics.fcpMs)}</dd>
            </div>
            <div>
              <dt className="text-[10px] text-muted-foreground">TBT</dt>
              <dd className="font-mono font-semibold text-foreground">{fmtMs(snap.metrics.tbtMs)}</dd>
            </div>
            <div>
              <dt className="text-[10px] text-muted-foreground">TTFB</dt>
              <dd className="font-mono font-semibold text-foreground">{fmtMs(snap.metrics.ttfbMs)}</dd>
            </div>
          </dl>
          <p className="truncate font-mono text-[10px] text-muted-foreground">
            Ölçülen URL: {snap.url}
          </p>
        </>
      ) : (
        <p className="py-4 text-center text-[12px] text-muted-foreground">
          Yukarıdaki ölçüm formundan <strong>{title}</strong> analizi çalıştırın.
        </p>
      )}
    </div>
  );
}

export function PageSpeedSection({ state }: { state: PsiState }) {
  return (
    <section className="space-y-4 rounded-xl border border-border/80 bg-card p-5 shadow-2xs">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Gauge className="h-4 w-4 text-blue-600" />
            <h2 className="text-[14px] font-semibold text-foreground">
              Google PageSpeed Insights (Lighthouse) Takibi
            </h2>
          </div>
          <p className="mt-0.5 text-[11px] text-muted-foreground">
            İstediğiniz sayfa için canlı Mobil ve Masaüstü Lighthouse 4 kategori puanını ve Core Web Vitals lab metriklerini ölçüp kaydedin.
          </p>
        </div>

        <form action={runPageSpeedAction} className="flex flex-wrap items-center gap-2">
          <input
            type="text"
            name="url"
            defaultValue={`${state.defaultUrl}/`}
            placeholder="/ veya https://..."
            aria-label="Ölçülecek sayfa adresi"
            className="h-8 w-56 rounded-lg border border-border bg-background px-2.5 font-mono text-[11px] text-foreground focus:border-blue-500 focus:outline-none sm:w-64"
          />
          <button
            type="submit"
            name="strategy"
            value="mobile"
            className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-foreground px-3 text-[12px] font-medium text-background hover:opacity-90 transition"
          >
            <Smartphone className="h-3.5 w-3.5" />
            <span>Mobil Ölç</span>
          </button>
          <button
            type="submit"
            name="strategy"
            value="desktop"
            className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-border bg-background px-3 text-[12px] font-medium text-foreground hover:bg-muted transition"
          >
            <Monitor className="h-3.5 w-3.5" />
            <span>Masaüstü Ölç</span>
          </button>
        </form>
      </div>

      {state.lastError ? (
        <p className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-[12px] text-amber-800 dark:text-amber-200">
          {state.lastError}
        </p>
      ) : null}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <SnapshotCard
          title="Mobil (Lighthouse)"
          icon={<Smartphone className="h-4 w-4 text-blue-600" />}
          snap={state.mobile}
        />
        <SnapshotCard
          title="Masaüstü (Lighthouse)"
          icon={<Monitor className="h-4 w-4 text-emerald-600" />}
          snap={state.desktop}
        />
      </div>

      {state.history.length > 0 ? (
        <div className="space-y-2 border-t border-border/60 pt-3">
          <h3 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Son PageSpeed Ölçümleri ({state.history.length})
          </h3>
          <div className="overflow-x-auto rounded-lg border border-border/70">
            <table className="w-full border-collapse text-left text-[11px]">
              <thead>
                <tr className="border-b border-border/70 bg-muted/30 text-[10px] text-muted-foreground">
                  <th className="px-3 py-1.5">Tarih</th>
                  <th className="px-2 py-1.5">Cihaz</th>
                  <th className="px-2 py-1.5">URL</th>
                  <th className="px-2 py-1.5 text-right">Perf</th>
                  <th className="px-2 py-1.5 text-right">A11y</th>
                  <th className="px-2 py-1.5 text-right">BP</th>
                  <th className="px-2 py-1.5 text-right">SEO</th>
                  <th className="px-3 py-1.5 text-right">LCP / CLS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60 font-mono">
                {state.history.slice(0, 6).map((h, i) => (
                  <tr key={`${h.fetchedAt}-${i}`}>
                    <td className="px-3 py-1.5 text-muted-foreground">
                      {h.fetchedAt.slice(5, 16).replace("T", " ")}
                    </td>
                    <td className="px-2 py-1.5 uppercase">{h.strategy === "mobile" ? "Mobil" : "Masaüstü"}</td>
                    <td className="max-w-[200px] truncate px-2 py-1.5 text-foreground">{h.url}</td>
                    <td className="px-2 py-1.5 text-right font-semibold">{h.scores.performance}</td>
                    <td className="px-2 py-1.5 text-right">{h.scores.accessibility}</td>
                    <td className="px-2 py-1.5 text-right">{h.scores.bestPractices}</td>
                    <td className="px-2 py-1.5 text-right">{h.scores.seo}</td>
                    <td className="px-3 py-1.5 text-right text-muted-foreground">
                      {fmtMs(h.metrics.lcpMs)} / {h.metrics.cls != null ? h.metrics.cls.toFixed(3) : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}
    </section>
  );
}

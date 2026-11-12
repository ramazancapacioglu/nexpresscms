import React from "react";
import {
  CORE_WEB_VITALS,
  CRUX_FORM_FACTORS,
  CRUX_THRESHOLDS,
  formatCruxValue,
  type CruxFormFactor,
  type CruxMetric,
  type CruxRating,
} from "@nexpress/core";
import type { CruxState } from "@/lib/perfornext/crux";
import { clearCruxKeyAction, refreshCruxAction, saveCruxSettingsAction } from "./actions";

const border = "border-[#E6E7EA] dark:border-[#23262E]";
const FORM_LABEL: Record<CruxFormFactor, string> = { ALL: "Tüm cihazlar", PHONE: "Telefon", DESKTOP: "Masaüstü" };
const RATING_STYLE: Record<CruxRating, string> = {
  good: "text-emerald-700 dark:text-emerald-300",
  "needs-improvement": "text-amber-700 dark:text-amber-300",
  poor: "text-red-700 dark:text-red-300",
};
const RATING_LABEL: Record<CruxRating, string> = { good: "İyi", "needs-improvement": "Geliştirilmeli", poor: "Kötü" };

function MetricRow({ m }: { m: CruxMetric }) {
  const info = CRUX_THRESHOLDS[m.key];
  const core = (CORE_WEB_VITALS as readonly string[]).includes(m.key);
  return (
    <div className="space-y-1">
      <div className="flex items-baseline justify-between gap-2 text-[12px]">
        <span>{info.label}{core ? <span className="ml-1 rounded bg-blue-500/10 px-1 text-[9px] font-semibold uppercase text-blue-700 dark:text-blue-300">CWV</span> : null}</span>
        <span className="font-mono"><span className={RATING_STYLE[m.rating]}>{formatCruxValue(m.key, m.p75)}</span> <span className="text-[10px] text-[#8C9099]">p75 · {RATING_LABEL[m.rating]}</span></span>
      </div>
      <div className="flex h-1.5 overflow-hidden rounded-full" role="img" aria-label={`${info.label}: ziyaretlerin %${m.good} iyi, %${m.needsImprovement} geliştirilmeli, %${m.poor} kötü`}>
        <span style={{ width: `${m.good}%` }} className="bg-emerald-500" />
        <span style={{ width: `${m.needsImprovement}%` }} className="bg-amber-400" />
        <span style={{ width: `${m.poor}%` }} className="bg-red-500" />
      </div>
    </div>
  );
}

/** Perfornext: ölçülen (Chrome kullanıcı) veri. İçerik ağırlığı raporu "tahmin"dir; bu bölüm gerçek ölçümdür. */
export function CruxSection({ state }: { state: CruxState }) {
  const shown = CRUX_FORM_FACTORS.filter((f) => state.snapshots[f]);
  return (
    <section className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <h2 className="text-[11px] font-semibold uppercase tracking-wider text-[#5F6570]">Gerçek Kullanıcı Verisi (CrUX)</h2>
        <span className="rounded border border-emerald-500/40 bg-emerald-500/10 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-emerald-700 dark:text-emerald-300">Ölçülen</span>
      </div>
      <p className="text-[12px] text-[#5F6570] dark:text-[#8C9099]">
        Google&apos;ın Chrome kullanıcılarından topladığı son 28 günlük ölçüm (75. yüzdelik). Arama sıralamasında kullanılan Core Web Vitals değeri budur. Yeterli trafiği olmayan sitelerde veri çıkmaz; o zaman aşağıdaki içerik raporu yalnızca <strong>tahmin</strong>dir.
      </p>

      {shown.length > 0 ? (
        <div className="grid gap-3 lg:grid-cols-3">
          {shown.map((f) => {
            const snap = state.snapshots[f]!;
            return (
              <div key={f} className={`space-y-2.5 rounded-lg border ${border} bg-white p-3 dark:bg-[#15171C]`}>
                <div className="flex items-center justify-between">
                  <span className="text-[13px] font-semibold">{FORM_LABEL[f]}</span>
                  {snap.cwvPass === null ? <span className="text-[11px] text-[#8C9099]">CWV belirsiz</span> : snap.cwvPass ? <span className="rounded bg-emerald-500/15 px-1.5 py-0.5 text-[11px] font-semibold text-emerald-700 dark:text-emerald-300">Core Web Vitals geçti</span> : <span className="rounded bg-red-500/15 px-1.5 py-0.5 text-[11px] font-semibold text-red-700 dark:text-red-300">Core Web Vitals kaldı</span>}
                </div>
                {snap.metrics.map((m) => <MetricRow key={m.key} m={m} />)}
                <p className="text-[10px] text-[#8C9099]">{snap.period ? `Dönem: ${snap.period.first} – ${snap.period.last} · ` : ""}çekildi {snap.fetchedAt.slice(0, 16).replace("T", " ")}</p>
              </div>
            );
          })}
        </div>
      ) : (
        <p className={`rounded-lg border border-dashed ${border} p-4 text-[12px] text-[#5F6570]`}>
          {state.hasKey ? "Henüz ölçüm çekilmedi ya da veri yok. \"Ölçümü güncelle\" ile deneyin." : "CrUX API anahtarı kaydedilince burada gerçek kullanıcı ölçümü görünür."}
        </p>
      )}
      {CRUX_FORM_FACTORS.filter((f) => state.errors[f] && !state.snapshots[f]).length > 0 ? (
        <ul className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-[12px] text-amber-800 dark:text-amber-200">
          {[...new Set(CRUX_FORM_FACTORS.filter((f) => state.errors[f] && !state.snapshots[f]).map((f) => state.errors[f]!.message))].map((msg) => <li key={msg}>• {msg}</li>)}
        </ul>
      ) : null}

      <div className={`space-y-3 rounded-lg border ${border} bg-white p-3 dark:bg-[#15171C]`}>
        <form action={saveCruxSettingsAction} className="grid gap-3 md:grid-cols-[1fr_1fr_auto] md:items-end">
          <label className="block text-[12px] text-[#5F6570]">
            CrUX API anahtarı {state.hasKey ? <span className="font-mono text-[11px] text-emerald-700 dark:text-emerald-300">({state.keySource === "env" ? "ortam değişkeni" : "kayıtlı"} · {state.keyMask})</span> : null}
            <input name="apiKey" type="password" autoComplete="off" placeholder={state.hasKey ? "Değiştirmek için yeni anahtar yazın" : "AIza…"} className={`mt-1 block w-full rounded-md border ${border} bg-white px-2 py-1 font-mono text-[12px] dark:bg-[#15171C]`} />
          </label>
          <label className="block text-[12px] text-[#5F6570]">
            Ölçülecek site adresi
            <input name="origin" type="url" defaultValue={state.origin ?? ""} placeholder="https://alanadiniz.com" className={`mt-1 block w-full rounded-md border ${border} bg-white px-2 py-1 font-mono text-[12px] dark:bg-[#15171C]`} />
          </label>
          <button type="submit" className={`rounded-md border ${border} px-3 py-1.5 text-[12px] hover:bg-black/5 dark:hover:bg-white/5`}>Kaydet</button>
        </form>
        <div className="flex flex-wrap items-center gap-3">
          <form action={refreshCruxAction}><button type="submit" disabled={!state.hasKey} className="rounded-md bg-[#14151A] px-3 py-1.5 text-[12px] font-medium text-white disabled:opacity-50 dark:bg-[#F3F4F6] dark:text-[#14151A]">Ölçümü güncelle</button></form>
          {state.keySource === "panel" ? <form action={clearCruxKeyAction}><button type="submit" className="text-[12px] text-red-600 hover:underline">Anahtarı sil</button></form> : null}
          <span className="text-[11px] text-[#8C9099]">Anahtar: Google Cloud → &quot;Chrome UX Report API&quot;yi etkinleştirin → API anahtarı oluşturun (ücretsiz). Anahtar şifreli saklanır; ortam değişkeni: <code>CRUX_API_KEY</code>. Veri günlük güncellenir.</span>
        </div>
      </div>
    </section>
  );
}

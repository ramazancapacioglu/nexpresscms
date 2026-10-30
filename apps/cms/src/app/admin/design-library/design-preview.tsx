"use client";

import type { DesignPreview } from "@/lib/design-library";

const border = "border-[#E6E7EA] dark:border-[#23262E]";

const summary = (props: Record<string, unknown>): string => {
  const first = ["title", "summary", "text", "subtitle", "buttonLabel", "label"].map((k) => props[k]).find((v) => typeof v === "string" && v) as string | undefined;
  return (first ?? "").slice(0, 90);
};

/** Tasarım önizlemesi: skor, hatalar/uyarılar, yapı özeti (bloklar) veya tema renkleri + kontrast tablosu. */
export function DesignPreviewView({ d }: { d: DesignPreview }) {
  const tone = d.errors.length ? "text-red-600" : d.score >= 85 ? "text-emerald-800 dark:text-emerald-400" : "text-amber-800 dark:text-amber-300";
  return (
    <div className="space-y-3 text-[12px]">
      <div className="flex flex-wrap items-center gap-3">
        <span className={`text-[22px] font-semibold ${tone}`}>{d.score}<span className="text-[12px] font-normal text-[#5F6570] dark:text-[#8C9099]"> / 100</span></span>
        <span className="text-[#5F6570] dark:text-[#8C9099]">{d.errors.length} hata · {d.warnings.length} uyarı{d.stats ? ` · ${d.stats.blocks} blok · ${d.stats.words} sözcük` : ""}{d.attempts && d.attempts > 1 ? " · otomatik onarım uygulandı" : ""}{d.model ? ` · ${d.model}` : ""}</span>
        {d.placeholderData && <span className="rounded bg-amber-500/15 px-2 py-0.5 text-[11px] font-medium text-amber-800 dark:text-amber-300">Gerçek verilerle güncelleyin</span>}
      </div>
      {d.errors.length > 0 && <ul role="alert" className="list-disc space-y-0.5 pl-5 text-red-600">{d.errors.map((e, i) => <li key={i}>{e}</li>)}</ul>}
      {d.warnings.length > 0 && <ul className="list-disc space-y-0.5 pl-5 text-amber-800 dark:text-amber-300">{d.warnings.map((w, i) => <li key={i}>{w}</li>)}</ul>}

      {d.page && (
        <div className={`rounded-md border ${border} p-3`}>
          <p className="font-medium">{d.page.title} <span className="font-mono text-[11px] text-[#5F6570] dark:text-[#8C9099]">/{d.page.slug}</span></p>
          <p className="text-[#5F6570] dark:text-[#9CA3AF]">{d.page.metaDescription || d.page.tldr}</p>
        </div>
      )}
      {d.blocks.length > 0 && (
        <ol className={`divide-y rounded-md border ${border} ${border.replace("border-", "divide-")}`} aria-label="Blok yapısı">
          {d.blocks.map((b, i) => (
            <li key={b.id} className="flex gap-3 px-3 py-2">
              <span className="w-5 shrink-0 text-right text-[#5F6570] dark:text-[#8C9099]">{i + 1}</span>
              <span className="w-32 shrink-0 font-mono text-[11px] text-[#1D5ED8] dark:text-[#7AA7FF]">{b.type}</span>
              <span className="min-w-0 flex-1 truncate">{summary(b.props)}</span>
            </li>
          ))}
        </ol>
      )}
      {d.theme && (
        <div className="space-y-2">
          <div className="flex flex-wrap gap-1.5" aria-label="Renk paleti">
            {Object.entries((d.theme.tokens as { colors?: Record<string, string> }).colors ?? {}).map(([k, v]) => (
              <span key={k} className={`inline-flex items-center gap-1.5 rounded border ${border} px-1.5 py-0.5 font-mono text-[10px]`}><span aria-hidden className="h-3 w-3 rounded-sm border border-black/10" style={{ background: v }} />{k}</span>
            ))}
          </div>
          <details>
            <summary className="cursor-pointer text-[#5F6570] dark:text-[#9CA3AF]">Kontrast denetimi ({d.theme.contrast.filter((c) => c.pass).length}/{d.theme.contrast.length} geçti)</summary>
            <table className="mt-1 w-full text-left"><thead><tr className="text-[#5F6570] dark:text-[#8C9099]"><th className="py-0.5 pr-2">Kip</th><th className="pr-2">Çift</th><th className="pr-2">Oran</th><th>En az</th></tr></thead>
              <tbody>{d.theme.contrast.map((c, i) => <tr key={i} className={c.pass ? "" : "text-red-600"}><td className="py-0.5 pr-2">{c.mode}</td><td className="pr-2 font-mono">{c.pair}</td><td className="pr-2">{c.ratio}:1</td><td>{c.min}:1</td></tr>)}</tbody></table>
          </details>
        </div>
      )}
    </div>
  );
}

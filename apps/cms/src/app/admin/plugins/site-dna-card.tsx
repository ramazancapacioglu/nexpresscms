"use client";

import { useState, useTransition } from "react";
import { Sparkles } from "lucide-react";
import { runPluginAction } from "../plugin-actions";

const MAX = 2400;

/** Site DNA: markanın kimlik özeti. Siteden önerilir, düzenlenir, kaydedilince AI yazım asistanı kullanır. */
export function SiteDnaCard({ initial, onNotice }: { initial: string; onNotice: (tone: "ok" | "err", text: string) => void }) {
  const [saved, setSaved] = useState(initial);
  const [text, setText] = useState(initial);
  const [basedOn, setBasedOn] = useState<string[]>([]);
  const [pending, start] = useTransition();
  const dirty = text.trim() !== saved.trim();

  const generate = () =>
    start(async () => {
      try {
        const res = await runPluginAction({ name: "ai-brand.generate", payload: {} });
        if (res.ok) {
          const d = res.data as { dna: string; basedOn: string[] };
          setText(d.dna);
          setBasedOn(d.basedOn);
          onNotice("ok", "Öneri hazır. İnceleyip kaydedin.");
        } else onNotice("err", res.error);
      } catch {
        onNotice("err", "İstek tamamlanamadı.");
      }
    });

  const save = () =>
    start(async () => {
      try {
        const res = await runPluginAction({ name: "ai-brand.save", payload: { dna: text } });
        if (res.ok) {
          setSaved(text);
          onNotice("ok", "Site DNA kaydedildi.");
        } else onNotice("err", res.error);
      } catch {
        onNotice("err", "Kaydedilemedi.");
      }
    });

  return (
    <section className="space-y-2 border-t border-[#E6E7EA] dark:border-[#23262E] p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="text-[11px] font-semibold uppercase tracking-wider text-[#8C9099]">Site DNA</h3>
          <p className="text-[12px] text-[#5C5F66] dark:text-[#9CA3AF]">Markanızın kim olduğunu, ne sunduğunu ve nasıl konuştuğunu anlatan 4–6 paragraf. AI yazım asistanı her öneride bunu bağlam olarak kullanır.</p>
        </div>
        <button type="button" onClick={generate} disabled={pending} className="inline-flex h-8 items-center gap-1.5 rounded-md border border-violet-500/40 px-3 text-[12px] font-medium text-violet-700 dark:text-violet-300 hover:bg-violet-500/10 disabled:opacity-60">
          <Sparkles className="h-3.5 w-3.5" /> {pending ? "Hazırlanıyor…" : "Siteden öner"}
        </button>
      </div>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value.slice(0, MAX))}
        rows={8}
        aria-label="Site DNA"
        placeholder="Henüz tanımlı değil. 'Siteden öner' ile yayındaki içeriğinizden taslak üretebilir veya elle yazabilirsiniz."
        className="w-full rounded-md border border-[#E6E7EA] dark:border-[#23262E] bg-white dark:bg-[#121317] p-2.5 text-[12px] leading-relaxed outline-none focus:border-[#266DF0]"
      />
      <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-[#8C9099]">
        <span>
          {text.length}/{MAX}
          {basedOn.length > 0 && ` · Dayanak: ${basedOn.slice(0, 4).join(", ")}${basedOn.length > 4 ? "…" : ""}`}
        </span>
        <button type="button" onClick={save} disabled={pending || !dirty} className="h-8 rounded-md bg-[#266DF0] px-4 text-[12px] font-semibold text-white disabled:opacity-50">
          Kaydet
        </button>
      </div>
      <p className="text-[11px] text-[#8C9099]">Yapay zeka taslağıdır; kaydetmeden önce doğruluğunu kontrol edin.</p>
    </section>
  );
}

"use client";

import { useState, useTransition } from "react";
import { ClipboardCopy, Sparkles, Wand2 } from "lucide-react";
import type { DesignMode } from "@nexpress/core";
import type { DesignPreview } from "@/lib/design-library";
import { exportPromptAction, generateDesignAction, saveDesignAction, validateDesignJsonAction } from "./actions";
import { DesignPreviewView } from "./design-preview";

const border = "border-[#E6E7EA] dark:border-[#23262E]";
const field = `w-full rounded-md border ${border} bg-transparent px-2.5 py-2 text-[12px] outline-none focus:border-[#266DF0]`;
const MODES: Array<[DesignMode, string, string]> = [["section", "Bölüm", "1–3 blokluk yeniden kullanılabilir bölüm"], ["page", "Sayfa", "Hero, TL;DR, içerik ve SSS'li tam sayfa"], ["theme", "Tema", "Renk, yazı tipi ve geometri jetonları (WCAG kontrastlı)"]];
const EXAMPLES: Record<DesignMode, string[]> = {
  section: ["Siber güvenlik firması için güven veren, tek eylemli vitrin bölümü", "3 adımda nasıl çalıştığımızı anlatan bölüm", "Sık sorulan 5 soruluk SSS bölümü"],
  page: ["İzmir'de yerel bir diş kliniği için hizmetler ve randevu odaklı açılış sayfası", "B2B muhasebe yazılımı için özellikler, adımlar ve SSS içeren tanıtım sayfası", "Hakkımızda sayfası: hikâye, değerler ve iletişim eylemi"],
  theme: ["Sakin, güven veren lacivert ve yeşil tonlu kurumsal tema", "Sıcak toprak tonlu, serif başlıklı butik tasarım teması", "Yüksek kontrastlı, erişilebilirliği öne çıkaran sade tema"],
};

/** AI üretici: tarif → doğrulanmış önizleme → kütüphaneye kaydet. Anahtar yoksa komutu kopyalayıp dış sohbetten JSON yapıştırma yolu açıktır. */
export function GeneratorPanel({ aiReady, pluginOn, onSaved }: { aiReady: boolean; pluginOn: boolean; onSaved: () => void }) {
  const [mode, setMode] = useState<DesignMode>("page");
  const [prompt, setPrompt] = useState("");
  const [design, setDesign] = useState<DesignPreview | null>(null);
  const [name, setName] = useState("");
  const [source, setSource] = useState<"ai" | "manual">("ai");
  const [pasted, setPasted] = useState("");
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, start] = useTransition();
  const canGenerate = aiReady && pluginOn;

  const generate = () =>
    start(async () => {
      setMsg(null);
      const r = await generateDesignAction({ mode, prompt });
      if (r.ok) { setDesign(r.design); setName(r.design.name); setSource("ai"); }
      else setMsg({ ok: false, text: r.error });
    });
  const copyPrompt = () =>
    start(async () => {
      const r = await exportPromptAction({ mode });
      if (r.ok) { await navigator.clipboard?.writeText(r.prompt).catch(() => undefined); setMsg({ ok: true, text: "Komut panoya kopyalandı. ChatGPT/Claude'a yapıştırın, tarifinizi ekleyin ve gelen JSON'u aşağıya yapıştırın." }); }
      else setMsg({ ok: false, text: r.error });
    });
  const importJson = () =>
    start(async () => {
      setMsg(null);
      const r = await validateDesignJsonAction({ mode, json: pasted });
      if (r.ok) { setDesign(r.design); setName(r.design.name); setSource("manual"); }
      else setMsg({ ok: false, text: r.error });
    });
  const save = () =>
    start(async () => {
      if (!design) return;
      const r = await saveDesignAction({ design, name, prompt, source });
      if (r.ok) { setMsg({ ok: true, text: "Kütüphaneye kaydedildi." }); setDesign(null); setPasted(""); onSaved(); }
      else setMsg({ ok: false, text: r.error });
    });

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,420px)_minmax(0,1fr)]">
      <section className={`space-y-3 rounded-lg border ${border} bg-white p-4 dark:bg-[#15171C]`}>
        <fieldset>
          <legend className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-[#5F6570] dark:text-[#8C9099]">Ne tasarlansın?</legend>
          <div className="grid grid-cols-3 gap-1.5">
            {MODES.map(([id, label, hint]) => (
              <button key={id} type="button" aria-pressed={mode === id} title={hint} onClick={() => { setMode(id); setDesign(null); }} className={`rounded-md border px-2 py-1.5 text-[12px] font-medium ${mode === id ? "border-[#266DF0] bg-[#266DF0]/10 text-[#1D5ED8] dark:text-[#7AA7FF]" : border}`}>{label}</button>
            ))}
          </div>
          <p className="mt-1 text-[11px] text-[#5F6570] dark:text-[#8C9099]">{MODES.find((m) => m[0] === mode)![2]}</p>
        </fieldset>
        <label className="block space-y-1">
          <span className="text-[11px] font-medium text-[#5F6570] dark:text-[#9CA3AF]">Tarif ({prompt.length}/2000)</span>
          <textarea className={`${field} h-28`} value={prompt} maxLength={2000} onChange={(e) => setPrompt(e.target.value)} placeholder="Kimin için, hangi amaçla, hangi tonda… Sitenin sayfaları, medyası ve formları otomatik bağlam olarak verilir." />
        </label>
        <div className="flex flex-wrap gap-1.5">{EXAMPLES[mode].map((ex) => <button key={ex} type="button" onClick={() => setPrompt(ex)} className={`rounded-full border ${border} px-2 py-0.5 text-[11px] text-[#5F6570] hover:border-[#266DF0] dark:text-[#9CA3AF]`}>{ex.length > 46 ? `${ex.slice(0, 46)}…` : ex}</button>)}</div>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={generate} disabled={pending || !canGenerate || prompt.trim().length < 10} className="inline-flex h-8 items-center gap-1.5 rounded-md bg-[#266DF0] px-3 text-[12px] font-semibold text-white disabled:opacity-50"><Wand2 className="h-3.5 w-3.5" /> {pending ? "Üretiliyor…" : "AI ile üret"}</button>
          <button type="button" onClick={copyPrompt} disabled={pending} className={`inline-flex h-8 items-center gap-1.5 rounded-md border ${border} px-3 text-[12px] font-medium hover:bg-[#F4F5F7] dark:hover:bg-[#1C1E24]`}><ClipboardCopy className="h-3.5 w-3.5" /> Komutu kopyala</button>
        </div>
        {!pluginOn && <p className="text-[11px] text-amber-800 dark:text-amber-300">AI Tasarım eklentisi bu sitede kapalı (Eklentiler sayfasından açın).</p>}
        {pluginOn && !aiReady && <p className="text-[11px] text-amber-800 dark:text-amber-300">OPENAI_API_KEY tanımlı değil: AI ile üretim kapalı. "Komutu kopyala" ile dış sohbetten üretip JSON'u aşağıya yapıştırabilirsiniz; aynı doğrulamadan geçer.</p>}
        <details className="text-[12px]">
          <summary className="cursor-pointer font-medium">Hazır JSON yapıştır (dış sohbet çıktısı)</summary>
          <textarea className={`${field} mt-2 h-28 font-mono text-[11px]`} aria-label="Yapıştırılacak tasarım JSON'u" value={pasted} onChange={(e) => setPasted(e.target.value)} placeholder='{ "name": "…", "blocks": [ … ] }' />
          <button type="button" onClick={importJson} disabled={pending || pasted.trim().length < 5} className={`mt-1.5 h-8 rounded-md border ${border} px-3 font-medium disabled:opacity-50`}>Doğrula ve önizle</button>
        </details>
        {msg && <p role="status" className={`text-[12px] ${msg.ok ? "text-emerald-800 dark:text-emerald-400" : "text-red-600"}`}>{msg.text}</p>}
      </section>

      <section className={`rounded-lg border ${border} bg-white p-4 dark:bg-[#15171C]`} aria-live="polite">
        {!design ? (
          <div className="flex h-full min-h-48 flex-col items-center justify-center gap-2 text-center text-[12px] text-[#5F6570] dark:text-[#8C9099]">
            <Sparkles className="h-7 w-7 opacity-40" aria-hidden />
            <p className="max-w-[44ch]">Üretilen tasarım burada doğrulama raporuyla görünür. Hiçbir şey otomatik yayınlanmaz veya sayfalara eklenmez; beğendiğinizi kütüphaneye kaydedersiniz.</p>
          </div>
        ) : (
          <div className="space-y-3">
            <DesignPreviewView d={design} />
            <div className={`flex flex-wrap items-end gap-2 border-t ${border} pt-3`}>
              <label className="block min-w-48 flex-1 space-y-1"><span className="text-[11px] font-medium text-[#5F6570] dark:text-[#9CA3AF]">Kütüphanedeki adı</span><input className={`${field} h-8 py-0`} value={name} maxLength={80} onChange={(e) => setName(e.target.value)} /></label>
              <button type="button" onClick={save} disabled={pending || design.errors.length > 0} className="h-8 rounded-md bg-[#266DF0] px-4 text-[12px] font-semibold text-white disabled:opacity-50">Kütüphaneye kaydet</button>
              {design.errors.length > 0 && <span className="text-[11px] text-red-600">Hata varken kaydedilemez.</span>}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}

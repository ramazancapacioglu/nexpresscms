"use client";

import { useState, useTransition } from "react";
import { Sparkles } from "lucide-react";
import { runPluginAction } from "@/app/admin/plugin-actions";
import { useStudioInspector } from "./studio-inspector-context";

interface Suggestions {
  tldr: string;
  metaTitle: string;
  metaDescription: string;
  faq: Array<{ question: string; answer: string }>;
  remainingForbidden: string[];
  refined: boolean;
  model: string;
}

/** Editör SEO sekmesi: AI ile TL;DR, meta ve SSS önerisi. Öneri yalnızca editör alanlarını doldurur; kaydetmek ayrı adımdır. */
export function AiSuggestPanel() {
  const { title, compiledMarkdown, focusKeyword, setTldr, setMetaTitle, setMetaDescription } = useStudioInspector();
  const [result, setResult] = useState<Suggestions | null>(null);
  const [error, setError] = useState<{ text: string; hint?: boolean } | null>(null);
  const [applied, setApplied] = useState<string[]>([]);
  const [pending, start] = useTransition();

  const run = () =>
    start(async () => {
      setError(null);
      setApplied([]);
      try {
        const res = await runPluginAction({ name: "ai-writer.suggest", payload: { title, markdown: compiledMarkdown, focusKeyword } });
        if (res.ok) setResult(res.data as Suggestions);
        else {
          setResult(null);
          setError({ text: res.error, hint: res.code === "disabled" });
        }
      } catch {
        setError({ text: "İstek tamamlanamadı." });
      }
    });

  const apply = (key: "tldr" | "metaTitle" | "metaDescription", value: string) => {
    if (key === "tldr") setTldr(value);
    else if (key === "metaTitle") setMetaTitle(value);
    else setMetaDescription(value);
    setApplied((a) => [...a, key]);
  };

  const row = (key: "tldr" | "metaTitle" | "metaDescription", label: string, value: string, max: number) =>
    value ? (
      <div className="rounded-md border border-border bg-muted/20 p-2 space-y-1">
        <div className="flex items-center justify-between text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          <span>{label}</span>
          <span className="font-mono normal-case">{value.length}/{max}</span>
        </div>
        <p className="text-[12px] leading-snug text-foreground">{value}</p>
        <button
          type="button"
          onClick={() => apply(key, value)}
          disabled={applied.includes(key)}
          className="rounded border border-border px-2 py-0.5 text-[11px] font-medium hover:bg-muted disabled:opacity-50"
        >
          {applied.includes(key) ? "Uygulandı" : "Uygula"}
        </button>
      </div>
    ) : null;

  return (
    <div className="rounded-lg border border-violet-500/30 bg-violet-500/5 p-2.5 space-y-2">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase text-violet-700 dark:text-violet-300">
          <Sparkles className="h-3 w-3" /> AI yazım asistanı
        </div>
        <button
          type="button"
          onClick={run}
          disabled={pending}
          className="rounded-md bg-violet-600 px-2.5 py-1 text-[11px] font-semibold text-white disabled:opacity-60"
        >
          {pending ? "Hazırlanıyor…" : result ? "Yeniden öner" : "Öner"}
        </button>
      </div>
      {!result && !error && !pending && (
        <p className="text-[11px] text-muted-foreground">İçeriğe dayanarak cevap-önce TL;DR, meta başlık/açıklama ve SSS önerir. Hiçbir şeyi kendiliğinden değiştirmez.</p>
      )}
      {error && (
        <p role="alert" className="text-[11px] text-red-600">
          {error.text}
          {error.hint && " Eklentiler sayfasından açabilirsiniz."}
        </p>
      )}
      {result && (
        <div className="space-y-2">
          {row("tldr", "TL;DR (kısa yanıt)", result.tldr, 300)}
          {row("metaTitle", "Meta başlık", result.metaTitle, 60)}
          {row("metaDescription", "Meta açıklama", result.metaDescription, 160)}
          {result.faq.length > 0 && (
            <div className="rounded-md border border-border bg-muted/20 p-2 space-y-1.5">
              <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">SSS önerisi</div>
              {result.faq.map((f) => (
                <div key={f.question} className="text-[12px]">
                  <p className="font-medium">{f.question}</p>
                  <p className="text-muted-foreground">{f.answer}</p>
                </div>
              ))}
              <p className="text-[10px] text-muted-foreground">SSS'yi içeriğe bir SSS bloğu olarak kendiniz ekleyin; şema otomatik üretilir.</p>
            </div>
          )}
          {result.remainingForbidden.length > 0 && (
            <p className="text-[11px] text-amber-700 dark:text-amber-300">Dikkat: yasak kalıp kaldı ({result.remainingForbidden.join(", ")}). Uygulamadan önce düzenleyin.</p>
          )}
          <p className="text-[10px] text-muted-foreground">
            Model: {result.model}{result.refined ? " · 2. geçişte düzeltildi" : ""} · Yapay zeka çıktısıdır, yayından önce kontrol edin.
          </p>
        </div>
      )}
    </div>
  );
}

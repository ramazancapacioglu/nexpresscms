"use client";

import { useState, useTransition } from "react";
import { AlertTriangle, RotateCcw, Sparkles } from "lucide-react";
import { runPluginAction } from "@/app/admin/plugin-actions";
import { useStudioInspector } from "./studio-inspector-context";

type Mode = "write" | "rewrite" | "expand" | "shorten" | "fix";
const MODES: Array<{ id: Mode; label: string; hint: string }> = [
  { id: "write", label: "Yaz", hint: "İsteğe göre sıfırdan yazar" },
  { id: "rewrite", label: "Yeniden yaz", hint: "Anlamı koruyarak istediğiniz üsluba çevirir" },
  { id: "expand", label: "Genişlet", hint: "Mevcut metni ayrıntılandırır" },
  { id: "shorten", label: "Kısalt", hint: "Bilgiyi koruyarak kısaltır" },
  { id: "fix", label: "Düzelt", hint: "Yalnızca yazım ve dil bilgisi" },
];

interface Result {
  paragraphs: string[];
  remainingForbidden: string[];
  claims: string[];
  unverifiedNumbers: string[];
  refined: boolean;
  model: string;
}

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/**
 * Seçili paragraf/başlık için AI yazım yardımcısı. Düzen: model yalnızca ÖNERİ üretir; önizlemede uyarılar görünür;
 * "Bloğa uygula" metni değiştirir (geri alınabilir), kaydetme ayrı ve açık bir adımdır. Uygulanan metin Markdown/HTML'e
 * her zamanki yoldan derlenir.
 */
export function AiComposePanel() {
  const { selectedBlock, updateSelectedBlockProps, bumpProseSync, title, compiledMarkdown, focusKeyword, locale } = useStudioInspector();
  const kind = selectedBlock && (selectedBlock.type === "heading" || selectedBlock.type === "heading_element") ? "heading" : "paragraph";
  const current = String(selectedBlock?.props?.text ?? "").trim();
  const [mode, setMode] = useState<Mode>(current ? "rewrite" : "write");
  const [instruction, setInstruction] = useState("");
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [undo, setUndo] = useState<{ text: string; html: string } | null>(null);
  const [pending, start] = useTransition();

  if (!selectedBlock) return null;

  const run = () =>
    start(async () => {
      setError(null);
      setResult(null);
      try {
        const res = await runPluginAction({ name: "ai-writer.compose", payload: { mode, instruction, text: mode === "write" ? "" : current, title, kind, context: compiledMarkdown.slice(0, 3000), focusKeyword, locale } });
        if (res.ok) setResult(res.data as Result);
        else setError(res.code === "disabled" ? `${res.error} Eklentiler › Agentic SEO Pro › "AI içerik yazımı" modülünü açın.` : res.error);
      } catch {
        setError("İstek tamamlanamadı.");
      }
    });

  const apply = () => {
    if (!result) return;
    setUndo({ text: String(selectedBlock.props.text ?? ""), html: String(selectedBlock.props.html ?? "") });
    const html = kind === "heading" ? esc(result.paragraphs[0]!) : result.paragraphs.map((p) => `<p>${esc(p)}</p>`).join("");
    updateSelectedBlockProps({ text: result.paragraphs.join("\n\n"), html });
    bumpProseSync();
    setResult(null);
  };

  const warnings = result ? [...(result.remainingForbidden.length ? [`Yasak kalıp kaldı: ${result.remainingForbidden.join(", ")}`] : []), ...(result.unverifiedNumbers.length ? [`Kaynakta olmayan rakam (uydurma olabilir): ${result.unverifiedNumbers.join(", ")}`] : []), ...(result.claims.length ? [`Doğrulayın: ${result.claims.join(" • ")}`] : [])] : [];

  return (
    <section aria-label="AI ile yaz" className="space-y-2 rounded-lg border border-violet-500/30 bg-violet-500/5 p-2.5 text-[12px]">
      <div className="flex items-center gap-1.5 font-semibold"><Sparkles className="h-3.5 w-3.5 text-violet-600" aria-hidden="true" /> AI ile yaz / düzenle</div>
      <div role="radiogroup" aria-label="Görev" className="flex flex-wrap gap-1">
        {MODES.map((m) => (
          <button key={m.id} type="button" role="radio" aria-checked={mode === m.id} title={m.hint} disabled={m.id !== "write" && !current} onClick={() => setMode(m.id)} className={`rounded px-2 py-1 text-[11px] font-medium disabled:opacity-40 ${mode === m.id ? "bg-violet-600 text-white" : "border border-border"}`}>{m.label}</button>
        ))}
      </div>
      <textarea aria-label="AI isteği" rows={2} value={instruction} onChange={(e) => setInstruction(e.target.value)} placeholder={mode === "write" ? "Ne yazılsın? Örn: hizmetimizi 3 cümlede, sade anlat" : "İsteğe bağlı: üslup/odak. Örn: daha resmi, kısa cümleler"} className="w-full rounded border border-border bg-background p-2 text-[12px]" maxLength={600} />
      <button type="button" disabled={pending || (mode === "write" && instruction.trim().length < 8)} onClick={run} className="h-8 w-full rounded bg-violet-600 text-[12px] font-semibold text-white disabled:opacity-50">{pending ? "Hazırlanıyor…" : "Öneri al"}</button>
      {error ? <p role="alert" className="text-red-600">{error}</p> : null}
      {result ? (
        <div className="space-y-2 rounded border border-border bg-background p-2">
          <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Öneri • {result.model}{result.refined ? " • yasak kalıp düzeltildi" : ""}</div>
          {result.paragraphs.map((p, i) => <p key={i} className="whitespace-pre-wrap leading-snug">{p}</p>)}
          {warnings.length ? (
            <ul className="space-y-1 rounded bg-amber-500/10 p-2 text-amber-900 dark:text-amber-200">
              {warnings.map((w) => <li key={w} className="flex gap-1.5"><AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" /><span>{w}</span></li>)}
            </ul>
          ) : null}
          <div className="flex gap-2">
            <button type="button" onClick={apply} className="h-8 flex-1 rounded bg-emerald-600 text-[12px] font-semibold text-white">Bloğa uygula</button>
            <button type="button" onClick={() => setResult(null)} className="h-8 rounded border border-border px-3">Vazgeç</button>
          </div>
          <p className="text-[10px] text-muted-foreground">Yapay zekâ taslağıdır: yayınlamadan önce okuyup doğrulayın. Uygulamak içeriği değiştirir; kaydetme ayrıdır.</p>
        </div>
      ) : null}
      {undo ? (
        <button type="button" className="inline-flex items-center gap-1 text-[11px] underline" onClick={() => { updateSelectedBlockProps(undo); bumpProseSync(); setUndo(null); }}><RotateCcw className="h-3 w-3" aria-hidden="true" /> Son AI değişikliğini geri al</button>
      ) : null}
    </section>
  );
}

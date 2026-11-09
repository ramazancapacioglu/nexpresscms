"use client";

import { useState, useTransition } from "react";
import { AlertTriangle, RotateCcw, Sparkles, X } from "lucide-react";
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
  lengthWarning: string | null;
  refined: boolean;
  model: string;
}

const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

function textPropKeyFor(type: string): "text" | "quote" | "summary" {
  if (type === "quote") return "quote";
  if (type === "tldr_box") return "summary";
  return "text";
}

/**
 * Seçili metin bloğu (başlık, paragraf, alıntı, kısa yanıt özeti) için AI yazım ve düzenleme yardımcısı.
 * Hem birleşik blok araç çubuğu (FloatingToolbar) açılır penceresinde hem de sağ denetçide çalışır.
 */
export function AiComposePanel({ onClose }: { onClose?: () => void } = {}) {
  const {
    selectedBlock,
    updateSelectedBlockProps,
    bumpProseSync,
    title,
    compiledMarkdown,
    focusKeyword,
    locale,
  } = useStudioInspector();

  const propKey = selectedBlock ? textPropKeyFor(selectedBlock.type) : "text";
  const kind =
    selectedBlock &&
    (selectedBlock.type === "heading" || selectedBlock.type === "heading_element")
      ? "heading"
      : "paragraph";
  const current = String(selectedBlock?.props?.[propKey] ?? "").trim();

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
        const res = await runPluginAction({
          name: "ai-writer.compose",
          payload: {
            mode,
            instruction,
            text: mode === "write" ? "" : current,
            title,
            kind,
            context: compiledMarkdown.slice(0, 3000),
            focusKeyword,
            locale,
          },
        });
        if (res.ok) setResult(res.data as Result);
        else
          setError(
            res.code === "disabled"
              ? `${res.error} Eklentiler › Agentic SEO Pro › "AI içerik yazımı" modülünü açın.`
              : res.error
          );
      } catch {
        setError("İstek tamamlanamadı.");
      }
    });

  const apply = () => {
    if (!result) return;
    setUndo({
      text: String(selectedBlock.props[propKey] ?? ""),
      html: String(selectedBlock.props.html ?? ""),
    });
    const html =
      kind === "heading"
        ? esc(result.paragraphs[0]!)
        : result.paragraphs.map((p) => `<p>${esc(p)}</p>`).join("");
    updateSelectedBlockProps({
      [propKey]: result.paragraphs.join("\n\n"),
      html,
    });
    bumpProseSync();
    setResult(null);
  };

  const warnings = result
    ? [
        ...(result.lengthWarning ? [result.lengthWarning] : []),
        ...(result.remainingForbidden.length
          ? [`Yasak kalıp kaldı: ${result.remainingForbidden.join(", ")}`]
          : []),
        ...(result.unverifiedNumbers.length
          ? [
              `Kaynakta olmayan rakam (uydurma olabilir): ${result.unverifiedNumbers.join(", ")}`,
            ]
          : []),
        ...(result.claims.length
          ? [`Doğrulayın: ${result.claims.join(" • ")}`]
          : []),
      ]
    : [];

  return (
    <section
      aria-label="AI ile yaz"
      onClick={(e) => e.stopPropagation()}
      className="space-y-2.5 rounded-xl border border-violet-500/35 bg-card p-3 text-[12px] text-card-foreground shadow-lg"
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 font-semibold text-violet-700 dark:text-violet-300">
          <Sparkles className="h-3.5 w-3.5 text-violet-600" aria-hidden="true" />
          <span>AI ile Yaz / Düzenle</span>
        </div>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            aria-label="AI panelini kapat"
            className="inline-flex h-6 w-6 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      <div role="radiogroup" aria-label="Görev" className="flex flex-wrap gap-1">
        {MODES.map((m) => (
          <button
            key={m.id}
            type="button"
            role="radio"
            aria-checked={mode === m.id}
            title={m.hint}
            disabled={m.id !== "write" && !current}
            onClick={() => setMode(m.id)}
            className={`rounded-md px-2 py-1 text-[11px] font-medium transition disabled:opacity-40 ${
              mode === m.id
                ? "bg-violet-600 text-white shadow-2xs"
                : "border border-border bg-background hover:bg-muted"
            }`}
          >
            {m.label}
          </button>
        ))}
      </div>

      <textarea
        aria-label="AI isteği"
        rows={2}
        value={instruction}
        onChange={(e) => setInstruction(e.target.value)}
        placeholder={
          mode === "write"
            ? "Ne yazılsın? Örn: hizmetimizi 3 cümlede, sade anlat"
            : "İsteğe bağlı: üslup/odak. Örn: daha resmi, kısa cümleler"
        }
        className="w-full rounded-lg border border-border bg-background p-2 text-[12px] text-foreground outline-none focus:border-violet-500"
        maxLength={600}
      />

      <button
        type="button"
        disabled={pending || (mode === "write" && instruction.trim().length < 8)}
        onClick={run}
        className="h-8 w-full rounded-lg bg-violet-600 text-[12px] font-semibold text-white hover:bg-violet-700 disabled:opacity-50"
      >
        {pending ? "Hazırlanıyor…" : "✨ Öneri Al"}
      </button>

      {error ? <p role="alert" className="text-red-600 text-[11px]">{error}</p> : null}

      {result ? (
        <div className="space-y-2 rounded-lg border border-border bg-muted/30 p-2.5">
          <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Öneri • {result.model}
            {result.refined ? " • yasak kalıp düzeltildi" : ""}
          </div>
          {result.paragraphs.map((p, i) => (
            <p key={i} className="whitespace-pre-wrap leading-snug text-foreground">
              {p}
            </p>
          ))}
          {warnings.length ? (
            <ul className="space-y-1 rounded bg-amber-500/10 p-2 text-amber-900 dark:text-amber-200">
              {warnings.map((w) => (
                <li key={w} className="flex gap-1.5">
                  <AlertTriangle
                    className="mt-0.5 h-3.5 w-3.5 shrink-0"
                    aria-hidden="true"
                  />
                  <span>{w}</span>
                </li>
              ))}
            </ul>
          ) : null}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={apply}
              className="h-8 flex-1 rounded-md bg-emerald-600 text-[12px] font-semibold text-white hover:bg-emerald-700"
            >
              Bloğa Uygula
            </button>
            <button
              type="button"
              onClick={() => setResult(null)}
              className="h-8 rounded-md border border-border bg-background px-3 text-foreground hover:bg-muted"
            >
              Vazgeç
            </button>
          </div>
          <p className="text-[10px] text-muted-foreground">
            Yapay zekâ taslağıdır: yayınlamadan önce okuyup doğrulayın.
          </p>
        </div>
      ) : null}

      {undo ? (
        <button
          type="button"
          className="inline-flex items-center gap-1 text-[11px] text-violet-600 underline hover:text-violet-700"
          onClick={() => {
            updateSelectedBlockProps({
              [propKey]: undo.text,
              html: undo.html,
            });
            bumpProseSync();
            setUndo(null);
          }}
        >
          <RotateCcw className="h-3 w-3" aria-hidden="true" /> Son AI değişikliğini geri al
        </button>
      ) : null}
    </section>
  );
}

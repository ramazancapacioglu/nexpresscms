"use client";

import React, { useState, useTransition } from "react";
import type { AiProviderKind } from "@nexpress/core";
import { saveAiSettingsAction, testAiConnectionAction } from "@/app/admin/integrations/ai-actions";
import { CheckCircle2, KeyRound, Sparkles, Zap } from "lucide-react";

interface AiProviderCardProps {
  initial: {
    enabled: boolean;
    provider: AiProviderKind;
    hasKey: boolean;
    hasEnvKey: boolean;
    baseUrl: string;
    chatModel: string;
    embeddingModel: string;
  };
}

const DEFAULTS: Record<AiProviderKind, { baseUrl: string; chatModel: string; embeddingModel: string }> = {
  openai: {
    baseUrl: "https://api.openai.com/v1",
    chatModel: "gpt-4o-mini",
    embeddingModel: "text-embedding-3-small",
  },
  gemini: {
    baseUrl: "https://generativelanguage.googleapis.com/v1beta/openai",
    chatModel: "gemini-2.5-flash",
    embeddingModel: "gemini-embedding-001",
  },
  custom: {
    baseUrl: "",
    chatModel: "",
    embeddingModel: "",
  },
};

const border = "border-[#E6E7EA] dark:border-[#23262E]";
const field = `h-8 w-full rounded-md border ${border} bg-transparent px-2.5 text-[12px] outline-none focus:border-blue-600`;

export function AiProviderCard({ initial }: AiProviderCardProps) {
  const [pending, start] = useTransition();
  const [enabled, setEnabled] = useState(initial.enabled);
  const [provider, setProvider] = useState<AiProviderKind>(initial.provider);
  const [apiKey, setApiKey] = useState("");
  const [baseUrl, setBaseUrl] = useState(initial.baseUrl);
  const [chatModel, setChatModel] = useState(initial.chatModel);
  const [embeddingModel, setEmbeddingModel] = useState(initial.embeddingModel);
  const [hasKey, setHasKey] = useState(initial.hasKey);
  const [status, setStatus] = useState<{ ok: boolean; text: string } | null>(null);

  const switchProvider = (next: AiProviderKind) => {
    setProvider(next);
    if (next !== "custom") {
      setBaseUrl(DEFAULTS[next].baseUrl);
      setChatModel(DEFAULTS[next].chatModel);
      setEmbeddingModel(DEFAULTS[next].embeddingModel);
    }
  };

  return (
    <section className={`rounded-xl border ${border} bg-white dark:bg-[#15171C] p-4 space-y-3.5 text-[12px]`}>
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/60 pb-3">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-blue-600/10 text-blue-700 dark:text-blue-300">
            <Sparkles className="h-4 w-4" />
          </div>
          <div>
            <h2 className="text-[13px] font-semibold">AI Sağlayıcı &amp; RAG Vektör Anahtarı (Şifreli)</h2>
            <p className="text-[11px] text-muted-foreground">
              Anahtar veritabanında <code>secret-box</code> ile şifrelenir. Tanımlıysa RAG anlamsal arama, site içi AI yanıt ve SEO asistanı bu sağlayıcıyla çalışır.
            </p>
          </div>
        </div>

        <label className="inline-flex cursor-pointer items-center gap-2 text-[12px] font-medium">
          <input type="checkbox" checked={enabled} onChange={(e) => setEnabled(e.target.checked)} />
          Etkin
        </label>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <label className="block space-y-1 font-medium">
          Sağlayıcı
          <select value={provider} onChange={(e) => switchProvider(e.target.value as AiProviderKind)} className={field}>
            <option value="openai">OpenAI (GPT + text-embedding-3)</option>
            <option value="gemini">Google Gemini (OpenAI uyumlu)</option>
            <option value="custom">Özel OpenAI-Uyumlu (OpenRouter, Groq, vLLM)</option>
          </select>
        </label>

        <label className="block space-y-1 font-medium sm:col-span-2 lg:col-span-2">
          <span className="flex items-center gap-1.5">
            <KeyRound className="h-3.5 w-3.5 opacity-70" />
            API Anahtarı {hasKey ? <span className="text-[10px] font-normal text-emerald-700 dark:text-emerald-400">(Kayıtlı — değiştirmek için yeni anahtar girin)</span> : initial.hasEnvKey ? <span className="text-[10px] font-normal text-blue-600">(Sunucu .env anahtarı mevcut)</span> : null}
          </span>
          <input
            type="password"
            autoComplete="new-password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder={hasKey ? "•••••••••••••••• (mevcut anahtar korunur)" : provider === "gemini" ? "AIza..." : "sk-..."}
            className={`${field} font-mono`}
          />
        </label>

        <label className="block space-y-1 font-medium">
          Sohbet Modeli
          <input value={chatModel} onChange={(e) => setChatModel(e.target.value)} placeholder={DEFAULTS[provider].chatModel || "gpt-4o-mini"} className={`${field} font-mono`} />
        </label>

        <label className="block space-y-1 font-medium">
          RAG Gömme (Embedding) Modeli
          <input value={embeddingModel} onChange={(e) => setEmbeddingModel(e.target.value)} placeholder={DEFAULTS[provider].embeddingModel || "text-embedding-3-small"} className={`${field} font-mono`} />
        </label>

        <label className="block space-y-1 font-medium">
          API Taban Adresi (Base URL)
          <input value={baseUrl} onChange={(e) => setBaseUrl(e.target.value)} placeholder={DEFAULTS[provider].baseUrl || "https://api.openai.com/v1"} className={`${field} font-mono`} />
        </label>
      </div>

      <div className="flex flex-wrap items-center gap-2 pt-1">
        <button
          type="button"
          disabled={pending}
          onClick={() =>
            start(async () => {
              const res = await saveAiSettingsAction({ enabled, provider, apiKey, baseUrl, chatModel, embeddingModel });
              if (res.ok) {
                if (apiKey.trim()) setHasKey(true);
                setApiKey("");
                setStatus({ ok: true, text: res.message });
              } else {
                setStatus({ ok: false, text: res.error });
              }
            })
          }
          className="h-8 rounded-md bg-blue-600 px-3.5 text-[12px] font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
        >
          {pending ? "Kaydediliyor…" : "Ayarları Kaydet"}
        </button>

        <button
          type="button"
          disabled={pending}
          onClick={() =>
            start(async () => {
              const res = await testAiConnectionAction();
              setStatus(res.ok ? { ok: true, text: res.message } : { ok: false, text: res.error });
            })
          }
          className={`inline-flex h-8 items-center gap-1.5 rounded-md border ${border} px-3 text-[12px] font-medium hover:bg-muted disabled:opacity-60`}
        >
          <Zap className="h-3.5 w-3.5 text-amber-600" /> Bağlantıyı Test Et
        </button>

        {status && (
          <p
            role={status.ok ? "status" : "alert"}
            className={`inline-flex items-center gap-1 text-[11px] font-medium ${
              status.ok ? "text-emerald-700 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"
            }`}
          >
            {status.ok ? <CheckCircle2 className="h-3.5 w-3.5" /> : null}
            <span>{status.text}</span>
          </p>
        )}
      </div>
    </section>
  );
}

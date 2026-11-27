"use client";

import React, { useState, useTransition } from "react";
import type { AiProviderKind } from "@nexpress/core";
import {
  saveAiSettingsAction,
  testAiConnectionAction,
  testEmbeddingConnectionAction,
} from "@/app/admin/integrations/ai-actions";
import { CheckCircle2, Database, KeyRound, Sparkles, Zap } from "lucide-react";

interface AiProviderCardProps {
  initial: {
    enabled: boolean;
    provider: AiProviderKind;
    hasKey: boolean;
    hasEnvKey: boolean;
    baseUrl: string;
    chatModel: string;
    deepChatModel: string;
    embeddingModel: string;
    separateEmbedding: boolean;
    embeddingProvider: AiProviderKind;
    hasEmbeddingKey: boolean;
    embeddingBaseUrl: string;
  };
}

interface ModelOption {
  value: string;
  label: string;
}

const DEFAULTS: Record<AiProviderKind, { baseUrl: string; chatModel: string; deepChatModel: string; embeddingModel: string }> = {
  openai: {
    baseUrl: "https://api.openai.com/v1",
    chatModel: "gpt-4.1-mini",
    deepChatModel: "gpt-4.1",
    embeddingModel: "text-embedding-3-small",
  },
  gemini: {
    baseUrl: "https://generativelanguage.googleapis.com/v1beta/openai",
    chatModel: "gemini-flash-latest",
    deepChatModel: "gemini-2.5-pro",
    embeddingModel: "gemini-embedding-001",
  },
  custom: {
    baseUrl: "",
    chatModel: "",
    deepChatModel: "",
    embeddingModel: "",
  },
};

const FAST_MODELS: Record<AiProviderKind, ModelOption[]> = {
  openai: [
    { value: "gpt-4.1-mini", label: "gpt-4.1-mini — Önerilen (Hızlı, Ekonomik, Araçlarda Güçlü)" },
    { value: "gpt-4.1-nano", label: "gpt-4.1-nano — Ultra Ekonomik & En Hızlı" },
    { value: "gpt-4o-mini", label: "gpt-4o-mini — Klasik Ekonomik" },
    { value: "gpt-5-mini", label: "gpt-5-mini — Yeni Nesil Hızlı" },
  ],
  gemini: [
    { value: "gemini-flash-latest", label: "gemini-flash-latest — Önerilen (Hızlı, Geniş Bağlam)" },
    { value: "gemini-flash-lite-latest", label: "gemini-flash-lite-latest — Ultra Ekonomik" },
    { value: "gemini-2.5-flash-lite", label: "gemini-2.5-flash-lite — Hafif & Hızlı" },
  ],
  custom: [],
};

const DEEP_MODELS: Record<AiProviderKind, ModelOption[]> = {
  openai: [
    { value: "gpt-4.1", label: "gpt-4.1 — Önerilen (SEO/GEO Analiz, İçerik & Tasarım)" },
    { value: "gpt-5", label: "gpt-5 — En Güçlü Uzman Muhakeme & Strateji" },
    { value: "gpt-4o", label: "gpt-4o — Dengeli Çok Yönlü" },
    { value: "o4-mini", label: "o4-mini — Hızlı Teknik Akıl Yürütme" },
  ],
  gemini: [
    { value: "gemini-2.5-pro", label: "gemini-2.5-pro — Önerilen (Derin Analiz & Uzun İçerik)" },
    { value: "gemini-pro-latest", label: "gemini-pro-latest — Güncel Pro Sürümü" },
    { value: "gemini-flash-latest", label: "gemini-flash-latest — Hızlı & Ekonomik" },
  ],
  custom: [],
};

const EMBED_MODELS: Record<AiProviderKind, ModelOption[]> = {
  openai: [
    { value: "text-embedding-3-small", label: "text-embedding-3-small — Önerilen (1536d, Ekonomik)" },
    { value: "text-embedding-3-large", label: "text-embedding-3-large — Yüksek Hassasiyet (1536d)" },
  ],
  gemini: [
    { value: "gemini-embedding-001", label: "gemini-embedding-001 — Önerilen (1536d, Türkçe Güçlü)" },
  ],
  custom: [],
};

const border = "border-[#E6E7EA] dark:border-[#23262E]";
const field = `h-8 w-full rounded-md border ${border} bg-transparent px-2.5 text-[12px] outline-none focus:border-blue-600`;

function ModelPicker({
  label,
  value,
  onChange,
  options,
  placeholder,
  bgClass = "",
}: {
  label: string;
  value: string;
  onChange: (next: string) => void;
  options: ModelOption[];
  placeholder: string;
  bgClass?: string;
}) {
  const isPreset = options.some((o) => o.value === value);
  const [customMode, setCustomMode] = useState(options.length === 0 || (Boolean(value) && !isPreset));
  const effectiveCustom = options.length === 0 || customMode;

  return (
    <label className="block space-y-1 font-medium">
      <span className="flex items-center justify-between gap-2">
        <span>{label}</span>
        {options.length > 0 && (
          <button
            type="button"
            onClick={() => {
              if (effectiveCustom) {
                setCustomMode(false);
                if (!isPreset && options[0]) onChange(options[0].value);
              } else {
                setCustomMode(true);
              }
            }}
            className="text-[10px] font-normal text-blue-600 hover:underline dark:text-blue-400"
          >
            {effectiveCustom ? "Listeden seç" : "Özel ad yaz"}
          </button>
        )}
      </span>
      {effectiveCustom ? (
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={`${field} ${bgClass} font-mono`}
        />
      ) : (
        <select
          value={isPreset ? value : options[0]?.value ?? ""}
          onChange={(e) => onChange(e.target.value)}
          className={`${field} ${bgClass}`}
        >
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      )}
    </label>
  );
}

export function AiProviderCard({ initial }: AiProviderCardProps) {
  const [pending, start] = useTransition();
  const [enabled, setEnabled] = useState(initial.enabled);
  const [provider, setProvider] = useState<AiProviderKind>(initial.provider);
  const [apiKey, setApiKey] = useState("");
  const [baseUrl, setBaseUrl] = useState(initial.baseUrl);
  const [chatModel, setChatModel] = useState(initial.chatModel || DEFAULTS[initial.provider].chatModel);
  const [deepChatModel, setDeepChatModel] = useState(initial.deepChatModel || DEFAULTS[initial.provider].deepChatModel);
  const [embeddingModel, setEmbeddingModel] = useState(
    initial.embeddingModel || DEFAULTS[initial.separateEmbedding ? initial.embeddingProvider : initial.provider].embeddingModel
  );
  const [hasKey, setHasKey] = useState(initial.hasKey);

  const [separateEmbedding, setSeparateEmbedding] = useState(initial.separateEmbedding);
  const [embeddingProvider, setEmbeddingProvider] = useState<AiProviderKind>(initial.embeddingProvider);
  const [embeddingApiKey, setEmbeddingApiKey] = useState("");
  const [embeddingBaseUrl, setEmbeddingBaseUrl] = useState(initial.embeddingBaseUrl);
  const [hasEmbeddingKey, setHasEmbeddingKey] = useState(initial.hasEmbeddingKey);

  const [status, setStatus] = useState<{ ok: boolean; text: string } | null>(null);

  const switchProvider = (next: AiProviderKind) => {
    setProvider(next);
    if (next !== "custom") {
      setBaseUrl(DEFAULTS[next].baseUrl);
      setChatModel(DEFAULTS[next].chatModel);
      setDeepChatModel(DEFAULTS[next].deepChatModel);
      if (!separateEmbedding) setEmbeddingModel(DEFAULTS[next].embeddingModel);
    }
  };

  const switchEmbeddingProvider = (next: AiProviderKind) => {
    setEmbeddingProvider(next);
    if (next !== "custom") {
      setEmbeddingBaseUrl(DEFAULTS[next].baseUrl);
      setEmbeddingModel(DEFAULTS[next].embeddingModel);
    }
  };

  return (
    <section className={`rounded-xl border ${border} bg-white dark:bg-[#15171C] p-4 space-y-4 text-[12px]`}>
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/60 pb-3">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-blue-600/10 text-blue-700 dark:text-blue-300">
            <Sparkles className="h-4 w-4" />
          </div>
          <div>
            <h2 className="text-[13px] font-semibold">AI Sağlayıcılar &amp; RAG Vektör Motoru (Şifreli)</h2>
            <p className="text-[11px] text-muted-foreground">
              Anahtarlar veritabanında <code>secret-box</code> ile şifrelenir. Sohbet/analiz/içerik ve RAG gömme (embedding) için aynı veya ayrı sağlayıcılar kullanabilirsiniz.
            </p>
          </div>
        </div>

        <label className="inline-flex cursor-pointer items-center gap-2 text-[12px] font-medium">
          <input type="checkbox" checked={enabled} onChange={(e) => setEnabled(e.target.checked)} />
          Etkin
        </label>
      </div>

      {/* 1. Bölüm: Sohbet, Analiz, Tasarım ve İçerik */}
      <div className="space-y-2.5">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          1. Sohbet, SEO Denetimi, Tasarım &amp; İçerik Motoru
        </p>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <label className="block space-y-1 font-medium">
            Sağlayıcı
            <select value={provider} onChange={(e) => switchProvider(e.target.value as AiProviderKind)} className={field}>
              <option value="openai">OpenAI (GPT-4.1 / GPT-5 / o4)</option>
              <option value="gemini">Google Gemini (Flash / 2.5 Pro)</option>
              <option value="custom">Özel OpenAI-Uyumlu (OpenRouter, Groq, vLLM)</option>
            </select>
          </label>

          <label className="block space-y-1 font-medium sm:col-span-2 lg:col-span-2">
            <span className="flex items-center gap-1.5">
              <KeyRound className="h-3.5 w-3.5 opacity-70" />
              Sohbet API Anahtarı{" "}
              {hasKey ? (
                <span className="text-[10px] font-normal text-emerald-700 dark:text-emerald-400">
                  (Kayıtlı — değiştirmek için yeni anahtar girin)
                </span>
              ) : initial.hasEnvKey ? (
                <span className="text-[10px] font-normal text-blue-600">(Sunucu .env anahtarı mevcut)</span>
              ) : null}
            </span>
            <input
              type="password"
              autoComplete="new-password"
              value={apiKey}
              onChange={(e) => {
                const val = e.target.value;
                setApiKey(val);
                if (val.trim() && !enabled) setEnabled(true);
              }}
              placeholder={hasKey ? "•••••••••••••••• (mevcut anahtar korunur)" : provider === "gemini" ? "AIza... / AQ..." : "sk-..."}
              className={`${field} font-mono`}
            />
          </label>

          <ModelPicker
            label="Hızlı / Standart Sohbet Modeli"
            value={chatModel}
            onChange={setChatModel}
            options={FAST_MODELS[provider]}
            placeholder={DEFAULTS[provider].chatModel || "gpt-4.1-mini"}
          />

          <ModelPicker
            label="Derin Analiz, Tasarım & İçerik Modeli"
            value={deepChatModel}
            onChange={setDeepChatModel}
            options={DEEP_MODELS[provider]}
            placeholder={DEFAULTS[provider].deepChatModel || "gpt-4.1"}
          />

          <label className="block space-y-1 font-medium">
            Sohbet API Taban Adresi (Base URL)
            <input
              value={baseUrl}
              onChange={(e) => setBaseUrl(e.target.value)}
              placeholder={DEFAULTS[provider].baseUrl || "https://api.openai.com/v1"}
              className={`${field} font-mono`}
            />
          </label>
        </div>
      </div>

      {/* 2. Bölüm: RAG & Site İçi Arama (Embedding) */}
      <div className={`rounded-lg border ${border} bg-[#FAFAFB] dark:bg-[#121317] p-3.5 space-y-3`}>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            <Database className="h-3.5 w-3.5 text-emerald-600" />
            <span>2. RAG &amp; Anlamsal Arama (Embedding) Motoru</span>
          </div>
          <label className="inline-flex cursor-pointer items-center gap-2 text-[11px] font-medium text-foreground">
            <input
              type="checkbox"
              checked={separateEmbedding}
              onChange={(e) => {
                const on = e.target.checked;
                setSeparateEmbedding(on);
                if (on && !embeddingBaseUrl && embeddingProvider !== "custom") {
                  setEmbeddingBaseUrl(DEFAULTS[embeddingProvider].baseUrl);
                  setEmbeddingModel(DEFAULTS[embeddingProvider].embeddingModel);
                }
              }}
            />
            RAG / Embedding için ayrı sağlayıcı &amp; anahtar kullan (Örn: Gemini Embedding + OpenAI Sohbet)
          </label>
        </div>

        {separateEmbedding ? (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <label className="block space-y-1 font-medium">
              Embedding Sağlayıcısı
              <select
                value={embeddingProvider}
                onChange={(e) => switchEmbeddingProvider(e.target.value as AiProviderKind)}
                className={`${field} bg-white dark:bg-[#15171C]`}
              >
                <option value="gemini">Google Gemini (gemini-embedding-001)</option>
                <option value="openai">OpenAI (text-embedding-3)</option>
                <option value="custom">Özel OpenAI-Uyumlu</option>
              </select>
            </label>

            <label className="block space-y-1 font-medium sm:col-span-2 lg:col-span-2">
              <span className="flex items-center gap-1.5">
                <KeyRound className="h-3.5 w-3.5 opacity-70" />
                Embedding API Anahtarı{" "}
                {hasEmbeddingKey ? (
                  <span className="text-[10px] font-normal text-emerald-700 dark:text-emerald-400">
                    (Kayıtlı — değiştirmek için yeni anahtar girin)
                  </span>
                ) : null}
              </span>
              <input
                type="password"
                autoComplete="new-password"
                value={embeddingApiKey}
                onChange={(e) => {
                  const val = e.target.value;
                  setEmbeddingApiKey(val);
                  if (val.trim() && !enabled) setEnabled(true);
                }}
                placeholder={hasEmbeddingKey ? "•••••••••••••••• (mevcut anahtar korunur)" : embeddingProvider === "gemini" ? "AIza... / AQ..." : "sk-..."}
                className={`${field} bg-white dark:bg-[#15171C] font-mono`}
              />
            </label>

            <ModelPicker
              label="RAG Gömme (Embedding) Modeli"
              value={embeddingModel}
              onChange={setEmbeddingModel}
              options={EMBED_MODELS[embeddingProvider]}
              placeholder={DEFAULTS[embeddingProvider].embeddingModel || "gemini-embedding-001"}
              bgClass="bg-white dark:bg-[#15171C]"
            />

            <label className="block space-y-1 font-medium sm:col-span-2">
              Embedding API Taban Adresi (Base URL)
              <input
                value={embeddingBaseUrl}
                onChange={(e) => setEmbeddingBaseUrl(e.target.value)}
                placeholder={DEFAULTS[embeddingProvider].baseUrl}
                className={`${field} bg-white dark:bg-[#15171C] font-mono`}
              />
            </label>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            <ModelPicker
              label="RAG Gömme (Embedding) Modeli (Ana sağlayıcı üzerinden)"
              value={embeddingModel}
              onChange={setEmbeddingModel}
              options={EMBED_MODELS[provider]}
              placeholder={DEFAULTS[provider].embeddingModel || "text-embedding-3-small"}
              bgClass="bg-white dark:bg-[#15171C]"
            />
            <p className="self-end pb-1 text-[11px] text-muted-foreground">
              İsterseniz yukarıdaki kutuyu işaretleyip RAG için Google Gemini, sohbet/içerik için OpenAI gibi iki farklı sağlayıcıyı birlikte çalıştırabilirsiniz.
            </p>
          </div>
        )}
      </div>

      {/* Eylem Çubuğu */}
      <div className="flex flex-wrap items-center gap-2 pt-1">
        <button
          type="button"
          disabled={pending}
          onClick={() =>
            start(async () => {
              const res = await saveAiSettingsAction({
                enabled,
                provider,
                apiKey,
                baseUrl,
                chatModel,
                deepChatModel,
                embeddingModel,
                separateEmbedding,
                embeddingProvider,
                embeddingApiKey,
                embeddingBaseUrl,
              });
              if (res.ok) {
                if (apiKey.trim()) setHasKey(true);
                if (embeddingApiKey.trim()) setHasEmbeddingKey(true);
                setApiKey("");
                setEmbeddingApiKey("");
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
              const res = await testAiConnectionAction({ provider, apiKey, baseUrl, chatModel });
              setStatus(res.ok ? { ok: true, text: res.message } : { ok: false, text: res.error });
            })
          }
          className={`inline-flex h-8 items-center gap-1.5 rounded-md border ${border} px-3 text-[12px] font-medium hover:bg-muted disabled:opacity-60`}
        >
          <Zap className="h-3.5 w-3.5 text-amber-600" /> Sohbeti Test Et
        </button>

        <button
          type="button"
          disabled={pending}
          onClick={() =>
            start(async () => {
              const res = await testEmbeddingConnectionAction({
                separateEmbedding,
                provider: separateEmbedding ? embeddingProvider : provider,
                apiKey: separateEmbedding ? embeddingApiKey : apiKey,
                baseUrl: separateEmbedding ? embeddingBaseUrl : baseUrl,
                embeddingModel,
              });
              setStatus(res.ok ? { ok: true, text: res.message } : { ok: false, text: res.error });
            })
          }
          className={`inline-flex h-8 items-center gap-1.5 rounded-md border ${border} px-3 text-[12px] font-medium hover:bg-muted disabled:opacity-60`}
        >
          <Database className="h-3.5 w-3.5 text-emerald-600" /> Embedding&apos;i Test Et
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

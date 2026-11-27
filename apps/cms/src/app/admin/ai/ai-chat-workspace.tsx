"use client";

import React, { useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import type { AiPersona, AiToolTrace } from "@nexpress/database";
import {
  AlertTriangle,
  Bot,
  CheckCircle2,
  Loader2,
  MessageSquarePlus,
  Send,
  Sparkles,
  Trash2,
  User,
  Wrench,
} from "lucide-react";
import { deleteConversationAction, loadConversationAction, sendAssistantMessageAction } from "./actions";

export interface ClientConversation {
  id: string;
  title: string;
  persona: AiPersona;
  summary: string;
  updatedAt: string;
}

export interface ClientMessage {
  id: string;
  conversationId: string;
  role: "user" | "assistant";
  content: string;
  toolsUsed: AiToolTrace[];
  createdAt: string;
}

const PERSONA_OPTIONS: Array<{ id: AiPersona; label: string; hint: string }> = [
  { id: "general", label: "Baş Uzman", hint: "SEO, GEO, tasarım ve içerikte tam yetkili" },
  { id: "seo", label: "SEO & GEO", hint: "Teknik SEO, şema, GSC/Bing ve AI botlar" },
  { id: "design", label: "Tasarım & UX", hint: "0-KB RSC, yerleşim, mobil uyum ve dönüşüm" },
  { id: "content", label: "İçerik & Editör", hint: "Doğal dilde, uzmanlık odaklı GEO içerik" },
];

const QUICK_PROMPTS: Array<{ persona: AiPersona; label: string; prompt: string }> = [
  {
    persona: "seo",
    label: "Tam Site SEO & Şema Denetimi",
    prompt: "Tüm siteyi canlı araçlarla denetle. Kritik hataları, şema/Markdown tutarsızlıklarını, kırık iç bağlantıları, yazar E-E-A-T ve RAG durumunu gerçek sayılarla öncelik sırasına göre raporla.",
  },
  {
    persona: "seo",
    label: "GSC/Bing Fırsatları & 404 Analizi",
    prompt: "Search Console ve Bing raporlarını, 2. sayfa hızlı kazanım fırsatlarını, AI bot taramalarını ve en sık 404 adreslerini incele; somut aksiyon listesi çıkar.",
  },
  {
    persona: "general",
    label: "Bilgi Ağı & İç Link İyileştirmesi",
    prompt: "Sitedeki iç bağlantı ve Bilgi Ağı eksiklerini analiz et, hangi ürün ve rehber sayfalarının bağlanması gerektiğini listele.",
  },
  {
    persona: "content",
    label: "İçerik & TL;DR Kalite Kontrolü",
    prompt: "Sitedeki önemli sayfa ve yazıları incele, başlık/meta açıklama veya Answer-First (TL;DR) özeti zayıf olan ilk 5 içeriği doğal ve yüksek dönüşümlü önerilerle listele.",
  },
];

const border = "border-[#E6E7EA] dark:border-[#23262E]";

export function AiChatWorkspace({
  initialConversations,
  initialMessages,
  initialConvId,
  aiStatus,
}: {
  initialConversations: ClientConversation[];
  initialMessages: ClientMessage[];
  initialConvId: string | null;
  aiStatus: { configured: boolean; provider: string; model: string };
}) {
  const [conversations, setConversations] = useState<ClientConversation[]>(initialConversations);
  const [activeId, setActiveId] = useState<string | null>(initialConvId);
  const [messages, setMessages] = useState<ClientMessage[]>(initialMessages);
  const [persona, setPersona] = useState<AiPersona>(
    initialConversations.find((c) => c.id === initialConvId)?.persona ?? "general"
  );
  const [input, setInput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length, pending]);

  const openConversation = (conv: ClientConversation) => {
    setError(null);
    setActiveId(conv.id);
    setPersona(conv.persona);
    startTransition(async () => {
      const res = await loadConversationAction(conv.id);
      if (res.ok) {
        setMessages(res.messages);
        setPersona(res.persona);
      } else {
        setError(res.error);
      }
    });
  };

  const startNewChat = () => {
    setActiveId(null);
    setMessages([]);
    setError(null);
  };

  const handleDelete = (id: string) => {
    if (!window.confirm("Bu sohbet ve geçmişi silinsin mi?")) return;
    startTransition(async () => {
      await deleteConversationAction(id);
      setConversations((prev) => prev.filter((c) => c.id !== id));
      if (activeId === id) {
        setActiveId(null);
        setMessages([]);
      }
    });
  };

  const sendText = (text: string, overridePersona?: AiPersona) => {
    const clean = text.trim();
    if (!clean || pending) return;
    const usePersona = overridePersona ?? persona;
    if (overridePersona) setPersona(overridePersona);
    setError(null);
    setInput("");

    // Optimistik kullanıcı mesajı
    const tempMsg: ClientMessage = {
      id: `tmp_${Date.now()}`,
      conversationId: activeId ?? "new",
      role: "user",
      content: clean,
      toolsUsed: [],
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, tempMsg]);

    startTransition(async () => {
      const res = await sendAssistantMessageAction({
        conversationId: activeId ?? undefined,
        persona: usePersona,
        message: clean,
      });
      if (res.ok) {
        setActiveId(res.conversationId);
        setConversations(res.conversations);
        setMessages(res.messages);
      } else {
        setError(res.error);
        setMessages((prev) => prev.filter((m) => m.id !== tempMsg.id));
        setInput(clean);
      }
    });
  };

  return (
    <div className={`grid h-[calc(100vh-145px)] min-h-[540px] grid-cols-1 overflow-hidden rounded-xl border ${border} bg-white dark:bg-[#15171C] shadow-xs lg:grid-cols-[260px_minmax(0,1fr)]`}>
      {/* Sol Sohbet Geçmişi (Kalıcı Hafıza) */}
      <aside className={`hidden flex-col border-r ${border} bg-[#FAFAFB] dark:bg-[#121317] lg:flex`}>
        <div className={`border-b ${border} p-3`}>
          <button
            type="button"
            onClick={startNewChat}
            className="flex h-8 w-full items-center justify-center gap-1.5 rounded-lg bg-blue-600 px-3 text-[12px] font-semibold text-white hover:bg-blue-700"
          >
            <MessageSquarePlus className="h-3.5 w-3.5" /> Yeni Uzman Sohbeti
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {conversations.length === 0 ? (
            <p className="px-2 py-6 text-center text-[11px] text-muted-foreground">
              Henüz kayıtlı sohbet yok. Tüm yazışmalar burada kalıcı olarak saklanır.
            </p>
          ) : (
            conversations.map((c) => (
              <div
                key={c.id}
                className={`group flex items-center justify-between gap-1 rounded-lg px-2.5 py-2 text-[12px] transition ${
                  activeId === c.id
                    ? "bg-blue-500/10 text-blue-700 dark:text-blue-300 font-semibold"
                    : "text-foreground hover:bg-muted/70"
                }`}
              >
                <button
                  type="button"
                  onClick={() => openConversation(c)}
                  className="min-w-0 flex-1 text-left"
                >
                  <p className="truncate">{c.title}</p>
                  <p className="text-[10px] font-normal text-muted-foreground">
                    {PERSONA_OPTIONS.find((p) => p.id === c.persona)?.label ?? "Uzman"} ·{" "}
                    {new Date(c.updatedAt).toLocaleDateString("tr-TR", { day: "numeric", month: "short" })}
                  </p>
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(c.id)}
                  title="Sohbeti sil"
                  className="rounded p-1 text-muted-foreground opacity-0 transition hover:bg-rose-500/10 hover:text-rose-600 group-hover:opacity-100"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
            ))
          )}
        </div>
      </aside>

      {/* Sağ Ana Sohbet Alanı */}
      <div className="flex min-w-0 flex-col">
        {/* Üst Rol & Sağlayıcı Çubuğu */}
        <div className={`flex flex-wrap items-center justify-between gap-2 border-b ${border} px-4 py-2.5`}>
          <div className="flex flex-wrap items-center gap-1.5">
            {PERSONA_OPTIONS.map((p) => (
              <button
                key={p.id}
                type="button"
                title={p.hint}
                onClick={() => setPersona(p.id)}
                className={`rounded-full border px-2.5 py-1 text-[11px] font-medium transition ${
                  persona === p.id
                    ? "border-blue-500 bg-blue-500/10 text-blue-700 dark:text-blue-300"
                    : `${border} bg-background text-muted-foreground hover:text-foreground`
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 text-[11px]">
            {aiStatus.configured ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-0.5 font-medium text-emerald-700 dark:text-emerald-300">
                <CheckCircle2 className="h-3 w-3" /> {aiStatus.provider} / {aiStatus.model}
              </span>
            ) : (
              <Link
                href="/admin/integrations"
                className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2.5 py-0.5 font-semibold text-amber-800 dark:text-amber-300 hover:underline"
              >
                <AlertTriangle className="h-3 w-3" /> API Anahtarı Bağla →
              </Link>
            )}
          </div>
        </div>

        {/* Mesaj Listesi */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
          {messages.length === 0 ? (
            <div className="mx-auto max-w-2xl py-8 space-y-5">
              <div className="text-center space-y-1.5">
                <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600/10 text-blue-600">
                  <Sparkles className="h-5 w-5" />
                </div>
                <h2 className="text-[15px] font-bold">NexPress AI Uzman Asistan</h2>
                <p className="text-[12px] text-muted-foreground">
                  Canlı SEO denetimi, Search Console/Bing raporları, RAG araması, şema kontrolü ve tek komutla güvenli düzeltmeler. Tüm konuşmalar kalıcı kaydedilir.
                </p>
              </div>

              <div className="grid gap-2.5 sm:grid-cols-2">
                {QUICK_PROMPTS.map((q) => (
                  <button
                    key={q.label}
                    type="button"
                    disabled={pending || !aiStatus.configured}
                    onClick={() => sendText(q.prompt, q.persona)}
                    className={`rounded-xl border ${border} bg-[#FAFAFB] dark:bg-[#181A20] p-3 text-left transition hover:border-blue-500/50 hover:bg-blue-500/[0.04] disabled:opacity-50`}
                  >
                    <p className="text-[12px] font-semibold text-foreground">{q.label}</p>
                    <p className="mt-1 line-clamp-2 text-[11px] text-muted-foreground">{q.prompt}</p>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((m) => (
              <div key={m.id} className={`flex gap-3 ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                {m.role === "assistant" && (
                  <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-blue-600 text-white">
                    <Bot className="h-4 w-4" />
                  </div>
                )}

                <div
                  className={`max-w-[85%] space-y-2 rounded-2xl px-4 py-3 text-[13px] leading-relaxed ${
                    m.role === "user"
                      ? "bg-blue-600 text-white"
                      : `border ${border} bg-[#FAFAFB] dark:bg-[#181A20] text-foreground`
                  }`}
                >
                  {m.toolsUsed && m.toolsUsed.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 border-b border-border/60 pb-2 text-[10px]">
                      {m.toolsUsed.map((t, i) => (
                        <span
                          key={`${t.name}-${i}`}
                          title={t.summary}
                          className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 font-mono ${
                            t.ok
                              ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                              : "border-rose-500/30 bg-rose-500/10 text-rose-700 dark:text-rose-300"
                          }`}
                        >
                          <Wrench className="h-2.5 w-2.5" />
                          {t.name}: {t.summary}
                        </span>
                      ))}
                    </div>
                  )}
                  <div className="whitespace-pre-wrap break-words">{m.content}</div>
                </div>

                {m.role === "user" && (
                  <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-border bg-muted">
                    <User className="h-4 w-4" />
                  </div>
                )}
              </div>
            ))
          )}

          {pending && (
            <div className="flex items-center gap-2 text-[12px] text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
              <span>Canlı site verileri ve araçlar inceleniyor…</span>
            </div>
          )}

          {error && (
            <div role="alert" className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-3.5 py-2.5 text-[12px] font-medium text-rose-700 dark:text-rose-300">
              {error}
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Alt Mesaj Girişi */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            sendText(input);
          }}
          className={`flex items-end gap-2 border-t ${border} bg-[#FAFAFB] dark:bg-[#121317] p-3`}
        >
          <textarea
            rows={2}
            value={input}
            disabled={pending || !aiStatus.configured}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                sendText(input);
              }
            }}
            placeholder={
              aiStatus.configured
                ? "Örn: Siteyi denetle ve kritik SEO hatalarını düzelt… (Enter gönderir, Shift+Enter yeni satır)"
                : "Önce Entegrasyonlar sayfasından API anahtarınızı kaydedin…"
            }
            className={`min-h-[42px] max-h-36 flex-1 resize-y rounded-lg border ${border} bg-white dark:bg-[#15171C] px-3 py-2 text-[13px] outline-none focus:border-blue-600 disabled:opacity-60`}
          />
          <button
            type="submit"
            disabled={pending || !input.trim() || !aiStatus.configured}
            className="inline-flex h-10 items-center gap-1.5 rounded-lg bg-blue-600 px-4 text-[12px] font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
          >
            <Send className="h-3.5 w-3.5" /> Gönder
          </button>
        </form>
      </div>
    </div>
  );
}

"use client";

import React, { useState, useTransition } from "react";
import Link from "next/link";
import { CheckCircle2, Code2, Layers, LayoutTemplate, Sparkles, Wand2 } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import type { DesignPreview } from "@/lib/design-library";
import { generateDesignAction, saveDesignAction } from "../design-library/actions";

export interface StudioLibraryItem {
  id: string;
  name: string;
  kind: string;
  category: string;
  description: string;
  source: string;
  blocksCount: number;
  createdAt: string;
}

/**
 * Kütüphane & AI Stüdyosu (sadeleştirilmiş):
 * Şablon yönetimi `/admin/appearance/templates`, Özel CSS/JS ise `/admin/themes/customize?tab=code` altındadır.
 */
export function StudioClient({ initialLibrary }: { initialLibrary: StudioLibraryItem[] }) {
  const [activeTab, setActiveTab] = useState<"ai" | "library">("ai");
  const [library, setLibrary] = useState(initialLibrary);
  const [isPending, startTransition] = useTransition();
  const [msg, setMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [aiMode, setAiMode] = useState<"section" | "page" | "theme">("section");
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiResult, setAiResult] = useState<DesignPreview | null>(null);

  const showMsg = (type: "success" | "error", text: string) => {
    setMsg({ type, text });
    setTimeout(() => setMsg(null), 5000);
  };

  const handleAiGenerate = () => {
    if (!aiPrompt.trim()) return;
    startTransition(async () => {
      const res = await generateDesignAction({ mode: aiMode, prompt: aiPrompt });
      if (res.ok) {
        setAiResult(res.design);
        showMsg("success", "Tasarım önizlemesi üretildi.");
      } else {
        showMsg("error", res.error || "AI tasarımı üretilemedi.");
      }
    });
  };

  const handleSaveAiDesign = () => {
    if (!aiResult) return;
    startTransition(async () => {
      const res = await saveDesignAction({
        design: aiResult,
        name: aiResult.name,
        prompt: aiPrompt,
        source: "ai",
      });
      if (res.ok) {
        setLibrary((prev) => [
          {
            id: res.id,
            name: aiResult.name,
            kind: aiResult.mode,
            category: aiResult.category || "AI Üretimi",
            description: aiResult.description,
            source: "ai",
            blocksCount: aiResult.blocks?.length ?? 0,
            createdAt: new Date().toISOString(),
          },
          ...prev,
        ]);
        setAiResult(null);
        setAiPrompt("");
        setActiveTab("library");
        showMsg("success", "Tasarım kütüphaneye kaydedildi.");
      } else {
        showMsg("error", res.error);
      }
    });
  };

  return (
    <div className="space-y-4">
      <AdminPageHeader
        title="Kütüphane & AI Tasarım"
        description="Doğal dille 0-KB RSC uyumlu bölüm, sayfa taslağı veya tema jetonu üretin ve kayıtlı tasarımlarınızı yönetin."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href="/admin/appearance/templates"
              className="inline-flex h-8 items-center gap-1.5 rounded-md border border-[#E6E7EA] bg-white px-2.5 text-[12px] font-medium text-[#14151A] hover:bg-[#F4F5F7] dark:border-[#23262E] dark:bg-[#15171C] dark:text-[#F3F4F6]"
            >
              <LayoutTemplate className="h-3.5 w-3.5" /> Şablonlar &amp; Modeller
            </Link>
            <Link
              href="/admin/themes/customize?tab=code"
              className="inline-flex h-8 items-center gap-1.5 rounded-md border border-[#E6E7EA] bg-white px-2.5 text-[12px] font-medium text-[#14151A] hover:bg-[#F4F5F7] dark:border-[#23262E] dark:bg-[#15171C] dark:text-[#F3F4F6]"
            >
              <Code2 className="h-3.5 w-3.5" /> Özel CSS / Kod
            </Link>
            <div className="inline-flex rounded-lg border border-[#E6E7EA] bg-[#F4F5F7] p-0.5 dark:border-[#23262E] dark:bg-[#1C1E24]">
              <button
                type="button"
                onClick={() => setActiveTab("ai")}
                className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[12px] font-medium transition ${activeTab === "ai"
                  ? "bg-white text-[#14151A] shadow-2xs dark:bg-[#2A2D35] dark:text-[#F3F4F6]"
                  : "text-[#5C5F66] hover:text-[#14151A] dark:text-[#9CA3AF]"
                  }`}
              >
                <Wand2 className="h-3.5 w-3.5" /> AI Üretici
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("library")}
                className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[12px] font-medium transition ${activeTab === "library"
                  ? "bg-white text-[#14151A] shadow-2xs dark:bg-[#2A2D35] dark:text-[#F3F4F6]"
                  : "text-[#5C5F66] hover:text-[#14151A] dark:text-[#9CA3AF]"
                  }`}
              >
                <Layers className="h-3.5 w-3.5" /> Kütüphane ({library.length})
              </button>
            </div>
          </div>
        }
      />

      {msg ? (
        <div
          role="status"
          className={`rounded-lg border px-3.5 py-2 text-[12px] ${msg.type === "success"
            ? "border-emerald-300 bg-emerald-50 text-emerald-900 dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-200"
            : "border-red-300 bg-red-50 text-red-900 dark:border-red-800 dark:bg-red-950/30 dark:text-red-200"
            }`}
        >
          {msg.text}
        </div>
      ) : null}

      {activeTab === "ai" ? (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <section className="space-y-4 rounded-lg border border-[#E6E7EA] bg-white p-5 dark:border-[#23262E] dark:bg-[#15171C]">
            <div>
              <h2 className="text-[14px] font-semibold">Yapay Zeka ile Tasarım Üret</h2>
              <p className="mt-0.5 text-[12px] text-[#5F6570] dark:text-[#8C9099]">
                İhtiyacınızı yazın; model 0-KB RSC blok kataloğuna uygun ve doğrulanmış çıktı üretir.
              </p>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {(
                [
                  { id: "section", label: "Bölüm / Blok" },
                  { id: "page", label: "Tam Sayfa" },
                  { id: "theme", label: "Tema Jetonu" },
                ] as const
              ).map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setAiMode(m.id)}
                  className={`rounded-md border px-3 py-2 text-[12px] font-medium transition ${aiMode === m.id
                    ? "border-[#266DF0] bg-[#266DF0]/10 text-[#1D5ED8] dark:text-[#7AA7FF]"
                    : "border-[#E6E7EA] text-[#5C5F66] hover:bg-[#F4F5F7] dark:border-[#23262E] dark:text-[#9CA3AF] dark:hover:bg-[#1C1E24]"
                    }`}
                >
                  {m.label}
                </button>
              ))}
            </div>

            <div className="space-y-1.5">
              <label className="text-[12px] font-medium">Tasarım Talimatı</label>
              <textarea
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                rows={5}
                placeholder="Örn: ERP yazılımı için güven veren, 3 sütunlu özellik kartları ve Demo İste çağrısı içeren vitrin bölümü."
                className="w-full rounded-md border border-[#E6E7EA] bg-[#FBFBFB] p-3 text-[12px] outline-none focus:border-[#266DF0] dark:border-[#23262E] dark:bg-[#121317]"
              />
            </div>

            <button
              type="button"
              disabled={isPending || !aiPrompt.trim()}
              onClick={handleAiGenerate}
              className="inline-flex h-9 w-full items-center justify-center gap-2 rounded-md bg-[#266DF0] px-4 text-[12px] font-semibold text-white hover:bg-[#1D5ED8] disabled:opacity-50"
            >
              <Sparkles className="h-3.5 w-3.5" />
              <span>{isPending ? "Üretiliyor..." : "Tasarımı Üret"}</span>
            </button>
          </section>

          <section className="space-y-4 rounded-lg border border-[#E6E7EA] bg-white p-5 dark:border-[#23262E] dark:bg-[#15171C]">
            <h2 className="text-[14px] font-semibold">Önizleme &amp; Kayıt</h2>
            {aiResult ? (
              <div className="space-y-4">
                <div className="space-y-2 rounded-md border border-[#E6E7EA] bg-[#FBFBFB] p-4 dark:border-[#23262E] dark:bg-[#121317]">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[13px] font-semibold">{aiResult.name}</span>
                    <span className="rounded bg-[#266DF0]/10 px-2 py-0.5 text-[11px] font-semibold text-[#1D5ED8] dark:text-[#7AA7FF]">
                      Skor: {aiResult.score}/100
                    </span>
                  </div>
                  <p className="text-[12px] text-[#5F6570] dark:text-[#8C9099]">
                    {aiResult.description}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleSaveAiDesign}
                    disabled={isPending}
                    className="inline-flex h-8 flex-1 items-center justify-center gap-1.5 rounded-md bg-emerald-600 px-3 text-[12px] font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" /> Kütüphaneye Kaydet
                  </button>
                  <button
                    type="button"
                    onClick={() => setAiResult(null)}
                    className="inline-flex h-8 items-center rounded-md border border-[#E6E7EA] px-3 text-[12px] font-medium hover:bg-[#F4F5F7] dark:border-[#23262E] dark:hover:bg-[#1C1E24]"
                  >
                    İptal
                  </button>
                </div>
              </div>
            ) : (
              <div className="py-16 text-center text-[#5F6570] dark:text-[#8C9099]">
                <Wand2 className="mx-auto h-7 w-7 opacity-35" />
                <p className="mt-2 text-[12px]">
                  Solda talimat girip üretim yaptığınızda doğrulanmış önizleme burada görünür.
                </p>
              </div>
            )}
          </section>
        </div>
      ) : library.length === 0 ? (
        <div className="rounded-lg border border-[#E6E7EA] bg-white py-14 text-center text-[#5F6570] dark:border-[#23262E] dark:bg-[#15171C] dark:text-[#8C9099]">
          <Layers className="mx-auto h-7 w-7 opacity-35" />
          <p className="mt-2 text-[13px] font-medium text-[#14151A] dark:text-[#F3F4F6]">
            Kayıtlı tasarım yok
          </p>
          <p className="mt-1 text-[12px]">
            AI Üretici sekmesinden yeni bölüm veya sayfa taslağı oluşturup kütüphaneye kaydedebilirsiniz.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
          {library.map((item) => (
            <article
              key={item.id}
              className="space-y-2 rounded-lg border border-[#E6E7EA] bg-white p-4 dark:border-[#23262E] dark:bg-[#15171C]"
            >
              <div className="flex items-center justify-between text-[11px] text-[#5F6570] dark:text-[#8C9099]">
                <span className="rounded bg-[#F4F5F7] px-2 py-0.5 font-medium dark:bg-[#1C1E24]">
                  {item.category}
                </span>
                <span>{item.source === "ai" ? "AI Üretimi" : "Manuel"}</span>
              </div>
              <h3 className="line-clamp-1 text-[13px] font-semibold">{item.name}</h3>
              <p className="line-clamp-2 text-[12px] text-[#5F6570] dark:text-[#8C9099]">
                {item.description}
              </p>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

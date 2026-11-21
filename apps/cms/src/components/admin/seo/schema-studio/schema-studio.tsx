"use client";

import React, { useMemo, useState, useTransition } from "react";
import {
  matchesSchemaPlacement,
  type SchemaMatchContext,
  type SchemaPlacement,
} from "@nexpress/core";
import { Copy, Plus, Save, Sparkles, Trash2 } from "lucide-react";
import { saveSeoEngineSettingsAction } from "@/app/admin/actions";
import { SchemaLivePreview } from "./schema-live-preview";
import { SchemaRuleEditor, type SchemaTargetOption } from "./schema-rule-editor";

export interface SchemaStudioContentSummary extends SchemaMatchContext {
  contentId: string;
  title: string;
  slug: string;
}

interface SchemaStudioProps {
  initial: SchemaPlacement[];
  inventory: Array<{ schemaType: string; count: number }>;
  contents: SchemaStudioContentSummary[];
  categories: SchemaTargetOption[];
  tags: SchemaTargetOption[];
  contentTypes: SchemaTargetOption[];
}

const PRESETS: Array<{ label: string; create: () => SchemaPlacement }> = [
  {
    label: "Blog + AI Speakable",
    create: () => ({
      id: `sch_${Date.now().toString(36)}`,
      name: "Blog Yazıları (BlogPosting + Speakable)",
      schemaType: "BlogPosting",
      scope: "post",
      category: "",
      mode: "primary",
      priority: 10,
      speakable: true,
      properties: { articleSection: "%category%", keywords: "%keywords%" },
      enabled: true,
    }),
  },
  {
    label: "Hizmet Sayfaları (Service)",
    create: () => ({
      id: `sch_${Date.now().toString(36)}`,
      name: "Hizmet Şeması",
      schemaType: "Service",
      scope: "page",
      category: "",
      mode: "additional",
      priority: 10,
      properties: { name: "%title%", description: "%tldr%", areaServed: "Türkiye" },
      enabled: true,
    }),
  },
  {
    label: "Yazılım / SaaS",
    create: () => ({
      id: `sch_${Date.now().toString(36)}`,
      name: "Yazılım Uygulaması Şeması",
      schemaType: "SoftwareApplication",
      scope: "category",
      category: "",
      categories: [],
      mode: "primary",
      priority: 5,
      speakable: true,
      properties: {
        name: "%title%",
        applicationCategory: "BusinessApplication",
        operatingSystem: "Windows, Web",
        description: "%tldr%",
      },
      enabled: true,
    }),
  },
  {
    label: "Yerel İşletme (@graph)",
    create: () => ({
      id: `sch_${Date.now().toString(36)}`,
      name: "Yerel İşletme Ek Düğümü",
      schemaType: "LocalBusiness",
      scope: "all",
      category: "",
      mode: "additional",
      priority: 20,
      properties: { name: "%site%", areaServed: "İzmir, Türkiye" },
      enabled: true,
    }),
  },
];

export function SchemaStudio({
  initial,
  inventory,
  contents,
  categories,
  tags,
  contentTypes,
}: SchemaStudioProps) {
  const [rules, setRules] = useState<SchemaPlacement[]>(initial);
  const [selectedId, setSelectedId] = useState<string | null>(initial[0]?.id ?? null);
  const [notice, setNotice] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, start] = useTransition();

  const contentOptions: SchemaTargetOption[] = useMemo(
    () => contents.map((c) => ({ id: c.contentId, label: c.title, sub: `/${c.slug}` })),
    [contents]
  );

  const affectedMap = useMemo(() => {
    const map = new Map<string, number>();
    for (const r of rules) {
      map.set(r.id, contents.filter((c) => matchesSchemaPlacement(r, c)).length);
    }
    return map;
  }, [rules, contents]);

  const selected = rules.find((r) => r.id === selectedId) ?? rules[0] ?? null;

  const addRule = (next: SchemaPlacement) => {
    setRules((prev) => [...prev, next]);
    setSelectedId(next.id);
    setNotice(null);
  };

  const duplicateRule = (r: SchemaPlacement) => {
    const copy: SchemaPlacement = {
      ...r,
      id: `sch_${Date.now().toString(36)}`,
      name: `${r.name} (Kopya)`,
    };
    addRule(copy);
  };

  const removeRule = (id: string) => {
    setRules((prev) => {
      const next = prev.filter((r) => r.id !== id);
      if (selectedId === id) setSelectedId(next[0]?.id ?? null);
      return next;
    });
  };

  const saveAll = () => {
    start(async () => {
      const res = await saveSeoEngineSettingsAction({ seo: { schemaPlacements: rules } });
      setNotice(
        res.ok
          ? { ok: true, text: `${rules.length} şema kuralı kaydedildi ve yayına alındı.` }
          : { ok: false, text: "Şema kuralları kaydedilemedi." }
      );
    });
  };

  return (
    <div className="space-y-4">
      {/* Üst Envanter & Kaydet Çubuğu */}
      <section className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-[#E6E7EA] bg-white p-3.5 dark:border-[#23262E] dark:bg-[#15171C]">
        <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
          <span className="font-semibold text-[#5F6570] dark:text-[#8C9099]">Sitedeki şemalar:</span>
          {inventory.map((item) => (
            <span
              key={item.schemaType}
              className="rounded border border-[#E6E7EA] bg-[#FBFBFB] px-2 py-0.5 font-mono dark:border-[#23262E] dark:bg-[#121317]"
            >
              {item.schemaType} · {item.count}
            </span>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {notice ? (
            <span
              role="status"
              className={`text-[12px] font-medium ${notice.ok ? "text-emerald-700 dark:text-emerald-400" : "text-rose-700 dark:text-rose-400"}`}
            >
              {notice.text}
            </span>
          ) : null}
          <button
            type="button"
            disabled={pending}
            onClick={saveAll}
            className="inline-flex h-8 items-center gap-1.5 rounded-md bg-[#266DF0] px-3.5 text-[12px] font-semibold text-white hover:bg-[#1D5ED8] disabled:opacity-50"
          >
            <Save className="h-3.5 w-3.5" />
            {pending ? "Kaydediliyor..." : "Kuralları Kaydet"}
          </button>
        </div>
      </section>

      {/* Ana 2 Sütunlu Şema Stüdyosu */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[310px_minmax(0,1fr)]">
        <aside className="space-y-3 rounded-lg border border-[#E6E7EA] bg-white p-3 dark:border-[#23262E] dark:bg-[#15171C]">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-[13px] font-semibold">Şema Kuralları ({rules.length})</h2>
            <button
              type="button"
              onClick={() =>
                addRule({
                  id: `sch_${Date.now().toString(36)}`,
                  name: "Yeni Şema Kuralı",
                  schemaType: "Service",
                  scope: "page",
                  category: "",
                  mode: "primary",
                  priority: 10,
                  enabled: true,
                })
              }
              className="inline-flex h-7 items-center gap-1 rounded-md bg-[#14151A] px-2.5 text-[11px] font-medium text-white dark:bg-[#F3F4F6] dark:text-[#14151A]"
            >
              <Plus className="h-3 w-3" /> Yeni Kural
            </button>
          </div>

          <div className="flex flex-wrap gap-1">
            {PRESETS.map((p) => (
              <button
                key={p.label}
                type="button"
                onClick={() => addRule(p.create())}
                className="inline-flex items-center gap-1 rounded-full border border-[#E6E7EA] bg-[#FBFBFB] px-2 py-0.5 text-[10px] font-medium hover:border-[#266DF0] dark:border-[#23262E] dark:bg-[#121317]"
              >
                <Sparkles className="h-2.5 w-2.5 text-[#266DF0]" /> {p.label}
              </button>
            ))}
          </div>

          {rules.length === 0 ? (
            <p className="py-8 text-center text-[12px] text-[#5F6570] dark:text-[#8C9099]">
              Henüz şema kuralı yok. Yukarıdan hazır bir şablonla başlayabilirsiniz.
            </p>
          ) : (
            <ul className="space-y-1.5">
              {rules.map((r) => {
                const isSel = selected?.id === r.id;
                const hits = affectedMap.get(r.id) ?? 0;
                return (
                  <li
                    key={r.id}
                    className={`rounded-md border p-2.5 transition ${
                      isSel
                        ? "border-[#266DF0] bg-[#266DF0]/5"
                        : "border-[#E6E7EA] hover:bg-[#F4F5F7] dark:border-[#23262E] dark:hover:bg-[#1C1E24]"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <button
                        type="button"
                        onClick={() => setSelectedId(r.id)}
                        className="min-w-0 flex-1 text-left"
                      >
                        <div className="flex items-center gap-1.5">
                          <span className={`h-2 w-2 shrink-0 rounded-full ${r.enabled ? "bg-emerald-500" : "bg-zinc-400"}`} />
                          <span className="truncate text-[12px] font-semibold">{r.name || "(Adsız kural)"}</span>
                        </div>
                        <div className="mt-1 flex flex-wrap items-center gap-1 text-[10px] text-[#5F6570] dark:text-[#8C9099]">
                          <span className="rounded bg-[#F4F5F7] px-1.5 py-0.2 font-mono dark:bg-[#1C1E24]">{r.schemaType}</span>
                          {r.mode === "additional" ? <span className="rounded bg-emerald-500/10 px-1.5 text-emerald-800 dark:text-emerald-300">+@graph</span> : null}
                          {r.speakable ? <span className="rounded bg-[#266DF0]/10 px-1.5 text-[#1D5ED8] dark:text-[#7AA7FF]">Speakable</span> : null}
                          <span>· {hits} içerik</span>
                        </div>
                      </button>
                      <div className="flex shrink-0 items-center gap-0.5">
                        <input
                          type="checkbox"
                          aria-label={`${r.name} kuralını aç/kapat`}
                          checked={r.enabled}
                          onChange={(e) =>
                            setRules((prev) =>
                              prev.map((item) => (item.id === r.id ? { ...item, enabled: e.target.checked } : item))
                            )
                          }
                          className="h-3.5 w-3.5"
                        />
                        <button
                          type="button"
                          aria-label={`${r.name} çoğalt`}
                          onClick={() => duplicateRule(r)}
                          className="inline-flex h-6 w-6 items-center justify-center rounded hover:bg-black/5 dark:hover:bg-white/10"
                        >
                          <Copy className="h-3 w-3" />
                        </button>
                        <button
                          type="button"
                          aria-label={`${r.name} sil`}
                          onClick={() => removeRule(r.id)}
                          className="inline-flex h-6 w-6 items-center justify-center rounded text-rose-700 hover:bg-rose-50 dark:text-rose-400"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </aside>

        <div className="min-w-0 space-y-4">
          {selected ? (
            <SchemaRuleEditor
              rule={selected}
              affectedCount={affectedMap.get(selected.id) ?? 0}
              categories={categories}
              tags={tags}
              contents={contentOptions}
              contentTypes={contentTypes}
              onChange={(updated) =>
                setRules((prev) => prev.map((item) => (item.id === updated.id ? updated : item)))
              }
            />
          ) : (
            <div className="rounded-lg border border-[#E6E7EA] bg-white px-6 py-12 text-center text-[13px] text-[#5F6570] dark:border-[#23262E] dark:bg-[#15171C] dark:text-[#8C9099]">
              Soldan bir şema kuralı seçin veya “Yeni Kural” / hazır şablonlardan birine tıklayın.
            </div>
          )}

          <SchemaLivePreview contents={contentOptions} draftRules={rules} />
        </div>
      </div>
    </div>
  );
}

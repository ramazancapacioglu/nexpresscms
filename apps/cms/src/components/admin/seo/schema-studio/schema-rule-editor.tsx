"use client";

import React, { useMemo, useState } from "react";
import {
  SCHEMA_DYNAMIC_TOKENS,
  SCHEMA_TYPE_CATALOG,
  type SchemaEntityRef,
  type SchemaPlacement,
  type SchemaPlacementScope,
} from "@nexpress/core";
import { Network, Plus, Sparkles, Trash2 } from "lucide-react";

export interface SchemaTargetOption {
  id: string;
  label: string;
  sub?: string;
}

interface Props {
  rule: SchemaPlacement;
  affectedCount: number;
  categories: SchemaTargetOption[];
  tags: SchemaTargetOption[];
  contents: SchemaTargetOption[];
  contentTypes: SchemaTargetOption[];
  onChange: (next: SchemaPlacement) => void;
}

const SCOPE_OPTIONS: Array<{ id: SchemaPlacementScope; label: string }> = [
  { id: "all", label: "Tüm site" },
  { id: "page", label: "Tüm sayfalar" },
  { id: "post", label: "Tüm blog yazıları" },
  { id: "category", label: "Belirli kategoriler" },
  { id: "tag", label: "Belirli etiketler" },
  { id: "content", label: "Belirli sayfa / yazılar" },
  { id: "custom_type", label: "İçerik türleri" },
];

const ENTITY_TYPES = ["Thing", "SoftwareApplication", "Service", "Product", "Organization", "Place", "Person", "DefinedTerm"];

const inputCls =
  "h-8 w-full rounded-md border border-[#E6E7EA] bg-[#FBFBFB] px-2.5 text-[12px] outline-none focus:border-[#266DF0] dark:border-[#23262E] dark:bg-[#121317]";

function MultiPicker({
  label,
  options,
  selected,
  onToggle,
}: {
  label: string;
  options: SchemaTargetOption[];
  selected: string[];
  onToggle: (id: string) => void;
}) {
  const [q, setQ] = useState("");
  const filtered = useMemo(() => {
    const s = q.trim().toLocaleLowerCase("tr");
    return s
      ? options.filter((o) => `${o.label} ${o.sub ?? ""}`.toLocaleLowerCase("tr").includes(s))
      : options;
  }, [options, q]);

  return (
    <div className="space-y-1.5 rounded-md border border-[#E6E7EA] p-2.5 dark:border-[#23262E]">
      <div className="flex items-center justify-between gap-2">
        <span className="text-[11px] font-semibold">{label} ({selected.length} seçili)</span>
        {options.length > 6 ? (
          <input
            aria-label={`${label} ara`}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Ara..."
            className="h-6 w-36 rounded border border-[#E6E7EA] bg-white px-2 text-[11px] dark:border-[#23262E] dark:bg-[#15171C]"
          />
        ) : null}
      </div>
      {filtered.length === 0 ? (
        <p className="text-[11px] text-[#5F6570] dark:text-[#8C9099]">Eşleşen kayıt yok.</p>
      ) : (
        <div className="max-h-36 space-y-1 overflow-y-auto pr-1">
          {filtered.slice(0, 60).map((opt) => {
            const on = selected.includes(opt.id);
            return (
              <label
                key={opt.id}
                className={`flex cursor-pointer items-center justify-between gap-2 rounded px-2 py-1 text-[12px] ${
                  on ? "bg-[#266DF0]/10 font-medium text-[#1D5ED8] dark:text-[#7AA7FF]" : "hover:bg-[#F4F5F7] dark:hover:bg-[#1C1E24]"
                }`}
              >
                <span className="flex min-w-0 items-center gap-2">
                  <input type="checkbox" checked={on} onChange={() => onToggle(opt.id)} className="h-3.5 w-3.5 shrink-0" />
                  <span className="truncate">{opt.label}</span>
                </span>
                {opt.sub ? <span className="shrink-0 font-mono text-[10px] opacity-70">{opt.sub}</span> : null}
              </label>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function SchemaRuleEditor({
  rule,
  affectedCount,
  categories,
  tags,
  contents,
  contentTypes,
  onChange,
}: Props) {
  const [tab, setTab] = useState<"target" | "fields" | "entities">("target");
  const [customKey, setCustomKey] = useState("");
  const [customVal, setCustomVal] = useState("");

  const spec = SCHEMA_TYPE_CATALOG.find((t) => t.id === rule.schemaType) ?? SCHEMA_TYPE_CATALOG[0]!;
  const groups = ["İçerik", "İşletme & Hizmet", "Ürün & Yazılım", "Rehber & Etkileşim"] as const;

  const toggleIn = (list: string[] | undefined, value: string): string[] => {
    const cur = list ?? [];
    return cur.includes(value) ? cur.filter((x) => x !== value) : [...cur, value];
  };

  const setProp = (key: string, value: string) => {
    const next = { ...(rule.properties ?? {}) };
    if (value.trim()) next[key] = value;
    else delete next[key];
    onChange({ ...rule, properties: Object.keys(next).length ? next : undefined });
  };

  const handleTypeChange = (nextType: string) => {
    const nextSpec = SCHEMA_TYPE_CATALOG.find((t) => t.id === nextType);
    const props = { ...(rule.properties ?? {}) };
    if (nextSpec) {
      for (const f of nextSpec.fields) {
        if (f.defaultValue && !props[f.key]) props[f.key] = f.defaultValue;
      }
    }
    onChange({ ...rule, schemaType: nextType, properties: Object.keys(props).length ? props : undefined });
  };

  const entities = rule.entities ?? [];
  const updateEntity = (idx: number, patch: Partial<SchemaEntityRef>) => {
    onChange({ ...rule, entities: entities.map((e, i) => (i === idx ? { ...e, ...patch } : e)) });
  };

  const knownKeys = new Set(spec.fields.map((f) => f.key));
  const extraProps = Object.entries(rule.properties ?? {}).filter(([k]) => !knownKeys.has(k));

  return (
    <div className="space-y-4 rounded-lg border border-[#E6E7EA] bg-white p-4 dark:border-[#23262E] dark:bg-[#15171C]">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#E6E7EA] pb-3 dark:border-[#23262E]">
        <div className="flex items-center gap-2">
          <h2 className="text-[14px] font-semibold">{rule.name || "Yeni Şema Kuralı"}</h2>
          <span className="rounded bg-[#266DF0]/10 px-2 py-0.5 text-[11px] font-medium text-[#1D5ED8] dark:text-[#7AA7FF]">
            {affectedCount} içeriğe uygulanır
          </span>
        </div>
        <div className="inline-flex rounded-lg border border-[#E6E7EA] bg-[#F4F5F7] p-0.5 text-[12px] font-medium dark:border-[#23262E] dark:bg-[#1C1E24]">
          {(
            [
              ["target", "1. Tür & Hedefleme"],
              ["fields", "2. Alanlar & Değişkenler"],
              ["entities", `3. Entity Graph (${entities.length})`],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => setTab(id)}
              className={`rounded-md px-2.5 py-1 transition ${
                tab === id
                  ? "bg-white text-[#14151A] shadow-2xs dark:bg-[#2A2D35] dark:text-[#F3F4F6]"
                  : "text-[#5C5F66] hover:text-[#14151A] dark:text-[#9CA3AF]"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {tab === "target" ? (
        <div className="space-y-4">
          <div className="grid gap-3 md:grid-cols-2">
            <label className="space-y-1 text-[12px]">
              <span className="font-medium">Kural Adı</span>
              <input
                value={rule.name}
                onChange={(e) => onChange({ ...rule, name: e.target.value })}
                placeholder="Örn: ERP Yazılım Sayfaları"
                className={inputCls}
              />
            </label>
            <label className="space-y-1 text-[12px]">
              <span className="font-medium">Schema.org Türü</span>
              <select value={rule.schemaType} onChange={(e) => handleTypeChange(e.target.value)} className={inputCls}>
                {groups.map((grp) => (
                  <optgroup key={grp} label={grp}>
                    {SCHEMA_TYPE_CATALOG.filter((t) => t.group === grp).map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.label}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
              <span className="block text-[11px] text-[#5F6570] dark:text-[#8C9099]">{spec.description}</span>
            </label>
          </div>

          <div className="grid gap-3 md:grid-cols-3">
            <label className="space-y-1 text-[12px]">
              <span className="font-medium">Uygulama Modu</span>
              <select
                value={rule.mode ?? "primary"}
                onChange={(e) => onChange({ ...rule, mode: e.target.value as "primary" | "additional" })}
                className={inputCls}
              >
                <option value="primary">Ana Şema Türü (Varsayılanı değiştirir)</option>
                <option value="additional">Ek @graph Düğümü (Mevcut şemaya ekler)</option>
              </select>
            </label>
            <label className="space-y-1 text-[12px]">
              <span className="font-medium">Hedef Kapsam (Dahil Et)</span>
              <select
                value={rule.scope}
                onChange={(e) => onChange({ ...rule, scope: e.target.value as SchemaPlacementScope })}
                className={inputCls}
              >
                {SCOPE_OPTIONS.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="space-y-1 text-[12px]">
              <span className="font-medium">Öncelik (0 = en yüksek)</span>
              <input
                type="number"
                min={0}
                max={999}
                value={rule.priority ?? 10}
                onChange={(e) => onChange({ ...rule, priority: Number(e.target.value) || 0 })}
                className={inputCls}
              />
            </label>
          </div>

          {rule.scope === "category" ? (
            <MultiPicker
              label="Dahil Edilecek Kategoriler"
              options={categories}
              selected={rule.categories?.length ? rule.categories : rule.category ? [rule.category] : []}
              onToggle={(slug) => {
                const cur = rule.categories?.length ? rule.categories : rule.category ? [rule.category] : [];
                const next = toggleIn(cur, slug);
                onChange({ ...rule, categories: next, category: next[0] ?? "" });
              }}
            />
          ) : null}

          {rule.scope === "tag" ? (
            <MultiPicker
              label="Dahil Edilecek Etiketler"
              options={tags}
              selected={rule.tags ?? []}
              onToggle={(slug) => onChange({ ...rule, tags: toggleIn(rule.tags, slug) })}
            />
          ) : null}

          {rule.scope === "content" ? (
            <MultiPicker
              label="Dahil Edilecek Sayfa ve Yazılar"
              options={contents}
              selected={rule.contentIds ?? []}
              onToggle={(id) => onChange({ ...rule, contentIds: toggleIn(rule.contentIds, id) })}
            />
          ) : null}

          {rule.scope === "custom_type" ? (
            <MultiPicker
              label="Dahil Edilecek İçerik Türleri"
              options={contentTypes}
              selected={rule.contentTypes ?? []}
              onToggle={(id) => onChange({ ...rule, contentTypes: toggleIn(rule.contentTypes, id) })}
            />
          ) : null}

          <details className="rounded-md border border-[#E6E7EA] p-3 dark:border-[#23262E]">
            <summary className="cursor-pointer text-[12px] font-medium">
              Hariç Tutma Kuralları ({(rule.excludeCategories?.length ?? 0) + (rule.excludeContentIds?.length ?? 0)} kural)
            </summary>
            <div className="mt-3 grid gap-3 md:grid-cols-2">
              <MultiPicker
                label="Hariç Tutulan Kategoriler"
                options={categories}
                selected={rule.excludeCategories ?? []}
                onToggle={(slug) => onChange({ ...rule, excludeCategories: toggleIn(rule.excludeCategories, slug) })}
              />
              <MultiPicker
                label="Hariç Tutulan Sayfa / Yazılar"
                options={contents}
                selected={rule.excludeContentIds ?? []}
                onToggle={(id) => onChange({ ...rule, excludeContentIds: toggleIn(rule.excludeContentIds, id) })}
              />
            </div>
          </details>
        </div>
      ) : null}

      {tab === "fields" ? (
        <div className="space-y-4">
          <label className="flex items-start gap-2.5 rounded-md border border-[#E6E7EA] bg-[#FBFBFB] p-3 text-[12px] dark:border-[#23262E] dark:bg-[#121317]">
            <input
              type="checkbox"
              checked={rule.speakable === true}
              onChange={(e) => onChange({ ...rule, speakable: e.target.checked || undefined })}
              className="mt-0.5 h-4 w-4"
            />
            <span>
              <strong className="inline-flex items-center gap-1">
                <Sparkles className="h-3.5 w-3.5 text-[#266DF0]" /> AI Alıntı &amp; Sesli Arama (`SpeakableSpecification`)
              </strong>
              <span className="mt-0.5 block text-[11px] text-[#5F6570] dark:text-[#8C9099]">
                Sayfanın ana başlığını (`h1`) ve Answer-First özetini (`.nx-tldr`) Google ve LLM motorlarına doğrudan alıntılanabilir alan olarak bildirir.
              </span>
            </span>
          </label>

          <div className="flex flex-wrap items-center gap-1 text-[11px]">
            <span className="font-medium text-[#5F6570] dark:text-[#8C9099]">Dinamik değişkenler:</span>
            {SCHEMA_DYNAMIC_TOKENS.map((tk) => (
              <code
                key={tk.token}
                title={tk.label}
                className="rounded border border-[#E6E7EA] bg-[#F4F5F7] px-1.5 py-0.5 font-mono text-[10px] dark:border-[#23262E] dark:bg-[#1C1E24]"
              >
                {tk.token}
              </code>
            ))}
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            {spec.fields.map((f) => (
              <label key={f.key} className="space-y-1 text-[12px]">
                <span className="font-medium">
                  {f.label} <code className="text-[10px] text-[#5F6570]">({f.key})</code>
                </span>
                <input
                  value={rule.properties?.[f.key] ?? ""}
                  onChange={(e) => setProp(f.key, e.target.value)}
                  placeholder={f.placeholder}
                  className={inputCls}
                />
              </label>
            ))}
          </div>

          <div className="space-y-2 border-t border-[#E6E7EA] pt-3 dark:border-[#23262E]">
            <div className="text-[12px] font-medium">Özel Schema.org Alanları</div>
            {extraProps.map(([k, v]) => (
              <div key={k} className="grid grid-cols-[1fr_2fr_auto] gap-2">
                <input readOnly aria-label="Özellik adı" value={k} className={`${inputCls} font-mono`} />
                <input aria-label={`${k} değeri`} value={v} onChange={(e) => setProp(k, e.target.value)} className={inputCls} />
                <button
                  type="button"
                  aria-label={`${k} alanını sil`}
                  onClick={() => setProp(k, "")}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-[#E6E7EA] text-rose-700 hover:bg-rose-50 dark:border-[#23262E] dark:text-rose-400"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
            <div className="grid grid-cols-[1fr_2fr_auto] gap-2">
              <input
                aria-label="Yeni özellik adı"
                value={customKey}
                onChange={(e) => setCustomKey(e.target.value)}
                placeholder="Örn: award, knowsAbout"
                className={`${inputCls} font-mono`}
              />
              <input
                aria-label="Yeni özellik değeri"
                value={customVal}
                onChange={(e) => setCustomVal(e.target.value)}
                placeholder="Değer veya %title%"
                className={inputCls}
              />
              <button
                type="button"
                onClick={() => {
                  const k = customKey.trim();
                  if (!k || !customVal.trim()) return;
                  setProp(k, customVal.trim());
                  setCustomKey("");
                  setCustomVal("");
                }}
                className="inline-flex h-8 items-center gap-1 rounded-md border border-[#E6E7EA] px-2.5 text-[12px] font-medium hover:bg-[#F4F5F7] dark:border-[#23262E] dark:hover:bg-[#1C1E24]"
              >
                <Plus className="h-3.5 w-3.5" /> Ekle
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {tab === "entities" ? (
        <div className="space-y-3">
          <div className="flex items-start justify-between gap-3 rounded-md border border-[#E6E7EA] bg-[#FBFBFB] p-3 text-[12px] dark:border-[#23262E] dark:bg-[#121317]">
            <div>
              <div className="inline-flex items-center gap-1.5 font-semibold">
                <Network className="h-3.5 w-3.5 text-[#266DF0]" /> Entity Knowledge Graph (`about` / `mentions`)
              </div>
              <p className="mt-0.5 text-[11px] text-[#5F6570] dark:text-[#8C9099]">
                Sayfanın odaklandığı kavramları Wikipedia/Wikidata `sameAs` bağlantılarıyla tanımlayın. Google ve LLM’ler içeriğinizi doğrulanmış varlık grafiğine bağlar.
              </p>
            </div>
            <button
              type="button"
              onClick={() =>
                onChange({
                  ...rule,
                  entities: [...entities, { relation: "about", name: "", type: "Thing", sameAs: "" }],
                })
              }
              className="inline-flex h-8 shrink-0 items-center gap-1 rounded-md bg-[#266DF0] px-2.5 text-[12px] font-medium text-white hover:bg-[#1D5ED8]"
            >
              <Plus className="h-3.5 w-3.5" /> Varlık Ekle
            </button>
          </div>

          {entities.length === 0 ? (
            <p className="py-6 text-center text-[12px] text-[#5F6570] dark:text-[#8C9099]">
              Henüz varlık tanımlı değil. “Varlık Ekle” ile `about` veya `mentions` düğümü ekleyebilirsiniz.
            </p>
          ) : (
            <div className="space-y-2">
              {entities.map((ent, idx) => (
                <div
                  key={idx}
                  className="grid gap-2 rounded-md border border-[#E6E7EA] p-2.5 md:grid-cols-[110px_130px_1fr_1.4fr_auto] dark:border-[#23262E]"
                >
                  <select
                    aria-label="Varlık ilişkisi"
                    value={ent.relation}
                    onChange={(e) => updateEntity(idx, { relation: e.target.value as "about" | "mentions" })}
                    className={inputCls}
                  >
                    <option value="about">about (Ana Konu)</option>
                    <option value="mentions">mentions (Değinir)</option>
                  </select>
                  <select
                    aria-label="Varlık türü"
                    value={ent.type ?? "Thing"}
                    onChange={(e) => updateEntity(idx, { type: e.target.value })}
                    className={inputCls}
                  >
                    {ENTITY_TYPES.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                  <input
                    aria-label="Varlık adı"
                    value={ent.name}
                    onChange={(e) => updateEntity(idx, { name: e.target.value })}
                    placeholder="Örn: Kurumsal Kaynak Planlama"
                    className={inputCls}
                  />
                  <input
                    aria-label="Wikidata veya Wikipedia sameAs adresi"
                    value={ent.sameAs ?? ""}
                    onChange={(e) => updateEntity(idx, { sameAs: e.target.value })}
                    placeholder="https://www.wikidata.org/wiki/Q..."
                    className={`${inputCls} font-mono`}
                  />
                  <button
                    type="button"
                    aria-label="Varlığı sil"
                    onClick={() => onChange({ ...rule, entities: entities.filter((_, i) => i !== idx) })}
                    className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-[#E6E7EA] text-rose-700 hover:bg-rose-50 dark:border-[#23262E] dark:text-rose-400"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}

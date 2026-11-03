"use client";

import React, { useState, useTransition } from "react";
import Link from "next/link";
import {
  STARTER_TEMPLATES,
  TEMPLATE_KINDS,
  type TemplateBehavior,
  type TemplateConditions,
  type TemplateKind,
} from "@nexpress/core";
import {
  AlertTriangle,
  Check,
  Copy,
  Download,
  LayoutTemplate,
  PanelLeft,
  PanelRight,
  Pencil,
  Plus,
  SlidersHorizontal,
  Sparkles,
  Square,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { TemplateSettings } from "./template-settings";
import {
  createTemplateAction,
  deleteTemplateAction,
  duplicateTemplateAction,
  setDefaultTemplateAction,
} from "./actions";

export interface TemplateRow {
  id: string;
  name: string;
  kind: TemplateKind;
  isDefault: boolean;
  conditions: TemplateConditions;
  behavior: TemplateBehavior;
  blocks: number;
  errors: string[];
}

const panel =
  "rounded-xl border border-[#D5D8DE] bg-white shadow-2xs dark:border-[#2E333D] dark:bg-[#15171C]";

const KIND_GROUPS: Array<{ id: string; label: string; kinds: TemplateKind[] }> = [
  {
    id: "all",
    label: "Tüm Şablonlar (11 Tür)",
    kinds: ["post", "category", "tag", "page", "product", "shop", "product_category", "search", "header", "footer", "sidebar"],
  },
  {
    id: "editorial",
    label: "Blog, Kategori & Etiket",
    kinds: ["post", "category", "tag"],
  },
  {
    id: "pages",
    label: "Kurumsal Sayfa & Arama",
    kinds: ["page", "search"],
  },
  {
    id: "commerce",
    label: "Ürün, Mağaza & Ürün Kategorisi",
    kinds: ["product", "shop", "product_category"],
  },
  {
    id: "chrome",
    label: "Header, Footer & Sidebar",
    kinds: ["header", "footer", "sidebar"],
  },
];

export function TemplatesManager({
  rows: initial,
  kinds,
}: {
  rows: TemplateRow[];
  kinds: TemplateKind[];
}) {
  const [rows, setRows] = useState(initial);
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<{ kind: "ok" | "error"; text: string } | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);
  const [groupFilter, setGroupFilter] = useState<string>("all");

  // Yeni Şablon Oluşturucu Modal Durumu
  const [createModalKind, setCreateModalKind] = useState<TemplateKind | null>(null);
  const [customName, setCustomName] = useState("");
  const [creationMode, setCreationMode] = useState<"starter" | "skeleton">("starter");
  const [selectedStarterId, setSelectedStarterId] = useState<string>("");
  const [layoutMode, setLayoutMode] = useState<"full" | "right-sidebar" | "left-sidebar">("right-sidebar");
  const [makeDefaultOnCreate, setMakeDefaultOnCreate] = useState(true);

  const openCreateModal = (kind: TemplateKind) => {
    const firstStarter = STARTER_TEMPLATES.find((s) => s.kind === kind);
    setCreateModalKind(kind);
    setCustomName(`${TEMPLATE_KINDS[kind].label} — Özel Şablon`);
    setCreationMode(firstStarter ? "starter" : "skeleton");
    setSelectedStarterId(firstStarter?.id ?? "");
    setLayoutMode(
      kind === "header" || kind === "footer" || kind === "sidebar" ? "full" : "right-sidebar"
    );
    setMakeDefaultOnCreate(rows.filter((r) => r.kind === kind).length === 0);
  };

  const createQuickStarter = (starterId: string) =>
    start(async () => {
      const r = await createTemplateAction({ starterId });
      if (r.ok)
        window.location.href = `/admin/contents?id=${encodeURIComponent(r.id)}&type=template`;
      else setMsg({ kind: "error", text: r.error });
    });

  const handleModalCreate = (openEditor: boolean) => {
    if (!createModalKind) return;
    start(async () => {
      const r = await createTemplateAction({
        kind: createModalKind,
        starterId: creationMode === "starter" ? selectedStarterId : undefined,
        customName,
        layoutMode,
        makeDefault: makeDefaultOnCreate,
      });
      if (!r.ok) {
        setMsg({ kind: "error", text: r.error });
        return;
      }
      setCreateModalKind(null);
      if (openEditor) {
        window.location.href = `/admin/contents?id=${encodeURIComponent(r.id)}&type=template`;
      } else {
        setRows((cur) => [
          ...cur.map((x) =>
            makeDefaultOnCreate && x.kind === r.kind ? { ...x, isDefault: false } : x
          ),
          {
            id: r.id,
            name: r.name,
            kind: r.kind,
            isDefault: makeDefaultOnCreate,
            conditions: { include: [], exclude: [] },
            behavior: {},
            blocks: 1,
            errors: [],
          },
        ]);
        setMsg({
          kind: "ok",
          text: `"${r.name}" şablonu oluşturuldu. "Düzenle" butonuyla görsel stüdyoda bloklarını özelleştirebilirsiniz.`,
        });
      }
    });
  };

  const handleDuplicate = (id: string) =>
    start(async () => {
      const r = await duplicateTemplateAction({ id });
      if (!r.ok) return setMsg({ kind: "error", text: r.error });
      setRows((cur) => [
        ...cur,
        {
          id: r.id,
          name: r.name,
          kind: r.kind,
          isDefault: false,
          conditions: { include: [], exclude: [] },
          behavior: {},
          blocks: 2,
          errors: [],
        },
      ]);
      setMsg({ kind: "ok", text: `"${r.name}" kopyalandı.` });
    });

  const setDefault = (id: string, makeDefault: boolean, kind: TemplateKind) =>
    start(async () => {
      const r = await setDefaultTemplateAction({ id, makeDefault });
      if (!r.ok) return setMsg({ kind: "error", text: r.error });
      setRows((cur) =>
        cur.map((x) =>
          x.kind === kind ? { ...x, isDefault: x.id === id ? makeDefault : false } : x
        )
      );
      setMsg({
        kind: "ok",
        text: makeDefault
          ? "Varsayılan şablon güncellendi; ziyaretçi sayfaları bu şablonla çizilir."
          : "Varsayılan kaldırıldı; yerleşik görünüm kullanılacak.",
      });
    });

  const remove = (id: string, name: string) => {
    if (
      !window.confirm(
        `"${name}" şablonu silinsin mi? Bu şablonu seçmiş sayfalar varsayılan/yerleşik görünüme döner.`
      )
    )
      return;
    start(async () => {
      const r = await deleteTemplateAction({ id });
      if (r.ok) setRows((cur) => cur.filter((x) => x.id !== id));
      else setMsg({ kind: "error", text: r.error });
    });
  };

  const importFile = (file: File) =>
    start(async () => {
      const body = new FormData();
      body.set("file", file);
      const res = await fetch("/api/admin/templates/import", {
        method: "POST",
        body,
      }).catch(() => null);
      const json = (await res?.json().catch(() => null)) as {
        ok: boolean;
        created?: Array<{ name: string }>;
        warnings?: string[];
        errors?: string[];
      } | null;
      if (json?.ok) {
        setMsg({
          kind: "ok",
          text: `${json.created?.length ?? 0} şablon içe aktarıldı (taslak, varsayılan değil).${
            json.warnings?.length ? ` Uyarılar: ${json.warnings.join(" • ")}` : ""
          }`,
        });
        setTimeout(() => window.location.reload(), 1800);
      } else
        setMsg({
          kind: "error",
          text: (json?.errors ?? ["İçe aktarılamadı."]).join(" "),
        });
    });

  const activeGroup = KIND_GROUPS.find((g) => g.id === groupFilter) ?? KIND_GROUPS[0]!;
  const visibleKinds = kinds.filter((k) => activeGroup.kinds.includes(k));

  return (
    <div className="space-y-4">
      {/* Üst Araç Çubuğu + Kategori Filtreleri */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#D5D8DE] bg-white p-3.5 dark:border-[#2E333D] dark:bg-[#15171C]">
        <div className="flex flex-wrap items-center gap-1.5">
          {KIND_GROUPS.map((grp) => (
            <button
              key={grp.id}
              type="button"
              onClick={() => setGroupFilter(grp.id)}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                groupFilter === grp.id
                  ? "bg-blue-600 text-white"
                  : "bg-[#F4F5F6] text-[#5F6570] hover:text-foreground dark:bg-[#23262E] dark:text-[#8C9099]"
              }`}
            >
              {grp.label}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => openCreateModal("post")}
            className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-blue-600 px-3.5 text-[12px] font-bold text-white shadow-xs hover:bg-blue-700"
          >
            <Plus className="h-3.5 w-3.5" /> Yeni Şablon Oluştur
          </button>
          <a
            href="/api/admin/templates/export?all=1"
            download
            className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-[#D5D8DE] px-3 text-[12px] font-medium dark:border-[#2E333D]"
          >
            <Download className="h-3.5 w-3.5" /> Tümünü dışa aktar
          </a>
          <label className="inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-lg border border-[#D5D8DE] px-3 text-[12px] font-medium focus-within:ring-2 focus-within:ring-[#266DF0] dark:border-[#2E333D]">
            <Upload className="h-3.5 w-3.5" /> Paketi içe aktar
            <input
              type="file"
              accept=".json,application/json"
              className="sr-only"
              disabled={pending}
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) importFile(f);
                e.target.value = "";
              }}
            />
          </label>
        </div>
      </div>

      {msg && (
        <p
          role={msg.kind === "error" ? "alert" : "status"}
          className={`rounded-lg border px-3.5 py-2.5 text-[13px] ${
            msg.kind === "error"
              ? "border-red-500/30 bg-red-500/10 text-red-700"
              : "border-emerald-500/30 bg-emerald-500/10 text-emerald-800 dark:text-emerald-300"
          }`}
        >
          {msg.text}
        </p>
      )}

      {visibleKinds.map((kind) => {
        const info = TEMPLATE_KINDS[kind];
        const list = rows.filter((r) => r.kind === kind);
        const starters = STARTER_TEMPLATES.filter((s) => s.kind === kind);
        return (
          <section key={kind} aria-labelledby={`tk-${kind}`} className={panel}>
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#D5D8DE] px-4 py-3 dark:border-[#2E333D]">
              <div>
                <div className="flex items-center gap-2">
                  <h2 id={`tk-${kind}`} className="text-[14px] font-bold">
                    {info.label}
                  </h2>
                  <span className="rounded bg-[#F1F3F6] px-2 py-0.5 text-[10px] font-semibold text-[#5F6570] dark:bg-[#23262E] dark:text-[#8C9099]">
                    {list.length} şablon
                  </span>
                </div>
                <p className="text-[12px] text-[#5F6570] dark:text-[#8C9099]">
                  {info.description}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => openCreateModal(kind)}
                  className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-blue-600 px-3 text-[12px] font-semibold text-white hover:bg-blue-700"
                >
                  <Plus className="h-3.5 w-3.5" /> Yeni {info.label} Şablonu
                </button>
                <label className="flex items-center gap-2 text-[12px]">
                  <span className="sr-only">{info.label} için hazır şablon</span>
                  <select
                    disabled={pending}
                    aria-label={`${info.label} hazır şablonu`}
                    defaultValue=""
                    onChange={(e) => {
                      if (e.target.value) createQuickStarter(e.target.value);
                      e.target.value = "";
                    }}
                    className="h-8 rounded-lg border border-[#D5D8DE] bg-transparent px-2 text-xs dark:border-[#2E333D]"
                  >
                    <option value="">+ Hazır şablondan hızlı oluştur…</option>
                    {starters.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} — {s.description}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
            </div>

            {list.length === 0 ? (
              <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-5 text-[13px] text-[#5F6570] dark:text-[#8C9099]">
                <span>
                  Henüz özel şablon yok: yerleşik görünüm kullanılıyor. Sağ veya sol sidebarlı özel şablon oluşturabilirsiniz.
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {starters.slice(0, 3).map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      disabled={pending}
                      onClick={() => createQuickStarter(s.id)}
                      className="inline-flex items-center gap-1 rounded-md border border-[#D5D8DE] bg-[#F8FAFC] px-2.5 py-1 text-[11px] font-semibold text-foreground hover:border-blue-500 hover:text-blue-600 dark:border-[#2E333D] dark:bg-[#111318]"
                    >
                      <Sparkles className="h-3 w-3 text-blue-600" /> {s.name}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <ul className="divide-y divide-[#E6E8EC] dark:divide-[#262A33]">
                {list.map((r) => (
                  <li key={r.id}>
                    <div className="flex flex-wrap items-center gap-2.5 px-4 py-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="truncate text-[13px] font-bold">{r.name}</span>
                          {r.isDefault && (
                            <span className="inline-flex items-center gap-1 rounded bg-emerald-600 px-1.5 py-px text-[10px] font-bold text-white">
                              <Check className="h-3 w-3" /> VARSAYILAN
                            </span>
                          )}
                          {r.conditions.include.length > 0 && (
                            <span className="rounded bg-blue-700 px-1.5 py-px text-[10px] font-bold text-white">
                              {r.conditions.include.length} KOŞUL
                            </span>
                          )}
                        </div>
                        <div className="text-[12px] text-[#5F6570] dark:text-[#8C9099]">
                          {r.blocks} kök blok • Görsel Stüdyoda düzenlenebilir
                        </div>
                        {r.errors.map((e) => (
                          <div
                            key={e}
                            className="mt-1 flex items-center gap-1 text-[12px] text-red-600"
                          >
                            <AlertTriangle className="h-3 w-3" /> {e}
                          </div>
                        ))}
                      </div>
                      <Link
                        href={`/admin/contents?id=${encodeURIComponent(r.id)}&type=template`}
                        className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-blue-600 px-3 text-[12px] font-bold text-white hover:bg-blue-700"
                      >
                        <Pencil className="h-3.5 w-3.5" /> Stüdyoda Düzenle
                      </Link>
                      <button
                        type="button"
                        disabled={pending}
                        onClick={() => handleDuplicate(r.id)}
                        className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-[#D5D8DE] px-2.5 text-[12px] font-medium hover:border-blue-500 dark:border-[#2E333D]"
                      >
                        <Copy className="h-3.5 w-3.5" /> Çoğalt
                      </button>
                      <button
                        type="button"
                        disabled={pending}
                        onClick={() => setDefault(r.id, !r.isDefault, kind)}
                        className={`h-8 rounded-lg border px-3 text-[12px] font-semibold ${
                          r.isDefault
                            ? "border-emerald-600/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                            : "border-[#D5D8DE] dark:border-[#2E333D]"
                        }`}
                      >
                        {r.isDefault ? "Varsayılanı kaldır" : "Varsayılan yap"}
                      </button>
                      <button
                        type="button"
                        aria-expanded={openId === r.id}
                        onClick={() => setOpenId(openId === r.id ? null : r.id)}
                        className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-[#D5D8DE] px-3 text-[12px] font-medium dark:border-[#2E333D]"
                      >
                        <SlidersHorizontal className="h-3.5 w-3.5" /> Ayarlar & Koşul
                      </button>
                      <a
                        href={`/api/admin/templates/export?id=${encodeURIComponent(r.id)}`}
                        download
                        aria-label={`${r.name} dışa aktar`}
                        className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-[#D5D8DE] px-2.5 text-[12px] font-medium dark:border-[#2E333D]"
                      >
                        <Download className="h-3.5 w-3.5" />
                      </a>
                      <button
                        type="button"
                        aria-label={`${r.name} sil`}
                        disabled={pending}
                        onClick={() => remove(r.id, r.name)}
                        className="h-8 w-8 rounded-lg border border-[#D5D8DE] text-red-600 dark:border-[#2E333D]"
                      >
                        <Trash2 className="mx-auto h-3.5 w-3.5" />
                      </button>
                    </div>
                    {openId === r.id && (
                      <TemplateSettings
                        id={r.id}
                        kind={r.kind}
                        conditions={r.conditions}
                        behavior={r.behavior}
                        onSaved={(conditions, behavior) =>
                          setRows((cur) =>
                            cur.map((x) =>
                              x.id === r.id ? { ...x, conditions, behavior } : x
                            )
                          )
                        }
                      />
                    )}
                  </li>
                ))}
              </ul>
            )}
          </section>
        );
      })}

      {/* Yeni Şablon Oluşturucu Modalı */}
      {createModalKind && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs"
          onClick={() => setCreateModalKind(null)}
        >
          <div
            className="flex max-h-[86vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-[#D5D8DE] bg-white shadow-2xl dark:border-[#2E333D] dark:bg-[#15171C]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-[#E6E7EA] px-5 py-3.5 dark:border-[#23262E]">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600/10 text-blue-600">
                  <LayoutTemplate className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold">Yeni Şablon Oluştur</h3>
                  <p className="text-[11px] text-[#5F6570] dark:text-[#8C9099]">
                    Şablon türünü, adını ve sağ/sol sidebar veya hazır tasarım başlangıcını seçin.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setCreateModalKind(null)}
                className="rounded-lg p-1.5 text-[#5F6570] hover:bg-black/5 dark:text-[#8C9099]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-4 overflow-y-auto p-5 text-xs">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block font-semibold">Şablon Türü</label>
                  <select
                    value={createModalKind}
                    onChange={(e) => {
                      const nextKind = e.target.value as TemplateKind;
                      const first = STARTER_TEMPLATES.find((s) => s.kind === nextKind);
                      setCreateModalKind(nextKind);
                      setCustomName(`${TEMPLATE_KINDS[nextKind].label} — Özel Şablon`);
                      setSelectedStarterId(first?.id ?? "");
                    }}
                    className="h-9 w-full rounded-lg border border-[#D5D8DE] bg-transparent px-2.5 font-medium dark:border-[#2E333D]"
                  >
                    {kinds.map((k) => (
                      <option key={k} value={k}>
                        {TEMPLATE_KINDS[k].label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-1 block font-semibold">Şablon Adı</label>
                  <input
                    value={customName}
                    onChange={(e) => setCustomName(e.target.value)}
                    placeholder="Örn: Sağ Sidebarlı Blog Şablonu"
                    className="h-9 w-full rounded-lg border border-[#D5D8DE] bg-transparent px-2.5 dark:border-[#2E333D]"
                  />
                </div>
              </div>

              {/* Başlangıç Yöntemi */}
              <div>
                <label className="mb-1.5 block font-semibold">Başlangıç Yöntemi</label>
                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => setCreationMode("starter")}
                    className={`rounded-xl border p-3 text-left transition ${
                      creationMode === "starter"
                        ? "border-blue-600 bg-blue-500/10 text-blue-600 font-bold"
                        : "border-[#E6E7EA] dark:border-[#23262E]"
                    }`}
                  >
                    <div>Hazır Şablondan Başla</div>
                    <p className="mt-0.5 text-[10px] font-normal opacity-80">
                      Tasarlanmış hazır şablonlardan birini seçip düzenleyin.
                    </p>
                  </button>
                  <button
                    type="button"
                    onClick={() => setCreationMode("skeleton")}
                    className={`rounded-xl border p-3 text-left transition ${
                      creationMode === "skeleton"
                        ? "border-blue-600 bg-blue-500/10 text-blue-600 font-bold"
                        : "border-[#E6E7EA] dark:border-[#23262E]"
                    }`}
                  >
                    <div>Sıfırdan Yerleşim İskeletiyle</div>
                    <p className="mt-0.5 text-[10px] font-normal opacity-80">
                      Tam genişlik, Sağ Sidebar (8+4) veya Sol Sidebar (4+8) seçin.
                    </p>
                  </button>
                </div>
              </div>

              {creationMode === "starter" ? (
                <div className="space-y-2">
                  <div className="font-semibold">
                    {TEMPLATE_KINDS[createModalKind].label} İçin Hazır Şablonlar
                  </div>
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    {STARTER_TEMPLATES.filter((s) => s.kind === createModalKind).map((st) => (
                      <button
                        key={st.id}
                        type="button"
                        onClick={() => {
                          setSelectedStarterId(st.id);
                          setCustomName(st.name);
                        }}
                        className={`rounded-xl border p-3 text-left transition ${
                          selectedStarterId === st.id
                            ? "border-blue-600 bg-blue-500/10 ring-1 ring-blue-600"
                            : "border-[#E6E7EA] hover:border-blue-400 dark:border-[#23262E]"
                        }`}
                      >
                        <div className="font-bold text-foreground">{st.name}</div>
                        <p className="mt-1 text-[11px] leading-snug text-[#5F6570] dark:text-[#8C9099]">
                          {st.description}
                        </p>
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="font-semibold">Sayfa & Kenar Çubuğu (Sidebar) İskeleti</div>
                  <div className="grid grid-cols-3 gap-2.5">
                    {(
                      [
                        { id: "full", label: "Tam Genişlik (12)", icon: Square },
                        { id: "right-sidebar", label: "Sağ Sidebar (8+4)", icon: PanelRight },
                        { id: "left-sidebar", label: "Sol Sidebar (4+8)", icon: PanelLeft },
                      ] as const
                    ).map((opt) => {
                      const Icon = opt.icon;
                      return (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => setLayoutMode(opt.id)}
                          className={`flex flex-col items-center gap-1.5 rounded-xl border p-3 text-center font-semibold transition ${
                            layoutMode === opt.id
                              ? "border-blue-600 bg-blue-500/10 text-blue-600"
                              : "border-[#E6E7EA] dark:border-[#23262E]"
                          }`}
                        >
                          <Icon className="h-4 w-4" />
                          <span>{opt.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-[#E6E7EA] bg-[#F8FAFC] p-3 font-medium dark:border-[#23262E] dark:bg-[#111318]">
                <input
                  type="checkbox"
                  checked={makeDefaultOnCreate}
                  onChange={(e) => setMakeDefaultOnCreate(e.target.checked)}
                />
                <span>
                  Bu şablonu <strong>{TEMPLATE_KINDS[createModalKind].label}</strong> için varsayılan görünüm yap
                </span>
              </label>
            </div>

            <div className="flex flex-wrap items-center justify-end gap-2 border-t border-[#E6E7EA] bg-[#F8FAFC] px-5 py-3 dark:border-[#23262E] dark:bg-[#111318]">
              <button
                type="button"
                onClick={() => setCreateModalKind(null)}
                className="rounded-lg border border-[#D5D8DE] px-3 py-1.5 text-xs font-medium dark:border-[#2E333D]"
              >
                Vazgeç
              </button>
              <button
                type="button"
                disabled={pending}
                onClick={() => handleModalCreate(false)}
                className="rounded-lg border border-blue-600/40 bg-blue-500/10 px-3.5 py-1.5 text-xs font-bold text-blue-600 hover:bg-blue-500/20"
              >
                Oluştur ve Listeye Ekle
              </button>
              <button
                type="button"
                disabled={pending}
                onClick={() => handleModalCreate(true)}
                className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-blue-700"
              >
                <Pencil className="h-3.5 w-3.5" /> Oluştur ve Görsel Stüdyoda Düzenle
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

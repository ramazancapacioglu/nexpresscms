"use client";

import React, { useState } from "react";
import {
  ICON_PATHS,
  WIDGET_CATALOG,
  type SiteWidget,
  type SiteWidgetSettings,
  type SiteWidgetType,
} from "@nexpress/core";
import {
  ArrowDown,
  ArrowUp,
  ChevronDown,
  ChevronUp,
  Eye,
  EyeOff,
  Plus,
  Settings2,
  Sparkles,
  Trash2,
  X,
} from "lucide-react";
import { IconPickerField } from "../editor/icon-picker-modal";
import { fieldClass } from "./appearance-ui";

function WidgetSvgIcon({ name, className = "h-4 w-4" }: { name: string; className?: string }) {
  const path = ICON_PATHS[name] ?? ICON_PATHS["sparkles"] ?? "";
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.85}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
      dangerouslySetInnerHTML={{ __html: path }}
    />
  );
}

/**
 * Görsel Bileşen (Widget) Kütüphanesi Modalı
 */
export function WidgetPickerModal({
  open,
  onClose,
  onSelect,
  targetLabel,
}: {
  open: boolean;
  onClose: () => void;
  onSelect: (type: SiteWidgetType) => void;
  targetLabel?: string;
}) {
  const [category, setCategory] = useState<"all" | "dynamic" | "commerce" | "engagement" | "brand">("all");
  const [query, setQuery] = useState("");

  if (!open) return null;

  const filtered = WIDGET_CATALOG.filter((item) => {
    const matchCat = category === "all" || item.category === category;
    const q = query.trim().toLocaleLowerCase("tr");
    const matchQuery =
      !q ||
      `${item.name} ${item.description} ${item.categoryLabel}`
        .toLocaleLowerCase("tr")
        .includes(q);
    return matchCat && matchQuery;
  });

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs"
      onClick={onClose}
    >
      <div
        className="flex max-h-[84vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-[#D5D8DE] bg-white shadow-2xl dark:border-[#2E333D] dark:bg-[#15171C]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-[#E6E7EA] px-5 py-3.5 dark:border-[#23262E]">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600/10 text-blue-600">
              <Sparkles className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold">
                Bileşen (Widget) Kütüphanesi {targetLabel ? `— ${targetLabel}` : ""}
              </h3>
              <p className="text-[11px] text-[#5F6570] dark:text-[#8C9099]">
                Kategoriler, son yazılar, son yorumlar, kampanyalar, bülten veya güven rozetleri ekleyin.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-[#5F6570] hover:bg-black/5 dark:text-[#8C9099]"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#E6E7EA] bg-[#F8FAFC] px-5 py-2.5 dark:border-[#23262E] dark:bg-[#111318]">
          <div className="flex flex-wrap gap-1">
            {(
              [
                { id: "all", label: "Tümü" },
                { id: "dynamic", label: "Dinamik İçerik" },
                { id: "commerce", label: "Kampanya & Ticaret" },
                { id: "engagement", label: "Etkileşim & Arama" },
                { id: "brand", label: "Marka & Kurumsal" },
              ] as const
            ).map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setCategory(cat.id)}
                className={`rounded-md px-2.5 py-1 text-[11px] font-semibold transition ${
                  category === cat.id
                    ? "bg-blue-600 text-white"
                    : "text-[#5F6570] hover:bg-black/5 dark:text-[#8C9099]"
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Bileşen ara (kategori, yorum, kampanya…)"
            className="h-7 w-56 rounded-md border border-[#D5D8DE] bg-white px-2.5 text-[11px] dark:border-[#2E333D] dark:bg-[#15171C]"
          />
        </div>

        <div className="grid grid-cols-1 gap-2.5 overflow-y-auto p-5 sm:grid-cols-2">
          {filtered.map((item) => (
            <button
              key={item.type}
              type="button"
              onClick={() => {
                onSelect(item.type);
                onClose();
              }}
              className="group flex items-start gap-3 rounded-xl border border-[#E6E7EA] bg-white p-3.5 text-left transition hover:border-blue-500 hover:bg-blue-500/[0.03] dark:border-[#23262E] dark:bg-[#181B22]"
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-blue-500/20 bg-blue-500/10 text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition">
                <WidgetSvgIcon name={item.icon} className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[12px] font-bold text-foreground">{item.name}</span>
                  <span className="rounded bg-[#F1F3F6] px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-[#5F6570] dark:bg-[#23262E] dark:text-[#8C9099]">
                    {item.categoryLabel}
                  </span>
                </div>
                <p className="mt-1 text-[11px] leading-relaxed text-[#5F6570] dark:text-[#8C9099]">
                  {item.description}
                </p>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * Tekil Bileşen (Widget) Düzenleyici Kartı
 */
export function WidgetItemCard({
  widget,
  isFirst,
  isLast,
  columnOptions,
  onChange,
  onMoveUp,
  onMoveDown,
  onDelete,
}: {
  widget: SiteWidget;
  isFirst: boolean;
  isLast: boolean;
  columnOptions?: string[];
  onChange: (next: SiteWidget) => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onDelete: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const meta = WIDGET_CATALOG.find((w) => w.type === widget.type) ?? WIDGET_CATALOG[0]!;
  const s = widget.settings;

  const patchSettings = (patch: Partial<SiteWidgetSettings>) => {
    onChange({
      ...widget,
      settings: { ...widget.settings, ...patch },
    });
  };

  return (
    <div
      className={`rounded-xl border transition ${
        widget.enabled
          ? "border-[#D5D8DE] bg-white dark:border-[#2E333D] dark:bg-[#15171C]"
          : "border-dashed border-[#D5D8DE] bg-[#F8FAFC] opacity-65 dark:border-[#2E333D] dark:bg-[#111318]"
      }`}
    >
      {/* Üst Başlık Çubuğu */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-3.5 py-2.5">
        <div className="flex min-w-0 items-center gap-2.5">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-blue-500/10 text-blue-600">
            <WidgetSvgIcon name={meta.icon} className="h-3.5 w-3.5" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="truncate text-[12px] font-bold">{widget.title || meta.name}</span>
              <span className="rounded bg-blue-500/10 px-1.5 py-0.5 text-[9px] font-semibold text-blue-600">
                {meta.name}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1">
          {columnOptions && columnOptions.length > 1 && (
            <select
              aria-label="Sütun seçimi"
              value={widget.columnIndex ?? 0}
              onChange={(e) => onChange({ ...widget, columnIndex: Number(e.target.value) })}
              className="h-6 rounded border border-[#D5D8DE] bg-transparent px-1.5 text-[10px] font-medium dark:border-[#2E333D]"
            >
              {columnOptions.map((lbl, idx) => (
                <option key={idx} value={idx}>
                  {lbl}
                </option>
              ))}
            </select>
          )}
          <button
            type="button"
            title={widget.enabled ? "Yayında (Gizlemek için tıklayın)" : "Gizli (Göster)"}
            onClick={() => onChange({ ...widget, enabled: !widget.enabled })}
            className="rounded p-1 text-[#5F6570] hover:bg-black/5 dark:text-[#8C9099]"
          >
            {widget.enabled ? <Eye className="h-3.5 w-3.5 text-emerald-600" /> : <EyeOff className="h-3.5 w-3.5" />}
          </button>
          <button
            type="button"
            disabled={isFirst}
            onClick={onMoveUp}
            title="Yukarı taşı"
            className="rounded p-1 text-[#5F6570] hover:bg-black/5 disabled:opacity-30 dark:text-[#8C9099]"
          >
            <ArrowUp className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            disabled={isLast}
            onClick={onMoveDown}
            title="Aşağı taşı"
            className="rounded p-1 text-[#5F6570] hover:bg-black/5 disabled:opacity-30 dark:text-[#8C9099]"
          >
            <ArrowDown className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className={`inline-flex items-center gap-1 rounded-md border px-2 py-1 text-[10px] font-semibold transition ${
              expanded
                ? "border-blue-600 bg-blue-600 text-white"
                : "border-[#D5D8DE] hover:border-blue-500 dark:border-[#2E333D]"
            }`}
          >
            <Settings2 className="h-3 w-3" />
            Düzenle
            {expanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
          </button>
          <button
            type="button"
            onClick={onDelete}
            title="Bileşeni kaldır"
            className="rounded p-1 text-rose-600 hover:bg-rose-500/10"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Genişletilmiş Bileşen Ayarları */}
      {expanded && (
        <div className="space-y-3 border-t border-[#E6E7EA] bg-[#FAFBFD] p-3.5 text-[11px] dark:border-[#23262E] dark:bg-[#111318]">
          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
            <div>
              <label className="mb-1 block font-semibold">Bileşen Başlığı</label>
              <input
                className={fieldClass}
                value={widget.title}
                onChange={(e) => onChange({ ...widget, title: e.target.value })}
              />
            </div>

            {(widget.type === "categories" ||
              widget.type === "recent_posts" ||
              widget.type === "recent_comments" ||
              widget.type === "featured_products" ||
              widget.type === "popular_tags") && (
              <div>
                <label className="mb-1 block font-semibold">Gösterilecek Adet</label>
                <input
                  type="number"
                  min={1}
                  max={20}
                  className={fieldClass}
                  value={s.count ?? 5}
                  onChange={(e) => patchSettings({ count: Math.max(1, Math.min(20, Number(e.target.value) || 4)) })}
                />
              </div>
            )}
          </div>

          {/* KATEGORİLER AYARLARI */}
          {widget.type === "categories" && (
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
              <div>
                <label className="mb-1 block font-semibold">Görünüm Stili</label>
                <select
                  className={fieldClass}
                  value={s.style ?? "list"}
                  onChange={(e) => patchSettings({ style: e.target.value as SiteWidgetSettings["style"] })}
                >
                  <option value="list">Klasik Liste + Sayaç</option>
                  <option value="pills">Modern Etiket / Rozet</option>
                  <option value="cards">Kutu Kartlar</option>
                </select>
              </div>
              <label className="flex items-center gap-2 pt-5">
                <input
                  type="checkbox"
                  checked={s.showCount ?? true}
                  onChange={(e) => patchSettings({ showCount: e.target.checked })}
                />
                <span>Yazı sayısını göster</span>
              </label>
              <label className="flex items-center gap-2 pt-5">
                <input
                  type="checkbox"
                  checked={s.showHierarchy ?? true}
                  onChange={(e) => patchSettings({ showHierarchy: e.target.checked })}
                />
                <span>Alt kategorileri girintile</span>
              </label>
            </div>
          )}

          {/* SON YAZILAR AYARLARI */}
          {widget.type === "recent_posts" && (
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
              <div>
                <label className="mb-1 block font-semibold">Liste Görünümü</label>
                <select
                  className={fieldClass}
                  value={s.style ?? "compact"}
                  onChange={(e) => patchSettings({ style: e.target.value as SiteWidgetSettings["style"] })}
                >
                  <option value="compact">Küçük Görselli Kompakt</option>
                  <option value="numbered">Numaralı Popüler Liste (01, 02…)</option>
                  <option value="cards">Kart Düzeni</option>
                </select>
              </div>
              <label className="flex items-center gap-2 pt-5">
                <input
                  type="checkbox"
                  checked={s.showThumbnail ?? true}
                  onChange={(e) => patchSettings({ showThumbnail: e.target.checked })}
                />
                <span>Kapak görseli göster</span>
              </label>
              <label className="flex items-center gap-2 pt-5">
                <input
                  type="checkbox"
                  checked={s.showDate ?? true}
                  onChange={(e) => patchSettings({ showDate: e.target.checked })}
                />
                <span>Yayın tarihini göster</span>
              </label>
            </div>
          )}

          {/* SON YORUMLAR AYARLARI */}
          {widget.type === "recent_comments" && (
            <div className="flex flex-wrap items-center gap-4">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={s.showRating ?? true}
                  onChange={(e) => patchSettings({ showRating: e.target.checked })}
                />
                <span>5 Yıldızlı değerlendirme puanını göster</span>
              </label>
            </div>
          )}

          {/* KAMPANYA & FIRSAT KUTUSU AYARLARI */}
          {widget.type === "campaigns" && (
            <div className="space-y-2.5">
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                <div>
                  <label className="mb-1 block font-semibold">Üst Rozet</label>
                  <input
                    className={fieldClass}
                    value={s.badge ?? ""}
                    placeholder="ÖZEL FIRSAT"
                    onChange={(e) => patchSettings({ badge: e.target.value })}
                  />
                </div>
                <div>
                  <label className="mb-1 block font-semibold">İndirim / Vurgu</label>
                  <input
                    className={fieldClass}
                    value={s.discountText ?? ""}
                    placeholder="%25 İndirim"
                    onChange={(e) => patchSettings({ discountText: e.target.value })}
                  />
                </div>
                <div>
                  <label className="mb-1 block font-semibold">Kupon Kodu (İsteğe bağlı)</label>
                  <input
                    className={`${fieldClass} font-mono`}
                    value={s.couponCode ?? ""}
                    placeholder="AVANTAJ25"
                    onChange={(e) => patchSettings({ couponCode: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <label className="mb-1 block font-semibold">Kampanya Açıklaması</label>
                <input
                  className={fieldClass}
                  value={s.subtitle ?? ""}
                  onChange={(e) => patchSettings({ subtitle: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                <div>
                  <label className="mb-1 block font-semibold">Buton Metni</label>
                  <input
                    className={fieldClass}
                    value={s.ctaLabel ?? ""}
                    onChange={(e) => patchSettings({ ctaLabel: e.target.value })}
                  />
                </div>
                <div>
                  <label className="mb-1 block font-semibold">Buton Adresi</label>
                  <input
                    className={`${fieldClass} font-mono`}
                    value={s.ctaHref ?? ""}
                    onChange={(e) => patchSettings({ ctaHref: e.target.value })}
                  />
                </div>
                <div>
                  <label className="mb-1 block font-semibold">Kart Renk Tonu</label>
                  <select
                    className={fieldClass}
                    value={s.tone ?? "primary"}
                    onChange={(e) => patchSettings({ tone: e.target.value as SiteWidgetSettings["tone"] })}
                  >
                    <option value="primary">Tema Ana Rengi (Vurgulu)</option>
                    <option value="dark">Koyu Kurumsal</option>
                    <option value="accent">Aksan Rengi</option>
                    <option value="subtle">Yumuşak Çerçeveli</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* ÖNE ÇIKAN ÜRÜNLER AYARLARI */}
          {widget.type === "featured_products" && (
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
              <div>
                <label className="mb-1 block font-semibold">Rozet Metni</label>
                <input
                  className={fieldClass}
                  value={s.badge ?? ""}
                  placeholder="Popüler"
                  onChange={(e) => patchSettings({ badge: e.target.value })}
                />
              </div>
              <div>
                <label className="mb-1 block font-semibold">Alt Buton Metni</label>
                <input
                  className={fieldClass}
                  value={s.ctaLabel ?? ""}
                  onChange={(e) => patchSettings({ ctaLabel: e.target.value })}
                />
              </div>
              <div>
                <label className="mb-1 block font-semibold">Mağaza Adresi</label>
                <input
                  className={`${fieldClass} font-mono`}
                  value={s.ctaHref ?? "/tr/magaza"}
                  onChange={(e) => patchSettings({ ctaHref: e.target.value })}
                />
              </div>
            </div>
          )}

          {/* ARAMA KUTUSU AYARLARI */}
          {widget.type === "search" && (
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <div>
                <label className="mb-1 block font-semibold">Arama Kutusu İpucu (Placeholder)</label>
                <input
                  className={fieldClass}
                  value={s.placeholder ?? ""}
                  onChange={(e) => patchSettings({ placeholder: e.target.value })}
                />
              </div>
              <div>
                <label className="mb-1 block font-semibold">Önerilen Aramalar (Virgülle ayırın)</label>
                <input
                  className={fieldClass}
                  value={s.popularKeywords ?? ""}
                  placeholder="SEO, Performans, E-Ticaret"
                  onChange={(e) => patchSettings({ popularKeywords: e.target.value })}
                />
              </div>
            </div>
          )}

          {/* E-BÜLTEN AYARLARI */}
          {widget.type === "newsletter" && (
            <div className="space-y-2">
              <div>
                <label className="mb-1 block font-semibold">Açıklama Metni</label>
                <input
                  className={fieldClass}
                  value={s.subtitle ?? ""}
                  onChange={(e) => patchSettings({ subtitle: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                <div>
                  <label className="mb-1 block font-semibold">Giriş İpucu</label>
                  <input
                    className={fieldClass}
                    value={s.placeholder ?? ""}
                    onChange={(e) => patchSettings({ placeholder: e.target.value })}
                  />
                </div>
                <div>
                  <label className="mb-1 block font-semibold">Buton Metni</label>
                  <input
                    className={fieldClass}
                    value={s.ctaLabel ?? ""}
                    onChange={(e) => patchSettings({ ctaLabel: e.target.value })}
                  />
                </div>
                <div>
                  <label className="mb-1 block font-semibold">Alt Güven Notu</label>
                  <input
                    className={fieldClass}
                    value={s.privacyNote ?? ""}
                    onChange={(e) => patchSettings({ privacyNote: e.target.value })}
                  />
                </div>
              </div>
            </div>
          )}

          {/* MARKA & SOSYAL MEDYA AYARLARI */}
          {widget.type === "about_brand" && (
            <div className="space-y-2.5">
              <div>
                <label className="mb-1 block font-semibold">Marka & Kurumsal Açıklama</label>
                <textarea
                  rows={2}
                  className={fieldClass}
                  value={s.subtitle ?? ""}
                  onChange={(e) => patchSettings({ subtitle: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                <div>
                  <label className="mb-1 block font-semibold">Telefon</label>
                  <input
                    className={fieldClass}
                    value={s.phone ?? ""}
                    onChange={(e) => patchSettings({ phone: e.target.value })}
                  />
                </div>
                <div>
                  <label className="mb-1 block font-semibold">E-posta</label>
                  <input
                    className={fieldClass}
                    value={s.email ?? ""}
                    onChange={(e) => patchSettings({ email: e.target.value })}
                  />
                </div>
                <div>
                  <label className="mb-1 block font-semibold">Konum / Adres</label>
                  <input
                    className={fieldClass}
                    value={s.address ?? ""}
                    onChange={(e) => patchSettings({ address: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                <div>
                  <label className="mb-1 block font-semibold">X / Twitter URL</label>
                  <input
                    className={`${fieldClass} font-mono`}
                    value={s.socials?.x ?? ""}
                    onChange={(e) => patchSettings({ socials: { ...s.socials, x: e.target.value } })}
                  />
                </div>
                <div>
                  <label className="mb-1 block font-semibold">LinkedIn URL</label>
                  <input
                    className={`${fieldClass} font-mono`}
                    value={s.socials?.linkedin ?? ""}
                    onChange={(e) => patchSettings({ socials: { ...s.socials, linkedin: e.target.value } })}
                  />
                </div>
                <div>
                  <label className="mb-1 block font-semibold">Instagram / GitHub URL</label>
                  <input
                    className={`${fieldClass} font-mono`}
                    value={s.socials?.instagram ?? s.socials?.github ?? ""}
                    onChange={(e) => patchSettings({ socials: { ...s.socials, instagram: e.target.value } })}
                  />
                </div>
              </div>
            </div>
          )}

          {/* UZMAN DESTEĞİ & İLETİŞİM KARTI */}
          {widget.type === "contact_card" && (
            <div className="space-y-2">
              <div>
                <label className="mb-1 block font-semibold">Açıklama</label>
                <input
                  className={fieldClass}
                  value={s.subtitle ?? ""}
                  onChange={(e) => patchSettings({ subtitle: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                <div>
                  <label className="mb-1 block font-semibold">Telefon</label>
                  <input
                    className={fieldClass}
                    value={s.phone ?? ""}
                    onChange={(e) => patchSettings({ phone: e.target.value })}
                  />
                </div>
                <div>
                  <label className="mb-1 block font-semibold">Çalışma Saatleri</label>
                  <input
                    className={fieldClass}
                    value={s.hours ?? ""}
                    onChange={(e) => patchSettings({ hours: e.target.value })}
                  />
                </div>
                <div>
                  <label className="mb-1 block font-semibold">Çağrı Butonu Metni</label>
                  <input
                    className={fieldClass}
                    value={s.ctaLabel ?? ""}
                    onChange={(e) => patchSettings({ ctaLabel: e.target.value })}
                  />
                </div>
              </div>
            </div>
          )}

          {/* GÜVEN & GARANTİ ROZETLERİ */}
          {widget.type === "trust_badges" && (
            <div className="space-y-2">
              {(s.badges ?? []).map((b, idx) => (
                <div key={idx} className="grid grid-cols-1 gap-2 rounded-lg border border-[#E6E7EA] bg-white p-2 sm:grid-cols-[150px_1fr_1fr_auto] dark:border-[#23262E] dark:bg-[#15171C]">
                  <IconPickerField
                    value={b.icon}
                    onChange={(icon) => {
                      const next = [...(s.badges ?? [])];
                      next[idx] = { ...b, icon };
                      patchSettings({ badges: next });
                    }}
                  />
                  <input
                    className={fieldClass}
                    value={b.title}
                    placeholder="Rozet başlığı"
                    onChange={(e) => {
                      const next = [...(s.badges ?? [])];
                      next[idx] = { ...b, title: e.target.value };
                      patchSettings({ badges: next });
                    }}
                  />
                  <input
                    className={fieldClass}
                    value={b.subtitle}
                    placeholder="Kısa açıklama"
                    onChange={(e) => {
                      const next = [...(s.badges ?? [])];
                      next[idx] = { ...b, subtitle: e.target.value };
                      patchSettings({ badges: next });
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => patchSettings({ badges: (s.badges ?? []).filter((_, i) => i !== idx) })}
                    className="px-2 text-rose-600"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={() =>
                  patchSettings({
                    badges: [...(s.badges ?? []), { icon: "check", title: "Yeni Güvence", subtitle: "Açıklama" }],
                  })
                }
                className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-600 hover:underline"
              >
                <Plus className="h-3 w-3" /> Rozet ekle
              </button>
            </div>
          )}

          {/* MENÜ & HIZLI BAĞLANTI GRUBU */}
          {widget.type === "nav_menu" && (
            <div className="space-y-2">
              {(s.links ?? []).map((lnk, idx) => (
                <div key={lnk.id || idx} className="grid grid-cols-1 gap-2 sm:grid-cols-[140px_1fr_1fr_90px_auto]">
                  <IconPickerField
                    value={lnk.icon ?? ""}
                    onChange={(icon) => {
                      const next = [...(s.links ?? [])];
                      next[idx] = { ...lnk, icon };
                      patchSettings({ links: next });
                    }}
                  />
                  <input
                    className={fieldClass}
                    value={lnk.label}
                    placeholder="Menü adı"
                    onChange={(e) => {
                      const next = [...(s.links ?? [])];
                      next[idx] = { ...lnk, label: e.target.value };
                      patchSettings({ links: next });
                    }}
                  />
                  <input
                    className={`${fieldClass} font-mono`}
                    value={lnk.href}
                    placeholder="/tr/kurumsal"
                    onChange={(e) => {
                      const next = [...(s.links ?? [])];
                      next[idx] = { ...lnk, href: e.target.value };
                      patchSettings({ links: next });
                    }}
                  />
                  <input
                    className={fieldClass}
                    value={lnk.badge ?? ""}
                    placeholder="Rozet"
                    onChange={(e) => {
                      const next = [...(s.links ?? [])];
                      next[idx] = { ...lnk, badge: e.target.value };
                      patchSettings({ links: next });
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => patchSettings({ links: (s.links ?? []).filter((_, i) => i !== idx) })}
                    className="px-2 text-rose-600"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={() =>
                  patchSettings({
                    links: [
                      ...(s.links ?? []),
                      { id: `wl_${Date.now()}`, label: "Yeni Sayfa", href: "/tr", icon: "arrow-right" },
                    ],
                  })
                }
                className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-600 hover:underline"
              >
                <Plus className="h-3 w-3" /> Menü öğesi ekle
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Yönetim panelinde canlı önizleme için tekil Widget görünümü
 */
export function WidgetPreviewBox({ widget, compact = false }: { widget: SiteWidget; compact?: boolean }) {
  if (!widget.enabled) return null;
  const s = widget.settings;

  if (widget.type === "campaigns") {
    const isDark = s.tone === "dark";
    const isPrimary = s.tone === "primary" || !s.tone;
    return (
      <div
        className={`rounded-xl p-3.5 space-y-2 ${
          isPrimary
            ? "bg-blue-600 text-white"
            : isDark
              ? "bg-zinc-900 text-white"
              : "border border-blue-500/30 bg-blue-500/10 text-foreground"
        }`}
      >
        <div className="flex items-center justify-between gap-2">
          {s.badge && (
            <span className="rounded bg-white/20 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider">
              {s.badge}
            </span>
          )}
          {s.discountText && <span className="text-[11px] font-extrabold">{s.discountText}</span>}
        </div>
        <div className="text-xs font-bold">{widget.title}</div>
        {s.subtitle && <p className="text-[10px] opacity-90 leading-relaxed">{s.subtitle}</p>}
        {s.couponCode && (
          <div className="rounded border border-dashed border-current/40 bg-black/15 px-2 py-1 text-center font-mono text-[10px] font-bold">
            KOD: {s.couponCode}
          </div>
        )}
        {s.ctaLabel && (
          <div className="inline-block rounded-md bg-white px-2.5 py-1 text-[10px] font-bold text-blue-700">
            {s.ctaLabel} →
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={`space-y-2 ${compact ? "" : "rounded-xl border border-[#E6E7EA] bg-white p-3 dark:border-[#23262E] dark:bg-[#15171C]"}`}>
      <div className="text-[11px] font-bold uppercase tracking-wider text-foreground">
        {widget.title}
      </div>

      {widget.type === "categories" && (
        <div className={s.style === "pills" ? "flex flex-wrap gap-1.5" : "space-y-1.5 text-[11px]"}>
          {["Performans & Mimari", "Teknik SEO & GEO", "E-Ticaret Çözümleri", "Kurumsal Rehberler"]
            .slice(0, s.count ?? 4)
            .map((cat, i) =>
              s.style === "pills" ? (
                <span key={i} className="rounded-full border border-[#D5D8DE] px-2 py-0.5 text-[10px] font-medium dark:border-[#2E333D]">
                  {cat} {s.showCount !== false ? `(${4 + i * 2})` : ""}
                </span>
              ) : (
                <div key={i} className="flex items-center justify-between text-[11px] opacity-85">
                  <span>{cat}</span>
                  {s.showCount !== false && (
                    <span className="rounded bg-muted px-1.5 py-0.2 text-[9px] font-semibold">
                      {4 + i * 2}
                    </span>
                  )}
                </div>
              )
            )}
        </div>
      )}

      {widget.type === "recent_posts" && (
        <div className="space-y-2 text-[11px]">
          {[
            { title: "0-KB RSC Mimarisi ile 100/100 Hız", date: "3 Kas 2026" },
            { title: "Kurumsal SEO ve Schema.org Rehberi", date: "1 Kas 2026" },
            { title: "Yüksek Dönüşümlü E-Ticaret Vitrini", date: "29 Eki 2026" },
          ]
            .slice(0, Math.min(4, s.count ?? 3))
            .map((p, i) => (
              <div key={i} className="flex items-start gap-2">
                {s.style === "numbered" ? (
                  <span className="font-mono text-[10px] font-bold text-blue-600">0{i + 1}</span>
                ) : s.showThumbnail !== false ? (
                  <div className="h-8 w-10 shrink-0 rounded bg-blue-500/15" />
                ) : null}
                <div className="min-w-0 flex-1">
                  <div className="truncate font-medium leading-snug">{p.title}</div>
                  {s.showDate !== false && <div className="text-[9px] opacity-60">{p.date}</div>}
                </div>
              </div>
            ))}
        </div>
      )}

      {widget.type === "recent_comments" && (
        <div className="space-y-1.5 text-[10px]">
          {[
            { author: "Ahmet Y.", text: "Sayfa açılış hızı inanılmaz fark etti.", stars: 5 },
            { author: "Selin K.", text: "Kurulum ve şablon yönetimi çok pratik.", stars: 5 },
          ]
            .slice(0, Math.min(3, s.count ?? 2))
            .map((c, i) => (
              <div key={i} className="rounded-lg border border-[#E6E7EA] p-2 dark:border-[#23262E]">
                <div className="flex items-center justify-between font-semibold">
                  <span>{c.author}</span>
                  {s.showRating !== false && <span className="text-amber-500">{"★".repeat(c.stars)}</span>}
                </div>
                <p className="mt-0.5 truncate opacity-80">&ldquo;{c.text}&rdquo;</p>
              </div>
            ))}
        </div>
      )}

      {widget.type === "featured_products" && (
        <div className="space-y-1.5 text-[11px]">
          {[
            { name: "Kurumsal E-Ticaret Paketi", price: "₺14.900" },
            { name: "Pro SEO & İçerik Stüdyosu", price: "₺7.500" },
          ]
            .slice(0, Math.min(3, s.count ?? 2))
            .map((prod, i) => (
              <div key={i} className="flex items-center justify-between gap-2 rounded border border-[#E6E7EA] p-1.5 dark:border-[#23262E]">
                <span className="truncate font-medium">{prod.name}</span>
                <span className="shrink-0 font-bold text-blue-600">{prod.price}</span>
              </div>
            ))}
        </div>
      )}

      {widget.type === "popular_tags" && (
        <div className="flex flex-wrap gap-1">
          {["#RSC", "#SEO", "#ETicaret", "#Performans", "#Kurumsal", "#Şablon"].map((t) => (
            <span key={t} className="rounded-md bg-muted px-2 py-0.5 text-[10px] font-medium">
              {t}
            </span>
          ))}
        </div>
      )}

      {widget.type === "search" && (
        <div className="space-y-1.5">
          <div className="rounded-md border border-[#D5D8DE] px-2.5 py-1.5 text-[10px] opacity-70 dark:border-[#2E333D]">
            🔍 {s.placeholder || "Yazı veya ürün ara…"}
          </div>
          {s.popularKeywords && (
            <div className="text-[9px] opacity-70">Önerilen: {s.popularKeywords}</div>
          )}
        </div>
      )}

      {widget.type === "newsletter" && (
        <div className="space-y-1.5">
          {s.subtitle && <p className="text-[10px] opacity-80">{s.subtitle}</p>}
          <div className="flex gap-1">
            <div className="flex-1 rounded border border-[#D5D8DE] px-2 py-1 text-[10px] opacity-65 dark:border-[#2E333D]">
              {s.placeholder || "E-posta…"}
            </div>
            <span className="rounded bg-blue-600 px-2.5 py-1 text-[10px] font-semibold text-white">
              {s.ctaLabel || "Kaydol"}
            </span>
          </div>
        </div>
      )}

      {widget.type === "about_brand" && (
        <div className="space-y-1.5 text-[10px] opacity-85">
          {s.subtitle && <p className="leading-relaxed">{s.subtitle}</p>}
          {s.phone && <div>📞 {s.phone}</div>}
          {s.email && <div>✉️ {s.email}</div>}
          {s.address && <div>📍 {s.address}</div>}
        </div>
      )}

      {widget.type === "contact_card" && (
        <div className="space-y-1 text-[10px]">
          {s.subtitle && <p className="opacity-80">{s.subtitle}</p>}
          {s.phone && <div className="font-bold text-blue-600">{s.phone}</div>}
          {s.hours && <div className="opacity-70">{s.hours}</div>}
        </div>
      )}

      {widget.type === "trust_badges" && (
        <div className="space-y-1.5 text-[10px]">
          {(s.badges ?? []).map((b, i) => (
            <div key={i} className="flex items-center gap-2">
              <WidgetSvgIcon name={b.icon} className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
              <div>
                <div className="font-semibold">{b.title}</div>
                <div className="text-[9px] opacity-70">{b.subtitle}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {widget.type === "toc" && (
        <div className="space-y-1 border-l-2 border-blue-500 pl-2.5 text-[10px] opacity-80">
          <div>1. Genel Bakış & Mimari</div>
          <div>2. Temel Özellikler</div>
          <div>3. Sıkça Sorulan Sorular</div>
        </div>
      )}

      {widget.type === "nav_menu" && (
        <ul className="space-y-1 text-[11px] opacity-85">
          {(s.links ?? []).map((lnk) => (
            <li key={lnk.id} className="flex items-center justify-between gap-1.5">
              <span className="flex items-center gap-1.5 truncate">
                {lnk.icon && <WidgetSvgIcon name={lnk.icon} className="h-3 w-3 opacity-75" />}
                {lnk.label}
              </span>
              {lnk.badge && (
                <span className="rounded bg-blue-500/10 px-1 py-0.2 text-[9px] font-bold text-blue-600">
                  {lnk.badge}
                </span>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}


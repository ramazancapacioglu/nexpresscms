"use client";

import React, { useMemo, useState } from "react";
import {
  ICON_CATEGORIES,
  ICON_LABELS,
  ICON_NAMES,
  ICON_PATHS,
  type IconCategoryKey,
} from "@nexpress/core";
import { Check, Search, Sparkles, X } from "lucide-react";

export function SvgIconPreview({
  name,
  size = 18,
  className = "",
}: {
  name: string | undefined | null;
  size?: number;
  className?: string;
}) {
  const path = name ? ICON_PATHS[name] : undefined;
  if (!path) return null;
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      <path d={path} />
    </svg>
  );
}

export interface IconPickerFieldProps {
  value: string;
  onChange: (next: string) => void;
  allowEmpty?: boolean;
  label?: string;
  placeholder?: string;
}

/**
 * Sağ denetçide veya tuval araçlarında simge seçimi:
 * Seçili simgeyi SVG görseli ve Türkçe adıyla gösterir; tıklandığında görsel ızgaralı dialog modalı açar.
 */
export function IconPickerField({
  value,
  onChange,
  allowEmpty = true,
  label,
  placeholder = "Simge seçin…",
}: IconPickerFieldProps) {
  const [open, setOpen] = useState(false);
  const hasIcon = Boolean(value && ICON_PATHS[value]);
  const displayLabel = hasIcon ? ICON_LABELS[value] ?? value : placeholder;

  return (
    <>
      <div className="flex items-center gap-1">
        <button
          type="button"
          aria-label={label ?? "Simge seç"}
          onClick={() => setOpen(true)}
          className="flex h-8 flex-1 items-center justify-between gap-2 rounded-md border border-border bg-background px-2.5 text-xs transition hover:border-blue-500/60 hover:bg-muted/50"
        >
          <span className="flex min-w-0 items-center gap-2">
            {hasIcon ? (
              <span className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded bg-blue-500/10 text-blue-600 dark:text-blue-400">
                <SvgIconPreview name={value} size={14} />
              </span>
            ) : (
              <Sparkles className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
            )}
            <span className={`truncate ${hasIcon ? "font-medium text-foreground" : "text-muted-foreground"}`}>
              {displayLabel}
            </span>
          </span>
          <span className="shrink-0 rounded bg-muted px-1.5 py-0.5 text-[10px] font-semibold text-muted-foreground">
            Değiştir
          </span>
        </button>
        {allowEmpty && hasIcon && (
          <button
            type="button"
            title="Simgeyi kaldır"
            aria-label="Simgeyi kaldır"
            onClick={() => onChange("")}
            className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-border bg-background text-muted-foreground hover:bg-rose-500/10 hover:text-rose-600"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {open && (
        <IconPickerModal
          value={value}
          allowEmpty={allowEmpty}
          onSelect={(next) => {
            onChange(next);
            setOpen(false);
          }}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
}

export function IconPickerModal({
  value,
  allowEmpty = true,
  onSelect,
  onClose,
}: {
  value: string;
  allowEmpty?: boolean;
  onSelect: (iconName: string) => void;
  onClose: () => void;
}) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<IconCategoryKey>("all");

  const filtered = useMemo(() => {
    const baseList =
      category === "all"
        ? ICON_NAMES
        : ICON_CATEGORIES.find((c) => c.id === category)?.icons ?? ICON_NAMES;
    const q = query.trim().toLocaleLowerCase("tr");
    if (!q) return baseList;
    return baseList.filter((name) => {
      const trLabel = (ICON_LABELS[name] ?? "").toLocaleLowerCase("tr");
      return name.toLowerCase().includes(q) || trLabel.includes(q);
    });
  }, [query, category]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Görsel Simge Seçici"
        className="flex max-h-[88vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-border bg-background shadow-2xl"
      >
        {/* Üst Başlık */}
        <div className="flex items-center justify-between border-b px-4 py-3">
          <div>
            <h3 className="text-sm font-bold">Simge Kütüphanesi</h3>
            <p className="text-[11px] text-muted-foreground">
              0-KB saf SVG simgeler — kategori seçin veya arayın ({ICON_NAMES.length} vektör simge)
            </p>
          </div>
          <button
            type="button"
            aria-label="Kapat"
            onClick={onClose}
            className="inline-flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Arama Çubuğu & Kategori Sekmeleri */}
        <div className="space-y-2 border-b bg-muted/30 px-4 py-2.5">
          <div className="flex items-center gap-2">
            <div className="flex h-9 flex-1 items-center gap-2 rounded-lg border border-border bg-background px-3">
              <Search className="h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Simge ara (ör: yıldız, onay, roket, telefon, kalkan, bulut, pos, hukuk, sağlık)…"
                aria-label="Simge ara"
                className="w-full bg-transparent text-xs outline-none"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery("")}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
            {allowEmpty && (
              <button
                type="button"
                onClick={() => onSelect("")}
                className={`h-9 shrink-0 rounded-lg border px-3 text-xs font-medium transition ${
                  !value
                    ? "border-blue-600 bg-blue-500/10 text-blue-600"
                    : "border-border bg-background hover:bg-muted"
                }`}
              >
                Simge Yok
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-1">
            <button
              type="button"
              onClick={() => setCategory("all")}
              className={`rounded-md px-2.5 py-1 text-[11px] font-semibold transition ${
                category === "all"
                  ? "bg-blue-600 text-white shadow-2xs"
                  : "bg-background text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              Tümü ({ICON_NAMES.length})
            </button>
            {ICON_CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setCategory(cat.id)}
                className={`rounded-md px-2.5 py-1 text-[11px] font-semibold transition ${
                  category === cat.id
                    ? "bg-blue-600 text-white shadow-2xs"
                    : "bg-background text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                {cat.label} ({cat.icons.length})
              </button>
            ))}
          </div>
        </div>

        {/* Görsel Simge Izgarası */}
        <div className="min-h-0 flex-1 overflow-y-auto p-4">
          {filtered.length === 0 ? (
            <p className="py-12 text-center text-xs text-muted-foreground">
              &ldquo;{query}&rdquo; aramasına uygun simge bulunamadı.
            </p>
          ) : (
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-6">
              {filtered.map((name) => {
                const selected = value === name;
                const trLabel = ICON_LABELS[name] ?? name;
                return (
                  <button
                    key={name}
                    type="button"
                    onClick={() => onSelect(name)}
                    className={`group relative flex flex-col items-center justify-center gap-1.5 rounded-xl border p-2.5 text-center transition ${
                      selected
                        ? "border-blue-600 bg-blue-500/10 text-blue-600 ring-2 ring-blue-500/20 dark:text-blue-400"
                        : "border-border bg-background hover:border-blue-500/50 hover:bg-muted/60"
                    }`}
                  >
                    {selected && (
                      <span className="absolute right-1.5 top-1.5 inline-flex h-4 w-4 items-center justify-center rounded-full bg-blue-600 text-white">
                        <Check className="h-2.5 w-2.5" />
                      </span>
                    )}
                    <div
                      className={`inline-flex h-9 w-9 items-center justify-center rounded-lg transition ${
                        selected
                          ? "bg-blue-600 text-white"
                          : "bg-muted/70 text-foreground group-hover:bg-blue-500/15 group-hover:text-blue-600"
                      }`}
                    >
                      <SvgIconPreview name={name} size={20} />
                    </div>
                    <div className="w-full">
                      <div className="truncate text-[10px] font-semibold leading-tight">
                        {trLabel}
                      </div>
                      <div className="truncate font-mono text-[8px] text-muted-foreground">
                        {name}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

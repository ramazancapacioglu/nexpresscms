"use client";

import React from "react";
import {
  FOOTER_SOCIAL_LABEL,
  FOOTER_SOCIAL_NETWORKS,
  FOOTER_BACKGROUNDS,
  FOOTER_BACKGROUND_LABEL,
  footerRowColors,
  resolveFooterStyle,
  type FooterBackground,
  type FooterBottomStyle,
  type FooterOptions,
  type FooterRowStyle,
} from "@nexpress/core";
import { fieldClass } from "./appearance-ui";

const PREVIEW_TOKENS = { primary: "#2563eb", primaryForeground: "#ffffff", muted: "#f1f5f9" };

/** Orta ve alt satırın stil denetleri (zemin, boşluk, ayraç, genişlik, alt çubuk düzeni) ve canlı şerit önizlemesi. */
export function FooterStylePanel({ value, onChange, menus = [] }: { value: FooterOptions | undefined; onChange: (next: FooterOptions) => void; menus?: Array<{ id: string; name: string }> }) {
  const options = value ?? {};
  const resolved = resolveFooterStyle(options);
  const setRow = (key: "main" | "bottom", patch: Partial<FooterBottomStyle>) => onChange({ ...options, [key]: { ...(options[key] ?? {}), ...patch } });

  const rowControls = (key: "main" | "bottom", title: string, row: FooterRowStyle, pad: number) => (
    <fieldset className="space-y-2.5 rounded-lg border border-[#E6E7EA] p-3 dark:border-[#23262E]">
      <legend className="px-1 text-[11px] font-bold uppercase tracking-wider text-blue-600">{title}</legend>
      <div className="flex flex-wrap gap-1.5" role="radiogroup" aria-label={`${title} zemini`}>
        {FOOTER_BACKGROUNDS.map((bg: FooterBackground) => {
          const c = footerRowColors({ background: bg, customColor: row.customColor ?? "#ffffff" }, PREVIEW_TOKENS);
          const active = (row.background ?? "default") === bg;
          return (
            <button
              key={bg}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => setRow(key, { background: bg })}
              className={`inline-flex items-center gap-1.5 rounded-md border px-2 py-1 text-[11px] font-semibold ${active ? "border-blue-500 bg-blue-500/10 text-blue-700 dark:text-blue-300" : "border-[#D5D8DE] dark:border-[#2E333D]"}`}
            >
              <span aria-hidden className="h-3 w-3 rounded-sm border border-black/20" style={{ background: c.background ?? "transparent" }} />
              {FOOTER_BACKGROUND_LABEL[bg]}
            </button>
          );
        })}
      </div>
      {row.background === "custom" ? (
        <label className="flex items-center gap-2 text-[11px] font-semibold">
          Renk
          <input
            type="color"
            aria-label={`${title} özel rengi`}
            value={/^#[0-9a-fA-F]{6}$/.test(row.customColor ?? "") ? row.customColor : "#ffffff"}
            onChange={(e) => setRow(key, { customColor: e.target.value })}
            className="h-7 w-10 cursor-pointer rounded border"
          />
        </label>
      ) : null}
      <div className="grid gap-2 sm:grid-cols-2">
        <label className="block text-[11px] font-semibold">
          Üst-alt boşluk: {row.paddingY ?? pad}px
          <input
            type="range"
            min={8}
            max={120}
            step={4}
            aria-label={`${title} dikey boşluğu`}
            value={row.paddingY ?? pad}
            onChange={(e) => setRow(key, { paddingY: Number(e.target.value) })}
            className="mt-1 w-full"
          />
        </label>
        <div className="flex flex-wrap items-end gap-3 text-[11px] font-semibold">
          <label className="inline-flex items-center gap-1.5">
            <input type="checkbox" checked={row.divider ?? (key === "bottom")} onChange={(e) => setRow(key, { divider: e.target.checked })} />
            Üstte ayraç çizgisi
          </label>
          <label className="inline-flex items-center gap-1.5">
            <input type="checkbox" checked={row.width === "full"} onChange={(e) => setRow(key, { width: e.target.checked ? "full" : "contained" })} />
            Zemin tam genişlik
          </label>
        </div>
      </div>
    </fieldset>
  );

  const m = footerRowColors(resolved.main, PREVIEW_TOKENS);
  const b = footerRowColors(resolved.bottom, PREVIEW_TOKENS);
  return (
    <section className="space-y-3 rounded-xl border border-[#E6E7EA] bg-white p-4 text-[12px] dark:border-[#23262E] dark:bg-[#15171C]">
      <div className="text-[13px] font-bold">Satır Stilleri</div>
      <p className="text-[11px] text-[#5F6570] dark:text-[#8C9099]">
        Footer üç satırdır: üst bant, orta satır (sütunlar) ve alt çubuk. Orta ve alt satırın zemini, boşluğu ve ayracı ayrı ayarlanır.
      </p>
      <div aria-hidden className="overflow-hidden rounded-lg border border-[#E6E7EA] text-[10px] dark:border-[#23262E]">
        <div className="px-3" style={{ background: m.background ?? "transparent", color: m.color ?? undefined, paddingBlock: Math.round(resolved.main.paddingY / 4) }}>
          Orta satır — sütunlar
        </div>
        <div
          className={`flex px-3 ${resolved.bottom.centered ? "justify-center" : "justify-between"}`}
          style={{ background: b.background ?? "transparent", color: b.color ?? undefined, paddingBlock: Math.round(resolved.bottom.paddingY / 4), borderTop: resolved.bottom.divider ? "1px solid rgba(128,128,128,.3)" : undefined }}
        >
          <span>© Telif</span>
          {resolved.bottom.centered ? null : <span>Gizlilik · KVKK</span>}
        </div>
      </div>
      <div className="grid gap-3 lg:grid-cols-2">
        {rowControls("main", "Orta satır", options.main ?? {}, 48)}
        {rowControls("bottom", "Alt çubuk", options.bottom ?? {}, 20)}
      </div>
      <div className="flex flex-wrap items-center gap-4 text-[11px] font-semibold">
        <label className="inline-flex items-center gap-1.5">
          Alt çubuk düzeni
          <select
            aria-label="Alt çubuk düzeni"
            className={`${fieldClass} !w-auto`}
            value={options.bottom?.layout ?? "split"}
            onChange={(e) => setRow("bottom", { layout: e.target.value as "split" | "centered" })}
          >
            <option value="split">Telif solda, bağlantılar sağda</option>
            <option value="centered">Ortalanmış</option>
          </select>
        </label>
        <label className="inline-flex items-center gap-1.5">
          Sütun boşluğu
          <select
            aria-label="Sütun boşluğu"
            className={`${fieldClass} !w-auto`}
            value={options.gap ?? "md"}
            onChange={(e) => onChange({ ...options, gap: e.target.value as "sm" | "md" | "lg" })}
          >
            <option value="sm">Dar</option>
            <option value="md">Orta</option>
            <option value="lg">Geniş</option>
          </select>
        </label>
        <label className="inline-flex items-center gap-1.5">
          Alt çubuk menüsü
          <select aria-label="Alt çubuk menüsü" className={`${fieldClass} !w-auto`} value={options.bottom?.menuId ?? ""} onChange={(e) => setRow("bottom", { menuId: e.target.value || undefined })}>
            <option value="">Yok</option>
            {menus.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
          </select>
        </label>
        <label className="inline-flex items-center gap-1.5">
          <input type="checkbox" checked={options.bottom?.backToTop === true} onChange={(e) => setRow("bottom", { backToTop: e.target.checked })} />
          &ldquo;Başa dön&rdquo; bağlantısı
        </label>
      </div>
      <div className="space-y-2 border-t border-[#E6E7EA] pt-3 dark:border-[#23262E]">
        <div className="text-[11px] font-semibold">Alt çubukta sosyal bağlantılar (yalnızca https)</div>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {FOOTER_SOCIAL_NETWORKS.map((id) => (
            <input
              key={id}
              type="url"
              aria-label={`${FOOTER_SOCIAL_LABEL[id]} adresi`}
              placeholder={`${FOOTER_SOCIAL_LABEL[id]} adresi (https://…)`}
              value={options.bottom?.socials?.[id] ?? ""}
              onChange={(e) => {
                const socials = { ...(options.bottom?.socials ?? {}), [id]: e.target.value };
                if (!e.target.value) delete socials[id];
                setRow("bottom", { socials });
              }}
              className={fieldClass}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

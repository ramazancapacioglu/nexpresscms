"use client";

import React from "react";
import Link from "next/link";
import { HEADER_WIDGET_META, type HeaderConfig, type HeaderWidgetId, type NavigationLink } from "@nexpress/core";
import { fieldClass } from "./appearance-ui";

export type HeaderBarName = "top" | "main" | "bottom";
export const BAR_LABEL: Record<HeaderBarName, string> = { top: "Üst şerit", main: "Ana şerit", bottom: "Alt şerit" };
export type BuilderSelection = { kind: "row"; bar: HeaderBarName } | { kind: "element"; bar: HeaderBarName; id: HeaderWidgetId };

const lab = "mb-1 block text-[11px] font-semibold text-[#5F6570] dark:text-[#8C9099]";

function Field({ label, value, onChange, placeholder, maxLength }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string; maxLength?: number }) {
  return (
    <label className="block">
      <span className={lab}>{label}</span>
      <input className={fieldClass} value={value} placeholder={placeholder} maxLength={maxLength} onChange={(e) => onChange(e.target.value)} />
    </label>
  );
}

function Note({ children }: { children: React.ReactNode }) {
  return <p className="text-[11px] leading-relaxed text-[#5F6570] dark:text-[#8C9099]">{children}</p>;
}

/** Seçili öğe veya şerit için ayar paneli. Her ayar ilgili öğenin kayıt alanına yazılır. */
export function HeaderElementSettings({ header, selection, onChange }: { header: HeaderConfig; selection: BuilderSelection | null; onChange: (next: HeaderConfig) => void }) {
  if (!selection) {
    return <Note>Düzenlemek için bir şeride veya içindeki öğeye tıklayın. Öğeleri sürükleyerek yerini, mobil geçişiyle küçük ekran düzenini değiştirin.</Note>;
  }
  const options = header.options ?? {};
  const setOptions = (patch: NonNullable<HeaderConfig["options"]>) => onChange({ ...header, options: { ...options, ...patch } });
  const setTop = (patch: Partial<HeaderConfig["topBar"]>) => onChange({ ...header, topBar: { ...header.topBar, ...patch } });
  const setMain = (patch: Partial<HeaderConfig["mainBar"]>) => onChange({ ...header, mainBar: { ...header.mainBar, ...patch } });
  const links = header.bottomBar.links ?? [];
  const setLinks = (next: NavigationLink[]) => onChange({ ...header, bottomBar: { ...header.bottomBar, links: next } });

  if (selection.kind === "row") {
    const bar = selection.bar;
    const cfg = bar === "top" ? header.topBar : bar === "main" ? header.mainBar : header.bottomBar;
    const setBar = (patch: { enabled?: boolean; sticky?: boolean; glassmorphism?: boolean }) =>
      onChange({ ...header, [bar === "top" ? "topBar" : bar === "main" ? "mainBar" : "bottomBar"]: { ...cfg, ...patch } });
    return (
      <div className="space-y-3">
        <div className="text-[12px] font-semibold">{BAR_LABEL[bar]}</div>
        <label className="flex items-center gap-2 text-[12px]">
          <input type="checkbox" checked={cfg.enabled} onChange={(e) => setBar({ enabled: e.target.checked })} /> Şeridi göster
        </label>
        {bar === "main" ? (
          <div className="flex flex-wrap gap-4 text-[12px]">
            <label className="inline-flex items-center gap-1.5"><input type="checkbox" checked={header.mainBar.sticky ?? false} onChange={(e) => setBar({ sticky: e.target.checked })} /> Sayfa kayarken üstte kalsın</label>
            <label className="inline-flex items-center gap-1.5"><input type="checkbox" checked={header.mainBar.glassmorphism ?? false} onChange={(e) => setBar({ glassmorphism: e.target.checked })} /> Buzlu cam yüzey</label>
          </div>
        ) : null}
        <Note>Şerit yüksekliği, logo görseli ve renkler <Link href="/admin/themes/customize" className="font-medium text-blue-600 hover:underline">Özelleştirici</Link> sekmesindedir.</Note>
      </div>
    );
  }

  const id = selection.id;
  const meta = HEADER_WIDGET_META[id];
  let body: React.ReactNode;
  switch (id) {
    case "cta":
      body = (
        <>
          <Field label="Düğme yazısı" value={header.mainBar.ctaLabel ?? ""} placeholder="Teklif alın" maxLength={40} onChange={(v) => setMain({ ctaLabel: v })} />
          <Field label="Adres" value={header.mainBar.ctaHref ?? ""} placeholder="/iletisim" onChange={(v) => setMain({ ctaHref: v })} />
          <label className="block">
            <span className={lab}>Biçim</span>
            <select className={fieldClass} value={options.ctaStyle ?? "solid"} onChange={(e) => setOptions({ ctaStyle: e.target.value as "solid" | "outline" | "ghost" })}>
              <option value="solid">Dolu</option>
              <option value="outline">Çerçeveli</option>
              <option value="ghost">Yalın yazı</option>
            </select>
          </label>
          <Note>Yönetim adresi (/admin) ziyaretçiye gösterilmez. Yazı veya adres boşsa düğme çizilmez.</Note>
        </>
      );
      break;
    case "button2":
      body = (
        <>
          <Field label="Düğme yazısı" value={options.secondaryLabel ?? ""} maxLength={40} onChange={(v) => setOptions({ secondaryLabel: v })} />
          <Field label="Adres" value={options.secondaryHref ?? ""} placeholder="/hakkimizda" onChange={(v) => setOptions({ secondaryHref: v })} />
        </>
      );
      break;
    case "phone":
    case "email":
    case "contact":
      body = (
        <>
          {id !== "email" ? <Field label="Telefon" value={header.topBar.contactPhone ?? ""} placeholder="+90 …" onChange={(v) => setTop({ contactPhone: v })} /> : null}
          {id !== "phone" ? <Field label="E-posta" value={header.topBar.contactEmail ?? ""} placeholder="bilgi@…" onChange={(v) => setTop({ contactEmail: v })} /> : null}
          <Note>İletişim bilgisi tek yerde tutulur; telefon, e-posta ve iletişim öğeleri aynı değeri kullanır.</Note>
        </>
      );
      break;
    case "announcement":
      body = <Field label="Duyuru metni" value={header.topBar.announcementText ?? ""} maxLength={160} onChange={(v) => setTop({ announcementText: v })} />;
      break;
    case "html":
      body = <Field label="Metin" value={options.htmlText ?? ""} maxLength={160} onChange={(v) => setOptions({ htmlText: v })} />;
      break;
    case "links":
      body = (
        <div className="space-y-2">
          {links.map((link) => (
            <div key={link.id} className="grid grid-cols-[1fr_1fr_auto] gap-2">
              <input aria-label="Bağlantı yazısı" className={fieldClass} value={link.label} onChange={(e) => setLinks(links.map((row) => (row.id === link.id ? { ...row, label: e.target.value } : row)))} />
              <input aria-label="Bağlantı adresi" className={fieldClass} value={link.href} onChange={(e) => setLinks(links.map((row) => (row.id === link.id ? { ...row, href: e.target.value } : row)))} />
              <button type="button" className="text-[11px] text-[#5F6570]" onClick={() => setLinks(links.filter((row) => row.id !== link.id))}>Sil</button>
            </div>
          ))}
          <button type="button" className="text-[11px] font-medium text-blue-600 hover:underline" onClick={() => setLinks([...links, { id: `bl_${Date.now()}`, label: "Bağlantı", href: "/" }])}>+ Bağlantı ekle</button>
        </div>
      );
      break;
    case "menu":
      body = <Note>Ana menü <Link href="/admin/appearance/menus" className="font-medium text-blue-600 hover:underline">Menüler</Link> sekmesinde düzenlenir (alt menü ve mega menü dahil).</Note>;
      break;
    case "logo":
      body = <Note>Site adı, logo görseli ve boyutu <Link href="/admin/themes/customize" className="font-medium text-blue-600 hover:underline">Özelleştirici</Link> sekmesindedir.</Note>;
      break;
    case "social":
      body = <Note>Adresler <Link href="/admin/seo/settings" className="font-medium text-blue-600 hover:underline">SEO ayarlarındaki</Link> kuruluş profilleri (sameAs) listesinden gelir. Yalnızca https adresleri gösterilir.</Note>;
      break;
    default:
      body = <Note>Bu öğenin ek ayarı yok.</Note>;
  }
  return (
    <div className="space-y-3">
      <div>
        <div className="text-[12px] font-semibold">{meta.label}</div>
        <div className="text-[11px] text-[#5F6570] dark:text-[#8C9099]">{meta.hint}</div>
      </div>
      {body}
    </div>
  );
}

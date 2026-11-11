"use client";

import type { PageOptions } from "@nexpress/core";
import { useStudioInspector } from "./studio-inspector-context";

const select = "mt-1 h-8 w-full rounded border border-border bg-background px-2 text-[11px]";
const card = "space-y-2.5 rounded-lg border border-border p-3";
const head = "text-[11px] font-semibold uppercase tracking-wider text-muted-foreground";

/**
 * Sayfa görünümü (yalnızca bu sayfa): header, footer, genişlik, başlık, boşluk ve kenar çubuğu.
 * Değerler `schemaAttributes._page` altına yazılır; "Site ayarı" seçili alanlar sitenin genel ayarını izler.
 */
export function PageLookTab() {
  const { pageOptions: o, setPageOptions, templateId } = useStudioInspector();
  const set = (patch: Partial<PageOptions>) => setPageOptions((prev) => ({ ...prev, ...patch }));
  return (
    <div className="space-y-4 text-[12px]">
      <div className={card}>
        <div className={head}>Header</div>
        <label className="block">
          Görünüm
          <select aria-label="Header görünümü" value={o.header} onChange={(e) => set({ header: e.target.value as PageOptions["header"] })} className={select}>
            <option value="default">Site ayarı</option>
            <option value="transparent">Şeffaf (içeriğin üstüne biner)</option>
            <option value="hidden">Gizli</option>
          </select>
        </label>
        {o.header === "transparent" ? (
          <label className="block">
            Yazı rengi
            <select aria-label="Şeffaf header yazı rengi" value={o.headerTone} onChange={(e) => set({ headerTone: e.target.value as PageOptions["headerTone"] })} className={select}>
              <option value="light">Açık (koyu zemin üstünde)</option>
              <option value="dark">Koyu (açık zemin üstünde)</option>
            </select>
          </label>
        ) : null}
        {o.header === "transparent" ? <p className="text-[11px] text-muted-foreground">Sayfanın ilk bölümü header'ın altına uzanır; okunur olması için zemin rengiyle uyumlu yazı rengini seçin.</p> : null}
      </div>

      <div className={card}>
        <div className={head}>İçerik alanı</div>
        <label className="block">
          Genişlik
          <select aria-label="İçerik genişliği" value={o.width} onChange={(e) => set({ width: e.target.value as PageOptions["width"] })} className={select}>
            <option value="default">Site ayarı</option>
            <option value="narrow">Dar (760 px)</option>
            <option value="wide">Geniş (1440 px)</option>
            <option value="full">Tam genişlik</option>
          </select>
        </label>
        <label className="block">
          Kenar çubuğu
          <select aria-label="Kenar çubuğu" value={o.sidebar} onChange={(e) => set({ sidebar: e.target.value as PageOptions["sidebar"] })} className={select}>
            <option value="default">Site ayarı</option>
            <option value="none">Yok</option>
            <option value="left">Solda</option>
            <option value="right">Sağda</option>
          </select>
        </label>
        <label className="flex cursor-pointer items-center justify-between">
          <span>Üst ve alt boşluğu kaldır</span>
          <input type="checkbox" checked={o.flush} onChange={(e) => set({ flush: e.target.checked })} />
        </label>
        <label className="flex cursor-pointer items-center justify-between">
          <span>Sayfa başlığını gizle</span>
          <input type="checkbox" checked={o.hideTitle} onChange={(e) => set({ hideTitle: e.target.checked })} />
        </label>
        {o.hideTitle ? <p className="text-[11px] text-muted-foreground">Başlık yalnızca ekran okuyucu ve arama motorları için kalır (h1 silinmez). Yerleşik makale düzeninde çalışır; şablonlu sayfada şablondaki başlık bloğunu kaldırın.</p> : null}
        {templateId ? <p className="text-[11px] text-amber-700 dark:text-amber-400">Bu sayfa bir şablon kullanıyor: başlık ve kenar çubuğu şablondan gelir.</p> : null}
      </div>

      <div className={card}>
        <div className={head}>Footer</div>
        <label className="flex cursor-pointer items-center justify-between">
          <span>Footer'ı gizle</span>
          <input type="checkbox" checked={o.footer === "hidden"} onChange={(e) => set({ footer: e.target.checked ? "hidden" : "default" })} />
        </label>
        <p className="text-[11px] text-muted-foreground">Açılış (landing) sayfalarında dikkat dağıtmayan bir bitiş için.</p>
      </div>
    </div>
  );
}

"use client";

import React from "react";
import {
  AlignLeft,
  AlignCenter,
  AlignRight,
  Maximize2,
  Link2,
  Image as ImageIcon,
} from "lucide-react";
import { useStudioInspector } from "./studio-inspector-context";

export function BlockGeneralImageAndMediaFields() {
  const {
    selectedBlock,
    updateSelectedBlockProps,
    setMediaPickerTarget,
  } = useStudioInspector();

  if (!selectedBlock) return null;

  if (selectedBlock.type === "media_file") {
    return (
      <div className="space-y-2.5">
        <button
          type="button"
          onClick={() => setMediaPickerTarget("block_media")}
          className="w-full rounded-md border border-blue-500/40 bg-blue-500/10 py-1.5 text-xs font-semibold text-blue-600"
        >
          Kitaplıktan PDF / Video / Ses Seç veya Yükle
        </button>
        <p className="text-[11px] text-muted-foreground">
          {selectedBlock.props.url
            ? `Seçili: ${String(selectedBlock.props.kind ?? "dosya")} — ${String(selectedBlock.props.url)}`
            : "Henüz dosya seçilmedi; blok sayfada görünmez."}
        </p>
        <div>
          <label className="block text-[11px] text-muted-foreground mb-1">
            Başlık (bağlantı metni ve şema adı)
          </label>
          <input
            aria-label="Medya başlığı"
            type="text"
            value={String(selectedBlock.props.title ?? "")}
            onChange={(e) =>
              updateSelectedBlockProps({ title: e.target.value })
            }
            className="h-8 w-full rounded border border-border bg-background px-2"
          />
        </div>
        <div>
          <label className="block text-[11px] text-muted-foreground mb-1">
            Açıklama
          </label>
          <textarea
            aria-label="Medya açıklaması"
            rows={3}
            value={String(selectedBlock.props.description ?? "")}
            onChange={(e) =>
              updateSelectedBlockProps({ description: e.target.value })
            }
            className="w-full rounded border border-border bg-background p-2"
          />
        </div>
      </div>
    );
  }

  if (selectedBlock.type !== "image_figure") return null;

  return (
    <div className="space-y-4">
      {/* Medya Seçici Butonu */}
      <button
        type="button"
        onClick={() => setMediaPickerTarget("block_image")}
        className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-blue-500/40 bg-blue-500/10 py-2 text-xs font-bold text-blue-600 transition hover:bg-blue-500/20"
      >
        <ImageIcon className="h-4 w-4" />
        <span>Medya Kütüphanesinden Görsel Seç</span>
      </button>

      {/* Görsel Ölçeklendirme ve Boyut */}
      <div className="space-y-3 rounded-xl border border-border bg-muted/20 p-3">
        <div className="text-[11px] font-bold text-foreground">
          Görsel Ölçeklendirme & Boyut
        </div>

        {/* Hızlı Yüzde Butonları */}
        <div>
          <label className="mb-1 block text-[10px] text-muted-foreground">
            Hızlı Ölçek
          </label>
          <div className="grid grid-cols-4 gap-1">
            {(["25%", "50%", "75%", "100%"] as const).map((pct) => {
              const currentWidth = String(selectedBlock.props.width ?? "100%");
              const isActive = currentWidth === pct;
              return (
                <button
                  key={pct}
                  type="button"
                  onClick={() => updateSelectedBlockProps({ width: pct })}
                  className={`rounded py-1 text-xs font-bold transition ${
                    isActive
                      ? "bg-blue-600 text-white shadow-xs"
                      : "border border-border bg-background text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {pct}
                </button>
              );
            })}
          </div>
        </div>

        {/* Genişlik Slider'ı */}
        <div>
          <div className="mb-1 flex items-center justify-between text-[10px] text-muted-foreground">
            <span>Özel Genişlik</span>
            <span className="font-mono font-bold text-foreground">
              {String(selectedBlock.props.width ?? "100%")}
            </span>
          </div>
          <input
            type="range"
            min="10"
            max="100"
            step="5"
            value={
              String(selectedBlock.props.width ?? "100%").endsWith("%")
                ? parseInt(String(selectedBlock.props.width ?? "100%"), 10) ||
                  100
                : 100
            }
            onChange={(e) =>
              updateSelectedBlockProps({ width: `${e.target.value}%` })
            }
            className="h-1.5 w-full cursor-pointer appearance-none rounded-lg bg-border accent-blue-600"
          />
        </div>

        {/* Hizalama */}
        <div>
          <label className="mb-1 block text-[10px] text-muted-foreground">
            Hizalama
          </label>
          <div className="grid grid-cols-4 gap-1">
            {(
              [
                ["left", "Sol", AlignLeft],
                ["center", "Orta", AlignCenter],
                ["right", "Sağ", AlignRight],
                ["full", "Tam", Maximize2],
              ] as const
            ).map(([a, label, Icon]) => {
              const currentAlign = String(selectedBlock.props.align ?? "left");
              const isActive = currentAlign === a;
              return (
                <button
                  key={a}
                  type="button"
                  onClick={() => {
                    updateSelectedBlockProps({ align: a });
                    if (a === "full")
                      updateSelectedBlockProps({ width: "100%" });
                  }}
                  className={`flex items-center justify-center gap-1 rounded py-1 text-[11px] font-semibold transition ${
                    isActive
                      ? "bg-blue-600 text-white shadow-xs"
                      : "border border-border bg-background text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Icon className="h-3 w-3" />
                  <span>{label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* En-Boy Oranı (Aspect Ratio) */}
        <div>
          <label className="mb-1 block text-[10px] text-muted-foreground">
            En-Boy Oranı (Aspect Ratio)
          </label>
          <select
            aria-label="En-boy oranı"
            value={String(selectedBlock.props.aspectRatio ?? "auto")}
            onChange={(e) =>
              updateSelectedBlockProps({ aspectRatio: e.target.value })
            }
            className="h-8 w-full rounded border border-border bg-background px-2 text-xs"
          >
            <option value="auto">Orijinal (Otomatik En-Boy)</option>
            <option value="1:1">1:1 (Kare Görsel)</option>
            <option value="4:3">4:3 (Standart Fotoğraf)</option>
            <option value="16:9">16:9 (Geniş Ekran Sinema)</option>
            <option value="3:2">3:2 (Klasik Kadraj)</option>
            <option value="21:9">21:9 (Ultra Geniş)</option>
            <option value="9:16">9:16 (Dikey Story / Reels)</option>
          </select>
        </div>

        {/* Nesne Sığdırma (Object Fit) */}
        <div>
          <label className="mb-1 block text-[10px] text-muted-foreground">
            Sığdırma Modu (Object Fit)
          </label>
          <select
            aria-label="Sığdırma modu"
            value={String(selectedBlock.props.objectFit ?? "cover")}
            onChange={(e) =>
              updateSelectedBlockProps({ objectFit: e.target.value })
            }
            className="h-8 w-full rounded border border-border bg-background px-2 text-xs"
          >
            <option value="cover">Alanı Doldur & Kırp (cover)</option>
            <option value="contain">Bozmadan Tam Sığdır (contain)</option>
            <option value="fill">Alana Yay / Uzat (fill)</option>
            <option value="scale-down">Gerekirse Küçült (scale-down)</option>
            <option value="none">Orijinal Boyut (none)</option>
          </select>
        </div>

        {/* Köşe Yuvarlama (Border Radius) */}
        <div>
          <label className="mb-1 block text-[10px] text-muted-foreground">
            Köşe Yuvarlama
          </label>
          <div className="grid grid-cols-5 gap-1">
            {(
              [
                ["none", "0"],
                ["sm", "Hafif"],
                ["md", "Orta"],
                ["lg", "Geniş"],
                ["full", "Oval"],
              ] as const
            ).map(([r, label]) => {
              const currentRadius = String(
                selectedBlock.props.borderRadius ?? "md"
              );
              const isActive = currentRadius === r;
              return (
                <button
                  key={r}
                  type="button"
                  onClick={() => updateSelectedBlockProps({ borderRadius: r })}
                  className={`rounded py-1 text-[10px] font-semibold transition ${
                    isActive
                      ? "bg-blue-600 text-white shadow-xs"
                      : "border border-border bg-background text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Gölge */}
        <div>
          <label className="mb-1 block text-[10px] text-muted-foreground">
            Gölge
          </label>
          <div className="grid grid-cols-4 gap-1">
            {(
              [
                ["none", "Yok"],
                ["sm", "Hafif"],
                ["md", "Orta"],
                ["lg", "Belirgin"],
              ] as const
            ).map(([sh, label]) => {
              const currentShadow = String(
                selectedBlock.props.shadow ?? "none"
              );
              const isActive = currentShadow === sh;
              return (
                <button
                  key={sh}
                  type="button"
                  onClick={() => updateSelectedBlockProps({ shadow: sh })}
                  className={`rounded py-1 text-[10px] font-semibold transition ${
                    isActive
                      ? "bg-blue-600 text-white shadow-xs"
                      : "border border-border bg-background text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Tıklama Bağlantısı (Link) */}
        <div>
          <label className="mb-1 block text-[10px] text-muted-foreground">
            Görsel Bağlantısı (URL)
          </label>
          <div className="relative">
            <Link2 className="absolute left-2.5 top-2.5 h-3 w-3 text-muted-foreground" />
            <input
              type="text"
              placeholder="https://... veya /sayfa"
              value={String(selectedBlock.props.link ?? "")}
              onChange={(e) =>
                updateSelectedBlockProps({ link: e.target.value })
              }
              className="h-8 w-full rounded border border-border bg-background pl-7 pr-2 text-xs"
            />
          </div>
          {Boolean(selectedBlock.props.link) && (
            <label className="mt-1.5 flex items-center gap-1.5 cursor-pointer text-[10px] text-muted-foreground">
              <input
                type="checkbox"
                checked={selectedBlock.props.linkTarget === "_blank"}
                onChange={(e) =>
                  updateSelectedBlockProps({
                    linkTarget: e.target.checked ? "_blank" : "_self",
                  })
                }
                className="rounded border-border text-blue-600"
              />
              <span>Yeni sekmede aç</span>
            </label>
          )}
        </div>
      </div>

      {/* SEO & METADATA ALANLARI */}
      <div className="space-y-2.5 rounded-xl border border-border bg-muted/10 p-3">
        <div className="text-[11px] font-bold text-foreground">
          Görsel SEO & Erişilebilirlik
        </div>
        <div>
          <label className="mb-1 block text-[10px] text-muted-foreground">
            Görsel URL
          </label>
          <input
            aria-label="Görsel URL"
            type="text"
            value={String(selectedBlock.props.url ?? "")}
            onChange={(e) => updateSelectedBlockProps({ url: e.target.value })}
            className="h-8 w-full rounded border border-border bg-background px-2 font-mono text-xs"
          />
        </div>
        <div>
          <label className="mb-1 block text-[10px] text-muted-foreground">
            Alt Metni (Zorunlu Görsel SEO)
          </label>
          <input
            aria-label="Alt Metni (Zorunlu Görsel SEO)"
            type="text"
            value={String(selectedBlock.props.altText ?? "")}
            onChange={(e) =>
              updateSelectedBlockProps({
                altText: e.target.value,
              })
            }
            className="h-8 w-full rounded border border-border bg-background px-2 text-xs"
          />
        </div>
        <div>
          <label className="mb-1 block text-[10px] text-muted-foreground">
            Başlık (title özniteliği)
          </label>
          <input
            aria-label="Görsel başlığı (title)"
            type="text"
            value={String(selectedBlock.props.titleText ?? "")}
            onChange={(e) =>
              updateSelectedBlockProps({ titleText: e.target.value })
            }
            className="h-8 w-full rounded border border-border bg-background px-2 text-xs"
          />
        </div>
        <div>
          <label className="mb-1 block text-[10px] text-muted-foreground">
            Görsel Altı Açıklama (Figcaption)
          </label>
          <input
            aria-label="Görsel Altı Açıklama (Figcaption)"
            type="text"
            value={String(selectedBlock.props.caption ?? "")}
            onChange={(e) =>
              updateSelectedBlockProps({
                caption: e.target.value,
              })
            }
            className="h-8 w-full rounded border border-border bg-background px-2 text-xs"
          />
        </div>
      </div>
    </div>
  );
}


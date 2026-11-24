"use client";

import { useStudioInspector } from "./studio-inspector-context";

/** Medya sekmesi: Öne çıkan görsel ve alt metin ayarları (Üst sayfa ve Yorum ayarları Yayın sekmesindedir). */
export function EngageTab() {
  const {
    setMediaPickerTarget,
    title,
    featuredImageUrl,
    setFeaturedImageUrl,
    featuredImageAlt,
    setFeaturedImageAlt,
    showFeaturedImage,
    setShowFeaturedImage,
  } = useStudioInspector();

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-border p-3 space-y-2.5">
        <div className="font-semibold text-[11px] uppercase tracking-wider text-muted-foreground">
          Öne Çıkan Görsel (Featured Image & SEO)
        </div>
        {featuredImageUrl ? (
          <img
            src={featuredImageUrl}
            alt={featuredImageAlt || title}
            className="h-36 w-full rounded-lg border border-border object-cover"
          />
        ) : null}
        <button
          type="button"
          onClick={() => setMediaPickerTarget("featured")}
          className="w-full rounded-md border border-blue-500/40 bg-blue-500/10 py-1.5 text-xs font-semibold text-blue-600 hover:bg-blue-500/15 transition"
        >
          Medya Kütüphanesinden Seç / Yükle
        </button>
        <input
          type="text"
          value={featuredImageUrl}
          onChange={(e) => setFeaturedImageUrl(e.target.value)}
          placeholder="Görsel URL..."
          className="h-8 w-full rounded border border-border bg-background px-2 font-mono text-[11px]"
        />
        <input
          type="text"
          value={featuredImageAlt}
          onChange={(e) => setFeaturedImageAlt(e.target.value)}
          placeholder="Görsel Alt Metni (Alt Text — SEO Zorunlu)..."
          className="h-8 w-full rounded border border-border bg-background px-2 text-[11px]"
        />
        <label className="flex items-center justify-between cursor-pointer text-xs">
          <span>Sayfa içinde göster</span>
          <input
            type="checkbox"
            checked={showFeaturedImage}
            onChange={(e) => setShowFeaturedImage(e.target.checked)}
          />
        </label>
      </div>
    </div>
  );
}

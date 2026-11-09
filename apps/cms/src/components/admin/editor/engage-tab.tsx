"use client";

import { useStudioInspector } from "./studio-inspector-context";

export function EngageTab() {
  const {
    setMediaPickerTarget,
    title,
    featuredImageUrl,
    setFeaturedImageUrl,
    featuredImageAlt,
    setFeaturedImageAlt,
    allowComments,
    setAllowComments,
    allowReviews,
    setAllowReviews,
    showShareButtons,
    setShowShareButtons,
    showFeaturedImage,
    setShowFeaturedImage,
    parentId,
    setParentId,
    pillar,
    setPillar,
    pageChoices,
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
                        className="h-32 w-full rounded-lg border border-border object-cover"
                      />
                    ) : null}
                    <button
                      type="button"
                      onClick={() => setMediaPickerTarget("featured")}
                      className="w-full rounded-md border border-blue-500/40 bg-blue-500/10 py-1.5 text-xs font-semibold text-blue-600"
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
                    <label className="flex items-center justify-between cursor-pointer">
                      <span>Sayfa içinde göster</span>
                      <input type="checkbox" checked={showFeaturedImage} onChange={(e) => setShowFeaturedImage(e.target.checked)} />
                    </label>
                  </div>

                  <div className="rounded-lg border border-border p-3 space-y-2.5">
                    <div className="font-semibold text-[11px] uppercase tracking-wider text-muted-foreground">Üst sayfa ve sütun</div>
                    <label className="block text-[11px]">
                      Üst sayfa
                      <select value={parentId} onChange={(e) => setParentId(e.target.value)} className="mt-1 h-8 w-full rounded border border-border bg-background px-2 text-[11px]">
                        <option value="">Yok</option>
                        {pageChoices.map((page) => <option key={page.id} value={page.id}>{page.title}</option>)}
                      </select>
                    </label>
                    <label className="flex items-center justify-between cursor-pointer">
                      <span>Sütun içerik (alt sayfalar listelenir)</span>
                      <input type="checkbox" checked={pillar} onChange={(e) => setPillar(e.target.checked)} />
                    </label>
                  </div>

                  <div className="rounded-lg border border-border p-3 space-y-2.5">
                    <div className="font-semibold text-[11px] uppercase tracking-wider text-muted-foreground">
                      Yorum, İnceleme & Sosyal Paylaşım
                    </div>
                    <label className="flex items-center justify-between cursor-pointer">
                      <span>Ziyaretçi Yorumlarına İzin Ver</span>
                      <input
                        type="checkbox"
                        checked={allowComments}
                        onChange={(e) => setAllowComments(e.target.checked)}
                      />
                    </label>
                    <label className="flex items-center justify-between cursor-pointer">
                      <span>Yıldızlı Değerlendirme & Pros/Cons</span>
                      <input
                        type="checkbox"
                        checked={allowReviews}
                        onChange={(e) => setAllowReviews(e.target.checked)}
                      />
                    </label>
                    <label className="flex items-center justify-between cursor-pointer">
                      <span>Sosyal & AI Paylaşım Çubuğu</span>
                      <input
                        type="checkbox"
                        checked={showShareButtons}
                        onChange={(e) => setShowShareButtons(e.target.checked)}
                      />
                    </label>
                  </div>
                </div>
  );
}

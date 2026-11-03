"use client";

import { normalizeDynamicQuery } from "@nexpress/core";
import { useStudioInspector } from "./studio-inspector-context";

const box = "h-8 w-full rounded border border-border bg-background px-2 text-[12px]";
const cap = "mb-1 block text-[11px] text-muted-foreground";

/** Dinamik liste (sorgu döngüsü) bloğunun alanları. Liste ziyaretçiye her istekte güncel veriden çizilir; Markdown önbelleğine girmez. */
export function DynamicListFields() {
  const { selectedBlock, updateSelectedBlockProps, flatCategoryTree, tags } = useStudioInspector();
  if (!selectedBlock) return null;
  const q = normalizeDynamicQuery(selectedBlock.props);
  const set = (patch: Record<string, unknown>) => updateSelectedBlockProps(patch);
  const terms = { cats: flatCategoryTree, tags };
  return (
    <div className="space-y-2.5">
      <p className="rounded bg-blue-500/10 p-2 text-[11px] leading-snug">Bu blok yayın anında seçtiğiniz kurala uyan içerikleri otomatik listeler; yeni içerik eklendiğinde kendiliğinden güncellenir. Yalnızca herkese açık ve dizine açık içerikler girer.</p>
      <div><label className={cap} htmlFor="dl-heading">Başlık (isteğe bağlı)</label><input id="dl-heading" className={box} value={q.heading} maxLength={100} onChange={(e) => set({ heading: e.target.value })} placeholder="Son yazılar" /></div>
      <div className="grid grid-cols-2 gap-2">
        <div><label className={cap} htmlFor="dl-source">Ne listelensin</label>
          <select id="dl-source" className={box} value={q.source} onChange={(e) => set({ source: e.target.value, category: "", tag: "" })}>
            <option value="posts">Yazılar</option><option value="pages">Sayfalar</option><option value="products">Ürünler</option>
          </select></div>
        <div><label className={cap} htmlFor="dl-order">Sıralama</label>
          <select id="dl-order" className={box} value={q.orderBy} onChange={(e) => set({ orderBy: e.target.value })}>
            <option value="newest">En yeni</option><option value="oldest">En eski</option><option value="title">Başlığa göre</option>
          </select></div>
      </div>
      {q.source !== "products" && (
        <div className="grid grid-cols-2 gap-2">
          <div><label className={cap} htmlFor="dl-cat">Kategori</label>
            <select id="dl-cat" className={box} value={q.category} onChange={(e) => set({ category: e.target.value })}>
              <option value="">Hepsi</option>{terms.cats.map((c) => <option key={c.id} value={c.slug}>{"— ".repeat(c.depth)}{c.name}</option>)}
            </select></div>
          <div><label className={cap} htmlFor="dl-tag">Etiket</label>
            <select id="dl-tag" className={box} value={q.tag} onChange={(e) => set({ tag: e.target.value })}>
              <option value="">Hepsi</option>{terms.tags.map((c) => <option key={c.id} value={c.slug}>{c.name}</option>)}
            </select></div>
        </div>
      )}
      <div className="grid grid-cols-3 gap-2">
        <div><label className={cap} htmlFor="dl-limit">Adet (1–24)</label><input id="dl-limit" type="number" min={1} max={24} className={box} value={q.limit} onChange={(e) => set({ limit: Number(e.target.value) })} /></div>
        <div><label className={cap} htmlFor="dl-layout">Görünüm</label>
          <select id="dl-layout" className={box} value={q.layout} onChange={(e) => set({ layout: e.target.value })}><option value="cards">Kartlar</option><option value="list">Liste</option><option value="carousel">Atlıkarınca</option></select></div>
        <div><label className={cap} htmlFor="dl-cols">Sütun</label>
          <select id="dl-cols" className={box} value={q.columns} disabled={q.layout === "list"} onChange={(e) => set({ columns: Number(e.target.value) })}>{[1, 2, 3, 4].map((n) => <option key={n} value={n}>{n}</option>)}</select></div>
      </div>
      <div>
        <label className={cap} htmlFor="dl-card">Kart görünümü</label>
        <select id="dl-card" className={box} value={q.cardStyle} disabled={q.layout === "list"} onChange={(e) => set({ cardStyle: e.target.value })}>
          <option value="default">Klasik (çerçeveli)</option><option value="minimal">Sade (çerçevesiz)</option><option value="overlay">Görsel üstünde metin</option><option value="featured">İlk kart büyük</option>
        </select>
      </div>
      <div className="space-y-1 text-[12px]">
        <label className="flex items-center gap-2"><input type="checkbox" checked={q.showImage} onChange={(e) => set({ showImage: e.target.checked })} /> Görsel göster</label>
        <label className="flex items-center gap-2"><input type="checkbox" checked={q.showExcerpt} onChange={(e) => set({ showExcerpt: e.target.checked })} /> Özet göster</label>
        <label className="flex items-center gap-2"><input type="checkbox" checked={q.showDate} onChange={(e) => set({ showDate: e.target.checked })} /> Tarih göster</label>
        <label className="flex items-center gap-2"><input type="checkbox" checked={q.showSearch} onChange={(e) => set({ showSearch: e.target.checked })} /> Arama kutusu (ziyaretçi için)</label>
        <label className="flex items-center gap-2"><input type="checkbox" checked={q.showSort} onChange={(e) => set({ showSort: e.target.checked })} /> Sıralama seçimi</label>
        <label className="flex items-center gap-2"><input type="checkbox" checked={q.showFilters} onChange={(e) => set({ showFilters: e.target.checked })} /> Kategori süzgeci</label>
        {q.source === "products" && <label className="flex items-center gap-2"><input type="checkbox" checked={q.showPriceFilter} onChange={(e) => set({ showPriceFilter: e.target.checked })} /> Fiyat aralığı süzgeci</label>}
        <label className="flex items-center gap-2"><input type="checkbox" checked={q.paginate} onChange={(e) => set({ paginate: e.target.checked })} /> Sayfalama (adet = sayfa başına)</label>
        <label className="flex items-center gap-2"><input type="checkbox" checked={q.excludeCurrent} onChange={(e) => set({ excludeCurrent: e.target.checked })} /> Bu sayfayı listeden çıkar (ilgili içerikler için)</label>
      </div>
      <div><label className={cap} htmlFor="dl-empty">Hiç sonuç yoksa gösterilecek not (boşsa blok görünmez)</label><input id="dl-empty" className={box} value={q.emptyText} maxLength={160} onChange={(e) => set({ emptyText: e.target.value })} /></div>
    </div>
  );
}

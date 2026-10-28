import { taxonomyPath } from "@nexpress/core";
import { CornerDownRight, Edit3, Image as ImageIcon, Plus, Search, Sparkles, Trash2, X } from "lucide-react";
import type { TaxonomyStudioState } from "./use-taxonomy-studio";

/** İki Sütunlu Çalışma Alanı: Sol Form (Ekle / Düzenle + Görsel + SEO) & Sağ Hiyerarşik Ağaç Tablosu */
export function TaxonomyStudioWorkspace({ s }: { s: TaxonomyStudioState }) {
  const { isPending, items, activeType, searchQuery, setSearchQuery, editingId, name, setName, slug, setSlug, parentId, setParentId, imageUrl, setImageUrl, sortOrder, setSortOrder, color, setColor, description, setDescription, seoTitle, setSeoTitle, seoDescription, setSeoDescription, setMediaModalOpen, flatCategoryTree, forbiddenParentIds, displayedList, resetForm, handleStartEdit, handleStartAddChild, handleSave, handleDelete } = s;
  return (
    <>
      {/* İki Sütunlu Çalışma Alanı: Sol Form (Ekle / Düzenle + Görsel + SEO) & Sağ Hiyerarşik Ağaç Tablosu */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
        {/* SOL SÜTUN: EKLE / DÜZENLE FORMU (4 Sütun) */}
        <form
          onSubmit={handleSave}
          className="lg:col-span-4 rounded-xl border border-border bg-card p-4 shadow-2xs space-y-3.5 self-start"
        >
          <div className="flex items-center justify-between border-b border-border pb-2.5">
            <div className="flex items-center gap-2">
              <span
                className={`inline-flex h-6 w-6 items-center justify-center rounded-md text-xs font-bold text-white ${
                  editingId ? "bg-amber-600" : "bg-blue-600"
                }`}
              >
                {editingId ? <Edit3 className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
              </span>
              <span className="text-xs font-bold text-foreground">
                {editingId
                  ? `${activeType === "category" ? "Kategoriyi" : "Etiketi"} Düzenle`
                  : `Yeni ${activeType === "category" ? "Kategori (Üst / Alt)" : "Etiket"} Oluştur`}
              </span>
            </div>
            {editingId && (
              <button
                type="button"
                onClick={() => resetForm()}
                className="inline-flex items-center gap-1 rounded border border-border px-2 py-0.5 text-[10px] font-medium text-muted-foreground hover:text-foreground"
              >
                <X className="h-3 w-3" /> Yeni Moda Geç
              </button>
            )}
          </div>

          <div className="space-y-2.5 text-xs">
            <div>
              <label className="block text-[11px] font-semibold mb-1">
                {activeType === "category" ? "Kategori Adı *" : "Etiket Adı *"}
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (!editingId) {
                    setSlug(
                      e.target.value
                        .toLowerCase()
                        .replace(/[^a-z0-9ğüşıöç\s-]/g, "")
                        .replace(/\s+/g, "-")
                    );
                  }
                }}
                placeholder="Örn: Bulut Mimarisi"
                className="h-8 w-full rounded-md border border-border bg-background px-2.5"
              />
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div className="col-span-2">
                <label className="block text-[11px] font-semibold mb-1">
                  Kalıcı Bağlantı (Slug)
                </label>
                <input aria-label="Kalıcı Bağlantı (Slug)"
                  type="text"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  placeholder="bulut-mimarisi"
                  className="h-8 w-full rounded-md border border-border bg-background px-2.5 font-mono text-[11px]"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold mb-1">
                  Sıra No
                </label>
                <input aria-label="Sıra No"
                  type="number"
                  value={sortOrder}
                  onChange={(e) => setSortOrder(Number(e.target.value))}
                  className="h-8 w-full rounded-md border border-border bg-background px-2 font-mono"
                />
              </div>
            </div>

            {/* SADECE KATEGORİLER İÇİN: EBEVEYN (PARENT) SEÇİMİ */}
            {activeType === "category" && (
              <div>
                <label className="block text-[11px] font-semibold mb-1">
                  Üst Kategori (Parent — Ağaç Kırılımı)
                </label>
                <select
                  aria-label="Üst kategori"
                  value={parentId}
                  onChange={(e) => setParentId(e.target.value)}
                  className="h-8 w-full rounded-md border border-border bg-background px-2 text-xs"
                >
                  <option value="">— Ana Kategori (Kök Düzey) —</option>
                  {flatCategoryTree
                    .filter((c) => !forbiddenParentIds.has(c.id))
                    .map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {"— ".repeat(cat.depth)}
                        {cat.name}
                      </option>
                    ))}
                </select>
              </div>
            )}

            {/* KATEGORİ GÖRSELİ (IMAGE URL + MEDYA KÜTÜPHANESİ SEÇİCİ) */}
            <div className="rounded-lg border border-border bg-muted/20 p-2.5 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold flex items-center gap-1.5">
                  <ImageIcon className="h-3.5 w-3.5 text-blue-600" />
                  Kategori / Etiket Görseli
                </span>
                <button
                  type="button"
                  onClick={() => setMediaModalOpen(true)}
                  className="rounded bg-blue-600/10 px-2 py-0.5 text-[10px] font-semibold text-blue-700 hover:bg-blue-600/20"
                >
                  Medyadan Seç
                </button>
              </div>

              {imageUrl ? (
                <div className="relative">
                  <img
                    src={imageUrl}
                    alt={name || "Kategori Görseli"}
                    className="h-24 w-full rounded-md border border-border object-cover bg-muted"
                  />
                  <button
                    type="button"
                    onClick={() => setImageUrl("")}
                    className="absolute top-1.5 right-1.5 rounded-full bg-black/70 p-1 text-white hover:bg-black"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ) : null}

              <input
                type="text"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="Görsel URL veya data:image/svg+xml..."
                className="h-7 w-full rounded border border-border bg-background px-2 font-mono text-[10px]"
              />
            </div>

            <div className="flex items-center gap-2">
              <div className="flex-1">
                <label className="block text-[11px] font-semibold mb-1">
                  Açıklama
                </label>
                <textarea aria-label="Açıklama"
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Kategori açıklaması..."
                  className="w-full rounded-md border border-border bg-background p-2"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold mb-1">
                  Renk
                </label>
                <input aria-label="Renk"
                  type="color"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className="h-12 w-12 rounded-md border border-border cursor-pointer"
                />
              </div>
            </div>

            {/* KATEGORİ SEO MOTORU ALANLARI */}
            <div className="rounded-lg border border-border p-2.5 space-y-2">
              <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                <Sparkles className="h-3 w-3 text-emerald-800 dark:text-emerald-400" />
                CollectionPage Arşiv SEO Ayarları
              </div>
              <input
                type="text"
                value={seoTitle}
                onChange={(e) => setSeoTitle(e.target.value)}
                placeholder="Özel SEO Başlığı (Boşsa otomatik üretilir)"
                className="h-7 w-full rounded border border-border bg-background px-2 text-[11px]"
              />
              <textarea
                rows={2}
                value={seoDescription}
                onChange={(e) => setSeoDescription(e.target.value)}
                placeholder="Özel Meta Açıklaması..."
                className="w-full rounded border border-border bg-background p-2 text-[11px]"
              />
            </div>

            <button
              type="submit"
              disabled={isPending}
              className="w-full rounded-lg bg-blue-600 py-2 text-xs font-semibold text-white shadow-xs hover:bg-blue-700 disabled:opacity-50"
            >
              {isPending
                ? "Kaydediliyor..."
                : editingId
                  ? "Değişiklikleri Kaydet"
                  : `+ ${activeType === "category" ? "Kategoriyi Ağaca Ekle" : "Etiketi Ekle"}`}
            </button>
          </div>
        </form>

        {/* SAĞ SÜTUN: HİYERARŞİK AĞAÇ TABLOSU (8 Sütun) */}
        <div className="lg:col-span-8 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Kategori veya etiket ara..."
                className="h-8 w-full rounded-md border border-border bg-background pl-8 pr-3 text-xs"
              />
            </div>
          </div>

          <div className="overflow-hidden rounded-xl border border-border bg-card shadow-2xs">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-border bg-muted/40 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  <th className="px-4 py-2.5">
                    {activeType === "category"
                      ? "Hiyerarşik Kategori Ağacı & Görsel"
                      : "Etiket Adı & Görsel"}
                  </th>
                  <th className="px-3.5 py-2.5">Tam Yol & Slug</th>
                  <th className="px-3.5 py-2.5">SEO & Şema</th>
                  <th className="px-3.5 py-2.5 text-right">İşlemler</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {displayedList.map((tax) => {
                  const isEditingThis = editingId === tax.id;
                  const fullPath = taxonomyPath(items, tax.id);

                  return (
                    <tr
                      key={tax.id}
                      className={`transition ${
                        isEditingThis ? "bg-blue-500/10" : "hover:bg-muted/40"
                      }`}
                    >
                      <td className="px-4 py-3 align-top">
                        <div
                          style={{ paddingLeft: `${tax.depth * 22}px` }}
                          className="flex items-start gap-2.5"
                        >
                          {tax.depth > 0 && (
                            <CornerDownRight className="mt-1 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                          )}
                          {tax.imageUrl ? (
                            <img
                              src={tax.imageUrl}
                              alt={tax.name}
                              className="h-9 w-12 shrink-0 rounded-md border border-border object-cover bg-muted"
                            />
                          ) : (
                            <div
                              style={{ backgroundColor: `${tax.color}20`, borderColor: `${tax.color}50` }}
                              className="flex h-9 w-12 shrink-0 items-center justify-center rounded-md border"
                            >
                              <span
                                style={{ backgroundColor: tax.color ?? "#2563eb" }}
                                className="h-3 w-3 rounded-full"
                              />
                            </div>
                          )}
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="font-semibold text-foreground">
                                {tax.name}
                              </span>
                              {tax.depth > 0 && (
                                <span className="rounded bg-muted px-1.5 py-0.2 text-[10px] text-muted-foreground">
                                  Seviye {tax.depth + 1}
                                </span>
                              )}
                            </div>
                            {tax.description && (
                              <p className="text-[11px] text-muted-foreground line-clamp-1 mt-0.5">
                                {tax.description}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>

                      <td className="px-3.5 py-3 align-top">
                        <div className="text-[11px] font-medium text-foreground">
                          {fullPath.join(" › ")}
                        </div>
                        <div className="font-mono text-[10px] text-muted-foreground">
                          /{activeType}/{tax.slug}
                        </div>
                      </td>

                      <td className="px-3.5 py-3 align-top">
                        <span className="inline-flex items-center gap-1 rounded bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-800 dark:text-emerald-300">
                          CollectionPage
                        </span>
                        <div className="text-[10px] text-muted-foreground line-clamp-1 mt-0.5 max-w-[180px]">
                          {tax.seoTitle || tax.name}
                        </div>
                      </td>

                      <td className="px-3.5 py-3 align-top text-right">
                        <div className="inline-flex items-center justify-end gap-1">
                          {activeType === "category" && (
                            <button
                              type="button"
                              onClick={() => handleStartAddChild(tax)}
                              title="Alt Kategori Ekle"
                              className="inline-flex items-center gap-1 rounded border border-border bg-background px-2 py-1 text-[10px] font-medium text-muted-foreground hover:border-blue-500 hover:text-blue-600"
                            >
                              <Plus className="h-3 w-3" />
                              Alt Ekle
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => handleStartEdit(tax)}
                            className="inline-flex items-center gap-1 rounded border border-border bg-background px-2.5 py-1 text-[11px] font-semibold text-foreground hover:border-blue-500 hover:text-blue-600"
                          >
                            <Edit3 className="h-3 w-3" />
                            Düzenle
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(tax)}
                            title="Sil"
                            className="rounded border border-border bg-background p-1.5 text-muted-foreground hover:border-rose-500/40 hover:text-rose-600"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
}

import { DesignLibraryModal } from "@/components/admin/editor/design-library-modal";
import { cloneBlockWithFreshIds } from "@/components/admin/editor/studio-model";
import { thumbnailUrl } from "@nexpress/core";
import { X } from "lucide-react";
import type { DualModeEditorState } from "./use-dual-mode-editor";

/** MEDYA KÜTÜPHANESİ SEÇİCİ MODAL */
export function DualModeEditorModals({ s }: { s: DualModeEditorState }) {
  const { title, setTitle, slug, setSlug, tldr, setTldr, schemaType, setSchemaType, blocks, setFeaturedImageUrl, setFeaturedImageAlt, setFeaturedImageCaption, mediaAssets, libraryOpen, setLibraryOpen, mediaPickerTarget, setMediaPickerTarget, setBlocks, showToast, selectedBlock, updateSelectedBlockProps, handleInsertBlock } = s;
  return (
    <>
      {/* MEDYA KÜTÜPHANESİ SEÇİCİ MODAL */}
      {mediaPickerTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-2xl rounded-xl border border-border bg-background p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="font-semibold text-sm">
                Medya Kütüphanesi & Görsel SEO Havuzu
              </div>
              <button
                type="button"
                onClick={() => setMediaPickerTarget(null)}
                className="p-1 text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-80 overflow-y-auto">
              {mediaAssets.map((med) => (
                <button
                  key={med.id}
                  type="button"
                  onClick={() => {
                    if (mediaPickerTarget === "featured") {
                      setFeaturedImageUrl(med.url);
                      setFeaturedImageAlt(med.altText);
                      setFeaturedImageCaption(med.caption ?? "");
                    } else if (
                      mediaPickerTarget === "block_image" &&
                      selectedBlock
                    ) {
                      updateSelectedBlockProps({
                        url: med.url,
                        altText: med.altText,
                        titleText: med.titleText ?? "",
                        caption: med.caption ?? "",
                      });
                    }
                    setMediaPickerTarget(null);
                    showToast("Görsel ve SEO alt metni aktarıldı.");
                  }}
                  className="group rounded-lg border border-border p-2 text-left hover:border-blue-600 transition space-y-1.5"
                >
                  <img
                    src={thumbnailUrl(med.url)}
                    alt={med.altText}
                    className="h-24 w-full rounded object-cover bg-muted"
                  />
                  <div className="text-[11px] font-semibold truncate">
                    {med.filename}
                  </div>
                  <div className="text-[10px] text-emerald-600">
                    SEO: {med.seoScore}%
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      <DesignLibraryModal
        open={libraryOpen}
        onClose={() => setLibraryOpen(false)}
        onInsert={(block) => {
          handleInsertBlock(block, null);
          setLibraryOpen(false);
        }}
        onApplyPack={(pack) => {
          setBlocks(pack.blocks.map((block) => cloneBlockWithFreshIds(block)));
          setTldr(pack.tldr);
          setSchemaType(pack.schemaType);
          setLibraryOpen(false);
          showToast(`"${pack.name}" şablonu uygulandı.`);
        }}
        onImport={(page) => {
          if (page.title) setTitle(page.title);
          if (page.slug) setSlug(page.slug);
          if (page.tldr) setTldr(page.tldr);
          setBlocks((prev) => (page.replace ? page.blocks : [...prev, ...page.blocks]));
          setLibraryOpen(false);
          showToast("Tasarım kanvasa aktarıldı.");
        }}
        onError={(message) => showToast(message)}
      />
    </>
  );
}

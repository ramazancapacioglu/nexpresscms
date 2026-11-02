import { DesignLibraryModal } from "@/components/admin/editor/design-library-modal";
import { cloneBlockWithFreshIds } from "@/components/admin/editor/studio-model";
import { MediaPickerDialog } from "@/components/admin/media/media-picker-dialog";
import { formatBytes } from "@/components/admin/media/media-filter";
import type { DualModeEditorState } from "./use-dual-mode-editor";

/** MEDYA KÜTÜPHANESİ SEÇİCİ MODAL */
export function DualModeEditorModals({ s }: { s: DualModeEditorState }) {
  const { title, setTitle, slug, setSlug, tldr, setTldr, schemaType, setSchemaType, blocks, setFeaturedImageUrl, setFeaturedImageAlt, setFeaturedImageCaption, mediaAssets, setMediaAssets, libraryOpen, setLibraryOpen, mediaPickerTarget, setMediaPickerTarget, setBlocks, showToast, selectedBlock, updateSelectedBlockProps, handleInsertBlock } = s;
  return (
    <>
      {/* MEDYA SEÇİCİ: kitaplık + yükleme + başlık/alt metin/alt yazı/açıklama düzenleme */}
      <MediaPickerDialog
        open={mediaPickerTarget !== null}
        onClose={() => setMediaPickerTarget(null)}
        kinds={mediaPickerTarget === "block_media" ? ["document", "video", "audio"] : ["image"]}
        title={mediaPickerTarget === "block_media" ? "Dosya, video veya ses seç" : "Görsel seç"}
        seed={mediaAssets}
        onLibraryChange={setMediaAssets}
        onPick={(med) => {
          if (mediaPickerTarget === "featured") {
            setFeaturedImageUrl(med.url);
            setFeaturedImageAlt(med.altText);
            setFeaturedImageCaption(med.caption ?? "");
          } else if (mediaPickerTarget === "block_image" && selectedBlock) {
            updateSelectedBlockProps({ url: med.url, altText: med.altText, titleText: med.titleText ?? "", caption: med.caption ?? "", width: med.width, height: med.height });
          } else if (mediaPickerTarget === "block_media" && selectedBlock) {
            updateSelectedBlockProps({ url: med.url, kind: med.kind, mime: med.mimeType, title: med.titleText || med.filename, description: med.description ?? med.caption ?? "", size: formatBytes(med.sizeBytes), uploadDate: new Date(med.createdAt).toISOString() });
          }
          setMediaPickerTarget(null);
          showToast("Medya ve SEO bilgileri aktarıldı.");
        }}
      />

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

import { useEffect, useMemo, useState } from "react";
import { buildTaxonomyTree, compileBlocksToMarkdown, compileBlockStylesToCss, countWords, findBlock, flattenBlocks, flattenTaxonomyTree, locateBlock, type DeviceKey } from "@nexpress/core";
import { analyzeSeo, deriveAutoSchemaNodes } from "@nexpress/seo-core";
import type { useDualModeEditorPublishing } from "./use-dual-mode-editor-publishing";

/** useDualModeEditor — aşama 3: UiState */
export function useDualModeEditorUiState(p: ReturnType<typeof useDualModeEditorPublishing>) {
  const { title, slug, tldr, schemaType, blocks, featuredImageUrl, featuredImageAlt, focusKeyword, metaTitle, metaDescription, noIndex, taxonomies } = p;
  // Editör Görünüm Modları & Paneller
  const [editorMode, setEditorMode] = useState<
    "visual" | "preview" | "code" | "markdown"
  >("visual");
  const [viewport, setViewport] = useState<DeviceKey>("desktop");
  const [leftDrawerOpen, setLeftDrawerOpen] = useState<boolean>(true);
  const [leftTab, setLeftTab] = useState<"tree" | "inserter">("tree");
  const [rightSidebarOpen, setRightSidebarOpen] = useState<boolean>(true);
  const [rightTab, setRightTab] = useState<"publish" | "seo" | "block" | "engage">(
    "block"
  );
  const [blockInspectorSubTab, setBlockInspectorSubTab] = useState<
    "general" | "style" | "advanced"
  >("general");
  const [styleDevice, setStyleDevice] = useState<DeviceKey>("desktop");

  // Seçili Blok ID (Kök blok, Satır, Sütun veya Sütun İçi Alt Blok olabilir!)
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(
    blocks[0]?.id ?? null
  );
  // Hangi sütuna (columnId) blok ekleneceği
  const [activeColumnInsertId, setActiveColumnInsertId] = useState<string | null>(
    null
  );

  // Tasarım Kütüphanesi Modal
  const [libraryOpen, setLibraryOpen] = useState<boolean>(false);
  const [codeJsonDraft, setCodeJsonDraft] = useState<string>("");
  const [codeJsonError, setCodeJsonError] = useState<string | null>(null);
  const [mediaPickerTarget, setMediaPickerTarget] = useState<
    "featured" | "block_image" | "block_bg" | null
  >(null);

  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3200);
  };

  // Seçili Blok Nesnesi ve Konumu
  const selectedBlock = useMemo(
    () => (selectedBlockId ? findBlock(blocks, selectedBlockId) : null),
    [blocks, selectedBlockId]
  );
  const selectedLocation = useMemo(
    () => (selectedBlockId ? locateBlock(blocks, selectedBlockId) : null),
    [blocks, selectedBlockId]
  );

  // Canlı Markdown ve Blok Stilleri CSS Derlemesi
  const compiledMarkdown = useMemo(
    () => compileBlocksToMarkdown(blocks, { title, tldr }),
    [blocks, title, tldr]
  );
  const compiledBlockCss = useMemo(
    () => compileBlockStylesToCss(blocks),
    [blocks]
  );
  const totalWords = useMemo(
    () => countWords(`${title} ${tldr} ${compiledMarkdown}`),
    [title, tldr, compiledMarkdown]
  );

  // Canlı 17-Noktalı Çekirdek SEO Motoru Analizi
  const seoAnalysis = useMemo(
    () =>
      analyzeSeo({
        title,
        slug,
        tldr,
        metaTitle: metaTitle || title,
        metaDescription: metaDescription || tldr,
        focusKeyword,
        featuredImageUrl,
        featuredAltText: featuredImageAlt,
        schemaType,
        noIndex,
        blocks,
      }),
    [
      title,
      slug,
      tldr,
      metaTitle,
      metaDescription,
      focusKeyword,
      featuredImageUrl,
      featuredImageAlt,
      schemaType,
      noIndex,
      blocks,
      compiledMarkdown,
    ]
  );

  const autoSchemaNodes = useMemo(
    () => deriveAutoSchemaNodes(blocks, `https://localhost:3000/tr/${slug}`),
    [blocks, slug]
  );

  // Kategori Ağacı
  const categories = useMemo(
    () => taxonomies.filter((t) => t.taxonomyType === "category"),
    [taxonomies]
  );
  const tags = useMemo(
    () => taxonomies.filter((t) => t.taxonomyType === "tag"),
    [taxonomies]
  );
  const flatCategoryTree = useMemo(
    () => flattenTaxonomyTree(buildTaxonomyTree(categories)),
    [categories]
  );

  // Düzleştirilmiş Blok Ağacı (Yapı Gezgini için)
  const flatBlockOutline = useMemo(() => flattenBlocks(blocks), [blocks]);

  // Kod sekmesine geçildiğinde JSON'u senkronize et
  useEffect(() => {
    if (editorMode === "code") {
      setCodeJsonDraft(JSON.stringify(blocks, null, 2));
      setCodeJsonError(null);
    }
  }, [editorMode, blocks]);

  return { ...p, editorMode, setEditorMode, viewport, setViewport, leftDrawerOpen, setLeftDrawerOpen, leftTab, setLeftTab, rightSidebarOpen, setRightSidebarOpen, rightTab, setRightTab, blockInspectorSubTab, setBlockInspectorSubTab, styleDevice, setStyleDevice, selectedBlockId, setSelectedBlockId, activeColumnInsertId, setActiveColumnInsertId, libraryOpen, setLibraryOpen, codeJsonDraft, setCodeJsonDraft, codeJsonError, setCodeJsonError, mediaPickerTarget, setMediaPickerTarget, toastMsg, setToastMsg, showToast, selectedBlock, selectedLocation, compiledMarkdown, compiledBlockCss, totalWords, seoAnalysis, autoSchemaNodes, categories, tags, flatCategoryTree, flatBlockOutline };
}

import { type StudioInspectorApi } from "@/components/admin/editor/studio-inspector-context";
import { writeFieldValues, writePageOptions, type ContentStatus } from "@nexpress/core";
import { saveContentAction, saveTaxonomyAction } from "@/app/admin/actions";
import type { useDualModeEditorDirty } from "./use-dual-mode-editor-dirty";

/** useDualModeEditor — aşama 6: Save */
export function useDualModeEditorSave(p: ReturnType<typeof useDualModeEditorDirty>) {
  const { inspectorSlot, startTransition, contentId, setContentId, title, slug, tldr, setTldr, status, setStatus, schemaType, setSchemaType, importanceScore, setImportanceScore, blocks, router, initialDoc, lockedType, setBlocks, visibility, setVisibility, accessPassword, setAccessPassword, scheduledAt, authorName, selectedCategories, setSelectedCategories, selectedTags, setSelectedTags, featuredImageUrl, setFeaturedImageUrl, featuredImageAlt, setFeaturedImageAlt, featuredImageCaption, focusKeyword, setFocusKeyword, allowComments, setAllowComments, allowReviews, setAllowReviews, showShareButtons, setShowShareButtons, metaTitle, setMetaTitle, metaDescription, setMetaDescription, canonicalUrl, setCanonicalUrl, noIndex, setNoIndex, setTaxonomies, quickCatName, setQuickCatName, quickCatParentId, setQuickCatParentId, quickTagName, setQuickTagName, editorMode, setEditorMode, viewport, setViewport, rightSidebarOpen, setRightSidebarOpen, rightTab, setRightTab, blockInspectorSubTab, setBlockInspectorSubTab, styleDevice, setStyleDevice, setSelectedBlockId, setLibraryOpen, setMediaPickerTarget, showToast, selectedBlock, selectedLocation, seoAnalysis, autoSchemaNodes, categories, tags, flatCategoryTree, updateSelectedBlockProps, updateSelectedBlockStyle, updateSelectedBlockStyleRoot, getActiveStyleValue, handleChangeColumnLayout, markSaved, docSignature , richSchema, setRichSchema, templateId, setTemplateId } = p;
  // Kaydet / Yayınla
  const handleSave = (overrideStatus?: ContentStatus) => {
    const nextStatus = overrideStatus ?? status;
    setStatus(nextStatus);

    const sigAtStart = docSignature;
    startTransition(async () => {
      try {
      const res = await saveContentAction({
        contentId,
        type: lockedType,
        status: nextStatus,
        schemaType,
        importanceScore,
        locale: p.locale,
        slug,
        title,
        tldr,
        blocks,
        featuredImage: featuredImageUrl || null,
        metaTitle: metaTitle.trim(),
        metaDescription: metaDescription.trim(),
        canonicalUrl: canonicalUrl || undefined,
        noIndex,
        schemaAttributes: writeFieldValues(writePageOptions({
          ...(initialDoc?.schemaAttributes ?? {}),
          richSchema: Object.keys(richSchema).length > 0 ? richSchema : undefined,
          _template: templateId || undefined,
          _publishing: {
            visibility,
            password: accessPassword || undefined,
            scheduledAt: scheduledAt || undefined,
            authorName,
            categories: selectedCategories,
            tags: selectedTags,
            featuredImageUrl: featuredImageUrl || undefined,
            featuredImageAlt: featuredImageAlt || undefined,
            featuredImageCaption: featuredImageCaption || undefined,
            focusKeyword: focusKeyword || undefined,
            allowComments,
            allowReviews,
            showShareButtons,
            showFeaturedImage: p.showFeaturedImage,
            parentId: p.parentId || undefined,
            pillar: p.pillar,
          },
        }, p.pageOptions), p.customType ? p.fieldValues : {}),
      });

      if (res.ok) {
        setContentId(res.contentId);
        // Adres doluysa sunucu benzersizleştirir (-2, -3…): alanda gerçek adres görünür
        if (res.slug && res.slug !== slug) p.setSlug(res.slug);
        showToast(
          nextStatus === "draft"
            ? `Taslak kaydedildi (SEO Skoru: ${res.seoScore}/100)`
            : `Yayına alındı! 0-KB RSC, Markdown ve JSON-LD güncellendi (${res.seoScore}/100)`
        );
        markSaved(sigAtStart);
        router.refresh();
      } else {
        showToast(("error" in res && res.error) || "Kaydedilemedi: sunucu isteği reddetti. Değişiklikleriniz sayfada duruyor.");
      }
      } catch {
        showToast("Kaydedilemedi: bağlantı veya oturum hatası. Değişiklikleriniz sayfada duruyor.");
      }
    });
  };

  // Hızlı Kategori Ekleme (Ağaç Parent Desteğiyle)
  const handleQuickAddCategory = () => {
    if (!quickCatName.trim()) return;
    const newSlug = quickCatName
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9ğüşıöç\s-]/g, "")
      .replace(/\s+/g, "-");

    startTransition(async () => {
      const res = await saveTaxonomyAction({
        taxonomyType: "category",
        name: quickCatName.trim(),
        slug: newSlug,
        parentId: quickCatParentId || null,
        color: "#2563eb",
      });
      if (res.ok) {
        setTaxonomies((prev) => [...prev, res.taxonomy]);
        setSelectedCategories((prev) =>
          Array.from(new Set([...prev, res.taxonomy.slug]))
        );
        setQuickCatName("");
        showToast(`"${res.taxonomy.name}" kategorisi ağaca eklendi.`);
      }
    });
  };

  const handleQuickAddTag = () => {
    if (!quickTagName.trim()) return;
    const newSlug = quickTagName
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9ğüşıöç\s-]/g, "")
      .replace(/\s+/g, "-");

    startTransition(async () => {
      const res = await saveTaxonomyAction({
        taxonomyType: "tag",
        name: quickTagName.trim(),
        slug: newSlug,
        color: "#09090b",
      });
      if (res.ok) {
        setTaxonomies((prev) => [...prev, res.taxonomy]);
        setSelectedTags((prev) =>
          Array.from(new Set([...prev, res.taxonomy.slug]))
        );
        setQuickTagName("");
        showToast(`"#${res.taxonomy.name}" etiketi eklendi.`);
      }
    });
  };

  const inspectorApi: Omit<StudioInspectorApi, "applyRevision"> = {
    siteTokens: p.siteTokens,
    editorMode,
    setEditorMode,
    viewport,
    setViewport,
    openLibrary: () => setLibraryOpen(true),
    rightSidebarOpen,
    setRightSidebarOpen,
    rightTab,
    setRightTab,
    blockInspectorSubTab,
    setBlockInspectorSubTab,
    styleDevice,
    setStyleDevice,
    selectedBlock,
    selectedLocation,
    setSelectedBlockId,
    setBlocks,
    updateSelectedBlockProps,
    convertTextBlock: p.convertTextBlock,
    bumpProseSync: () => p.setProseSyncToken((v: number) => v + 1),
    contentType: lockedType,
    templateKind: lockedType === "template" ? (((initialDoc?.schemaAttributes as { template?: { kind?: string } } | undefined)?.template?.kind) ?? null) : null,
    blocks,
    updateSelectedBlockStyle,
    updateSelectedBlockStyleRoot,
    getActiveStyleValue,
    handleChangeColumnLayout,
    setMediaPickerTarget,
    seoAnalysis,
    autoSchemaNodes,
    inspectorSlot,
    status,
    setStatus,
    visibility,
    setVisibility,
    accessPassword,
    setAccessPassword,
    flatCategoryTree,
    selectedCategories,
    setSelectedCategories,
    quickCatName,
    setQuickCatName,
    quickCatParentId,
    setQuickCatParentId,
    handleQuickAddCategory,
    tags,
    selectedTags,
    setSelectedTags,
    quickTagName,
    setQuickTagName,
    handleQuickAddTag,
    focusKeyword,
    setFocusKeyword,
    slug,
    title,
    tldr,
    setTldr,
    metaTitle,
    setMetaTitle,
    metaDescription,
    setMetaDescription,
    noIndex,
    setNoIndex,
    canonicalUrl,
    setCanonicalUrl,
    richSchema,
    setRichSchema,
    templateId,
    setTemplateId,
    schemaType,
    setSchemaType,
    importanceScore,
    setImportanceScore,
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
    showFeaturedImage: p.showFeaturedImage,
    setShowFeaturedImage: p.setShowFeaturedImage,
    pageOptions: p.pageOptions,
    setPageOptions: p.setPageOptions,
    customType: p.customType,
    customTypes: p.customTypes,
    fieldValues: p.fieldValues,
    setFieldValues: p.setFieldValues,
    parentId: p.parentId,
    setParentId: p.setParentId,
    pillar: p.pillar,
    setPillar: p.setPillar,
    pageChoices: p.initialContents.filter((item) => item.type === "page" && item.id !== contentId).map((item) => ({ id: item.id, title: item.title })),
    contentId,
    scheduledAt: p.scheduledAt,
    setScheduledAt: p.setScheduledAt,
    locale: p.locale,
    defaultLocale: p.defaultLocale,
    siteLocales: p.siteLocales,
    translations: p.translations,
    compiledMarkdown: p.compiledMarkdown,
    isDirty: p.isDirty,
  };

  return { ...p, handleSave, handleQuickAddCategory, handleQuickAddTag, inspectorApi };
}

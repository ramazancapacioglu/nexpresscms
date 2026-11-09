import { useState } from "react";
import { draftSignature, type EditorDraftFields } from "@nexpress/core";
import type { useDualModeEditorBlockEditing } from "./use-dual-mode-editor-block-editing";

/** useDualModeEditor — aşama 5: Dirty (kaydedilmemiş değişiklik izleme) */
export function useDualModeEditorDirty(p: ReturnType<typeof useDualModeEditorBlockEditing>) {
  const fields: EditorDraftFields = {
    title: p.title,
    slug: p.slug,
    tldr: p.tldr,
    blocks: p.blocks,
    metaTitle: p.metaTitle,
    metaDescription: p.metaDescription,
    canonicalUrl: p.canonicalUrl,
    richSchema: p.richSchema as Record<string, unknown>,
    templateId: p.templateId,
    noIndex: p.noIndex,
    schemaType: p.schemaType,
    importanceScore: p.importanceScore,
    featuredImageUrl: p.featuredImageUrl,
    featuredImageAlt: p.featuredImageAlt,
    featuredImageCaption: p.featuredImageCaption,
    focusKeyword: p.focusKeyword,
    visibility: p.visibility,
    scheduledAt: p.scheduledAt,
    categories: p.selectedCategories,
    tags: p.selectedTags,
    allowComments: p.allowComments,
    allowReviews: p.allowReviews,
    showShareButtons: p.showShareButtons,
    showFeaturedImage: p.showFeaturedImage,
    parentId: p.parentId,
    pillar: p.pillar,
  };
  const docSignature = draftSignature(fields);
  const [savedSignature, setSavedSignature] = useState(docSignature);
  const isDirty = docSignature !== savedSignature;
  const markSaved = (signature: string) => setSavedSignature(signature);
  return { ...p, draftFields: fields, docSignature, isDirty, markSaved };
}

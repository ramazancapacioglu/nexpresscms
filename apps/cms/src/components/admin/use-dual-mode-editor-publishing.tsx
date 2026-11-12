import type { RichSchemaFields } from "@/components/admin/editor/rich-schema-panel";
import { useMemo, useState } from "react";
import { readFieldValues, readPageOptions, resolvePublishing, type FieldValues, type PageOptions } from "@nexpress/core";
import type { MediaAssetDto, TaxonomyDto } from "@nexpress/database";
import type { useDualModeEditorDocument } from "./use-dual-mode-editor-document";

/** useDualModeEditor — aşama 2: Publishing */
export function useDualModeEditorPublishing(p: ReturnType<typeof useDualModeEditorDocument>) {
  const { initialTaxonomies, initialMediaAssets, title, tldr, initialDoc } = p;
  // Yayınlama, Kategori, Etiket, Öne Çıkan Görsel ve SEO Alanları
  const initialPub = useMemo(
    () => resolvePublishing(initialDoc?.schemaAttributes),
    [initialDoc]
  );
  const [visibility, setVisibility] = useState<
    "public" | "private" | "password" | "members_only"
  >(initialPub.visibility);
  const [accessPassword, setAccessPassword] = useState<string>(
    initialPub.password ?? ""
  );
  const [scheduledAt, setScheduledAt] = useState<string>(
    initialPub.scheduledAt ?? ""
  );
  const [authorName, setAuthorName] = useState<string>(
    initialPub.authorName ?? ""
  );
  const [selectedCategories, setSelectedCategories] = useState<string[]>(
    initialPub.categories
  );
  const [selectedTags, setSelectedTags] = useState<string[]>(initialPub.tags);
  const [featuredImageUrl, setFeaturedImageUrl] = useState<string>(
    initialDoc?.featuredImage ?? initialPub.featuredImageUrl ?? ""
  );
  const [featuredImageAlt, setFeaturedImageAlt] = useState<string>(
    initialPub.featuredImageAlt ?? ""
  );
  const [featuredImageCaption, setFeaturedImageCaption] = useState<string>(
    initialPub.featuredImageCaption ?? ""
  );
  const [focusKeyword, setFocusKeyword] = useState<string>(
    initialPub.focusKeyword ?? ""
  );
  const [allowComments, setAllowComments] = useState<boolean>(
    initialPub.allowComments
  );
  const [allowReviews, setAllowReviews] = useState<boolean>(
    initialPub.allowReviews
  );
  const [showShareButtons, setShowShareButtons] = useState<boolean>(
    initialPub.showShareButtons
  );
  const [showFeaturedImage, setShowFeaturedImage] = useState<boolean>(initialPub.showFeaturedImage);
  const [parentId, setParentId] = useState<string>(initialPub.parentId ?? "");
  const [pillar, setPillar] = useState<boolean>(initialPub.pillar);

  // SEO Meta Alanları
  const [metaTitle, setMetaTitle] = useState<string>(
    // Eski kayıtlar başlığı meta başlığa kopyalıyordu: başlıkla aynıysa "otomatik" sayılır
    initialDoc?.metaTitle && initialDoc.metaTitle !== initialDoc.title ? initialDoc.metaTitle : ""
  );
  const [metaDescription, setMetaDescription] = useState<string>(
    initialDoc?.metaDescription && initialDoc.metaDescription !== initialDoc.tldr ? initialDoc.metaDescription : ""
  );
  // Pro eklentinin zengin şema türleri (QAPage, Offer, TechArticle, SoftwareApplication)
  const [richSchema, setRichSchema] = useState<RichSchemaFields>(((initialDoc?.schemaAttributes as Record<string, unknown> | undefined)?.richSchema as RichSchemaFields | undefined) ?? {});
  // Görünüm şablonu ataması ("" = türün varsayılanı, "none" = yerleşik görünüm, aksi hâlde şablon kimliği)
  const [templateId, setTemplateId] = useState<string>(String(((initialDoc?.schemaAttributes as Record<string, unknown> | undefined)?._template as string | undefined) ?? ""));
  const [canonicalUrl, setCanonicalUrl] = useState<string>(
    initialDoc?.canonicalUrl ?? ""
  );
  const [noIndex, setNoIndex] = useState<boolean>(Boolean(initialDoc?.noIndex));

  // Taksonomi & Medya Havuzu
  const [taxonomies, setTaxonomies] = useState<TaxonomyDto[]>(initialTaxonomies);
  const [mediaAssets, setMediaAssets] =
    useState<MediaAssetDto[]>(initialMediaAssets);

  // Hızlı Kategori & Etiket Ekleme (Sidebar içinden)
  const [quickCatName, setQuickCatName] = useState("");
  const [fieldValues, setFieldValues] = useState<FieldValues>(() => readFieldValues(p.customType, initialDoc?.schemaAttributes));
  const [pageOptions, setPageOptions] = useState<PageOptions>(() => readPageOptions(initialDoc?.schemaAttributes));
  const [quickCatParentId, setQuickCatParentId] = useState<string>("");
  const [quickTagName, setQuickTagName] = useState("");

  return { ...p, fieldValues, setFieldValues, pageOptions, setPageOptions, visibility, setVisibility, accessPassword, setAccessPassword, scheduledAt, setScheduledAt, authorName, setAuthorName, selectedCategories, setSelectedCategories, selectedTags, setSelectedTags, featuredImageUrl, setFeaturedImageUrl, featuredImageAlt, setFeaturedImageAlt, featuredImageCaption, setFeaturedImageCaption, focusKeyword, setFocusKeyword, allowComments, setAllowComments, allowReviews, setAllowReviews, showShareButtons, setShowShareButtons, showFeaturedImage, setShowFeaturedImage, parentId, setParentId, pillar, setPillar, metaTitle, setMetaTitle, metaDescription, setMetaDescription, canonicalUrl, setCanonicalUrl, templateId, setTemplateId, richSchema, setRichSchema, noIndex, setNoIndex, taxonomies, setTaxonomies, mediaAssets, setMediaAssets, quickCatName, setQuickCatName, quickCatParentId, setQuickCatParentId, quickTagName, setQuickTagName, initialPub };
}

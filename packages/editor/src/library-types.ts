import type { BlockNode } from "@nexpress/core";

export type LibraryCategory =
  | "all"
  | "hero"
  | "layout"
  | "text"
  | "media"
  | "cards"
  | "bento"
  | "social"
  | "pricing"
  | "commerce"
  | "forms"
  | "data"
  | "aio_sge"
  | "editorial"
  | "custom";

export type LibraryPreviewKind =
  | "hero-split"
  | "hero-centered"
  | "bento-4"
  | "bento-3"
  | "stats-4"
  | "pricing-3"
  | "product-card"
  | "tldr-summary"
  | "faq-list"
  | "howto-timeline"
  | "callout-box"
  | "cta-strip"
  | "code-terminal"
  | "prose-section"
  | "columns"
  | "gallery"
  | "form"
  | "media";

export interface DesignLibraryItem {
  id: string;
  name: string;
  category: Exclude<LibraryCategory, "all">;
  description: string;
  badge?: string;
  isCustom?: boolean;
  previewKind: LibraryPreviewKind;
  block: Omit<BlockNode, "id">;
}

export interface StarterPagePack {
  id: string;
  name: string;
  description: string;
  recommendedType: "page" | "product" | "kb_tech" | "campaign";
  schemaType: string;
  tldr: string;
  blocks: Array<Omit<BlockNode, "id">>;
}

export interface LibraryGroup {
  id: string;
  label: string;
  categories: string[];
}

export const LIBRARY_GROUPS: LibraryGroup[] = [
  { id: "all", label: "Tümü", categories: [] },
  { id: "hero", label: "Vitrin", categories: ["hero"] },
  { id: "layout", label: "Yerleşim", categories: ["layout"] },
  { id: "text", label: "Metin", categories: ["text", "editorial", "aio_sge"] },
  { id: "media", label: "Medya", categories: ["media"] },
  { id: "cards", label: "Kartlar", categories: ["cards", "bento"] },
  { id: "social", label: "Sosyal kanıt", categories: ["social"] },
  { id: "commerce", label: "Ticaret", categories: ["commerce", "pricing"] },
  { id: "forms", label: "Formlar", categories: ["forms"] },
  { id: "data", label: "Veri", categories: ["data"] },
  { id: "custom", label: "Özel", categories: ["custom"] },
];

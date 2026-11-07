import { LIBRARY_CATEGORIES, LIBRARY_CATEGORY_GROUPS, type BlockNode } from "@nexpress/core";

/** Kategori kimlikleri `@nexpress/core` içindeki `LIBRARY_CATEGORIES` listesinden gelir. */
export type LibraryCategory = "all" | string;

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
  category: string;
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
  recommendedType: "page" | "product" | "kb_tech" | "campaign" | "ai_prompt" | "post";
  schemaType: string;
  tldr: string;
  blocks: Array<Omit<BlockNode, "id">>;
  /** Sayfa türü süzgeci: home | about | contact | services | portfolio | team | gallery */
  pageCategory?: PagePackCategory;
}

export type PagePackCategory = "home" | "about" | "contact" | "services" | "portfolio" | "team" | "gallery";

export const PAGE_PACK_CATEGORIES: Array<{ id: PagePackCategory; label: string }> = [
  { id: "home", label: "Ana sayfa" },
  { id: "about", label: "Hakkında" },
  { id: "contact", label: "İletişim" },
  { id: "services", label: "Hizmetler" },
  { id: "portfolio", label: "Portfolyo" },
  { id: "team", label: "Ekip" },
  { id: "gallery", label: "Galeri" },
];

export interface LibraryGroup {
  id: string;
  label: string;
  categories: string[];
  /** Kenar çubuğu başlığı (İçerik / Medya / Gelişmiş) */
  section?: string;
}

export const LIBRARY_GROUPS: LibraryGroup[] = [
  { id: "all", label: "Tümü", categories: [] },
  ...LIBRARY_CATEGORIES.map((c) => ({
    id: c.id,
    label: c.label,
    categories: [c.id],
    section: LIBRARY_CATEGORY_GROUPS.find((g) => g.id === c.group)?.label,
  })),
];

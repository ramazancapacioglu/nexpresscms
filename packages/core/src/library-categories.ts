/** Tasarım kütüphanesi kategorileri (Türkçe). Her örnek tasarım tam bir kategoriye aittir. */
export type LibraryCategoryGroup = "content" | "media" | "advanced";

export interface LibraryCategoryDef {
  id: string;
  label: string;
  group: LibraryCategoryGroup;
}

export const LIBRARY_CATEGORY_GROUPS: Array<{ id: LibraryCategoryGroup; label: string }> = [
  { id: "content", label: "İçerik" },
  { id: "media", label: "Medya" },
  { id: "advanced", label: "Gelişmiş" },
];

export const LIBRARY_CATEGORIES: LibraryCategoryDef[] = [
  { id: "text", label: "Metin", group: "content" },
  { id: "hero", label: "Vitrin (Hero)", group: "content" },
  { id: "page_title", label: "Sayfa başlığı", group: "content" },
  { id: "accordion", label: "Akordeon", group: "content" },
  { id: "location", label: "Konum", group: "content" },
  { id: "subscribe", label: "Abonelik formu", group: "content" },
  { id: "testimonials", label: "Yorumlar", group: "content" },
  { id: "stats", label: "Sayaç / İstatistik", group: "content" },
  { id: "list", label: "Liste", group: "content" },
  { id: "people", label: "Kişiler", group: "content" },
  { id: "product", label: "Ürün vitrini", group: "content" },
  { id: "cards", label: "Kartlar", group: "content" },
  { id: "contact", label: "İletişim formu", group: "content" },
  { id: "posts", label: "Yazılar", group: "content" },
  { id: "pricing", label: "Fiyat tablosu", group: "content" },
  { id: "cta", label: "Çağrı (CTA)", group: "content" },
  { id: "timeline", label: "Zaman çizelgesi", group: "content" },
  { id: "data_table", label: "Veri tablosu", group: "content" },
  { id: "comparison", label: "Karşılaştırma", group: "content" },
  { id: "menu", label: "Restoran menüsü", group: "content" },
  { id: "tabs", label: "Sekmeler", group: "content" },
  { id: "image_text", label: "Görsel & metin", group: "media" },
  { id: "gallery", label: "Galeri", group: "media" },
  { id: "video_text", label: "Video & metin", group: "media" },
  { id: "logos", label: "Logolar", group: "media" },
  { id: "template", label: "Şablon yuvaları", group: "advanced" },
  { id: "schema", label: "Şema kartları", group: "advanced" },
  { id: "custom", label: "Benim tasarımlarım", group: "advanced" },
];

export type LibraryCategoryId = (typeof LIBRARY_CATEGORIES)[number]["id"];

const IDS = new Set(LIBRARY_CATEGORIES.map((c) => c.id));

/** Eski kategori adları (yapay zekâ çıktısı, kayıtlı özel tasarımlar) yeni kimliğe çevrilir. */
const LEGACY: Record<string, string> = {
  layout: "text",
  media: "image_text",
  bento: "cards",
  social: "testimonials",
  commerce: "product",
  forms: "contact",
  data: "data_table",
  aio_sge: "text",
  editorial: "text",
  page: "custom",
};

export function normalizeLibraryCategory(raw: unknown): LibraryCategoryId {
  const key = typeof raw === "string" ? raw.trim().toLowerCase() : "";
  if (IDS.has(key)) return key;
  return LEGACY[key] ?? "text";
}

export const libraryCategoryLabel = (id: string): string => LIBRARY_CATEGORIES.find((c) => c.id === id)?.label ?? id;

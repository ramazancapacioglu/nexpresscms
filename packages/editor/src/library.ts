import { CATALOG_LIBRARY_ITEMS } from "./library-catalog";
import { BASE_LIBRARY } from "./library-base";
import { MODERN_LIBRARY_ITEMS } from "./library-modern";
import { CREATIVE_LIBRARY_ITEMS } from "./library-creative";
import { DISCLOSURE_LIBRARY_ITEMS } from "./library-disclosure";
import { SECTION_LIBRARY_ITEMS } from "./library-sections";
import { EXTRA_LIBRARY_ITEMS } from "./library-extras";
import { FRESH_LIBRARY_ITEMS } from "./library-fresh";
import { VITRIN_LIBRARY_ITEMS } from "./library-vitrin";
import { SHORT_NAMES } from "./library-names";
import { MODERN_FORM_ITEMS } from "./library-forms-modern";
import { categoryFor } from "./library-category-map";
import type { DesignLibraryItem } from "./library-types";

/** Tüm tasarım kütüphanesi: temel öğeler + katalog öğeleri. */
/** Yeni (modern ve yaratıcı) bölümler listenin başında; kısa adlar kartta tek satıra sığar. */
export const NEXPRESS_DESIGN_LIBRARY: DesignLibraryItem[] = [
  ...VITRIN_LIBRARY_ITEMS,
  ...FRESH_LIBRARY_ITEMS,
  ...DISCLOSURE_LIBRARY_ITEMS,
  ...SECTION_LIBRARY_ITEMS,
  ...EXTRA_LIBRARY_ITEMS,
  ...CREATIVE_LIBRARY_ITEMS,
  ...MODERN_LIBRARY_ITEMS,
  ...MODERN_FORM_ITEMS,
  ...BASE_LIBRARY,
  ...CATALOG_LIBRARY_ITEMS,
].map((item) => ({ ...item, category: categoryFor(item.id, item.category), name: SHORT_NAMES[item.id] ?? item.name }));

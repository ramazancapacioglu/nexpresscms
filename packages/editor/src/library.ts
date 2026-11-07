import { CATALOG_LIBRARY_ITEMS } from "./library-catalog";
import { BASE_LIBRARY } from "./library-base";
import { YAZILIM_LIBRARY_ITEMS } from "./library-yazilim";
import { MODERN_LIBRARY_ITEMS } from "./library-modern";
import { MODERN_FORM_ITEMS } from "./library-forms-modern";
import type { DesignLibraryItem } from "./library-types";

/** Tüm tasarım kütüphanesi: temel öğeler + katalog öğeleri. */
export const NEXPRESS_DESIGN_LIBRARY: DesignLibraryItem[] = [
  ...BASE_LIBRARY,
  ...CATALOG_LIBRARY_ITEMS,
  ...YAZILIM_LIBRARY_ITEMS,
  ...MODERN_LIBRARY_ITEMS,
  ...MODERN_FORM_ITEMS,
];

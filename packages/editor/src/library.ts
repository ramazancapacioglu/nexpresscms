import { CATALOG_LIBRARY_ITEMS } from "./library-catalog";
import { BASE_LIBRARY } from "./library-base";
import type { DesignLibraryItem } from "./library-types";

/** Tüm tasarım kütüphanesi: temel öğeler + katalog öğeleri. */
export const NEXPRESS_DESIGN_LIBRARY: DesignLibraryItem[] = [
  ...BASE_LIBRARY,
  ...CATALOG_LIBRARY_ITEMS,
];

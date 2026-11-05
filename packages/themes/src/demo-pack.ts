import type { BlockNode } from "@nexpress/core";
import { AKINSOFT_DEMO, AKINSOFT_DEMO_HOME_SLUG } from "./akinsoft-demo";

/** Tema kurulunca değil, mağazadaki demo aktarımında yazılan düzenlenebilir içerik. */
export interface ThemeDemoEntry {
  type: "page" | "post";
  slug: string;
  title: string;
  tldr: string;
  schemaType: string;
  blocks: BlockNode[];
}

export interface ThemeDemoPack {
  themeId: string;
  /** Ana sayfa adresi. Tema açıkken ve bu sayfa yayındayken `/{dil}` bunu gösterir. */
  homeSlug?: string;
  title: string;
  summary: string;
  entries: ThemeDemoEntry[];
}

const PACKS: ThemeDemoPack[] = [AKINSOFT_DEMO];

export function getThemeDemoPack(themeId: string): ThemeDemoPack | null {
  return PACKS.find((pack) => pack.themeId === themeId) ?? null;
}

export { AKINSOFT_DEMO_HOME_SLUG };

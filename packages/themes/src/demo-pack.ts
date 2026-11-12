import type { BlockNode } from "@nexpress/core";
import { YF_DEMO, YF_DEMO_HOME_SLUG } from "./yazilim-firmasi-demo";
import { buildGenericDemo } from "./demo-generic";
import { AURORA_DEMO, CRIMSON_DEMO, PULSE_DEMO, VELOCITY_DEMO } from "./demo-copy";
import { INK_GRID_HOME_SLUG, INK_GRID_ID } from "./ink-grid";
import { INK_GRID_PAGES } from "./ink-grid-pages";

/** Tema kurulunca değil, mağazadaki demo aktarımında yazılan düzenlenebilir içerik. */
/** `campaign` kaydı Kampanyalar eklentisinin içeriğidir; `campaign_showcase` blokları ve `/kampanyalar` bunları listeler. */
export interface ThemeDemoCampaign {
  discount: string;
  gift?: string;
  badge?: string;
  /** Aktarım gününe göre bitiş: sayaç ve "aktif" süzgeci demo açıldığında çalışsın diye göreli yazılır. */
  endsInDays: number;
  ctaText?: string;
  ctaUrl?: string;
}

export interface ThemeDemoEntry {
  type: "page" | "post" | "campaign";
  slug: string;
  title: string;
  tldr: string;
  schemaType: string;
  blocks: BlockNode[];
  /** false: yerleşik makale düzeni (başlık, tarih, kenar çubuğu). Varsayılan true: tam genişlik tuval. */
  canvas?: boolean;
  /** Öne çıkan görsel (`/demo/...` yolu). */
  image?: string;
  categories?: string[];
  campaign?: ThemeDemoCampaign;
}

export interface ThemeDemoPack {
  themeId: string;
  /** Ana sayfa adresi. Tema açıkken ve bu sayfa yayındayken `/{dil}` bunu gösterir. */
  homeSlug?: string;
  title: string;
  summary: string;
  entries: ThemeDemoEntry[];
}

const INK_GRID_DEMO: ThemeDemoPack = {
  themeId: INK_GRID_ID,
  homeSlug: INK_GRID_HOME_SLUG,
  title: "Ink Grid demo",
  summary: "Geliştirici ve ürün odaklı, çizgili ve sade bir vitrin: ürün, kurumsal, geliştirici ve doküman sayfaları.",
  entries: INK_GRID_PAGES.map((page) => ({ type: "page" as const, slug: page.slug, title: page.title, tldr: page.tldr, schemaType: page.schemaType, blocks: page.blocks })),
};

const PACKS: ThemeDemoPack[] = [
  buildGenericDemo(AURORA_DEMO),
  buildGenericDemo(VELOCITY_DEMO),
  buildGenericDemo(PULSE_DEMO),
  buildGenericDemo(CRIMSON_DEMO),
  INK_GRID_DEMO,
  YF_DEMO,
];

export function getThemeDemoPack(themeId: string): ThemeDemoPack | null {
  return PACKS.find((pack) => pack.themeId === themeId) ?? null;
}

export { YF_DEMO_HOME_SLUG };

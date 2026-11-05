import type { BlockNode } from "@nexpress/core";
import { YF_DEMO, YF_DEMO_HOME_SLUG } from "./yazilim-firmasi-demo";

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

const PACKS: ThemeDemoPack[] = [YF_DEMO];

export function getThemeDemoPack(themeId: string): ThemeDemoPack | null {
  return PACKS.find((pack) => pack.themeId === themeId) ?? null;
}

export { YF_DEMO_HOME_SLUG };

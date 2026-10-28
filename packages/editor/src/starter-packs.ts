import { NEXPRESS_DESIGN_LIBRARY } from "./library";
import type { StarterPagePack } from "./library-types";

/**
 * Tek Tıkla Uygulanabilir Tam Sayfa Şablon Paketleri (Starter Page Packs)
 */
export const NEXPRESS_STARTER_PAGE_PACKS: StarterPagePack[] = [
  {
    id: "pack_b2b_saas_landing",
    name: "B2B SaaS & Kurumsal Ürün Lansman Sayfası",
    description:
      "Hero + 4'lü Kanıt İstatistiği + Bento Özellik Izgarası + 3 Kademeli Fiyatlandırma + SSS Akordeonu.",
    recommendedType: "page",
    schemaType: "WebPage",
    tldr: "Kurumsal B2B yazılım ve teknoloji markaları için 100/100 Lighthouse hızında, dönüşüm ve SGE optimize tam açılış sayfası.",
    blocks: [
      NEXPRESS_DESIGN_LIBRARY[0]!.block,
      NEXPRESS_DESIGN_LIBRARY[3]!.block,
      NEXPRESS_DESIGN_LIBRARY[2]!.block,
      NEXPRESS_DESIGN_LIBRARY[4]!.block,
      NEXPRESS_DESIGN_LIBRARY[8]!.block,
    ],
  },
  {
    id: "pack_tech_kb_guide",
    name: "Teknik Bilgi Bankası (TechArticle & HowTo) Rehberi",
    description:
      "Answer-First TL;DR + Adım Adım Kurulum (HowTo) + Mimari İpucu Kutusu + Kod Terminali + Gömülü Ürün Kartı + SSS.",
    recommendedType: "kb_tech",
    schemaType: "TechArticle",
    tldr: "Adım adım teknik prosedür, kod örnekleri ve bağlantılı @id ürün referansı içeren otoriter bilgi bankası şablonu.",
    blocks: [
      NEXPRESS_DESIGN_LIBRARY[6]!.block,
      NEXPRESS_DESIGN_LIBRARY[7]!.block,
      NEXPRESS_DESIGN_LIBRARY[9]!.block,
      NEXPRESS_DESIGN_LIBRARY[11]!.block,
      NEXPRESS_DESIGN_LIBRARY[5]!.block,
      NEXPRESS_DESIGN_LIBRARY[8]!.block,
    ],
  },
];

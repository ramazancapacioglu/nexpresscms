import { ICON_NAMES } from "../icons";
/**
 * AI tasarım sözleşmesi: modelin üretebileceği bloklar, her blokun alanları ve sınırları.
 * Tek kaynak: hem bilgi paketi (komut metni) hem doğrulayıcı bu kataloğu kullanır; ikisi hiç ayrışmaz.
 * Katalog dışında kalan bloklar (slider, geri sayım, harita, kullanıcı kartı…) bilinçli olarak AI'a kapalıdır:
 * ya veri uydurmayı (sahte yorum/puan) ya da istemci JS'ini teşvik ederler.
 */
export type FieldSpec =
  | { kind: "text"; max: number; required?: boolean }
  | { kind: "url"; required?: boolean }
  | { kind: "image"; required?: boolean }
  | { kind: "enum"; values: readonly string[]; required?: boolean }
  | { kind: "number"; min: number; max: number }
  | { kind: "boolean" }
  | { kind: "list"; minItems?: number; maxItems: number; item: Record<string, FieldSpec> }
  | { kind: "strings"; maxItems: number; maxLen: number }
  | { kind: "matrix"; maxRows: number; maxCols: number; maxLen: number };

export interface BlockSpec {
  label: string;
  /** Modele "ne zaman kullanılır" bilgisi */
  usage: string;
  props: Record<string, FieldSpec>;
  variants?: readonly string[];
  /** Sayfa başına üst sınır */
  maxPerPage?: number;
  /** Veri uydurmaya açık: sonuç "gerçek verilerle güncelleyin" uyarısı alır */
  placeholderData?: boolean;
  /** Kapsayıcı: yalnızca `columns > column` düzeni (AI düz liste üretir, kapsayıcı kullanmaz) */
  seoRole?: "h1" | "summary" | "faq" | "cta" | "howto" | "list";
}

const t = (max: number, required = false): FieldSpec => ({ kind: "text", max, required });
const title = (max = 90) => t(max, true);
const href: FieldSpec = { kind: "url" };

export const AI_BLOCK_CATALOG: Record<string, BlockSpec> = {
  hero: {
    label: "Vitrin (hero)",
    usage: "Sayfanın ilk bloğu ve TEK h1 kaynağı. Sayfa konusunu ve tek net eylemi söyler.",
    variants: ["aurora-split", "commerce-spotlight"],
    maxPerPage: 1,
    seoRole: "h1",
    props: { badge: t(60), title: title(100), subtitle: t(260), primaryCtaLabel: t(40), primaryCtaHref: href, secondaryCtaLabel: t(40), secondaryCtaHref: href },
  },
  tldr_box: {
    label: "Hızlı yanıt (TL;DR)",
    usage: "Answer-First özet: arama ve yapay zeka yanıtlarının alıntılayacağı 2–3 cümle. Hero'dan hemen sonra.",
    variants: ["answer-first"],
    maxPerPage: 1,
    seoRole: "summary",
    props: { summary: { kind: "text", max: 300, required: true } },
  },
  heading: { label: "Başlık", usage: "Bölüm başlığı. Yalnızca düzey 2–4; düzey atlanmaz; sayfada h1 yoktur (hero verir).", props: { level: { kind: "number", min: 2, max: 4 }, text: title(110) } },
  paragraph: { label: "Paragraf", usage: "Düz metin paragraf (HTML yok). 2–4 cümle; ilk cümle konuyu söyler.", props: { text: { kind: "text", max: 900, required: true } } },
  stats_strip: {
    label: "Sayı şeridi",
    usage: "2–4 ölçülebilir kanıt. Sayıları kullanıcı sağlamadıkça uydurma; yer tutucu olduğu raporlanır.",
    variants: ["metrics-bar"],
    placeholderData: true,
    props: { stats: { kind: "list", minItems: 2, maxItems: 4, item: { value: t(16, true), label: t(48, true) } } },
  },
  bento_features: {
    label: "Özellik ızgarası",
    usage: "3–6 özellik/fayda kartı. Her kart tek fikir.",
    variants: ["bento-2x2"],
    props: { title: title(90), items: { kind: "list", minItems: 3, maxItems: 6, item: { title: t(60, true), description: t(200, true) } } },
  },
  icon_list: { label: "İkonlu liste", usage: "Kısa maddeler (3–8).", props: { items: { kind: "list", minItems: 2, maxItems: 8, item: { mark: t(4), title: t(70, true), text: t(180) } } } },
  split_content: { label: "Metin + görsel", usage: "Bir fikri yanında görselle anlatır. Görsel yalnızca medya kitaplığından.", props: { title: title(90), text: t(500, true), image: { kind: "image" }, alt: t(125) } },
  howto_steps: {
    label: "Adım adım (HowTo)",
    usage: "Sıralı yönerge: HowTo şeması üretir. 3–8 adım.",
    variants: ["numbered-steps"],
    seoRole: "howto",
    props: { title: title(90), steps: { kind: "list", minItems: 3, maxItems: 8, item: { title: t(70, true), description: t(260, true) } } },
  },
  faq_accordion: {
    label: "SSS (FAQPage)",
    usage: "3–8 gerçek soru. Yanıt ilk cümlede doğrudan cevap verir. FAQPage şeması üretir.",
    variants: ["clean-border"],
    maxPerPage: 1,
    seoRole: "faq",
    props: { title: title(90), items: { kind: "list", minItems: 2, maxItems: 8, item: { question: t(140, true), answer: t(420, true) } } },
  },
  comparison_table: { label: "Karşılaştırma tablosu", usage: "Seçenekleri satır satır karşılaştırır (en çok 6×6).", props: { title: title(90), headers: { kind: "strings", maxItems: 6, maxLen: 40 }, rows: { kind: "matrix", maxRows: 24, maxCols: 6, maxLen: 80 } } },
  pricing_table: {
    label: "Fiyat tablosu",
    usage: "2–4 plan. Fiyatları kullanıcı vermedikçe uydurma; yer tutucu olduğu raporlanır.",
    variants: ["tiers-3"],
    placeholderData: true,
    maxPerPage: 1,
    props: { title: title(90), plans: { kind: "list", minItems: 2, maxItems: 4, item: { name: t(40, true), price: t(30, true), description: t(180), ctaLabel: t(36), featured: { kind: "boolean" } } } },
  },
  callout: { label: "Vurgu kutusu", usage: "Tek önemli not/uyarı/ipucu.", variants: ["info-border"], props: { tone: { kind: "enum", values: ["TIP", "NOTE", "IMPORTANT", "WARNING"] }, title: t(60), text: { kind: "text", max: 320, required: true } } },
  info_box: { label: "Bilgi kartı", usage: "Başlık + kısa metin + isteğe bağlı bağlantı.", props: { kicker: t(40), title: title(70), text: t(260), linkLabel: t(40), href } },
  cta_banner: {
    label: "Çağrı bandı",
    usage: "Sayfanın sonunda tek net eylem.",
    variants: ["dark-contrast"],
    maxPerPage: 2,
    seoRole: "cta",
    props: { title: title(90), subtitle: t(200), buttonLabel: t(40, true), buttonHref: { kind: "url", required: true } },
  },
  button_row: { label: "Düğme satırı", usage: "1–3 düğme.", seoRole: "cta", props: { align: { kind: "enum", values: ["left", "center", "right"] }, buttons: { kind: "list", minItems: 1, maxItems: 3, item: { label: t(40, true), href: { kind: "url", required: true }, variant: { kind: "enum", values: ["primary", "secondary", "outline"] } } } } },
  tabs: { label: "Sekmeler", usage: "Aynı konunun 2–5 yüzü. İçerik gizli kalır: önemli metni sekmeye koyma.", props: { items: { kind: "list", minItems: 2, maxItems: 5, item: { label: t(30, true), body: t(500, true) } } } },
  toc: { label: "İçindekiler", usage: "Uzun sayfalarda bölüm bağlantıları (#çapa).", props: { items: { kind: "list", minItems: 2, maxItems: 10, item: { label: t(60, true), href: { kind: "url", required: true } } } } },
  data_table: { label: "Veri tablosu", usage: "Gerçek tablo verisi (en çok 8 sütun). Satır başlığı gereken tablolarda firstColumnHeader=true.", props: { title: title(90), headers: { kind: "strings", maxItems: 8, maxLen: 40 }, rows: { kind: "matrix", maxRows: 40, maxCols: 8, maxLen: 80 }, striped: { kind: "boolean" }, firstColumnHeader: { kind: "boolean" }, stickyHeader: { kind: "boolean" }, compact: { kind: "boolean" }, alignNumbers: { kind: "boolean" } } },
  code_block: { label: "Kod bloğu", usage: "Yalnızca teknik içerikte.", props: { language: { kind: "enum", values: ["typescript", "javascript", "bash", "json", "html", "css", "text", "python"] }, code: { kind: "text", max: 2000, required: true } } },
  image_figure: { label: "Görsel", usage: "Yalnızca medya kitaplığındaki görsel; alt metin zorunlu.", props: { url: { kind: "image", required: true }, altText: t(125, true), titleText: t(80), caption: t(160), aspectRatio: t(10) } },
  single_icon: { label: "Simge", usage: "Tek simge (yerleşik küme); süs ya da özellik işareti.", props: { icon: { kind: "enum", values: ICON_NAMES }, size: { kind: "number", min: 12, max: 160 }, color: t(30), background: t(30), href, label: t(60), align: { kind: "enum", values: ["left", "center", "right"] } } },
  countup: { label: "Sayaç", usage: "Tek büyük sayı (gerçek veri); kaydırınca sayar.", maxPerPage: 6, props: { value: { kind: "number", min: -1000000000, max: 1000000000 }, prefix: t(8), suffix: t(12), label: t(60), duration: { kind: "number", min: 1, max: 10 } } },
  marquee: { label: "Kayan şerit", usage: "Logo/ifade şeridi; kısa metinler.", maxPerPage: 2, props: { items: { kind: "strings", maxItems: 12, maxLen: 40 }, speed: { kind: "number", min: 5, max: 180 }, direction: { kind: "enum", values: ["left", "right"] } } },
  shape_divider: { label: "Şekil ayırıcı", usage: "Bölümler arası dalga/eğim; süs.", maxPerPage: 4, props: { shape: { kind: "enum", values: ["wave", "tilt", "curve", "triangle", "slant"] }, color: t(30), height: { kind: "number", min: 20, max: 300 }, flip: { kind: "boolean" } } },
  form_block: { label: "Form", usage: "Yalnızca var olan bir form (`formId`). Form uydurma.", props: { formId: t(60, true), title: t(80) } },
};

export const AI_BLOCK_TYPES = Object.keys(AI_BLOCK_CATALOG);
export const AI_BLOCK_STYLE_KEYS = ["paddingTop", "paddingBottom", "textAlign", "backgroundColor", "textColor", "maxWidth"] as const;

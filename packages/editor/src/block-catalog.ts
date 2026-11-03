import type { BlockNode } from "@nexpress/core";

/**
 * Editörün "+ Blok & Satır" kitaplığı: gruplu, aranabilir blok kataloğu ve hazır satır düzenleri.
 * Her giriş eklendiğinde denetçide düzenlenebilir ham `props` taşır (liste/alan şeması bu props'tan çıkarılır).
 * Kimlikler eklenirken yenilenir; buradaki `id`ler yalnızca şablon adıdır.
 */
export type BlockCategoryId = "layout" | "basic" | "media" | "content" | "marketing" | "interactive" | "data" | "commerce";

export const BLOCK_CATEGORIES: Array<{ id: BlockCategoryId; label: string }> = [
  { id: "layout", label: "Düzen" },
  { id: "basic", label: "Temel" },
  { id: "media", label: "Medya" },
  { id: "content", label: "İçerik" },
  { id: "marketing", label: "Pazarlama" },
  { id: "interactive", label: "Etkileşim" },
  { id: "data", label: "Veri" },
  { id: "commerce", label: "Ticaret" },
];

export interface BlockCatalogItem {
  id: string;
  label: string;
  hint: string;
  category: BlockCategoryId;
  block: BlockNode;
}

const SPAN = { desktop: 12, tablet: 12, mobile: 12 } as const;
const node = (type: string, props: Record<string, unknown>, extra: Partial<BlockNode> = {}): BlockNode =>
  ({ id: `tpl_${type}`, type, gridSpan: { ...SPAN }, props, ...extra }) as BlockNode;
const item = (id: string, label: string, category: BlockCategoryId, hint: string, block: BlockNode): BlockCatalogItem => ({ id, label, hint, category, block });

const CARD_STYLE = {
  paddingTop: "20px", paddingRight: "20px", paddingBottom: "20px", paddingLeft: "20px",
  backgroundColor: "#f8fafc", borderRadius: "12px", borderWidth: "1px", borderColor: "#e2e8f0",
} as const;

export interface RowOptions {
  /** Sütunlar kart görünümlü (arka plan, kenarlık) olsun */
  cards?: boolean;
  /** İçerik: boş yer tutucu, başlık+paragraf ya da başlık+paragraf+buton */
  content?: "placeholder" | "text" | "cta";
}

/** Yerleşim oranlarından (`6+6`, `4+8` …) düzenlenebilir satır üretir. */
export function buildRow(layout: string, widths: number[], opts: RowOptions = {}): BlockNode {
  const content = opts.content ?? "placeholder";
  return {
    id: "tpl_row",
    type: "columns",
    gridSpan: { ...SPAN },
    props: { layout, gap: "24px", verticalAlign: "stretch" },
    children: widths.map((w, i) => ({
      id: `tpl_col_${i}`,
      type: "column",
      props: { widthPct: w },
      ...(opts.cards ? { style: { ...CARD_STYLE } } : {}),
      children: [
        { id: `tpl_h_${i}`, type: "heading", props: { level: 3, text: content === "placeholder" ? `${i + 1}. Sütun` : `Başlık ${i + 1}` } },
        { id: `tpl_p_${i}`, type: "paragraph", props: { text: content === "placeholder" ? "Sütun içeriği…" : "Kısa açıklama metni; tıklayıp doğrudan düzenleyin." } },
        ...(content === "cta" ? [{ id: `tpl_b_${i}`, type: "button_element", props: { label: "Devamını oku", href: "#", styleVariant: "primary", align: "left" } } as BlockNode] : []),
      ],
    })),
  } as BlockNode;
}

/** Hazır satır düzenleri: oran + kullanım amacı (kitaplıkta "Satır" bölümünde sunulur). */
export const ROW_TEMPLATES: Array<{ id: string; label: string; hint: string; layout: string; widths: number[]; opts: RowOptions }> = [
  { id: "row_1", label: "Tek sütun", hint: "12", layout: "12", widths: [100], opts: {} },
  { id: "row_2", label: "İki eşit sütun", hint: "6+6", layout: "6+6", widths: [50, 50], opts: {} },
  { id: "row_48", label: "Dar + geniş", hint: "4+8", layout: "4+8", widths: [33.33, 66.67], opts: {} },
  { id: "row_84", label: "Geniş + dar", hint: "8+4", layout: "8+4", widths: [66.67, 33.33], opts: {} },
  { id: "row_3", label: "Üç eşit sütun", hint: "4+4+4", layout: "4+4+4", widths: [33.33, 33.33, 33.33], opts: {} },
  { id: "row_363", label: "Orta vurgulu", hint: "3+6+3", layout: "3+6+3", widths: [25, 50, 25], opts: {} },
  { id: "row_4", label: "Dört eşit sütun", hint: "3+3+3+3", layout: "3+3+3+3", widths: [25, 25, 25, 25], opts: {} },
  { id: "row_cards3", label: "3 özellik kartı", hint: "başlık + metin + buton", layout: "4+4+4", widths: [33.33, 33.33, 33.33], opts: { cards: true, content: "cta" } },
  { id: "row_cards2", label: "2 kart", hint: "başlık + metin", layout: "6+6", widths: [50, 50], opts: { cards: true, content: "text" } },
  { id: "row_cards4", label: "4 kart", hint: "başlık + metin", layout: "3+3+3+3", widths: [25, 25, 25, 25], opts: { cards: true, content: "text" } },
];

const items3 = (kind: string) => [1, 2, 3].map((n) => ({ title: `${kind} ${n}`, text: "Kısa açıklama." }));

export const BLOCK_CATALOG: BlockCatalogItem[] = [
  item("section", "Kapsayıcı bölüm", "layout", "Arka planlı, iç boşluklu alan", node("section", { title: "", containerMode: "boxed" }, {
    style: { paddingTop: "32px", paddingRight: "32px", paddingBottom: "32px", paddingLeft: "32px", backgroundColor: "#f8fafc", borderRadius: "16px", borderWidth: "1px", borderColor: "#e2e8f0" },
    children: [{ id: "tpl_sh", type: "heading", props: { level: 2, text: "Bölüm başlığı" } }, { id: "tpl_sp", type: "paragraph", props: { text: "Bölüm içi açıklama." } }],
  })),
  item("divider", "Ayırıcı", "layout", "Çizgi ya da boşluk", node("divider_spacer", { style: "line", spacingPx: 32 })),
  item("split", "Bölünmüş içerik", "layout", "Görsel + metin yan yana", node("split_content", { title: "Başlık", text: "Açıklama metni.", image: "", alt: "", reverse: false })),

  item("heading", "Başlık", "basic", "H2/H3/H4", node("heading", { level: 2, text: "Yeni alt başlık", align: "left" })),
  item("paragraph", "Paragraf", "basic", "Zengin metin", node("paragraph", { text: "Paragraf metninizi yazın." })),
  item("list", "Madde listesi", "basic", "Onaylı ya da noktalı", node("list_element", { listType: "check", items: ["Birinci madde", "İkinci madde", "Üçüncü madde"] })),
  item("quote", "Alıntı", "basic", "Yazar ve ünvanlı", node("quote", { quote: "Alıntı metni.", author: "Ad Soyad", role: "Ünvan" })),
  item("button", "Buton", "basic", "Tek bağlantı butonu", node("button_element", { label: "Devamını oku", href: "#", styleVariant: "primary", align: "left" })),
  item("button_row", "Buton grubu", "basic", "Yan yana butonlar", node("button_row", { align: "left", buttons: [{ label: "Birincil", href: "#", variant: "primary" }, { label: "İkincil", href: "#", variant: "ghost" }] })),
  item("icon_list", "İkonlu liste", "basic", "Başlık + açıklamalı maddeler", node("icon_list", { items: [{ mark: "✓", title: "Birinci özellik", text: "Açıklama" }, { mark: "✓", title: "İkinci özellik", text: "Açıklama" }] })),

  item("image", "Görsel", "media", "Alt metin, başlık, açıklama", node("image_figure", { url: "", altText: "", titleText: "", caption: "", aspectRatio: "16:9" })),
  item("gallery", "Galeri", "media", "Yatay kaydırmalı kartlar", node("gallery", { slides: items3("Görsel").map((s) => ({ title: s.title, text: s.text })) })),
  item("image_overlay", "Görsel kapak", "media", "Görsel üstünde başlık", node("image_overlay", { url: "", alt: "", title: "Başlık", subtitle: "Alt başlık", href: "" })),
  item("video", "Video", "media", "Gömülü video", node("video_embed", { url: "", title: "Video" })),
  item("video_popup", "Video bağlantısı", "media", "Video sayfasına bağlantı", node("video_popup", { url: "", title: "Videoyu izle" })),
  item("map", "Konum", "media", "Harita bağlantısı", node("map_embed", { title: "Konumumuz", query: "İstanbul" })),

  item("tldr", "Kısa yanıt", "content", "Önce-cevap özeti (AI için)", node("tldr_box", { summary: "Bu sayfanın doğrudan, kısa yanıtı." })),
  item("faq", "SSS", "content", "FAQPage şeması üretir", node("faq_accordion", { title: "Sıkça sorulan sorular", items: [{ question: "Soru?", answer: "Yanıt." }, { question: "İkinci soru?", answer: "Yanıt." }] })),
  item("howto", "Adım adım", "content", "HowTo şeması üretir", node("howto_steps", { title: "Nasıl yapılır", steps: [{ title: "1. Adım", description: "Açıklama." }, { title: "2. Adım", description: "Açıklama." }] })),
  item("info_box", "Bilgi kutusu", "content", "Başlık, metin, bağlantı", node("info_box", { kicker: "Bilgi", title: "Başlık", text: "Açıklama.", href: "", linkLabel: "" })),
  item("callout", "Not kutusu", "content", "Vurgulu uyarı/not", node("callout", { tone: "NOT", title: "Başlık", text: "Önemli bilgi." })),
  item("toc", "İçindekiler", "content", "Sayfa içi bağlantılar", node("toc", { items: [{ label: "Bölüm 1", href: "#bolum-1" }, { label: "Bölüm 2", href: "#bolum-2" }] })),
  item("code", "Kod", "content", "Kod bloğu", node("code_block", { language: "ts", code: "console.log('merhaba');" })),
  item("review", "İnceleme & puan", "content", "Review şeması", node("review_box", { itemName: "Ürün adı", rating: 4.5, verdict: "Kısa değerlendirme.", pros: ["Artı"], cons: ["Eksi"] })),

  item("hero", "Vitrin", "marketing", "Rozet, başlık, iki çağrı", node("hero", { badge: "Yeni", title: "Çarpıcı bir başlık", subtitle: "Tek cümlelik açıklama.", primaryCtaLabel: "Başla", primaryCtaHref: "#", secondaryCtaLabel: "Daha fazla", secondaryCtaHref: "#" })),
  item("cta", "Çağrı şeridi", "marketing", "Dönüşüm bandı", node("cta_banner", { title: "Hazır mısınız?", subtitle: "Hemen başlayın.", buttonLabel: "Başla", buttonHref: "#" })),
  item("stats", "İstatistik şeridi", "marketing", "Sayısal kanıt", node("stats_strip", { stats: [{ value: "100", label: "Etiket" }, { value: "24/7", label: "Destek" }, { value: "%99.9", label: "Erişilebilirlik" }] })),
  item("bento", "Özellik ızgarası", "marketing", "Bento kartlar", node("bento_features", { title: "Özellikler", items: [{ title: "Özellik 1", description: "Açıklama." }, { title: "Özellik 2", description: "Açıklama." }, { title: "Özellik 3", description: "Açıklama." }] })),
  item("pricing", "Fiyatlandırma", "marketing", "Planlar tablosu", node("pricing_table", { title: "Planlar", plans: [{ name: "Başlangıç", price: "Ücretsiz", description: "Temel özellikler.", ctaLabel: "Başla", featured: false }, { name: "Pro", price: "499 TL / ay", description: "Tüm özellikler.", ctaLabel: "Seç", featured: true }] })),
  item("testimonials", "Referanslar", "marketing", "Müşteri yorumları", node("testimonial_grid", { title: "Müşterilerimiz", items: [{ quote: "Harika bir deneyim.", name: "Ad Soyad", role: "Şirket" }] })),
  item("comparison", "Karşılaştırma", "marketing", "Yan yana tablo", node("comparison_table", { title: "Karşılaştırma", headers: ["Kriter", "Biz", "Diğer"], rows: [["Hız", "Çok hızlı", "Ortalama"]] })),

  item("single_icon", "Simge", "media", "24 yerleşik simge", node("single_icon", { icon: "star", size: 40, color: "#2563eb", background: "", href: "", label: "", align: "left" })),
  item("countup", "Sayaç", "marketing", "Kaydırınca sayar (CSS)", node("countup", { value: 1250, prefix: "", suffix: "+", label: "Mutlu müşteri", duration: 2, align: "center" })),
  item("marquee", "Kayan şerit", "marketing", "Sonsuz kayan metin (CSS)", node("marquee", { items: ["Hızlı", "Güvenli", "Esnek", "Ölçeklenebilir"], speed: 30, direction: "left" })),
  item("shape_divider", "Şekil ayırıcı", "layout", "Dalga, eğim, üçgen", node("shape_divider", { shape: "wave", color: "#0f172a", height: 80, flip: false })),

  item("tabs", "Sekmeler", "interactive", "CSS ile çalışır, JS yok", node("tabs", { items: [{ label: "Sekme 1", body: "İçerik 1" }, { label: "Sekme 2", body: "İçerik 2" }] })),
  item("accordion", "Akordeon", "interactive", "Aç/kapa liste", node("accordion", { items: [{ title: "Başlık", body: "İçerik" }] })),
  item("show_more", "Devamını göster", "interactive", "Açılır ek metin", node("show_more", { summary: "Devamını göster", body: "Ek içerik." })),
  item("modal", "Açılır not", "interactive", "Tetikleyici + metin", node("modal_panel", { trigger: "Ayrıntılar", title: "Başlık", body: "Metin." })),
  item("countdown", "Geri sayım", "interactive", "Hedef tarihe gün", node("countdown", { kicker: "Kampanya", label: "gün kaldı", targetDate: "" })),
  item("progress", "İlerleme", "interactive", "Yüzde çubuğu", node("progress_bar", { label: "Tamamlanma", value: 75 })),
  item("form", "Form", "interactive", "Form modülünden seçilir", node("form_block", { title: "Bize yazın", submitLabel: "Gönder", formId: "" })),
  item("search", "Arama", "interactive", "Site içi arama kutusu", node("search_box", { placeholder: "Ara…" })),

  item("table", "Veri tablosu", "data", "Başlık + satırlar", node("data_table", { title: "Tablo", headers: ["Sütun 1", "Sütun 2"], rows: [["A", "B"], ["C", "D"]] })),
  item("posts", "Yazı ızgarası", "data", "Kart ızgarası", node("post_grid", { title: "Son yazılar", items: items3("Yazı").map((s) => ({ ...s, excerpt: s.text, href: "" })) })),
  item("portfolio", "Çalışma ızgarası", "data", "Portföy kartları", node("portfolio_grid", { title: "Çalışmalar", items: items3("Çalışma").map((s) => ({ ...s, excerpt: s.text, href: "" })) })),
  item("user_card", "Kişi kartı", "data", "Ad, rol, tarih", node("user_card", { name: "Ad Soyad", role: "Ünvan", since: "" })),
  item("repeater", "Tekrarlayan kayıt", "data", "Liste kayıtları", node("repeater", { items: [{ title: "Kayıt 1", text: "Açıklama" }] })),

  item("product_row", "Ürün şeridi", "commerce", "3'lü ürün kartları", node("product_row", { title: "Öne çıkanlar", items: items3("Ürün").map((s) => ({ title: s.title, excerpt: s.text, price: "0 TL", image: "", href: "" })) })),
  item("product_embed", "Ürün kartı", "commerce", "Product şeması bağlı", node("product_embed", { productName: "Ürün adı", sku: "", price: "", summary: "Kısa açıklama." })),
];

/** Ada, ipucuna ve kategoriye göre süzer (büyük/küçük harf ve Türkçe i/ı duyarsız). */
export function searchCatalog(query: string, list: BlockCatalogItem[] = BLOCK_CATALOG): BlockCatalogItem[] {
  const norm = (v: string) => v.toLowerCase().replace(/ı/g, "i").normalize("NFD").replace(/[̀-ͯ]/g, "");
  const q = norm(query.trim());
  if (!q) return list;
  return list.filter((i) => norm(`${i.label} ${i.hint} ${i.block.type}`).includes(q));
}

import type { BlockNode } from "./types";
import { conditionScore, sanitizeConditions, type TemplateConditions, type TemplateContext } from "./template-conditions";

export * from "./template-conditions";

/**
 * Şablon sistemi (saf mantık): şablon türleri, çözümleme, doğrulama ve hazır (starter) şablonlar.
 * Şablonlar `type: "template"` içerik olarak saklanır (mevcut stüdyo, revizyon ve kütüphane aynen kullanılır);
 * ASLA yayınlanmaz (durum her zaman taslak) ve hiçbir ziyaretçi yüzeyine (site haritası, llms, arama) girmez.
 */
export type TemplateKind =
  | "header"
  | "footer"
  | "sidebar"
  | "page"
  | "post"
  | "category"
  | "tag"
  | "product"
  | "shop"
  | "product_category"
  | "search"
  | "pattern"
  | "campaign"
  | "kb_tech"
  | "ai_prompt";

export interface TemplateKindInfo {
  label: string;
  description: string;
  /** Şablonda bulunması zorunlu yuva bloğu (yoksa şablon kendi işini yapamaz) */
  requiredBlock?: string;
  /** Kullanıcıya önerilen yuva blokları (kütüphanede "Şablon" sekmesinde öne çıkar) */
  slots: string[];
}

export const TEMPLATE_KINDS: Record<TemplateKind, TemplateKindInfo> = {
  header: {
    label: "Header (Üst Bölüm)",
    description: "Tüm sayfaların üstü: logo, ana menü, arama, sepet ve çağrı düğmesi.",
    slots: ["tpl_site_logo", "tpl_menu", "tpl_cart_link", "search_box"],
  },
  footer: {
    label: "Footer (Alt Bölüm)",
    description: "Tüm sayfaların altı: çoklu kolonlar, menü bağlantıları, bülten ve telif satırı.",
    slots: ["tpl_site_logo", "tpl_menu", "tpl_copyright"],
  },
  sidebar: {
    label: "Kenar çubuğu (Sağ / Sol Sidebar)",
    description: "İçeriğin sağında veya solunda duran bileşenler (arama, son yazılar, kategoriler, hızlı menü).",
    slots: ["dynamic_list", "tpl_menu", "search_box"],
  },
  page: {
    label: "Sayfa",
    description: "Kurumsal sayfaların genel görünümü (tam genişlik, sağ/sol kenar çubuklu veya dar okuma düzeni).",
    requiredBlock: "tpl_post_content",
    slots: ["tpl_post_title", "tpl_post_content", "tpl_featured_image", "tpl_breadcrumb"],
  },
  post: {
    label: "Blog yazısı",
    description: "Blog yazılarının görünümü: başlık, yazar/tarih bilgisi, öne çıkan görsel, içerik ve sağ/sol sidebar.",
    requiredBlock: "tpl_post_content",
    slots: ["tpl_post_title", "tpl_post_meta", "tpl_featured_image", "tpl_post_content", "tpl_breadcrumb"],
  },
  category: {
    label: "Kategori sayfası",
    description: "Blog kategori arşivlerinin görünümü (kart ızgarası, liste veya sağ/sol kenar çubuklu).",
    requiredBlock: "tpl_archive_list",
    slots: ["tpl_archive_title", "tpl_archive_list", "tpl_breadcrumb"],
  },
  tag: {
    label: "Etiket sayfası",
    description: "Etiket arşivlerinin görünümü (kart ızgarası, liste veya kenar çubuklu).",
    requiredBlock: "tpl_archive_list",
    slots: ["tpl_archive_title", "tpl_archive_list", "tpl_breadcrumb"],
  },
  product: {
    label: "Ürün sayfası",
    description: "Mağazadaki ürün detay sayfaları. Satın alma kutusu (tpl_product_buy) yoksa mağaza ürün sayfası yerleşik görünümde kalır.",
    slots: ["tpl_post_title", "tpl_featured_image", "tpl_product_buy", "tpl_post_content", "tpl_cart_link", "tpl_breadcrumb"],
  },
  shop: {
    label: "Mağaza / ürün listesi",
    description: "Mağaza ana vitrini ve tüm ürünlerin listesi. Arşiv listesi yuvası yoksa yerleşik görünüm kullanılır.",
    requiredBlock: "tpl_archive_list",
    slots: ["tpl_archive_title", "tpl_archive_list", "tpl_cart_link", "search_box"],
  },
  product_category: {
    label: "Ürün kategorisi",
    description: "Mağaza ürün kategorisi ve koleksiyon arşivlerinin görünümü (sol filtre/menü veya tam ızgara).",
    requiredBlock: "tpl_archive_list",
    slots: ["tpl_archive_title", "tpl_archive_list", "tpl_cart_link", "tpl_breadcrumb"],
  },
  search: {
    label: "Arama sonuçları",
    description: "Site içi arama sonuçları sayfasının görünümü (arama kutusu, sonuç listesi ve önerilen içerikler).",
    requiredBlock: "tpl_archive_list",
    slots: ["search_box", "tpl_archive_title", "tpl_archive_list"],
  },
  pattern: {
    label: "Senkronize Model (Yeniden Kullanılabilir Blok)",
    description: "WordPress tarzı senkronize model: tek bir yerden düzenlenince tüm sayfalarda otomatik güncellenen akıllı blok kümesi.",
    slots: [],
  },
  campaign: {
    label: "Kampanya & Teklif Şablonu",
    description: "Özel kampanya detay sayfası: geri sayım, indirim tutarı, hediye avantajları, kampanya koşulları ve başvuru formu.",
    requiredBlock: "tpl_post_content",
    slots: ["schema_card", "tpl_post_title", "tpl_featured_image", "tpl_post_content", "countdown", "form_block"],
  },
  kb_tech: {
    label: "Teknik Makale & Rehber Şablonu",
    description: "Teknik dokümantasyon, kılavuz ve HowTo içerikleri: zorluk derecesi, sistem gereksinimleri, adım adım rehber.",
    requiredBlock: "tpl_post_content",
    slots: ["schema_card", "tpl_breadcrumb", "tpl_post_title", "tpl_post_meta", "tpl_post_content", "toc", "howto_steps"],
  },
  ai_prompt: {
    label: "Soru-Cevap & AI Prompts Şablonu",
    description: "Soru madenciliği ve PAA sayfası: öne çıkan uzman cevabı, mevzuat detayı, ilgili sorular ve soru sorma formu.",
    requiredBlock: "tpl_post_content",
    slots: ["schema_card", "tpl_breadcrumb", "tpl_post_title", "tpl_post_content", "faq_accordion", "form_block"],
  },
};

export const TEMPLATE_KIND_IDS = Object.keys(TEMPLATE_KINDS) as TemplateKind[];
export const isTemplateKind = (v: unknown): v is TemplateKind => typeof v === "string" && v in TEMPLATE_KINDS;

/** Şablon içeriğinin `schemaAttributes.template` alanı. */
export interface TemplateMeta {
  kind: TemplateKind;
  /** Bu türde atama yapılmamış her yerde kullanılır (türde en çok bir tane) */
  isDefault: boolean;
  /** Görüntüleme koşulları: atama yokken koşula uyan sayfalarda şablon kendiliğinden kullanılır */
  conditions?: TemplateConditions;
  behavior?: TemplateBehavior;
}

/**
 * Şablon davranışı. Header: yapışkan/cam (varsayılan açık), şeffaf (içeriğin üstüne biner; hero ile başlayan sayfalar için, koşulla
 * belirli sayfalara bağlanır) ve şeffafken yazı tonu. Sayfa/yazı/ürün: içerik genişliği.
 */
export type TemplateContentWidth = "narrow" | "default" | "wide" | "full";
export interface TemplateBehavior {
  sticky?: boolean;
  glass?: boolean;
  transparent?: boolean;
  tone?: "light" | "dark";
  contentWidth?: TemplateContentWidth;
}

const WIDTHS: readonly string[] = ["narrow", "default", "wide", "full"];

/** Dış kaynaktan gelen davranışı doğrular: yalnızca bilinen alanlar ve değerler kalır. */
export function sanitizeBehavior(raw: unknown): TemplateBehavior | undefined {
  const r = (raw ?? {}) as Record<string, unknown>;
  const out: TemplateBehavior = {
    ...(typeof r.sticky === "boolean" ? { sticky: r.sticky } : {}),
    ...(typeof r.glass === "boolean" ? { glass: r.glass } : {}),
    ...(typeof r.transparent === "boolean" ? { transparent: r.transparent } : {}),
    ...(r.tone === "light" || r.tone === "dark" ? { tone: r.tone } : {}),
    ...(typeof r.contentWidth === "string" && WIDTHS.includes(r.contentWidth) ? { contentWidth: r.contentWidth as TemplateContentWidth } : {}),
  };
  return Object.keys(out).length ? out : undefined;
}

/** Genişlik seçiminin satır içi stili: dar = ortalı 720px; geniş/tam = kapsayıcıdan taşar (ekran genişliğine göre). */
export function contentWidthStyle(w: TemplateContentWidth | undefined): Record<string, string> | undefined {
  switch (w) {
    case "narrow":
      return { maxWidth: "720px", marginInline: "auto" };
    case "wide":
      return { width: "min(1400px, calc(100vw - 2rem))", marginLeft: "50%", transform: "translateX(-50%)" };
    case "full":
      return { width: "100vw", marginLeft: "calc(50% - 50vw)" };
    default:
      return undefined;
  }
}

export function readTemplateMeta(attrs: Record<string, unknown> | null | undefined): TemplateMeta | null {
  const t = attrs?.template as { kind?: unknown; isDefault?: unknown; conditions?: unknown; behavior?: unknown } | undefined;
  if (!t || !isTemplateKind(t.kind)) return null;
  const conditions = t.conditions ? sanitizeConditions(t.conditions) : undefined;
  const behavior = sanitizeBehavior(t.behavior);
  return {
    kind: t.kind,
    isDefault: t.isDefault === true,
    ...(conditions && (conditions.include.length || conditions.exclude.length) ? { conditions } : {}),
    ...(behavior ? { behavior } : {}),
  };
}

export interface TemplateRecord {
  id: string;
  name: string;
  meta: TemplateMeta;
  blocks: BlockNode[];
}

/**
 * Atanmış şablon (türü uyuyorsa) → koşulu bağlamla eşleşen en özgül şablon → türün varsayılanı → null (yerleşik görünüm).
 * Eşit özgüllükte kimliği alfabetik ilk olan kazanır (kararlı).
 */
export function resolveTemplate(kind: TemplateKind, templates: TemplateRecord[], assignedId?: string | null, ctx?: TemplateContext): TemplateRecord | null {
  const ofKind = templates.filter((t) => t.meta.kind === kind);
  if (assignedId) {
    const hit = ofKind.find((t) => t.id === assignedId);
    if (hit) return hit;
  }
  if (ctx) {
    const scored = ofKind
      .map((t) => ({ t, score: conditionScore(t.meta.conditions, ctx) }))
      .filter((x) => x.score > 0)
      .sort((a, b) => b.score - a.score || a.t.id.localeCompare(b.t.id));
    if (scored[0]) return scored[0].t;
  }
  return ofKind.find((t) => t.meta.isDefault) ?? null;
}

const flat = (blocks: BlockNode[]): BlockNode[] => blocks.flatMap((b) => [b, ...(Array.isArray(b.children) ? flat(b.children as BlockNode[]) : [])]);
export const templateHasBlock = (blocks: BlockNode[], type: string) => flat(blocks).some((b) => b.type === type);

export interface TemplateIssue { level: "error" | "warning"; message: string }

/** Şablonun çalışması için gerekenler: zorunlu yuva bloğu tam bir kez, header/footer'da içerik yuvası yok. */
export function validateTemplate(kind: TemplateKind, blocks: BlockNode[]): TemplateIssue[] {
  const issues: TemplateIssue[] = [];
  const info = TEMPLATE_KINDS[kind];
  const all = flat(blocks);
  if (info.requiredBlock) {
    const n = all.filter((b) => b.type === info.requiredBlock).length;
    if (n === 0) issues.push({ level: "error", message: kind === "category" || kind === "tag" || kind === "shop" || kind === "product_category" || kind === "search" ? "Şablonda \"Arşiv listesi\" yuvası yok: yayın listesi görünmez." : "Şablonda \"İçerik\" yuvası (tpl_post_content) yok: sayfanın kendi içeriği görünmez." });
    if (n > 1) issues.push({ level: "error", message: "Bu yuva şablonda yalnızca bir kez bulunabilir." });
  }
  if ((kind === "header" || kind === "footer" || kind === "sidebar" || kind === "pattern") && all.some((b) => b.type === "tpl_post_content" || b.type === "tpl_archive_list")) {
    issues.push({ level: "error", message: "Header, footer, kenar çubuğu ve senkronize modelde ana sayfa içerik/arşiv yuvası kullanılamaz." });
  }
  if (kind === "page" || kind === "post" || kind === "campaign" || kind === "kb_tech" || kind === "ai_prompt") {
    if (!all.some((b) => b.type === "tpl_post_title") && !all.some((b) => b.type === "hero")) issues.push({ level: "warning", message: "Şablonda sayfa başlığı (h1) yok: arama motorları için bir başlık yuvası ekleyin." });
  }
  if (kind === "product" && !all.some((b) => b.type === "tpl_product_buy")) issues.push({ level: "warning", message: "Satın alma kutusu (tpl_product_buy) yok: mağaza ürün sayfalarında bu şablon kullanılmaz (yerleşik görünüm kalır); yalnızca ürün türündeki içerik sayfalarına uygulanır." });
  if (all.filter((b) => b.type === "tpl_post_title" || b.type === "tpl_archive_title").length > 1) issues.push({ level: "warning", message: "Birden fazla başlık yuvası var: sayfada tek h1 olmalı." });
  return issues;
}

// ---------------------------------------------------------------------------
// Hazır şablonlar (starter): kullanıcı seçer, kopyası oluşur ve stüdyoda düzenlenir.
// ---------------------------------------------------------------------------
const b = (id: string, type: string, props: Record<string, unknown> = {}, extra: Partial<BlockNode> = {}): BlockNode => ({ id, type: type as BlockNode["type"], props, ...extra }) as BlockNode;
const cols = (id: string, layout: string, widths: number[], children: BlockNode[][], gap = "32px"): BlockNode =>
  b(id, "columns", { layout, gap, verticalAlign: "start" }, { children: widths.map((w, i) => b(`${id}_c${i + 1}`, "column", { widthPct: w }, { children: children[i] ?? [] })) } as never);

export interface StarterTemplate {
  id: string;
  kind: TemplateKind;
  name: string;
  description: string;
  blocks: BlockNode[];
}

const RELATED: BlockNode = b("rel", "dynamic_list", { source: "posts", limit: 4, layout: "list", showImage: false, showExcerpt: false, showDate: true, excludeCurrent: true, heading: "Son yazılar" });
const SIDEBAR_SEARCH_AND_POSTS: BlockNode[] = [
  b("sb_search", "search_box", { placeholder: "Yazılarda ara…" }),
  { ...RELATED, id: "sb_rel" },
  b("sb_menu", "tpl_menu", { layout: "list" }),
];

export const STARTER_TEMPLATES: StarterTemplate[] = [
  // 1. HEADER ŞABLONLARI
  { id: "header-classic", kind: "header", name: "Klasik header", description: "Solda logo, sağda menü.", blocks: [cols("h", "3+9", [25, 75], [[b("logo", "tpl_site_logo")], [b("menu", "tpl_menu", { align: "left" })]], "24px")] },
  { id: "header-centered", kind: "header", name: "Ortalı header", description: "Üstte ortalı logo, altında ortalı menü.", blocks: [b("logo", "tpl_site_logo", { align: "center" }), b("menu", "tpl_menu", { align: "center" })] },
  { id: "header-cta", kind: "header", name: "Header — menü + çağrı düğmesi", description: "Solda logo, ortada menü, sağda aksiyon düğmesi.", blocks: [cols("h", "3+6+3", [25, 50, 25], [[b("logo", "tpl_site_logo")], [b("menu", "tpl_menu", { align: "center" })], [b("cta", "button_element", { label: "Bize ulaşın", href: "/tr/iletisim", styleVariant: "primary", align: "right" })]], "24px")] },
  { id: "header-topbar", kind: "header", name: "Header — üst duyuru şeritli", description: "İnce kampanya şeridi + logo ve sağa hizalı menü.", blocks: [b("bar", "paragraph", { text: "Yeni: Kurumsal paketlerde %20 erken lansman avantajı.", html: "<p>Yeni: Kurumsal paketlerde %20 erken lansman avantajı.</p>" }, { style: { textAlign: "center", fontSize: "13px", paddingTop: "6px", paddingBottom: "6px" } }), cols("h", "3+9", [25, 75], [[b("logo", "tpl_site_logo")], [b("menu", "tpl_menu", { align: "right" })]], "24px")] },
  { id: "header-search", kind: "header", name: "Header — arama kutulu", description: "Logo, menü ve site içi arama kutusu.", blocks: [cols("h", "3+6+3", [25, 50, 25], [[b("logo", "tpl_site_logo")], [b("menu", "tpl_menu", { align: "left" })], [b("search", "search_box", { placeholder: "Sitede ara…" })]], "24px")] },
  { id: "header-commerce", kind: "header", name: "Header — e-ticaret & mağaza", description: "Logo, menü, ürün arama kutusu ve sepet bağlantısı.", blocks: [cols("h", "3+5+4", [22, 46, 32], [[b("logo", "tpl_site_logo")], [b("menu", "tpl_menu", { align: "left" })], [cols("hc", "8+4", [65, 35], [[b("search", "search_box", { placeholder: "Ürün ara…" })], [b("cart", "tpl_cart_link", { align: "right" })]], "12px")]], "20px")] },

  { id: "header-yazilim", kind: "header", name: "Header — yazılım firması (menü + demo talebi)", description: "Solda logo, ortada menü, sağda telefon ve Demo Talebi düğmesi.", blocks: [cols("h", "3+6+3", [22, 54, 24], [[b("logo", "tpl_site_logo")], [b("menu", "tpl_menu", { align: "center" })], [b("cta", "button_element", { label: "Demo Talebi", href: "/tr/ucretsiz-tanitim", styleVariant: "primary", align: "right" })]], "24px")] },

  // 2. FOOTER ŞABLONLARI
  { id: "footer-columns", kind: "footer", name: "Üç kolonlu footer", description: "Logo/açıklama, hızlı menü, iletişim bilgileri ve telif satırı.", blocks: [cols("f", "6+3+3", [50, 25, 25], [[b("logo", "tpl_site_logo"), b("about", "paragraph", { text: "Modern, hızlı ve arama motoru dostu dijital yayın platformu.", html: "<p>Modern, hızlı ve arama motoru dostu dijital yayın platformu.</p>" })], [b("fm", "tpl_menu", { layout: "list" })], [b("fh", "heading", { text: "İletişim", level: 3, html: "İletişim" }), b("fp", "paragraph", { text: "bilgi@ornek.com • +90 (212) 555 00 00", html: "<p>bilgi@ornek.com • +90 (212) 555 00 00</p>" })]]), b("copy", "tpl_copyright")] },
  { id: "footer-four-col", kind: "footer", name: "Dört kolonlu kurumsal footer", description: "Marka özeti, kurumsal bağlantılar, çözümler, destek ve telif.", blocks: [cols("f4", "3+3+3+3", [25, 25, 25, 25], [[b("logo", "tpl_site_logo"), b("about", "paragraph", { text: "Kurumsal ölçekte yüksek performanslı web altyapısı.", html: "<p>Kurumsal ölçekte yüksek performanslı web altyapısı.</p>" })], [b("h1", "heading", { text: "Hızlı Erişim", level: 4, html: "Hızlı Erişim" }), b("fm1", "tpl_menu", { layout: "list" })], [b("h2", "heading", { text: "Çözümler", level: 4, html: "Çözümler" }), b("l2", "list_element", { style: "bullet", items: ["Kurumsal Web", "E-Ticaret Altyapısı", "Teknik SEO & GEO", "Bulut Barındırma"] })], [b("h3", "heading", { text: "Merkez Ofis", level: 4, html: "Merkez Ofis" }), b("fp", "paragraph", { text: "Levent, İstanbul\nbilgi@ornek.com", html: "<p>Levent, İstanbul<br/>bilgi@ornek.com</p>" })]]), b("copy", "tpl_copyright")] },
  { id: "footer-minimal", kind: "footer", name: "Minimal footer", description: "Yalnızca ortalı menü ve telif satırı.", blocks: [b("fm", "tpl_menu", { align: "center" }), b("copy", "tpl_copyright", { align: "center" })] },

  { id: "footer-yazilim-dizin", kind: "footer", name: "Footer — yazılım firması dizini", description: "Çözümler, e-dönüşüm, kurumsal ve destek bağlantı sütunları ile telif satırı.", blocks: [cols("fy", "3+3+3+3", [25, 25, 25, 25], [
    [b("h1", "heading", { text: "Çözümler", level: 4, html: "Çözümler" }), b("l1", "list_element", { style: "bullet", items: ["Merkez ERP", "Üretim (MRP)", "CRM", "Muhasebe", "Bulut ERP"] })],
    [b("h2", "heading", { text: "e-Dönüşüm", level: 4, html: "e-Dönüşüm" }), b("l2", "list_element", { style: "bullet", items: ["e-Fatura", "e-Arşiv", "e-İrsaliye", "e-Defter", "e-Mutabakat"] })],
    [b("h3", "heading", { text: "Kurumsal", level: 4, html: "Kurumsal" }), b("l3", "list_element", { style: "bullet", items: ["Hakkımızda", "Çözüm ortağı", "Medya merkezi", "Blog"] })],
    [b("h4", "heading", { text: "Destek", level: 4, html: "Destek" }), b("l4", "list_element", { style: "bullet", items: ["Destek asistanı", "Sıkça sorulan sorular", "Ücretsiz tanıtım", "İletişim"] })],
  ]), b("copy", "tpl_copyright")] },

  // 3. KENAR ÇUBUĞU (SIDEBAR) ŞABLONLARI
  { id: "sidebar-recent", kind: "sidebar", name: "Blog kenar çubuğu (Arama + Son yazılar)", description: "Arama kutusu, son yazılar ve kategori/sayfa menüsü.", blocks: SIDEBAR_SEARCH_AND_POSTS },
  { id: "sidebar-corporate", kind: "sidebar", name: "Kurumsal gezinme kenar çubuğu", description: "Bölüm menüsü, uzman destek kutusu ve iletişim butonu.", blocks: [b("sh", "heading", { text: "Bu Bölümde", level: 4, html: "Bu Bölümde" }), b("sm", "tpl_menu", { layout: "list" }), b("sbox", "info_box", { icon: "headphones", title: "Uzman Desteği", description: "Projeleriniz için ekibimizle hemen görüşün.", ctaText: "İletişime Geç", ctaHref: "/tr/iletisim" })] },
  { id: "sidebar-commerce", kind: "sidebar", name: "Mağaza kenar çubuğu", description: "Ürün arama, mağaza menüsü ve popüler ürünler.", blocks: [b("ss", "search_box", { placeholder: "Ürünlerde ara…" }), b("sm", "tpl_menu", { layout: "list" }), b("sp", "dynamic_list", { source: "products", limit: 3, layout: "list", showImage: true, showExcerpt: false, heading: "Öne Çıkan Ürünler" })] },

  // 4. SAYFA ŞABLONLARI (`page`)
  { id: "page-default", kind: "page", name: "Sayfa — tam genişlik", description: "Başlık ve içerik tam genişlikte.", blocks: [b("t", "tpl_post_title"), b("c", "tpl_post_content")] },
  { id: "page-sidebar", kind: "page", name: "Sayfa — sağ kenar çubuklu", description: "İçerik solda (8 birim), kenar çubuğu sağda (4 birim).", blocks: [b("bc", "tpl_breadcrumb"), cols("l", "8+4", [66.66, 33.33], [[b("t", "tpl_post_title"), b("c", "tpl_post_content")], SIDEBAR_SEARCH_AND_POSTS])] },
  { id: "page-sidebar-left", kind: "page", name: "Sayfa — sol kenar çubuklu (Doküman düzeni)", description: "Gezinme menüsü solda (4 birim), sayfa içeriği sağda (8 birim).", blocks: [b("bc", "tpl_breadcrumb"), cols("l", "4+8", [33.33, 66.66], [[b("sm", "tpl_menu", { layout: "list" }), { ...RELATED, id: "sr_left" }], [b("t", "tpl_post_title"), b("c", "tpl_post_content")]])] },

  // 5. BLOG YAZISI ŞABLONLARI (`post`)
  { id: "post-default", kind: "post", name: "Yazı — klasik okuma düzeni", description: "Breadcrumb, başlık, yazar/tarih bilgisi, kapak görseli ve içerik.", blocks: [b("bc", "tpl_breadcrumb"), b("t", "tpl_post_title"), b("m", "tpl_post_meta"), b("i", "tpl_featured_image"), b("c", "tpl_post_content")] },
  { id: "post-sidebar", kind: "post", name: "Yazı — sağ kenar çubuklu", description: "Yazı solda (8 birim), arama ve son yazılar sağ kenar çubuğunda (4 birim).", blocks: [b("bc", "tpl_breadcrumb"), cols("l", "8+4", [66.66, 33.33], [[b("t", "tpl_post_title"), b("m", "tpl_post_meta"), b("i", "tpl_featured_image"), b("c", "tpl_post_content")], SIDEBAR_SEARCH_AND_POSTS])] },
  { id: "post-sidebar-left", kind: "post", name: "Yazı — sol kenar çubuklu", description: "İçindekiler ve son yazılar solda (4 birim), makale sağda (8 birim).", blocks: [b("bc", "tpl_breadcrumb"), cols("l", "4+8", [33.33, 66.66], [[b("toc", "toc", { title: "İçindekiler" }), { ...RELATED, id: "sr_l" }], [b("t", "tpl_post_title"), b("m", "tpl_post_meta"), b("i", "tpl_featured_image"), b("c", "tpl_post_content")]])] },
  { id: "post-magazine", kind: "post", name: "Yazı — dergi & benzer yazılarla", description: "Kapak görseli üstte, makale gövdesi ve altında 3 sütun benzer yazılar.", blocks: [b("bc", "tpl_breadcrumb"), b("t", "tpl_post_title"), b("m", "tpl_post_meta"), b("i", "tpl_featured_image"), b("c", "tpl_post_content"), b("rel_cards", "dynamic_list", { source: "posts", limit: 3, layout: "cards", columns: 3, showImage: true, showExcerpt: true, showDate: true, excludeCurrent: true, heading: "İlgili Yazılar" })] },

  { id: "post-yazilim-blog", kind: "post", name: "Yazı — blog (içerik solda, hızlı bağlantı sağda)", description: "Makale solda, ücretsiz tanıtım kutusu ve son yazılar sağda.", blocks: [b("bc", "tpl_breadcrumb"), cols("l", "8+4", [66.66, 33.33], [[b("t", "tpl_post_title"), b("m", "tpl_post_meta"), b("c", "tpl_post_content")], [b("demo", "info_box", { icon: "headphones", title: "Ücretsiz tanıtım", text: "Programı birlikte inceleyelim.", linkLabel: "Talep et", href: "/tr/ucretsiz-tanitim" }), { ...RELATED, id: "sr_yz" }]])] },

  // 6. KATEGORİ ARŞİVİ ŞABLONLARI (`category`)
  { id: "category-grid", kind: "category", name: "Kategori — 3 sütun kart ızgarası", description: "Kategori başlığı ve 3 sütunlu yayın kartları.", blocks: [b("bc", "tpl_breadcrumb"), b("t", "tpl_archive_title"), b("l", "tpl_archive_list", { layout: "cards", columns: 3 })] },
  { id: "category-sidebar-right", kind: "category", name: "Kategori — sağ kenar çubuklu", description: "Sol tarafta 2 sütun kategori yazıları, sağda arama ve son yazılar.", blocks: [b("bc", "tpl_breadcrumb"), b("t", "tpl_archive_title"), cols("cl", "8+4", [66.66, 33.33], [[b("l", "tpl_archive_list", { layout: "cards", columns: 2 })], SIDEBAR_SEARCH_AND_POSTS])] },
  { id: "category-sidebar-left", kind: "category", name: "Kategori — sol kenar çubuklu", description: "Solda kategori menüsü ve arama, sağda yayın kartları.", blocks: [b("bc", "tpl_breadcrumb"), b("t", "tpl_archive_title"), cols("cl", "4+8", [33.33, 66.66], [SIDEBAR_SEARCH_AND_POSTS, [b("l", "tpl_archive_list", { layout: "cards", columns: 2 })]])] },
  { id: "category-list", kind: "category", name: "Kategori — editoryal liste", description: "Başlık ve satır satır okuma listesi.", blocks: [b("bc", "tpl_breadcrumb"), b("t", "tpl_archive_title"), b("l", "tpl_archive_list", { layout: "list", columns: 1 })] },

  // 7. ETİKET ARŞİVİ ŞABLONLARI (`tag`)
  { id: "tag-grid", kind: "tag", name: "Etiket — 3 sütun kart ızgarası", description: "Etiket başlığı ve 3 sütunlu yayın kartları.", blocks: [b("bc", "tpl_breadcrumb"), b("t", "tpl_archive_title"), b("l", "tpl_archive_list", { layout: "cards", columns: 3 })] },
  { id: "tag-sidebar-right", kind: "tag", name: "Etiket — sağ kenar çubuklu", description: "Etiket yayınları solda, arama ve son yazılar sağda.", blocks: [b("bc", "tpl_breadcrumb"), b("t", "tpl_archive_title"), cols("tl", "8+4", [66.66, 33.33], [[b("l", "tpl_archive_list", { layout: "cards", columns: 2 })], SIDEBAR_SEARCH_AND_POSTS])] },
  { id: "tag-list", kind: "tag", name: "Etiket — kompakt liste", description: "Etikete ait tüm içerikler satır listesinde.", blocks: [b("t", "tpl_archive_title"), b("l", "tpl_archive_list", { layout: "list", columns: 1 })] },

  // 8. ÜRÜN DETAY ŞABLONLARI (`product`)
  { id: "product-default", kind: "product", name: "Ürün — klasik vitrin", description: "Görsel solda, başlık ve satın alma kutusu sağda, altında detaylı açıklama.", blocks: [b("bc", "tpl_breadcrumb"), cols("l", "6+6", [50, 50], [[b("i", "tpl_featured_image")], [b("t", "tpl_post_title"), b("buy", "tpl_product_buy")]]), b("c", "tpl_post_content")] },
  { id: "product-related", kind: "product", name: "Ürün — benzer ürünlerle", description: "Satın alma kutusu, açıklama ve altında 4 sütun benzer ürünler.", blocks: [b("bc", "tpl_breadcrumb"), cols("l", "6+6", [50, 50], [[b("i", "tpl_featured_image")], [b("t", "tpl_post_title"), b("buy", "tpl_product_buy")]]), b("c", "tpl_post_content"), b("rel", "dynamic_list", { source: "products", limit: 4, layout: "cards", columns: 4, showExcerpt: false, excludeCurrent: true, heading: "Benzer ürünler" })] },
  { id: "product-sidebar-right", kind: "product", name: "Ürün — sağ kenar çubuklu (Güven & Teslimat)", description: "Ürün detayı solda (8 birim), teslimat/garanti avantaj kutuları sağda (4 birim).", blocks: [b("bc", "tpl_breadcrumb"), cols("pl", "8+4", [66.66, 33.33], [[cols("p_top", "6+6", [50, 50], [[b("i", "tpl_featured_image")], [b("t", "tpl_post_title"), b("buy", "tpl_product_buy")]]), b("c", "tpl_post_content")], [b("p_features", "icon_list", { items: [{ icon: "truck", title: "Aynı Gün Kargo", description: "Saat 16:00'a kadar verilen siparişlerde." }, { icon: "shield", title: "2 Yıl Resmi Garanti", description: "Yetkili servis ve birebir değişim güvencesi." }, { icon: "credit-card", title: "Güvenli Ödeme", description: "256-bit SSL ve 12 taksit imkanı." }] }), b("p_rel", "dynamic_list", { source: "products", limit: 3, layout: "list", showExcerpt: false, excludeCurrent: true, heading: "Popüler Ürünler" })]])] },

  // 9. MAĞAZA / ÜRÜN LİSTESİ ŞABLONLARI (`shop`)
  { id: "shop-grid", kind: "shop", name: "Mağaza — 4 sütun ürün ızgarası", description: "Ürünler 4 sütunlu kart ızgarasında, üstte sepet bağlantısıyla.", blocks: [b("cart", "tpl_cart_link", { align: "right" }), b("t", "tpl_archive_title"), b("l", "tpl_archive_list", { layout: "cards", columns: 4 })] },
  { id: "shop-sidebar-left", kind: "shop", name: "Mağaza — sol filtre & kenar çubuklu", description: "Solda ürün arama ve kategori menüsü (4 birim), sağda 3 sütun ürün ızgarası (8 birim).", blocks: [cols("sh_top", "8+4", [66.66, 33.33], [[b("t", "tpl_archive_title")], [b("cart", "tpl_cart_link", { align: "right" })]]), cols("sh_body", "4+8", [28, 72], [[b("s_search", "search_box", { placeholder: "Ürün ara…" }), b("s_menu", "tpl_menu", { layout: "list" })], [b("l", "tpl_archive_list", { layout: "cards", columns: 3 })]])] },
  { id: "shop-list", kind: "shop", name: "Mağaza — liste görünümü", description: "Ürünler satır satır karşılaştırmalı listede.", blocks: [b("t", "tpl_archive_title"), b("l", "tpl_archive_list", { layout: "list", columns: 1 }), b("cart", "tpl_cart_link")] },

  // 10. ÜRÜN KATEGORİSİ ŞABLONLARI (`product_category`)
  { id: "product-category-grid", kind: "product_category", name: "Ürün kategorisi — 4 sütun vitrin", description: "Breadcrumb, kategori başlığı, sepet ve 4 sütunlu ürün kartları.", blocks: [cols("pc_top", "8+4", [66.66, 33.33], [[b("bc", "tpl_breadcrumb"), b("t", "tpl_archive_title")], [b("cart", "tpl_cart_link", { align: "right" })]]), b("l", "tpl_archive_list", { layout: "cards", columns: 4 })] },
  { id: "product-category-sidebar-left", kind: "product_category", name: "Ürün kategorisi — sol kenar çubuklu", description: "Solda kategori menüsü ve arama, sağda 3 sütun kategori ürünleri.", blocks: [b("bc", "tpl_breadcrumb"), b("t", "tpl_archive_title"), cols("pc_body", "4+8", [28, 72], [[b("pc_search", "search_box", { placeholder: "Kategoride ara…" }), b("pc_menu", "tpl_menu", { layout: "list" })], [b("l", "tpl_archive_list", { layout: "cards", columns: 3 })]])] },

  // 11. ARAMA SONUÇLARI ŞABLONLARI (`search`)
  { id: "search-default", kind: "search", name: "Arama sonuçları — standart", description: "Üstte geniş arama kutusu, altında bulunan içeriklerin listesi.", blocks: [b("t", "tpl_archive_title"), b("s_box", "search_box", { placeholder: "Yeni bir arama yapın…" }), b("l", "tpl_archive_list", { layout: "list", columns: 1 })] },
  { id: "search-sidebar-right", kind: "search", name: "Arama sonuçları — sağ kenar çubuklu", description: "Arama sonuçları solda (8 birim), popüler yazılar ve menü sağda (4 birim).", blocks: [b("t", "tpl_archive_title"), b("s_box", "search_box", { placeholder: "Anahtar kelime yazın…" }), cols("s_cols", "8+4", [66.66, 33.33], [[b("l", "tpl_archive_list", { layout: "cards", columns: 2 })], SIDEBAR_SEARCH_AND_POSTS])] },

  // 12. KURUMSAL YAZILIM & ERP ŞABLONU (`product`)
  {
    id: "product-software-erp",
    kind: "product",
    name: "Yazılım & ERP Vitrini — Demo ve Modül Sekmeli",
    description: "Referans ERP standartlarında: Hero + Demo istek formu, SoftwareApplication şema kartı, modül sekmeleri ve donanım gereksinimleri.",
    blocks: [
      b("bc", "tpl_breadcrumb"),
      cols("soft_top", "7+5", [58, 42], [
        [
          b("t", "tpl_post_title", { level: "h1" }),
          b("soft_schema", "schema_card", { schema: "software" }),
          b("buy", "tpl_product_buy", { buttonText: "Teklif Al / Sipariş Ver" }),
        ],
        [
          b("soft_card", "info_box", {
            icon: "sparkles",
            title: "Ücretsiz Canlı Demo Talebi",
            text: "Uzmanlarımız işletmenizi ziyaret etsin veya online ortamda ekran paylaşımıyla tüm modülleri tanıtsın.",
            linkText: "Demo Formunu Doldurun",
            linkHref: "/tr/ucretsiz-tanitim",
            tone: "primary",
          }),
        ],
      ]),
      b("c", "tpl_post_content"),
    ],
  },

  // 13. KAMPANYA VE TEKLİF ŞABLONU (`campaign`)
  {
    id: "campaign-detail",
    kind: "campaign",
    name: "Kampanya Detayı — İndirim, Geri Sayım ve Başvuru",
    description: "Özel indirim tutarı, hediye avantajı, geçerlilik tarihi, şartlar tablosu ve hızlı teklif formu.",
    blocks: [
      b("bc", "tpl_breadcrumb"),
      b("t", "tpl_post_title", { level: "h1" }),
      b("camp_card", "schema_card", { schema: "offer" }),
      cols("camp_body", "8+4", [66.66, 33.33], [
        [
          b("i", "tpl_featured_image", { rounded: true }),
          b("c", "tpl_post_content"),
        ],
        [
          b("camp_apply", "info_box", {
            icon: "megaphone",
            title: "Fırsattan Yararlanın",
            text: "Kampanya süresi dolmadan müşteri temsilcimizle görüşün ve özel indirim kodunuzu tanımlayın.",
            linkText: "Bizi Arayın: 0 (232) 555 00 00",
            linkHref: "tel:02325550000",
            tone: "accent",
          }),
          b("camp_rel", "dynamic_list", {
            source: "posts",
            limit: 3,
            layout: "cards",
            showExcerpt: false,
            excludeCurrent: true,
            heading: "Diğer Kampanyalar",
          }),
        ],
      ]),
    ],
  },

  // 14. TEKNİK MAKALE VE REHBER ŞABLONU (`kb_tech`)
  {
    id: "tech-article-guide",
    kind: "kb_tech",
    name: "Teknik Makale — Ön Koşullar & Rehber Düzeni",
    description: "Teknik doküman, HowTo ve kılavuz: zorluk derecesi, bağımlılıklar, içindekiler ve adım adım rehber.",
    blocks: [
      b("bc", "tpl_breadcrumb"),
      b("t", "tpl_post_title", { level: "h1" }),
      b("m", "tpl_post_meta", { showAuthor: true, showDate: true, showReadingTime: true }),
      b("tech_badge", "schema_card", { schema: "tech" }),
      cols("tech_layout", "4+8", [33.33, 66.66], [
        [
          b("toc", "toc", { title: "İçindekiler" }),
          b("support_box", "info_box", {
            icon: "headphones",
            title: "Teknik Destek Masası",
            text: "Kurulum veya veri aktarımında takıldığınız her an uzak masaüstü desteğimizle yanınızdayız.",
            linkText: "Destek Talebi Aç",
            linkHref: "/tr/destek-asistani",
            tone: "primary",
          }),
        ],
        [
          b("c", "tpl_post_content"),
        ],
      ]),
    ],
  },

  // 15. SORU-CEVAP VE AI PROMPT ŞABLONU (`ai_prompt`)
  {
    id: "qa-single",
    kind: "ai_prompt",
    name: "Soru-Cevap — Öne Çıkan Uzman Cevabı (PAA)",
    description: "Google Featured Snippet uyumlu tekil soru sayfası: öne çıkan kısa cevap, detaylı mevzuat ve soru sorma alanı.",
    blocks: [
      b("bc", "tpl_breadcrumb"),
      b("t", "tpl_post_title", { level: "h1" }),
      b("qa_box", "schema_card", { schema: "qa" }),
      cols("qa_layout", "8+4", [66.66, 33.33], [
        [
          b("c", "tpl_post_content"),
        ],
        [
          b("ask_box", "info_box", {
            icon: "help-circle",
            title: "Sorunuz mu Var?",
            text: "Bu konu hakkında aklınıza takılan soruları uzmanlarımıza iletin, en kısa sürede yanıtlayalım.",
            linkText: "Uzmana Soru Sorun",
            linkHref: "/tr/iletisim",
            tone: "primary",
          }),
          b("related_qa", "dynamic_list", {
            source: "posts",
            limit: 4,
            layout: "list",
            showDate: false,
            excludeCurrent: true,
            heading: "İlgili Sorular",
          }),
        ],
      ]),
    ],
  },

  // 16. DESTEK VE İNDİRME MERKEZİ ŞABLONU (`page`)
  {
    id: "destek-hub",
    kind: "page",
    name: "Destek ve İndirme Merkezi (Hub)",
    description: "Uzak masaüstü AnyDesk/TeamViewer araçları, lisans sorgulama, telefon/WhatsApp hatları ve SSS.",
    blocks: [
      b("bc", "tpl_breadcrumb"),
      b("t", "tpl_post_title", { level: "h1" }),
      b("c", "tpl_post_content"),
      cols("remote_tools", "4+4+4", [33.33, 33.33, 33.33], [
        [
          b("t1", "info_box", {
            icon: "monitor",
            title: "AnyDesk İndir",
            text: "Hızlı ve güvenli uzak masaüstü bağlantı istemcisi.",
            linkText: "AnyDesk İndir (v7)",
            linkHref: "https://anydesk.com",
            tone: "primary",
          }),
        ],
        [
          b("t2", "info_box", {
            icon: "monitor",
            title: "Alpemix İndir",
            text: "Kurulum gerektirmeyen pratik yerli uzak destek aracı.",
            linkText: "Alpemix İndir",
            linkHref: "https://alpemix.com",
            tone: "accent",
          }),
        ],
        [
          b("t3", "info_box", {
            icon: "headphones",
            title: "Çağrı Merkezi",
            text: "Hafta içi 08:30 - 18:30 arası kesintisiz telefon desteği.",
            linkText: "0 (232) 555 00 00",
            linkHref: "tel:02325550000",
            tone: "muted",
          }),
        ],
      ]),
    ],
  },

  // 17. SENKRONİZE MODEL BAŞLANGICI (`pattern`)
  {
    id: "pattern-hero-cta",
    kind: "pattern",
    name: "Senkronize Model: Kurumsal Hero & Hızlı İletişim",
    description: "Tek bir yerden düzenlenince kullanıldığı tüm sayfalarda otomatik güncellenen akıllı çağrı bloğu.",
    blocks: [
      cols("pat_cols", "8+4", [66.66, 33.33], [
        [
          b("pat_h", "heading", { level: 2, text: "İşletmenizi Dijital Çağa Taşıyın" }),
          b("pat_p", "paragraph", { text: "Wolvox ERP ve e-Dönüşüm çözümleriyle fatura, stok ve finans süreçlerinizi tek ekrandan yönetin." }),
          b("pat_btn", "button_element", { label: "Hemen Teklif Alın", href: "/tr/ucretsiz-tanitim", styleVariant: "primary" }),
        ],
        [
          b("pat_box", "info_box", {
            icon: "award",
            title: "Neden Biz?",
            text: "15+ yıllık tecrübe, 5.000+ mutlu müşteri, İzmir ve Ege genelinde yerinde kurulum & eğitim güvencesi.",
            tone: "primary",
          }),
        ],
      ]),
    ],
  },
];

/** Her çağrıda benzersiz kimlikli kopya (stüdyoda aynı kimlikler çakışmasın). */
export function cloneStarterBlocks(blocks: BlockNode[], seed = Math.random().toString(36).slice(2, 7)): BlockNode[] {
  const walk = (list: BlockNode[]): BlockNode[] => list.map((x) => ({ ...x, id: `${x.id}_${seed}`, props: { ...(x.props ?? {}) }, ...(Array.isArray(x.children) ? { children: walk(x.children as BlockNode[]) } : {}) }) as BlockNode);
  return walk(blocks);
}

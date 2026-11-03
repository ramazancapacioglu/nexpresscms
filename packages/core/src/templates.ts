import type { BlockNode } from "./types";
import { conditionScore, sanitizeConditions, type TemplateConditions, type TemplateContext } from "./template-conditions";

export * from "./template-conditions";

/**
 * Şablon sistemi (saf mantık): şablon türleri, çözümleme, doğrulama ve hazır (starter) şablonlar.
 * Şablonlar `type: "template"` içerik olarak saklanır (mevcut stüdyo, revizyon ve kütüphane aynen kullanılır);
 * ASLA yayınlanmaz (durum her zaman taslak) ve hiçbir ziyaretçi yüzeyine (site haritası, llms, arama) girmez.
 */
export type TemplateKind = "header" | "footer" | "sidebar" | "page" | "post" | "category" | "tag" | "product" | "shop";

export interface TemplateKindInfo {
  label: string;
  description: string;
  /** Şablonda bulunması zorunlu yuva bloğu (yoksa şablon kendi işini yapamaz) */
  requiredBlock?: string;
  /** Kullanıcıya önerilen yuva blokları (kütüphanede "Şablon" sekmesinde öne çıkar) */
  slots: string[];
}

export const TEMPLATE_KINDS: Record<TemplateKind, TemplateKindInfo> = {
  header: { label: "Header", description: "Tüm sayfaların üstü: logo, menü, düğme.", slots: ["tpl_site_logo", "tpl_menu"] },
  footer: { label: "Footer", description: "Tüm sayfaların altı: kolonlar, menü, telif.", slots: ["tpl_site_logo", "tpl_menu", "tpl_copyright"] },
  sidebar: { label: "Kenar çubuğu", description: "İçeriğin yanında duran bloklar (son yazılar, bağlantılar).", slots: ["dynamic_list", "tpl_menu"] },
  page: { label: "Sayfa", description: "Sayfaların genel görünümü.", requiredBlock: "tpl_post_content", slots: ["tpl_post_title", "tpl_post_content", "tpl_featured_image", "tpl_breadcrumb"] },
  post: { label: "Blog yazısı", description: "Yazıların görünümü: başlık, bilgi satırı, görsel, içerik.", requiredBlock: "tpl_post_content", slots: ["tpl_post_title", "tpl_post_meta", "tpl_featured_image", "tpl_post_content", "tpl_breadcrumb"] },
  category: { label: "Kategori sayfası", description: "Kategori arşivlerinin görünümü.", requiredBlock: "tpl_archive_list", slots: ["tpl_archive_title", "tpl_archive_list", "tpl_breadcrumb"] },
  tag: { label: "Etiket sayfası", description: "Etiket arşivlerinin görünümü.", requiredBlock: "tpl_archive_list", slots: ["tpl_archive_title", "tpl_archive_list", "tpl_breadcrumb"] },
  product: { label: "Ürün sayfası", description: "Mağazadaki ürün sayfaları ve ürün türündeki içerikler. Satın alma kutusu (tpl_product_buy) yoksa mağaza ürün sayfası yerleşik görünümde kalır.", slots: ["tpl_post_title", "tpl_featured_image", "tpl_product_buy", "tpl_post_content", "tpl_cart_link"] },
  shop: { label: "Mağaza / ürün listesi", description: "Mağaza ana sayfası ve ürün listesi. Arşiv listesi yuvası yoksa yerleşik görünüm kullanılır.", requiredBlock: "tpl_archive_list", slots: ["tpl_archive_title", "tpl_archive_list", "tpl_cart_link"] },
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
  /** Yalnızca header: yapışkan (sayfa kayarken üstte kalır) ve buzlu cam arka plan. Varsayılan: ikisi de açık. */
  behavior?: { sticky?: boolean; glass?: boolean };
}

export function readTemplateMeta(attrs: Record<string, unknown> | null | undefined): TemplateMeta | null {
  const t = attrs?.template as { kind?: unknown; isDefault?: unknown; conditions?: unknown; behavior?: { sticky?: unknown; glass?: unknown } } | undefined;
  if (!t || !isTemplateKind(t.kind)) return null;
  const conditions = t.conditions ? sanitizeConditions(t.conditions) : undefined;
  const behavior = t.behavior ? { ...(typeof t.behavior.sticky === "boolean" ? { sticky: t.behavior.sticky } : {}), ...(typeof t.behavior.glass === "boolean" ? { glass: t.behavior.glass } : {}) } : undefined;
  return {
    kind: t.kind,
    isDefault: t.isDefault === true,
    ...(conditions && (conditions.include.length || conditions.exclude.length) ? { conditions } : {}),
    ...(behavior && Object.keys(behavior).length ? { behavior } : {}),
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
    if (n === 0) issues.push({ level: "error", message: kind === "page" || kind === "post" ? "Şablonda \"İçerik\" yuvası (tpl_post_content) yok: sayfanın kendi içeriği görünmez." : "Şablonda \"Arşiv listesi\" yuvası yok: yayın listesi görünmez." });
    if (n > 1) issues.push({ level: "error", message: "Bu yuva şablonda yalnızca bir kez bulunabilir." });
  }
  if ((kind === "header" || kind === "footer" || kind === "sidebar") && all.some((b) => b.type === "tpl_post_content" || b.type === "tpl_archive_list")) {
    issues.push({ level: "error", message: "Header, footer ve kenar çubuğunda içerik/arşiv yuvası kullanılamaz." });
  }
  if (kind === "page" || kind === "post") {
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

export const STARTER_TEMPLATES: StarterTemplate[] = [
  { id: "header-classic", kind: "header", name: "Klasik header", description: "Solda logo, ortada menü.", blocks: [cols("h", "3+9", [25, 75], [[b("logo", "tpl_site_logo")], [b("menu", "tpl_menu", { align: "left" })]], "24px")] },
  { id: "header-centered", kind: "header", name: "Ortalı header", description: "Ortada logo, altında menü.", blocks: [b("logo", "tpl_site_logo", { align: "center" }), b("menu", "tpl_menu", { align: "center" })] },
  { id: "footer-columns", kind: "footer", name: "Üç kolonlu footer", description: "Logo/açıklama, menü ve telif satırı.", blocks: [cols("f", "6+3+3", [50, 25, 25], [[b("logo", "tpl_site_logo"), b("about", "paragraph", { text: "Kısa bir tanıtım metni yazın.", html: "<p>Kısa bir tanıtım metni yazın.</p>" })], [b("fm", "tpl_menu", { layout: "list" })], [b("fh", "heading", { text: "İletişim", level: 3, html: "İletişim" }), b("fp", "paragraph", { text: "bilgi@ornek.com", html: "<p>bilgi@ornek.com</p>" })]]), b("copy", "tpl_copyright")] },
  { id: "footer-minimal", kind: "footer", name: "Minimal footer", description: "Yalnızca menü ve telif.", blocks: [b("fm", "tpl_menu", { align: "center" }), b("copy", "tpl_copyright", { align: "center" })] },
  { id: "sidebar-recent", kind: "sidebar", name: "Son yazılar kenar çubuğu", description: "Son yazılar ve menü.", blocks: [{ ...RELATED, id: "sr" }, b("sm", "tpl_menu", { layout: "list" })] },
  { id: "page-default", kind: "page", name: "Sayfa — tam genişlik", description: "Başlık ve içerik tam genişlikte.", blocks: [b("t", "tpl_post_title"), b("c", "tpl_post_content")] },
  { id: "page-sidebar", kind: "page", name: "Sayfa — sağ kenar çubuklu", description: "İçerik solda, kenar çubuğu sağda.", blocks: [b("bc", "tpl_breadcrumb"), cols("l", "8+4", [66.66, 33.33], [[b("t", "tpl_post_title"), b("c", "tpl_post_content")], [{ ...RELATED, id: "sr" }]])] },
  { id: "post-default", kind: "post", name: "Yazı — klasik", description: "Başlık, bilgi satırı, görsel, içerik.", blocks: [b("bc", "tpl_breadcrumb"), b("t", "tpl_post_title"), b("m", "tpl_post_meta"), b("i", "tpl_featured_image"), b("c", "tpl_post_content")] },
  { id: "post-sidebar", kind: "post", name: "Yazı — kenar çubuklu", description: "Yazı solda, son yazılar sağda.", blocks: [b("bc", "tpl_breadcrumb"), cols("l", "8+4", [66.66, 33.33], [[b("t", "tpl_post_title"), b("m", "tpl_post_meta"), b("i", "tpl_featured_image"), b("c", "tpl_post_content")], [{ ...RELATED, id: "sr" }]])] },
  { id: "category-grid", kind: "category", name: "Kategori — kart ızgarası", description: "Başlık ve yayın kartları.", blocks: [b("bc", "tpl_breadcrumb"), b("t", "tpl_archive_title"), b("l", "tpl_archive_list", { layout: "cards", columns: 3 })] },
  { id: "category-list", kind: "category", name: "Kategori — liste", description: "Başlık ve satır satır liste.", blocks: [b("t", "tpl_archive_title"), b("l", "tpl_archive_list", { layout: "list", columns: 1 })] },
  { id: "tag-grid", kind: "tag", name: "Etiket — kart ızgarası", description: "Başlık ve yayın kartları.", blocks: [b("t", "tpl_archive_title"), b("l", "tpl_archive_list", { layout: "cards", columns: 3 })] },
  { id: "product-default", kind: "product", name: "Ürün — klasik", description: "Başlık, görsel, fiyat/satın alma kutusu ve açıklama.", blocks: [b("bc", "tpl_breadcrumb"), cols("l", "6+6", [50, 50], [[b("i", "tpl_featured_image")], [b("t", "tpl_post_title"), b("buy", "tpl_product_buy")]]), b("c", "tpl_post_content")] },
  { id: "product-related", kind: "product", name: "Ürün — benzer ürünlerle", description: "Satın alma kutusu ve altında benzer ürünler.", blocks: [b("bc", "tpl_breadcrumb"), cols("l", "6+6", [50, 50], [[b("i", "tpl_featured_image")], [b("t", "tpl_post_title"), b("buy", "tpl_product_buy")]]), b("c", "tpl_post_content"), b("rel", "dynamic_list", { source: "products", limit: 4, layout: "cards", columns: 4, showExcerpt: false, excludeCurrent: true, heading: "Benzer ürünler" })] },
  { id: "shop-grid", kind: "shop", name: "Mağaza — ürün ızgarası", description: "Ürünler kart ızgarasında, sepet bağlantısıyla.", blocks: [b("cart", "tpl_cart_link", { align: "right" }), b("t", "tpl_archive_title"), b("l", "tpl_archive_list", { layout: "cards", columns: 4 })] },
  { id: "shop-list", kind: "shop", name: "Mağaza — liste", description: "Ürünler satır satır.", blocks: [b("t", "tpl_archive_title"), b("l", "tpl_archive_list", { layout: "list", columns: 1 }), b("cart", "tpl_cart_link")] },
];

/** Her çağrıda benzersiz kimlikli kopya (stüdyoda aynı kimlikler çakışmasın). */
export function cloneStarterBlocks(blocks: BlockNode[], seed = Math.random().toString(36).slice(2, 7)): BlockNode[] {
  const walk = (list: BlockNode[]): BlockNode[] => list.map((x) => ({ ...x, id: `${x.id}_${seed}`, props: { ...(x.props ?? {}) }, ...(Array.isArray(x.children) ? { children: walk(x.children as BlockNode[]) } : {}) }) as BlockNode);
  return walk(blocks);
}

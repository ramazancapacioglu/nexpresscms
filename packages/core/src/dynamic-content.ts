import type { BlockNode } from "./types";

/**
 * Dinamik içerik (sorgu döngüsü) saf mantığı: blok özelliklerini doğrular, adayları süzer ve sıralar.
 * Veri okuma uygulamada (`lib/dynamic-content.ts`); burada veritabanı yoktur. Sonuç her istekte güncel veriden üretilir
 * (Markdown önbelleğine girmez).
 */
export type DynamicSource = "posts" | "pages" | "products";
export type DynamicOrder = "newest" | "oldest" | "title";
export type DynamicLayout = "cards" | "list" | "carousel";
export type DynamicCardStyle = "default" | "minimal" | "overlay" | "featured";

export interface DynamicQuery {
  source: DynamicSource;
  /** Taksonomi slug'ı (kategori) */
  category: string;
  /** Taksonomi slug'ı (etiket) */
  tag: string;
  limit: number;
  orderBy: DynamicOrder;
  /** Mevcut sayfayı listeden çıkar (örn. "ilgili yazılar") */
  excludeCurrent: boolean;
  layout: DynamicLayout;
  /** Kart görünümü (kartlar/atlıkarınca düzeninde) */
  cardStyle: DynamicCardStyle;
  columns: number;
  showImage: boolean;
  showExcerpt: boolean;
  showDate: boolean;
  heading: string;
  emptyText: string;
  /** Ziyaretçi denetimleri (URL parametreleriyle çalışır, JS yok) */
  showSearch: boolean;
  showSort: boolean;
  showFilters: boolean;
  /** Sayfalama: `limit` sayfa başına öğe sayısıdır */
  paginate: boolean;
  /** Yalnızca ürünler: ziyaretçi için fiyat aralığı süzgeci */
  showPriceFilter: boolean;
}

export const DYNAMIC_MAX_ITEMS = 24;

const clip = (v: unknown, n: number) => (typeof v === "string" ? v.trim().slice(0, n) : "");
const bool = (v: unknown, d: boolean) => (typeof v === "boolean" ? v : d);

/** Terim karşılaştırması için slug biçimi (Türkçe harfler sadeleşir). */
export function termSlug(input: string): string {
  const map: Record<string, string> = { ç: "c", ğ: "g", ı: "i", ö: "o", ş: "s", ü: "u" };
  return input
    .normalize("NFKD")
    .toLowerCase()
    .replace(/ı/g, "i")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[çğıöşü]/g, (c) => map[c] ?? c)
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** Blok özelliklerinden güvenli sorgu: bilinmeyen/bozuk değerler varsayılana düşer, sınırlar uygulanır. */
export function normalizeDynamicQuery(props: Record<string, unknown> | null | undefined): DynamicQuery {
  const p = props ?? {};
  const source: DynamicSource = p.source === "pages" || p.source === "products" ? p.source : "posts";
  const n = Math.round(Number(p.limit));
  const limit = n >= 1 ? Math.min(DYNAMIC_MAX_ITEMS, n) : 6; // geçersiz/olumsuz sayı varsayılana düşer
  return {
    source,
    category: termSlug(clip(p.category, 80)),
    tag: termSlug(clip(p.tag, 80)),
    limit,
    orderBy: p.orderBy === "oldest" || p.orderBy === "title" ? p.orderBy : "newest",
    excludeCurrent: bool(p.excludeCurrent, false),
    layout: p.layout === "list" || p.layout === "carousel" ? p.layout : "cards",
    cardStyle: p.cardStyle === "minimal" || p.cardStyle === "overlay" || p.cardStyle === "featured" ? p.cardStyle : "default",
    columns: Math.min(4, Math.max(1, Math.round(Number(p.columns)) || 3)),
    showImage: bool(p.showImage, true),
    showExcerpt: bool(p.showExcerpt, true),
    showDate: bool(p.showDate, true),
    heading: clip(p.heading, 100),
    emptyText: clip(p.emptyText, 160),
    showSearch: bool(p.showSearch, false),
    showSort: bool(p.showSort, false),
    showFilters: bool(p.showFilters, false),
    paginate: bool(p.paginate, false),
    showPriceFilter: source === "products" && bool(p.showPriceFilter, false),
  };
}

export interface DynamicCandidate {
  id: string;
  kind: DynamicSource;
  title: string;
  url: string;
  excerpt: string;
  image?: string | null;
  imageAlt?: string;
  /** ISO tarih (yayın) */
  date?: string | null;
  /** Taksonomi terimleri (ad ya da slug; karşılaştırma `termSlug` ile) */
  categories: string[];
  tags: string[];
  /** Ürünler için biçimlenmiş fiyat */
  price?: string;
  /** Ürünler için kuruş cinsinden fiyat (süzgeç için; öğeye taşınmaz) */
  priceCents?: number;
}

export type DynamicItem = Omit<DynamicCandidate, "categories" | "tags" | "kind" | "priceCents">;

/** Sayfalama (saf): sayfa numarası geçerli aralığa sıkıştırılır. */
export function paginate<T>(items: T[], page: number, size: number): { items: T[]; page: number; pages: number; total: number } {
  const pages = Math.max(1, Math.ceil(items.length / size));
  const p = Math.min(pages, Math.max(1, Math.floor(page) || 1));
  return { items: items.slice((p - 1) * size, p * size), page: p, pages, total: items.length };
}

/** Adayları sorguya göre süzer, sıralar ve sınırlar. Kaynak, kategori, etiket ve geçerli sayfa dışlaması uygulanır. */
export function selectDynamicItems(candidates: DynamicCandidate[], q: DynamicQuery, currentId?: string | null): DynamicItem[] {
  return filterDynamicItems(candidates, q, currentId).slice(0, q.limit);
}

const stripCandidate = ({ kind: _k, categories: _c, tags: _t, priceCents: _p, ...item }: DynamicCandidate): DynamicItem => item;

function sortCandidates(list: DynamicCandidate[], orderBy: DynamicOrder): DynamicCandidate[] {
  const time = (c: DynamicCandidate) => (c.date ? new Date(c.date).getTime() || 0 : 0);
  return [...list].sort(orderBy === "title" ? (a, b) => a.title.localeCompare(b.title, "tr") : orderBy === "oldest" ? (a, b) => time(a) - time(b) : (a, b) => time(b) - time(a));
}

/** Süzer ve sıralar, adet sınırı UYGULAMAZ (arşiv sayfalaması için). */
export function filterDynamicItems(candidates: DynamicCandidate[], q: DynamicQuery, currentId?: string | null): DynamicItem[] {
  return filterDynamicCandidates(candidates, q, currentId).map(stripCandidate);
}

function filterDynamicCandidates(candidates: DynamicCandidate[], q: DynamicQuery, currentId?: string | null): DynamicCandidate[] {
  const out = candidates.filter((c) => {
    if (c.kind !== q.source) return false;
    if (q.excludeCurrent && currentId && c.id === currentId) return false;
    if (q.category && !c.categories.some((x) => termSlug(x) === q.category)) return false;
    if (q.tag && !c.tags.some((x) => termSlug(x) === q.tag)) return false;
    return true;
  });
  return sortCandidates(out, q.orderBy);
}

/** Bloklar arasında (iç içe dahil) dinamik liste bloklarını bulur. */
export function collectDynamicBlocks(blocks: BlockNode[], into: BlockNode[] = []): BlockNode[] {
  for (const b of blocks) {
    if (b.type === "dynamic_list") into.push(b);
    if (Array.isArray(b.children)) collectDynamicBlocks(b.children as BlockNode[], into);
  }
  return into;
}

export type DynamicDataMap = DynamicResultMap;

// ---- Ziyaretçi denetimli sorgu döngüsü (arama, kategori süzgeci, sıralama, sayfalama) ----

export interface DynamicMeta {
  /** URL parametre öneki (blok başına benzersiz) */
  key: string;
  total: number;
  page: number;
  pages: number;
  q: string;
  sort: DynamicOrder;
  cat: string;
  categories: Array<{ slug: string; name: string; count: number }>;
  /** Fiyat süzgeci: seçili aralık (tam para birimi) ve listedeki gerçek sınırlar; yalnızca ürünlerde */
  price?: { min: number | null; max: number | null; lo: number; hi: number };
  /** Bu bloğa ait olmayan mevcut parametreler (formlar korusun diye) */
  keep: Record<string, string>;
}
export interface DynamicResult {
  items: DynamicItem[];
  meta?: DynamicMeta;
}
export type DynamicResultMap = Record<string, DynamicResult>;

type Params = Record<string, string | string[] | undefined>;
const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";

/** Blok için URL parametre öneki: kimliğin son 6 güvenli karakteri. */
export function dynamicParamKey(blockId: string): string {
  return `q${blockId.replace(/[^a-zA-Z0-9]/g, "").slice(-6) || "x"}`;
}

const norm = (v: string) => v.toLowerCase().replace(/ı/g, "i").normalize("NFD").replace(/[\u0300-\u036f]/g, "");

/**
 * Tek bir sorgu bloğunu çözer. Denetim kapalıysa davranış eski `selectDynamicItems` ile aynıdır (meta yok).
 * Açıkken: arama (başlık+özet), kategori süzgeci, sıralama ve sayfalama URL parametrelerinden okunur; hepsi doğrulanır.
 */
export function resolveDynamicBlock(candidates: DynamicCandidate[], q: DynamicQuery, params: Params, blockId: string, currentId?: string | null): DynamicResult {
  const interactive = q.showSearch || q.showSort || q.showFilters || q.paginate || q.showPriceFilter;
  if (!interactive) return { items: selectDynamicItems(candidates, q, currentId) };
  const key = dynamicParamKey(blockId);
  const base = filterDynamicCandidates(candidates, q, currentId);
  const counts = new Map<string, { name: string; count: number }>();
  for (const c of base) for (const name of c.categories) {
    const slug = termSlug(name);
    if (slug) counts.set(slug, { name, count: (counts.get(slug)?.count ?? 0) + 1 });
  }
  const categories = q.showFilters ? [...counts.entries()].map(([slug, v]) => ({ slug, ...v })).sort((a, b) => a.name.localeCompare(b.name, "tr")) : [];
  const search = q.showSearch ? first(params[`${key}_q`]).trim().slice(0, 80) : "";
  const catParam = q.showFilters ? termSlug(first(params[`${key}_cat`])) : "";
  const cat = categories.some((c) => c.slug === catParam) ? catParam : "";
  const sortParam = first(params[`${key}_sort`]);
  const sort: DynamicOrder = q.showSort && (sortParam === "oldest" || sortParam === "title" || sortParam === "newest") ? sortParam : q.orderBy;
  let list = base;
  let price: DynamicMeta["price"];
  if (q.showPriceFilter) {
    const cents = base.map((c) => c.priceCents).filter((n): n is number => typeof n === "number");
    const num = (v: string) => (v !== "" && Number.isFinite(Number(v)) && Number(v) >= 0 ? Math.min(Number(v), 1e9) : null);
    const min = num(first(params[`${key}_min`]));
    const max = num(first(params[`${key}_max`]));
    price = { min, max, lo: cents.length ? Math.floor(Math.min(...cents) / 100) : 0, hi: cents.length ? Math.ceil(Math.max(...cents) / 100) : 0 };
    list = list.filter((c) => (min === null || (c.priceCents ?? 0) >= min * 100) && (max === null || (c.priceCents ?? 0) <= max * 100));
  }
  if (cat) list = list.filter((c) => c.categories.some((x) => termSlug(x) === cat));
  if (search) {
    const needle = norm(search);
    list = list.filter((c) => norm(`${c.title} ${c.excerpt}`).includes(needle));
  }
  list = sortCandidates(list, sort);
  const paged = q.paginate ? paginate(list, Number(first(params[`${key}_page`])), q.limit) : { items: list.slice(0, q.limit), page: 1, pages: 1, total: list.length };
  const keep: Record<string, string> = {};
  for (const [k, v] of Object.entries(params)) if (!k.startsWith(`${key}_`) && typeof first(v) === "string" && k !== "nx_draft" && first(v)) keep[k] = first(v).slice(0, 200);
  return { items: paged.items.map(stripCandidate), meta: { key, total: paged.total, page: paged.page, pages: paged.pages, q: search, sort, cat, categories, ...(price ? { price } : {}), keep } };
}

/**
 * Sorgu döngüsü denetim parametresi (`q{anahtar}_q|_cat|_sort|_page|_min|_max`) taşıyan adresler yinelenen/ince içerik üretir:
 * bu görünümler `noindex,follow` alır, canonical parametresiz sayfadır.
 */
export function hasDynamicQueryParams(params: Record<string, string | string[] | undefined>): boolean {
  return Object.keys(params).some((k) => /^q[A-Za-z0-9]{1,8}_(q|cat|sort|page|min|max)$/.test(k) && params[k] !== undefined && params[k] !== "");
}

import type { BlockNode } from "./types";

/**
 * Dinamik içerik (sorgu döngüsü) saf mantığı: blok özelliklerini doğrular, adayları süzer ve sıralar.
 * Veri okuma uygulamada (`lib/dynamic-content.ts`); burada veritabanı yoktur. Sonuç her istekte güncel veriden üretilir
 * (Markdown önbelleğine girmez).
 */
export type DynamicSource = "posts" | "pages" | "products";
export type DynamicOrder = "newest" | "oldest" | "title";
export type DynamicLayout = "cards" | "list";

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
  columns: number;
  showImage: boolean;
  showExcerpt: boolean;
  showDate: boolean;
  heading: string;
  emptyText: string;
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
    layout: p.layout === "list" ? "list" : "cards",
    columns: Math.min(4, Math.max(1, Math.round(Number(p.columns)) || 3)),
    showImage: bool(p.showImage, true),
    showExcerpt: bool(p.showExcerpt, true),
    showDate: bool(p.showDate, true),
    heading: clip(p.heading, 100),
    emptyText: clip(p.emptyText, 160),
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
}

export type DynamicItem = Omit<DynamicCandidate, "categories" | "tags" | "kind">;

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

/** Süzer ve sıralar, adet sınırı UYGULAMAZ (arşiv sayfalaması için). */
export function filterDynamicItems(candidates: DynamicCandidate[], q: DynamicQuery, currentId?: string | null): DynamicItem[] {
  const out = candidates.filter((c) => {
    if (c.kind !== q.source) return false;
    if (q.excludeCurrent && currentId && c.id === currentId) return false;
    if (q.category && !c.categories.some((x) => termSlug(x) === q.category)) return false;
    if (q.tag && !c.tags.some((x) => termSlug(x) === q.tag)) return false;
    return true;
  });
  const time = (c: DynamicCandidate) => (c.date ? new Date(c.date).getTime() || 0 : 0);
  out.sort(
    q.orderBy === "title"
      ? (a, b) => a.title.localeCompare(b.title, "tr")
      : q.orderBy === "oldest"
        ? (a, b) => time(a) - time(b)
        : (a, b) => time(b) - time(a)
  );
  return out.map(({ kind: _k, categories: _c, tags: _t, ...item }) => item);
}

/** Bloklar arasında (iç içe dahil) dinamik liste bloklarını bulur. */
export function collectDynamicBlocks(blocks: BlockNode[], into: BlockNode[] = []): BlockNode[] {
  for (const b of blocks) {
    if (b.type === "dynamic_list") into.push(b);
    if (Array.isArray(b.children)) collectDynamicBlocks(b.children as BlockNode[], into);
  }
  return into;
}

export type DynamicDataMap = Record<string, DynamicItem[]>;

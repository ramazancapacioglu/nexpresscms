import type { MegaMenuConfig, MenuSource, NavigationLink, NavigationMenuItem } from "./types";

/**
 * Menü ağacı (saf mantık): kaynaktan bağlantı çözme, doğrulama/temizleme ve düzenleyici ağaç işlemleri.
 * Veritabanı ve HTTP bilmez; çözümleme için gereken kimlik → slug eşlemeleri çağıran tarafından verilir.
 */
export const MENU_MAX_DEPTH = 3;
export const MENU_MAX_ITEMS = 200;

export interface MenuLookup {
  locale: string;
  /** içerik kimliği → { slug, yayında mı } */
  contents: Record<string, { slug: string; published: boolean }>;
  /** taksonomi kimliği → { slug, type: category|tag } */
  taxonomies: Record<string, { slug: string; type: string }>;
  /** ürün kimliği → { slug, yayında mı } */
  products: Record<string, { slug: string; published: boolean }>;
}

const SAFE_HREF = /^(\/(?!\/)|#|https?:\/\/|mailto:|tel:)/i;
/** Elle yazılan adres güvenli mi: site içi, çapa, http(s), mailto, tel. `javascript:` ve `data:` asla. */
export const isSafeMenuHref = (href: string): boolean => SAFE_HREF.test(href.trim());

/** Kaynaktan güncel adresi çözer; hedef yoksa/yayında değilse `null` (öğe yayında gizlenir). */
export function resolveMenuHref(source: MenuSource | undefined, fallbackHref: string, lookup: MenuLookup): string | null {
  const root = `/${lookup.locale}`;
  switch (source?.kind) {
    case undefined:
    case "custom":
      return isSafeMenuHref(fallbackHref) ? fallbackHref.trim() : null;
    case "home":
      return root;
    case "store":
      return `${root}/magaza`;
    case "content": {
      const c = source.refId ? lookup.contents[source.refId] : undefined;
      return c?.published ? (c.slug === "ana-sayfa" ? root : `${root}/${c.slug}`) : null;
    }
    case "category":
    case "tag": {
      const t = source.refId ? lookup.taxonomies[source.refId] : undefined;
      return t && t.type === source.kind ? `${root}/${source.kind === "category" ? "kategori" : "etiket"}/${t.slug}` : null;
    }
    case "product": {
      const p = source.refId ? lookup.products[source.refId] : undefined;
      return p?.published ? `${root}/magaza/${p.slug}` : null;
    }
    default:
      return null;
  }
}

function resolveLinks(links: NavigationLink[] | undefined, lookup: MenuLookup): NavigationLink[] | undefined {
  if (!links) return undefined;
  const out: NavigationLink[] = [];
  for (const l of links) {
    const href = resolveMenuHref(l.source, l.href, lookup);
    if (href === null) continue; // hedefi olmayan öğe ve altındakiler yayında görünmez
    out.push({ ...l, href, children: resolveLinks(l.children, lookup) });
  }
  return out;
}

/** Yayın için ağacı çözer: bağlantılar güncel, kırık hedefler elenir. */
export function resolveMenuTree(items: NavigationMenuItem[], lookup: MenuLookup): NavigationMenuItem[] {
  return resolveLinks(items, lookup) as NavigationMenuItem[];
}

/** Düzenleyicide kırık (hedefi olmayan) öğelerin kimlikleri. */
export function brokenMenuIds(items: NavigationLink[], lookup: MenuLookup): string[] {
  const out: string[] = [];
  const walk = (list: NavigationLink[]) => {
    for (const l of list) {
      if (resolveMenuHref(l.source, l.href, lookup) === null) out.push(l.id);
      walk(l.children ?? []);
    }
  };
  walk(items);
  return out;
}

const clip = (v: unknown, n: number) => (typeof v === "string" ? v.trim().slice(0, n) : "");
const KINDS = new Set(["custom", "home", "content", "category", "tag", "store", "product"]);

function cleanSource(s: unknown): MenuSource | undefined {
  if (!s || typeof s !== "object") return undefined;
  const kind = (s as { kind?: unknown }).kind;
  if (typeof kind !== "string" || !KINDS.has(kind)) return undefined;
  const refId = clip((s as { refId?: unknown }).refId, 80);
  return { kind: kind as MenuSource["kind"], ...(refId ? { refId } : {}) };
}

function cleanLink(raw: unknown, depth: number, budget: { n: number }, seen: Set<string>): NavigationLink | null {
  if (!raw || typeof raw !== "object" || budget.n >= MENU_MAX_ITEMS) return null;
  const r = raw as Record<string, unknown>;
  const label = clip(r.label, 80);
  const source = cleanSource(r.source);
  let href = clip(r.href, 500);
  // Hedefli (custom olmayan) öğede href son bilinen değerdir; custom'da güvenli olmalı
  if (!source || source.kind === "custom") {
    if (!isSafeMenuHref(href)) return null;
  } else if (!isSafeMenuHref(href)) href = "/";
  if (!label) return null;
  budget.n++;
  let id = clip(r.id, 60) || `nav_${budget.n}`;
  while (seen.has(id)) id = `${id}_`;
  seen.add(id);
  const description = clip(r.description, 120);
  const badge = clip(r.badge, 20);
  const children = depth < MENU_MAX_DEPTH ? (Array.isArray(r.children) ? r.children : []).map((c) => cleanLink(c, depth + 1, budget, seen)).filter((c): c is NavigationLink => c !== null) : [];
  return {
    id,
    label,
    href,
    ...(r.target === "_blank" ? { target: "_blank" as const } : {}),
    ...(source ? { source } : {}),
    ...(description ? { description } : {}),
    ...(badge ? { badge } : {}),
    ...(children.length ? { children } : {}),
  };
}

function cleanMega(raw: unknown): MegaMenuConfig | undefined {
  if (!raw || typeof raw !== "object") return undefined;
  const m = raw as Record<string, unknown>;
  if (m.enabled !== true) return undefined;
  const items = (Array.isArray(m.items) ? m.items : []).slice(0, 24).flatMap((i) => {
    const o = i as Record<string, unknown>;
    const label = clip(o?.label, 80);
    const href = clip(o?.href, 500);
    if (!label || !isSafeMenuHref(href)) return [];
    return [{ id: clip(o.id, 60) || `mega_${label}`, label, href, ...(clip(o.description, 140) ? { description: clip(o.description, 140) } : {}), ...(clip(o.badge, 20) ? { badge: clip(o.badge, 20) } : {}) }];
  });
  const promo = m.promoBanner as Record<string, unknown> | undefined;
  const promoOk = promo && clip(promo.title, 80) && clip(promo.ctaText, 40) && isSafeMenuHref(clip(promo.ctaHref, 500));
  return {
    enabled: true,
    // Eski kayıtlarda `mode` yoktu ve kartlar elle girilmişti: kart varsa elle, yoksa alt öğelerden
    mode: m.mode === "custom" || (m.mode !== "children" && items.length > 0) ? "custom" : "children",
    columns: Math.min(4, Math.max(1, Math.round(Number(m.columns)) || 3)),
    width: m.width === "narrow" || m.width === "full" ? m.width : "wide",
    items,
    ...(promoOk ? { promoBanner: { title: clip(promo!.title, 80), subtitle: clip(promo!.subtitle, 140), ctaText: clip(promo!.ctaText, 40), ctaHref: clip(promo!.ctaHref, 500) } } : {}),
  };
}

/** Kayıttan önce sunucuda temizler: sınırlar, güvenli adresler, tekil kimlikler. Geçersiz öğeler atılır. */
export function sanitizeMenu(raw: unknown): NavigationMenuItem[] {
  const budget = { n: 0 };
  const seen = new Set<string>();
  const list = Array.isArray(raw) ? raw : [];
  const out: NavigationMenuItem[] = [];
  for (const r of list) {
    const link = cleanLink(r, 1, budget, seen);
    if (!link) continue;
    const mega = cleanMega((r as { megaMenu?: unknown }).megaMenu);
    out.push({ ...link, ...(mega ? { megaMenu: mega } : {}) });
  }
  return out;
}

// ---------------------------------------------------------------------------
// Düzenleyici ağaç işlemleri (değişmez: her biri yeni ağaç döner)
// ---------------------------------------------------------------------------
type Node = NavigationLink & { megaMenu?: MegaMenuConfig };

export function findMenuNode(items: Node[], id: string): { node: Node; parent: Node | null; index: number; depth: number } | null {
  const walk = (list: Node[], parent: Node | null, depth: number): ReturnType<typeof findMenuNode> => {
    for (let i = 0; i < list.length; i++) {
      if (list[i]!.id === id) return { node: list[i]!, parent, index: i, depth };
      const hit = walk(list[i]!.children ?? [], list[i]!, depth + 1);
      if (hit) return hit;
    }
    return null;
  };
  return walk(items, null, 1);
}

const subtreeDepth = (n: Node): number => 1 + Math.max(0, ...(n.children ?? []).map(subtreeDepth));

function mapList(items: Node[], parentId: string | null, fn: (list: Node[]) => Node[]): Node[] {
  if (parentId === null) return fn(items);
  return items.map((n) => (n.id === parentId ? { ...n, children: fn(n.children ?? []) } : { ...n, children: n.children ? mapList(n.children, parentId, fn) : n.children }));
}

function stripEmpty(items: Node[]): Node[] {
  return items.map((n) => {
    const children = n.children ? stripEmpty(n.children) : undefined;
    const { children: _c, ...rest } = n;
    return children && children.length ? { ...rest, children } : rest;
  });
}

export function addMenuNode(items: Node[], node: Node, parentId: string | null = null): Node[] {
  const parent = parentId ? findMenuNode(items, parentId) : null;
  if (parentId && (!parent || parent.depth >= MENU_MAX_DEPTH)) return items;
  return stripEmpty(mapList(items, parentId, (list) => [...list, node]));
}

export function removeMenuNode(items: Node[], id: string): Node[] {
  const hit = findMenuNode(items, id);
  if (!hit) return items;
  return stripEmpty(mapList(items, hit.parent?.id ?? null, (list) => list.filter((n) => n.id !== id)));
}

export function updateMenuNode(items: Node[], id: string, patch: Partial<Node>): Node[] {
  return items.map((n) => (n.id === id ? { ...n, ...patch } : { ...n, children: n.children ? updateMenuNode(n.children, id, patch) : n.children })).map((n) => (n.children === undefined ? (({ children: _c, ...r }) => r)(n) : n));
}

/** Aynı kardeşler arasında bir adım yukarı/aşağı. */
export function moveMenuNode(items: Node[], id: string, dir: -1 | 1): Node[] {
  const hit = findMenuNode(items, id);
  if (!hit) return items;
  return mapList(items, hit.parent?.id ?? null, (list) => {
    const to = hit.index + dir;
    if (to < 0 || to >= list.length) return list;
    const next = list.slice();
    [next[hit.index], next[to]] = [next[to]!, next[hit.index]!];
    return next;
  });
}

/** Girinti: bir önceki kardeşin son çocuğu olur (derinlik sınırı aşılmıyorsa). */
export function indentMenuNode(items: Node[], id: string): Node[] {
  const hit = findMenuNode(items, id);
  if (!hit || hit.index === 0) return items;
  if (hit.depth + subtreeDepth(hit.node) > MENU_MAX_DEPTH) return items;
  const siblings = hit.parent ? hit.parent.children! : items;
  const prev = siblings[hit.index - 1]!;
  const without = removeMenuNode(items, id);
  return addMenuNode(without, hit.node, prev.id);
}

/** Girintiyi azalt: ebeveyninin hemen ardından kardeş olur. */
export function outdentMenuNode(items: Node[], id: string): Node[] {
  const hit = findMenuNode(items, id);
  if (!hit || !hit.parent) return items;
  const grand = findMenuNode(items, hit.parent.id)!;
  const without = removeMenuNode(items, id);
  return stripEmpty(mapList(without, grand.parent?.id ?? null, (list) => {
    const at = list.findIndex((n) => n.id === hit.parent!.id);
    const next = list.slice();
    next.splice(at + 1, 0, hit.node);
    return next;
  }));
}

export function countMenuNodes(items: NavigationLink[]): number {
  return items.reduce((n, i) => n + 1 + countMenuNodes(i.children ?? []), 0);
}

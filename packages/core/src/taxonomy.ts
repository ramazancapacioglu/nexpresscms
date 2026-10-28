/**
 * Kategori / Etiket (Taksonomi) ağacı yardımcıları — izomorfik.
 */
export interface TaxonomyLike {
  id: string;
  parentId: string | null;
  slug: string;
  name: string;
  sortOrder?: number;
}

export interface TaxonomyTreeNode<T extends TaxonomyLike> {
  item: T;
  depth: number;
  children: TaxonomyTreeNode<T>[];
}

export function buildTaxonomyTree<T extends TaxonomyLike>(items: T[]): TaxonomyTreeNode<T>[] {
  const byParent = new Map<string | null, T[]>();
  const ids = new Set(items.map((i) => i.id));
  for (const it of items) {
    const key = it.parentId && ids.has(it.parentId) ? it.parentId : null;
    const arr = byParent.get(key) ?? [];
    arr.push(it);
    byParent.set(key, arr);
  }
  const sorter = (a: T, b: T) =>
    (a.sortOrder ?? 0) - (b.sortOrder ?? 0) || a.name.localeCompare(b.name, "tr");

  const build = (parent: string | null, depth: number, guard: Set<string>): TaxonomyTreeNode<T>[] =>
    (byParent.get(parent) ?? []).sort(sorter).map((item) => {
      if (guard.has(item.id)) return { item, depth, children: [] };
      const next = new Set(guard).add(item.id);
      return { item, depth, children: build(item.id, depth + 1, next) };
    });

  return build(null, 0, new Set());
}

export function flattenTaxonomyTree<T extends TaxonomyLike>(
  nodes: TaxonomyTreeNode<T>[]
): Array<T & { item: T; depth: number }> {
  const out: Array<T & { item: T; depth: number }> = [];
  const walk = (list: TaxonomyTreeNode<T>[]) => {
    for (const n of list) {
      out.push({ ...n.item, item: n.item, depth: n.depth });
      walk(n.children);
    }
  };
  walk(nodes);
  return out;
}

export function collectTaxonomyDescendantIds<T extends TaxonomyLike>(items: T[], id: string): string[] {
  const out: string[] = [id];
  const walk = (parent: string) => {
    for (const it of items) {
      if (it.parentId === parent && !out.includes(it.id)) {
        out.push(it.id);
        walk(it.id);
      }
    }
  };
  walk(id);
  return out;
}

/** Kök → yaprak isim yolu (breadcrumb için). */
export function taxonomyPath<T extends TaxonomyLike>(items: T[], id: string): string[] {
  const map = new Map(items.map((i) => [i.id, i]));
  const path: string[] = [];
  let cur = map.get(id);
  const guard = new Set<string>();
  while (cur && !guard.has(cur.id)) {
    guard.add(cur.id);
    path.unshift(cur.name);
    cur = cur.parentId ? map.get(cur.parentId) : undefined;
  }
  return path;
}

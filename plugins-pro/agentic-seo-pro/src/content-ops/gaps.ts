/** İçerik açığı analizi (saf mantık): TL;DR eksik, bayat, iç bağlantısız (öksüz), ince ve kopya kümeler. */
export interface GapInput {
  id: string;
  title: string;
  slug: string;
  type: string;
  tldr: string | null | undefined;
  markdown: string;
  updatedAt: Date;
  isHome?: boolean;
}

export type GapKind = "no-tldr" | "stale" | "orphan" | "thin" | "duplicate";
export interface GapItem {
  id: string;
  title: string;
  slug: string;
  kinds: GapKind[];
  ageDays: number;
  words: number;
}
export interface GapReport {
  items: GapItem[];
  counts: Record<GapKind, number>;
  /** Birbirine çok benzeyen içerik kümeleri (en az 2 kimlik) */
  duplicateClusters: string[][];
}

export const GAP_LIMITS = { tldrMin: 40, staleDays: 180, thinWords: 150, similarity: 0.6 } as const;
const DAY = 86_400_000;

const tokens = (s: string): Set<string> => new Set(s.toLocaleLowerCase("tr").split(/[^\p{L}\p{N}]+/u).filter((w) => w.length > 3));
const words = (md: string) => (md.match(/[\p{L}\p{N}]+/gu) ?? []).length;

export function jaccard(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 || b.size === 0) return 0;
  let inter = 0;
  for (const x of a) if (b.has(x)) inter++;
  return inter / (a.size + b.size - inter);
}

/** Markdown içindeki site içi bağlantı hedefleri (`/tr/slug`, `/slug`, mutlak adresin yolu da sayılır). */
function internalTargets(md: string, base: string): Set<string> {
  const out = new Set<string>();
  for (const m of md.matchAll(/\]\(([^)\s]+)\)/g)) {
    let href = m[1]!;
    if (href.startsWith(base)) href = href.slice(base.length);
    if (!href.startsWith("/") || href.startsWith("//")) continue;
    const path = href.split(/[?#]/)[0]!.replace(/\/$/, "");
    const slug = path.split("/").filter(Boolean).pop();
    if (slug) out.add(slug);
  }
  return out;
}

export function analyzeContentGaps(items: GapInput[], now: Date, baseUrl = ""): GapReport {
  const inbound = new Map<string, number>();
  const bySlug = new Map(items.map((i) => [i.slug, i.id]));
  for (const i of items) {
    for (const slug of internalTargets(i.markdown, baseUrl)) {
      const target = bySlug.get(slug);
      if (target && target !== i.id) inbound.set(target, (inbound.get(target) ?? 0) + 1);
    }
  }

  // Kopya kümeler: başlık + TL;DR benzerliği (bağlı bileşenler)
  const sig = items.map((i) => tokens(`${i.title} ${i.tldr ?? ""}`));
  const parent = items.map((_, i) => i);
  const find = (x: number): number => (parent[x] === x ? x : (parent[x] = find(parent[x]!)));
  for (let a = 0; a < items.length; a++) for (let b = a + 1; b < items.length; b++) if (jaccard(sig[a]!, sig[b]!) >= GAP_LIMITS.similarity) parent[find(a)] = find(b);
  const groups = new Map<number, number[]>();
  items.forEach((_, i) => groups.set(find(i), [...(groups.get(find(i)) ?? []), i]));
  const duplicateClusters = [...groups.values()].filter((g) => g.length > 1).map((g) => g.map((i) => items[i]!.id));
  const inCluster = new Set(duplicateClusters.flat());

  const counts: Record<GapKind, number> = { "no-tldr": 0, stale: 0, orphan: 0, thin: 0, duplicate: 0 };
  const out: GapItem[] = [];
  for (const i of items) {
    const kinds: GapKind[] = [];
    const ageDays = Math.floor((now.getTime() - i.updatedAt.getTime()) / DAY);
    const w = words(i.markdown);
    if ((i.tldr ?? "").trim().length < GAP_LIMITS.tldrMin) kinds.push("no-tldr");
    if (ageDays >= GAP_LIMITS.staleDays) kinds.push("stale");
    if (!i.isHome && (inbound.get(i.id) ?? 0) === 0) kinds.push("orphan");
    if (w < GAP_LIMITS.thinWords) kinds.push("thin");
    if (inCluster.has(i.id)) kinds.push("duplicate");
    for (const k of kinds) counts[k]++;
    if (kinds.length) out.push({ id: i.id, title: i.title, slug: i.slug, kinds, ageDays, words: w });
  }
  out.sort((a, b) => b.kinds.length - a.kinds.length || b.ageDays - a.ageDays);
  return { items: out, counts, duplicateClusters };
}

export const GAP_LABEL: Record<GapKind, string> = { "no-tldr": "TL;DR eksik", stale: "Bayat", orphan: "İç bağlantı almıyor", thin: "İnce içerik", duplicate: "Benzer içerik" };

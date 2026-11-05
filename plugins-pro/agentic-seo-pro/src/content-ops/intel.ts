import { createHash } from "node:crypto";
import { jaccard } from "./gaps";

export type IntelSource = "gsc" | "bing" | "yandex" | "serper" | "support";

const SOURCES = new Set<IntelSource>(["gsc", "bing", "yandex", "serper", "support"]);

export function isIntelSource(value: string): value is IntelSource {
  return SOURCES.has(value as IntelSource);
}

/** Yüzde (5,92) veya oran (0,0592) → ctr100. */
export function toCtr100(value: number): number {
  if (!Number.isFinite(value) || value <= 0) return 0;
  const ratio = value > 1 ? value / 100 : value;
  return Math.round(Math.min(1, ratio) * 10000);
}

/** Sıra → position10. 0 bilinmiyor demektir. */
export function toPosition10(value: number): number {
  if (!Number.isFinite(value) || value <= 0) return 0;
  return Math.round(Math.min(200, value) * 10);
}

export function signalId(siteId: string, source: IntelSource, keyword: string): string {
  const key = `${siteId}|${source}|${keyword.trim().toLocaleLowerCase("tr")}`;
  return `sig_${createHash("sha1").update(key).digest("hex").slice(0, 16)}`;
}

export function clusterId(siteId: string, members: string[]): string {
  const key = `${siteId}|${[...members].map((m) => m.trim().toLocaleLowerCase("tr")).sort().join("|")}`;
  return `clu_${createHash("sha1").update(key).digest("hex").slice(0, 16)}`;
}

const tokens = (s: string): Set<string> =>
  new Set(s.toLocaleLowerCase("tr").split(/[^\p{L}\p{N}]+/u).filter((w) => w.length > 3));

export interface ClusterInput {
  keyword: string;
  impressions: number;
}

export interface KeywordCluster {
  label: string;
  members: string[];
  impressions: number;
}

/**
 * Gösterimi yüksek kelimeden başlayarak Jaccard eşiğinin üstündekileri aynı kümeye alır.
 * Gömme yoktur; eşik sözcük örtüşmesidir.
 */
export function clusterKeywords(items: ClusterInput[], threshold = 0.45): KeywordCluster[] {
  const sorted = items
    .map((item) => ({ keyword: item.keyword.trim(), impressions: Math.max(0, item.impressions) }))
    .filter((item) => item.keyword.length > 0)
    .sort((a, b) => b.impressions - a.impressions || a.keyword.localeCompare(b.keyword, "tr"));
  const groups: Array<KeywordCluster & { bag: Set<string> }> = [];
  for (const item of sorted) {
    const bag = tokens(item.keyword);
    let best = -1;
    let bestScore = 0;
    groups.forEach((group, index) => {
      const score = jaccard(bag, group.bag);
      if (score > bestScore) {
        bestScore = score;
        best = index;
      }
    });
    if (best >= 0 && bestScore >= threshold) {
      const group = groups[best]!;
      if (!group.members.includes(item.keyword)) group.members.push(item.keyword);
      group.impressions += item.impressions;
      for (const token of bag) group.bag.add(token);
    } else {
      groups.push({ label: item.keyword, members: [item.keyword], impressions: item.impressions, bag });
    }
  }
  return groups.map(({ label, members, impressions }) => ({ label, members, impressions }));
}

/** Sıra × 10 cinsinden düşüş. prev 0 ise henüz karşılaştırma yok. */
export function rankingDrops(rows: Array<{ keyword: string; position10: number; prevPosition10?: number }>, minSteps = 10) {
  return rows.filter((row) => (row.prevPosition10 ?? 0) > 0 && row.position10 >= (row.prevPosition10 ?? 0) + minSteps);
}

/** Vektörler aynı sırada. Eşik kosinüs (normalize vektörlerde nokta çarpımı). */
export function clusterByVectors(items: ClusterInput[], vectors: number[][], threshold: number): KeywordCluster[] {
  const rows = items
    .map((item, index) => ({ keyword: item.keyword.trim(), impressions: Math.max(0, item.impressions), vector: vectors[index] ?? [] }))
    .filter((item) => item.keyword && item.vector.length > 0)
    .sort((a, b) => b.impressions - a.impressions || a.keyword.localeCompare(b.keyword, "tr"));
  const score = (a: number[], b: number[]) => {
    const n = Math.min(a.length, b.length);
    let dot = 0;
    for (let i = 0; i < n; i++) dot += a[i]! * b[i]!;
    return dot;
  };
  const groups: Array<KeywordCluster & { vector: number[] }> = [];
  for (const item of rows) {
    let best = -1;
    let bestScore = 0;
    groups.forEach((group, index) => {
      const value = score(item.vector, group.vector);
      if (value > bestScore) {
        bestScore = value;
        best = index;
      }
    });
    if (best >= 0 && bestScore >= threshold) {
      const group = groups[best]!;
      if (!group.members.includes(item.keyword)) group.members.push(item.keyword);
      group.impressions += item.impressions;
    } else {
      groups.push({ label: item.keyword, members: [item.keyword], impressions: item.impressions, vector: item.vector });
    }
  }
  return groups.map(({ label, members, impressions }) => ({ label, members, impressions }));
}

export interface CatalogProposal {
  title: string;
  tldr: string;
  notes: string[];
}

/** Anahtar yokken de uygulanabilir, uydurma cümle eklemeyen katalog önerisi. */
export function proposeCatalogCopy(input: { title: string; tldr: string; body: string }): CatalogProposal {
  const notes: string[] = [];
  const title = input.title.replace(/\s+/g, " ").trim();
  let nextTitle = title;
  if (title.length > 70) {
    const cut = title.slice(0, 70);
    const space = cut.lastIndexOf(" ");
    nextTitle = (space > 25 ? cut.slice(0, space) : cut).trim();
    notes.push("Başlık 70 karakterde kesildi.");
  } else if (title.length > 0 && title.length < 25) {
    notes.push("Başlık 25 karakterden kısa; metin uydurulmadı.");
  }
  const body = input.body.replace(/\s+/g, " ").trim();
  let tldr = input.tldr.replace(/\s+/g, " ").trim();
  if (tldr.length < 80 && body.length >= 80) {
    tldr = body.slice(0, 220).trim();
    notes.push("Kısa yanıt gövdenin ilk cümlelerinden alındı.");
  }
  if (tldr.length > 300) tldr = tldr.slice(0, 300).trim();
  if (notes.length === 0) notes.push("Uzunluklar uygun; metin aynı bırakıldı.");
  return { title: nextTitle || title, tldr, notes };
}

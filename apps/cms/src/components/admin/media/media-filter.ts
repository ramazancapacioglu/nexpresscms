import { scoreMediaSeo, type MediaKind } from "@nexpress/core";
import type { MediaAssetDto } from "@nexpress/database";

export type KindFilter = "all" | MediaKind;
export type SortKey = "newest" | "oldest" | "name" | "size" | "score";
export type ProblemFilter = "all" | "noalt" | "lowscore";

export interface MediaQuery {
  search: string;
  kind: KindFilter;
  sort: SortKey;
  problem: ProblemFilter;
}

export const DEFAULT_QUERY: MediaQuery = { search: "", kind: "all", sort: "newest", problem: "all" };

// Türkçe i/ı/İ/I farkı aramayı bozmasın: yerel ayara bağlı olmayan küçültme, ı -> i ve aksan atma
const norm = (s: string) => s.normalize("NFKD").toLowerCase().replace(/\u0131/g, "i").replace(/[\u0300-\u036f]/g, "");

/** Kitaplık süzgeci ve sıralaması (saf): ad, başlık, alt metin, alt yazı, açıklama içinde arar. */
export function queryMedia(items: MediaAssetDto[], q: MediaQuery): MediaAssetDto[] {
  const needle = norm(q.search.trim());
  const out = items.filter((a) => {
    if (q.kind !== "all" && a.kind !== q.kind) return false;
    if (q.problem === "noalt" && !(a.kind === "image" && !a.altText.trim())) return false;
    if (q.problem === "lowscore" && a.seoScore >= 80) return false;
    if (!needle) return true;
    return norm([a.filename, a.titleText, a.altText, a.caption, a.description].filter(Boolean).join(" ")).includes(needle);
  });
  const t = (a: MediaAssetDto) => new Date(a.createdAt).getTime();
  const sorters: Record<SortKey, (a: MediaAssetDto, b: MediaAssetDto) => number> = {
    newest: (a, b) => t(b) - t(a),
    oldest: (a, b) => t(a) - t(b),
    name: (a, b) => a.filename.localeCompare(b.filename, "tr"),
    size: (a, b) => b.sizeBytes - a.sizeBytes,
    score: (a, b) => a.seoScore - b.seoScore,
  };
  return out.sort(sorters[q.sort]);
}

export const formatBytes = (n: number): string => (n >= 1024 * 1024 ? `${(n / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(n / 1024))} KB`);

/** Kaydedilmemiş alanlardan canlı SEO raporu (kaydetmeden uyarıları göstermek için). */
export const liveReport = (a: MediaAssetDto, fields: { altText: string; titleText: string; caption: string; description: string }) =>
  scoreMediaSeo({ kind: a.kind, filename: a.filename, altText: fields.altText, titleText: fields.titleText, caption: fields.caption, description: fields.description, width: a.width, height: a.height, sizeBytes: a.sizeBytes, mimeType: a.mimeType });

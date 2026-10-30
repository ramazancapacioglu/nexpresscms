/** Site geneli SEO denetimi (saf mantık): sayfa başına sorunlar ve yinelenen başlık/açıklama kümeleri. */
export interface SeoAuditPage {
  id: string;
  locale: string;
  slug: string;
  title: string;
  type: string;
  status: string;
  metaTitle: string | null;
  metaDescription: string | null;
  tldr: string | null;
  noIndex: boolean;
  seoScore: number;
  words: number;
  focusKeyword: string;
  imagesMissingAlt: number;
}

export type SeoIssueId = "title_length" | "no_description" | "description_length" | "no_tldr" | "thin_content" | "low_score" | "no_focus_keyword" | "missing_alt" | "noindex" | "duplicate_title" | "duplicate_description";
export type SeoIssueLevel = "error" | "warning" | "info";

export interface SeoIssue {
  id: SeoIssueId;
  level: SeoIssueLevel;
  label: string;
}

export interface SeoAuditRow extends SeoAuditPage {
  issues: SeoIssue[];
  weight: number;
}

export interface SeoAuditReport {
  rows: SeoAuditRow[];
  summary: { pages: number; withErrors: number; withWarnings: number; clean: number; avgScore: number; byIssue: Partial<Record<SeoIssueId, number>> };
}

export const SEO_ISSUE_LABELS: Record<SeoIssueId, string> = {
  title_length: "SEO başlığı 20–60 karakter dışında",
  no_description: "Meta açıklama ve TL;DR yok",
  description_length: "Meta açıklama 70–160 karakter dışında",
  no_tldr: "TL;DR (Answer-First özet) yok",
  thin_content: "İçerik ince (150 sözcükten az)",
  low_score: "SEO puanı düşük",
  no_focus_keyword: "Odak anahtar kelime yok",
  missing_alt: "Alt metni olmayan görsel var",
  noindex: "Arama motorlarına kapalı (noindex)",
  duplicate_title: "Başka sayfayla aynı SEO başlığı",
  duplicate_description: "Başka sayfayla aynı açıklama",
};

const WEIGHT: Record<SeoIssueLevel, number> = { error: 10, warning: 3, info: 1 };
const norm = (s: string) => s.toLocaleLowerCase("tr").replace(/\s+/g, " ").trim();
const LONG_FORM = new Set(["page", "post", "kb_tech", "ai_prompt"]);

/** Yalnızca yayındaki içerikleri denetlemek çağıranın işidir; kural adı `id` kararlıdır (arayüz süzgeci). */
export function auditSeo(pages: SeoAuditPage[]): SeoAuditReport {
  const titleGroups = new Map<string, string[]>();
  const descGroups = new Map<string, string[]>();
  const effTitle = (p: SeoAuditPage) => norm(p.metaTitle || p.title);
  const effDesc = (p: SeoAuditPage) => norm(p.metaDescription || p.tldr || "");
  for (const p of pages) {
    const t = effTitle(p);
    const d = effDesc(p);
    titleGroups.set(`${p.locale}:${t}`, [...(titleGroups.get(`${p.locale}:${t}`) ?? []), p.id]);
    if (d) descGroups.set(`${p.locale}:${d}`, [...(descGroups.get(`${p.locale}:${d}`) ?? []), p.id]);
  }
  const rows: SeoAuditRow[] = pages.map((p) => {
    const issues: SeoIssue[] = [];
    const add = (id: SeoIssueId, level: SeoIssueLevel) => issues.push({ id, level, label: SEO_ISSUE_LABELS[id] });
    const tl = (p.metaTitle || p.title).length;
    if (tl < 20 || tl > 60) add("title_length", "warning");
    const desc = (p.metaDescription || p.tldr || "").trim();
    if (!desc) add("no_description", "error");
    else if (desc.length < 70 || desc.length > 160) add("description_length", "warning");
    if (!(p.tldr ?? "").trim()) add("no_tldr", "warning");
    if (LONG_FORM.has(p.type) && p.words < 150) add("thin_content", "warning");
    if (p.seoScore < 50) add("low_score", "error");
    else if (p.seoScore < 70) add("low_score", "warning");
    if (!p.focusKeyword.trim()) add("no_focus_keyword", "info");
    if (p.imagesMissingAlt > 0) add("missing_alt", "warning");
    if (p.noIndex) add("noindex", "info");
    if ((titleGroups.get(`${p.locale}:${effTitle(p)}`) ?? []).length > 1) add("duplicate_title", "warning");
    if (effDesc(p) && (descGroups.get(`${p.locale}:${effDesc(p)}`) ?? []).length > 1) add("duplicate_description", "warning");
    return { ...p, issues, weight: issues.reduce((n, i) => n + WEIGHT[i.level], 0) };
  });
  rows.sort((a, b) => b.weight - a.weight || a.title.localeCompare(b.title, "tr"));
  const byIssue: SeoAuditReport["summary"]["byIssue"] = {};
  for (const r of rows) for (const i of r.issues) byIssue[i.id] = (byIssue[i.id] ?? 0) + 1;
  const withErrors = rows.filter((r) => r.issues.some((i) => i.level === "error")).length;
  const withWarnings = rows.filter((r) => !r.issues.some((i) => i.level === "error") && r.issues.some((i) => i.level === "warning")).length;
  return {
    rows,
    summary: {
      pages: rows.length,
      withErrors,
      withWarnings,
      clean: rows.filter((r) => !r.issues.some((i) => i.level !== "info")).length,
      avgScore: rows.length ? Math.round(rows.reduce((n, r) => n + r.seoScore, 0) / rows.length) : 0,
      byIssue,
    },
  };
}

/** Bloklardaki alt metni olmayan görseller (image_figure, split_content, gallery). */
export function countImagesMissingAlt(blocks: Array<{ type: string; props?: Record<string, unknown>; children?: unknown }>): number {
  let n = 0;
  for (const b of blocks) {
    const p = b.props ?? {};
    if (b.type === "image_figure" && p.url && !String(p.altText ?? "").trim()) n++;
    else if (b.type === "split_content" && p.image && !String(p.alt ?? "").trim()) n++;
    else if (b.type === "gallery" && Array.isArray(p.items)) n += (p.items as Array<Record<string, unknown>>).filter((it) => it?.url && !String(it.alt ?? "").trim()).length;
    if (Array.isArray(b.children)) n += countImagesMissingAlt(b.children as never);
  }
  return n;
}

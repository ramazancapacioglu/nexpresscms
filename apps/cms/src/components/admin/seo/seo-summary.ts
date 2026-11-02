import { countWords, resolvePublishing, type ContentType, type SeoEngineSettings } from "@nexpress/core";

export interface SeoContentInput {
  id: string;
  type: ContentType;
  status: string;
  title: string;
  slug: string;
  seoScore: number;
  metaTitle: string | null;
  metaDescription: string | null;
  featuredImage: string | null;
  markdownCache: string;
  noIndex: boolean;
  schemaAttributes: Record<string, unknown>;
}

export interface SeoIssueRow {
  id: string;
  type: ContentType;
  status: string;
  title: string;
  slug: string;
  score: number;
  issues: string[];
}

export interface SeoSiteCheck {
  id: string;
  label: string;
  ok: boolean;
  detail: string;
}

export interface SeoSummary {
  total: number;
  published: number;
  average: number;
  grades: { a: number; b: number; c: number; d: number };
  missingMeta: number;
  missingDescription: number;
  noIndexPublished: number;
  missingImage: number;
  missingKeyword: number;
  thin: number;
  rows: SeoIssueRow[];
  checks: SeoSiteCheck[];
}

const TYPE_LABEL: Record<ContentType, string> = {
  page: "Sayfa",
  post: "Yazı",
  kb_tech: "Bilgi",
  ai_prompt: "Soru",
  product: "Ürün",
  campaign: "Kampanya",
  template: "Şablon",
};

export function contentTypeLabel(type: ContentType) {
  return TYPE_LABEL[type] ?? type;
}

function gradeOf(score: number): keyof SeoSummary["grades"] {
  if (score >= 90) return "a";
  if (score >= 75) return "b";
  if (score >= 60) return "c";
  return "d";
}

/** Meta başlık boşsa sayfa başlığı kullanılır (otomatik); uzunluk bu etkin değere göre ölçülür. */
const effectiveTitle = (item: SeoContentInput) => (item.metaTitle?.trim() || item.title).trim();

function issuesFor(item: SeoContentInput, minWords: number): string[] {
  const issues: string[] = [];
  if (effectiveTitle(item).length > 60) issues.push("Meta başlık uzun (>60)");
  if (!item.metaDescription?.trim()) issues.push("Meta açıklama yok");
  if (!item.featuredImage) issues.push("Öne çıkan görsel yok");
  if (!resolvePublishing(item.schemaAttributes).focusKeyword) issues.push("Odak kelime yok");
  if (countWords(item.markdownCache) < minWords) issues.push(`Kısa metin (<${minWords})`);
  if (item.noIndex) issues.push("noindex");
  return issues;
}

export function buildSeoSummary(items: SeoContentInput[], seo: SeoEngineSettings): SeoSummary {
  const grades = { a: 0, b: 0, c: 0, d: 0 };
  let missingMeta = 0;
  let missingDescription = 0;
  let noIndexPublished = 0;
  let missingImage = 0;
  let missingKeyword = 0;
  let thin = 0;
  const published = items.filter((item) => item.status === "published");

  const rows = items
    .map((item) => {
      grades[gradeOf(item.seoScore)] += 1;
      const issues = issuesFor(item, seo.minWordCount);
      if (effectiveTitle(item).length > 60) missingMeta += 1;
      if (!item.metaDescription?.trim()) missingDescription += 1;
      if (item.status === "published" && item.noIndex) noIndexPublished += 1;
      if (item.status === "published" && !item.featuredImage) missingImage += 1;
      if (!resolvePublishing(item.schemaAttributes).focusKeyword) missingKeyword += 1;
      if (countWords(item.markdownCache) < seo.minWordCount) thin += 1;
      return {
        id: item.id,
        type: item.type,
        status: item.status,
        title: item.title || "Adsız",
        slug: item.slug,
        score: item.seoScore,
        issues,
      };
    })
    .filter((row) => row.issues.length > 0)
    .sort((a, b) => a.score - b.score)
    .slice(0, 8);

  const average =
    items.length === 0 ? 0 : Math.round(items.reduce((sum, item) => sum + item.seoScore, 0) / items.length);

  const descLen = (seo.defaultMetaDescription ?? "").trim().length;
  const checks: SeoSiteCheck[] = [
    {
      id: "title",
      label: "Başlık şablonu",
      ok: seo.titleTemplate.includes("%title%") && seo.titleTemplate.includes("%site%"),
      detail: seo.titleTemplate || "Boş",
    },
    {
      id: "desc",
      label: "Varsayılan açıklama",
      ok: descLen >= 50 && descLen <= 160,
      detail: descLen === 0 ? "Boş" : `${descLen} karakter`,
    },
    {
      id: "org",
      label: "Kurum adı",
      ok: Boolean(seo.organizationName.trim()),
      detail: seo.organizationName || "Boş",
    },
    {
      id: "schema",
      label: "Otomatik şema",
      ok: seo.autoSchema !== false && seo.autoSchemaFromBlocks !== false,
      detail: seo.autoSchema ? "Bloklardan üretiliyor" : "Kapalı",
    },
    {
      id: "redirect",
      label: "Slug 301",
      ok: seo.autoRedirectOnSlugChange,
      detail: seo.autoRedirectOnSlugChange ? "Eski adres korunuyor" : "Kapalı",
    },
    {
      id: "llms",
      label: "/llms.txt",
      ok: seo.enableLlmsTxt !== false,
      detail: seo.enableLlmsTxt === false ? "Kapalı" : "Açık",
    },
    {
      id: "sitemap",
      label: "Sitemap türleri",
      ok: seo.sitemapTypes.length > 0,
      detail: seo.sitemapTypes.length ? `${seo.sitemapTypes.length} tür` : "Hiç tür seçili değil",
    },
    {
      id: "og",
      label: "Varsayılan paylaşım görseli",
      ok: Boolean(seo.defaultOgImage.trim()),
      detail: seo.defaultOgImage.trim() ? "Tanımlı" : "Yok",
    },
  ];

  return {
    total: items.length,
    published: published.length,
    average,
    grades,
    missingMeta,
    missingDescription,
    noIndexPublished,
    missingImage,
    missingKeyword,
    thin,
    rows,
    checks,
  };
}

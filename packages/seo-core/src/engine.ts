import {
  DEFAULT_SEO_SETTINGS,
  countWords,
  flattenBlocks,
  type BlockNode,
  type SchemaGraphNode,
  type SeoEngineSettings,
} from "@nexpress/core";

/**
 * NEXPRESS SEO MOTORU (SEO Engine)
 * -------------------------------------------------------------------------
 * SEO bir "eklenti" ya da "araç" değildir; içerik yaşam döngüsünün her aşamasında çalışan çekirdek motordur:
 *   1. KAYIT ANI  → `analyzeSeo` skor + boşluk bulguları üretir, boş meta alanları otomatik doldurulur.
 *   2. RENDER ANI → `resolveSeoMeta` başlık/açıklama/canonical/robots/OG/Twitter'ı şablonlarla çözer.
 *   3. ŞEMA       → `deriveAutoSchemaNodes` bloklardan FAQPage/HowTo/Review/VideoObject üretir.
 *   4. YÖNLENDİRME→ Slug değişince eski adres otomatik 301 ile korunur (repository katmanı).
 * Modül izomorfiktir: editörde canlı analiz, sunucuda kayıt/render aynı kodla çalışır.
 */

export type SeoCheckStatus = "pass" | "warn" | "fail";
export type SeoCheckGroup = "basic" | "keyword" | "content" | "media" | "links" | "technical";

export interface SeoCheck {
  id: string;
  group: SeoCheckGroup;
  status: SeoCheckStatus;
  label: string;
  detail: string;
  weight: number;
}

export interface SeoAnalysis {
  score: number;
  grade: "A" | "B" | "C" | "D";
  checks: SeoCheck[];
  gapFindings: string[];
  stats: ContentStats;
}

export interface ContentStats {
  wordCount: number;
  headings: Array<{ level: number; text: string }>;
  images: Array<{ url: string; alt: string }>;
  internalLinks: number;
  externalLinks: number;
  firstParagraph: string;
  plainText: string;
  avgSentenceWords: number;
  hasFaq: boolean;
  hasHowTo: boolean;
}

export interface SeoAnalyzeInput {
  /** İçerik dili (dil profili): küçük harf kuralı, slug dönüşümü, okunabilirlik eşiği. Varsayılan `tr`. */
  locale?: string;
  title: string;
  slug: string;
  tldr?: string | null;
  metaTitle?: string | null;
  metaDescription?: string | null;
  focusKeyword?: string | null;
  blocks: BlockNode[];
  featuredImageUrl?: string | null;
  featuredAltText?: string | null;
  noIndex?: boolean;
  schemaType?: string;
  settings?: Partial<SeoEngineSettings>;
}

/** Dile özgü harf dönüşümleri (NFKD ile ayrışmayanlar). Tabloda olmayan diller NFKD yedeğini kullanır. */
const SLUG_MAPS: Record<string, Record<string, string>> = {
  tr: { ç: "c", ğ: "g", ı: "i", ö: "o", ş: "s", ü: "u", â: "a", î: "i", û: "u" },
  de: { ä: "ae", ö: "oe", ü: "ue", ß: "ss" },
  es: { ñ: "n" },
  fr: { œ: "oe", æ: "ae", ç: "c" },
  pt: { ç: "c" },
  nl: { ĳ: "ij" },
  pl: { ł: "l" },
  da: { æ: "ae", ø: "o", å: "aa" },
  sv: { å: "a", ä: "a", ö: "o" },
  no: { æ: "ae", ø: "o", å: "aa" },
};

export function slugify(input: string, locale = "tr"): string {
  const lang = locale.toLowerCase().split("-")[0] ?? "tr";
  const map = SLUG_MAPS[lang] ?? {};
  const lowered = lang === "tr" || lang === "az" ? input.toLocaleLowerCase("tr") : input.toLocaleLowerCase(lang);
  const mapped = [...lowered].map((c) => map[c] ?? c).join("");
  return mapped
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

function stripInlineMarkdown(text: string): string {
  return text
    .replace(/!\[[^\]]*\]\([^)]*\)/g, "")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/[*_`]/g, "");
}

const URL_RE = /\[[^\]]+\]\(([^)\s]+)\)/g;

export function extractContentStats(blocks: BlockNode[]): ContentStats {
  const flat = flattenBlocks(blocks).map((e) => e.block);
  const texts: string[] = [];
  const headings: ContentStats["headings"] = [];
  const images: ContentStats["images"] = [];
  let internal = 0;
  let external = 0;
  let firstParagraph = "";
  let hasFaq = false;
  let hasHowTo = false;

  const countLinks = (raw: string) => {
    for (const m of raw.matchAll(URL_RE)) {
      const href = m[1] ?? "";
      if (/^https?:\/\//i.test(href)) external++;
      else internal++;
    }
  };
  const addHref = (href: unknown) => {
    if (typeof href !== "string" || !href) return;
    if (/^https?:\/\//i.test(href)) external++;
    else if (href.startsWith("/") || href.startsWith("#")) internal++;
  };

  for (const b of flat) {
    const p = b.props ?? {};
    switch (b.type) {
      case "heading":
        headings.push({ level: Number(p.level ?? 2), text: String(p.text ?? "") });
        texts.push(String(p.text ?? ""));
        break;
      case "hero":
        headings.push({ level: 1, text: String(p.title ?? "") });
        texts.push(String(p.title ?? ""), String(p.subtitle ?? ""));
        addHref(p.primaryCtaHref);
        addHref(p.secondaryCtaHref);
        break;
      case "paragraph": {
        const raw = String(p.text ?? "");
        countLinks(raw);
        const plain = stripInlineMarkdown(raw);
        if (!firstParagraph && plain.trim()) firstParagraph = plain;
        texts.push(plain);
        break;
      }
      case "quote":
        texts.push(String(p.text ?? ""));
        break;
      case "list_element":
        texts.push(...(Array.isArray(p.items) ? p.items.map(String) : []));
        break;
      case "image_figure":
        images.push({ url: String(p.url ?? ""), alt: String(p.altText ?? "") });
        break;
      case "button_element":
        addHref(p.href);
        break;
      case "tldr_box":
        texts.push(String(p.summary ?? p.text ?? ""));
        break;
      case "bento_features":
        for (const it of Array.isArray(p.items) ? p.items : [])
          texts.push(String(it?.title ?? ""), String(it?.description ?? ""));
        break;
      case "faq_accordion":
        hasFaq = true;
        for (const it of Array.isArray(p.items) ? p.items : [])
          texts.push(String(it?.question ?? ""), String(it?.answer ?? ""));
        break;
      case "howto_steps":
        hasHowTo = true;
        for (const it of Array.isArray(p.steps) ? p.steps : [])
          texts.push(String(it?.title ?? ""), String(it?.description ?? ""));
        break;
      case "callout":
        texts.push(String(p.text ?? ""));
        break;
      default:
        if (typeof p.text === "string") texts.push(p.text);
    }
  }

  const plainText = texts.join(" ").replace(/\s+/g, " ").trim();
  const sentences = plainText.split(/(?<=[.!?…])\s+/).filter((s) => s.trim().length > 0);
  const avg =
    sentences.length > 0
      ? sentences.reduce((a, s) => a + countWords(s), 0) / sentences.length
      : 0;

  return {
    wordCount: countWords(plainText),
    headings,
    images,
    internalLinks: internal,
    externalLinks: external,
    firstParagraph: firstParagraph || plainText.slice(0, 240),
    plainText,
    avgSentenceWords: Math.round(avg * 10) / 10,
    hasFaq,
    hasHowTo,
  };
}

/**
 * SEO dil profili: motorun dile bağlı kuralları. Tabloda olmayan dil, genel (İngilizce benzeri) varsayılanı kullanır.
 * `lower`: Türkçe/Azerice `I`→`ı`, `İ`→`i` kuralını yalnızca o dillerde uygular (İngilizce "INTERNET" ≠ "ınternet").
 */
export interface SeoLanguageProfile {
  lang: string;
  lower: (s: string) => string;
  /** Ortalama cümle uzunluğu için üst eşik (kelime) */
  maxAvgSentenceWords: number;
}

const SENTENCE_LIMITS: Record<string, number> = { tr: 22, en: 20, de: 24, fr: 24, es: 24, it: 24, pt: 24, nl: 22, ru: 18, pl: 20 };

export function seoLanguageProfile(locale = "tr"): SeoLanguageProfile {
  const lang = locale.toLowerCase().split("-")[0] || "tr";
  const tag = lang === "tr" || lang === "az" ? "tr" : lang;
  return {
    lang,
    lower: (s) => {
      try {
        return s.toLocaleLowerCase(tag);
      } catch {
        return s.toLowerCase();
      }
    },
    maxAvgSentenceWords: SENTENCE_LIMITS[lang] ?? 22,
  };
}

export function analyzeSeo(input: SeoAnalyzeInput): SeoAnalysis {
  const settings = { ...DEFAULT_SEO_SETTINGS, ...(input.settings ?? {}) };
  const profile = seoLanguageProfile(input.locale);
  const lc = profile.lower;
  const stats = extractContentStats(input.blocks);
  const checks: SeoCheck[] = [];
  const add = (
    id: string,
    group: SeoCheckGroup,
    status: SeoCheckStatus,
    label: string,
    detail: string,
    weight: number
  ) => checks.push({ id, group, status, label, detail, weight });

  const title = (input.metaTitle || input.title || "").trim();
  const desc = (input.metaDescription || "").trim();
  const effectiveDesc = desc || (settings.autoDescription ? (input.tldr ?? stats.firstParagraph ?? "").trim() : "");
  const kw = (input.focusKeyword ?? "").trim();

  // TEMEL
  if (title.length === 0) add("title", "basic", "fail", "SEO başlığı", "Başlık boş.", 10);
  else if (title.length < 30 || title.length > 60)
    add("title", "basic", "warn", "SEO başlığı uzunluğu", `${title.length} karakter — ideal 30-60.`, 10);
  else add("title", "basic", "pass", "SEO başlığı uzunluğu", `${title.length} karakter — ideal.`, 10);

  if (effectiveDesc.length === 0)
    add("desc", "basic", "fail", "Meta açıklaması", "Açıklama yok ve otomatik üretilemedi.", 10);
  else if (effectiveDesc.length < 70 || effectiveDesc.length > 160)
    add(
      "desc",
      "basic",
      "warn",
      "Meta açıklaması uzunluğu",
      `${effectiveDesc.length} karakter — ideal 70-160.${desc ? "" : " (Motor tarafından otomatik üretildi)"}`,
      10
    );
  else
    add(
      "desc",
      "basic",
      "pass",
      "Meta açıklaması uzunluğu",
      `${effectiveDesc.length} karakter — ideal.${desc ? "" : " (Otomatik üretildi)"}`,
      10
    );

  const slugOk = /^[a-z0-9]+(-[a-z0-9]+)*$/.test(input.slug) && input.slug.length <= 75;
  add(
    "slug",
    "basic",
    slugOk ? "pass" : "warn",
    "URL yapısı",
    slugOk ? "Temiz ve kısa slug." : "Slug küçük harf, tire ve ≤75 karakter olmalı.",
    4
  );

  const hasTldr = (input.tldr ?? "").trim().length >= 40;
  add(
    "tldr",
    "basic",
    hasTldr ? "pass" : "warn",
    "Answer-First özet (TL;DR)",
    hasTldr ? "AI ajanları ve SGE için özet mevcut." : "40+ karakterlik doğrudan yanıt özeti ekleyin.",
    6
  );

  // ANAHTAR KELİME
  if (!kw) {
    add("kw_set", "keyword", "warn", "Odak anahtar kelime", "Belirlenmedi — anahtar kelime kontrolleri atlandı.", 4);
  } else {
    const k = lc(kw);
    const inTitle = lc(title).includes(k);
    add("kw_title", "keyword", inTitle ? "pass" : "fail", "Anahtar kelime başlıkta", inTitle ? "Var." : "SEO başlığında geçmiyor.", 8);
    const inDesc = lc(effectiveDesc).includes(k);
    add("kw_desc", "keyword", inDesc ? "pass" : "warn", "Anahtar kelime açıklamada", inDesc ? "Var." : "Meta açıklamada geçmiyor.", 5);
    const inSlug = input.slug.includes(slugify(kw, profile.lang));
    add("kw_slug", "keyword", inSlug ? "pass" : "warn", "Anahtar kelime URL'de", inSlug ? "Var." : "Slug içinde geçmiyor.", 4);
    const first100 = lc(stats.plainText.split(/\s+/).slice(0, 100).join(" "));
    const inIntro = first100.includes(k);
    add("kw_intro", "keyword", inIntro ? "pass" : "warn", "Anahtar kelime girişte", inIntro ? "İlk 100 kelimede var." : "İlk 100 kelimede geçmiyor.", 5);
    const inH2 = stats.headings.some((h) => h.level >= 2 && lc(h.text).includes(k));
    add("kw_h2", "keyword", inH2 ? "pass" : "warn", "Anahtar kelime alt başlıkta", inH2 ? "Var." : "Hiçbir H2/H3 içinde geçmiyor.", 3);
    const occurrences = k ? lc(stats.plainText).split(k).length - 1 : 0;
    const density = stats.wordCount > 0 ? (occurrences / stats.wordCount) * 100 : 0;
    const dOk = density >= 0.3 && density <= 3;
    add("kw_density", "keyword", dOk ? "pass" : "warn", "Anahtar kelime yoğunluğu", `%${density.toFixed(2)} (${occurrences} kez) — ideal %0.3-3.`, 3);
  }

  // İÇERİK
  const wcOk = stats.wordCount >= settings.minWordCount;
  add("wc", "content", wcOk ? "pass" : "warn", "İçerik uzunluğu", `${stats.wordCount} kelime — en az ${settings.minWordCount} önerilir.`, 8);

  const h2count = stats.headings.filter((h) => h.level === 2).length;
  add("h2", "content", h2count >= 1 ? "pass" : "warn", "Alt başlık yapısı", h2count >= 1 ? `${h2count} adet H2.` : "En az bir H2 alt başlığı ekleyin.", 4);

  const avgOk = stats.avgSentenceWords > 0 && stats.avgSentenceWords <= profile.maxAvgSentenceWords;
  add("read", "content", avgOk || stats.wordCount === 0 ? "pass" : "warn", "Okunabilirlik", `Ortalama cümle: ${stats.avgSentenceWords} kelime (≤${profile.maxAvgSentenceWords} ideal).`, 4);

  if (stats.hasFaq || stats.hasHowTo)
    add("structured", "content", "pass", "Yapılandırılmış blok", `${stats.hasFaq ? "SSS " : ""}${stats.hasHowTo ? "HowTo " : ""}→ otomatik zengin sonuç şeması üretilir.`, 3);

  // MEDYA
  const missingAlt = stats.images.filter((i) => !i.alt.trim()).length;
  if (stats.images.length === 0 && !input.featuredImageUrl)
    add("img", "media", "warn", "Görsel kullanımı", "İçerikte hiç görsel yok.", 4);
  else
    add("img", "media", missingAlt === 0 ? "pass" : "fail", "Görsel alt metinleri", missingAlt === 0 ? "Tüm görsellerde alt metin var." : `${missingAlt} görselde alt metin eksik.`, 6);

  if (input.featuredImageUrl) {
    const ok = (input.featuredAltText ?? "").trim().length >= 5;
    add("feat", "media", ok ? "pass" : "fail", "Öne çıkan görsel", ok ? "Alt metin tanımlı (OG görseli olarak kullanılır)." : "Öne çıkan görselin alt metni eksik.", 4);
  } else {
    add("feat", "media", "warn", "Öne çıkan görsel", "Sosyal paylaşımlarda (OG) görsel olmayacak.", 3);
  }

  // BAĞLANTILAR
  add("ilink", "links", stats.internalLinks > 0 ? "pass" : "warn", "İç bağlantılar", `${stats.internalLinks} iç bağlantı.`, 4);
  add("elink", "links", stats.externalLinks > 0 ? "pass" : "warn", "Dış kaynak bağlantıları", `${stats.externalLinks} dış bağlantı.`, 2);

  // TEKNİK
  add("index", "technical", input.noIndex ? "warn" : "pass", "Dizinleme", input.noIndex ? "noindex aktif — arama motorlarına kapalı." : "Dizinlemeye açık.", 3);
  add("schema", "technical", "pass", "Schema.org grafiği", `${input.schemaType ?? "WebPage"} + Organization + WebSite + BreadcrumbList otomatik üretilir.`, 2);

  const totalWeight = checks.reduce((a, c) => a + c.weight, 0);
  const earned = checks.reduce(
    (a, c) => a + (c.status === "pass" ? c.weight : c.status === "warn" ? c.weight * 0.5 : 0),
    0
  );
  const score = totalWeight > 0 ? Math.round((earned / totalWeight) * 100) : 0;

  const gap: string[] = [];
  for (const c of checks) {
    if (c.status === "fail") gap.push(`seo_${c.id}`);
  }
  if (!hasTldr) gap.push("missing_tldr");
  if (!wcOk) gap.push("thin_content");

  return {
    score,
    grade: score >= 85 ? "A" : score >= 70 ? "B" : score >= 50 ? "C" : "D",
    checks,
    gapFindings: Array.from(new Set(gap)),
    stats,
  };
}

// ---------------------------------------------------------------------------
// META ÇÖZÜMLEME (Render anı)
// ---------------------------------------------------------------------------

export interface ResolveMetaInput {
  siteName: string;
  tagline?: string | null;
  baseUrl: string;
  locale: string;
  path: string; // /tr/slug
  isHome?: boolean;
  title: string;
  tldr?: string | null;
  excerpt?: string | null;
  firstParagraph?: string;
  metaTitle?: string | null;
  metaDescription?: string | null;
  canonicalUrl?: string | null;
  noIndex?: boolean;
  noFollow?: boolean;
  ogTitle?: string;
  ogDescription?: string;
  imageUrl?: string | null;
  ogType?: "website" | "article";
  publishedTime?: Date | string | null;
  modifiedTime?: Date | string | null;
  settings?: Partial<SeoEngineSettings>;
}

export interface ResolvedSeoMeta {
  title: string;
  description: string;
  canonical: string;
  robots: string;
  openGraph: {
    title: string;
    description: string;
    url: string;
    type: "website" | "article";
    siteName: string;
    locale: string;
    images: string[];
    publishedTime?: string;
    modifiedTime?: string;
  };
  twitter: { card: "summary_large_image" | "summary"; title: string; description: string; images: string[]; site?: string };
}

export function truncateSmart(text: string, max: number): string {
  const clean = text.replace(/\s+/g, " ").trim();
  if (clean.length <= max) return clean;
  const cut = clean.slice(0, max - 1);
  const lastSpace = cut.lastIndexOf(" ");
  return (lastSpace > max * 0.6 ? cut.slice(0, lastSpace) : cut).replace(/[,;:\-–—]+$/, "") + "…";
}

function applyTemplate(tpl: string, vars: Record<string, string>): string {
  return tpl.replace(/%(\w+)%/g, (_, k: string) => vars[k] ?? "");
}

export function resolveSeoMeta(input: ResolveMetaInput): ResolvedSeoMeta {
  const s = { ...DEFAULT_SEO_SETTINGS, ...(input.settings ?? {}) };
  const base = input.baseUrl.replace(/\/$/, "");
  const vars = {
    title: input.metaTitle?.trim() || input.title,
    site: input.siteName,
    tagline: input.tagline ?? "",
    sep: s.separator,
  };

  let title: string;
  if (input.metaTitle && input.metaTitle.includes(input.siteName)) {
    title = input.metaTitle;
  } else if (input.isHome) {
    title = applyTemplate(s.homeTitleTemplate, vars).replace(/\s+—\s*$/, "").trim() || input.siteName;
  } else {
    title = applyTemplate(s.titleTemplate, vars).trim();
  }

  const rawDesc =
    input.metaDescription?.trim() ||
    (s.autoDescription
      ? s.descriptionFallback === "excerpt"
        ? input.excerpt || input.tldr || input.firstParagraph
        : s.descriptionFallback === "content"
          ? input.firstParagraph || input.tldr
          : input.tldr || input.excerpt || input.firstParagraph
      : "") ||
    "";
  const description = truncateSmart(rawDesc, 160);

  const canonical =
    input.canonicalUrl?.trim() || (s.autoCanonical ? `${base}${input.path}` : `${base}${input.path}`);

  const robots = [
    input.noIndex ? "noindex" : "index",
    input.noFollow ? "nofollow" : "follow",
    "max-image-preview:large",
    "max-snippet:-1",
  ].join(", ");

  const ogImage = input.imageUrl || s.defaultOgImage || "";
  const absImage = ogImage
    ? /^(https?:|data:)/i.test(ogImage)
      ? ogImage
      : `${base}${ogImage.startsWith("/") ? "" : "/"}${ogImage}`
    : "";
  const images = absImage && !absImage.startsWith("data:") ? [absImage] : [];

  const ogTitle = input.ogTitle?.trim() || vars.title;
  const ogDesc = input.ogDescription?.trim() || description;
  const iso = (d?: Date | string | null) =>
    d ? (d instanceof Date ? d.toISOString() : new Date(d).toISOString()) : undefined;

  return {
    title,
    description,
    canonical,
    robots,
    openGraph: {
      title: ogTitle,
      description: ogDesc,
      url: canonical,
      type: input.ogType ?? "website",
      siteName: input.siteName,
      locale: input.locale === "tr" ? "tr_TR" : input.locale,
      images,
      publishedTime: iso(input.publishedTime),
      modifiedTime: iso(input.modifiedTime),
    },
    twitter: {
      card: images.length > 0 ? "summary_large_image" : "summary",
      title: ogTitle,
      description: ogDesc,
      images,
      site: s.twitterHandle || undefined,
    },
  };
}

// ---------------------------------------------------------------------------
// OTOMATİK ŞEMA TÜRETME (Bloklardan)
// ---------------------------------------------------------------------------

export function deriveAutoSchemaNodes(
  blocks: BlockNode[],
  pageUrl: string
): SchemaGraphNode[] {
  const nodes: SchemaGraphNode[] = [];
  const flat = flattenBlocks(blocks).map((e) => e.block);

  const faqItems: Array<{ q: string; a: string }> = [];
  for (const b of flat) {
    const p = b.props ?? {};
    if (b.type === "faq_accordion") {
      for (const it of Array.isArray(p.items) ? p.items : []) {
        if (it?.question && it?.answer) faqItems.push({ q: String(it.question), a: String(it.answer) });
      }
    }
    if (b.type === "howto_steps" && Array.isArray(p.steps) && p.steps.length > 0) {
      nodes.push({
        "@type": "HowTo",
        "@id": `${pageUrl}#howto-${b.id}`,
        name: String(p.title ?? "Adım Adım Rehber"),
        step: p.steps.map((st: any, i: number) => ({
          "@type": "HowToStep",
          position: i + 1,
          name: String(st?.title ?? `Adım ${i + 1}`),
          text: String(st?.description ?? ""),
        })),
      });
    }
    if (b.type === "review_box") {
      nodes.push({
        "@type": "Review",
        "@id": `${pageUrl}#review-${b.id}`,
        name: String(p.itemName ?? "İnceleme"),
        reviewBody: String(p.verdict ?? ""),
        reviewRating: {
          "@type": "Rating",
          ratingValue: Number(p.rating ?? 5),
          bestRating: 5,
          worstRating: 1,
        },
        itemReviewed: { "@type": "Thing", name: String(p.itemName ?? "") },
      });
    }
    if (b.type === "video_embed" && p.url) {
      nodes.push({
        "@type": "VideoObject",
        "@id": `${pageUrl}#video-${b.id}`,
        name: String(p.title ?? "Video"),
        embedUrl: String(p.url),
        description: String(p.title ?? "Video"),
      });
    }
  }

  if (faqItems.length > 0) {
    nodes.push({
      "@type": "FAQPage",
      "@id": `${pageUrl}#faq`,
      mainEntity: faqItems.map((f) => ({
        "@type": "Question",
        name: f.q,
        acceptedAnswer: { "@type": "Answer", text: f.a },
      })),
    });
  }
  return nodes;
}

export function buildBreadcrumbNode(
  baseUrl: string,
  pageUrl: string,
  trail: Array<{ name: string; url: string }>
): SchemaGraphNode {
  return {
    "@type": "BreadcrumbList",
    "@id": `${pageUrl}#breadcrumb`,
    itemListElement: trail.map((t, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: t.name,
      item: /^https?:/.test(t.url) ? t.url : `${baseUrl.replace(/\/$/, "")}${t.url}`,
    })),
  };
}

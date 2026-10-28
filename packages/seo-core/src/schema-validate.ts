import type { SchemaGraphNode } from "@nexpress/core";

export type SchemaIssueLevel = "error" | "warning";

export interface SchemaIssue {
  level: SchemaIssueLevel;
  /** İlgili düğümün türü (ör. FAQPage) */
  type: string;
  message: string;
}

type Obj = Record<string, unknown>;

const isObj = (v: unknown): v is Obj => typeof v === "object" && v !== null && !Array.isArray(v);
const filled = (v: unknown): boolean => (typeof v === "string" ? v.trim().length > 0 : v !== undefined && v !== null && !(Array.isArray(v) && v.length === 0));
const arr = (v: unknown): unknown[] => (Array.isArray(v) ? v : v === undefined || v === null ? [] : [v]);
const typesOf = (n: SchemaGraphNode): string[] => (Array.isArray(n["@type"]) ? n["@type"] : [n["@type"]]).filter((t): t is string => typeof t === "string");

const ARTICLE = new Set(["Article", "BlogPosting", "NewsArticle", "TechArticle"]);

/**
 * JSON-LD düğümlerini sık kullanılan zengin sonuç kurallarına göre denetler (tam Schema.org doğrulayıcısı değildir).
 * `error`: Google'ın zengin sonuç için gerekli saydığı alan eksik veya yapı bozuk. `warning`: önerilen alan eksik.
 */
export function validateSchemaGraph(nodes: SchemaGraphNode[]): SchemaIssue[] {
  const issues: SchemaIssue[] = [];
  for (const node of nodes) {
    const types = typesOf(node);
    const label = types.join("/") || "(türsüz)";
    const add = (level: SchemaIssueLevel, message: string) => issues.push({ level, type: label, message });
    if (types.length === 0) {
      add("error", "@type eksik.");
      continue;
    }
    const need = (field: string, level: SchemaIssueLevel = "error") => {
      if (!filled(node[field])) add(level, `"${field}" eksik.`);
    };

    if (types.some((t) => ARTICLE.has(t))) {
      need("headline");
      if (typeof node.headline === "string" && node.headline.length > 110) add("warning", `"headline" ${node.headline.length} karakter; 110'u aşmamalı.`);
      need("datePublished", "warning");
      need("author", "warning");
      need("image", "warning");
    }
    if (types.includes("FAQPage")) {
      const qs = arr(node.mainEntity);
      if (qs.length === 0) add("error", `"mainEntity" boş; en az bir soru gerekir.`);
      qs.forEach((q, i) => {
        if (!isObj(q) || !filled(q.name)) add("error", `Soru ${i + 1}: "name" eksik.`);
        else if (!isObj(q.acceptedAnswer) || !filled(q.acceptedAnswer.text)) add("error", `Soru ${i + 1}: "acceptedAnswer.text" eksik.`);
      });
    }
    if (types.includes("HowTo")) {
      need("name");
      const steps = arr(node.step);
      if (steps.length === 0) add("error", `"step" boş; en az bir adım gerekir.`);
      steps.forEach((s, i) => {
        if (!isObj(s) || !(filled(s.text) || filled(s.name))) add("error", `Adım ${i + 1}: "text" veya "name" eksik.`);
      });
    }
    if (types.includes("Product")) {
      need("name");
      need("image", "warning");
      const offers = arr(node.offers).filter(isObj);
      if (offers.length === 0 && !filled(node.review) && !filled(node.aggregateRating)) add("error", `"offers", "review" veya "aggregateRating" gerekir.`);
      for (const o of offers) {
        if (!filled(o.price) && !filled(o.lowPrice)) add("error", `Teklif: "price" eksik.`);
        if (!filled(o.priceCurrency)) add("error", `Teklif: "priceCurrency" eksik.`);
        if (!filled(o.availability)) add("warning", `Teklif: "availability" eksik.`);
      }
    }
    if (types.includes("Review")) {
      if (!isObj(node.itemReviewed) || !filled(node.itemReviewed.name)) add("error", `"itemReviewed.name" eksik.`);
      const rating = isObj(node.reviewRating) ? node.reviewRating : null;
      if (!rating || !filled(rating.ratingValue)) add("error", `"reviewRating.ratingValue" eksik.`);
      else if (Number.isNaN(Number(rating.ratingValue))) add("error", `"ratingValue" sayı olmalı.`);
      need("author", "warning");
    }
    if (types.includes("BreadcrumbList")) {
      const items = arr(node.itemListElement);
      if (items.length === 0) add("error", `"itemListElement" boş.`);
      items.forEach((it, i) => {
        if (!isObj(it)) return add("error", `Öğe ${i + 1}: nesne olmalı.`);
        if (Number(it.position) !== i + 1) add("error", `Öğe ${i + 1}: "position" ${i + 1} olmalı.`);
        if (!filled(it.name)) add("error", `Öğe ${i + 1}: "name" eksik.`);
        if (!filled(it.item) && i < items.length - 1) add("warning", `Öğe ${i + 1}: "item" (adres) eksik.`);
      });
    }
    if (types.includes("VideoObject")) {
      need("name");
      need("thumbnailUrl");
      need("uploadDate");
    }
    if (types.includes("Organization")) need("name");
    if (types.includes("WebSite")) {
      need("name", "warning");
      need("url");
    }
    if (types.includes("WebPage")) need("name", "warning");
  }
  return issues;
}

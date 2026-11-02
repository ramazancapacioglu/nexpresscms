import type { SchemaGraphNode } from "@nexpress/core";

/**
 * Zengin şema türleri (saf mantık). Editörde `schemaAttributes.richSchema` olarak saklanır; yalnızca ilgili modül
 * (faq-qa, campaign-offer, tech-article, software-app) açıksa şema grafiğine eklenir. Girdi her zaman doğrulanır ve
 * kırpılır: bozuk/boş değerler düğüm üretmez (yanlış işaretleme yerine işaretsiz sayfa).
 */
export interface RichSchema {
  qa?: { enabled?: boolean };
  offer?: { price?: string; currency?: string; validThrough?: string; availability?: string; name?: string; url?: string };
  tech?: { level?: string; dependencies?: string };
  software?: { category?: string; os?: string; version?: string; price?: string; currency?: string; features?: string };
}

export type RichModule = "faq-qa" | "campaign-offer" | "tech-article" | "software-app";

const clip = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : "");
const PRICE_RE = /^\d{1,9}([.,]\d{1,2})?$/;
const CURRENCY_RE = /^[A-Z]{3}$/;
const AVAILABILITY = new Set(["InStock", "OutOfStock", "PreOrder", "LimitedAvailability", "SoldOut"]);
const LEVELS = new Set(["Beginner", "Intermediate", "Expert"]);

const price = (v: unknown) => {
  const s = clip(v, 14);
  return PRICE_RE.test(s) ? s.replace(",", ".") : "";
};
const currency = (v: unknown) => {
  const s = clip(v, 3).toUpperCase();
  return CURRENCY_RE.test(s) ? s : "";
};
const isoDay = (v: unknown) => {
  const s = clip(v, 30);
  const d = new Date(s);
  return s && !Number.isNaN(d.getTime()) ? d : null;
};
const safeUrl = (v: unknown) => {
  const s = clip(v, 500);
  return /^(https?:\/\/|\/(?!\/))/i.test(s) ? s : "";
};

export interface RichContext {
  url: string;
  title: string;
  tldr: string | null | undefined;
  now: Date;
  enabled: Record<RichModule, boolean>;
}

export interface RichResult {
  extra: SchemaGraphNode[];
  /** Ana varlık düğümüne eklenecek alanlar (TechArticle) */
  entityPatch: Record<string, unknown>;
}

export function buildRichNodes(rich: RichSchema | null | undefined, ctx: RichContext): RichResult {
  const extra: SchemaGraphNode[] = [];
  const entityPatch: Record<string, unknown> = {};
  if (!rich) return { extra, entityPatch };

  if (ctx.enabled["faq-qa"] && rich.qa?.enabled && ctx.title.trim() && (ctx.tldr ?? "").trim().length >= 20) {
    extra.push({
      "@type": "QAPage",
      "@id": `${ctx.url}#qapage`,
      mainEntity: { "@type": "Question", name: ctx.title.trim(), answerCount: 1, acceptedAnswer: { "@type": "Answer", text: (ctx.tldr ?? "").trim() } },
    });
  }

  const o = rich.offer;
  if (ctx.enabled["campaign-offer"] && o) {
    const p = price(o.price);
    const c = currency(o.currency);
    const until = isoDay(o.validThrough);
    // Bitiş tarihi geçtiyse düğüm kendiliğinden kalkar (süresi dolmuş teklif işaretlenmez)
    if (p && c && until && until.getTime() + 86_400_000 > ctx.now.getTime()) {
      const availability = AVAILABILITY.has(clip(o.availability, 30)) ? clip(o.availability, 30) : "InStock";
      extra.push({
        "@type": "Offer",
        "@id": `${ctx.url}#offer`,
        name: clip(o.name, 120) || ctx.title,
        price: p,
        priceCurrency: c,
        priceValidUntil: until.toISOString().slice(0, 10),
        availability: `https://schema.org/${availability}`,
        url: safeUrl(o.url) || ctx.url,
      });
    }
  }

  const t = rich.tech;
  if (ctx.enabled["tech-article"] && t) {
    const level = LEVELS.has(clip(t.level, 20)) ? clip(t.level, 20) : "";
    const deps = clip(t.dependencies, 300);
    if (level) entityPatch.proficiencyLevel = level;
    if (deps) entityPatch.dependencies = deps;
  }

  const s = rich.software;
  if (ctx.enabled["software-app"] && s && clip(s.category, 60) && clip(s.os, 80)) {
    const p = price(s.price);
    const c = currency(s.currency);
    const features = clip(s.features, 1200).split(/\r?\n/).map((x) => x.trim()).filter(Boolean).slice(0, 20);
    extra.push({
      "@type": "SoftwareApplication",
      "@id": `${ctx.url}#software`,
      name: ctx.title,
      applicationCategory: clip(s.category, 60),
      operatingSystem: clip(s.os, 80),
      ...(clip(s.version, 30) ? { softwareVersion: clip(s.version, 30) } : {}),
      ...(features.length ? { featureList: features } : {}),
      ...(p && c ? { offers: { "@type": "Offer", price: p, priceCurrency: c } } : {}),
    });
  }
  return { extra, entityPatch };
}

/** Ana varlık düğümünü (sayfa adresiyle eşleşen) yamalar; yoksa düğümler olduğu gibi döner. */
export function patchEntity(nodes: SchemaGraphNode[], url: string, patch: Record<string, unknown>): SchemaGraphNode[] {
  if (Object.keys(patch).length === 0) return nodes;
  return nodes.map((n) => (n.url === url && n["@type"] === "TechArticle" ? { ...n, ...patch } : n));
}

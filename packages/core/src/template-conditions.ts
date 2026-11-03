import { termSlug } from "./dynamic-content";

/**
 * Şablon görüntüleme koşulları (saf): bir şablon, atama olmasa da belirli sayfalarda kendiliğinden devreye girer.
 * Örn. yalnızca İngilizce sayfalarda ayrı header, "rehber" kategorisindeki yazılarda ayrı yazı şablonu.
 * Ziyaretçi sayfaları önbelleklenir; bu yüzden oturum/rol gibi isteğe özgü koşul YOKTUR.
 */
export type ConditionType = "slug" | "category" | "tag" | "contentType" | "locale";

export interface TemplateCondition {
  type: ConditionType;
  value: string;
}

export interface TemplateConditions {
  /** Herhangi biri eşleşirse şablon aday olur (boşsa şablon koşulla devreye girmez) */
  include: TemplateCondition[];
  /** Herhangi biri eşleşirse şablon dışlanır */
  exclude: TemplateCondition[];
}

/** Çözümleme bağlamı: çağıran yalnızca bildiği alanları verir; bilinmeyen alana bağlı koşul eşleşmez. */
export interface TemplateContext {
  locale?: string;
  slug?: string;
  contentType?: string;
  categories?: string[];
  tags?: string[];
}

export const CONDITION_LABELS: Record<ConditionType, string> = {
  slug: "Sayfa adresi (slug)",
  category: "Kategori",
  tag: "Etiket",
  contentType: "İçerik türü",
  locale: "Dil",
};

/** Özgüllük: daha belirgin koşul kazanır (tek sayfa > kategori > etiket > tür > dil). */
const SCORE: Record<ConditionType, number> = { slug: 100, category: 80, tag: 70, contentType: 50, locale: 30 };

const MAX_RULES = 20;
const isType = (v: unknown): v is ConditionType => typeof v === "string" && v in SCORE;

/** Dış kaynaktan (veritabanı/paket) gelen koşulları doğrular ve sınırlar; bozuk kayıt atılır. */
export function sanitizeConditions(raw: unknown): TemplateConditions {
  const read = (list: unknown): TemplateCondition[] =>
    (Array.isArray(list) ? list : [])
      .flatMap((c) => {
        const o = c as { type?: unknown; value?: unknown };
        if (!isType(o?.type) || typeof o.value !== "string") return [];
        const value = o.type === "category" || o.type === "tag" || o.type === "slug" ? termSlug(o.value.slice(0, 80)) : o.value.trim().toLowerCase().slice(0, 40);
        return value ? [{ type: o.type, value }] : [];
      })
      .slice(0, MAX_RULES);
  const r = (raw ?? {}) as { include?: unknown; exclude?: unknown };
  return { include: read(r.include), exclude: read(r.exclude) };
}

function matches(c: TemplateCondition, ctx: TemplateContext): boolean {
  switch (c.type) {
    case "slug":
      return ctx.slug !== undefined && termSlug(ctx.slug) === c.value;
    case "category":
      return (ctx.categories ?? []).some((x) => termSlug(x) === c.value);
    case "tag":
      return (ctx.tags ?? []).some((x) => termSlug(x) === c.value);
    case "contentType":
      return ctx.contentType?.toLowerCase() === c.value;
    case "locale":
      return ctx.locale?.toLowerCase() === c.value;
  }
}

/** Koşullar bağlamla eşleşirse özgüllük puanı (>0), eşleşmezse ya da dışlanırsa 0. */
export function conditionScore(conditions: TemplateConditions | undefined, ctx: TemplateContext): number {
  if (!conditions || conditions.include.length === 0) return 0;
  if (conditions.exclude.some((c) => matches(c, ctx))) return 0;
  return Math.max(0, ...conditions.include.filter((c) => matches(c, ctx)).map((c) => SCORE[c.type]));
}

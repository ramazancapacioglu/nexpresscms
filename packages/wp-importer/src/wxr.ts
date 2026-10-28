import { XMLParser, XMLValidator } from "fast-xml-parser";

/** WordPress dışa aktarımı (WXR 1.x) okuyucusu. Saf mantık: dosya, ağ ve veritabanı yok. */
export interface WxrTerm {
  kind: "category" | "tag";
  slug: string;
  name: string;
  parentSlug: string;
}

export interface WxrItem {
  id: string;
  /** post | page | product | attachment | nav_menu_item | özel türler */
  type: string;
  /** publish | draft | pending | private | future | trash | inherit */
  status: string;
  title: string;
  /** WordPress'in `post_name` değeri (yüzde kodlu olabilir) */
  postName: string;
  link: string;
  /** post_date_gmt (yoksa post_date); geçersizse null */
  date: Date | null;
  author: string;
  contentHtml: string;
  excerptHtml: string;
  parentId: string;
  /** Bu öğeye atanmış kategori/etiket kısa adları */
  categories: string[];
  tags: string[];
  meta: Record<string, string>;
  /** attachment öğelerinde özgün dosya adresi */
  attachmentUrl: string;
}

export interface WxrDocument {
  siteTitle: string;
  baseUrl: string;
  language: string;
  terms: WxrTerm[];
  items: WxrItem[];
}

export const WXR_LIMITS = { bytes: 64 * 1024 * 1024, items: 20_000 } as const;

const ARRAY_TAGS = new Set(["item", "wp:postmeta", "category", "wp:category", "wp:tag"]);

const text = (v: unknown): string => (typeof v === "string" ? v : typeof v === "number" ? String(v) : v && typeof v === "object" && "#text" in v ? text((v as Record<string, unknown>)["#text"]) : "");
const list = <T,>(v: unknown): T[] => (Array.isArray(v) ? (v as T[]) : v === undefined || v === null ? [] : [v as T]);

function parseDate(gmt: string, local: string): Date | null {
  const g = gmt && !gmt.startsWith("0000") ? gmt : "";
  const raw = g || (local && !local.startsWith("0000") ? local : "");
  if (!raw) return null;
  const d = new Date(`${raw.replace(" ", "T")}${g ? "Z" : ""}`);
  return Number.isNaN(d.getTime()) ? null : d;
}

export class WxrError extends Error {}

export function parseWxr(xml: string): WxrDocument {
  if (xml.length > WXR_LIMITS.bytes) throw new WxrError("Dosya çok büyük.");
  if (/<!ENTITY/i.test(xml)) throw new WxrError("Güvenlik: XML varlık tanımları (ENTITY) desteklenmez.");
  if (XMLValidator.validate(xml) !== true) throw new WxrError("XML okunamadı: dosya bozuk olabilir.");
  const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: "@_", parseTagValue: false, parseAttributeValue: false, trimValues: true, isArray: (name) => ARRAY_TAGS.has(name) });
  let root: Record<string, unknown>;
  try {
    root = parser.parse(xml) as Record<string, unknown>;
  } catch {
    throw new WxrError("XML okunamadı: dosya bozuk olabilir.");
  }
  const channel = (root.rss as { channel?: Record<string, unknown> } | undefined)?.channel;
  if (!channel || typeof channel !== "object") throw new WxrError("Bu bir WordPress dışa aktarma (WXR) dosyası değil.");

  const terms: WxrTerm[] = [];
  for (const c of list<Record<string, unknown>>(channel["wp:category"])) {
    const slug = text(c["wp:category_nicename"]);
    if (slug) terms.push({ kind: "category", slug, name: text(c["wp:cat_name"]) || slug, parentSlug: text(c["wp:category_parent"]) });
  }
  for (const t of list<Record<string, unknown>>(channel["wp:tag"])) {
    const slug = text(t["wp:tag_slug"]);
    if (slug) terms.push({ kind: "tag", slug, name: text(t["wp:tag_name"]) || slug, parentSlug: "" });
  }

  const rawItems = list<Record<string, unknown>>(channel.item);
  if (rawItems.length > WXR_LIMITS.items) throw new WxrError(`En çok ${WXR_LIMITS.items} öğe içe aktarılabilir.`);
  const items: WxrItem[] = rawItems.map((it) => {
    const meta: Record<string, string> = {};
    for (const m of list<Record<string, unknown>>(it["wp:postmeta"])) {
      const key = text(m["wp:meta_key"]);
      if (key && !(key in meta)) meta[key] = text(m["wp:meta_value"]);
    }
    const categories: string[] = [];
    const tags: string[] = [];
    for (const c of list<Record<string, unknown>>(it.category)) {
      const domain = text(c["@_domain"]);
      const nice = text(c["@_nicename"]);
      if (!nice) continue;
      if (domain === "category") categories.push(nice);
      else if (domain === "post_tag") tags.push(nice);
    }
    return {
      id: text(it["wp:post_id"]),
      type: text(it["wp:post_type"]),
      status: text(it["wp:status"]),
      title: text(it.title),
      postName: text(it["wp:post_name"]),
      link: text(it.link),
      date: parseDate(text(it["wp:post_date_gmt"]), text(it["wp:post_date"])),
      author: text(it["dc:creator"]),
      contentHtml: text(it["content:encoded"]),
      excerptHtml: text(it["excerpt:encoded"]),
      parentId: text(it["wp:post_parent"]),
      categories,
      tags,
      meta,
      attachmentUrl: text(it["wp:attachment_url"]),
    };
  });
  return { siteTitle: text(channel.title), baseUrl: text(channel["wp:base_site_url"]) || text(channel.link), language: text(channel.language), terms, items };
}

/**
 * Gelişmiş Şema Kuralları & Entity Knowledge Graph motoru (saf mantık).
 * `sites.settings.seo.schemaPlacements` içinde saklanır; eski 6 alanlı kayıtlarla %100 geriye dönük uyumludur.
 */

export type SchemaPlacementScope =
  | "all"
  | "page"
  | "post"
  | "category"
  | "tag"
  | "content"
  | "custom_type";

export type SchemaPlacementMode = "primary" | "additional";

export interface SchemaEntityRef {
  relation: "about" | "mentions";
  name: string;
  type?: string;
  sameAs?: string;
}

export interface SchemaPlacement {
  id: string;
  name: string;
  schemaType: string;
  scope: SchemaPlacementScope;
  /** Geriye dönük uyum: eski tekil kategori slug alanı. */
  category: string;
  /** Çoklu kategori slug listesi (`scope: "category"`). */
  categories?: string[];
  /** Çoklu etiket slug listesi (`scope: "tag"`). */
  tags?: string[];
  /** Belirli içerik kimlikleri (`scope: "content"`). */
  contentIds?: string[];
  /** İçerik türleri (`scope: "custom_type"`, ör. `kb_tech`, `ai_prompt`, `campaign`, `product` veya özel tür). */
  contentTypes?: string[];
  /** Hariç tutulan içerik kimlikleri. */
  excludeContentIds?: string[];
  /** Hariç tutulan kategori slug'ları. */
  excludeCategories?: string[];
  /** `primary`: genel şemayı (WebPage/Article) değiştirir. `additional`: `@graph` içine bağlı ek düğüm ekler. */
  mode?: SchemaPlacementMode;
  /** Düşük sayı önce değerlendirilir. */
  priority?: number;
  /** AI & sesli arama alıntı işaretlemesi (`SpeakableSpecification`). */
  speakable?: boolean;
  /** Dinamik değişken destekli Schema.org özellikleri (`%title%`, `%tldr%`, `%site%`…). */
  properties?: Record<string, string>;
  /** Entity Knowledge Graph (`about` / `mentions` + Wikipedia/Wikidata `sameAs`). */
  entities?: SchemaEntityRef[];
  enabled: boolean;
}

export interface SchemaTypeFieldSpec {
  key: string;
  label: string;
  placeholder: string;
  defaultValue?: string;
}

export interface SchemaTypeSpec {
  id: string;
  label: string;
  group: "İçerik" | "İşletme & Hizmet" | "Ürün & Yazılım" | "Rehber & Etkileşim";
  description: string;
  fields: SchemaTypeFieldSpec[];
}

export const SCHEMA_TYPE_CATALOG: SchemaTypeSpec[] = [
  {
    id: "Article",
    label: "Makale (Article)",
    group: "İçerik",
    description: "Genel editoryal makale ve rehber sayfaları.",
    fields: [
      { key: "articleSection", label: "Bölüm / Kategori", placeholder: "%category%", defaultValue: "%category%" },
      { key: "keywords", label: "Anahtar Kelimeler", placeholder: "%keywords%", defaultValue: "%keywords%" },
    ],
  },
  {
    id: "BlogPosting",
    label: "Blog Yazısı (BlogPosting)",
    group: "İçerik",
    description: "Blog yazıları için standart Schema.org makale düğümü.",
    fields: [
      { key: "articleSection", label: "Bölüm / Kategori", placeholder: "%category%", defaultValue: "%category%" },
      { key: "keywords", label: "Anahtar Kelimeler", placeholder: "%keywords%", defaultValue: "%keywords%" },
    ],
  },
  {
    id: "NewsArticle",
    label: "Haber (NewsArticle)",
    group: "İçerik",
    description: "Güncel duyuru, basın bülteni ve haber içerikleri.",
    fields: [
      { key: "articleSection", label: "Haber Kategorisi", placeholder: "%category%", defaultValue: "%category%" },
      { key: "dateline", label: "Yer / Şehir", placeholder: "İzmir, Türkiye" },
    ],
  },
  {
    id: "TechArticle",
    label: "Teknik Makale (TechArticle)",
    group: "İçerik",
    description: "Kurulum, dokümantasyon ve teknik bilgi bankası yazıları.",
    fields: [
      { key: "proficiencyLevel", label: "Uzmanlık Düzeyi", placeholder: "Beginner / Expert", defaultValue: "Expert" },
      { key: "dependencies", label: "Gereksinimler", placeholder: "Windows, SQL Server" },
    ],
  },
  {
    id: "WebPage",
    label: "Web Sayfası (WebPage)",
    group: "İçerik",
    description: "Standart kurumsal içerik ve açılış sayfaları.",
    fields: [
      { key: "description", label: "Açıklama", placeholder: "%tldr%", defaultValue: "%tldr%" },
    ],
  },
  {
    id: "AboutPage",
    label: "Hakkımızda (AboutPage)",
    group: "İşletme & Hizmet",
    description: "Kurumsal kimlik, tarihçe ve ekip tanıtım sayfaları.",
    fields: [
      { key: "description", label: "Kurumsal Özet", placeholder: "%tldr%", defaultValue: "%tldr%" },
    ],
  },
  {
    id: "ContactPage",
    label: "İletişim (ContactPage)",
    group: "İşletme & Hizmet",
    description: "İletişim, destek ve şube adres sayfaları.",
    fields: [
      { key: "description", label: "İletişim Özeti", placeholder: "%tldr%", defaultValue: "%tldr%" },
    ],
  },
  {
    id: "Service",
    label: "Hizmet (Service)",
    group: "İşletme & Hizmet",
    description: "Kurumsal hizmet, danışmanlık, kurulum ve bakım sayfaları.",
    fields: [
      { key: "name", label: "Hizmet Adı", placeholder: "%title%", defaultValue: "%title%" },
      { key: "serviceType", label: "Hizmet Türü", placeholder: "ERP Kurulum ve Danışmanlık" },
      { key: "areaServed", label: "Hizmet Bölgesi", placeholder: "İzmir, Türkiye" },
      { key: "description", label: "Hizmet Özeti", placeholder: "%tldr%", defaultValue: "%tldr%" },
    ],
  },
  {
    id: "LocalBusiness",
    label: "Yerel İşletme (LocalBusiness)",
    group: "İşletme & Hizmet",
    description: "Bölgesel ofis, bayi ve şube sayfaları için yerel SEO düğümü.",
    fields: [
      { key: "name", label: "İşletme Adı", placeholder: "%site%", defaultValue: "%site%" },
      { key: "telephone", label: "Telefon", placeholder: "+90 232 ..." },
      { key: "priceRange", label: "Fiyat Aralığı", placeholder: "₺₺" },
      { key: "areaServed", label: "Hizmet Bölgesi", placeholder: "İzmir, Ege Bölgesi" },
    ],
  },
  {
    id: "ProfessionalService",
    label: "Profesyonel Hizmet (ProfessionalService)",
    group: "İşletme & Hizmet",
    description: "Ajans, yazılım bayisi, hukuk, mali müşavirlik ve B2B hizmetler.",
    fields: [
      { key: "name", label: "Kurum / Hizmet Adı", placeholder: "%title%", defaultValue: "%title%" },
      { key: "areaServed", label: "Bölge", placeholder: "Türkiye" },
      { key: "priceRange", label: "Fiyat Aralığı", placeholder: "₺₺" },
    ],
  },
  {
    id: "Organization",
    label: "Kuruluş (Organization)",
    group: "İşletme & Hizmet",
    description: "Marka ve kurumsal varlık düğümü.",
    fields: [
      { key: "name", label: "Kuruluş Adı", placeholder: "%site%", defaultValue: "%site%" },
      { key: "description", label: "Tanım", placeholder: "%tldr%", defaultValue: "%tldr%" },
    ],
  },
  {
    id: "SoftwareApplication",
    label: "Yazılım / Uygulama (SoftwareApplication)",
    group: "Ürün & Yazılım",
    description: "ERP, CRM, SaaS ve masaüstü/mobil yazılım ürün sayfaları.",
    fields: [
      { key: "name", label: "Yazılım Adı", placeholder: "%title%", defaultValue: "%title%" },
      { key: "applicationCategory", label: "Uygulama Kategorisi", placeholder: "BusinessApplication", defaultValue: "BusinessApplication" },
      { key: "operatingSystem", label: "İşletim Sistemi", placeholder: "Windows, Web, Android, iOS", defaultValue: "Windows, Web" },
      { key: "description", label: "Kısa Açıklama", placeholder: "%tldr%", defaultValue: "%tldr%" },
    ],
  },
  {
    id: "Product",
    label: "Ürün (Product)",
    group: "Ürün & Yazılım",
    description: "Fiziksel veya dijital ürün tanıtım ve katalog sayfaları.",
    fields: [
      { key: "name", label: "Ürün Adı", placeholder: "%title%", defaultValue: "%title%" },
      { key: "brand", label: "Marka", placeholder: "%site%", defaultValue: "%site%" },
      { key: "description", label: "Ürün Özeti", placeholder: "%tldr%", defaultValue: "%tldr%" },
    ],
  },
  {
    id: "Course",
    label: "Eğitim / Kurs (Course)",
    group: "Rehber & Etkileşim",
    description: "Eğitim programları, sertifika ve akademi sayfaları.",
    fields: [
      { key: "name", label: "Eğitim Adı", placeholder: "%title%", defaultValue: "%title%" },
      { key: "description", label: "Eğitim Özeti", placeholder: "%tldr%", defaultValue: "%tldr%" },
      { key: "educationalLevel", label: "Seviye", placeholder: "Başlangıç / İleri" },
    ],
  },
  {
    id: "Event",
    label: "Etkinlik / Webinar (Event)",
    group: "Rehber & Etkileşim",
    description: "Seminer, webinar, fuar ve lansman sayfaları.",
    fields: [
      { key: "name", label: "Etkinlik Adı", placeholder: "%title%", defaultValue: "%title%" },
      { key: "startDate", label: "Başlangıç Tarihi (ISO)", placeholder: "2026-12-01T10:00:00+03:00" },
      { key: "eventAttendanceMode", label: "Katılım Biçimi", placeholder: "https://schema.org/OnlineEventAttendanceMode" },
    ],
  },
  {
    id: "FAQPage",
    label: "SSS Sayfası (FAQPage)",
    group: "Rehber & Etkileşim",
    description: "Sıkça sorulan sorular içeren rehber sayfaları.",
    fields: [
      { key: "description", label: "SSS Özeti", placeholder: "%tldr%", defaultValue: "%tldr%" },
    ],
  },
  {
    id: "QAPage",
    label: "Soru-Cevap (QAPage)",
    group: "Rehber & Etkileşim",
    description: "Tekil soru ve uzman yanıtı sayfaları.",
    fields: [
      { key: "description", label: "Yanıt Özeti", placeholder: "%tldr%", defaultValue: "%tldr%" },
    ],
  },
  {
    id: "HowTo",
    label: "Nasıl Yapılır (HowTo)",
    group: "Rehber & Etkileşim",
    description: "Adım adım kurulum ve uygulama rehberleri.",
    fields: [
      { key: "name", label: "Rehber Başlığı", placeholder: "%title%", defaultValue: "%title%" },
      { key: "description", label: "Özet", placeholder: "%tldr%", defaultValue: "%tldr%" },
    ],
  },
  {
    id: "ProfilePage",
    label: "Profil / Yazar (ProfilePage)",
    group: "Rehber & Etkileşim",
    description: "Uzman, yazar ve ekip üyesi profil sayfaları.",
    fields: [
      { key: "description", label: "Biyografi Özeti", placeholder: "%tldr%", defaultValue: "%tldr%" },
    ],
  },
];

export const SCHEMA_TYPES_SET = new Set(SCHEMA_TYPE_CATALOG.map((t) => t.id));

export const SCHEMA_DYNAMIC_TOKENS: Array<{ token: string; label: string }> = [
  { token: "%title%", label: "Sayfa Başlığı" },
  { token: "%tldr%", label: "Kısa Özet (TL;DR)" },
  { token: "%url%", label: "Sayfa URL" },
  { token: "%image%", label: "Kapak Görseli" },
  { token: "%author%", label: "Yazar Adı" },
  { token: "%site%", label: "Site Adı" },
  { token: "%siteUrl%", label: "Site Kök URL" },
  { token: "%category%", label: "İlk Kategori" },
  { token: "%keywords%", label: "Etiketler / Odak Kelime" },
  { token: "%datePublished%", label: "Yayın Tarihi" },
  { token: "%dateModified%", label: "Güncelleme Tarihi" },
];

const SCOPES = new Set<SchemaPlacementScope>([
  "all",
  "page",
  "post",
  "category",
  "tag",
  "content",
  "custom_type",
]);

const FORBIDDEN_PROP_KEYS = new Set([
  "@context",
  "@id",
  "@type",
  "@graph",
  "__proto__",
  "constructor",
  "prototype",
]);

const ENTITY_TYPES = new Set([
  "Thing",
  "Organization",
  "Product",
  "SoftwareApplication",
  "Service",
  "Place",
  "Person",
  "CreativeWork",
  "DefinedTerm",
]);

function cleanSlugList(raw: unknown, max = 30): string[] {
  if (!Array.isArray(raw)) return [];
  const seen = new Set<string>();
  const out: string[] = [];
  for (const item of raw) {
    if (typeof item !== "string") continue;
    const slug = item.trim().toLowerCase().replace(/[^a-z0-9_-]/g, "").slice(0, 80);
    if (!slug || seen.has(slug)) continue;
    seen.add(slug);
    out.push(slug);
    if (out.length >= max) break;
  }
  return out;
}

function cleanIdList(raw: unknown, max = 50): string[] {
  if (!Array.isArray(raw)) return [];
  const seen = new Set<string>();
  const out: string[] = [];
  for (const item of raw) {
    if (typeof item !== "string") continue;
    const id = item.trim().replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 80);
    if (!id || seen.has(id)) continue;
    seen.add(id);
    out.push(id);
    if (out.length >= max) break;
  }
  return out;
}

function cleanProperties(raw: unknown): Record<string, string> | undefined {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return undefined;
  const out: Record<string, string> = {};
  let count = 0;
  for (const [k, v] of Object.entries(raw as Record<string, unknown>)) {
    if (count >= 20) break;
    const key = k.trim();
    if (!/^[a-zA-Z][a-zA-Z0-9]{0,47}$/.test(key) || FORBIDDEN_PROP_KEYS.has(key)) continue;
    if (typeof v !== "string") continue;
    const val = v.trim().slice(0, 500);
    if (!val) continue;
    out[key] = val;
    count++;
  }
  return count > 0 ? out : undefined;
}

function cleanEntities(raw: unknown): SchemaEntityRef[] | undefined {
  if (!Array.isArray(raw)) return undefined;
  const out: SchemaEntityRef[] = [];
  for (const item of raw.slice(0, 15)) {
    if (!item || typeof item !== "object") continue;
    const e = item as Record<string, unknown>;
    const relation = e.relation === "mentions" ? "mentions" : "about";
    const name = typeof e.name === "string" ? e.name.trim().slice(0, 120) : "";
    if (!name) continue;
    const type = typeof e.type === "string" && ENTITY_TYPES.has(e.type) ? e.type : "Thing";
    let sameAs: string | undefined;
    if (typeof e.sameAs === "string") {
      const u = e.sameAs.trim().slice(0, 300);
      if (/^https:\/\/[^\s]+$/i.test(u)) sameAs = u;
    }
    out.push({ relation, name, type, ...(sameAs ? { sameAs } : {}) });
  }
  return out.length > 0 ? out : undefined;
}

export function sanitizeSchemaPlacements(value: unknown): SchemaPlacement[] {
  if (!Array.isArray(value)) return [];
  const out: SchemaPlacement[] = [];
  for (const item of value.slice(0, 60)) {
    if (!item || typeof item !== "object") continue;
    const row = item as Record<string, unknown>;
    const id = typeof row.id === "string" ? row.id.replace(/[^a-z0-9_-]/gi, "").slice(0, 48) : "";
    const name = typeof row.name === "string" ? row.name.trim().slice(0, 80) : "";
    const schemaType =
      typeof row.schemaType === "string" && SCHEMA_TYPES_SET.has(row.schemaType) ? row.schemaType : "";
    const scope =
      typeof row.scope === "string" && SCOPES.has(row.scope as SchemaPlacementScope)
        ? (row.scope as SchemaPlacementScope)
        : "";
    if (!id || !name || !schemaType || !scope) continue;

    const legacyCategory =
      typeof row.category === "string"
        ? row.category.trim().toLowerCase().replace(/[^a-z0-9_-]/g, "").slice(0, 80)
        : "";
    const categories = cleanSlugList(row.categories);
    if (legacyCategory && !categories.includes(legacyCategory)) categories.unshift(legacyCategory);
    const tags = cleanSlugList(row.tags);
    const contentIds = cleanIdList(row.contentIds);
    const contentTypes = cleanSlugList(row.contentTypes, 16);
    const excludeContentIds = cleanIdList(row.excludeContentIds);
    const excludeCategories = cleanSlugList(row.excludeCategories);

    if (scope === "category" && categories.length === 0) continue;
    if (scope === "tag" && tags.length === 0) continue;
    if (scope === "content" && contentIds.length === 0) continue;
    if (scope === "custom_type" && contentTypes.length === 0) continue;

    const mode: SchemaPlacementMode = row.mode === "additional" ? "additional" : "primary";
    const priority =
      typeof row.priority === "number" && Number.isFinite(row.priority)
        ? Math.max(0, Math.min(999, Math.round(row.priority)))
        : 10;
    const properties = cleanProperties(row.properties);
    const entities = cleanEntities(row.entities);

    out.push({
      id,
      name,
      schemaType,
      scope,
      category: categories[0] ?? "",
      ...(categories.length > 0 ? { categories } : {}),
      ...(tags.length > 0 ? { tags } : {}),
      ...(contentIds.length > 0 ? { contentIds } : {}),
      ...(contentTypes.length > 0 ? { contentTypes } : {}),
      ...(excludeContentIds.length > 0 ? { excludeContentIds } : {}),
      ...(excludeCategories.length > 0 ? { excludeCategories } : {}),
      mode,
      priority,
      ...(row.speakable === true ? { speakable: true } : {}),
      ...(properties ? { properties } : {}),
      ...(entities ? { entities } : {}),
      enabled: row.enabled !== false,
    });
  }
  return out;
}

export interface SchemaMatchContext {
  contentId?: string;
  type: string;
  schemaType: string;
  categories: string[];
  tags?: string[];
}

/** Tek bir kuralın verilen içeriğe uyup uymadığını (dahil et + hariç tut) kontrol eder. */
export function matchesSchemaPlacement(rule: SchemaPlacement, ctx: SchemaMatchContext): boolean {
  if (!rule.enabled) return false;
  if (ctx.contentId && rule.excludeContentIds?.includes(ctx.contentId)) return false;
  if (rule.excludeCategories?.length && ctx.categories.some((c) => rule.excludeCategories!.includes(c))) {
    return false;
  }
  switch (rule.scope) {
    case "all":
      return true;
    case "page":
      return ctx.type === "page";
    case "post":
      return ctx.type === "post";
    case "category": {
      const cats = rule.categories?.length ? rule.categories : rule.category ? [rule.category] : [];
      return cats.length > 0 && ctx.categories.some((c) => cats.includes(c));
    }
    case "tag": {
      const ruleTags = rule.tags ?? [];
      const itemTags = ctx.tags ?? [];
      return ruleTags.length > 0 && itemTags.some((t) => ruleTags.includes(t));
    }
    case "content":
      return Boolean(ctx.contentId && rule.contentIds?.includes(ctx.contentId));
    case "custom_type":
      return Boolean(rule.contentTypes?.includes(ctx.type));
  }
}

const SCOPE_SPECIFICITY: Record<SchemaPlacementScope, number> = {
  content: 100,
  category: 80,
  tag: 75,
  custom_type: 60,
  post: 40,
  page: 40,
  all: 10,
};

/**
 * Bir içerik için eşleşen `primary` (en özgül tek kural; özel şema türünü ezmez) ve
 * tüm `additional` (`@graph`'a eklenecek ikincil düğümler) kurallarını döner.
 */
export function resolveSchemaPlacements(
  rules: SchemaPlacement[] | undefined,
  ctx: SchemaMatchContext
): { primary: SchemaPlacement | null; additional: SchemaPlacement[] } {
  const list = (rules ?? [])
    .filter((r) => matchesSchemaPlacement(r, ctx))
    .sort((a, b) => {
      const specDiff = SCOPE_SPECIFICITY[b.scope] - SCOPE_SPECIFICITY[a.scope];
      if (specDiff !== 0) return specDiff;
      return (a.priority ?? 10) - (b.priority ?? 10);
    });

  const generic =
    ctx.schemaType === "WebPage" ||
    ctx.schemaType === "Article" ||
    ctx.schemaType === "BlogPosting";

  const primary = generic ? (list.find((r) => (r.mode ?? "primary") === "primary") ?? null) : null;
  const additional = list.filter((r) => r.mode === "additional");
  return { primary, additional };
}

/** Geriye dönük uyumlu tekil çözümleyici. */
export function schemaPlacementFor(
  rules: SchemaPlacement[] | undefined,
  input: SchemaMatchContext
): SchemaPlacement | null {
  return resolveSchemaPlacements(rules, input).primary;
}

export interface SchemaTemplateVars {
  title: string;
  tldr?: string;
  url: string;
  image?: string;
  author?: string;
  site: string;
  siteUrl: string;
  category?: string;
  keywords?: string;
  datePublished?: string;
  dateModified?: string;
}

/** `%title%`, `%tldr%` gibi dinamik değişkenleri gerçek sayfa verisiyle doldurur. */
export function expandSchemaVariables(template: string, vars: SchemaTemplateVars): string {
  return template
    .replace(/%title%/g, vars.title)
    .replace(/%tldr%/g, vars.tldr ?? "")
    .replace(/%url%/g, vars.url)
    .replace(/%image%/g, vars.image ?? "")
    .replace(/%author%/g, vars.author ?? vars.site)
    .replace(/%site%/g, vars.site)
    .replace(/%siteUrl%/g, vars.siteUrl)
    .replace(/%category%/g, vars.category ?? "")
    .replace(/%keywords%/g, vars.keywords ?? "")
    .replace(/%datePublished%/g, vars.datePublished ?? "")
    .replace(/%dateModified%/g, vars.dateModified ?? "")
    .trim();
}

function buildEntityNodes(entities: SchemaEntityRef[] | undefined): {
  about?: Record<string, unknown> | Array<Record<string, unknown>>;
  mentions?: Record<string, unknown> | Array<Record<string, unknown>>;
} {
  if (!entities?.length) return {};
  const about: Array<Record<string, unknown>> = [];
  const mentions: Array<Record<string, unknown>> = [];
  for (const e of entities) {
    const node: Record<string, unknown> = {
      "@type": e.type || "Thing",
      name: e.name,
      ...(e.sameAs ? { sameAs: e.sameAs } : {}),
    };
    if (e.relation === "mentions") mentions.push(node);
    else about.push(node);
  }
  return {
    ...(about.length ? { about: about.length === 1 ? about[0] : about } : {}),
    ...(mentions.length ? { mentions: mentions.length === 1 ? mentions[0] : mentions } : {}),
  };
}

/** Birincil kuralın özelliklerini, Entity Graph bağlantılarını ve `speakable` bilgisini ana düğüme hazırlar. */
export function buildPlacementExtraProps(
  rule: SchemaPlacement | null,
  vars: SchemaTemplateVars
): Record<string, unknown> {
  if (!rule) return {};
  const out: Record<string, unknown> = {};
  if (rule.properties) {
    for (const [k, rawVal] of Object.entries(rule.properties)) {
      const val = expandSchemaVariables(rawVal, vars);
      if (!val) continue;
      if (k === "brand") {
        out.brand = { "@type": "Brand", name: val };
      } else {
        out[k] = val;
      }
    }
  }
  const ent = buildEntityNodes(rule.entities);
  if (ent.about) out.about = ent.about;
  if (ent.mentions) out.mentions = ent.mentions;
  if (rule.speakable) {
    out.speakable = {
      "@type": "SpeakableSpecification",
      cssSelector: ["h1", ".nx-tldr"],
    };
  }
  return out;
}

/** `mode: "additional"` kurallarından `@graph` içine eklenecek bağlı JSON-LD düğümlerini üretir.
 * Aynı sayfada aynı `@type` için birden fazla ek kural eşleşirse yalnızca en yüksek öncelikli ilk kural basılır. */
export function buildAdditionalSchemaNodes(
  rules: SchemaPlacement[],
  vars: SchemaTemplateVars
): Array<Record<string, unknown>> {
  const siteRoot = vars.siteUrl.replace(/\/$/, "");
  const seenTypes = new Set<string>();
  const uniqueRules = rules.filter((rule) => {
    const key = rule.schemaType.trim().toLowerCase();
    if (seenTypes.has(key)) return false;
    seenTypes.add(key);
    return true;
  });
  return uniqueRules.map((rule) => {
    const extra = buildPlacementExtraProps(rule, vars);
    const node: Record<string, unknown> = {
      "@type": rule.schemaType,
      "@id": `${vars.url}#rule-${rule.id}`,
      name: vars.title,
      url: vars.url,
      mainEntityOfPage: { "@id": `${vars.url}#webpage` },
      ...(rule.schemaType === "Service" || rule.schemaType === "Course" || rule.schemaType === "ProfessionalService"
        ? { provider: { "@id": `${siteRoot}/#organization` } }
        : { publisher: { "@id": `${siteRoot}/#organization` } }),
      ...extra,
    };
    return node;
  });
}

import { hasAuthorProfile, resolveCampaignData, resolvePublishing, type AuthorProfile, type BlockNode, type SchemaGraphNode } from "@nexpress/core";
import { validateSchemaGraph } from "./schema-validate";

export type DeepAuditCategory = "schema" | "consistency" | "links_html" | "eeat_rag";
export type DeepAuditSeverity = "error" | "warning";

export interface DeepAuditFinding {
  id: string;
  severity: DeepAuditSeverity;
  category: DeepAuditCategory;
  title: string;
  detail: string;
  targetUrl?: string;
  editHref?: string;
}

export interface DeepAuditContentInput {
  id: string;
  contentId?: string;
  slug: string;
  type: string;
  title: string;
  tldr?: string | null;
  noIndex?: boolean;
  schemaType: string;
  schemaAttributes?: Record<string, unknown> | null;
  blocks: BlockNode[];
  markdownCache: string;
  authorName?: string | null;
  schemaNodes?: SchemaGraphNode[];
}

export interface DeepAuditAuthorInput {
  slug: string;
  name: string;
  profile: AuthorProfile;
}

export interface DeepAuditRagHealth {
  activeModel: string;
  activeSemantic: boolean;
  chunkModels: Array<{ model: string; count: number }>;
  indexedContents: number;
  totalPublished: number;
}

export interface DeepAuditReport {
  findings: DeepAuditFinding[];
  summary: {
    score: number;
    errors: number;
    warnings: number;
    byCategory: Record<DeepAuditCategory, { errors: number; warnings: number }>;
  };
}

const RAW_HTML_IN_PLAIN_RE = /<(?:a\s+href=|div[\s>]|span[\s>]|script[\s>]|iframe[\s>]|p[\s>])/i;
const PLAIN_TEXT_PROPS = new Set(["text", "subtitle", "summary", "description", "body", "label", "badge", "caption", "tagline"]);
const INTERNAL_LINK_PROPS = new Set(["href", "url", "ctaHref", "ctaUrl", "secondaryHref", "secondaryCtaUrl", "link"]);
const STATIC_VALID_PREFIXES = [
  "/",
  "/blog",
  "/kampanyalar",
  "/kampanya/",
  "/kategori",
  "/kategori/",
  "/etiket",
  "/etiket/",
  "/yazar",
  "/yazar/",
  "/sorular",
  "/ara",
  "/magaza",
  "/magaza/",
  "/uye",
  "/uye/",
  "/media/",
  "/api/",
  "/feed.xml",
  "/sitemap.xml",
  "/llms.txt",
];

function walkBlocks(blocks: BlockNode[], visit: (b: BlockNode) => void) {
  for (const b of blocks) {
    visit(b);
    if (Array.isArray(b.children) && b.children.length > 0) {
      walkBlocks(b.children, visit);
    }
  }
}

function scanPlainValuesForHtml(obj: unknown, hits: string[], depth = 0): void {
  if (depth > 5 || !obj) return;
  if (Array.isArray(obj)) {
    for (const item of obj) scanPlainValuesForHtml(item, hits, depth + 1);
    return;
  }
  if (typeof obj !== "object") return;
  for (const [k, v] of Object.entries(obj as Record<string, unknown>)) {
    if (k === "html" || k === "customCss" || k === "code") continue;
    if (typeof v === "string" && PLAIN_TEXT_PROPS.has(k) && RAW_HTML_IN_PLAIN_RE.test(v)) {
      hits.push(`${k}: ${v.slice(0, 60)}`);
    } else if (typeof v === "object" && v !== null) {
      scanPlainValuesForHtml(v, hits, depth + 1);
    }
  }
}

function collectInternalLinks(obj: unknown, out: Set<string>, depth = 0): void {
  if (depth > 5 || !obj) return;
  if (Array.isArray(obj)) {
    for (const item of obj) collectInternalLinks(item, out, depth + 1);
    return;
  }
  if (typeof obj !== "object") return;
  for (const [k, v] of Object.entries(obj as Record<string, unknown>)) {
    if (typeof v === "string" && INTERNAL_LINK_PROPS.has(k)) {
      const trimmed = v.trim();
      if (trimmed.startsWith("/") && !trimmed.startsWith("//") && !trimmed.startsWith("/#")) {
        const clean = trimmed.split(/[?#]/)[0]!.replace(/\/+$/, "") || "/";
        out.add(clean);
      }
    } else if (typeof v === "object" && v !== null) {
      collectInternalLinks(v, out, depth + 1);
    }
  }
}

/**
 * NexPress Derin Öz-Denetim Motoru (saf mantık):
 * Dış AI araçlarının yakaladığı şema, HTML↔Markdown tutarlılığı, ham HTML sızıntısı,
 * kırık iç bağlantı, yazar E-E-A-T ve RAG vektör modeli uyuşmazlıklarını içeriden tespit eder.
 */
export function runDeepSiteAudit(input: {
  contents: DeepAuditContentInput[];
  authors?: DeepAuditAuthorInput[];
  ragHealth?: DeepAuditRagHealth;
  extraValidPaths?: string[];
}): DeepAuditReport {
  const findings: DeepAuditFinding[] = [];
  let seq = 0;
  const push = (f: Omit<DeepAuditFinding, "id">) => findings.push({ id: `da_${++seq}`, ...f });

  const validSlugs = new Set<string>(["/"]);
  for (const c of input.contents) {
    if (c.slug === "ana-sayfa") validSlugs.add("/");
    else if (c.type === "campaign") validSlugs.add(`/kampanya/${c.slug}`);
    else validSlugs.add(`/${c.slug}`);
  }
  for (const p of input.extraValidPaths ?? []) {
    validSlugs.add(p.replace(/\/+$/, "") || "/");
  }

  const isKnownPath = (path: string): boolean => {
    if (validSlugs.has(path)) return true;
    return STATIC_VALID_PREFIXES.some((prefix) => (prefix.length > 1 && prefix.endsWith("/") ? path.startsWith(prefix) : path === prefix));
  };

  const activeAuthorsUsed = new Set<string>();

  for (const c of input.contents) {
    const publicPath = c.slug === "ana-sayfa" ? "/" : c.type === "campaign" ? `/kampanya/${c.slug}` : `/${c.slug}`;
    const editHref = c.type === "campaign" ? `/admin/campaigns/edit?id=${c.contentId ?? c.id}` : `/admin/editor/${c.contentId ?? c.id}`;
    const pub = resolvePublishing(c.schemaAttributes);
    const authorName = (pub.authorName || c.authorName || "").trim();
    if (c.type === "post" && authorName) activeAuthorsUsed.add(authorName);

    // 1. Şema & JSON-LD doğrulama
    if (Array.isArray(c.schemaNodes) && c.schemaNodes.length > 0) {
      const schemaIssues = validateSchemaGraph(c.schemaNodes);
      for (const si of schemaIssues) {
        push({
          severity: si.level,
          category: "schema",
          title: `${c.title} — ${si.type} şema ${si.level === "error" ? "hatası" : "uyarısı"}`,
          detail: si.message,
          targetUrl: publicPath,
          editHref,
        });
      }
    }

    // 2. Blok içi tarama: software_product_card, tablo, ham HTML sızıntısı, iç bağlantılar
    let hasSoftwareCard = false;
    let hasTableBlock = false;
    const htmlLeaks: string[] = [];
    const internalLinks = new Set<string>();

    walkBlocks(c.blocks ?? [], (b) => {
      if (b.type === "software_product_card") hasSoftwareCard = true;
      if (b.type === "comparison_table" || b.type === "data_table") hasTableBlock = true;
      scanPlainValuesForHtml(b.props, htmlLeaks);
      collectInternalLinks(b.props, internalLinks);
    });

    if (hasSoftwareCard && (!c.markdownCache || c.markdownCache.trim().length < 150)) {
      push({
        severity: "error",
        category: "consistency",
        title: `${c.title} — Markdown ürün içeriği eksik`,
        detail: "Sayfada software_product_card bloğu var ancak markdown_cache boş veya eksik derlenmiş.",
        targetUrl: `${publicPath}?format=md`,
        editHref,
      });
    }

    if (hasTableBlock && c.markdownCache && !c.markdownCache.includes("| ---")) {
      push({
        severity: "warning",
        category: "consistency",
        title: `${c.title} — Markdown tablo başlığı eksik`,
        detail: "Karşılaştırma/veri tablosu bloğu Markdown çıktısında başlık ayırıcısı (| --- |) olmadan derlenmiş.",
        targetUrl: `${publicPath}?format=md`,
        editHref,
      });
    }

    if (c.type === "campaign") {
      const camp = resolveCampaignData({
        id: c.id,
        contentId: c.contentId ?? c.id,
        slug: c.slug,
        title: c.title,
        status: "published",
        tldr: c.tldr ?? null,
        featuredImage: null,
        schemaAttributes: c.schemaAttributes ?? {},
      });
      if (camp.isExpired && !c.noIndex) {
        push({
          severity: "warning",
          category: "consistency",
          title: `${c.title} — Süresi dolmuş kampanya`,
          detail: "Kampanya bitiş tarihi geçmiş. Canlı sayfa otomatik noindex dönse de kampanyayı taslağa/arşive almanız önerilir.",
          targetUrl: publicPath,
          editHref,
        });
      }
    }

    if (htmlLeaks.length > 0) {
      push({
        severity: "error",
        category: "links_html",
        title: `${c.title} — Ham HTML sızıntısı (${htmlLeaks.length})`,
        detail: `Düz metin alanında kaçmış HTML kodu tespit edildi: ${htmlLeaks[0]}`,
        targetUrl: publicPath,
        editHref,
      });
    }

    const brokenLinks = [...internalLinks].filter((link) => !isKnownPath(link));
    if (brokenLinks.length > 0) {
      push({
        severity: "warning",
        category: "links_html",
        title: `${c.title} — Kırık iç bağlantı (${brokenLinks.length})`,
        detail: `Yayında olmayan hedef adresler: ${brokenLinks.slice(0, 3).join(", ")}`,
        targetUrl: publicPath,
        editHref,
      });
    }
  }

  // 3. Yazar E-E-A-T profili kontrolü
  if (input.authors) {
    const byName = new Map(input.authors.map((a) => [a.name, a]));
    for (const name of activeAuthorsUsed) {
      const a = byName.get(name);
      if (!a || !hasAuthorProfile(a.profile) || !a.profile.bio || a.profile.expertise.length === 0) {
        push({
          severity: "warning",
          category: "eeat_rag",
          title: `Yazar profili eksik: ${name}`,
          detail: "Yayında makaleleri olan yazarın biyografi, ünvan veya uzmanlık alanları eksik (E-E-A-T / ProfilePage).",
          targetUrl: a ? `/yazar/${a.slug}` : "/yazar",
          editHref: "/admin/users",
        });
      }
    }
  }

  // 4. RAG vektör modeli uyuşmazlığı ve indeks kapsamı
  if (input.ragHealth) {
    const { activeModel, activeSemantic, chunkModels, indexedContents, totalPublished } = input.ragHealth;
    const totalChunks = chunkModels.reduce((sum, m) => sum + m.count, 0);
    const activeChunks = chunkModels.find((m) => m.model === activeModel)?.count ?? 0;

    if (totalChunks > 0 && activeChunks === 0) {
      const storedModels = chunkModels.map((m) => `${m.model} (${m.count})`).join(", ");
      push({
        severity: "error",
        category: "eeat_rag",
        title: "RAG vektör modeli uyuşmazlığı — anlamsal arama 0 sonuç döndürüyor!",
        detail: `Veritabanındaki ${totalChunks} parça [${storedModels}] ile üretilmiş, ancak aktif sağlayıcı "${activeModel}". AI API anahtarını bağlayın veya arama dizinini yeniden oluşturun.`,
        editHref: "/admin/integrations",
      });
    } else if (!activeSemantic) {
      push({
        severity: "warning",
        category: "eeat_rag",
        title: "RAG yerel (sözcüksel) kipte çalışıyor",
        detail: "Anlamsal vektör araması ve yapay zekâ destekli site yanıtları için OpenAI veya Gemini API anahtarı tanımlayın.",
        editHref: "/admin/integrations",
      });
    }

    if (totalPublished >= 10 && indexedContents < Math.floor(totalPublished * 0.7)) {
      push({
        severity: "warning",
        category: "eeat_rag",
        title: `RAG dizin kapsamı düşük (${indexedContents}/${totalPublished})`,
        detail: "Yayındaki içeriklerin bir kısmı henüz parçalara (chunk) ayrılmamış; arama dizinini güncelleyin.",
        editHref: "/admin/seo",
      });
    }
  }

  const byCategory: DeepAuditReport["summary"]["byCategory"] = {
    schema: { errors: 0, warnings: 0 },
    consistency: { errors: 0, warnings: 0 },
    links_html: { errors: 0, warnings: 0 },
    eeat_rag: { errors: 0, warnings: 0 },
  };
  let errors = 0;
  let warnings = 0;
  for (const f of findings) {
    if (f.severity === "error") {
      errors += 1;
      byCategory[f.category].errors += 1;
    } else {
      warnings += 1;
      byCategory[f.category].warnings += 1;
    }
  }
  const score = Math.max(0, Math.min(100, 100 - errors * 8 - warnings * 2));

  return {
    findings,
    summary: { score, errors, warnings, byCategory },
  };
}

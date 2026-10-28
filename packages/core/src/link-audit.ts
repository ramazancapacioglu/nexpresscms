/**
 * İç bağlantı denetimi (saf mantık): içeriklerdeki bağlantıları çıkarır ve yayındaki sayfalarla karşılaştırır.
 * Dış bağlantılar ağ gerektirdiği için burada yalnızca sayılır.
 */
export interface AuditContent {
  id: string;
  title: string;
  slug: string;
  locale: string;
  /** Düz Markdown gövde (markdownCache) */
  markdown: string;
  /** Eski adresler (slugHistory): bunlara bağlantı 301 ile çalışır ama güncellenmeli */
  slugHistory?: string[];
}

export interface LinkIssue {
  fromId: string;
  fromTitle: string;
  url: string;
  kind: "broken" | "redirect";
  /** redirect ise güncel hedef */
  target?: string;
}

export interface LinkAuditResult {
  issues: LinkIssue[];
  internalChecked: number;
  externalCount: number;
}

/** Sitenin kendi ürettiği, içerik olmayan adres önekleri; kırık sayılmaz. */
const SYSTEM_PREFIXES = ["/media/", "/og", "/feed.xml", "/atom.xml", "/sitemap", "/sitemaps/", "/llms", "/ai-sitemap.json", "/robots.txt", "/api/", "/admin", "/login"];
const NON_CONTENT_SEGMENTS = new Set(["ara", "magaza"]);

export function extractLinks(markdown: string): string[] {
  const urls: string[] = [];
  const md = /!?\[[^\]]*\]\(\s*<?([^)\s>]+)>?(?:\s+"[^"]*")?\s*\)/g;
  for (const m of markdown.matchAll(md)) if (!m[0].startsWith("!")) urls.push(m[1]!);
  const html = /href\s*=\s*["']([^"']+)["']/gi;
  for (const m of markdown.matchAll(html)) urls.push(m[1]!);
  return urls;
}

export function auditLinks(contents: AuditContent[], opts: { baseUrl: string; locales: string[] }): LinkAuditResult {
  const origin = opts.baseUrl.replace(/\/$/, "");
  const live = new Map<string, string>(); // "locale/slug" → slug
  const history = new Map<string, string>(); // "locale/oldSlug" → güncel slug
  for (const c of contents) {
    live.set(`${c.locale}/${c.slug}`, c.slug);
    for (const old of c.slugHistory ?? []) history.set(`${c.locale}/${old}`, c.slug);
  }
  const issues: LinkIssue[] = [];
  let internalChecked = 0;
  let externalCount = 0;
  for (const c of contents) {
    const seen = new Set<string>();
    for (const raw of extractLinks(c.markdown)) {
      if (seen.has(raw)) continue;
      seen.add(raw);
      if (/^(mailto:|tel:|javascript:|data:|#)/i.test(raw)) continue;
      let path = raw;
      if (/^https?:\/\//i.test(raw)) {
        if (!raw.startsWith(origin)) {
          externalCount++;
          continue;
        }
        path = raw.slice(origin.length) || "/";
      } else if (raw.startsWith("//")) {
        externalCount++;
        continue;
      }
      if (!path.startsWith("/")) continue; // göreli bağlantılar belirsiz; denetlenmez
      path = path.split(/[?#]/)[0]!.replace(/\/+$/, "") || "/";
      if (SYSTEM_PREFIXES.some((p) => path === p.replace(/\/$/, "") || path.startsWith(p))) continue;
      const parts = path.split("/").filter(Boolean);
      const locale = parts[0] && opts.locales.includes(parts[0]) ? parts[0] : null;
      const slug = locale ? parts[1] ?? "" : parts[0] ?? "";
      if (parts.length > (locale ? 2 : 1)) {
        // iç içe yol: içerik slug'ı tek segmenttir
        internalChecked++;
        issues.push({ fromId: c.id, fromTitle: c.title, url: raw, kind: "broken" });
        continue;
      }
      if (NON_CONTENT_SEGMENTS.has(slug)) continue;
      internalChecked++;
      const loc = locale ?? c.locale;
      const target = slug === "" ? "ana-sayfa" : slug;
      if (live.has(`${loc}/${target}`)) continue;
      const moved = history.get(`${loc}/${target}`);
      if (moved) issues.push({ fromId: c.id, fromTitle: c.title, url: raw, kind: "redirect", target: moved });
      else issues.push({ fromId: c.id, fromTitle: c.title, url: raw, kind: "broken" });
    }
  }
  return { issues, internalChecked, externalCount };
}

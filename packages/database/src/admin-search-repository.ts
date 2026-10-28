import { and, eq, ne } from "drizzle-orm";
import { getCmsContext, rankAdminSearch, type AdminSearchCandidate, type AdminSearchHit, type DbDialect } from "@nexpress/core";
import { getDbDialect } from "./client";
import { backendFor } from "./dialect";

const SCAN_LIMIT = 3000;

/**
 * Yönetim araması (⌘K): her tablodan yalnızca başlık düzeyi sütunlar okunur (blok gövdesi, gönderim içeriği ve parola özeti asla),
 * eşleme/sıralama `core/admin-search` ile yapılır. Kişisel veri taşıyan form gönderimleri aranmaz.
 * Yönlendirmeler ve kullanıcılar yalnızca yöneticiye döner.
 */
export class AdminSearchRepository {
  constructor(
    private readonly siteId: string,
    private readonly dialect: DbDialect
  ) {}

  public async search(query: string, role: "admin" | "editor", perGroup = 5): Promise<AdminSearchHit[]> {
    const { db, t } = this.backend();
    const s = this.siteId;
    const out: AdminSearchCandidate[] = [];

    const contents = await db
      .select({ id: t.contents.id, type: t.contents.type, status: t.contents.status, locale: t.contentTranslations.locale, slug: t.contentTranslations.slug, title: t.contentTranslations.title })
      .from(t.contents)
      .innerJoin(t.contentTranslations, and(eq(t.contentTranslations.contentId, t.contents.id), eq(t.contentTranslations.siteId, s)))
      .where(and(eq(t.contents.siteId, s), ne(t.contents.status, "trashed")))
      .limit(SCAN_LIMIT);
    for (const c of contents) out.push({ group: "content", id: `${c.id}:${c.locale}`, title: c.title, haystack: [c.slug], subtitle: `${c.type} · ${c.status} · /${c.locale}/${c.slug}`, href: `/admin/contents?id=${encodeURIComponent(c.id)}&locale=${encodeURIComponent(c.locale)}` });

    const forms = await db.select({ id: t.forms.id, name: t.forms.name, status: t.forms.status }).from(t.forms).where(eq(t.forms.siteId, s)).limit(SCAN_LIMIT);
    for (const f of forms) out.push({ group: "form", id: f.id, title: f.name, haystack: [], subtitle: `Form · ${f.status}`, href: `/admin/forms/${f.id}` });

    const taxes = await db.select({ id: t.taxonomies.id, name: t.taxonomies.name, slug: t.taxonomies.slug, type: t.taxonomies.taxonomyType }).from(t.taxonomies).where(eq(t.taxonomies.siteId, s)).limit(SCAN_LIMIT);
    for (const x of taxes) out.push({ group: "taxonomy", id: x.id, title: x.name, haystack: [x.slug], subtitle: x.type === "tag" ? "Etiket" : "Kategori", href: "/admin/taxonomies" });

    const media = await db.select({ id: t.mediaAssets.id, filename: t.mediaAssets.filename, alt: t.mediaAssets.altText }).from(t.mediaAssets).where(eq(t.mediaAssets.siteId, s)).limit(SCAN_LIMIT);
    for (const m of media) out.push({ group: "media", id: m.id, title: m.filename, haystack: [m.alt], subtitle: m.alt ? `Medya · ${m.alt.slice(0, 60)}` : "Medya", href: "/admin/media" });

    if (role === "admin") {
      const reds = await db.select({ id: t.redirects.id, from: t.redirects.fromPath, to: t.redirects.toPath }).from(t.redirects).where(eq(t.redirects.siteId, s)).limit(SCAN_LIMIT);
      for (const r of reds) out.push({ group: "redirect", id: r.id, title: r.from, haystack: [r.to], subtitle: `Yönlendirme → ${r.to}`, href: "/admin/redirects" });
      const users = await db.select({ id: t.users.id, email: t.users.email, name: t.users.name, role: t.users.role }).from(t.users).where(eq(t.users.siteId, s)).limit(SCAN_LIMIT);
      for (const u of users) out.push({ group: "user", id: u.id, title: u.name || u.email, haystack: [u.email], subtitle: `Kullanıcı · ${u.role} · ${u.email}`, href: "/admin/users" });
    }
    return rankAdminSearch(out, query, perGroup);
  }

  private backend() {
    return backendFor(this.dialect);
  }
}

export function getAdminSearchRepository(siteIdOverride?: string): AdminSearchRepository {
  return new AdminSearchRepository(siteIdOverride ?? getCmsContext().siteId, getDbDialect());
}

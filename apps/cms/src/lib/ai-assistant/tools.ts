import "server-only";
import {
  auditSeo,
  authorProfileFromRow,
  countImagesMissingAlt,
  resolveLocalizedSiteIdentity,
  resolvePublishing,
  resolveSiteSettings,
  suggestInternalLinks,
} from "@nexpress/core";
import {
  getBotStatsRepository,
  getChunkRepository,
  getIntelRepository,
  getRedirectRepository,
  getScopedRepository,
  getUserRepository,
} from "@nexpress/database";
import { searchCorpus } from "@nexpress/rag";
import { buildPageSchemaGraph, extractSeoQuickWins, runDeepSiteAudit } from "@nexpress/seo-core";
import { resolveSiteEmbeddingProvider } from "@/lib/ai-config";
import { recordAudit } from "@/lib/audit";
import { authorSlug } from "@/lib/author-slug";
import { revalidatePath } from "@/lib/cache";
import { submitIndexNowUrls } from "@/lib/indexnow";
import { organizationFor } from "@/lib/organization-schema";

export interface ToolActor {
  sub: string;
  email: string;
  role: string;
}

export const AI_TOOL_DEFINITIONS = [
  {
    type: "function",
    function: {
      name: "audit_site",
      description:
        "Sitedeki tüm yayındaki içerikleri derin teknik SEO, JSON-LD şema, Markdown tutarlılığı, ham HTML sızıntısı, kırık iç bağlantı, yazar E-E-A-T ve RAG uyumu açısından canlı denetler.",
      parameters: { type: "object", properties: {}, required: [] },
    },
  },
  {
    type: "function",
    function: {
      name: "get_seo_reports",
      description:
        "GSC ve Bing arama sinyallerini, 2. sayfa hızlı kazanım / düşük TO / eksik konu fırsatlarını, AI bot tarama istatistiklerini ve en sık 404 adreslerini getirir.",
      parameters: {
        type: "object",
        properties: {
          days: { type: "number", description: "Bot raporu gün sayısı (varsayılan 14)" },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "list_contents",
      description: "Sitedeki sayfa, yazı, kampanya veya soru-cevap içeriklerini arar ve listeler.",
      parameters: {
        type: "object",
        properties: {
          query: { type: "string", description: "Başlık veya slug içinde arama (isteğe bağlı)" },
          type: { type: "string", description: "page | post | campaign | ai_prompt (isteğe bağlı)" },
          limit: { type: "number", description: "En çok kaç kayıt (varsayılan 25)" },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "read_content",
      description: "Belirli bir slug veya contentId için başlık, metaTitle, metaDescription, TL;DR, şema türü ve Markdown gövdesini okur.",
      parameters: {
        type: "object",
        properties: {
          slug: { type: "string", description: "İçeriğin slug'ı (örn. wolvox-erp)" },
        },
        required: ["slug"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "search_site_rag",
      description: "Sitenin kendi RAG/BM25 bilgi havuzunda konu veya anahtar kelime araması yapar.",
      parameters: {
        type: "object",
        properties: {
          query: { type: "string", description: "Aranacak soru veya konu" },
          limit: { type: "number", description: "Sonuç sayısı (varsayılan 6)" },
        },
        required: ["query"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "check_live_url",
      description: "Sitenin kendi alan adındaki bir yolu (örn. /wolvox-erp veya /robots.txt) canlı HTTP ile kontrol eder.",
      parameters: {
        type: "object",
        properties: {
          path: { type: "string", description: "/ ile başlayan site içi yol" },
        },
        required: ["path"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "update_content_seo",
      description: "Bir içeriğin metaTitle, metaDescription veya tldr alanını günceller. Yalnızca kullanıcı düzeltme istediğinde çağır.",
      parameters: {
        type: "object",
        properties: {
          slug: { type: "string", description: "Güncellenecek içeriğin slug'ı" },
          metaTitle: { type: "string", description: "Yeni SEO başlığı (isteğe bağlı, 35–60 karakter ideal)" },
          metaDescription: { type: "string", description: "Yeni meta açıklaması (isteğe bağlı, 110–158 karakter ideal)" },
          tldr: { type: "string", description: "Yeni Answer-First kısa özet (isteğe bağlı)" },
        },
        required: ["slug"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "apply_entity_links",
      description: "Sitedeki önerilen iç bağlantıları Bilgi Ağına (content_entity_links) ekler.",
      parameters: {
        type: "object",
        properties: {
          maxLinks: { type: "number", description: "En fazla kaç bağlantı eklensin (varsayılan 12)" },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "add_gone_rules",
      description: "Spam veya kaldırılmış eski URL kalıplarını crawlHygiene.goneRules (410 Gone) listesine ekler.",
      parameters: {
        type: "object",
        properties: {
          patterns: {
            type: "array",
            items: { type: "string" },
            description: "Örn. ['/web-stories/*', '/203/*']",
          },
        },
        required: ["patterns"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "submit_indexnow",
      description: "Güncellenen site içi yolları IndexNow'a anında bildirir.",
      parameters: {
        type: "object",
        properties: {
          paths: {
            type: "array",
            items: { type: "string" },
            description: "Örn. ['/wolvox-erp', '/yazar']",
          },
        },
        required: ["paths"],
      },
    },
  },
] as const;

export async function executeAiTool(
  siteId: string,
  actor: ToolActor,
  name: string,
  rawArgs: Record<string, unknown>
): Promise<{ ok: boolean; summary: string; data: unknown }> {
  const repo = getScopedRepository(siteId);
  const site = await repo.getSite();
  const locale = site?.defaultLocale ?? "tr";
  const baseUrl = (process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000").replace(/\/$/, "");

  if (name === "audit_site") {
    const [contents, users, ragStats] = await Promise.all([
      repo.listContents({ locale, status: "published" }),
      getUserRepository(siteId).list(),
      getChunkRepository(siteId).stats().catch(() => ({ chunks: 0, contents: 0, models: [] })),
    ]);
    const activeRag = await resolveSiteEmbeddingProvider(siteId).catch(() => ({ model: "local:hash:1536", semantic: false }));
    const basic = auditSeo(
      contents.map((c) => ({
        id: c.id,
        locale,
        slug: c.slug,
        title: c.title,
        type: c.type,
        status: c.status,
        metaTitle: c.metaTitle ?? null,
        metaDescription: c.metaDescription ?? null,
        tldr: c.tldr ?? null,
        noIndex: c.noIndex,
        seoScore: c.seoScore,
        words: (c.markdownCache ?? "").split(/\s+/).filter(Boolean).length,
        focusKeyword: resolvePublishing(c.schemaAttributes).focusKeyword ?? "",
        imagesMissingAlt: countImagesMissingAlt(c.blocks as never),
      }))
    );
    const localized = resolveLocalizedSiteIdentity(site, locale);
    const org = organizationFor(localized.seo);
    const deepInputs = await Promise.all(
      contents.map(async (c) => {
        const pageUrl = c.slug === "ana-sayfa" ? `${baseUrl}/` : c.type === "campaign" ? `${baseUrl}/kampanya/${c.slug}` : `${baseUrl}/${c.slug}`;
        const graph = await buildPageSchemaGraph({
          siteId,
          siteName: localized.name,
          siteUrl: baseUrl,
          locale,
          pageUrl,
          organization: org,
          content: {
            id: c.id,
            title: c.title,
            tldr: c.tldr,
            schemaType: c.schemaType,
            schemaAttributes: c.schemaAttributes,
            imageUrl: c.featuredImage ?? `${baseUrl}/og?title=${encodeURIComponent(c.title)}`,
            articleSection: resolvePublishing(c.schemaAttributes).categories[0] ?? (c.schemaType === "TechArticle" ? "Bilgi Bankası" : undefined),
            authorName: resolvePublishing(c.schemaAttributes).authorName || c.authorName,
            updatedAt: c.updatedAt,
            publishedAt: c.publishedAt ?? c.createdAt ?? null,
            blocks: c.blocks as never,
          },
        }).catch(() => null);
        return {
          id: c.id,
          contentId: c.contentId,
          slug: c.slug,
          type: c.type,
          title: c.title,
          tldr: c.tldr,
          noIndex: c.noIndex,
          schemaType: c.schemaType,
          schemaAttributes: c.schemaAttributes,
          blocks: c.blocks as never,
          markdownCache: c.markdownCache ?? "",
          authorName: c.authorName,
          schemaNodes: graph?.["@graph"],
        };
      })
    );
    const deep = runDeepSiteAudit({
      contents: deepInputs,
      authors: users.filter((u) => u.name.trim()).map((u) => ({ slug: authorSlug(u.name), name: u.name.trim(), profile: authorProfileFromRow(u) })),
      ragHealth: {
        activeModel: activeRag.model,
        activeSemantic: activeRag.semantic,
        chunkModels: ragStats.models.map((m) => ({ model: m.model, count: m.chunks })),
        indexedContents: ragStats.contents,
        totalPublished: contents.length,
      },
    });
    const topBasicIssues = basic.rows
      .filter((r) => r.issues.length > 0)
      .slice(0, 20)
      .map((r) => ({ slug: r.slug, title: r.title, issues: r.issues.map((i) => `${i.level}:${i.id}`) }));
    return {
      ok: true,
      summary: `${contents.length} sayfa denetlendi • Derin skor ${deep.summary.score}/100 (${deep.summary.errors} kritik, ${deep.summary.warnings} uyarı)`,
      data: {
        publishedPages: contents.length,
        basicSummary: basic.summary,
        topBasicIssues,
        deepSummary: deep.summary,
        deepFindings: deep.findings.slice(0, 35),
      },
    };
  }

  if (name === "get_seo_reports") {
    const days = Math.min(90, Math.max(1, Number(rawArgs.days) || 14));
    const [contents, signals, botSummary, notFounds] = await Promise.all([
      repo.listContents({ locale, status: "published" }),
      getIntelRepository(siteId).listSignals(300).catch(() => []),
      getBotStatsRepository(siteId).summary(days).catch(() => []),
      getRedirectRepository(siteId).listNotFound(25).catch(() => []),
    ]);
    const quickWins = extractSeoQuickWins(
      signals.map((s) => ({
        keyword: s.keyword,
        source: s.source,
        clicks: s.clicks,
        impressions: s.impressions,
        position: s.position10 ? s.position10 / 10 : null,
      })),
      contents.map((c) => c.title),
      20
    );
    return {
      ok: true,
      summary: `${signals.length} arama sinyali, ${quickWins.length} hızlı kazanım, ${botSummary.length} bot kaydı, ${notFounds.length} 404 örneği okundu`,
      data: {
        signalCount: signals.length,
        quickWins,
        botSummary: botSummary.slice(0, 15),
        topNotFounds: notFounds.slice(0, 20).map((n) => ({ path: n.path, hits: n.hits })),
      },
    };
  }

  if (name === "list_contents") {
    const q = typeof rawArgs.query === "string" ? rawArgs.query.trim().toLowerCase() : "";
    const type = typeof rawArgs.type === "string" ? rawArgs.type.trim() : "";
    const limit = Math.min(50, Math.max(1, Number(rawArgs.limit) || 25));
    const rows = await repo.listContents({ locale });
    const filtered = rows
      .filter((r) => {
        if (type && r.type !== type) return false;
        if (q && !`${r.title} ${r.slug}`.toLowerCase().includes(q)) return false;
        return true;
      })
      .slice(0, limit)
      .map((r) => ({
        id: r.contentId,
        slug: r.slug,
        type: r.type,
        status: r.status,
        title: r.title,
        metaTitle: r.metaTitle,
        metaDescriptionLen: (r.metaDescription ?? "").length,
        schemaType: r.schemaType,
        seoScore: r.seoScore,
      }));
    return { ok: true, summary: `${filtered.length} içerik listelendi`, data: { total: rows.length, items: filtered } };
  }

  if (name === "read_content") {
    const slug = String(rawArgs.slug ?? "").replace(/^\/+/, "").trim();
    const rows = await repo.listContents({ locale });
    const found = rows.find((r) => r.slug === slug || r.contentId === slug);
    if (!found) return { ok: false, summary: `"${slug}" bulunamadı`, data: { error: "İçerik bulunamadı." } };
    return {
      ok: true,
      summary: `"${found.title}" okundu`,
      data: {
        id: found.contentId,
        slug: found.slug,
        type: found.type,
        status: found.status,
        title: found.title,
        metaTitle: found.metaTitle,
        metaDescription: found.metaDescription,
        tldr: found.tldr,
        schemaType: found.schemaType,
        noIndex: found.noIndex,
        authorName: found.authorName,
        blockTypes: (found.blocks ?? []).map((b) => b.type),
        markdownPreview: (found.markdownCache ?? "").slice(0, 3500),
      },
    };
  }

  if (name === "search_site_rag") {
    const query = String(rawArgs.query ?? "").trim();
    const limit = Math.min(10, Math.max(1, Number(rawArgs.limit) || 6));
    const provider = await resolveSiteEmbeddingProvider(siteId).catch(() => null);
    if (!provider) return { ok: false, summary: "RAG sağlayıcı başlatılamadı", data: {} };
    const res = await searchCorpus(siteId, query, provider, { locale, limit });
    return {
      ok: true,
      summary: `"${query}" için ${res.contents.length} sonuç bulundu (${res.ranking}, indexed=${res.indexed})`,
      data: {
        indexed: res.indexed,
        model: res.model,
        semantic: res.semantic,
        ranking: res.ranking,
        contents: res.contents,
        passages: res.passages.slice(0, 5).map((p) => ({ slug: p.slug, heading: p.headingPath, text: p.text.slice(0, 400) })),
      },
    };
  }

  if (name === "check_live_url") {
    const rawPath = String(rawArgs.path ?? "/").trim();
    if (!rawPath.startsWith("/") || rawPath.startsWith("//")) {
      return { ok: false, summary: "Geçersiz site içi yol", data: { error: "Yol / ile başlamalıdır." } };
    }
    const targetUrl = `${baseUrl}${rawPath}`;
    try {
      const res = await fetch(targetUrl, { redirect: "manual", signal: AbortSignal.timeout(10_000) });
      const html = res.status === 200 ? await res.text() : "";
      const title = html.match(/<title[^>]*>(.*?)<\/title>/is)?.[1]?.replace(/<[^>]+>/g, "").trim() ?? "";
      const desc = html.match(/<meta[^>]+name=["']description["'][^>]+content=["'](.*?)["']/i)?.[1] ?? "";
      const canonical = html.match(/<link[^>]+rel=["']canonical["'][^>]+href=["'](.*?)["']/i)?.[1] ?? "";
      const robots = html.match(/<meta[^>]+name=["']robots["'][^>]+content=["'](.*?)["']/i)?.[1] ?? "";
      const ldMatches = [...html.matchAll(/<script[^>]+type="application\/ld\+json"[^>]*>(.*?)<\/script>/gis)];
      const schemaTypes: string[] = [];
      for (const m of ldMatches) {
        try {
          const parsed = JSON.parse(m[1]!);
          const graph = Array.isArray(parsed["@graph"]) ? parsed["@graph"] : [parsed];
          for (const n of graph) if (n["@type"]) schemaTypes.push(String(n["@type"]));
        } catch {
          /* ignore */
        }
      }
      return {
        ok: true,
        summary: `${rawPath} → HTTP ${res.status}`,
        data: {
          url: targetUrl,
          status: res.status,
          location: res.headers.get("location"),
          title,
          titleLen: title.length,
          description: desc,
          descriptionLen: desc.length,
          canonical,
          robots,
          schemaTypes,
        },
      };
    } catch (err) {
      return { ok: false, summary: `Canlı kontrol hatası: ${rawPath}`, data: { error: err instanceof Error ? err.message : String(err) } };
    }
  }

  if (name === "update_content_seo") {
    const slug = String(rawArgs.slug ?? "").replace(/^\/+/, "").trim();
    const rows = await repo.listContents({ locale });
    const found = rows.find((r) => r.slug === slug || r.contentId === slug);
    if (!found) return { ok: false, summary: `"${slug}" bulunamadı`, data: { error: "İçerik bulunamadı." } };
    const nextMetaTitle = typeof rawArgs.metaTitle === "string" && rawArgs.metaTitle.trim() ? rawArgs.metaTitle.trim().slice(0, 90) : found.metaTitle ?? undefined;
    const nextMetaDesc = typeof rawArgs.metaDescription === "string" && rawArgs.metaDescription.trim() ? rawArgs.metaDescription.trim().slice(0, 170) : found.metaDescription ?? undefined;
    const nextTldr = typeof rawArgs.tldr === "string" && rawArgs.tldr.trim() ? rawArgs.tldr.trim().slice(0, 500) : found.tldr ?? undefined;

    await repo.saveContent({
      contentId: found.contentId,
      type: found.type,
      status: found.status,
      locale,
      slug: found.slug,
      title: found.title,
      tldr: nextTldr,
      blocks: found.blocks,
      metaTitle: nextMetaTitle,
      metaDescription: nextMetaDesc,
      canonicalUrl: found.canonicalUrl ?? undefined,
      noIndex: found.noIndex,
      featuredImage: found.featuredImage ?? undefined,
      schemaType: found.schemaType,
      importanceScore: found.importanceScore,
      schemaAttributes: found.schemaAttributes,
      authorName: found.authorName,
      actor: { id: actor.sub, email: actor.email },
    });
    await recordAudit({ id: actor.sub, email: actor.email }, "ai.updateContentSeo", { target: found.slug });
    await revalidatePath("/");
    await revalidatePath(`/${found.slug}`);
    return {
      ok: true,
      summary: `"${found.slug}" SEO alanları güncellendi`,
      data: { slug: found.slug, metaTitle: nextMetaTitle, metaDescription: nextMetaDesc, tldr: nextTldr },
    };
  }

  if (name === "apply_entity_links") {
    const maxLinks = Math.min(25, Math.max(1, Number(rawArgs.maxLinks) || 12));
    const contents = await repo.listContents({ locale, status: "published" });
    const suggestions = suggestInternalLinks(
      contents.map((c) => ({
        id: c.contentId,
        slug: c.slug,
        title: c.title,
        locale,
        focusKeyword: resolvePublishing(c.schemaAttributes).focusKeyword ?? "",
        markdown: c.markdownCache ?? "",
      })),
      { maxSuggestions: maxLinks }
    );
    let created = 0;
    for (const s of suggestions) {
      const r = await repo.upsertEntityLink({
        sourceContentId: s.fromId,
        targetContentId: s.toId,
        relationType: "mentions",
        anchorText: s.matchedPhrase,
      });
      if (r.created) created += 1;
    }
    await revalidatePath("/admin/seo/audit");
    return { ok: true, summary: `${created} yeni varlık bağı Bilgi Ağına eklendi`, data: { checked: suggestions.length, created } };
  }

  if (name === "add_gone_rules") {
    if (actor.role !== "admin") {
      return { ok: false, summary: "410 kuralı eklemek için yönetici yetkisi gerekir", data: { error: "Yetki yetersiz." } };
    }
    const patterns = Array.isArray(rawArgs.patterns)
      ? rawArgs.patterns.map((p) => String(p).trim()).filter((p) => p.startsWith("/") && p.length <= 120)
      : [];
    if (patterns.length === 0) return { ok: false, summary: "Geçerli kalıp yok", data: { error: "En az bir / kalıbı gerekli." } };
    const currentSeo = resolveSiteSettings(site?.settings).seo;
    const merged = [...new Set([...(currentSeo.crawlHygiene?.goneRules ?? []), ...patterns])];
    await repo.saveSiteSettings({
      seo: {
        ...currentSeo,
        crawlHygiene: {
          goneParams: currentSeo.crawlHygiene?.goneParams ?? [],
          noindexUnknownParams: currentSeo.crawlHygiene?.noindexUnknownParams ?? false,
          goneRules: merged,
        },
      },
    });
    await recordAudit({ id: actor.sub, email: actor.email }, "ai.addGoneRules", { detail: patterns.join(", ") });
    return { ok: true, summary: `${patterns.length} adet 410 Gone kuralı eklendi`, data: { added: patterns, totalRules: merged.length } };
  }

  if (name === "submit_indexnow") {
    const paths = Array.isArray(rawArgs.paths) ? rawArgs.paths.map((p) => String(p).trim()).filter(Boolean) : [];
    const res = await submitIndexNowUrls(siteId, paths, { force: true });
    const summary = res.ok
      ? `${res.submitted} URL IndexNow'a bildirildi (HTTP ${res.status ?? 200})`
      : (res.error ?? "IndexNow bildirimi başarısız");
    return { ok: res.ok, summary, data: res };
  }

  return { ok: false, summary: `Bilinmeyen araç: ${name}`, data: { error: "Araç tanımlı değil." } };
}

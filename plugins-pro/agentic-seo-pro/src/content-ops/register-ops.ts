import { createHash } from "node:crypto";
import { lookup } from "node:dns/promises";
import { createChatClient, createRateLimiter, isPluginModuleEnabled, pluginActions, slugFromTitle } from "@nexpress/core";
import { getIntelRepository, getScopedRepository, type IntelSource } from "@nexpress/database";
import { providerFromEnv } from "@nexpress/rag";
import { isPublicIp } from "@nexpress/wp-importer";
import { PLUGIN_ID } from "../module-gate";
import { composeText } from "../ai/compose";
import { loadBrandRules } from "../ai/register";
import { clusterByVectors, clusterId, clusterKeywords, isIntelSource, proposeCatalogCopy, signalId, toCtr100, toPosition10 } from "./intel";
import { extractReadable, gateImportUrl } from "./import-url";
import { transformRawKbToArticle } from "./kb-transform";
import { querySerperIntel } from "./serper-intel";

const searchLimiter = createRateLimiter(20, 5 * 60_000);
const importLimiter = createRateLimiter(10, 10 * 60_000);

async function enabled(siteId: string, module: string) {
  return isPluginModuleEnabled(siteId, PLUGIN_ID, module);
}

function text(value: unknown, max: number): string {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

function whole(value: unknown): number {
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n) || n < 0) return 0;
  return Math.round(n);
}

async function openDraft(siteId: string, userId: string, title: string, body: string, type: "post" | "ai_prompt") {
  const repo = getScopedRepository(siteId);
  const locale = (await repo.getSite())?.defaultLocale ?? "tr";
  const article = transformRawKbToArticle(body, title);
  const saved = await repo.saveContent({
    actor: { id: userId, email: "" },
    type,
    status: "draft",
    locale,
    slug: article.slug || slugFromTitle(article.title),
    title: article.title,
    tldr: article.tldr,
    blocks: article.blocks,
  });
  return { contentId: saved.contentId, title: article.title, href: `/admin/contents?id=${encodeURIComponent(saved.contentId)}` };
}

async function readPublicHtml(raw: string, hops = 0): Promise<{ ok: true; html: string; href: string } | { ok: false; error: string }> {
  const gated = gateImportUrl(raw);
  if ("error" in gated) return { ok: false, error: gated.error };
  let ips: string[] = [];
  try {
    ips = (await lookup(gated.host, { all: true })).map((row) => row.address);
  } catch {
    return { ok: false, error: "ad çözülemedi" };
  }
  if (ips.length === 0 || ips.some((ip) => !isPublicIp(ip))) return { ok: false, error: "iç adres" };
  let response: Response;
  try {
    response = await fetch(gated.href, {
      redirect: "manual",
      signal: AbortSignal.timeout(8000),
      headers: { accept: "text/html", "user-agent": "NexPressContentOps/1.0" },
    });
  } catch {
    return { ok: false, error: "yanıt yok" };
  }
  if (response.status >= 300 && response.status < 400) {
    if (hops >= 2) return { ok: false, error: "yönlendirme zinciri" };
    const location = response.headers.get("location");
    if (!location) return { ok: false, error: "yönlendirme adresi yok" };
    try {
      return await readPublicHtml(new URL(location, gated.href).toString(), hops + 1);
    } catch {
      return { ok: false, error: "yönlendirme adresi bozuk" };
    }
  }
  if (!response.ok) return { ok: false, error: String(response.status) };
  const html = (await response.text()).slice(0, 400_000);
  return { ok: true, html, href: gated.href };
}

/** Kelime havuzu, link taslağı ve katalog yazımı. Örnek veri kaydedilmez. */
export function registerContentOpsActions(): void {
  pluginActions.register("intel.search", PLUGIN_ID, async ({ siteId, userId, input }) => {
    if (!(await enabled(siteId, "serper-intel"))) return { ok: false, error: "Rakip analizi bu sitede kapalı.", code: "disabled" };
    const keyword = text(input.keyword, 180);
    if (keyword.length < 2) return { ok: false, error: "Anahtar kelime çok kısa.", code: "invalid" };
    if (!searchLimiter.take(`${siteId}:${userId}`)) return { ok: false, error: "Çok sık sorgu.", code: "rate_limited" };
    const result = await querySerperIntel(keyword);
    if (result.live) {
      const rows = [
        { keyword, impressions: 0, detail: result.report.organic.map((row) => row.title).filter(Boolean).slice(0, 3).join(" · ") },
        ...result.report.peopleAlsoAsk.map((row) => ({ keyword: row.question, impressions: 1, detail: row.snippet })),
        ...result.report.relatedSearches.map((row) => ({ keyword: row, impressions: 0, detail: "" })),
      ].filter((row) => row.keyword.trim().length > 1);
      await getIntelRepository(siteId).saveSignals(
        rows.map((row) => ({
          id: signalId(siteId, "serper", row.keyword),
          source: "serper" as const,
          keyword: row.keyword.trim().slice(0, 180),
          clicks: 0,
          impressions: row.impressions,
          ctr100: 0,
          position10: 0,
          detail: row.detail.slice(0, 500),
        }))
      );
    }
    return { ok: true, data: { live: result.live, report: result.report } };
  });

  pluginActions.register("intel.import", PLUGIN_ID, async ({ siteId, input }) => {
    if (!(await enabled(siteId, "question-mining"))) return { ok: false, error: "Soru havuzu bu sitede kapalı.", code: "disabled" };
    if (input.live !== true) return { ok: false, error: "Örnek veri havuza yazılmaz.", code: "invalid" };
    const source = text(input.source, 16);
    if (!isIntelSource(source)) return { ok: false, error: "Kaynak tanınmadı.", code: "invalid" };
    const raw = Array.isArray(input.rows) ? input.rows.slice(0, 200) : [];
    const rows = raw.flatMap((item) => {
      if (!item || typeof item !== "object") return [];
      const row = item as Record<string, unknown>;
      const keyword = text(row.keyword, 180);
      if (keyword.length < 2) return [];
      return [{
        id: signalId(siteId, source, keyword),
        source: source as IntelSource,
        keyword,
        clicks: whole(row.clicks),
        impressions: whole(row.impressions),
        ctr100: toCtr100(Number(row.ctr) || 0),
        position10: toPosition10(Number(row.position) || 0),
        detail: text(row.detail, 300),
      }];
    });
    const saved = await getIntelRepository(siteId).saveSignals(rows);
    return { ok: true, data: { saved } };
  });

  pluginActions.register("intel.clusters", PLUGIN_ID, async ({ siteId }) => {
    if (!(await enabled(siteId, "question-mining"))) return { ok: false, error: "Soru havuzu bu sitede kapalı.", code: "disabled" };
    const repo = getIntelRepository(siteId);
    const signals = await repo.listSignals();
    const totals = new Map<string, number>();
    for (const row of signals) {
      if (row.source === "support") continue;
      const keyword = row.keyword.trim();
      if (!keyword) continue;
      totals.set(keyword, (totals.get(keyword) ?? 0) + row.impressions);
    }
    const items = [...totals.entries()].map(([keyword, impressions]) => ({ keyword, impressions }));
    let method: "cosine" | "jaccard" = "jaccard";
    let grouped = clusterKeywords(items);
    try {
      const provider = providerFromEnv();
      if (provider.semantic && items.length > 0 && items.length <= 24) {
        const vectors = await provider.embed(items.map((item) => item.keyword));
        grouped = clusterByVectors(items, vectors.map((vector) => Array.from(vector)), 0.82);
        method = "cosine";
      }
    } catch {
      grouped = clusterKeywords(items);
      method = "jaccard";
    }
    const stored = new Map((await repo.listClusters()).map((row) => [row.id, row]));
    const clusters = grouped.slice(0, 40).map((group) => {
      const id = clusterId(siteId, group.members);
      const known = stored.get(id);
      return {
        id,
        label: group.label,
        members: group.members,
        impressions: group.impressions,
        status: known?.status ?? "open",
        contentId: known?.contentId ?? "",
        href: known?.contentId ? `/admin/contents?id=${encodeURIComponent(known.contentId)}` : "",
      };
    });
    return { ok: true, data: { clusters, signals: signals.length, method } };
  });

  pluginActions.register("intel.draft", PLUGIN_ID, async ({ siteId, userId, input }) => {
    if (!(await enabled(siteId, "question-mining"))) return { ok: false, error: "Soru havuzu bu sitede kapalı.", code: "disabled" };
    const label = text(input.label, 180);
    if (label.length < 4) return { ok: false, error: "Taslak başlığı çok kısa.", code: "invalid" };
    const members = Array.isArray(input.members) ? input.members.map((item) => text(item, 180)).filter((item) => item.length > 1).slice(0, 20) : [label];
    const detail = text(input.detail, 2000);
    const body = [label, detail, ...members.filter((item) => item !== label)].filter(Boolean).join("\n\n");
    const draft = await openDraft(siteId, userId, label, body, "ai_prompt");
    const id = clusterId(siteId, members.length > 0 ? members : [label]);
    await getIntelRepository(siteId).saveCluster({ id, label, members: members.length > 0 ? members : [label], status: "draft", contentId: draft.contentId });
    return { ok: true, data: draft };
  });

  pluginActions.register("source.import", PLUGIN_ID, async ({ siteId, userId, input }) => {
    if (!(await enabled(siteId, "kb-transform"))) return { ok: false, error: "Linkten taslak bu sitede kapalı.", code: "disabled" };
    if (!importLimiter.take(`${siteId}:${userId}`)) return { ok: false, error: "Çok sık içe aktarma.", code: "rate_limited" };
    const url = text(input.url, 500);
    const read = await readPublicHtml(url);
    const intel = getIntelRepository(siteId);
    if (!read.ok) {
      await intel.addImport({ kind: "url", source: url, title: "", status: "failed", contentId: "", error: read.error });
      return { ok: false, error: read.error, code: "invalid" };
    }
    const extracted = extractReadable(read.html);
    if (extracted.text.length < 40) {
      await intel.addImport({ kind: "url", source: read.href, title: extracted.title, status: "failed", contentId: "", error: "okunur metin yok" });
      return { ok: false, error: "Sayfada düzenlenecek kadar metin yok.", code: "invalid" };
    }
    const title = extracted.title || "Dış kaynaktan taslak";
    const draft = await openDraft(siteId, userId, title, extracted.text, "post");
    const hash = createHash("sha1").update(extracted.text).digest("hex").slice(0, 20);
    await intel.addImport({ kind: "url", source: read.href, title: draft.title, status: "draft", contentId: draft.contentId, bodyHash: hash });
    return { ok: true, data: draft };
  });

  pluginActions.register("source.paste", PLUGIN_ID, async ({ siteId, userId, input }) => {
    if (!(await enabled(siteId, "kb-transform"))) return { ok: false, error: "Linkten taslak bu sitede kapalı.", code: "disabled" };
    const body = text(input.text, 8000);
    if (body.length < 20) return { ok: false, error: "Metin çok kısa.", code: "invalid" };
    const title = text(input.title, 180);
    const draft = await openDraft(siteId, userId, title || body.split("\n")[0] || "Taslak", body, "post");
    await getIntelRepository(siteId).addImport({ kind: "paste", source: "", title: draft.title, status: "draft", contentId: draft.contentId });
    return { ok: true, data: draft };
  });

  pluginActions.register("source.list", PLUGIN_ID, async ({ siteId }) => {
    if (!(await enabled(siteId, "kb-transform"))) return { ok: false, error: "Linkten taslak bu sitede kapalı.", code: "disabled" };
    const rows = await getIntelRepository(siteId).listImports();
    return {
      ok: true,
      data: {
        rows: rows.map((row) => ({
          ...row,
          href: row.contentId ? `/admin/contents?id=${encodeURIComponent(row.contentId)}` : "",
          fetchedAt: row.fetchedAt.toISOString(),
        })),
      },
    };
  });

  pluginActions.register("source.recheck", PLUGIN_ID, async ({ siteId }) => {
    if (!(await enabled(siteId, "kb-transform"))) return { ok: false, error: "Linkten taslak bu sitede kapalı.", code: "disabled" };
    const intel = getIntelRepository(siteId);
    const rows = (await intel.listImports(40)).filter((row) => row.kind === "url" && row.status !== "failed").slice(0, 8);
    let changed = 0;
    for (const row of rows) {
      const read = await readPublicHtml(row.source);
      if (!read.ok) continue;
      const extracted = extractReadable(read.html);
      if (extracted.text.length < 40) continue;
      const hash = createHash("sha1").update(extracted.text).digest("hex").slice(0, 20);
      if (row.bodyHash && hash !== row.bodyHash) {
        await intel.markImport(row.id, { status: "changed", bodyHash: hash, title: extracted.title || row.title });
        changed += 1;
      } else if (!row.bodyHash) {
        await intel.markImport(row.id, { status: row.status === "changed" ? "changed" : "draft", bodyHash: hash });
      }
    }
    return { ok: true, data: { checked: rows.length, changed } };
  });

  pluginActions.register("reviews.pull", PLUGIN_ID, async ({ siteId }) => {
    if (!(await enabled(siteId, "google-reviews"))) return { ok: false, error: "Google yorumları bu sitede kapalı.", code: "disabled" };
    const repo = getScopedRepository(siteId);
    const settings = (await repo.getSitePlugin(PLUGIN_ID))?.settings ?? {};
    const placeId = text(settings.googlePlaceId, 80);
    const apiKey = text(settings.googlePlacesApiKey, 160);
    if (!placeId || !apiKey) return { ok: false, error: "Yer kimliği ve Places anahtarı gerekli.", code: "invalid" };
    let body: { rating?: number; userRatingCount?: number; reviews?: Array<{ rating?: number; publishTime?: string; text?: { text?: string }; authorAttribution?: { displayName?: string } }> };
    try {
      const response = await fetch(`https://places.googleapis.com/v1/places/${encodeURIComponent(placeId)}`, {
        headers: { "X-Goog-Api-Key": apiKey, "X-Goog-FieldMask": "rating,userRatingCount,reviews" },
        signal: AbortSignal.timeout(8000),
      });
      if (!response.ok) return { ok: false, error: "Places yanıt vermedi.", code: "invalid" };
      body = (await response.json()) as typeof body;
    } catch {
      return { ok: false, error: "Places çağrısı tamamlanamadı.", code: "invalid" };
    }
    const reviews = (body.reviews ?? []).slice(0, 5).flatMap((row) => {
      const author = text(row.authorAttribution?.displayName, 80);
      const reviewText = text(row.text?.text, 500);
      const rating = whole(row.rating);
      if (!author || !reviewText || rating < 1) return [];
      return [{ author, rating, text: reviewText, date: text(row.publishTime, 40).slice(0, 10) }];
    });
    const settingsPatch: Record<string, unknown> = {
      reviews,
      googleReviewCount: typeof body.userRatingCount === "number" ? body.userRatingCount : reviews.length,
    };
    if (typeof body.rating === "number") settingsPatch.googleRating = body.rating;
    await repo.saveSitePlugin(PLUGIN_ID, { settings: settingsPatch });
    return { ok: true, data: { rating: body.rating ?? null, count: reviews.length } };
  });

  pluginActions.register("catalog.suggest", PLUGIN_ID, async ({ siteId, input }) => {
    if (!(await enabled(siteId, "catalog-ai"))) return { ok: false, error: "Katalog yazımı bu sitede kapalı.", code: "disabled" };
    const contentId = text(input.contentId, 80);
    const repo = getScopedRepository(siteId);
    const locale = (await repo.getSite())?.defaultLocale ?? "tr";
    const content = await repo.getContentById(contentId, locale);
    if (!content || (content.type !== "product" && content.schemaType !== "Product")) {
      return { ok: false, error: "Ürün kaydı bulunamadı.", code: "invalid" };
    }
    const rules = proposeCatalogCopy({ title: content.title, tldr: content.tldr ?? "", body: content.markdownCache ?? "" });
    const apiKey = process.env.OPENAI_API_KEY?.trim();
    if (!apiKey) return { ok: true, data: { ...rules, method: "rules", contentId } };
    try {
      const brand = await loadBrandRules(siteId);
      const client = createChatClient({ apiKey, baseUrl: process.env.OPENAI_BASE_URL, model: brand.model });
      const titleOut = await composeText(client, { mode: "rewrite", text: content.title, title: content.title, context: "", instruction: "Ürün başlığını 25-70 karakterde, anlamı koruyarak kısalt.", kind: "heading", locale }, brand.rules);
      const tldrSource = content.tldr || content.markdownCache.slice(0, 800);
      const tldrOut = await composeText(client, { mode: "shorten", text: tldrSource, title: content.title, context: "", instruction: "Ürün kısa yanıtını 80-240 karakter yap.", kind: "paragraph", locale }, brand.rules);
      return {
        ok: true,
        data: {
          title: titleOut.paragraphs[0]?.trim() || rules.title,
          tldr: tldrOut.paragraphs.join(" ").trim().slice(0, 300) || rules.tldr,
          notes: [...rules.notes, "Model önerisi kaydedilmedi."],
          method: "model",
          contentId,
        },
      };
    } catch {
      return { ok: true, data: { ...rules, method: "rules", contentId } };
    }
  });

  pluginActions.register("catalog.apply", PLUGIN_ID, async ({ siteId, userId, input }) => {
    if (!(await enabled(siteId, "catalog-ai"))) return { ok: false, error: "Katalog yazımı bu sitede kapalı.", code: "disabled" };
    const contentId = text(input.contentId, 80);
    const title = text(input.title, 180);
    const tldr = text(input.tldr, 300);
    if (title.length < 3) return { ok: false, error: "Başlık çok kısa.", code: "invalid" };
    const repo = getScopedRepository(siteId);
    const locale = (await repo.getSite())?.defaultLocale ?? "tr";
    const content = await repo.getContentById(contentId, locale);
    if (!content || (content.type !== "product" && content.schemaType !== "Product")) {
      return { ok: false, error: "Ürün kaydı bulunamadı.", code: "invalid" };
    }
    await repo.saveContent({
      actor: { id: userId, email: "" },
      contentId,
      type: content.type,
      status: content.status,
      importanceScore: content.importanceScore,
      schemaType: content.schemaType,
      schemaAttributes: content.schemaAttributes,
      featuredImage: content.featuredImage,
      locale,
      slug: content.slug,
      title,
      excerpt: content.excerpt ?? undefined,
      tldr,
      blocks: content.blocks,
      metaTitle: content.metaTitle ?? undefined,
      metaDescription: content.metaDescription ?? undefined,
      canonicalUrl: content.canonicalUrl ?? undefined,
      noIndex: content.noIndex,
    });
    return { ok: true, data: { contentId, href: `/admin/contents?id=${encodeURIComponent(contentId)}` } };
  });
}

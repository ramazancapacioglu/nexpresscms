import { createChatClient, createRateLimiter, getPluginSettings, isPluginModuleEnabled, pluginActions, resolvePublishing } from "@nexpress/core";
import { getScopedRepository } from "@nexpress/database";
import { PLUGIN_ID } from "../module-gate";
import { buildDnaSystemPrompt, buildDnaUserPrompt, dnaSamples, parseDna, pickStyleExamples, type BrandSample } from "./brand";
import { parseList, suggestSeoCopy, type BrandRules } from "./suggest";

const limiter = createRateLimiter(10, 5 * 60_000);
const dnaLimiter = createRateLimiter(3, 10 * 60_000);
const MAX_MARKDOWN = 60_000;

/** `ai-writer.suggest`: TL;DR, meta başlık/açıklama ve SSS önerisi. Yazmaz; öneriyi editör uygular. */
export function registerAiWriter(): void {
  pluginActions.register("ai-writer.suggest", PLUGIN_ID, async ({ siteId, userId, input }) => {
    if (!(await isPluginModuleEnabled(siteId, PLUGIN_ID, "ai-writer"))) return { ok: false, error: "AI yazım asistanı bu sitede kapalı.", code: "disabled" };
    const apiKey = process.env.OPENAI_API_KEY?.trim();
    if (!apiKey) return { ok: false, error: "OPENAI_API_KEY tanımlı değil. Anahtarı apps/cms/.env dosyasına ekleyip sunucuyu yeniden başlatın.", code: "unconfigured" };
    const title = typeof input.title === "string" ? input.title.trim() : "";
    const markdown = typeof input.markdown === "string" ? input.markdown.slice(0, MAX_MARKDOWN) : "";
    if (!title || markdown.trim().length < 40) return { ok: false, error: "Öneri için başlık ve en az birkaç cümlelik içerik gerekir.", code: "invalid" };
    if (!limiter.take(`${siteId}:${userId}`)) return { ok: false, error: "Çok sık istek: 5 dakikada en çok 10 öneri alınabilir.", code: "rate_limited" };

    const s = await getPluginSettings(siteId, PLUGIN_ID);
    const rules: BrandRules = {
      tone: typeof s.aiTone === "string" ? s.aiTone : undefined,
      forbiddenPhrases: parseList(typeof s.aiForbiddenPhrases === "string" ? s.aiForbiddenPhrases : ""),
      customRules: typeof s.aiCustomRules === "string" ? s.aiCustomRules : undefined,
    };
    // Marka bağlamı: ai-brand modülü açıksa Site DNA, profil alanları ve stil örnekleri eklenir
    if (await isPluginModuleEnabled(siteId, PLUGIN_ID, "ai-brand")) {
      const repo = getScopedRepository(siteId);
      const [site, samples] = await Promise.all([repo.getSite(), loadSamples(siteId)]);
      rules.siteDna = site?.siteDna ?? null;
      rules.sector = typeof s.brandSector === "string" ? s.brandSector : undefined;
      rules.audience = typeof s.brandAudience === "string" ? s.brandAudience : undefined;
      rules.positioning = typeof s.brandPositioning === "string" ? s.brandPositioning : undefined;
      rules.styleExamples = pickStyleExamples(samples);
    }
    const model = (typeof s.aiModel === "string" && s.aiModel) || process.env.AI_WRITER_MODEL || undefined;
    const client = createChatClient({ apiKey, baseUrl: process.env.OPENAI_BASE_URL, model });
    const focusKeyword = typeof input.focusKeyword === "string" ? input.focusKeyword : undefined;
    try {
      return { ok: true, data: { ...(await suggestSeoCopy(client, { title, markdown, focusKeyword }, rules)), model: client.model } };
    } catch (error) {
      return { ok: false, error: error instanceof Error ? error.message : "Öneri üretilemedi.", code: "failed" };
    }
  });
}

type Sample = BrandSample & { importanceScore: number };

/** Yayındaki, herkese açık içeriklerden marka örneklemi. */
async function loadSamples(siteId: string): Promise<Sample[]> {
  const repo = getScopedRepository(siteId);
  const contents = await repo.listContents({ locale: (await repo.getSite())?.defaultLocale ?? "tr", status: "published" });
  return contents
    .filter((c) => !c.noIndex && resolvePublishing(c.schemaAttributes).visibility === "public")
    .map((c) => ({ title: c.title, type: c.type, markdown: c.markdownCache, seoScore: c.seoScore, importanceScore: c.importanceScore, isHome: c.slug === "ana-sayfa" }));
}

/** `ai-brand.generate`: yayındaki içerikten Site DNA önerir (kaydetmez). `ai-brand.save`: DNA metnini yazar. */
export function registerAiBrand(): void {
  pluginActions.register("ai-brand.generate", PLUGIN_ID, async ({ siteId, userId }) => {
    if (!(await isPluginModuleEnabled(siteId, PLUGIN_ID, "ai-brand"))) return { ok: false, error: "Marka profili modülü kapalı.", code: "disabled" };
    const apiKey = process.env.OPENAI_API_KEY?.trim();
    if (!apiKey) return { ok: false, error: "OPENAI_API_KEY tanımlı değil. Anahtarı apps/cms/.env dosyasına ekleyip sunucuyu yeniden başlatın.", code: "unconfigured" };
    if (!dnaLimiter.take(`${siteId}:${userId}`)) return { ok: false, error: "Çok sık istek: 10 dakikada en çok 3 kez üretilebilir.", code: "rate_limited" };
    const repo = getScopedRepository(siteId);
    const [site, samples, s] = await Promise.all([repo.getSite(), loadSamples(siteId), getPluginSettings(siteId, PLUGIN_ID)]);
    const picked = dnaSamples(samples);
    if (picked.length < 2) return { ok: false, error: "Site DNA için en az 2 yayında içerik gerekir.", code: "invalid" };
    const model = (typeof s.aiModel === "string" && s.aiModel) || process.env.AI_WRITER_MODEL || undefined;
    const client = createChatClient({ apiKey, baseUrl: process.env.OPENAI_BASE_URL, model });
    const raw = await client.completeJson({ system: buildDnaSystemPrompt(), user: buildDnaUserPrompt({ siteName: site?.name ?? "Site", tagline: site?.tagline, samples: picked }), temperature: 0.3 });
    return { ok: true, data: { dna: parseDna(raw), basedOn: picked.map((p) => p.title), model: client.model } };
  });

  pluginActions.register("ai-brand.save", PLUGIN_ID, async ({ siteId, input }) => {
    if (!(await isPluginModuleEnabled(siteId, PLUGIN_ID, "ai-brand"))) return { ok: false, error: "Marka profili modülü kapalı.", code: "disabled" };
    const dna = typeof input.dna === "string" ? input.dna.trim() : "";
    if (dna.length > 2400) return { ok: false, error: "Site DNA en çok 2400 karakter olabilir.", code: "invalid" };
    await getScopedRepository(siteId).saveSiteDna(dna || null);
    return { ok: true, data: { saved: true } };
  });
}

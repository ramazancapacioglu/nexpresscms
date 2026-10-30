import { createChatClient, createRateLimiter, getPluginSettings, isPluginModuleEnabled, pluginActions, resolvePublishing, type DesignMode, type DesignSiteContext } from "@nexpress/core";
import { getFormDefinitionRepository, getScopedRepository } from "@nexpress/database";
import { generateDesign, MAX_PROMPT_CHARS } from "./generate";
import { AI_DESIGN_PLUGIN_ID } from "./manifest";

const limiter = createRateLimiter(8, 10 * 60_000);

/** Sitenin gerçek bağlamı: var olan sayfalar, medya, formlar ve marka bilgisi (modele yalnızca bunlar verilir). */
async function loadSiteContext(siteId: string): Promise<DesignSiteContext> {
  const repo = getScopedRepository(siteId);
  const site = await repo.getSite();
  const locale = site?.defaultLocale ?? "tr";
  const [contents, media, forms, settings] = await Promise.all([
    repo.listContents({ locale, status: "published" }),
    repo.listMediaAssets(),
    getFormDefinitionRepository(siteId).list(),
    getPluginSettings(siteId, "@nexpress-pro/agentic-seo"),
  ]);
  const publicContents = contents.filter((c) => !c.noIndex && resolvePublishing(c.schemaAttributes).visibility === "public");
  return {
    siteName: site?.name,
    tagline: site?.tagline ?? undefined,
    locale,
    sector: typeof settings.brandSector === "string" ? settings.brandSector : undefined,
    audience: typeof settings.brandAudience === "string" ? settings.brandAudience : undefined,
    tone: typeof settings.aiTone === "string" ? settings.aiTone : undefined,
    positioning: typeof settings.brandPositioning === "string" ? settings.brandPositioning : undefined,
    siteDna: site?.siteDna ?? undefined,
    knownPaths: [`/${locale}`, ...publicContents.map((c) => `/${locale}/${c.slug}`)],
    media: media.slice(0, 40).map((m) => ({ id: m.id, alt: m.altText })),
    forms: forms.filter((f) => f.status === "active").map((f) => ({ id: f.id, name: f.name })),
  };
}

/**
 * `ai-design.generate` eylemi: `{ mode: "section" | "page" | "theme", prompt }`. Yazmaz; sonuç doğrulanmış tasarım + rapordur.
 * Anahtar yoksa `unconfigured`; hız sınırı 10 dakikada 8 üretim.
 */
export function registerAiDesign(): void {
  pluginActions.register("ai-design.generate", AI_DESIGN_PLUGIN_ID, async ({ siteId, userId, input }) => {
    if (!(await isPluginModuleEnabled(siteId, AI_DESIGN_PLUGIN_ID, "generator"))) return { ok: false, error: "AI tasarım bu sitede kapalı.", code: "disabled" };
    const apiKey = process.env.OPENAI_API_KEY?.trim();
    if (!apiKey) return { ok: false, error: "OPENAI_API_KEY tanımlı değil. Anahtarı apps/cms/.env dosyasına ekleyip sunucuyu yeniden başlatın.", code: "unconfigured" };
    const mode = input.mode;
    const prompt = typeof input.prompt === "string" ? input.prompt.trim() : "";
    if (mode !== "section" && mode !== "page" && mode !== "theme") return { ok: false, error: "Geçersiz tasarım türü.", code: "invalid" };
    if (prompt.length < 10) return { ok: false, error: "Tarifi biraz daha ayrıntılı yazın (en az 10 karakter).", code: "invalid" };
    if (prompt.length > MAX_PROMPT_CHARS) return { ok: false, error: `Tarif en çok ${MAX_PROMPT_CHARS} karakter olabilir.`, code: "invalid" };
    if (!limiter.take(`${siteId}:${userId}`)) return { ok: false, error: "Çok sık istek: 10 dakikada en çok 8 tasarım üretilebilir.", code: "rate_limited" };
    const s = await getPluginSettings(siteId, AI_DESIGN_PLUGIN_ID);
    const model = (typeof s.designModel === "string" && s.designModel) || process.env.AI_DESIGN_MODEL || process.env.AI_WRITER_MODEL || undefined;
    const client = createChatClient({ apiKey, baseUrl: process.env.OPENAI_BASE_URL, model, timeoutMs: 90_000 });
    try {
      const site = mode === "theme" ? undefined : await loadSiteContext(siteId);
      const design = await generateDesign(client, { mode: mode as DesignMode, prompt, site, extraRules: typeof s.designRules === "string" ? s.designRules : undefined });
      return { ok: true, data: design };
    } catch (error) {
      return { ok: false, error: error instanceof Error ? error.message : "Tasarım üretilemedi.", code: "failed" };
    }
  });
}

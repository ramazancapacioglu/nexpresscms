import "server-only";
import { after } from "next/server";
import { headers } from "next/headers";
import { detectAiReferrer, detectBot, isPluginModuleEnabled, normalizeReferralPath, type BotRequestKind } from "@nexpress/core";
import { getAiReferralRepository, getBotStatsRepository } from "@nexpress/database";
import { verifyBotIp } from "./bot-verify";

function clientIp(h: Headers): string | null {
  return h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || null;
}

/**
 * Bilinen bir bot isteğini yanıttan SONRA (`after`) günlük sayaca işler.
 * İnsan trafiğinde yalnızca tek düzenli ifade çalışır; IP ve UA saklanmaz.
 * Uyarı: HTML bir CDN önbelleğinden dönüyorsa o istekler uygulamaya hiç ulaşmaz ve sayılmaz.
 */
export async function trackBotVisit(kind: BotRequestKind): Promise<void> {
  const h = await headers();
  const bot = detectBot(h.get("user-agent"));
  if (!bot) return;
  const siteId = h.get("x-nexpress-site-id") ?? "default";
  const ip = clientIp(h);

  after(async () => {
    try {
      const trust = await verifyBotIp(bot, ip);
      await getBotStatsRepository(siteId).recordHit({ botId: bot.id, kind, trust });
    } catch (error) {
      console.warn("[bot-log] kaydedilemedi:", error instanceof Error ? error.message : error);
    }
  });
}

/**
 * ChatGPT, Perplexity vb. yapay zeka ürünlerinden gelen İNSAN ziyaretini sayar (JS beacon yok:
 * `Referer` ve `utm_source` sunucuda okunur). Botlar sayılmaz. IP/UA saklanmaz; sayaçlar göstergedir,
 * `Referer` istemci tarafından taklit edilebilir. Modül kapalıysa hiçbir şey yazılmaz.
 */
export async function trackAiReferral(): Promise<void> {
  const h = await headers();
  if (detectBot(h.get("user-agent"))) return;
  const source = detectAiReferrer(h.get("referer"), h.get("x-nexpress-utm-source"));
  if (!source) return;
  const siteId = h.get("x-nexpress-site-id") ?? "default";
  const path = normalizeReferralPath(h.get("x-nexpress-path") ?? "/");

  after(async () => {
    try {
      if (!(await isPluginModuleEnabled(siteId, "@nexpress-pro/agentic-seo", "ai-referrals"))) return;
      await getAiReferralRepository(siteId).recordHit({ source: source.id, path });
    } catch (error) {
      console.warn("[ai-referral] kaydedilemedi:", error instanceof Error ? error.message : error);
    }
  });
}

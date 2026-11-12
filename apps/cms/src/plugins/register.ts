import "server-only";
import { after } from "next/server";
import { registerRagIndexing } from "@nexpress/rag";
import { registerAgenticSeoProPlugin } from "@nexpress-pro/agentic-seo";
import { registerAiDesignProPlugin } from "@nexpress-pro/ai-design";
import { registerIndexNow } from "@/lib/indexnow";
import { purgeContentCaches } from "@/lib/cdn-purge";
import { cmsHooks, pluginRegistry } from "@nexpress/core";
import { getScopedRepository } from "@nexpress/database";
import { sendMail } from "@/lib/mailer";
import { installPluginGate } from "@/lib/plugin-state";
import { SEO_BASIC_MANIFEST } from "./seo-basic";
import { CAMPAIGNS_PLUGIN_MANIFEST } from "./campaigns";
import { DESIGN_STUDIO_PLUGIN_MANIFEST } from "./design-studio";
import { WP_BRIDGE_MANIFEST } from "./wp-bridge";
import { COMMERCE_PLUGIN_MANIFEST } from "./commerce";
import { MARKETPLACE_PLUGIN_MANIFEST } from "./marketplaces";
import { PERFORNEXT_MANIFEST } from "./perfornext";

/**
 * Açık çekirdeğin tek kompozisyon kökü (çekirdek IndexNow dahil).
 * Pro paketlere import yalnızca bu dosyada bulunur.
 * Çağrı idempotenttir; eklentiler kendi kayıt bayraklarını tutar.
 */
let cdnPurgeHook = false;

/** Yayın/güncelleme sonrası CDN önbelleğini temizler (`CDN_PURGE_PROVIDER` tanımlıysa). Zamanlanmış yayını da kapsar. */
function registerCdnPurge(): void {
  if (cdnPurgeHook) return;
  cdnPurgeHook = true;
  cmsHooks.registerAction("content:afterPublish", "cms.cdnPurge", async ({ siteId, contentId, locale }) => {
    await purgeContentCaches(siteId, { contentId, locale });
  });
}

let agentMailHook = false;

/** Talep oluşunca site iletişim adresine mektup. SMTP yoksa talep yine kaydolur. */
function registerAgentRequestMail(): void {
  if (agentMailHook) return;
  agentMailHook = true;
  cmsHooks.registerAction("agent:request.created", "cms.mail", async (payload) => {
    const site = await getScopedRepository(payload.siteId).getSite();
    const to = site?.settings.general.contactEmail?.trim();
    if (!to) return;
    await sendMail(payload.siteId, {
      to: [to],
      replyTo: payload.email || undefined,
      subject: `Yeni ajan talebi (${payload.kind})`,
      text: `${payload.name} <${payload.email}>\nTalep: ${payload.requestId}`,
    });
  });
}

export function registerWorkspacePlugins(): void {
  pluginRegistry.register(SEO_BASIC_MANIFEST);
  pluginRegistry.register(CAMPAIGNS_PLUGIN_MANIFEST);
  pluginRegistry.register(DESIGN_STUDIO_PLUGIN_MANIFEST);
  pluginRegistry.register(WP_BRIDGE_MANIFEST);
  pluginRegistry.register(COMMERCE_PLUGIN_MANIFEST);
  pluginRegistry.register(MARKETPLACE_PLUGIN_MANIFEST);
  pluginRegistry.register(PERFORNEXT_MANIFEST);
  installPluginGate();
  registerIndexNow();
  registerCdnPurge();
  // Yayında içeriği dizinler; gömme çağrısı yanıttan sonra çalışır (kayıt akışını bekletmez)
  registerRagIndexing({ runAfterResponse: (task) => after(task) });
  registerAgentRequestMail();
  registerAgenticSeoProPlugin();
  registerAiDesignProPlugin();
}

registerWorkspacePlugins();

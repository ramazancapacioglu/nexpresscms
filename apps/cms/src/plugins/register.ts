import "server-only";
import { after } from "next/server";
import { registerRagIndexing } from "@nexpress/rag";
import { registerAgenticSeoProPlugin } from "@nexpress-pro/agentic-seo";
import { registerAiDesignProPlugin } from "@nexpress-pro/ai-design";
import { registerIndexNow } from "@/lib/indexnow";
import { cmsHooks, pluginRegistry } from "@nexpress/core";
import { getScopedRepository } from "@nexpress/database";
import { sendMail } from "@/lib/mailer";
import { installPluginGate } from "@/lib/plugin-state";
import { SEO_BASIC_MANIFEST } from "./seo-basic";
import { CAMPAIGNS_PLUGIN_MANIFEST } from "./campaigns";
import { DESIGN_STUDIO_PLUGIN_MANIFEST } from "./design-studio";

/**
 * Açık çekirdeğin tek kompozisyon kökü (çekirdek IndexNow dahil).
 * Pro paketlere import yalnızca bu dosyada bulunur.
 * Çağrı idempotenttir; eklentiler kendi kayıt bayraklarını tutar.
 */
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
  installPluginGate();
  registerIndexNow();
  // Yayında içeriği dizinler; gömme çağrısı yanıttan sonra çalışır (kayıt akışını bekletmez)
  registerRagIndexing({ runAfterResponse: (task) => after(task) });
  registerAgentRequestMail();
  registerAgenticSeoProPlugin();
  registerAiDesignProPlugin();
}

registerWorkspacePlugins();

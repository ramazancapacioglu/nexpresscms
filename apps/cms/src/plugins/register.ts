import "server-only";
import { after } from "next/server";
import { registerRagIndexing } from "@nexpress/rag";
import { registerAgenticSeoProPlugin } from "@nexpress-pro/agentic-seo";
import { registerIndexNow } from "@/lib/indexnow";
import { pluginRegistry } from "@nexpress/core";
import { installPluginGate } from "@/lib/plugin-state";
import { SEO_BASIC_MANIFEST } from "./seo-basic";

/**
 * Açık çekirdeğin tek kompozisyon kökü (çekirdek IndexNow dahil).
 * Pro paketlere import yalnızca bu dosyada bulunur.
 * Çağrı idempotenttir; eklentiler kendi kayıt bayraklarını tutar.
 */
export function registerWorkspacePlugins(): void {
  pluginRegistry.register(SEO_BASIC_MANIFEST);
  installPluginGate();
  registerIndexNow();
  // Yayında içeriği dizinler; gömme çağrısı yanıttan sonra çalışır (kayıt akışını bekletmez)
  registerRagIndexing({ runAfterResponse: (task) => after(task) });
  registerAgenticSeoProPlugin();
}

registerWorkspacePlugins();

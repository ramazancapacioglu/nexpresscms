import React from "react";
import { cmsHooks, getPluginSettings, isPluginModuleEnabled, pluginRegistry, slotRegistry, type HookPayloads, type SchemaGraphNode } from "@nexpress/core";
import { registerAgenticRoutes } from "./routes";
import { registerAiBrand, registerAiCompose, registerAiWriter } from "./ai/register";
import { GeoMeta } from "./schema/geo-meta";
import { AiReferralsCard } from "./ai-referrals-card";
import { FreshnessCard } from "./content-ops/freshness-card";
import { contentSignalLine } from "./geo/content-signal";
import { addSpeakable } from "./schema/speakable";
import { buildRichNodes, patchEntity, type RichModule, type RichSchema } from "./schema/rich-types";
import { buildLocalBusinessNode, type LocalBusinessSettings } from "./schema/local-seo";
import { AGENTIC_SEO_MANIFEST } from "./manifest";
import { registerContentOps } from "./content-ops";
import { ModuleGate, PLUGIN_ID } from "./module-gate";
import { getMcpLogRepository, getScopedRepository } from "@nexpress/database";
import { BotTelemetryCard } from "./bot-telemetry-card";
import { McpLogCard } from "./mcp-log-card";
import { CitationsCard } from "./citations-card";
import { GoogleReviewsCard } from "./schema/google-reviews-card";
import { enrichWithGoogleReviews, type GoogleReviewsSettings } from "./schema/google-reviews";
import { SerperCard } from "./content-ops/serper-card";
import { DecayCard } from "./content-ops/decay-card";
import { KbTransformCard } from "./content-ops/kb-transform-card";
import { CatalogAiCard } from "./commerce/catalog-ai-card";
import { SupportHubCard } from "./support/support-hub-card";
import {
  handleWebMcpJsonRpc,
  NEXPRESS_MCP_TOOLS,
  type JsonRpcRequest,
} from "./mcp-server";

let isRegistered = false;

const isHomeUrl = (url: string, locale: string) => {
  try {
    return new URL(url).pathname.replace(/\/$/, "") === `/${locale}`;
  } catch {
    return false;
  }
};

/** Bağlantılı @id varlık düğümleri (içerik ilişkileri). */
const RICH_MODULES: RichModule[] = ["faq-qa", "campaign-offer", "tech-article", "software-app"];

/** Zengin şema türleri: içerikte `schemaAttributes.richSchema` varsa ve ilgili modül açıksa düğümleri ekler. */
async function appendRichSchema(payload: HookPayloads["seo:buildSchemaGraph"], nodes: SchemaGraphNode[]): Promise<SchemaGraphNode[]> {
  const rich = payload.content?.schemaAttributes?.richSchema as RichSchema | undefined;
  if (!rich || typeof rich !== "object") return nodes;
  const flags = await Promise.all(RICH_MODULES.map((m) => isPluginModuleEnabled(payload.siteId, PLUGIN_ID, m)));
  if (!flags.some(Boolean)) return nodes;
  const enabled = Object.fromEntries(RICH_MODULES.map((m, i) => [m, flags[i]!])) as Record<RichModule, boolean>;
  const { extra, entityPatch } = buildRichNodes(rich, { url: payload.url, title: payload.content?.title ?? "", tldr: payload.content?.tldr, now: new Date(), enabled });
  // Sayfanın birincil türü zaten SoftwareApplication ise ikinci bir düğüm yerine ana varlık zenginleştirilir (yinelenen varlık yok)
  const soft = extra.find((n) => n["@type"] === "SoftwareApplication");
  const hasEntity = soft && nodes.some((n) => n["@type"] === "SoftwareApplication" && n.url === payload.url);
  if (soft && hasEntity) {
    const { "@id": _id, "@type": _t, ...fields } = soft;
    return [...patchEntity(nodes, payload.url, entityPatch).map((n) => (n["@type"] === "SoftwareApplication" && n.url === payload.url ? { ...n, ...fields, url: (fields.url as string | undefined) ?? n.url } : n)), ...extra.filter((n) => n !== soft)];
  }
  return [...patchEntity(nodes, payload.url, entityPatch), ...extra];
}

async function appendEntityGraph(payload: HookPayloads["seo:buildSchemaGraph"], nodes: SchemaGraphNode[]): Promise<SchemaGraphNode[]> {
  const repo = getScopedRepository(payload.siteId);
  const links = await repo.listEntityLinks();
  const contents = await repo.listContents({ locale: payload.locale });
  const baseUrl = (process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000").replace(/\/$/, "");
  const enriched = [...nodes];
  if (payload.contentId) {
    for (const rel of links.filter((l) => l.sourceContentId === payload.contentId)) {
      const target = contents.find((c) => c.id === rel.targetContentId);
      if (!target) continue;
      const targetUrl = `${baseUrl}/${payload.locale}/${target.slug}`;
      enriched.push({
        "@type": target.schemaType,
        "@id": `${targetUrl}#${target.schemaType.toLowerCase()}`,
        name: target.title,
        description: target.tldr ?? target.title,
        url: targetUrl,
        relationship: rel.relationType,
        ...(target.schemaAttributes ?? {}),
      });
    }
  }
  return enriched;
}

/**
 * `@nexpress-pro/agentic-seo` (v5.8.0) Eklenti Kayıt Fonksiyonu
 * Kural 4: Çekirdek koda doğrudan dokunmadan yalnızca `cmsHooks` ve `slotRegistry` üzerinden bağlanır.
 */
export function registerAgenticSeoProPlugin(): void {
  if (isRegistered) return;
  isRegistered = true;
  pluginRegistry.register(AGENTIC_SEO_MANIFEST);
  registerContentOps();

  // 1. HOOK: seo:buildSchemaGraph -> varlık grafiği, Speakable ve LocalBusiness (modül bazlı)
  cmsHooks.registerFilter(
    "seo:buildSchemaGraph",
    PLUGIN_ID,
    async (payload) => {
      let nodes = [...payload.nodes];
      if (await isPluginModuleEnabled(payload.siteId, PLUGIN_ID, "entity-graph")) nodes = await appendEntityGraph(payload, nodes);
      nodes = await appendRichSchema(payload, nodes);
      if (await isPluginModuleEnabled(payload.siteId, PLUGIN_ID, "speakable")) nodes = addSpeakable(nodes);
      if (await isPluginModuleEnabled(payload.siteId, PLUGIN_ID, "local-seo") && isHomeUrl(payload.url, payload.locale)) {
        const settings = (await getPluginSettings(payload.siteId, PLUGIN_ID)) as LocalBusinessSettings & GoogleReviewsSettings;
        const site = await getScopedRepository(payload.siteId).getSite();
        let node = buildLocalBusinessNode(settings, { siteName: site?.name ?? "NexPress", url: payload.url, id: `${payload.url}#localbusiness` });
        if (node) {
          if (await isPluginModuleEnabled(payload.siteId, PLUGIN_ID, "google-reviews")) {
            node = enrichWithGoogleReviews(node as SchemaGraphNode, settings) as never;
          }
          nodes.push(node as SchemaGraphNode);
        }
      }
      return { ...payload, nodes };
    },
    20
  );

  // 1b. HOOK: robots:buildTxt -> Content-Signal
  cmsHooks.registerFilter(
    "robots:buildTxt",
    PLUGIN_ID,
    async (payload) => {
      if (!(await isPluginModuleEnabled(payload.siteId, PLUGIN_ID, "content-signal"))) return payload;
      return { ...payload, groupLines: [...payload.groupLines, contentSignalLine(payload.botPolicy)] };
    },
    20
  );

  registerAgenticRoutes();
  registerAiWriter();
  registerAiCompose();
  registerAiBrand();

  // 2. HOOK: llms:buildTxt -> 4 Katmanlı Kurumsal /llms.txt & WebMCP Kontratı
  cmsHooks.registerFilter(
    "llms:buildTxt",
    "@nexpress-pro/agentic-seo",
    async (payload) => {
      if (!(await isPluginModuleEnabled(payload.siteId, PLUGIN_ID, "llms"))) return payload;
      const baseUrl = (
        process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"
      ).replace(/\/$/, "");
      const extraLines = [
        ...payload.lines,
        "",
        "## Agentic SEO Gateway Pro (v5.8.0) — WebMCP & Keşif Uç Noktaları",
        "",
        `- 4-Katmanlı Tam İndeks: ${baseUrl}/llms-full.txt`,
        `- Ağırlıklı AI Sitemap (JSON): ${baseUrl}/ai-sitemap.json`,
        `- WebMCP JSON-RPC 2.0 Sunucusu: ${baseUrl}/api/mcp`,
        `- WebMCP Keşif Manifestosu: ${baseUrl}/.well-known/mcp.json`,
        "",
        "### Kullanılabilir WebMCP Ajan Araçları (`POST /api/mcp`)",
        ...NEXPRESS_MCP_TOOLS.map(
          (t) =>
            `- \`${t.name}\` (${t.readOnly ? "Salt-Okunur" : "X-Agent-Key Korumalı"}): ${t.description}`
        ),
      ];

      return {
        ...payload,
        lines: extraLines,
      };
    },
    20
  );

  // 3. HOOK: mcp:handleRequest -> JSON-RPC 2.0 WebMCP Sunucusunu Bağlar
  cmsHooks.registerFilter(
    "mcp:handleRequest",
    "@nexpress-pro/agentic-seo",
    async (payload) => {
      if (!(await isPluginModuleEnabled(payload.siteId, PLUGIN_ID, "mcp"))) return payload;
      const started = Date.now();
      const rpcResponse = await handleWebMcpJsonRpc(
        payload.siteId,
        payload.requestBody as unknown as JsonRpcRequest,
        payload.agentKeyHeader
      );
      // İstek günlüğü (mcp-log): araç adı, kısaltılmış ajan, sonuç, süre. Gövde ve ajan anahtarı yazılmaz; hata yanıtı bozmaz.
      if (await isPluginModuleEnabled(payload.siteId, PLUGIN_ID, "mcp-log")) {
        const body = payload.requestBody as { method?: unknown; params?: { name?: unknown } };
        const tool = body.method === "tools/call" && typeof body.params?.name === "string" ? body.params.name : String(body.method ?? "?");
        await getMcpLogRepository(payload.siteId)
          .record({ tool, agent: payload.agent ?? "", ok: !("error" in (rpcResponse as object)), durationMs: Date.now() - started })
          .catch((e) => console.warn("[mcp-log] kaydedilemedi:", e instanceof Error ? e.message : e));
      }
      return {
        ...payload,
        response: rpcResponse as Record<string, unknown>,
      };
    },
    20
  );

  slotRegistry.register({
    id: "agentic-seo-mcp-log-card",
    pluginId: PLUGIN_ID,
    slot: "dashboard.overview.cards",
    priority: 30,
    render: ({ siteId }) => (
      <ModuleGate siteId={siteId} module="mcp-log">
        <McpLogCard siteId={siteId} />
      </ModuleGate>
    ),
  });

  // 3b. SLOTLAR: geo meta etiketleri ve tazelik kartı
  slotRegistry.register({
    id: "agentic-seo-geo-meta",
    pluginId: PLUGIN_ID,
    slot: "public.head.meta",
    priority: 10,
    render: ({ siteId }) => (
      <ModuleGate siteId={siteId} module="local-seo">
        <GeoMeta siteId={siteId} />
      </ModuleGate>
    ),
  });
  slotRegistry.register({
    id: "agentic-seo-ai-referrals",
    pluginId: PLUGIN_ID,
    slot: "dashboard.overview.cards",
    priority: 12,
    render: ({ siteId }) => (
      <ModuleGate siteId={siteId} module="ai-referrals">
        <AiReferralsCard siteId={siteId} />
      </ModuleGate>
    ),
  });
  slotRegistry.register({
    id: "agentic-seo-freshness",
    pluginId: PLUGIN_ID,
    slot: "dashboard.overview.cards",
    priority: 15,
    render: ({ siteId }) => (
      <ModuleGate siteId={siteId} module="content-freshness">
        <FreshnessCard siteId={siteId} />
      </ModuleGate>
    ),
  });

  // 4. SLOT: dashboard.overview.cards -> gerçek bot tarama günlüğü (bot_daily_stats)
  slotRegistry.register({
    id: "agentic-seo-bot-heatmap",
    pluginId: "@nexpress-pro/agentic-seo",
    slot: "dashboard.overview.cards",
    priority: 10,
    render: ({ siteId }) => (
      <ModuleGate siteId={siteId} module="bot-analytics">
        <BotTelemetryCard siteId={siteId} />
      </ModuleGate>
    ),
  });

  // Citations & AI Citation Tracker
  slotRegistry.register({
    id: "agentic-seo-citations",
    pluginId: PLUGIN_ID,
    slot: "dashboard.overview.cards",
    priority: 13,
    render: ({ siteId }) => (
      <ModuleGate siteId={siteId} module="citations">
        <CitationsCard siteId={siteId} />
      </ModuleGate>
    ),
  });

  // Google Haritalar & Yorumlar
  slotRegistry.register({
    id: "agentic-seo-google-reviews",
    pluginId: PLUGIN_ID,
    slot: "dashboard.overview.cards",
    priority: 14,
    render: ({ siteId }) => (
      <ModuleGate siteId={siteId} module="google-reviews">
        <GoogleReviewsCard siteId={siteId} />
      </ModuleGate>
    ),
  });

  // Serper SERP & PAA Soru Madenciliği
  slotRegistry.register({
    id: "agentic-seo-serper",
    pluginId: PLUGIN_ID,
    slot: "dashboard.overview.cards",
    priority: 16,
    render: ({ siteId }) => (
      <ModuleGate siteId={siteId} module="serper-intel">
        <SerperCard />
      </ModuleGate>
    ),
  });

  // İçerik Erimesi (Content Decay)
  slotRegistry.register({
    id: "agentic-seo-decay",
    pluginId: PLUGIN_ID,
    slot: "dashboard.overview.cards",
    priority: 17,
    render: ({ siteId }) => (
      <ModuleGate siteId={siteId} module="decay">
        <DecayCard siteId={siteId} />
      </ModuleGate>
    ),
  });

  // Bilgi Bankası Dönüşümü (KB Transform)
  slotRegistry.register({
    id: "agentic-seo-kb-transform",
    pluginId: PLUGIN_ID,
    slot: "dashboard.overview.cards",
    priority: 18,
    render: ({ siteId }) => (
      <ModuleGate siteId={siteId} module="kb-transform">
        <KbTransformCard />
      </ModuleGate>
    ),
  });

  // Katalog AI SEO Denetçisi
  slotRegistry.register({
    id: "agentic-seo-catalog-ai",
    pluginId: PLUGIN_ID,
    slot: "dashboard.overview.cards",
    priority: 19,
    render: ({ siteId }) => (
      <ModuleGate siteId={siteId} module="catalog-ai">
        <CatalogAiCard siteId={siteId} />
      </ModuleGate>
    ),
  });

  // Destek Merkezi & İçerik Açığı Raporu
  slotRegistry.register({
    id: "agentic-seo-support-hub",
    pluginId: PLUGIN_ID,
    slot: "dashboard.overview.cards",
    priority: 20,
    render: ({ siteId }) => (
      <ModuleGate siteId={siteId} module="support-hub">
        <SupportHubCard siteId={siteId} />
      </ModuleGate>
    ),
  });

  // 5. SLOT: admin.sidebar.nav (Attio Sidebar Record Item Style)
  slotRegistry.register({
    id: "agentic-seo-sidebar-item",
    pluginId: "@nexpress-pro/agentic-seo",
    slot: "admin.sidebar.nav",
    priority: 10,
    render: ({ siteId }) => (
      <ModuleGate siteId={siteId} module="mcp">
      <div className="space-y-0.5">
        <a
          href="/api/mcp"
          target="_blank"
          className="flex items-center justify-between rounded-md px-2 py-1.5 text-[12px] text-[#5C5F66] dark:text-[#9CA3AF] hover:bg-[#EAECED]/60 dark:hover:bg-[#1C1E24] hover:text-[#14151A] dark:hover:text-[#F3F4F6] transition"
        >
          <span className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            <span>WebMCP Gateway</span>
          </span>
          <span className="font-mono text-[10px] text-[#5F6570] dark:text-[#8C9099]">v5.8</span>
        </a>
        <a
          href="/ai-sitemap.json"
          target="_blank"
          className="flex items-center justify-between rounded-md px-2 py-1.5 text-[12px] text-[#5C5F66] dark:text-[#9CA3AF] hover:bg-[#EAECED]/60 dark:hover:bg-[#1C1E24] hover:text-[#14151A] dark:hover:text-[#F3F4F6] transition"
        >
          <span className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
            <span>Entity Graph Feed</span>
          </span>
          <span className="font-mono text-[10px] text-[#5F6570] dark:text-[#8C9099]">JSON</span>
        </a>
      </div>
      </ModuleGate>
    ),
  });
}

export * from "./bot-verifier";
export * from "./mcp-server";
export * from "./manifest";
export * from "./content-ops/guardrails";
export * from "./content-ops/question-mining";

import { isPluginModuleEnabled, pickLocale, resolvePublishing, type ContentType } from "@nexpress/core";
import { safeEqual } from "@nexpress/core/password";
import { providerFromEnv, searchCorpus } from "@nexpress/rag";
import { getAgentRequestRepository, getScopedRepository } from "@nexpress/database";
import { KIND_LABEL, validateAgentRequest, type AgentKind } from "./agent/requests";
import { createRateLimiter } from "./ai/rate-limit";
import { PLUGIN_ID } from "./module-gate";
import { buildAskResult } from "./geo/ask";

export interface McpToolDefinition {
  name: string;
  description: string;
  readOnly: boolean;
  inputSchema: Record<string, unknown>;
}

export const NEXPRESS_MCP_TOOLS: McpToolDefinition[] = [
  {
    name: "nexpress_search_corpus",
    description:
      "Sitenin yayınlanmış içeriklerinde vektör (RAG) araması yapar; eşleşen parçaları başlık yolu ve skorla döndürür. Dizin yoksa anahtar kelime aramasına düşer.",
    readOnly: true,
    inputSchema: {
      type: "object",
      properties: {
        query: { type: "string", description: "Aranacak soru veya anahtar kelime" },
        limit: { type: "number", description: "En çok kaç içerik (1-20, varsayılan 5)" },
        locale: { type: "string", description: "Etkin dillerden biri; boşsa sitenin varsayılan dili" },
        type: {
          type: "string",
          enum: ["page", "post", "kb_tech", "ai_prompt", "product", "campaign"],
        },
      },
      required: ["query"],
    },
  },
  {
    name: "nexpress_fetch_markdown",
    description:
      "Belirtilen slug adresindeki içeriğin sıfır-maliyetli saf Markdown (markdownCache) ve Schema.org özniteliklerini döndürür.",
    readOnly: true,
    inputSchema: {
      type: "object",
      properties: {
        slug: { type: "string", description: "Örn: nexpress-enterprise-cloud" },
        locale: { type: "string", description: "Etkin dillerden biri; boşsa sitenin varsayılan dili" },
      },
      required: ["slug"],
    },
  },
  {
    name: "nexpress_ask_site_dna",
    description:
      "NLWeb / Agentic protokolü üzerinden sitenin kurumsal kimliğini (Site DNA), aktif temayı ve öne çıkan @id varlık bağlantılarını döndürür.",
    readOnly: true,
    inputSchema: {
      type: "object",
      properties: {},
    },
  },
  {
    name: "nexpress_create_lead",
    description: "Teklif / bilgi talebi bırakır (X-Agent-Key gerekir). Kayıt yöneticinin Talepler kutusuna düşer.",
    readOnly: false,
    inputSchema: { type: "object", properties: { name: { type: "string" }, email: { type: "string" }, company: { type: "string" }, phone: { type: "string" }, message: { type: "string" }, productSlug: { type: "string" }, agentName: { type: "string" } }, required: ["name", "email"] },
  },
  {
    name: "nexpress_create_ticket",
    description: "Destek talebi bırakır (X-Agent-Key gerekir).",
    readOnly: false,
    inputSchema: { type: "object", properties: { name: { type: "string" }, email: { type: "string" }, phone: { type: "string" }, message: { type: "string", description: "En az 10 karakter" }, productSlug: { type: "string" }, agentName: { type: "string" } }, required: ["name", "email", "message"] },
  },
  {
    name: "nexpress_book_demo",
    description: "Demo randevusu talebi bırakır (X-Agent-Key gerekir); tercih edilen zaman message alanında.",
    readOnly: false,
    inputSchema: { type: "object", properties: { name: { type: "string" }, email: { type: "string" }, phone: { type: "string" }, message: { type: "string", description: "Tercih edilen gün/saat" }, productSlug: { type: "string" }, agentName: { type: "string" } }, required: ["name", "email"] },
  },
];

const ACTION_TOOLS: Record<string, AgentKind> = { nexpress_create_lead: "lead", nexpress_create_ticket: "ticket", nexpress_book_demo: "demo" };
/** Site başına saatte en çok 30 talep: anahtar sızsa bile kutu taşmasın. */
const requestLimiter = createRateLimiter(30, 60 * 60_000);

export interface JsonRpcRequest {
  jsonrpc: "2.0";
  id?: string | number | null;
  method: string;
  params?: Record<string, unknown>;
}

export async function handleWebMcpJsonRpc(
  siteId: string,
  rpc: JsonRpcRequest,
  agentKeyHeader?: string | null
) {
  const repo = getScopedRepository(siteId);
  // Dil: params/arguments içindeki `locale` etkin dillerden biriyse o, değilse sitenin varsayılan dili
  const site = await repo.getSite();
  const defaultLocale = site?.defaultLocale ?? "tr";
  const supported = site?.supportedLocales ?? [defaultLocale];
  const requestedLocale = (rpc.params?.locale ?? (rpc.params?.arguments as Record<string, unknown> | undefined)?.locale) as string | undefined;
  const locale = pickLocale(requestedLocale, supported, defaultLocale);

  if (rpc.method === "tools/list") {
    return {
      jsonrpc: "2.0",
      id: rpc.id ?? 1,
      result: {
        protocolVersion: "2025-03-26",
        serverInfo: {
          name: "@nexpress-pro/agentic-seo-webmcp",
          version: "5.8.0",
          siteId,
        },
        tools: (await isPluginModuleEnabled(siteId, PLUGIN_ID, "agent-actions")) ? NEXPRESS_MCP_TOOLS : NEXPRESS_MCP_TOOLS.filter((t) => !(t.name in ACTION_TOOLS)),
      },
    };
  }

  if (rpc.method === "ask") {
    if (!(await isPluginModuleEnabled(siteId, PLUGIN_ID, "nlweb-ask"))) {
      return { jsonrpc: "2.0", id: rpc.id ?? null, error: { code: -32601, message: "NLWeb ask bu sitede kapalı." } };
    }
    const query = String(rpc.params?.query ?? "").trim().slice(0, 300);
    if (!query) return { jsonrpc: "2.0", id: rpc.id ?? null, error: { code: -32602, message: "params.query gerekli." } };
    const limit = Math.min(Math.max(Number(rpc.params?.limit ?? 5) || 5, 1), 10);
    const baseUrl = (process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000").replace(/\/$/, "");
    const found = await searchCorpus(siteId, query, providerFromEnv(), { limit, locale });
    const published = await repo.listContents({ locale, status: "published" });
    return { jsonrpc: "2.0", id: rpc.id ?? 1, result: buildAskResult({ query, baseUrl, locale, hits: found.contents, contents: published, ranking: found.indexed ? found.ranking : "none" }) };
  }

  if (rpc.method === "tools/call") {
    const toolName = String(rpc.params?.name ?? "");
    const args = (rpc.params?.arguments ?? {}) as Record<string, unknown>;

    if (toolName in ACTION_TOOLS) {
      const fail = (code: number, message: string) => ({ jsonrpc: "2.0", id: rpc.id ?? 1, error: { code, message } });
      if (!(await isPluginModuleEnabled(siteId, PLUGIN_ID, "agent-actions"))) return fail(-32601, "Ajan eylemleri bu sitede kapalı.");
      const expectedKey = process.env.MCP_AGENT_KEY?.trim();
      if (!expectedKey || !agentKeyHeader || !safeEqual(agentKeyHeader, expectedKey)) {
        return fail(-32001, "Yetkisiz yazma isteği: geçerli bir X-Agent-Key gerekir (sunucuda MCP_AGENT_KEY tanımlı olmalı).");
      }
      const checked = validateAgentRequest(ACTION_TOOLS[toolName]!, args);
      if (!checked.ok) return fail(-32602, checked.error);
      if (!requestLimiter.take(siteId)) return fail(-32005, "Çok fazla talep: saatte en çok 30.");
      const id = await getAgentRequestRepository(siteId).create(checked.value);
      return { jsonrpc: "2.0", id: rpc.id ?? 1, result: { content: [{ type: "text", text: JSON.stringify({ status: "received", requestId: id, kind: KIND_LABEL[checked.value.kind] }) }] } };
    }

    if (toolName === "nexpress_search_corpus") {
      const query = String(args.query ?? "").trim();
      const type = typeof args.type === "string" ? (args.type as ContentType) : undefined;
      const limit = Math.min(Math.max(Number(args.limit ?? 5) || 5, 1), 20);
      const asText = (payload: unknown) => ({
        jsonrpc: "2.0",
        id: rpc.id ?? 1,
        result: { content: [{ type: "text", text: JSON.stringify(payload, null, 2) }] },
      });

      // 1) Vektör araması (dizin varsa): parça düzeyinde alıntılar + içerik özeti
      if (query) {
        const found = await searchCorpus(siteId, query, providerFromEnv(), { limit, locale, types: type ? [type] : undefined });
        if (found.indexed) {
          return asText({
            retrieval: found.semantic ? "semantic" : "lexical-vector",
            note: found.semantic ? undefined : "Yerel gömme: yalnızca ortak sözcüklere dayanır, eş anlamlıları yakalamaz.",
            results: found.contents.map((c) => ({
              title: c.title,
              slug: c.slug,
              type: c.type,
              score: Number(c.similarity.toFixed(4)),
              markdownUrl: `/${locale}/${c.slug}?format=md`,
              passages: found.passages
                .filter((p) => p.contentId === c.contentId)
                .map((p) => ({ heading: p.headingPath, text: p.text, score: Number(p.similarity.toFixed(4)) })),
            })),
          });
        }
      }

      // 2) Dizin yoksa: anahtar kelime araması (eski davranış)
      const q = query.toLowerCase();
      const contents = await repo.listContents({ locale, status: "published" });
      const matched = contents.filter(
        (c) =>
          !c.noIndex &&
          resolvePublishing(c.schemaAttributes).visibility === "public" &&
          (!type || c.type === type) &&
          (!q || c.title.toLowerCase().includes(q) || (c.tldr ?? "").toLowerCase().includes(q) || c.markdownCache.toLowerCase().includes(q))
      );
      return asText({
        retrieval: "keyword",
        note: "Arama dizini henüz oluşturulmadı; anahtar kelime eşleşmesi kullanıldı.",
        results: matched.slice(0, limit).map((m) => ({
          title: m.title,
          slug: m.slug,
          type: m.type,
          schemaType: m.schemaType,
          importanceScore: m.importanceScore,
          tldr: m.tldr,
          markdownUrl: `/${locale}/${m.slug}?format=md`,
        })),
      });
    }

    if (toolName === "nexpress_fetch_markdown") {
      const slug = String(args.slug ?? "ana-sayfa");
      const item = await repo.getContentBySlug(slug, locale, { publicOnly: true });
      return {
        jsonrpc: "2.0",
        id: rpc.id ?? 1,
        result: {
          content: [
            {
              type: "text",
              text: item
                ? item.markdownCache
                : `İçerik bulunamadı: ${slug}`,
            },
          ],
        },
      };
    }

    if (toolName === "nexpress_ask_site_dna") {
      const site = await repo.getSite();
      const links = await repo.listEntityLinks();
      return {
        jsonrpc: "2.0",
        id: rpc.id ?? 1,
        result: {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  siteId,
                  name: site?.name,
                  siteProfile: site?.siteProfile,
                  siteDna: site?.siteDna,
                  entityLinksCount: links.length,
                },
                null,
                2
              ),
            },
          ],
        },
      };
    }
  }

  return {
    jsonrpc: "2.0",
    id: rpc.id ?? null,
    error: {
      code: -32601,
      message: `Desteklenmeyen WebMCP metodu: ${rpc.method}. 'tools/list' veya 'tools/call' kullanın.`,
    },
  };
}

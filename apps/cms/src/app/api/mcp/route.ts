import { NextResponse, type NextRequest } from "next/server";
import {
  bm25Rank,
  cmsHooks,
  contentPath,
  createRateLimiter,
  extractProductPricingFromBlocks,
  isPublicListable,
  localeBase,
  resolveSiteSettings,
} from "@nexpress/core";
import "@/plugins/register";
import { trackBotVisit } from "@/lib/bot-log";
import { getPublicContentBySlug, getPublicSite, listPublicKeywordDocs } from "@/lib/public-data";
import { siteOriginFor } from "@/lib/site-origin";

const mcpLimiter = createRateLimiter(60, 60_000);

const CORE_TOOLS = [
  {
    name: "nexpress_search_corpus",
    description: "Sitenin yayındaki, herkese açık ve dizine açık içeriklerinde arama yapar.",
    readOnly: true,
    inputSchema: {
      type: "object",
      properties: {
        query: { type: "string", description: "Arama sorgusu (en az 2 karakter)." },
        locale: { type: "string", description: "İçerik dili (varsayılan site dili)." },
        limit: { type: "integer", minimum: 1, maximum: 20, description: "En fazla sonuç sayısı (varsayılan 8)." },
      },
      required: ["query"],
    },
  },
  {
    name: "nexpress_fetch_markdown",
    description: "Herkese açık bir sayfanın önceden derlenmiş Markdown içeriğini döndürür.",
    readOnly: true,
    inputSchema: {
      type: "object",
      properties: {
        slug: { type: "string", description: "İçeriğin slug adresi." },
        locale: { type: "string", description: "İçerik dili (varsayılan site dili)." },
      },
      required: ["slug"],
    },
  },
  {
    name: "nexpress_get_product_pricing",
    description: "Bir yazılım/ürün sayfasındaki doğrulanmış fiyat listesi, para birimi, KDV notu ve paketleri yapısal JSON olarak döndürür.",
    readOnly: true,
    inputSchema: {
      type: "object",
      properties: {
        slug: { type: "string", description: "Ürün sayfasının slug adresi." },
        locale: { type: "string", description: "İçerik dili (varsayılan site dili)." },
      },
      required: ["slug"],
    },
  },
] as const;

function clientKey(request: NextRequest, siteId: string): string {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "unknown";
  return `${siteId}|${ip}`;
}

export async function GET(request: NextRequest) {
  await trackBotVisit("mcp");
  const siteId = request.headers.get("x-nexpress-site-id") ?? "default";
  const result = await cmsHooks.runFilter("mcp:handleRequest", {
    siteId,
    requestBody: { jsonrpc: "2.0", id: 1, method: "tools/list" },
    response: {
      jsonrpc: "2.0",
      id: 1,
      result: {
        protocolVersion: "2025-03-26",
        serverInfo: {
          name: "nexpress-core-webmcp",
          version: "0.2.0",
          siteId,
        },
        tools: CORE_TOOLS,
      },
    },
  });

  return NextResponse.json(result.response, {
    status: 200,
    headers: { "X-NexPress-Site-Id": siteId },
  });
}

export async function POST(request: NextRequest) {
  await trackBotVisit("mcp");
  const siteId = request.headers.get("x-nexpress-site-id") ?? "default";
  if (!mcpLimiter.take(clientKey(request, siteId))) {
    return NextResponse.json(
      { jsonrpc: "2.0", id: null, error: { code: -32029, message: "Rate limit exceeded" } },
      { status: 429, headers: { "Retry-After": "60", "X-NexPress-Site-Id": siteId } }
    );
  }

  const agentKey = request.headers.get("x-agent-key");
  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const reqId = (body.id as string | number | null | undefined) ?? 1;

  // Varsayılan çekirdek yanıtı (Pro eklenti kancası bağlıysa onunla zenginleşir)
  let fallbackResponse: Record<string, unknown> = {
    jsonrpc: "2.0",
    id: reqId,
    result: { status: "ok", siteId },
  };

  if (body.method === "tools/list") {
    fallbackResponse = {
      jsonrpc: "2.0",
      id: reqId,
      result: {
        protocolVersion: "2025-03-26",
        serverInfo: { name: "nexpress-webmcp", version: "0.2.0", siteId },
        tools: CORE_TOOLS,
      },
    };
  } else if (body.method === "tools/call") {
    const params = (body.params ?? {}) as Record<string, unknown>;
    const toolName = String(params.name ?? "");
    const args = (params.arguments ?? params) as Record<string, unknown>;
    const site = await getPublicSite(siteId);
    const requestedLocale = typeof args.locale === "string" && site?.supportedLocales?.includes(args.locale) ? args.locale : undefined;
    const locale = requestedLocale ?? site?.defaultLocale ?? "tr";
    const origin = siteOriginFor(site);
    const lb = localeBase(site, locale);
    const types = resolveSiteSettings(site?.settings).general.contentTypes;

    const publicUrlOf = (item: { type: string; slug: string }) => {
      if (item.slug === "ana-sayfa") return `${origin}${lb || "/"}`;
      if (item.type === "campaign") return `${origin}${lb}/kampanya/${item.slug}`;
      return `${origin}${lb}${contentPath(types, item)}`;
    };

    if (toolName === "nexpress_fetch_markdown") {
      const slug = typeof args.slug === "string" ? args.slug.trim().replace(/^\/+|\/+$/g, "") : "";
      const doc = slug ? await getPublicContentBySlug(siteId, slug, locale) : null;
      if (!doc || !isPublicListable(doc) || doc.noIndex) {
        fallbackResponse = {
          jsonrpc: "2.0",
          id: reqId,
          error: { code: -32004, message: "Public content not found" },
        };
      } else {
        fallbackResponse = {
          jsonrpc: "2.0",
          id: reqId,
          result: {
            tool: toolName,
            title: doc.title,
            url: publicUrlOf(doc),
            updatedAt: doc.updatedAt,
            markdown: doc.markdownCache,
          },
        };
      }
    } else if (toolName === "nexpress_get_product_pricing") {
      const slug = typeof args.slug === "string" ? args.slug.trim().replace(/^\/+|\/+$/g, "") : "";
      const doc = slug ? await getPublicContentBySlug(siteId, slug, locale) : null;
      if (!doc || !isPublicListable(doc) || doc.noIndex) {
        fallbackResponse = {
          jsonrpc: "2.0",
          id: reqId,
          error: { code: -32004, message: "Public product content not found" },
        };
      } else {
        const products = extractProductPricingFromBlocks(doc.blocks);
        fallbackResponse = {
          jsonrpc: "2.0",
          id: reqId,
          result: {
            tool: toolName,
            title: doc.title,
            url: publicUrlOf(doc),
            updatedAt: doc.updatedAt,
            products,
          },
        };
      }
    } else {
      // nexpress_search_corpus veya bilinmeyen araç: yalnızca herkese açık + dizine açık (`!noIndex`) belge havuzu
      const query = typeof args.query === "string" ? args.query.trim().slice(0, 120) : "";
      const limit = Math.min(20, Math.max(1, Number(args.limit) || 8));
      const docs = await listPublicKeywordDocs(siteId, locale);
      const byId = new Map(docs.map((d) => [d.contentId, d]));
      const picked = query.length >= 2
        ? bm25Rank(
            docs.map((d) => ({ id: d.contentId, title: d.title, body: d.markdownCache })),
            query,
            limit
          )
            .map((h) => byId.get(h.id))
            .filter((x): x is NonNullable<typeof x> => Boolean(x))
        : docs.slice(0, limit);

      fallbackResponse = {
        jsonrpc: "2.0",
        id: reqId,
        result: {
          tool: toolName || "nexpress_search_corpus",
          itemsCount: picked.length,
          items: picked.map((c) => ({
            title: c.title,
            slug: c.slug,
            url: publicUrlOf(c),
            tldr: c.tldr,
          })),
        },
      };
    }
  }

  const filtered = await cmsHooks.runFilter("mcp:handleRequest", {
    siteId,
    requestBody: body,
    agentKeyHeader: agentKey,
    agent: request.headers.get("user-agent"),
    response: fallbackResponse,
  });

  return NextResponse.json(filtered.response, {
    status: 200,
    headers: { "X-NexPress-Site-Id": siteId, "Cache-Control": "private, no-store" },
  });
}

import { NextResponse, type NextRequest } from "next/server";
import { cmsHooks } from "@nexpress/core";
import { getScopedRepository } from "@nexpress/database";
import "@/plugins/register";
import { trackBotVisit } from "@/lib/bot-log";

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
          version: "0.1.0",
          siteId,
        },
        tools: [
          {
            name: "nexpress_search_corpus",
            description: "Sitenin yayınlanmış içeriklerinde arama yapar.",
            readOnly: true,
          },
          {
            name: "nexpress_fetch_markdown",
            description: "Sayfanın markdownCache çıktısını döndürür.",
            readOnly: true,
          },
        ],
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
  const agentKey = request.headers.get("x-agent-key");
  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;

  // Varsayılan çekirdek yanıtı (Pro eklenti kancası bağlıysa onunla zenginleşir)
  const repo = getScopedRepository(siteId);
  let fallbackResponse: Record<string, unknown> = {
    jsonrpc: "2.0",
    id: body.id ?? 1,
    result: { status: "ok", siteId },
  };

  if (body.method === "tools/list") {
    fallbackResponse = {
      jsonrpc: "2.0",
      id: body.id ?? 1,
      result: {
        protocolVersion: "2025-03-26",
        serverInfo: { name: "nexpress-webmcp", siteId },
        tools: [
          {
            name: "nexpress_search_corpus",
            description: "Polimorfik içerik ve bilgi bankası araması yapar.",
            readOnly: true,
          },
          {
            name: "nexpress_fetch_markdown",
            description: "Sıfır-maliyetli markdownCache döndürür.",
            readOnly: true,
          },
        ],
      },
    };
  } else if (body.method === "tools/call") {
    const params = (body.params ?? {}) as Record<string, unknown>;
    const contents = await repo.listContents({ locale: (await repo.getSite())?.defaultLocale ?? "tr", status: "published" });
    fallbackResponse = {
      jsonrpc: "2.0",
      id: body.id ?? 1,
      result: {
        tool: params.name,
        itemsCount: contents.length,
        items: contents.map((c) => ({
          title: c.title,
          slug: c.slug,
          tldr: c.tldr,
        })),
      },
    };
  }

  const filtered = await cmsHooks.runFilter("mcp:handleRequest", {
    siteId,
    requestBody: body,
    agentKeyHeader: agentKey,
    response: fallbackResponse,
  });

  return NextResponse.json(filtered.response, {
    status: 200,
    headers: { "X-NexPress-Site-Id": siteId },
  });
}

/** `.well-known` keşif dosyaları (saf mantık): NLWeb, ai-plugin ve OpenAPI bildirimi. */
export interface DiscoveryInput {
  siteName: string;
  description: string;
  baseUrl: string;
}

const trim = (u: string) => u.replace(/\/$/, "");

export function buildNlwebManifest(i: DiscoveryInput) {
  const base = trim(i.baseUrl);
  return {
    schema_version: "0.1",
    name: i.siteName,
    description: i.description,
    ask: { method: "POST", url: `${base}/api/mcp`, rpc_method: "ask", note: "JSON-RPC 2.0: {\"method\":\"ask\",\"params\":{\"query\":\"…\"}}" },
    result_format: "schema.org",
    discovery: { llms_txt: `${base}/llms.txt`, ai_feed: `${base}/ai-feed.json`, mcp: `${base}/.well-known/mcp.json` },
  };
}

export function buildAiPluginManifest(i: DiscoveryInput) {
  const base = trim(i.baseUrl);
  return {
    schema_version: "v1",
    name_for_human: i.siteName,
    name_for_model: i.siteName.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "") || "site",
    description_for_human: i.description,
    description_for_model: `${i.siteName} içeriğini aramak ve Markdown olarak okumak için salt-okunur araçlar. ${i.description}`,
    auth: { type: "none" },
    api: { type: "openapi", url: `${base}/.well-known/openapi.yaml` },
    contact_email: "",
    legal_info_url: `${base}/tr`,
  };
}

/** Yalnızca gerçekten var olan, anahtarsız uç noktaları bildirir. */
export function buildOpenApiYaml(i: DiscoveryInput): string {
  const base = trim(i.baseUrl);
  const q = (s: string) => JSON.stringify(s);
  return `openapi: 3.0.3
info:
  title: ${q(`${i.siteName} — Açık API`)}
  version: "1.0.0"
  description: ${q(i.description)}
servers:
  - url: ${q(base)}
paths:
  /api/mcp:
    post:
      operationId: mcpRpc
      summary: JSON-RPC 2.0 araç çağrısı (içerik ara, içerik getir, soru sor)
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required: [jsonrpc, method]
              properties:
                jsonrpc: { type: string, enum: ["2.0"] }
                id: { type: integer }
                method: { type: string, enum: [tools/list, tools/call, ask] }
                params: { type: object }
      responses:
        "200": { description: JSON-RPC yanıtı }
  /ai-feed.json:
    get:
      operationId: aiFeed
      summary: Önem sıralı içerik beslemesi
      responses:
        "200": { description: JSON besleme }
  /llms.txt:
    get:
      operationId: llmsTxt
      summary: Yapay zeka için site haritası
      responses:
        "200": { description: Düz metin }
`;
}

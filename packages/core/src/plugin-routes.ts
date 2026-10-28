/**
 * Eklenti rotaları: çekirdek sabit bir uç nokta (ör. `/ai-feed.json`) bildirir, eklenti işleyiciyi bağlar.
 * İşleyici yoksa uç nokta 404 döner; böylece çekirdek eklentiyi tanımaz (AGENTS.md kural 4).
 */
export interface PluginRouteContext {
  siteId: string;
  request: Request;
}

export type PluginRouteHandler = (ctx: PluginRouteContext) => Promise<Response | null> | Response | null;

class PluginRouteRegistry {
  private handlers = new Map<string, { pluginId: string; handler: PluginRouteHandler }>();

  public register(key: string, pluginId: string, handler: PluginRouteHandler): void {
    this.handlers.set(key, { pluginId, handler });
  }

  public keys(): string[] {
    return [...this.handlers.keys()];
  }

  /** İşleyici yok veya `null` döndürdüyse (modül kapalı) 404. */
  public async dispatch(key: string, ctx: PluginRouteContext): Promise<Response> {
    const entry = this.handlers.get(key);
    const res = entry ? await entry.handler(ctx) : null;
    return res ?? new Response("Bulunamadı.\n", { status: 404, headers: { "Content-Type": "text/plain; charset=utf-8" } });
  }
}

const g = globalThis as unknown as { __nexpressPluginRoutes?: PluginRouteRegistry };
export const pluginRoutes = (g.__nexpressPluginRoutes ??= new PluginRouteRegistry());

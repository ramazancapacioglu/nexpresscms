import type { BlockNode, DesignTokens, SchemaGraphNode } from "./types";

/**
 * NexPress Open-Core Yaşam Döngüsü Kanca (Hook & Filter) Haritası
 * Çekirdek kod içerisinde ASLA `if (isPro)` bulunmaz; Pro eklentiler bu kancalara dışarıdan bağlanır.
 */
export interface HookPayloads {
  "content:beforeSave": {
    siteId: string;
    contentId: string;
    locale: string;
    title: string;
    tldr?: string | null;
    blocks: BlockNode[];
    markdownCache: string;
    seoScore?: number;
  };
  "content:afterPublish": {
    siteId: string;
    contentId: string;
    locale: string;
    slug: string;
    url: string;
  };
  "seo:buildSchemaGraph": {
    siteId: string;
    locale: string;
    url: string;
    contentId?: string;
    nodes: SchemaGraphNode[];
  };
  "theme:resolveTokens": {
    siteId: string;
    themeId: string;
    tokens: DesignTokens;
  };
  "llms:buildTxt": {
    siteId: string;
    locale: string;
    mode: "basic" | "full";
    lines: string[];
  };
  "robots:buildTxt": {
    siteId: string;
    /** `User-agent: *` grubuna eklenecek satırlar */
    groupLines: string[];
    botPolicy: Record<string, "allow" | "block">;
  };
  "mcp:handleRequest": {
    siteId: string;
    requestBody: Record<string, unknown>;
    agentKeyHeader?: string | null;
    response: Record<string, unknown>;
  };
}

export type HookName = keyof HookPayloads;
export type FilterCallback<K extends HookName> = (
  payload: HookPayloads[K]
) => Promise<HookPayloads[K]> | HookPayloads[K];

export type ActionCallback<K extends HookName> = (
  payload: HookPayloads[K]
) => Promise<void> | void;

interface RegisteredHandler<T> {
  pluginId: string;
  priority: number;
  callback: T;
}

class NexPressHookBus {
  private filters = new Map<HookName, Array<RegisteredHandler<FilterCallback<any>>>>();
  private actions = new Map<HookName, Array<RegisteredHandler<ActionCallback<any>>>>();

  /**
   * Veri dönüştürücü filtre kaydeder (Örn: seo:buildSchemaGraph, content:beforeSave)
   */
  public registerFilter<K extends HookName>(
    hook: K,
    pluginId: string,
    callback: FilterCallback<K>,
    priority = 10
  ): void {
    const list = this.filters.get(hook) ?? [];
    const filtered = list.filter((item) => item.pluginId !== pluginId);
    filtered.push({ pluginId, priority, callback });
    filtered.sort((a, b) => a.priority - b.priority);
    this.filters.set(hook, filtered);
  }

  /**
   * Yan etki (Side-effect) aksiyonu kaydeder (Örn: content:afterPublish -> IndexNow Ping)
   */
  public registerAction<K extends HookName>(
    hook: K,
    pluginId: string,
    callback: ActionCallback<K>,
    priority = 10
  ): void {
    const list = this.actions.get(hook) ?? [];
    const filtered = list.filter((item) => item.pluginId !== pluginId);
    filtered.push({ pluginId, priority, callback });
    filtered.sort((a, b) => a.priority - b.priority);
    this.actions.set(hook, filtered);
  }

  /**
   * Kayıtlı tüm filtreleri sırasıyla çalıştırır ve dönüştürülmüş veriyi döndürür
   */
  public async runFilter<K extends HookName>(
    hook: K,
    initialPayload: HookPayloads[K]
  ): Promise<HookPayloads[K]> {
    const handlers = this.filters.get(hook) ?? [];
    let current = initialPayload;
    for (const handler of handlers) {
      current = await handler.callback(current);
    }
    return current;
  }

  /**
   * Kayıtlı tüm aksiyonları çalıştırır
   */
  public async runAction<K extends HookName>(
    hook: K,
    payload: HookPayloads[K]
  ): Promise<void> {
    const handlers = this.actions.get(hook) ?? [];
    for (const handler of handlers) {
      await handler.callback(payload);
    }
  }

  /**
   * Kayıtlı eklenti kancalarını listeler (Admin Sistem Durumu ekranı için)
   */
  public getRegisteredHooksSummary(): Array<{
    hook: HookName;
    type: "filter" | "action";
    plugins: string[];
  }> {
    const summary: Array<{
      hook: HookName;
      type: "filter" | "action";
      plugins: string[];
    }> = [];

    for (const [hook, list] of this.filters.entries()) {
      summary.push({
        hook,
        type: "filter",
        plugins: list.map((h) => `${h.pluginId} (p:${h.priority})`),
      });
    }
    for (const [hook, list] of this.actions.entries()) {
      summary.push({
        hook,
        type: "action",
        plugins: list.map((h) => `${h.pluginId} (p:${h.priority})`),
      });
    }
    return summary;
  }
}

// Global singleton (Next.js HMR sırasında çoklanmayı önler)
const globalForHooks = globalThis as unknown as {
  __nexpressHookBus?: NexPressHookBus;
};

export const cmsHooks =
  globalForHooks.__nexpressHookBus ??
  (globalForHooks.__nexpressHookBus = new NexPressHookBus());

/**
 * Eklenti eylemleri: panel (oturumlu kullanıcı) bir adla eylem çağırır, eklenti işleyiciyi bağlar.
 * Çekirdek yalnızca ad ve JSON taşır; yetki denetimi çağıran server action'dadır (AGENTS.md kural 9).
 */
export interface PluginActionContext {
  siteId: string;
  userId: string;
  input: Record<string, unknown>;
}

export type PluginActionResult = { ok: true; data: unknown } | { ok: false; error: string; code?: "disabled" | "unconfigured" | "rate_limited" | "invalid" | "failed" };

export type PluginActionHandler = (ctx: PluginActionContext) => Promise<PluginActionResult>;

class PluginActionRegistry {
  private handlers = new Map<string, { pluginId: string; handler: PluginActionHandler }>();

  public register(name: string, pluginId: string, handler: PluginActionHandler): void {
    this.handlers.set(name, { pluginId, handler });
  }

  public async run(name: string, ctx: PluginActionContext): Promise<PluginActionResult> {
    const entry = this.handlers.get(name);
    if (!entry) return { ok: false, error: "Bu eylem kullanılamıyor (eklenti kurulu değil).", code: "disabled" };
    try {
      return await entry.handler(ctx);
    } catch (error) {
      return { ok: false, error: error instanceof Error ? error.message : "Eylem başarısız.", code: "failed" };
    }
  }
}

const g = globalThis as unknown as { __nexpressPluginActions?: PluginActionRegistry };
export const pluginActions = (g.__nexpressPluginActions ??= new PluginActionRegistry());

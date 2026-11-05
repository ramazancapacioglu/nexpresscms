import React from "react";

/**
 * Desteklenen Görsel Genişleme Yuvaları (Open-Core UI Slots)
 */
export type PluginSlotName =
  | "admin.sidebar.nav"         // Sol yönetim menüsüne Pro modül linkleri ekler
  | "dashboard.overview.cards"  // Ana panele AI Bot Isı Haritası / Gap özet kartları ekler
  | "editor.sidebar.tabs"       // Editör sağ çekmecesine Canlı SEO & RAG Co-Pilot ekler
  | "editor.toolbar.actions"    // Editör üst barına "2-Pass AI Üret" butonu ekler
  | "themes.customizer.panels"  // Tema özelleştiriciye ek paneller ekler
  | "public.head.meta"          // Ön yüz <head> içerisine ek doğrulama/sinyal etiketleri ekler
  | "seo.reports.queries"       // SEO raporları: kelime havuzu ve rakip
  | "seo.reports.content"       // SEO raporları: erime, açık, kaynak, katalog
  | "seo.reports.visibility";   // SEO raporları: yönlendirme, bot, yorum, destek

export interface SlotComponentProps<TContext = Record<string, unknown>> {
  siteId: string;
  context?: TContext;
}

export interface RegisteredSlotEntry {
  id: string;
  pluginId: string;
  slot: PluginSlotName;
  priority: number;
  render: (props: SlotComponentProps<any>) => React.ReactNode;
}

class PluginSlotRegistry {
  private slots = new Map<PluginSlotName, RegisteredSlotEntry[]>();

  public register(entry: RegisteredSlotEntry): void {
    const existing = this.slots.get(entry.slot) ?? [];
    const filtered = existing.filter((item) => item.id !== entry.id);
    filtered.push(entry);
    filtered.sort((a, b) => a.priority - b.priority);
    this.slots.set(entry.slot, filtered);
  }

  public getEntries(slot: PluginSlotName): RegisteredSlotEntry[] {
    return this.slots.get(slot) ?? [];
  }

  public getAllRegisteredSlots(): Record<PluginSlotName, string[]> {
    const result: Record<PluginSlotName, string[]> = {
      "admin.sidebar.nav": [],
      "dashboard.overview.cards": [],
      "editor.sidebar.tabs": [],
      "editor.toolbar.actions": [],
      "themes.customizer.panels": [],
      "public.head.meta": [],
      "seo.reports.queries": [],
      "seo.reports.content": [],
      "seo.reports.visibility": [],
    };
    for (const [slotName, entries] of this.slots.entries()) {
      result[slotName] = entries.map((e) => `${e.pluginId}:${e.id}`);
    }
    return result;
  }
}

const globalForSlots = globalThis as unknown as {
  __nexpressSlotRegistry?: PluginSlotRegistry;
};

export const slotRegistry =
  globalForSlots.__nexpressSlotRegistry ??
  (globalForSlots.__nexpressSlotRegistry = new PluginSlotRegistry());

export interface PluginSlotProps<TContext = Record<string, unknown>> {
  name: PluginSlotName;
  siteId?: string;
  context?: TContext;
  fallback?: React.ReactNode;
  className?: string;
}

/**
 * `<PluginSlot name="..." />` — Çekirdek ekranlarda Pro veya 3. parti eklentilerin
 * doğrudan import olmadan render edilmesini sağlayan izomorfik bileşen.
 */
export function PluginSlot<TContext = Record<string, unknown>>({
  name,
  siteId = "default",
  context,
  fallback = null,
  className,
}: PluginSlotProps<TContext>): React.ReactElement | null {
  const entries = slotRegistry.getEntries(name);

  if (entries.length === 0) {
    return fallback ? <>{fallback}</> : null;
  }

  return (
    <div className={className} data-nexpress-slot={name}>
      {entries.map((entry) => (
        <React.Fragment key={entry.id}>
          {entry.render({ siteId, context })}
        </React.Fragment>
      ))}
    </div>
  );
}

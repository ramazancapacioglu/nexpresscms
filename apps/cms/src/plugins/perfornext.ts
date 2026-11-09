import type { PluginManifest } from "@nexpress/core";

/** Önbellek, veritabanı bakımı ve içerik ağırlığı. Ziyaretçi sayfasına betik eklemez. */
export const PERFORNEXT_PLUGIN_ID = "@nexpress/plugin-perfornext";

export const PERFORNEXT_MANIFEST: PluginManifest = {
  id: PERFORNEXT_PLUGIN_ID,
  name: "Perfornext",
  version: "1.0.0",
  vendor: "NexPress",
  license: "free",
  builtin: false,
  icon: "Gauge",
  description: "Önbellek süresi ve temizliği, veritabanı istatistik bakımı ve yayınların ağırlık raporu.",
  settingsHref: "/admin/perfornext",
  settings: [
    {
      key: "cacheTtlSeconds",
      label: "Önbellek süresi (saniye)",
      type: "number",
      module: "cache",
      group: "Önbellek",
      help: "Ziyaretçi okumaları bu süre dolunca yenilenir. 30 ile 600 arası.",
      min: 30,
      max: 600,
    },
  ],
  modules: [
    { id: "cache", group: "Önbellek", label: "Önbellek", description: "Süre, dönem sayacı ve site önbelleğini düşürme.", status: "ready", defaultEnabled: true, surfaces: ["/admin/perfornext"] },
    { id: "database", group: "Veritabanı", label: "Bakım", description: "Satır sayıları ve planlayıcı istatistiği (ANALYZE).", status: "ready", defaultEnabled: true, surfaces: ["/admin/perfornext"] },
    { id: "content", group: "İçerik", label: "İçerik ağırlığı", description: "Uzun sayfa, kalabalık blok, eksik alt metin ve boş meta.", status: "ready", defaultEnabled: true, surfaces: ["/admin/perfornext"] },
  ],
};

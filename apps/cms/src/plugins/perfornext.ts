import type { PluginManifest } from "@nexpress/core";

/** Önbellek, veritabanı bakımı, medya hattı, 0-KB RSC bütçesi ve içerik ağırlığı. Ziyaretçi sayfasına betik eklemez. */
export const PERFORNEXT_PLUGIN_ID = "@nexpress/plugin-perfornext";

export const PERFORNEXT_MANIFEST: PluginManifest = {
  id: PERFORNEXT_PLUGIN_ID,
  name: "Perfornext",
  version: "1.2.0",
  vendor: "NexPress",
  license: "free",
  builtin: false,
  icon: "Gauge",
  description: "Önbellek ön ısıtma ve temizliği, veritabanı şişkinlik bakımı, medya hattı denetimi, 0-KB RSC bütçesi ve Core Web Vitals ağırlık raporu.",
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
    {
      key: "keepRevisionsCount",
      label: "İçerik başına korunacak revizyon adedi",
      type: "number",
      module: "database",
      group: "Veritabanı",
      help: "Revizyon budama çalıştırıldığında içerik ve dil başına en yeni N revizyon tutulur (1–50).",
      min: 1,
      max: 50,
    },
  ],
  modules: [
    { id: "budget", group: "Ön Yüz", label: "0-KB RSC & Bütçe Denetimi", description: "Ön yüz JS bütçesi (perf-budget.json), özel CSS boyutu ve betik ihlali denetimi.", status: "ready", defaultEnabled: true, surfaces: ["/admin/perfornext"] },
    { id: "cache", group: "Önbellek", label: "Önbellek & Ön Isıtma", description: "Süre, dönem sayacı, tüm dillerde önbellek ön ısıtma ve düşürme.", status: "ready", defaultEnabled: true, surfaces: ["/admin/perfornext"] },
    { id: "database", group: "Veritabanı", label: "Veritabanı & Şişkinlik Bakımı", description: "Tablo/günlük satır sayıları, WAL/ANALYZE istatistik bakımı, revizyon budama ve 404/çöp temizliği.", status: "ready", defaultEnabled: true, surfaces: ["/admin/perfornext"] },
    { id: "media", group: "Medya", label: "Medya & Görsel Hattı", description: "Toplam medya boyutu, >1,5 MB ağır yüklemeler, kullanılmayan dosyalar ve eksik alt metinler.", status: "ready", defaultEnabled: true, surfaces: ["/admin/perfornext"] },
    { id: "content", group: "İçerik", label: "İçerik Ağırlığı & Core Web Vitals", description: "CLS/LCP riskleri, DOM derinliği, gömülü iframe'ler, tahmini HTML yükü ve Markdown önbellek derlemesi.", status: "ready", defaultEnabled: true, surfaces: ["/admin/perfornext"] },
  ],
};

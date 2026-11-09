import type { PluginManifest } from "@nexpress/core";

/** Sanal mağaza kanalları. Ürün kataloğundan ayrı açılıp kapanır. */
export const MARKETPLACE_PLUGIN_ID = "@nexpress/plugin-marketplaces";

export const MARKETPLACE_PLUGIN_MANIFEST: PluginManifest = {
  id: MARKETPLACE_PLUGIN_ID,
  name: "Sanal mağaza",
  version: "1.0.0",
  vendor: "NexPress",
  license: "free",
  builtin: false,
  icon: "Store",
  description: "Trendyol, Hepsiburada, n11, Amazon ve Çiçeksepeti kanalları. Stok site kataloğundaki SKU ile gider.",
  settingsHref: "/admin/marketplaces",
  endpoints: ["/admin/marketplaces"],
  modules: [
    { id: "channels", group: "Kanallar", label: "Kanal yönetimi", description: "Bağlantı, kimlik ve kanal listesi.", status: "ready", defaultEnabled: true, surfaces: ["/admin/marketplaces"] },
    { id: "stock", group: "Kanallar", label: "Stok ve fiyat", description: "Katalog fiyat ve stoğunu kanala iter.", status: "ready", defaultEnabled: true },
    { id: "orders", group: "Kanallar", label: "Sipariş çekme", description: "Kanaldan gelen siparişleri alır.", status: "ready", defaultEnabled: true },
  ],
};

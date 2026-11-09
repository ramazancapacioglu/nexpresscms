import type { PluginManifest } from "@nexpress/core";

/** Mağaza eklentisi. Katalog, sipariş ve vitrin çekirdek menüde durmaz. */
export const COMMERCE_PLUGIN_ID = "@nexpress/plugin-commerce";

export const COMMERCE_PLUGIN_MANIFEST: PluginManifest = {
  id: COMMERCE_PLUGIN_ID,
  name: "E-Ticaret",
  version: "1.0.0",
  vendor: "NexPress",
  license: "free",
  builtin: false,
  icon: "ShoppingBag",
  description: "Ürün kataloğu, sepet, sipariş, müşteri, kargo ve ziyaretçi mağazası. Pazar yeri kanalları ayrı eklentidedir.",
  settingsHref: "/admin/commerce",
  endpoints: ["/{locale}/magaza", "/{locale}/magaza/{slug}", "/{locale}/magaza/sepet", "/{locale}/magaza/odeme"],
  modules: [
    { id: "catalog", group: "Yönetim", label: "Katalog", description: "Ürün, kategori ve nitelik.", status: "ready", defaultEnabled: true, surfaces: ["/admin/commerce/products"] },
    { id: "orders", group: "Yönetim", label: "Siparişler", description: "Site siparişleri ve durumları.", status: "ready", defaultEnabled: true, surfaces: ["/admin/commerce/orders"] },
    { id: "customers", group: "Yönetim", label: "Müşteriler", description: "Müşteri, grup ve sadakat.", status: "ready", defaultEnabled: true, surfaces: ["/admin/commerce/customers"] },
    { id: "promotions", group: "Satış", label: "Kupon ve indirim", description: "Kupon kodu ve kampanya indirimi.", status: "ready", defaultEnabled: true, surfaces: ["/admin/commerce/campaigns"] },
    { id: "shipping", group: "Satış", label: "Kargo", description: "Kargo yöntemleri.", status: "ready", defaultEnabled: true, surfaces: ["/admin/commerce/shipping"] },
    { id: "returns", group: "Satış", label: "İade", description: "İade ve değişim kayıtları.", status: "ready", defaultEnabled: true, surfaces: ["/admin/commerce/returns"] },
    { id: "storefront", group: "Vitrin", label: "Mağaza vitrini", description: "Ziyaretçi mağazası, sepet ve ödeme.", status: "ready", defaultEnabled: true, surfaces: ["/{locale}/magaza"] },
  ],
};

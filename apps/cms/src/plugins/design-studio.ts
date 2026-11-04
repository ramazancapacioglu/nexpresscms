import type { PluginManifest } from "@nexpress/core";

/**
 * Tasarım Stüdyosu & Şablon Fabrikası Manifesti (@nexpress/plugin-design-studio)
 *
 * Tüm şablonları (Header, Footer, Sidebar, Blog, Kategori, Ürün, vb.), senkronize modelleri (Patterns),
 * tasarım kütüphanesini ve AI tasarım motorunu tek bir çatı altında birleştiren yeni nesil stüdyo.
 */
export const DESIGN_STUDIO_PLUGIN_MANIFEST: PluginManifest = {
  id: "@nexpress/plugin-design-studio",
  name: "Tasarım Stüdyosu & Şablon Fabrikası",
  version: "1.0.0",
  vendor: "NexPress",
  license: "free",
  builtin: true,
  icon: "Palette",
  description:
    "Tüm şablonları, senkronize blok modellerini, AI tasarım motorunu, canlı tema özelleştiricisini ve güvenli Ek CSS/JS kodlarını tek bir merkezden yönetin.",
  settingsHref: "/admin/studio",
  endpoints: [
    "/admin/studio",
    "/admin/themes",
    "/admin/appearance/templates",
    "/admin/design-library",
  ],
  modules: [
    {
      id: "hub",
      group: "Stüdyo",
      label: "Tasarım Stüdyosu Merkezi",
      description: "Şablonlar, modeller, AI üretici ve kütüphaneyi tek çatıdan yönetme.",
      status: "ready",
      defaultEnabled: true,
      surfaces: ["/admin/studio"],
    },
    {
      id: "templates",
      group: "Şablonlar",
      label: "Global Şablon & Model Fabrikası",
      description: "Header, Footer, Sidebar, Blog, Ürün, Kampanya ve Kurumsal sayfa şablonları.",
      status: "ready",
      defaultEnabled: true,
      surfaces: ["/admin/appearance/templates", "/admin/studio"],
    },
    {
      id: "patterns",
      group: "Modeller",
      label: "Senkronize Blok Modelleri",
      description: "Tek bir yerde düzenlenip tüm sitede eşzamanlı güncellenen tekrar kullanılabilir modeller.",
      status: "ready",
      defaultEnabled: true,
    },
    {
      id: "ai_builder",
      group: "Yapay Zeka",
      label: "AI Tasarım Üreticisi",
      description: "Sektör, amaç ve prompt ile anında 100/100 uyumlu AST blokları üreten asistan.",
      status: "ready",
      defaultEnabled: true,
      surfaces: ["/admin/design-library"],
    },
    {
      id: "customizer",
      group: "Özelleştirme",
      label: "Canlı Tema Özelleştirici",
      description: "Renk paletleri, tipografi, butonlar ve konteyner geometrisini canlı önizleme ile ayarlama.",
      status: "ready",
      defaultEnabled: true,
      surfaces: ["/admin/themes"],
    },
    {
      id: "custom_code",
      group: "Özel Kodlar",
      label: "Ek CSS & Ek JS (Özel Kod Girişi)",
      description: "100/100 Lighthouse hızını koruyan sunucu taraflı inlined CSS ve güvenli head/body betikleri.",
      status: "ready",
      defaultEnabled: true,
    },
    {
      id: "export_import",
      group: "Dağıtım",
      label: "İçe / Dışa Aktarma & Şablon Galerisi",
      description: ".nxtemplate JSON ve Zip paket formatıyla şablon paylaşımı, içe aktarma ve pazar yeri dağıtımı.",
      status: "ready",
      defaultEnabled: true,
    },
  ],
};


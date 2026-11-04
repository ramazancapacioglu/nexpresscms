import type { PluginManifest } from "@nexpress/core";

/**
 * Kampanyalar & Fırsatlar Eklentisi Manifesti (@nexpress/plugin-campaigns)
 *
 * Blog yazılarından bağımsız, zengin alanlara (indirim, hediye, süre sayacı, şartlar tablosu,
 * Google Schema.org Offer & ItemList JSON-LD) sahip profesyonel kampanya ve promosyon motoru.
 */
export const CAMPAIGNS_PLUGIN_MANIFEST: PluginManifest = {
  id: "@nexpress/plugin-campaigns",
  name: "Kampanyalar & Fırsatlar",
  version: "1.0.0",
  vendor: "NexPress",
  license: "free",
  builtin: false,
  icon: "Megaphone",
  description:
    "Gelişmiş kampanya ve promosyon yönetimi: İndirim oranları, hediye ürün/modüller, süre sınırı sayacı, şartlar tablosu, Google Offer & ItemList JSON-LD şemaları ve vitrin sayfaları.",
  settingsHref: "/admin/campaigns",
  endpoints: [
    "/{locale}/kampanyalar",
    "/{locale}/kampanya/{slug}",
  ],
  modules: [
    {
      id: "manager",
      group: "Yönetim",
      label: "Kampanya Yöneticisi",
      description: "Kampanyaları listeleme, filtreleme, oluşturma, çoğaltma ve hızlı düzenleme.",
      status: "ready",
      defaultEnabled: true,
      surfaces: ["/admin/campaigns"],
    },
    {
      id: "schema",
      group: "SEO & Şema",
      label: "Google Offer & ItemList Şeması",
      description: "Google ve yapay zeka arama motorları için Offer ve ItemList JSON-LD şeması üretir; süresi dolunca otomatik günceller.",
      status: "ready",
      defaultEnabled: true,
    },
    {
      id: "countdown",
      group: "Satış & Dönüşüm",
      label: "Geri Sayım & Süre Sınırı",
      description: "Kalan gün sayacı ve otomatik süre sonu bildirim rozetleri.",
      status: "ready",
      defaultEnabled: true,
    },
    {
      id: "showcase",
      group: "Vitrin",
      label: "Kampanyalar Arşivi (/kampanyalar)",
      description: "Tüm aktif ve geçmiş kampanyaların sergilendiği hızlı, 0-KB RSC vitrin arşivi.",
      status: "ready",
      defaultEnabled: true,
      surfaces: ["/{locale}/kampanyalar"],
    },
    {
      id: "detail",
      group: "Vitrin",
      label: "Tekil Kampanya Sayfası (/kampanya/[slug])",
      description: "Afiş görseli, indirim/hediye kutusu, sayaç, başvuru butonu ve şartlar tablosu içeren özel detay sayfası.",
      status: "ready",
      defaultEnabled: true,
      surfaces: ["/{locale}/kampanya/{slug}"],
    },
    {
      id: "widgets",
      group: "Gömme Bileşenler",
      label: "Kampanya Banner & Karosel Blokları",
      description: "Ana sayfa, kenar çubuğu ve ürün sayfalarına kampanya kartı veya kayan duyuru yerleştirme.",
      status: "ready",
      defaultEnabled: true,
    },
  ],
};


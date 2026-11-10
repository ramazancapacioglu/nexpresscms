import type { PluginManifest } from "@nexpress/core";

/** Panel eklentisi ile WordPress eklenti başlığı aynı sürümü taşır. */
export const WP_BRIDGE_VERSION = "0.3.1";

export const WP_BRIDGE_PLUGIN_ID = "@nexpress/plugin-wp-bridge";

/**
 * WordPress köprüsü. Dosya aktarımının yerine geçmez; site eklentisinden
 * yapılandırılmış paket alır. E-ticaret bu eklentide yoktur.
 */
export const WP_BRIDGE_MANIFEST: PluginManifest = {
  id: WP_BRIDGE_PLUGIN_ID,
  name: "WordPress Köprüsü",
  version: WP_BRIDGE_VERSION,
  vendor: "NexPress",
  license: "free",
  builtin: false,
  icon: "Plug",
  description:
    "WordPress sitesindeki sayfa, yazı, yorum, form, şema, medya ve yerleşimi bağlar. E-ticaret aktarılmaz. Site eklentisi buradan, sürümüyle indirilir.",
  settingsHref: "/admin/wp-bridge",
  endpoints: ["/api/admin/wp-bridge/plugin", "/api/wp-bridge/v1/pair", "/api/wp-bridge/v1/push"],
  modules: [
    {
      id: "package",
      group: "Kurulum",
      label: "Site eklentisini indir",
      description: "WordPress'e kurulacak paketi, paneldeki sürümle zip olarak verir.",
      status: "ready",
      defaultEnabled: true,
      surfaces: ["/admin/wp-bridge", "/api/admin/wp-bridge/plugin"],
    },
    {
      id: "reset",
      group: "Kurulum",
      label: "Aktarım öncesi sıfırlama",
      description: "Şablon ve tasarım kütüphanesi kalır. Sayfa, yazı, diğer içerik, yorum ve medya silinir.",
      status: "ready",
      defaultEnabled: true,
      surfaces: ["/admin/wp-bridge"],
    },
    {
      id: "connect",
      group: "Bağlantı",
      label: "Eşleştirme",
      description: "Tek kullanımlık kod ile WordPress eklentisini bu siteye bağlar.",
      status: "ready",
      defaultEnabled: true,
    },
    {
      id: "content",
      group: "İçerik",
      label: "Sayfa, yazı ve yorum",
      description: "İçerik, taksonomi ve yorumları kimliğe göre yazar. Ürün ve sipariş yok.",
      status: "ready",
      defaultEnabled: true,
    },
    {
      id: "links",
      group: "İçerik",
      label: "İç bağlantı tarama",
      description: "Kaynak sitenin mutlak adreslerini yerel yola çevirir.",
      status: "ready",
      defaultEnabled: true,
    },
    {
      id: "media",
      group: "İçerik",
      label: "Medya dosyaları",
      description: "Görselleri eski adreste bırakmadan medya kitaplığına alır.",
      status: "ready",
      defaultEnabled: true,
    },
    {
      id: "design",
      group: "Görünüm",
      label: "Yerleşim çizimi",
      description: "Satır, sütun, kart, kapak bandı, menü ve üst/alt şeridi blok stiline çizer.",
      status: "ready",
      defaultEnabled: true,
    },
    {
      id: "seo",
      group: "SEO",
      label: "SEO ve şema",
      description: "Sayfa SEO'su, site geneli ayarlar ve şema şablonları.",
      status: "ready",
      defaultEnabled: true,
    },
    {
      id: "forms",
      group: "İçerik",
      label: "Form tanımları",
      description: "Alan, zorunluluk, seçenek ve bildirimi form kaydına çevirir.",
      status: "ready",
      defaultEnabled: true,
    },
  ],
};

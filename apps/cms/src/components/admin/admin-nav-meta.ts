import type { MessageKey } from "@nexpress/i18n";

export const NAV_LABEL_KEYS: Record<string, MessageKey> = {
  "/admin": "admin.nav.overview",
  "/admin/plugins": "admin.nav.plugins",
  "/admin/pages": "admin.nav.pages",
  "/admin/posts": "admin.nav.posts",
  // "/admin/contents" etiketi yeniden adlandırıldı (kategori anahtarı kullanılmaz)
  "__/admin/contents": "admin.nav.studio",
  "/admin/taxonomies": "admin.nav.taxonomies",
  "/admin/media": "admin.nav.media",
  "/admin/comments": "admin.nav.comments",
  "/admin/campaigns": "admin.nav.campaigns",
  "/admin/translations": "admin.nav.translations",
  "/admin/schedule": "admin.nav.schedule",
  "/admin/trash": "admin.nav.trash",
  "/admin/redirects": "admin.nav.redirects",
  "/admin/system": "admin.nav.system",
  "/admin/perfornext": "admin.nav.perfornext",
  "/admin/notifications": "admin.nav.notifications",
  "/admin/studio": "admin.nav.designStudio",
  "/admin/appearance/templates": "admin.nav.templates",
  "/admin/design-library": "admin.nav.designLibrary",
  "/admin/seo/audit": "admin.nav.seoAudit",
  "/admin/integrations": "admin.nav.integrations",
  "/admin/help": "admin.nav.help",
  "/admin/backup": "admin.nav.backup",
  "/admin/requests": "admin.nav.requests",
  "/admin/forms": "admin.nav.forms",
  "/admin/commerce": "admin.nav.commerce",
  "/admin/marketplaces": "admin.nav.marketplaces",
  // "/admin/themes" etiketi yeniden adlandırıldı (kategori anahtarı kullanılmaz)
  "__/admin/themes": "admin.nav.themes",
  // "/admin/seo" etiketi yeniden adlandırıldı (kategori anahtarı kullanılmaz)
  "__/admin/seo": "admin.nav.seo",
  "/admin/appearance/header": "admin.nav.header",
  "/admin/appearance/menus": "admin.nav.menus",
  "/admin/appearance/footer": "admin.nav.footer",
  "/admin/appearance/sidebar": "admin.nav.sidebar",
  "/admin/migration": "admin.nav.migration",
  "/admin/wp-bridge": "admin.nav.wpBridge",
  "/admin/settings": "admin.nav.settings",
  "/admin/users": "admin.nav.users",
  "/admin/audit": "admin.nav.audit",
};

export const SECTION_LABEL_KEYS: Record<string, MessageKey> = {
  // Yeni gruplar sabit Türkçe etiketle gösterilir; eski anahtarlar yalnızca geriye dönük uyum içindir
  Workspace: "admin.sections.workspace",
  "İçerik & Yayın": "admin.sections.content",
  "Tasarım & Motorlar": "admin.sections.design",
  Sistem: "admin.sections.system",
};

export const QUICK_COMMANDS = [
  {
    title: "Sayfalar Yönetimi (/admin/pages)",
    subtitle: "Sayfa listesi, filtreleme, satır içi hızlı düzenleme ve toplu işlemler",
    href: "/admin/pages",
  },
  {
    title: "Blog Yazıları Yönetimi (/admin/posts)",
    subtitle: "Blog makaleleri, kategori filtreleme, hızlı düzenleme ve toplu işlemler",
    href: "/admin/posts",
  },
  {
    title: "Görsel Blok & Doküman Stüdyosu (/admin/contents)",
    subtitle: "Novel/TipTap metin akışı, iç içe satır/sütun düzenleri ve canlı 17-noktalı SEO Motoru",
    href: "/admin/contents",
  },
  {
    title: "Kategoriler, Etiketler & Taksonomi SEO (/admin/taxonomies)",
    subtitle: "Kategori ve etiket yönetimi, arşiv Meta Title ve Description ayarları",
    href: "/admin/taxonomies",
  },
  {
    title: "Medya Kütüphanesi & Görsel SEO Denetçisi (/admin/media)",
    subtitle: "Alt metin (altText), Title, Figcaption, Odak Noktası ve LCP optimizasyonu",
    href: "/admin/media",
  },
  {
    title: "Yorum, İnceleme & 5 Yıldızlı Değerlendirme (/admin/comments)",
    subtitle: "Müşteri yorumları, Artılar/Eksiler ve Google AggregateRating Schema moderasyonu",
    href: "/admin/comments",
  },
  {
    title: "E-Ticaret — ürünler ve siparişler (/admin/commerce)",
    subtitle: "Katalog, stok, sepet ve sipariş yönetimi; ön yüz /tr/magaza",
    href: "/admin/commerce",
  },
  {
    title: "Sanal mağaza (/admin/marketplaces)",
    subtitle: "Trendyol, Hepsiburada, n11, Amazon ve Çiçeksepeti kanalları",
    href: "/admin/marketplaces",
  },
  {
    title: "Tema Mağazası & Tasarım Tokenları",
    subtitle: "Corporate Aurora, Commerce Velocity ve Editorial Pulse yönetimi",
    href: "/admin/themes",
  },
  {
    title: "SEO motoru",
    subtitle: "Site skor özeti, başlık şablonu, sitemap ve robots ayarları",
    href: "/admin/seo",
  },
  {
    title: "Header yerleşimi",
    subtitle: "Duyuru şeridi, ana şerit ve düzenlenebilir header şablonları",
    href: "/admin/appearance/header",
  },
  {
    title: "Menü ağacı",
    subtitle: "Header’dan ayrı sürükle-bırak menü",
    href: "/admin/appearance/menus",
  },
  {
    title: "Footer yerleşimi",
    subtitle: "Kolonlar, bülten ve düzenlenebilir footer şablonları",
    href: "/admin/appearance/footer",
  },
  {
    title: "Site kenar çubuğu",
    subtitle: "Sayfa bloklarından ayrı sol veya sağ bağlantı sütunu",
    href: "/admin/appearance/sidebar",
  },
  {
    title: "WordPress → NexPress Göç Aracı",
    subtitle: "Elementor/WPBakery kısa kod temizleyici ve 301 yönlendirme aktarıcısı",
    href: "/admin/migration",
  },
  {
    title: "Eklentiler",
    subtitle: "Temel SEO ve Agentic SEO Pro modüllerini aç/kapat; kancalar ve yuvalar geliştirici sekmesinde",
    href: "/admin/plugins",
  },
  {
    title: "Canlı 100/100 RSC Vitrin (/tr)",
    subtitle: "Sıfır istemci JavaScript yüküyle çalışan ön yüzü yeni sekmede aç",
    href: "/tr",
  },
];


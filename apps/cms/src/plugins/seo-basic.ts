import type { PluginManifest } from "@nexpress/core";

/**
 * Temel SEO: çekirdeğe gömülü, ücretsiz. Kodu `packages/seo-core` ve `apps/cms` içindedir;
 * bu manifest yalnızca Eklentiler sayfasında görünürlük ve ayar kısayolu içindir.
 * Google / Bing / Yandex entegrasyonları (doğrulama, IndexNow, arama verisi) burada kalır.
 */
export const SEO_BASIC_MANIFEST: PluginManifest = {
  id: "@nexpress/seo-basic",
  name: "Temel SEO",
  version: "1.0.0",
  vendor: "NexPress",
  license: "free",
  builtin: true,
  icon: "Search",
  description: "Her sitede açık gelen temel SEO: başlık ve meta şablonları, canlı içerik analizi, otomatik şema, site haritası, yönlendirme ve arama motoru entegrasyonları.",
  settingsHref: "/admin/seo",
  endpoints: ["/sitemap.xml", "/robots.txt", "/feed.xml", "/atom.xml", "/llms.txt", "/{locale}/ara"],
  modules: [
    { id: "meta", group: "İçerik SEO", label: "Başlık ve meta şablonları", description: "Başlık/açıklama şablonları, canonical, Open Graph ve Twitter etiketleri.", status: "ready", defaultEnabled: true },
    { id: "analysis", group: "İçerik SEO", label: "Canlı içerik analizi", description: "17 noktalı denetim listesi ve SEO skoru; editörde anlık.", status: "ready", defaultEnabled: true },
    { id: "schema-auto", group: "İçerik SEO", label: "Otomatik şema + doğrulayıcı", description: "SSS, adım ve inceleme bloklarından JSON-LD üretir ve kurallara göre denetler.", status: "ready", defaultEnabled: true },
    { id: "redirects", group: "Teknik SEO", label: "Otomatik 301", description: "Adres değişince eski URL'yi yeni adrese yönlendirir.", status: "ready", defaultEnabled: true },
    { id: "sitemap", group: "Teknik SEO", label: "Parçalı site haritası", description: "Türe göre sayfalanan sitemap ve hreflang.", status: "ready", defaultEnabled: true },
    { id: "robots", group: "Teknik SEO", label: "robots.txt ve bot politikası", description: "Eğitim ve arama botları için bot başına izin/engel.", status: "ready", defaultEnabled: true },
    { id: "bot-verify", group: "Teknik SEO", label: "Bot doğrulama", description: "Bot telemetrisinde ters DNS + ileri doğrulama ve OpenAI / Perplexity'nin yayımladığı IP aralıkları; sahte botlar \"iddia\" olarak ayrılır.", status: "ready", defaultEnabled: true },
    { id: "feeds", group: "Teknik SEO", label: "RSS / Atom", description: "Blog yazıları için besleme ve keşif bağlantıları.", status: "ready", defaultEnabled: true },
    { id: "link-audit", group: "Teknik SEO", label: "İç bağlantı denetimi", description: "Kırık ve taşınmış iç bağlantıları listeler.", status: "ready", defaultEnabled: true },
    { id: "site-search", group: "Teknik SEO", label: "Site içi arama", description: "Sunucuda çalışan, JS'siz arama sayfası.", status: "ready", defaultEnabled: true },
    { id: "webmaster", group: "Arama motorları", label: "Google / Bing / Yandex doğrulama", description: "Site sahipliği doğrulama etiketleri.", status: "ready", defaultEnabled: true },
    { id: "indexnow", group: "Arama motorları", label: "IndexNow (Bing, Yandex)", description: "Yayın ve güncellemede anında bildirim.", status: "ready", defaultEnabled: true },
    { id: "search-console", group: "Arama motorları", label: "Arama verisi bağlantıları", description: "Search Console, Bing Webmaster ve Yandex'ten sorgu / tık / sıralama verisi. Yapılmadı — Google OAuth ve Bing/Yandex API anahtarları gerekir.", status: "planned", defaultEnabled: true },
  ],
};

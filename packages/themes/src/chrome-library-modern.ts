import type { FooterConfig, HeaderConfig, SiteWidget } from "@nexpress/core";
import type { ChromePreview } from "./chrome-library";

/**
 * Modern header ve footer şablonları. Her header'ın tasarlanmış mobil dizisi vardır
 * (logo solda kalır, menü sağda açılır, çağrı ya da arama telefonda korunur).
 * Footer'lar telefonda tek sütuna iner: marka ve çağrı bandı en üstte, bağlantı grupları altta.
 */
export type ModernChrome<T> = [id: string, name: string, description: string, category: string, preview: ChromePreview, value: T];

const off = { enabled: false, leftWidgets: [] as string[], centerWidgets: [] as string[], rightWidgets: [] as string[] };
const bar = (left: string[], center: string[], right: string[], mobile: { left: string[]; center?: string[]; right: string[] }, extra: Record<string, unknown> = {}) => ({
  enabled: true,
  sticky: true,
  glassmorphism: false,
  leftWidgets: left,
  centerWidgets: center,
  rightWidgets: right,
  mobileLeftWidgets: mobile.left,
  mobileCenterWidgets: mobile.center ?? [],
  mobileRightWidgets: mobile.right,
  ...extra,
});

export const MODERN_HEADERS: Array<ModernChrome<HeaderConfig>> = [
  ["header-modern-glass", "Cam şerit + arama", "Buzlu yapışkan şerit: logo, orta menü, arama ve çağrı. Telefonda arama ve menü.", "modern", "bar-center", {
    topBar: { ...off },
    mainBar: bar(["logo"], ["menu"], ["search", "cta"], { left: ["logo"], right: ["search", "menu"] }, { glassmorphism: true, ctaLabel: "Ücretsiz dene", ctaHref: "/tr/iletisim" }),
    bottomBar: { ...off, links: [] },
  }],
  ["header-two-tier", "İki katmanlı kurumsal", "Üstte duyuru ve iletişim, altında logo-menü-çağrı. Telefonda yalnız duyuru üstte kalır.", "modern", "bar-announce", {
    topBar: { ...bar(["announcement"], [], ["contact"], { left: ["announcement"], right: [] }, { sticky: false }), announcementText: "Yeni sürüm yayında — hemen inceleyin", contactPhone: "+90 (212) 000 00 00", contactEmail: "bilgi@ornek.com" },
    mainBar: bar(["logo"], ["menu"], ["cta"], { left: ["logo"], right: ["cta", "menu"] }, { ctaLabel: "Teklif alın", ctaHref: "/tr/iletisim" }),
    bottomBar: { ...off, links: [] },
  }],
  ["header-center-brand", "Ortalı marka", "Logo ortada, menü solda, arama ve çağrı sağda. Telefonda logo solda, menü sağda.", "modern", "bar-center", {
    topBar: { ...off },
    mainBar: bar(["menu"], ["logo"], ["search", "cta"], { left: ["logo"], right: ["menu"] }, { ctaLabel: "İletişim", ctaHref: "/tr/iletisim" }),
    bottomBar: { ...off, links: [] },
  }],
  ["header-app-search", "Arama odaklı (doküman/uygulama)", "Logo solda, geniş arama ortada, çağrı sağda. Telefonda arama ve menü sağda.", "modern", "bar-catalog", {
    topBar: { ...off },
    mainBar: bar(["logo"], ["search"], ["cta"], { left: ["logo"], right: ["search", "menu"] }, { ctaLabel: "Giriş yap", ctaHref: "/login" }),
    bottomBar: { ...off, links: [] },
  }],
  ["header-shop-categories", "Mağaza + kategori şeridi", "Üstte logo, arama ve iletişim; altta kategori bağlantıları. Telefonda alt şerit kaydırılır.", "modern", "bar-catalog", {
    topBar: { ...off },
    mainBar: bar(["logo"], ["search"], ["contact", "cta"], { left: ["logo"], right: ["menu", "cta"] }, { ctaLabel: "Sepetim", ctaHref: "/tr/magaza" }),
    bottomBar: {
      ...bar([], ["links"], [], { left: ["links"], right: [] }, { sticky: false }),
      links: [
        { id: "mh_new", label: "Yeni gelenler", href: "/tr/magaza" },
        { id: "mh_cat", label: "Kategoriler", href: "/tr/magaza" },
        { id: "mh_sale", label: "İndirimler", href: "/tr/kampanyalar" },
        { id: "mh_help", label: "Yardım", href: "/tr/iletisim" },
      ],
    },
  }],
  ["header-landing-minimal", "Açılış sayfası (menüsüz)", "Yalnız logo ve tek çağrı: dikkat dağıtmayan kampanya sayfaları için. Telefonda aynı.", "modern", "bar-plain", {
    topBar: { ...off },
    mainBar: bar(["logo"], [], ["cta"], { left: ["logo"], right: ["cta"] }, { ctaLabel: "Hemen başvur", ctaHref: "#form" }),
    bottomBar: { ...off, links: [] },
  }],
];

const link = (id: string, label: string, href: string) => ({ id, label, href });
const nav = (id: string, title: string, columnIndex: number, links: Array<[string, string]>): SiteWidget => ({
  id: `wdg_${id}`,
  type: "nav_menu",
  title,
  enabled: true,
  columnIndex,
  settings: { links: links.map(([label, href], i) => link(`${id}_${i}`, label, href)) },
});
const brand = (id: string, columnIndex: number): SiteWidget => ({
  id: `wdg_${id}`,
  type: "about_brand",
  title: "Hakkımızda",
  enabled: true,
  columnIndex,
  settings: { subtitle: "İşletmeniz için hızlı, güvenli ve sade çözümler.", phone: "+90 (212) 000 00 00", email: "bilgi@ornek.com", address: "İstanbul", socials: { linkedin: "https://linkedin.com", instagram: "https://instagram.com", x: "https://x.com" } },
});
const letter = (id: string, columnIndex: number): SiteWidget => ({
  id: `wdg_${id}`,
  type: "newsletter",
  title: "Bülten",
  enabled: true,
  columnIndex,
  settings: { subtitle: "Ayda bir, yalnızca işinize yarayan içerikler.", placeholder: "E-posta adresiniz", ctaLabel: "Abone ol", privacyNote: "İstediğiniz zaman ayrılabilirsiniz.", tone: "subtle" },
});

const PRODUCT: Array<[string, string]> = [["Özellikler", "/tr/ozellikler"], ["Fiyatlandırma", "/tr/fiyatlandirma"], ["Entegrasyonlar", "/tr/entegrasyonlar"], ["Güncellemeler", "/tr/blog"]];
const COMPANY: Array<[string, string]> = [["Hakkımızda", "/tr/kurumsal"], ["Kariyer", "/tr/kariyer"], ["Blog", "/tr/blog"], ["İletişim", "/tr/iletisim"]];
const SUPPORT: Array<[string, string]> = [["Yardım merkezi", "/tr/destek"], ["Sık sorulanlar", "/tr/sikca-sorulan-sorular"], ["Durum", "/tr/durum"]];

/** Eski `columns` alanı widget'lardan türetilir (widget yoksa yedek olarak okunur). */
const withColumns = (widgets: SiteWidget[], rest: Omit<FooterConfig, "widgets" | "columns">): FooterConfig => ({
  ...rest,
  widgets,
  columns: widgets.filter((w) => w.type === "nav_menu").map((w) => ({
    id: w.id,
    title: w.title,
    colSpan: 3,
    links: ((w.settings as { links?: Array<{ label: string; href: string }> }).links ?? []).map(({ label, href }) => ({ label, href })),
  })),
});

export const MODERN_FOOTERS: Array<ModernChrome<FooterConfig>> = [
  ["footer-cta-brand", "Çağrı bandı + marka + 3 grup", "Üstte renkli çağrı bandı; marka ve bülten geniş sütunda, ürün-şirket-destek bağlantıları yanında.", "modern", "foot-columns", withColumns(
    [brand("fcb_brand", 0), letter("fcb_news", 0), nav("fcb_product", "Ürün", 1, PRODUCT), nav("fcb_company", "Şirket", 2, COMPANY), nav("fcb_support", "Destek", 3, SUPPORT)],
    { layoutPreset: "brand-wide-4", topBanner: { enabled: true, badge: "Yeni", title: "İşinizi büyütmeye hazır mısınız?", subtitle: "14 gün ücretsiz deneyin, kredi kartı gerekmez.", ctaLabel: "Hemen başlayın", ctaHref: "/tr/iletisim" }, showNewsletter: false, showLocalBusinessCard: false, copyrightText: "© 2026 Örnek Şirket. Tüm hakları saklıdır.", bottomLinks: [{ label: "Gizlilik", href: "/tr/gizlilik" }, { label: "Kullanım koşulları", href: "/tr/kullanim-kosullari" }] },
  )],
  ["footer-centered-brand", "Ortalı marka satırı", "Tek sütun: marka, yatay bağlantı satırı ve sosyal bağlantılar. Küçük siteler ve açılış sayfaları için.", "modern", "foot-slim", withColumns(
    [brand("fcm_brand", 0), nav("fcm_links", "Hızlı bağlantılar", 0, [["Ana sayfa", "/tr"], ["Hizmetler", "/tr/hizmetler"], ["Blog", "/tr/blog"], ["İletişim", "/tr/iletisim"]])],
    { layoutPreset: "1-centered", showNewsletter: false, showLocalBusinessCard: false, copyrightText: "© 2026 Örnek Şirket", bottomLinks: [{ label: "Gizlilik", href: "/tr/gizlilik" }] },
  )],
  ["footer-newsletter-split", "Bülten ağırlıklı iki bölüm", "Solda marka ve bülten formu, sağda iki bağlantı grubu.", "bulten", "foot-news", withColumns(
    [brand("fns_brand", 0), letter("fns_news", 0), nav("fns_product", "Ürün", 1, PRODUCT), nav("fns_company", "Şirket", 1, COMPANY)],
    { layoutPreset: "2-asymmetric", showNewsletter: false, showLocalBusinessCard: false, copyrightText: "© 2026 Örnek Şirket", bottomLinks: [{ label: "Gizlilik", href: "/tr/gizlilik" }, { label: "İletişim", href: "/tr/iletisim" }] },
  )],
  ["footer-trust-three", "Güven rozetleri + iletişim", "Üç sütun: güven rozetleri, bağlantılar ve iletişim kartı. E-ticaret ve hizmet siteleri için.", "kolon", "foot-columns", withColumns(
    [
      { id: "wdg_ftt_trust", type: "trust_badges", title: "Güvence", enabled: true, columnIndex: 0, settings: { badges: [{ icon: "shield", title: "Güvenli ödeme", subtitle: "256-bit şifreleme" }, { icon: "truck", title: "Hızlı teslimat", subtitle: "1–3 iş günü" }, { icon: "award", title: "Memnuniyet garantisi", subtitle: "14 gün iade" }] } },
      nav("ftt_links", "Müşteri hizmetleri", 1, [["Kargo ve teslimat", "/tr/kargo"], ["İade ve değişim", "/tr/iade"], ["Sık sorulanlar", "/tr/sikca-sorulan-sorular"], ["İletişim", "/tr/iletisim"]]),
      { id: "wdg_ftt_contact", type: "contact_card", title: "Bize ulaşın", enabled: true, columnIndex: 2, settings: { subtitle: "Siparişiniz için yardıma mı ihtiyacınız var?", phone: "+90 (212) 000 00 00", email: "destek@ornek.com", hours: "Hafta içi 09:00 – 18:00", ctaLabel: "Yazın", ctaHref: "/tr/iletisim", tone: "dark" } },
    ],
    { layoutPreset: "3-equal", showNewsletter: false, showLocalBusinessCard: false, copyrightText: "© 2026 Örnek Mağaza", bottomLinks: [{ label: "Mesafeli satış", href: "/tr/mesafeli-satis" }, { label: "KVKK", href: "/tr/kvkk" }] },
  )],
  ["footer-local-business", "Yerel işletme kartlı", "Dört eşit sütun ve işletme kartı (adres, telefon, çalışma saatleri). Şube ve ofis siteleri için.", "kolon", "foot-columns", withColumns(
    [nav("flb_services", "Hizmetler", 0, [["Danışmanlık", "/tr/danismanlik"], ["Kurulum", "/tr/kurulum"], ["Eğitim", "/tr/egitim"]]), nav("flb_company", "Kurumsal", 1, COMPANY), nav("flb_support", "Destek", 2, SUPPORT), { id: "wdg_flb_contact", type: "contact_card", title: "Merkez ofis", enabled: true, columnIndex: 3, settings: { subtitle: "Örnek Mah. Teknoloji Cad. No: 1, İstanbul", phone: "+90 (212) 000 00 00", email: "bilgi@ornek.com", hours: "Hafta içi 09:00 – 18:00", ctaLabel: "Yol tarifi", ctaHref: "/tr/iletisim", tone: "subtle" } }],
    { layoutPreset: "4-equal", showNewsletter: false, showLocalBusinessCard: true, copyrightText: "© 2026 Örnek Ofis", bottomLinks: [{ label: "Gizlilik", href: "/tr/gizlilik" }] },
  )],
];

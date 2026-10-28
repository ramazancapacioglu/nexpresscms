import { type FooterConfig, type HeaderConfig, type NavigationMenuItem } from "@nexpress/core";

export const defaultHeader: HeaderConfig = {
  topBar: {
    enabled: true,
    announcementText: "🚀 NexPress CMS v1.0 — 100/100 Lighthouse RSC & Agentic SEO Motoru Yayında!",
    contactPhone: "+90 (212) 555 01 99",
    contactEmail: "kurumsal@nexpress.dev",
    leftWidgets: ["announcement"],
    centerWidgets: [],
    rightWidgets: ["contact_info", "geo_selector"],
  },
  mainBar: {
    enabled: true,
    sticky: true,
    glassmorphism: true,
    leftWidgets: ["logo"],
    centerWidgets: ["mega_menu"],
    rightWidgets: ["search_bar", "cta_button"],
    ctaLabel: "Canlı Stüdyoyu Aç",
    ctaHref: "/admin",
  },
  bottomBar: {
    enabled: false,
    leftWidgets: ["category_drawer"],
    centerWidgets: ["campaign_links"],
    rightWidgets: [],
  },
};

export const defaultMenuItems: NavigationMenuItem[] = [
  {
    id: "nav_home",
    label: "Ana Sayfa",
    href: "/tr",
  },
  {
    id: "nav_solutions",
    label: "Çözümler & Ürünler",
    href: "/tr/nexpress-enterprise-cloud",
    megaMenu: {
      enabled: true,
      columns: 3,
      items: [
        {
          id: "mm_1",
          label: "NexPress Enterprise Cloud",
          description: "100/100 Lighthouse RSC ve @id Entity Graph destekli kurumsal CMS.",
          href: "/tr/nexpress-enterprise-cloud",
          badge: "Amiral Gemisi",
          featuredContentId: "cnt_product_cloud",
        },
        {
          id: "mm_2",
          label: "0-KB RSC Görsel Editör Rehberi",
          description: "Sürükle-bırak kanvas blokları nasıl sıfır istemci JS ile çalışır?",
          href: "/tr/0kb-rsc-gorsel-editor-mimarisi",
          badge: "Teknik KB",
        },
        {
          id: "mm_3",
          label: "Neden WordPress Yerine NexPress?",
          description: "SGE, AI Botları ve Core Web Vitals karşılaştırma analizi.",
          href: "/tr/neden-wordpress-yerine-nexpress-cms",
          badge: "Soru & Yanıt",
        },
      ],
      promoBanner: {
        title: "Bahar Kurumsal Göç Kampanyası",
        subtitle: "WordPress sitenizi 60 saniyede sıfır SEO kaybıyla NexPress'e taşıyın.",
        ctaText: "%30 İndirimi İncele",
        ctaHref: "/tr/bahar-kurumsal-goc-kampanyasi",
      },
    },
  },
  {
    id: "nav_kb",
    label: "Bilgi Bankası",
    href: "/tr/0kb-rsc-gorsel-editor-mimarisi",
  },
  {
    id: "nav_faq",
    label: "Soru Merkezi",
    href: "/tr/neden-wordpress-yerine-nexpress-cms",
  },
];

export const defaultFooter: FooterConfig = {
  columns: [
    {
      id: "fcol_1",
      title: "Platform",
      colSpan: 1,
      links: [
        { label: "Tema Mağazası", href: "/admin/themes", badge: "Yeni" },
        { label: "Görsel Editör Stüdyosu", href: "/admin/contents" },
        { label: "Header & Mega-Menü", href: "/admin/appearance/navigation" },
      ],
    },
    {
      id: "fcol_2",
      title: "Agentic Web & LLMO",
      colSpan: 1,
      links: [
        { label: "Canlı /llms.txt Beslemesi", href: "/llms.txt" },
        { label: "XML Sitemap İndeksi", href: "/sitemap.xml" },
        { label: "Saf Markdown (?format=md)", href: "/tr?format=md" },
      ],
    },
  ],
  showNewsletter: true,
  showLocalBusinessCard: true,
  copyrightText: "© 2026 NexPress CMS — Open-Core Dual-Engine Architecture.",
  bottomLinks: [
    { label: "Gizlilik Politikası", href: "/tr" },
    { label: "Kullanım Koşulları", href: "/tr" },
  ],
};

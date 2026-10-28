import type { FooterConfig, HeaderConfig, NavigationMenuItem } from "@nexpress/core";
import { INK_GRID_FOOTER, INK_GRID_MENU } from "./ink-grid";

export interface ChromeTemplate<T> {
  id: string;
  name: string;
  description: string;
  value: T;
}

const bareBar = {
  enabled: false,
  leftWidgets: [] as string[],
  centerWidgets: [] as string[],
  rightWidgets: [] as string[],
};

export const HEADER_TEMPLATES: ChromeTemplate<HeaderConfig>[] = [
  {
    id: "header-plain",
    name: "Sade şerit",
    description: "Logo, menü ve tek çağrı. Üst duyuru kapalı.",
    value: {
      topBar: { ...bareBar },
      mainBar: {
        enabled: true,
        sticky: true,
        glassmorphism: false,
        leftWidgets: ["logo"],
        centerWidgets: ["menu"],
        rightWidgets: ["cta"],
        ctaLabel: "Yönetim",
        ctaHref: "/admin",
      },
      bottomBar: { ...bareBar, links: [] },
    },
  },
  {
    id: "header-announce",
    name: "Duyuru şeridi",
    description: "Üstte duyuru ve telefon, altta yapışkan menü.",
    value: {
      topBar: {
        enabled: true,
        announcementText: "Yeni yerleşim stüdyosu yayında.",
        contactPhone: "+90 (212) 555 01 99",
        contactEmail: "merhaba@nexpress.dev",
        leftWidgets: ["announcement"],
        centerWidgets: [],
        rightWidgets: ["contact"],
      },
      mainBar: {
        enabled: true,
        sticky: true,
        glassmorphism: true,
        leftWidgets: ["logo"],
        centerWidgets: ["menu"],
        rightWidgets: ["cta"],
        ctaLabel: "Stüdyoyu aç",
        ctaHref: "/admin",
      },
      bottomBar: { ...bareBar, links: [] },
    },
  },
  {
    id: "header-vitrin",
    name: "Vitrin",
    description: "Ortalanmış menü, ince çerçeve ve demo çağrısı.",
    value: {
      topBar: { ...bareBar },
      mainBar: {
        enabled: true,
        sticky: true,
        glassmorphism: false,
        leftWidgets: ["logo"],
        centerWidgets: ["menu"],
        rightWidgets: ["cta"],
        ctaLabel: "Demo",
        ctaHref: "/tr/kurumsal",
      },
      bottomBar: { ...bareBar, links: [] },
    },
  },
  {
    id: "header-catalog",
    name: "Katalog şeridi",
    description: "Ana menünün altında ikinci bir bağlantı sırası.",
    value: {
      topBar: { ...bareBar },
      mainBar: {
        enabled: true,
        sticky: true,
        glassmorphism: false,
        leftWidgets: ["logo"],
        centerWidgets: ["menu"],
        rightWidgets: ["cta"],
        ctaLabel: "Kataloğu aç",
        ctaHref: "/tr/urun",
      },
      bottomBar: {
        enabled: true,
        leftWidgets: [],
        centerWidgets: ["links"],
        rightWidgets: [],
        links: [
          { id: "bb_urun", label: "Ürün", href: "/tr/urun" },
          { id: "bb_fiyat", label: "Fiyat", href: "/tr/fiyatlandirma" },
          { id: "bb_docs", label: "Doküman", href: "/tr/dokuman" },
        ],
      },
    },
  },
];

export const FOOTER_TEMPLATES: ChromeTemplate<FooterConfig>[] = [
  {
    id: "footer-vitrin",
    name: "Vitrin",
    description: "Kullanım, geliştirici ve stüdyo kolonları.",
    value: INK_GRID_FOOTER,
  },
  {
    id: "footer-corporate",
    name: "Kurumsal",
    description: "Platform ve yayın kolonları, telif satırı.",
    value: {
      columns: [
        {
          id: "f_platform",
          title: "Platform",
          colSpan: 1,
          links: [
            { label: "Tema mağazası", href: "/admin/themes" },
            { label: "Sayfalar", href: "/admin/pages" },
            { label: "Header", href: "/admin/appearance/header" },
          ],
        },
        {
          id: "f_publish",
          title: "Yayın",
          colSpan: 1,
          links: [
            { label: "/llms.txt", href: "/llms.txt" },
            { label: "Sitemap", href: "/sitemap.xml" },
            { label: "Markdown", href: "/tr?format=md" },
          ],
        },
      ],
      showNewsletter: false,
      showLocalBusinessCard: false,
      copyrightText: "© 2026 NexPress",
      bottomLinks: [
        { label: "Gizlilik", href: "/tr/dokuman" },
        { label: "İletişim", href: "/tr/kurumsal" },
      ],
    },
  },
  {
    id: "footer-plain",
    name: "Sade telif",
    description: "Tek satır telif ve iki alt bağlantı.",
    value: {
      columns: [],
      showNewsletter: false,
      showLocalBusinessCard: false,
      copyrightText: "© 2026 NexPress",
      bottomLinks: [
        { label: "Doküman", href: "/tr/dokuman" },
        { label: "Yönetim", href: "/admin" },
      ],
    },
  },
  {
    id: "footer-letter",
    name: "Bülten",
    description: "Üç kolon ve e-posta satırı.",
    value: {
      columns: [
        {
          id: "fl_1",
          title: "Ürün",
          colSpan: 1,
          links: [
            { label: "Vitrin", href: "/tr/vitrin" },
            { label: "Fiyat", href: "/tr/fiyatlandirma" },
          ],
        },
        {
          id: "fl_2",
          title: "Kurum",
          colSpan: 1,
          links: [
            { label: "Kurumsal", href: "/tr/kurumsal" },
            { label: "Örnekler", href: "/tr/ornek-calismalar" },
          ],
        },
      ],
      showNewsletter: true,
      showLocalBusinessCard: false,
      copyrightText: "© 2026 NexPress",
      bottomLinks: [{ label: "İletişim", href: "/tr/kurumsal" }],
    },
  },
];

export const MENU_TEMPLATES: ChromeTemplate<NavigationMenuItem[]>[] = [
  {
    id: "menu-vitrin",
    name: "Vitrin menüsü",
    description: "Ürün, neden, geliştirici, doküman ve örnekler.",
    value: INK_GRID_MENU.map((item) => ({ ...item, children: item.children ? [...item.children] : [] })),
  },
  {
    id: "menu-corporate",
    name: "Kurumsal menü",
    description: "Ana sayfa, ürün ve bilgi bankası. Alt bağlantılar sürüklenir.",
    value: [
      { id: "nav_home", label: "Ana Sayfa", href: "/tr", children: [] },
      {
        id: "nav_solutions",
        label: "Çözümler & Ürünler",
        href: "/tr/nexpress-enterprise-cloud",
        children: [
          { id: "mm_1", label: "NexPress Enterprise Cloud", href: "/tr/nexpress-enterprise-cloud" },
          { id: "mm_2", label: "0-KB RSC Görsel Editör Rehberi", href: "/tr/0kb-rsc-gorsel-editor-mimarisi" },
          { id: "mm_3", label: "Neden NexPress", href: "/tr/neden-wordpress-yerine-nexpress-cms" },
        ],
      },
      { id: "nav_kb", label: "Bilgi Bankası", href: "/tr/0kb-rsc-gorsel-editor-mimarisi", children: [] },
      { id: "nav_faq", label: "Soru Merkezi", href: "/tr/neden-wordpress-yerine-nexpress-cms", children: [] },
    ],
  },
];

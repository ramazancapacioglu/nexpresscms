import type { FooterConfig, HeaderConfig } from "@nexpress/core";
import { FOOTER_TEMPLATES, HEADER_TEMPLATES } from "./chrome-templates";

export type ChromeLibraryKind = "header" | "footer";

export type ChromePreview =
  | "bar-plain"
  | "bar-announce"
  | "bar-center"
  | "bar-catalog"
  | "foot-slim"
  | "foot-columns"
  | "foot-news";

export interface ChromeLibraryItem<T> {
  id: string;
  name: string;
  description: string;
  category: string;
  preview: ChromePreview;
  value: T;
}

const off = {
  enabled: false,
  leftWidgets: [] as string[],
  centerWidgets: [] as string[],
  rightWidgets: [] as string[],
};

function header(
  id: string,
  name: string,
  description: string,
  category: string,
  preview: ChromePreview,
  value: HeaderConfig
): ChromeLibraryItem<HeaderConfig> {
  return { id, name, description, category, preview, value };
}

function footer(
  id: string,
  name: string,
  description: string,
  category: string,
  preview: ChromePreview,
  value: FooterConfig
): ChromeLibraryItem<FooterConfig> {
  return { id, name, description, category, preview, value };
}

const previewForHeader = (id: string): ChromePreview => {
  if (id.includes("announce")) return "bar-announce";
  if (id.includes("catalog")) return "bar-catalog";
  if (id.includes("vitrin")) return "bar-center";
  return "bar-plain";
};

const previewForFooter = (id: string): ChromePreview => {
  if (id.includes("letter") || id.includes("news")) return "foot-news";
  if (id.includes("plain")) return "foot-slim";
  return "foot-columns";
};

const categoryForHeader = (id: string) => {
  if (id.includes("announce")) return "duyuru";
  if (id.includes("catalog")) return "katalog";
  if (id.includes("vitrin")) return "vitrin";
  return "sade";
};

const categoryForFooter = (id: string) => {
  if (id.includes("letter")) return "bulten";
  if (id.includes("plain")) return "sade";
  if (id.includes("vitrin")) return "vitrin";
  return "kolon";
};

export const HEADER_LIBRARY: ChromeLibraryItem<HeaderConfig>[] = [
  ...HEADER_TEMPLATES.map((item) =>
    header(item.id, item.name, item.description, categoryForHeader(item.id), previewForHeader(item.id), item.value)
  ),
  header("header-center", "Orta menü", "Logo solda, menü ortada, çağrı sağda. Üst şerit yok.", "vitrin", "bar-center", {
    topBar: { ...off },
    mainBar: {
      enabled: true,
      sticky: true,
      glassmorphism: false,
      leftWidgets: ["logo"],
      centerWidgets: ["menu"],
      rightWidgets: ["cta"],
      ctaLabel: "Başla",
      ctaHref: "/tr/dokuman",
    },
    bottomBar: { ...off, links: [] },
  }),
  header("header-glass", "Cam duyuru", "Kısa duyuru ve cam yüzeyli yapışkan şerit.", "duyuru", "bar-announce", {
    topBar: {
      enabled: true,
      announcementText: "Yerleşim kütüphanesi açıldı.",
      contactPhone: "",
      leftWidgets: ["announcement"],
      centerWidgets: [],
      rightWidgets: [],
    },
    mainBar: {
      enabled: true,
      sticky: true,
      glassmorphism: true,
      leftWidgets: ["logo"],
      centerWidgets: ["menu"],
      rightWidgets: ["cta"],
      ctaLabel: "Panele gir",
      ctaHref: "/admin",
    },
    bottomBar: { ...off, links: [] },
  }),
  header("header-docs", "Doküman şeridi", "Alt sırada doküman, fiyat ve örnekler.", "katalog", "bar-catalog", {
    topBar: { ...off },
    mainBar: {
      enabled: true,
      sticky: true,
      glassmorphism: false,
      leftWidgets: ["logo"],
      centerWidgets: ["menu"],
      rightWidgets: ["cta"],
      ctaLabel: "Doküman",
      ctaHref: "/tr/dokuman",
    },
    bottomBar: {
      enabled: true,
      leftWidgets: [],
      centerWidgets: ["links"],
      rightWidgets: [],
      links: [
        { id: "hd_docs", label: "Doküman", href: "/tr/dokuman" },
        { id: "hd_price", label: "Fiyat", href: "/tr/fiyatlandirma" },
        { id: "hd_cases", label: "Örnekler", href: "/tr/ornek-calismalar" },
      ],
    },
  }),
];

export const FOOTER_LIBRARY: ChromeLibraryItem<FooterConfig>[] = [
  ...FOOTER_TEMPLATES.map((item) =>
    footer(item.id, item.name, item.description, categoryForFooter(item.id), previewForFooter(item.id), item.value)
  ),
  footer("footer-four", "Dört kolon", "Ürün, geliştirici, kurum ve yasal bağlantılar.", "kolon", "foot-columns", {
    columns: [
      {
        id: "ff_product",
        title: "Ürün",
        colSpan: 1,
        links: [
          { label: "Vitrin", href: "/tr/vitrin" },
          { label: "Fiyat", href: "/tr/fiyatlandirma" },
        ],
      },
      {
        id: "ff_dev",
        title: "Geliştirici",
        colSpan: 1,
        links: [
          { label: "Doküman", href: "/tr/dokuman" },
          { label: "Başlangıç", href: "/tr/gelistiriciler" },
        ],
      },
      {
        id: "ff_co",
        title: "Kurum",
        colSpan: 1,
        links: [
          { label: "Kurumsal", href: "/tr/kurumsal" },
          { label: "Örnekler", href: "/tr/ornek-calismalar" },
        ],
      },
      {
        id: "ff_legal",
        title: "Yasal",
        colSpan: 1,
        links: [
          { label: "Gizlilik", href: "/tr/dokuman" },
          { label: "İletişim", href: "/tr/kurumsal" },
        ],
      },
    ],
    showNewsletter: false,
    showLocalBusinessCard: false,
    copyrightText: "© 2026 NexPress",
    bottomLinks: [],
  }),
  footer("footer-contact", "İletişim ağırlıklı", "Tek kolon ve bülten satırı.", "bulten", "foot-news", {
    columns: [
      {
        id: "fc_contact",
        title: "İletişim",
        colSpan: 1,
        links: [
          { label: "Kurumsal", href: "/tr/kurumsal" },
          { label: "Yönetim", href: "/admin" },
        ],
      },
    ],
    showNewsletter: true,
    showLocalBusinessCard: false,
    copyrightText: "© 2026 NexPress",
    bottomLinks: [{ label: "Doküman", href: "/tr/dokuman" }],
  }),
];

export const HEADER_LIBRARY_GROUPS = [
  { id: "all", label: "Tümü" },
  { id: "sade", label: "Sade" },
  { id: "duyuru", label: "Duyuru" },
  { id: "vitrin", label: "Vitrin" },
  { id: "katalog", label: "Katalog" },
];

export const FOOTER_LIBRARY_GROUPS = [
  { id: "all", label: "Tümü" },
  { id: "sade", label: "Sade" },
  { id: "kolon", label: "Kolon" },
  { id: "bulten", label: "Bülten" },
  { id: "vitrin", label: "Vitrin" },
];

export const CHROME_AI_DESIGN_PROMPT = `Sen bir NexPress yerleşim mimarısın. Header ve footer sayfa bloğu değildir. Açıklama yazmadan yalnızca geçerli JSON döndür.

Header istenirse:
{
  "kind": "header",
  "header": {
    "topBar": { "enabled": false, "announcementText": "", "contactPhone": "", "leftWidgets": [], "centerWidgets": [], "rightWidgets": [] },
    "mainBar": { "enabled": true, "sticky": true, "glassmorphism": false, "leftWidgets": ["logo"], "centerWidgets": ["menu"], "rightWidgets": ["cta"], "ctaLabel": "Demo", "ctaHref": "/tr/kurumsal" },
    "bottomBar": { "enabled": false, "leftWidgets": [], "centerWidgets": [], "rightWidgets": [], "links": [{ "id": "b1", "label": "Doküman", "href": "/tr/dokuman" }] }
  }
}

Footer istenirse:
{
  "kind": "footer",
  "footer": {
    "columns": [{ "id": "c1", "title": "Ürün", "colSpan": 1, "links": [{ "label": "Vitrin", "href": "/tr/vitrin" }] }],
    "showNewsletter": false,
    "showLocalBusinessCard": false,
    "copyrightText": "© 2026 NexPress",
    "bottomLinks": [{ "label": "İletişim", "href": "/tr/kurumsal" }]
  }
}

Kurallar:
- Menü ağacı bu JSON'da yoktur. Yalnızca header veya footer üret.
- id alanları benzersiz olsun. Adresler /tr veya /admin ile başlasın.
- topBar.enabled true ise announcementText dolu olsun.
- bottomBar.enabled true ise links en az iki öğe içersin.
- Kolon sayısı 0 ile 4 arasında kalsın.`;

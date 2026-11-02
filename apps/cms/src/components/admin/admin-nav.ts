import type { ComponentType } from "react";
import type { MessageKey } from "@nexpress/i18n";
import {
  LayoutGrid,
  Palette,
  FileText,
  Compass,
  Search,
  ArrowRightLeft,
  Blocks,
  SlidersHorizontal,
  PanelLeftClose,
  PanelLeftOpen,
  FolderTree,
  Image as ImageIcon,
  MessageSquare,
  Newspaper,
  Sparkles,
  ShoppingBag,
  Store,
  Settings as SettingsIcon,
  Users as UsersIcon,
  ScrollText,
  Inbox,
  Languages,
  Trash2,
  CalendarClock,
  Route,
  Activity,
  FormInput,
  Bell,
  Wand2,
  SearchCheck,
  Plug,
  LifeBuoy,
  Archive,
} from "lucide-react";

export interface NavItem {
  href: string;
  label: string;
  icon: ComponentType<{ className?: string; strokeWidth?: number }>;
  shortcut: string;
  count?: string;
  adminOnly?: boolean;
  /** false: kenar çubuğunda görünmez (üst sekme çubuğundan erişilir) ama komut paletinde ve izlerde kalır */
  sidebar?: boolean;
}

const ALL_SECTIONS: Array<{ label: string; items: NavItem[] }> = [
  {
    label: "Workspace",
    items: [
      {
        href: "/admin",
        label: "Genel Bakış & Metrikler",
        icon: LayoutGrid,
        shortcut: "G O",
      },
      {
        href: "/admin/plugins",
        label: "Eklentiler",
        icon: Blocks,
        count: "Modüller",
        shortcut: "G P",
      },
    ],
  },
  {
    label: "İçerik & Yayın",
    items: [
      {
        href: "/admin/pages",
        label: "Sayfalar",
        icon: FileText,
        count: "Hızlı/Toplu",
        shortcut: "G S",
      },
      {
        href: "/admin/posts",
        label: "Blog Yazıları",
        icon: Newspaper,
        count: "Hızlı/Toplu",
        shortcut: "G B",
      },
      {
        href: "/admin/contents",
        label: "Görsel Blok Stüdyosu",
        icon: Sparkles,
        count: "Editör",
        shortcut: "G C",
      },
      {
        href: "/admin/taxonomies",
        label: "Kategori Ağacı & Etiket",
        icon: FolderTree,
        count: "Ağaç",
        shortcut: "G X",
      },
      {
        href: "/admin/media",
        label: "Medya & Görsel SEO",
        icon: ImageIcon,
        count: "Alt/LCP",
        shortcut: "G I",
      },
      {
        href: "/admin/comments",
        label: "Yorum & İncelemeler",
        icon: MessageSquare,
        shortcut: "G R",
      },
      {
        href: "/admin/schedule",
        label: "Zamanlanmış yayınlar",
        icon: CalendarClock,
        count: "Takvim",
        shortcut: "G Z",
      },
      {
        href: "/admin/trash",
        label: "Çöp kutusu",
        icon: Trash2,
        count: "30 gün",
        shortcut: "G W",
      },
      {
        href: "/admin/translations",
        label: "Çeviriler",
        icon: Languages,
        count: "Diller",
        shortcut: "G L",
      },
      {
        href: "/admin/forms",
        label: "Formlar",
        icon: FormInput,
        count: "Gelen",
        shortcut: "G J",
      },
      {
        href: "/admin/requests",
        label: "Talepler",
        icon: Inbox,
        count: "Ajan",
        shortcut: "G T",
      },
      {
        href: "/admin/commerce",
        label: "E-Ticaret",
        icon: ShoppingBag,
        count: "Mağaza",
        shortcut: "G C",
      },
      {
        href: "/admin/commerce/marketplaces",
        label: "Pazar yerleri",
        icon: Store,
        count: "Kanal",
        shortcut: "G P",
      },
    ],
  },
  {
    label: "Tasarım & Motorlar",
    items: [
      {
        href: "/admin/design-library",
        label: "Tasarım Kütüphanesi",
        icon: Wand2,
        count: "AI",
        shortcut: "G 2",
      },
      {
        href: "/admin/themes",
        label: "Tema & Özelleştirici",
        icon: Palette,
        count: "Canlı",
        shortcut: "G T",
      },
      {
        href: "/admin/seo/audit",
        label: "SEO Denetimi",
        icon: SearchCheck,
        shortcut: "G G",
      },
      {
        href: "/admin/seo",
        label: "SEO",
        icon: Search,
        count: "Motor",
        shortcut: "G E",
      },
      {
        href: "/admin/appearance/header",
        label: "Header",
        icon: PanelLeftOpen,
        shortcut: "G H",
      },
      {
        href: "/admin/appearance/menus",
        label: "Menü",
        icon: Compass,
        shortcut: "G N",
      },
      {
        href: "/admin/appearance/footer",
        label: "Footer",
        icon: PanelLeftClose,
        shortcut: "G F",
      },
      {
        href: "/admin/appearance/sidebar",
        label: "Kenar çubuğu",
        icon: SlidersHorizontal,
        shortcut: "G S",
      },
      {
        href: "/admin/redirects",
        label: "Yönlendirmeler & 404",
        icon: Route,
        count: "301/302",
        shortcut: "G Y",
        adminOnly: true,
      },
      {
        href: "/admin/migration",
        label: "WordPress Göç Aracı",
        icon: ArrowRightLeft,
        shortcut: "G M",
      },
    ],
  },  {
    label: "Sistem",
    items: [
      {
        href: "/admin/settings",
        label: "Ayarlar",
        icon: SettingsIcon,
        shortcut: "G A",
        adminOnly: true,
      },
      {
        href: "/admin/users",
        label: "Kullanıcılar & Roller",
        icon: UsersIcon,
        shortcut: "G K",
        adminOnly: true,
      },
      {
        href: "/admin/backup",
        label: "Yedekleme",
        icon: Archive,
        shortcut: "G Q",
        adminOnly: true,
      },
      {
        href: "/admin/integrations",
        label: "Entegrasyonlar",
        icon: Plug,
        shortcut: "G 1",
        adminOnly: true,
      },
      {
        href: "/admin/help",
        label: "Yardım",
        icon: LifeBuoy,
        shortcut: "G 3",
      },
      {
        href: "/admin/notifications",
        label: "Bildirimler",
        icon: Bell,
        shortcut: "G U",
      },
      {
        href: "/admin/system",
        label: "Sistem durumu",
        icon: Activity,
        count: "Sağlık",
        shortcut: "G V",
        adminOnly: true,
      },
      {
        href: "/admin/audit",
        label: "Denetim Günlüğü",
        icon: ScrollText,
        shortcut: "G D",
        adminOnly: true,
      },
    ],
  },
];

/** Menü bağlantısı → katalog anahtarı (görünen metin panel diline göre çözülür). */
const ITEM_BY_HREF = new Map(ALL_SECTIONS.flatMap((s) => s.items).map((i) => [i.href, i]));
const pick = (hrefs: string[], overrides: Record<string, Partial<NavItem>> = {}): NavItem[] =>
  hrefs.map((h) => ({ ...ITEM_BY_HREF.get(h)!, ...overrides[h] }));

/** Panel menüsü: az grup, ilgili sayfalar tek çatıda. SEO ve Görünüm tek öğedir; alt sayfalar üstteki sekme çubuğundadır. */
export const WORKSPACE_SECTIONS: Array<{ label: string; items: NavItem[] }> = [
  { label: "Genel", items: pick(["/admin", "/admin/notifications"]) },
  { label: "İçerik", items: pick(["/admin/pages", "/admin/posts", "/admin/contents", "/admin/taxonomies", "/admin/media", "/admin/comments", "/admin/translations", "/admin/schedule", "/admin/trash"], { "/admin/contents": { label: "Yeni içerik (Stüdyo)", count: undefined } }) },
  { label: "Etkileşim & Satış", items: pick(["/admin/forms", "/admin/requests", "/admin/commerce", "/admin/commerce/marketplaces"]) },
  {
    label: "Görünüm",
    items: [
      ...pick(["/admin/themes"], { "/admin/themes": { label: "Tema & Görünüm", count: undefined } }),
      ...pick(["/admin/themes/packages", "/admin/appearance/menus", "/admin/appearance/header", "/admin/appearance/footer", "/admin/appearance/sidebar", "/admin/design-library"].filter((h) => ITEM_BY_HREF.has(h)), {}).map((i) => ({ ...i, sidebar: false })),
    ],
  },
  {
    label: "SEO",
    items: [
      ...pick(["/admin/seo"], { "/admin/seo": { label: "SEO Merkezi", count: undefined } }),
      ...pick(["/admin/seo/audit", "/admin/redirects"]).map((i) => ({ ...i, sidebar: false })),
    ],
  },
  { label: "Sistem", items: pick(["/admin/plugins", "/admin/settings", "/admin/users", "/admin/backup", "/admin/integrations", "/admin/migration", "/admin/system", "/admin/audit", "/admin/help"]) },
];

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
  "/admin/translations": "admin.nav.translations",
  "/admin/schedule": "admin.nav.schedule",
  "/admin/trash": "admin.nav.trash",
  "/admin/redirects": "admin.nav.redirects",
  "/admin/system": "admin.nav.system",
  "/admin/notifications": "admin.nav.notifications",
  "/admin/design-library": "admin.nav.designLibrary",
  "/admin/seo/audit": "admin.nav.seoAudit",
  "/admin/integrations": "admin.nav.integrations",
  "/admin/help": "admin.nav.help",
  "/admin/backup": "admin.nav.backup",
  "/admin/requests": "admin.nav.requests",
  "/admin/forms": "admin.nav.forms",
  "/admin/commerce": "admin.nav.commerce",
  "/admin/commerce/marketplaces": "admin.nav.marketplaces",
  // "/admin/themes" etiketi yeniden adlandırıldı (kategori anahtarı kullanılmaz)
  "__/admin/themes": "admin.nav.themes",
  // "/admin/seo" etiketi yeniden adlandırıldı (kategori anahtarı kullanılmaz)
  "__/admin/seo": "admin.nav.seo",
  "/admin/appearance/header": "admin.nav.header",
  "/admin/appearance/menus": "admin.nav.menus",
  "/admin/appearance/footer": "admin.nav.footer",
  "/admin/appearance/sidebar": "admin.nav.sidebar",
  "/admin/migration": "admin.nav.migration",
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
    title: "Pazar yerleri (/admin/commerce/marketplaces)",
    subtitle: "Trendyol, Hepsiburada, n11, Amazon ve Çiçeksepeti kanalları",
    href: "/admin/commerce/marketplaces",
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

import type { ComponentType } from "react";
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
  Gauge,
  FormInput,
  Bell,
  Wand2,
  SearchCheck,
  Plug,
  LifeBuoy,
  Archive,
  Megaphone,
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
        href: "/admin/marketplaces",
        label: "Sanal mağaza",
        icon: Store,
        count: "Kanal",
        shortcut: "G P",
      },
      {
        href: "/admin/campaigns",
        label: "Kampanyalar",
        icon: Megaphone,
        count: "Fırsatlar",
        shortcut: "G K",
      },
    ],
  },
  {
    label: "Tasarım & Motorlar",
    items: [
      {
        href: "/admin/studio",
        label: "Tasarım Stüdyosu",
        icon: Palette,
        count: "Merkez",
        shortcut: "G S",
      },
      {
        href: "/admin/appearance/templates",
        label: "Şablonlar & Modeller",
        icon: Sparkles,
        count: "Fabrika",
        shortcut: "G T",
      },
      {
        href: "/admin/design-library",
        label: "Tasarım Kütüphanesi",
        icon: Wand2,
        count: "AI",
        shortcut: "G 2",
      },
      {
        href: "/admin/themes",
        label: "Temalar",
        icon: Sparkles,
        count: "Galeri",
        shortcut: "G T",
      },
      {
        href: "/admin/themes/customize",
        label: "Tema Özelleştirici",
        icon: Palette,
        count: "Canlı",
        shortcut: "G O",
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
      { href: "/admin/seo/engine", label: "SEO motoru", icon: Search, shortcut: "G E" },
      { href: "/admin/seo/reports", label: "SEO raporları", icon: Activity, shortcut: "G R" },
      { href: "/admin/seo/settings", label: "SEO ayarları", icon: SettingsIcon, shortcut: "G A" },
      { href: "/admin/seo/integrations", label: "Webmaster", icon: Plug, shortcut: "G W" },
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
      {
        href: "/admin/wp-bridge",
        label: "WordPress Köprüsü",
        icon: Plug,
        shortcut: "G J",
        adminOnly: true,
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
        href: "/admin/perfornext",
        label: "Perfornext",
        icon: Gauge,
        count: "Hız",
        shortcut: "G 4",
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
  { label: "İçerik", items: pick(["/admin/pages", "/admin/posts", "/admin/contents", "/admin/taxonomies", "/admin/media", "/admin/comments", "/admin/translations", "/admin/schedule", "/admin/trash"], { "/admin/contents": { label: "İçerik editörü", count: undefined } }) },
  { label: "Etkileşim & Satış", items: pick(["/admin/campaigns", "/admin/forms", "/admin/requests", "/admin/commerce", "/admin/marketplaces"]) },
  {
    label: "Tasarım",
    items: [
      ...pick(
        ["/admin/themes", "/admin/themes/customize", "/admin/appearance/header", "/admin/appearance/menus", "/admin/appearance/templates", "/admin/studio"],
        {
          "/admin/themes": { label: "Temalar", count: undefined },
          "/admin/themes/customize": { label: "Özelleştirici", count: undefined },
          "/admin/appearance/header": { label: "Header & Footer", count: undefined },
          "/admin/appearance/menus": { label: "Menüler", count: undefined },
          "/admin/appearance/templates": { label: "Şablonlar", count: undefined },
          "/admin/studio": { label: "Kütüphane & AI", count: undefined },
        }
      ),
      ...pick(["/admin/appearance/footer", "/admin/appearance/sidebar", "/admin/design-library"]).map((i) => ({ ...i, sidebar: false })),
    ],
  },
  {
    label: "SEO",
    items: [
      ...pick(["/admin/seo"], { "/admin/seo": { label: "SEO Merkezi", count: undefined } }),
      ...pick(["/admin/seo/engine", "/admin/seo/reports", "/admin/seo/settings", "/admin/seo/integrations", "/admin/seo/audit", "/admin/redirects"]).map((i) => ({ ...i, sidebar: false })),
    ],
  },
  { label: "Sistem", items: pick(["/admin/plugins", "/admin/settings", "/admin/users", "/admin/backup", "/admin/integrations", "/admin/migration", "/admin/wp-bridge", "/admin/system", "/admin/perfornext", "/admin/audit", "/admin/help"]) },
];

export { NAV_LABEL_KEYS, SECTION_LABEL_KEYS, QUICK_COMMANDS } from "./admin-nav-meta";

